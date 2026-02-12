import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { httpGetService, httpPostService, httpPutService, httpDeleteService } from '../../App/httpHandler';
import { fetchNotifications } from './notificationSlice';

// Helper to normalize errors
const formatRejectValue = (err) => {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err?.message) return err.message;
  try {
    return JSON.stringify(err);
  } catch (e) {
    return String(err);
  }
};

// Thunks
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (params = {}, thunkAPI) => {
    try {
      const res = await httpGetService('api/projects');
      // API returns { success: true, data: [...] }
      return res?.success && Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const fetchManagerProjects = createAsyncThunk(
  'projects/fetchManagerProjects',
  async (_, thunkAPI) => {
    try {
      const res = await httpGetService('api/manager/projects');
      // API returns { success: true, data: [...] }
      return res?.success && Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const getProject = createAsyncThunk(
  'projects/getProject',
  async (projectId, thunkAPI) => {
    try {
      const res = await httpGetService(`api/projects/${projectId}`);
      // API returns { success: true, data: {...} }
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (payload, thunkAPI) => {
    try {
      const res = await httpPostService('api/projects', payload);
      // ✅ NEW: Refresh notifications after successful project creation
      await new Promise(resolve => setTimeout(resolve, 500));
      thunkAPI.dispatch(fetchNotifications());
      // API returns { success: true, message: "...", data: {...} }
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ projectId, data }, thunkAPI) => {
    try {
      const res = await httpPutService(`api/projects/${projectId}`, data);
      // ✅ NEW: Refresh notifications after successful project update
      await new Promise(resolve => setTimeout(resolve, 500));
      thunkAPI.dispatch(fetchNotifications());
      // API returns { success: true, message: "...", data: {...} }
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (projectId, thunkAPI) => {
    try {
      const res = await httpDeleteService(`api/projects/${projectId}`);
      // ✅ NEW: Refresh notifications after successful project deletion
      await new Promise(resolve => setTimeout(resolve, 500));
      thunkAPI.dispatch(fetchNotifications());
      // API returns { success: true, message: "..." }
      return { id: projectId, success: res?.success, message: res?.message };
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const addDepartmentToProject = createAsyncThunk(
  'projects/addDepartment',
  async ({ projectId, departmentIds }, thunkAPI) => {
    try {
      const res = await httpPostService(`api/projects/${projectId}/departments`, { department_ids: departmentIds });
      // API returns { success: true, message: "...", data: {...} }
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const removeDepartmentFromProject = createAsyncThunk(
  'projects/removeDepartment',
  async ({ projectId, departmentId }, thunkAPI) => {
    try {
      const res = await httpDeleteService(`api/projects/${projectId}/departments/${departmentId}`);
      // API returns { success: true, message: "..." }
      return { projectId, departmentId, success: res?.success, message: res?.message };
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const getProjectsStats = createAsyncThunk(
  'projects/getProjectsStats',
  async (params = {}, thunkAPI) => {
    try {
      const res = await httpGetService('api/projects/stats');
      // API returns { success: true, data: {...} }
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const getProjectSummary = createAsyncThunk(
  'projects/getProjectSummary',
  async (projectId, thunkAPI) => {
    try {
      const res = await httpGetService(`api/projects/${projectId}/summary`);
      // API returns { success: true, data: {...} }
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

const initialState = {
  projects: [],
  currentProject: null,
  stats: null,
  summary: null,
  status: null,
  error: null,
};

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Projects
      .addCase(fetchProjects.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.projects = action.payload || [];
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      // Fetch Manager Projects
      .addCase(fetchManagerProjects.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchManagerProjects.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.projects = action.payload || [];
      })
      .addCase(fetchManagerProjects.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      // Get Project
      .addCase(getProject.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getProject.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentProject = action.payload;
        // Also upsert into projects array
        const idx = state.projects.findIndex(
          (p) => (p.id || p._id) === (action.payload.id || action.payload._id)
        );
        if (idx >= 0) {
          state.projects[idx] = { ...state.projects[idx], ...action.payload };
        } else {
          state.projects.push(action.payload);
        }
      })
      .addCase(getProject.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      // Create Project
      .addCase(createProject.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload) {
          state.projects.unshift(action.payload);
        }
      })
      .addCase(createProject.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      // Update Project
      .addCase(updateProject.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const updated = action.payload;
        const idx = state.projects.findIndex((p) => (p.id || p._id) === (updated.id || updated._id));
        if (idx >= 0) {
          state.projects[idx] = { ...state.projects[idx], ...updated };
        }
        if (state.currentProject?.id === updated.id || state.currentProject?._id === updated._id) {
          state.currentProject = { ...state.currentProject, ...updated };
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      // Delete Project
      .addCase(deleteProject.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const id = action.payload?.id;
        if (id) {
          state.projects = state.projects.filter((p) => (p.id || p._id) !== id);
          if ((state.currentProject?.id || state.currentProject?._id) === id) {
            state.currentProject = null;
          }
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      // Add Department to Project
      .addCase(addDepartmentToProject.fulfilled, (state, action) => {
        state.status = 'succeeded';
      })
      .addCase(addDepartmentToProject.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      // Remove Department from Project
      .addCase(removeDepartmentFromProject.fulfilled, (state, action) => {
        state.status = 'succeeded';
      })
      .addCase(removeDepartmentFromProject.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      // Get Projects Stats
      .addCase(getProjectsStats.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getProjectsStats.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.stats = action.payload;
      })
      .addCase(getProjectsStats.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      // Get Project Summary
      .addCase(getProjectSummary.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getProjectSummary.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.summary = action.payload;
      })
      .addCase(getProjectSummary.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      });
  },
});

export const selectProjects = (state) => state.projects.projects || [];
export const selectProjectStatus = (state) => state.projects.status;
export const selectProjectError = (state) => state.projects.error;
export const selectCurrentProject = (state) => state.projects.currentProject;
export const selectProjectStats = (state) => state.projects.stats;
export const selectProjectSummary = (state) => state.projects.summary;

export const { setCurrentProject, clearCurrentProject } = projectSlice.actions;

export default projectSlice.reducer;
