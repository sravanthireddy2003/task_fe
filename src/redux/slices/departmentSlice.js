import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { httpGetService, httpPostService, httpPutService, httpDeleteService } from '../../App/httpHandler';
import { fetchNotifications } from './notificationSlice';

// Helper to normalize errors into a string for thunk rejection payloads
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
export const fetchDepartments = createAsyncThunk(
  'departments/fetch',
  async (params = {}, thunkAPI) => {
    try {
      // support optional query param object -> query string handled by caller if needed
      const userId = params.userId ? `?userId=${params.userId}` : '';
      const res = await httpGetService(`api/admin/departments${userId}`);
      return Array.isArray(res) ? res : res?.data || res?.departments || [];
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const createDepartment = createAsyncThunk(
  'departments/create',
  async (payload, thunkAPI) => {
    try {
      const res = await httpPostService('api/admin/departments', payload);
      // ✅ NEW: Refresh notifications after successful department creation
      await new Promise(resolve => setTimeout(resolve, 500));
      thunkAPI.dispatch(fetchNotifications());
      // backend may return created object as data or department
      return res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const updateDepartment = createAsyncThunk(
  'departments/update',
  async ({ departmentId, data }, thunkAPI) => {
    try {
      const res = await httpPutService(`api/admin/departments/${departmentId}`, data);
      // ✅ NEW: Refresh notifications after successful department update
      await new Promise(resolve => setTimeout(resolve, 500));
      thunkAPI.dispatch(fetchNotifications());
      return res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  'departments/delete',
  async (departmentId, thunkAPI) => {
    try {
      const res = await httpDeleteService(`api/admin/departments/${departmentId}`);
      return { id: departmentId, ...((res && typeof res === 'object') ? res : {}) };
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
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
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.departments = action.payload || [];
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      .addCase(createDepartment.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // append created dept
        if (action.payload) state.departments.unshift(action.payload);
      })
      .addCase(createDepartment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      .addCase(updateDepartment.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const updated = action.payload;
        state.departments = state.departments.map((d) => (d._id === (updated._id || updated.id) ? { ...d, ...updated } : d));
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      .addCase(deleteDepartment.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const id = action.payload?.id;
        if (id) state.departments = state.departments.filter((d) => d._id !== id && d.id !== id);
      })
      .addCase(deleteDepartment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      });
  },
});

export const selectDepartments = (state) => state.departments.departments || [];
export const selectDepartmentStatus = (state) => state.departments.status;
export const selectDepartmentError = (state) => state.departments.error;

export default departmentSlice.reducer;
