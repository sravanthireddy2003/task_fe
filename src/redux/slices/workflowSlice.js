import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import workflowApi from '../../api/workflowApi';

// Request a state transition for an entity (TASK / PROJECT)
export const requestTransition = createAsyncThunk(
  'workflow/requestTransition',
  async (payload, { rejectWithValue }) => {
    try {
      console.debug('[workflowSlice] requestTransition ->', payload);
      const data = await workflowApi.requestTransition(payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.message || err || 'Failed to request transition');
    }
  }
);

const initialState = {
  lastRequest: null,
  history: {},
  loading: false,
  error: null,
};

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    clearWorkflow(state) {
      state.lastRequest = null;
      state.history = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestTransition.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(requestTransition.fulfilled, (state, action) => {
        state.loading = false;
        state.lastRequest = action.payload;
      })
      .addCase(requestTransition.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearWorkflow } = workflowSlice.actions;
export default workflowSlice.reducer;
