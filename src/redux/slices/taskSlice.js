import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  httpGetService,
  httpPutService,
  httpPostService,
  httpDeleteService,
} from "../../App/httpHandler";
import { fetchNotifications } from "./notificationSlice";

// Helper to normalize errors
const formatRejectValue = (err) => {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err?.message) return err.message;
  try {
    return JSON.stringify(serr);
  } catch (e) {
    return String(err);
  }
};

const initialState = {
  tasks: [],
  currentTask: null,
  timeline: null,
  status: null,
  error: null,
};

// Thunks - Updated to match Postman collection
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (params = {}, thunkAPI) => {
    try {
      console.log('fetchTasks called with params:', params);
      // Support query params from callers. Backend expects `project_id` (snake_case) or projectPublicId
      const query = {};
      if (params.project_id) query.project_id = params.project_id;
      if (params.projectId) query.project_id = params.projectId;
      if (params.projectPublicId) query.projectPublicId = params.projectPublicId;
      if (params.client_id) query.client_id = params.client_id;
      if (params.clientId) query.client_id = params.clientId;
      if (params.departmentId) query.departmentId = params.departmentId;

      const qs = new URLSearchParams(query).toString();
      const url = qs ? `api/projects/tasks?${qs}` : `api/projects/tasks`;
      console.log('fetchTasks calling URL:', url);

      const res = await httpGetService(url);
      console.log('fetchTasks response:', res);

      // Handle API response structure: { success: true, data: [...] } or { success: false, error: "message" }
      if (res?.success === false) {
        return thunkAPI.rejectWithValue(res.error || 'Failed to fetch tasks');
      }

      // Normalize response shapes: prefer `res.data` when server returns { success:true, data: [...] }
      const data = res?.data || res || [];
      console.log('fetchTasks normalized data:', data);
      if (Array.isArray(data)) return data;
      // Fallbacks: server may return array directly or wrap in .tasks
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.tasks)) return res.tasks;
      return Array.isArray(res?.data) ? res.data : [];
    } catch (err) {
      console.error('fetchTasks error:', err);
      // Handle HTTP errors consistently
      if (err.response) {
        const status = err.response.status;
        const errorData = err.response.data;
        if (status === 400 && errorData?.error) {
          return thunkAPI.rejectWithValue(errorData.error);
        } else if (status === 403) {
          return thunkAPI.rejectWithValue('Access denied');
        } else if (status === 404) {
          return thunkAPI.rejectWithValue('Tasks not found');
        }
      }
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

// Fetch selected task details (assignedUsers, checklist, activities, totalHours)
export const fetchSelectedTaskDetails = createAsyncThunk(
  'tasks/fetchSelectedTaskDetails',
  async (taskIdsOrPayload = {}, thunkAPI) => {
    try {
      let body = {};
      if (Array.isArray(taskIdsOrPayload)) body.taskIds = taskIdsOrPayload;
      else if (taskIdsOrPayload && Array.isArray(taskIdsOrPayload.taskIds)) body = { taskIds: taskIdsOrPayload.taskIds };
      else if (typeof taskIdsOrPayload === 'object' && taskIdsOrPayload.taskIds) body = { taskIds: taskIdsOrPayload.taskIds };
      else return thunkAPI.rejectWithValue('Missing taskIds');

      const res = await httpPostService('api/tasks/selected-details', body);
      // API returns { success: true, data: [...] }
      const payload = res?.success ? res.data : res?.data || res;
      if (!payload) return [];
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload.data)) return payload.data;
      return Array.isArray(res) ? res : [];
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const getTask = createAsyncThunk(
  'tasks/getTask',
  async (taskId, thunkAPI) => {
    try {
      const res = await httpGetService(`api/tasks/${taskId}`);
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
      // Normalize payload to backend expectations
      const body = { ...payload };
      // backend expects `project_id` (snake_case)
      if (payload.projectId) body.project_id = payload.projectId;
      if (payload.project_id == null && payload.projectId == null && payload.client_id) {
        // leave as-is if client-only task
      }

      // normalize assigned users: convert `assigned_to` -> `assignedUsers: [{id: ...}, ...]`
      if (Array.isArray(payload.assigned_to) && payload.assigned_to.length) {
        body.assignedUsers = payload.assigned_to.map((u) => {
          if (!u) return null;
          if (typeof u === 'string' || typeof u === 'number') return { id: u };
          // already an object with id/internalId/name
          return u;
        }).filter(Boolean);
        delete body.assigned_to;
      }

      // Ensure backend receives `assigned_to` as an array of user IDs (many APIs expect this)
      if (Array.isArray(body.assignedUsers) && body.assignedUsers.length) {
        body.assigned_to = body.assignedUsers.map(u => u.id || u.internalId || u.internal_id || u._id).filter(Boolean);
      } else if (Array.isArray(payload.assigned_to) && payload.assigned_to.length) {
        // if caller provided assigned_to array of ids, keep it
        body.assigned_to = payload.assigned_to;
      } else if (payload.assigned_to && (typeof payload.assigned_to === 'string' || typeof payload.assigned_to === 'number')) {
        body.assigned_to = [payload.assigned_to];
      }

      // support both `estimated_hours` and `timeAlloted`/`time_alloted`
      if (payload.estimated_hours && !body.estimatedHours) body.estimatedHours = payload.estimated_hours;
      if (payload.time_alloted && !body.timeAlloted) body.timeAlloted = payload.time_alloted;

      // Use correct endpoint from Postman collection: POST /api/projects/tasks
      const res = await httpPostService('api/projects/tasks', body);
      
      // ✅ NEW: Refresh notifications after successful task creation
      await new Promise(resolve => setTimeout(resolve, 500));
      thunkAPI.dispatch(fetchNotifications());
      
      // API returns { success: true, message: "...", data: {...} }
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, data }, thunkAPI) => {
    try {
      // Use correct endpoint from Postman collection: PUT /api/projects/tasks/{{taskId}}
      const res = await httpPutService(`api/projects/tasks/${taskId}`, data);
      
      // ✅ NEW: Refresh notifications after successful task update
      await new Promise(resolve => setTimeout(resolve, 500));
      thunkAPI.dispatch(fetchNotifications());
      
      // API returns { success: true, message: "...", data: {...} }
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId, thunkAPI) => {
    try {
      const res = await httpDeleteService(`api/tasks/${taskId}`);
      
      // ✅ NEW: Refresh notifications after successful task deletion
      await new Promise(resolve => setTimeout(resolve, 500));
      thunkAPI.dispatch(fetchNotifications());
      
      // API returns { success: true, message: "..." }
      return { id: taskId, success: res?.success, message: res?.message };
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

// Task time tracking operations
export const startTask = createAsyncThunk(
  'tasks/startTask',
  async (taskId, thunkAPI) => {
    try {
      const res = await httpPostService(`api/tasks/${taskId}/start`);
      // API returns { success: true, message: "...", data: {...} }
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const pauseTask = createAsyncThunk(
  'tasks/pauseTask',
  async (taskId, thunkAPI) => {
    try {
      const res = await httpPostService(`api/tasks/${taskId}/pause`);
      // API returns { success: true, message: "...", data: {...} }
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const resumeTask = createAsyncThunk(
  'tasks/resumeTask',
  async (taskId, thunkAPI) => {
    try {
      const res = await httpPostService(`api/tasks/${taskId}/resume`);
      // API returns { success: true, message: "...", data: {...} }
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const requestTaskCompletion = createAsyncThunk(
  'tasks/requestTaskCompletion',
  async ({ taskId, projectId }, thunkAPI) => {
    try {
      // Use PATCH /api/tasks/{{taskId}}/status with status: "Review"
      const res = await httpPatchService(`api/tasks/${taskId}/status`, {
        status: "Review",
        projectId: projectId
      });
      // API returns { success: true, message: "...", data: {...} }
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

// Update task status with strict transition validation
export const updateTaskStatus = createAsyncThunk(
  'tasks/updateTaskStatus',
  async ({ taskId, status, projectId }, thunkAPI) => {
    try {
      const res = await httpPatchService(`api/tasks/${taskId}/status`, {
        status: status,
        projectId: projectId
      });
      // API returns { success: true, message: "...", data: {...} } or { success: false, error: "message" }
      if (res?.success === false) {
        return thunkAPI.rejectWithValue(res.error || 'Failed to update task status');
      }
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      // Handle HTTP errors consistently
      if (err.response) {
        const statusCode = err.response.status;
        const errorData = err.response.data;
        if (statusCode === 400 && errorData?.error) {
          return thunkAPI.rejectWithValue(errorData.error);
        } else if (statusCode === 403) {
          return thunkAPI.rejectWithValue('Access denied - you cannot change this task status');
        } else if (statusCode === 404) {
          return thunkAPI.rejectWithValue('Task not found');
        }
      }
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const logWorkingHours = createAsyncThunk(
  'tasks/logWorkingHours',
  async ({ task_id, hours, description }, thunkAPI) => {
    try {
      const res = await httpPostService('api/tasks/working-hours', {
        task_id,
        hours,
        description
      });
      // API returns { success: true, message: "...", data: {...} }
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const completeTask = createAsyncThunk(
  'tasks/completeTask',
  async (taskId, thunkAPI) => {
    try {
      const res = await httpPostService(`api/tasks/${taskId}/complete`);
      // API returns { success: true, message: "...", data: {...} }
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const getTaskTimeline = createAsyncThunk(
  'tasks/getTaskTimeline',
  async (taskId, thunkAPI) => {
    try {
      const res = await httpGetService(`api/tasks/${taskId}/timeline`);
      // API returns { success: true, data: {...} } or { success: false, error: "message" }
      if (res?.success === false) {
        return thunkAPI.rejectWithValue(res.error || 'Failed to fetch timeline');
      }
      return res?.success ? res.data : res?.data || res || [];
    } catch (err) {
      // Handle HTTP errors consistently
      if (err.response) {
        const status = err.response.status;
        const errorData = err.response.data;
        if (status === 403) {
          return thunkAPI.rejectWithValue('Access denied');
        } else if (status === 404) {
          return thunkAPI.rejectWithValue('Timeline not found');
        }
      }
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

// Request task reassignment (Employee only)
export const requestTaskReassignment = createAsyncThunk(
  'tasks/requestTaskReassignment',
  async ({ taskId, reason }, thunkAPI) => {
    try {
      const res = await httpPostService(`api/tasks/${taskId}/request-reassignment`, {
        reason: reason
      });
      // API returns { success: true, message: "...", data: {...} } or { success: false, error: "message" }
      if (res?.success === false) {
        return thunkAPI.rejectWithValue(res.error || 'Failed to request reassignment');
      }
      return res?.success ? res.data : res?.data || res || {};
    } catch (err) {
      // Handle HTTP errors consistently
      if (err.response) {
        const status = err.response.status;
        const errorData = err.response.data;
        if (status === 400 && errorData?.error) {
          return thunkAPI.rejectWithValue(errorData.error);
        } else if (status === 403) {
          return thunkAPI.rejectWithValue('Access denied');
        } else if (status === 404) {
          return thunkAPI.rejectWithValue('Task not found');
        }
      }
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
    clearTasks: (state) => {
      state.tasks = [];
      state.status = null;
      state.error = null;
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
      })

      // Start Task
      .addCase(startTask.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(startTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Update task status if needed
        const taskId = action.meta.arg;
        const taskIndex = state.tasks.findIndex(t => (t.id || t._id) === taskId);
        if (taskIndex >= 0) {
          state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...action.payload };
        }
        if (state.currentTask && (state.currentTask.id || state.currentTask._id) === taskId) {
          state.currentTask = { ...state.currentTask, ...action.payload };
        }
      })
      .addCase(startTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      // Pause Task
      .addCase(pauseTask.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(pauseTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const taskId = action.meta.arg;
        const taskIndex = state.tasks.findIndex(t => (t.id || t._id) === taskId);
        if (taskIndex >= 0) {
          state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...action.payload };
        }
        if (state.currentTask && (state.currentTask.id || state.currentTask._id) === taskId) {
          state.currentTask = { ...state.currentTask, ...action.payload };
        }
      })
      .addCase(pauseTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      // Complete Task
      .addCase(completeTask.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(completeTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const taskId = action.meta.arg;
        const taskIndex = state.tasks.findIndex(t => (t.id || t._id) === taskId);
        if (taskIndex >= 0) {
          state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...action.payload };
        }
        if (state.currentTask && (state.currentTask.id || state.currentTask._id) === taskId) {
          state.currentTask = { ...state.currentTask, ...action.payload };
        }
      })
      .addCase(completeTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      // Get Task Timeline
      .addCase(getTaskTimeline.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getTaskTimeline.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Store timeline data if needed
        state.timeline = action.payload;
      })
      .addCase(getTaskTimeline.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      });
  },
});

// Export actions - ADD clearTasks HERE
export const { addTempTask, confirmTask, clearTasks } = taskSlice.actions;

// Selectors
export const selectTasks = (state) => state.tasks.tasks || [];
export const selectTaskStatus = (state) => state.tasks.status;
export const selectTaskError = (state) => state.tasks.error;
export const selectCurrentTask = (state) => state.tasks.currentTask;
export const selectTaskById = (state, taskId) =>
  state.tasks.tasks.find((task) => (task.id || task._id) === taskId);
export const selectSubTasks = (state) => state.tasks.subs || [];
export const selectTaskTimeline = (state) => state.tasks.timeline;

export default taskSlice.reducer;