import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Use fetchWithTenant consistent with project conventions
const fetchWithTenant = async (...args) => {
  const mod = await import('../../utils/fetchWithTenant');
  return mod.default(...args);
};

export const fetchProjects = createAsyncThunk('reports/fetchProjects', async (_, { rejectWithValue }) => {
  try {
    const resp = await fetchWithTenant('/api/projects?dropdown=1');
    // fetchWithTenant might return { success, data } or raw array
    const data = resp?.data ?? resp;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to fetch projects');
  }
});

export const generateProjectReport = createAsyncThunk(
  'reports/generateProjectReport',
  async ({ projectId, startDate, endDate }, { rejectWithValue }) => {
    try {
      // backend expects `projectId` (camelCase) containing the project's id/public_id string
      const body = { projectId: projectId, startDate, endDate };
      const resp = await fetchWithTenant('/api/reports/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      // follow Postman/mock response shape: { success: true, data: { project, summary, tasks } }
      if (resp && resp.success === false) {
        return rejectWithValue(resp.message || 'Failed to generate report');
      }
      const data = resp?.data ?? resp;
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to generate report');
    }
  }
);

export const fetchDebugProject = createAsyncThunk(
  'reports/fetchDebugProject',
  async (projectId, { rejectWithValue }) => {
    try {
      const path = `/api/reports/debug-project?projectId=${encodeURIComponent(projectId)}`;
      const resp = await fetchWithTenant(path);
      const data = resp?.data ?? resp;
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch debug project');
    }
  }
);

const initialState = {
  projects: [],
  report: null,
  loading: false,
  error: null,
};

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearReport(state) {
      state.report = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(generateProjectReport.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.report = null;
      })
      .addCase(generateProjectReport.fulfilled, (state, action) => {
        state.loading = false;
        state.report = action.payload;
      })
      .addCase(generateProjectReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        state.report = null;
      })
      .addCase(fetchDebugProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDebugProject.fulfilled, (state, action) => {
        state.loading = false;
        // store debug response in report for now
        state.report = action.payload;
      })
      .addCase(fetchDebugProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  }
});

export const { clearReport } = reportsSlice.actions;
export default reportsSlice.reducer;
