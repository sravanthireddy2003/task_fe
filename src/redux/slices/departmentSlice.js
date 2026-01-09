import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { httpGetService, httpPostService, httpPutService, httpDeleteService } from '../../App/httpHandler';
import { fetchNotifications } from './notificationSlice';

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

// ✅ FIXED: Proper error handling in ALL thunks
export const fetchDepartments = createAsyncThunk(
  'departments/fetch',
  async (params = {}, { rejectWithValue }) => {
    try {
      const userId = params.userId ? `?userId=${params.userId}` : '';
      const res = await httpGetService(`api/admin/departments${userId}`);
      return Array.isArray(res) ? res : res?.data || res?.departments || [];
    } catch (err) {
      return rejectWithValue(formatRejectValue(err));
    }
  }
);

export const createDepartment = createAsyncThunk(
  'departments/create',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await httpPostService('api/admin/departments', payload);
      // ✅ Safe notification refresh
      setTimeout(() => dispatch(fetchNotifications()), 500);
      return res?.data || res || {};
    } catch (err) {
      return rejectWithValue(formatRejectValue(err));
    }
  }
);

export const updateDepartment = createAsyncThunk(
  'departments/update',
  async ({ departmentId, data }, { dispatch, rejectWithValue }) => {
    try {
      const res = await httpPutService(`api/admin/departments/${departmentId}`, data);
      setTimeout(() => dispatch(fetchNotifications()), 500);
      return res?.data || res || {};
    } catch (err) {
      return rejectWithValue(formatRejectValue(err));
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  'departments/delete',
  async (departmentId, { dispatch, rejectWithValue }) => {
    try {
      const res = await httpDeleteService(`api/admin/departments/${departmentId}`);
      setTimeout(() => dispatch(fetchNotifications()), 500);
      return { id: departmentId, ...((res && typeof res === 'object') ? res : {}) };
    } catch (err) {
      return rejectWithValue(formatRejectValue(err));
    }
  }
);

const initialState = {
  departments: [],
  status: null,
  error: null,
};

const departmentSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchDepartments.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.departments = action.payload || [];
        state.error = null;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message || 'Fetch failed';
      })

      // Create  
      .addCase(createDepartment.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        if (action.payload) {
          state.departments.unshift(action.payload);
        }
      })
      .addCase(createDepartment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Create failed';
      })

      // Update
      .addCase(updateDepartment.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        const updated = action.payload;
        const id = updated._id || updated.id;
        if (id) {
          state.departments = state.departments.map((d) => 
            d._id === id || d.id === id ? { ...d, ...updated } : d
          );
        }
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Update failed';
      })

      // Delete
      .addCase(deleteDepartment.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        const id = action.payload?.id || action.meta.arg;
        state.departments = state.departments.filter((d) => 
          d._id !== id && d.id !== id && d.public_id !== id
        );
      })
      .addCase(deleteDepartment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Delete failed';
      });
  },
});

export const { clearError } = departmentSlice.actions;
export const selectDepartments = (state) => state.departments.departments || [];
export const selectDepartmentStatus = (state) => state.departments.status;
export const selectDepartmentError = (state) => state.departments.error;

export default departmentSlice.reducer;
