import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { httpGetService, httpPostService } from '../../App/httpHandler';

export const fetchTemplates = createAsyncThunk('workflow/fetchTemplates', async (_, { rejectWithValue }) => {
  try {
    console.debug('[workflowSlice] fetchTemplates -> calling httpGetService');
    const resp = await httpGetService('api/admin/workflows/templates');
    // backend returns { success: true, data: [...] }
    const raw = Array.isArray(resp) ? resp : resp?.data ?? resp;
    const list = Array.isArray(raw) ? raw : [];
    // normalize templates into expected UI shape
    const mapped = list.map((t) => ({
      id: t.id ?? t._id ?? t.template_id ?? null,
      tenant_id: t.tenant_id ?? t.tenantId ?? null,
      name: t.name || t.title || 'Untitled',
      trigger_event: t.trigger_event || t.triggerEvent || null,
      active: t.active === 1 || t.active === true || t.isActive === true,
      created_by: t.created_by ?? t.createdBy ?? null,
      created_at: t.created_at ?? t.createdAt ?? null,
      department_id: t.department_id ?? t.departmentId ?? null,
      department_name: t.department_name ?? t.departmentName ?? null,
      project_id: t.project_id ?? t.projectId ?? null,
      project_name: t.project_name ?? t.projectName ?? null,
      // steps may be provided separately; default to empty array
      steps: Array.isArray(t.steps) ? t.steps : [],
      // keep original payload for debug/extension
      _raw: t,
    }));

    return mapped;
  } catch (err) {
    return rejectWithValue(err.message || err || 'Failed to load templates');
  }
});

export const createTemplate = createAsyncThunk('workflow/createTemplate', async (payload, { rejectWithValue }) => {
  try {
    console.debug('[workflowSlice] createTemplate ->', payload);
    const resp = await httpPostService('api/admin/workflows/templates', payload);
    return resp?.data ?? resp;
  } catch (err) {
    return rejectWithValue(err.message || err || 'Failed to create template');
  }
});

export const addStep = createAsyncThunk('workflow/addStep', async (payload, { rejectWithValue }) => {
  try {
    console.debug('[workflowSlice] addStep ->', payload);
    const resp = await httpPostService('api/admin/workflows/steps', payload);
    return resp?.data ?? resp;
  } catch (err) {
    return rejectWithValue(err.message || err || 'Failed to add step');
  }
});

export const triggerWorkflow = createAsyncThunk('workflow/triggerWorkflow', async (payload, { rejectWithValue }) => {
  try {
    console.debug('[workflowSlice] triggerWorkflow ->', payload);
    const resp = await httpPostService('api/workflow/trigger', payload, {});
    return resp?.data ?? resp;
  } catch (err) {
    return rejectWithValue(err.message || err || 'Failed to trigger workflow');
  }
});

export const getHistory = createAsyncThunk('workflow/getHistory', async (instanceId, { rejectWithValue }) => {
  try {
    console.debug('[workflowSlice] getHistory ->', instanceId);
    const resp = await httpGetService(`api/workflow/${instanceId}/history`);
    return resp?.data ?? resp;
  } catch (err) {
    return rejectWithValue(err.message || err || 'Failed to fetch history');
  }
});

// Reorder steps for a template - best-effort endpoint (not present in Postman by default)
export const reorderSteps = createAsyncThunk(
  'workflow/reorderSteps',
  async ({ template_id, steps }, { rejectWithValue }) => {
    try {
      console.debug('[workflowSlice] reorderSteps ->', { template_id, stepsLength: (steps||[]).length });
      // backend may expose a reorder endpoint; try a conventional path
      const resp = await httpPostService('api/admin/workflows/steps/reorder', { template_id, steps });
      return resp?.data ?? resp;
    } catch (err) {
      return rejectWithValue(err.message || err || 'Failed to reorder steps');
    }
  }
);

const initialState = {
  templates: [],
  instances: [],
  history: {},
  loading: false,
  error: null,
};

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    clearWorkflow(state) {
      state.templates = [];
      state.instances = [];
      state.history = {};
      state.error = null;
    },
    updateTemplateSteps(state, action) {
      const { template_id, steps } = action.payload || {};
      if (!template_id) return;
      const idx = state.templates.findIndex(t => (t.id || t._id) === template_id);
      if (idx >= 0) {
        state.templates[idx] = { ...state.templates[idx], steps };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTemplates.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTemplates.fulfilled, (state, action) => { state.loading = false; state.templates = action.payload; })
      .addCase(fetchTemplates.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createTemplate.pending, (state) => { state.loading = true; })
      .addCase(createTemplate.fulfilled, (state, action) => { state.loading = false; state.templates.unshift(action.payload); })
      .addCase(createTemplate.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(addStep.pending, (state) => { state.loading = true; })
      .addCase(addStep.fulfilled, (state) => { state.loading = false; })
      .addCase(addStep.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(triggerWorkflow.pending, (state) => { state.loading = true; })
      .addCase(triggerWorkflow.fulfilled, (state, action) => { state.loading = false; state.instances.unshift(action.payload); })
      .addCase(triggerWorkflow.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(getHistory.pending, (state) => { state.loading = true; })
      .addCase(getHistory.fulfilled, (state, action) => { state.loading = false; state.history[action.meta.arg] = action.payload; })
      .addCase(getHistory.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearWorkflow, updateTemplateSteps } = workflowSlice.actions;
export default workflowSlice.reducer;
