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

// Fetch pending workflow approvals for a specific role
export const fetchPendingApprovals = createAsyncThunk(
  'workflow/fetchPendingApprovals',
  async (role, { rejectWithValue }) => {
    try {
      console.debug('[workflowSlice] fetchPendingApprovals for role:', role);
      const data = await workflowApi.getPendingApprovals(role);
      return { role, approvals: data };
    } catch (err) {
      return rejectWithValue(err.message || err || 'Failed to fetch pending approvals');
    }
  }
);

// Request task completion (Employee → Manager)
export const requestTaskCompletion = createAsyncThunk(
  'workflow/requestTaskCompletion',
  async ({ taskId, projectId, reason }, { rejectWithValue }) => {
    try {
      console.debug('[workflowSlice] requestTaskCompletion:', { taskId, projectId, reason });
      const payload = {
        entityType: 'TASK',
        entityId: taskId,
        projectId,
        toState: 'COMPLETED',
        reason
      };
      const data = await workflowApi.requestTransition(payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.message || err || 'Failed to request task completion');
    }
  }
);

// Approve or reject a workflow request
export const approveWorkflow = createAsyncThunk(
  'workflow/approveWorkflow',
  async ({ requestId, action, reason }, { rejectWithValue }) => {
    try {
      console.debug('[workflowSlice] approveWorkflow:', { requestId, action, reason });
      const data = await workflowApi.approveRequest(requestId, action, reason);
      return data;
    } catch (err) {
      return rejectWithValue(err.message || err || 'Failed to process approval');
    }
  }
);

// Request project closure (Manager → Admin)
export const requestProjectClosure = createAsyncThunk(
  'workflow/requestProjectClosure',
  async (payload, { rejectWithValue }) => {
    try {
      console.debug('[workflowSlice] requestProjectClosure:', payload);
      const data = await workflowApi.requestProjectClosure(payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.message || err || 'Failed to request project closure');
    }
  }
);

const initialState = {
  pendingApprovals: [],
  readyToApprove: [],
  alreadyApproved: [],
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
    clearPendingApprovals(state) {
      state.pendingApprovals = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestTransition.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(requestTransition.fulfilled, (state, action) => {
        state.loading = false;
        state.lastRequest = action.payload;
      })
      .addCase(requestTransition.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchPendingApprovals.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPendingApprovals.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.approvals?.data || action.payload.approvals || {};
        state.readyToApprove = data.ready_to_approve || [];
        state.alreadyApproved = data.already_approved || [];
        // Keep backward compatibility with old flat array format
        state.pendingApprovals = [...(data.ready_to_approve || []), ...(data.already_approved || [])];
      })
      .addCase(fetchPendingApprovals.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(requestTaskCompletion.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(requestTaskCompletion.fulfilled, (state, action) => {
        state.loading = false;
        state.lastRequest = action.payload;
      })
      .addCase(requestTaskCompletion.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(approveWorkflow.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(approveWorkflow.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the approved/rejected item from pending approvals
        const requestId = action.meta.arg.requestId;
        state.pendingApprovals = state.pendingApprovals.filter(item => item.id !== requestId);
      })
      .addCase(approveWorkflow.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(requestProjectClosure.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(requestProjectClosure.fulfilled, (state, action) => {
        state.loading = false;
        state.lastRequest = action.payload;
      })
      .addCase(requestProjectClosure.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearWorkflow, clearPendingApprovals } = workflowSlice.actions;
export default workflowSlice.reducer;
