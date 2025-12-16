import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  httpGetService,
  httpPutService,
  httpPostService,
  httpDeleteService,
} from "../../App/httpHandler";

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

const initialState = {
  tasks: [],
  currentTask: null,
  status: null,
  error: null,
};

// Thunks - Updated to match Postman collection
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (params = {}, thunkAPI) => {
    try {
      const res = await httpGetService('api/projects/tasks');
      return Array.isArray(res) ? res : res?.data || res?.tasks || [];
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const getTask = createAsyncThunk(
  'tasks/getTask',
  async (taskId, thunkAPI) => {
    try {
      const res = await httpGetService(`api/projects/tasks/${taskId}`);
      return res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (payload, thunkAPI) => {
    try {
      const res = await httpPostService('api/projects/tasks', payload);
      return res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, data }, thunkAPI) => {
    try {
      const res = await httpPutService(`api/projects/tasks/${taskId}`, data);
      return res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId, thunkAPI) => {
    try {
      const res = await httpDeleteService(`api/projects/tasks/${taskId}`);
      return { id: taskId, ...((res && typeof res === 'object') ? res : {}) };
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

// Legacy exports for backward compatibility
export const fetchTaskss = fetchTasks;
export const updateTaskStatuss = updateTask;

// Legacy subtask functions (kept for backward compatibility)
export const createSubTask = createAsyncThunk(
  'tasks/createSubTask',
  async ({ id, title, due_date, tag }, thunkAPI) => {
    try {
      const res = await httpPostService(`api/projects/subtasks`, {
        task_id: id,
        name: title,
        due_date,
        priority: tag,
      });
      return res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const getSubTask = createAsyncThunk(
  'tasks/getSubTask',
  async (taskId, thunkAPI) => {
    try {
      const res = await httpGetService(`api/projects/subtasks/task/${taskId}`);
      return Array.isArray(res) ? res : res?.data || res?.subtasks || [];
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const fetchTasksbyId = createAsyncThunk(
  'tasks/fetchTasksbyId',
  async ({ task_id }, thunkAPI) => {
    try {
      const res = await httpGetService(`api/projects/tasks/${task_id}`);
      return res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTempTask: (state, action) => {
      state.tasks.unshift({ ...action.payload, isTemp: true });
    },
    confirmTask: (state, action) => {
      state.tasks = state.tasks.map((task) =>
        task.isTemp && task.name === action.payload.name
          ? action.payload
          : task
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tasks
      .addCase(fetchTasks.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks = action.payload || [];
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      // Get Task
      .addCase(getTask.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentTask = action.payload;
        const idx = state.tasks.findIndex(
          (t) => (t.id || t._id) === (action.payload.id || action.payload._id)
        );
        if (idx >= 0) {
          state.tasks[idx] = { ...state.tasks[idx], ...action.payload };
        } else {
          state.tasks.push(action.payload);
        }
      })
      .addCase(getTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      // Create Task
      .addCase(createTask.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload) {
          state.tasks.unshift(action.payload);
        }
      })
      .addCase(createTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
        state.tasks = state.tasks.filter((task) => !task.isTemp);
      })

      // Update Task
      .addCase(updateTask.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const updated = action.payload;
        const idx = state.tasks.findIndex((t) => (t.id || t._id) === (updated.id || updated._id));
        if (idx >= 0) {
          state.tasks[idx] = { ...state.tasks[idx], ...updated };
        }
        if (state.currentTask?.id === updated.id || state.currentTask?._id === updated._id) {
          state.currentTask = { ...state.currentTask, ...updated };
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      // Delete Task
      .addCase(deleteTask.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const id = action.payload?.id;
        if (id) {
          state.tasks = state.tasks.filter((t) => (t.id || t._id) !== id);
          if ((state.currentTask?.id || state.currentTask?._id) === id) {
            state.currentTask = null;
          }
        }
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      });
  },
});

// Export actions
export const { addTempTask, confirmTask } = taskSlice.actions;

// Selectors
export const selectTasks = (state) => state.tasks.tasks || [];
export const selectTaskStatus = (state) => state.tasks.status;
export const selectTaskError = (state) => state.tasks.error;
export const selectCurrentTask = (state) => state.tasks.currentTask;
export const selectTaskById = (state, taskId) =>
  state.tasks.tasks.find((task) => (task.id || task._id) === taskId);
export const selectSubTasks = (state) => state.tasks.subs || [];

export default taskSlice.reducer;
