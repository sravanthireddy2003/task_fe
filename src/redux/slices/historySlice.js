import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import workflowApi from '../../api/workflowApi';

// Fetch full workflow history timeline for a workflow instance
export const fetchHistoryByInstance = createAsyncThunk(
  'history/fetchByInstance',
  async ({ entityType, entityId }, { rejectWithValue }) => {
    if (!entityType || !entityId) return rejectWithValue('Missing entity type or id');
    try {
      const resp = await workflowApi.getHistory({ entityType, entityId });
      // Response format: { success: true, data: [...] }
      const data = resp?.data ?? resp ?? [];
      return { entityType, entityId, items: Array.isArray(data) ? data : data.items || [] };
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to fetch workflow history');
    }
  }
);

const initialState = {
  itemsByKey: {},
  loadingByKey: {},
  errorByKey: {},
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    clearHistory(state) {
      state.itemsByKey = {};
      state.loadingByKey = {};
      state.errorByKey = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistoryByInstance.pending, (state, action) => {
        const { entityType, entityId } = action.meta.arg || {};
        const key = `${entityType}_${entityId}`;
        state.loadingByKey[key] = true;
        state.errorByKey[key] = null;
      })
      .addCase(fetchHistoryByInstance.fulfilled, (state, action) => {
        const { entityType, entityId, items } = action.payload || {};
        const key = `${entityType}_${entityId}`;
        state.loadingByKey[key] = false;
        state.itemsByKey[key] = items || [];
      })
      .addCase(fetchHistoryByInstance.rejected, (state, action) => {
        const { entityType, entityId } = action.meta.arg || {};
        const key = `${entityType}_${entityId}`;
        state.loadingByKey[key] = false;
        state.errorByKey[key] = action.payload || action.error?.message || 'Failed to fetch history';
      });
  },
});

export const { clearHistory } = historySlice.actions;

// Selector helpers
export const selectHistoryItems = (state, entityType, entityId) => {
  const key = `${entityType}_${entityId}`;
  return state.history?.itemsByKey?.[key] || [];
};

export const selectHistoryLoading = (state, entityType, entityId) => {
  const key = `${entityType}_${entityId}`;
  return !!state.history?.loadingByKey?.[key];
};

export const selectHistoryError = (state, entityType, entityId) => {
  const key = `${entityType}_${entityId}`;
  return state.history?.errorByKey?.[key] || null;
};

export default historySlice.reducer;
