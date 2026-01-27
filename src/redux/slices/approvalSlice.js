import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { httpGetService, httpPostService } from '../../App/httpHandler';

export const fetchQueue = createAsyncThunk('approval/fetchQueue', async (_, { rejectWithValue }) => {
  try {
    console.debug('[approvalSlice] fetchQueue -> calling httpGetService');
    const resp = await httpGetService('api/manager/workflows/queue');
    return Array.isArray(resp) ? resp : resp?.data ?? resp;
  } catch (err) {
    return rejectWithValue(err.message || err || 'Failed to fetch queue');
  }
});

export const approveInstance = createAsyncThunk('approval/approveInstance', async ({ instanceId, body }, { rejectWithValue }) => {
  try {
    console.debug('[approvalSlice] approveInstance ->', instanceId, body);
    const resp = await httpPostService(`api/manager/workflows/${instanceId}/approve`, body || {});
    return { instanceId, data: resp?.data ?? resp };
  } catch (err) {
    return rejectWithValue(err.message || err || 'Approve failed');
  }
});

export const rejectInstance = createAsyncThunk('approval/rejectInstance', async ({ instanceId, body }, { rejectWithValue }) => {
  try {
    console.debug('[approvalSlice] rejectInstance ->', instanceId, body);
    const resp = await httpPostService(`api/manager/workflows/${instanceId}/reject`, body || {});
    return { instanceId, data: resp?.data ?? resp };
  } catch (err) {
    return rejectWithValue(err.message || err || 'Reject failed');
  }
});

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
        state.queue = state.queue.filter(i => (i.id || i._id || i.instanceId) !== action.payload.instanceId);
      })
      .addCase(approveInstance.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(rejectInstance.pending, (state) => { state.loading = true; })
      .addCase(rejectInstance.fulfilled, (state, action) => {
        state.loading = false;
        state.queue = state.queue.filter(i => (i.id || i._id || i.instanceId) !== action.payload.instanceId);
      })
      .addCase(rejectInstance.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  }
});

export const { clearQueue } = approvalSlice.actions;
export default approvalSlice.reducer;
