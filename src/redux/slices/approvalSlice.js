import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import workflowApi from '../../api/workflowApi';

// Load pending workflow approval requests for MANAGER role
export const fetchQueue = createAsyncThunk('approval/fetchQueue', async (_, { rejectWithValue }) => {
  try {
    console.debug('[approvalSlice] fetchQueue -> workflowApi.getPending(MANAGER)');
    const resp = await workflowApi.getPending('MANAGER');
    // Response format: { success: true, data: [...] }
    const list = Array.isArray(resp) ? resp : resp?.data ?? [];
    return Array.isArray(list) ? list : [];
  } catch (err) {
    return rejectWithValue(err.message || err || 'Failed to fetch queue');
  }
});

// Approve a pending workflow request
export const approveInstance = createAsyncThunk(
  'approval/approveInstance',
  async ({ requestId, reason }, { rejectWithValue }) => {
    try {
      console.debug('[approvalSlice] approveInstance ->', { requestId, reason });
      const data = await workflowApi.approveOrReject({ requestId, approved: true, reason });
      // refresh queue after approving
      try { await thunkAPI.dispatch(fetchQueue()).unwrap(); } catch (e) { console.debug('fetchQueue refresh after approve failed', e); }
      return { requestId, data };
    } catch (err) {
      return rejectWithValue(err.message || err || 'Approve failed');
    }
  }
);

// Reject a pending workflow request
export const rejectInstance = createAsyncThunk(
  'approval/rejectInstance',
  async ({ requestId, reason }, { rejectWithValue }) => {
    try {
      console.debug('[approvalSlice] rejectInstance ->', { requestId, reason });
      const data = await workflowApi.approveOrReject({ requestId, approved: false, reason });
      // refresh queue after rejecting
      try { await thunkAPI.dispatch(fetchQueue()).unwrap(); } catch (e) { console.debug('fetchQueue refresh after reject failed', e); }
      return { requestId, data };
    } catch (err) {
      return rejectWithValue(err.message || err || 'Reject failed');
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
