import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import workflowApi from '../../api/workflowApi';

// Load pending workflow approval requests for MANAGER role or specific manager ID
export const fetchQueue = createAsyncThunk(
  'approval/fetchQueue',
  async (roleOrManagerId = 'MANAGER', { rejectWithValue }) => {
    try {
      const resp = await workflowApi.getPending(roleOrManagerId);
      // Response format: { success: true, data: { ready_to_approve: [...], already_approved: [...] } }
      // Or legacy format: [...]
      let list;
      if (Array.isArray(resp)) {
        list = resp;
      } else if (resp?.ready_to_approve) {
        // New API format with ready_to_approve and already_approved
        list = resp.ready_to_approve || [];
      } else {
        list = resp?.data ?? [];
      }
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return rejectWithValue(err.message || err || 'Failed to fetch queue');
    }
  }
);

// Approve a pending workflow request
export const approveInstance = createAsyncThunk(
  'approval/approveInstance',
  async ({ requestId, reason, role, managerId }, thunkAPI) => {
    try {
      const data = await workflowApi.approveOrReject({ requestId, action: 'APPROVE', reason });
      // refresh queue after approving (use managerId if provided, otherwise role, default to MANAGER)
      const queueParam = managerId || role || 'MANAGER';
      try { await thunkAPI.dispatch(fetchQueue(queueParam)).unwrap(); } catch (e) { }
      return { requestId, data };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || err || 'Approve failed');
    }
  }
);

// Reject a pending workflow request
export const rejectInstance = createAsyncThunk(
  'approval/rejectInstance',
  async ({ requestId, reason, role, managerId }, thunkAPI) => {
    try {
      const data = await workflowApi.approveOrReject({ requestId, action: 'REJECT', reason });
      // refresh queue after rejecting (use managerId if provided, otherwise role, default to MANAGER)
      const queueParam = managerId || role || 'MANAGER';
      try { await thunkAPI.dispatch(fetchQueue(queueParam)).unwrap(); } catch (e) { }
      return { requestId, data };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || err || 'Reject failed');
    }
  }
);

const initialState = {
  queue: [],
  loading: false,
  error: null,
};

const approvalSlice = createSlice({
  name: 'approval',
  initialState,
  reducers: {
    clearQueue(state) { state.queue = []; state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQueue.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchQueue.fulfilled, (state, action) => { state.loading = false; state.queue = action.payload; })
      .addCase(fetchQueue.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(approveInstance.pending, (state) => { state.loading = true; })
      .addCase(approveInstance.fulfilled, (state, action) => {
        state.loading = false;
        state.queue = state.queue.filter(i => (i.id || i._id || i.requestId) !== action.payload.requestId);
      })
      .addCase(approveInstance.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(rejectInstance.pending, (state) => { state.loading = true; })
      .addCase(rejectInstance.fulfilled, (state, action) => {
        state.loading = false;
        state.queue = state.queue.filter(i => (i.id || i._id || i.requestId) !== action.payload.requestId);
      })
      .addCase(rejectInstance.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  }
});

export const { clearQueue } = approvalSlice.actions;
export default approvalSlice.reducer;
