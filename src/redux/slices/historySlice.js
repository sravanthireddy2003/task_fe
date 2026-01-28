import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import workflowApi from '../../api/workflowApi';

// Fetch full workflow history timeline for a workflow instance
export const fetchHistoryByInstance = createAsyncThunk(
  'history/fetchByInstance',
  async (instanceId, { rejectWithValue }) => {
    if (!instanceId) return rejectWithValue('Missing entity id');
    try {
      const resp = await workflowApi.getHistory({ entityType: 'TASK', entityId: instanceId });
      // Response format: { success: true, data: [...] }
      const data = resp?.data ?? resp ?? [];
      return { instanceId, items: Array.isArray(data) ? data : data.items || [] };
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to fetch workflow history');
    }
  }
);

const initialState = {
  itemsByInstanceId: {},
  loadingByInstanceId: {},
  errorByInstanceId: {},
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    clearHistory(state) {
      state.itemsByInstanceId = {};
      state.loadingByInstanceId = {};
      state.errorByInstanceId = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistoryByInstance.pending, (state, action) => {
        const id = action.meta.arg;
        state.loadingByInstanceId[id] = true;
        state.errorByInstanceId[id] = null;
      })
      .addCase(fetchHistoryByInstance.fulfilled, (state, action) => {
        const { instanceId, items } = action.payload || {};
        if (!instanceId) return;
        state.loadingByInstanceId[instanceId] = false;
        state.itemsByInstanceId[instanceId] = items || [];
      })
      .addCase(fetchHistoryByInstance.rejected, (state, action) => {
        const id = action.meta.arg;
        state.loadingByInstanceId[id] = false;
        state.errorByInstanceId[id] = action.payload || action.error?.message || 'Failed to fetch history';
      });
  },
});

export const { clearHistory } = historySlice.actions;

// Selector helpers
export const selectHistoryItems = (state, instanceId) =>
  state.history?.itemsByInstanceId?.[instanceId] || [];

export const selectHistoryLoading = (state, instanceId) =>
  !!state.history?.loadingByInstanceId?.[instanceId];

export const selectHistoryError = (state, instanceId) =>
  state.history?.errorByInstanceId?.[instanceId] || null;

export default historySlice.reducer;
