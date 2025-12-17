

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  httpGetService,
  httpPutService,
  httpPostService,
  httpDeleteService,
} from "../../App/httpHandler";

const initialState = {
  isSidebarOpen: false,
  status: null,
  error: null,
  tasks: [],
  subs: [],
};

// Fetch Tasks
export const fetchTaskss = createAsyncThunk(
  "tasks/fetchTasks",
  // params: optional object { clientId, extraParams }
  async (params = {}, thunkAPI) => {
    try {
      // Build query params: support projectId and departmentId
      const query = {};
      if (params.projectId) query.projectId = params.projectId;
      if (params.departmentId) query.departmentId = params.departmentId;

      const queryString = new URLSearchParams(query).toString();
      const url = queryString ? `api/projects/tasks?${queryString}` : `api/projects/tasks`;

      const response = await httpGetService(url);
      return Array.isArray(response) ? response : response?.data || response || [];
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return thunkAPI.rejectWithValue(
        // Normalize error message
        (error && (error.message || (error.data && error.data.message))) || error
      );
    }
  }
);

// Create Task with immediate UI update
export const createTask = createAsyncThunk(
  "/api/tasks/createjson",
  async (taskData, thunkAPI) => {
    try {
      // Normalize task payload similar to main taskSlice: accept projectId/project_id and assigned_to
      const body = { ...taskData };
      if (taskData.projectId) body.project_id = taskData.projectId;
      if (Array.isArray(taskData.assigned_to) && taskData.assigned_to.length) {
        body.assignedUsers = taskData.assigned_to.map((u) => (typeof u === 'string' || typeof u === 'number' ? { id: u } : u)).filter(Boolean);
        // also provide assigned_to array of ids for backend
        body.assigned_to = body.assignedUsers.map(u => u.id || u.internalId || u.internal_id || u._id).filter(Boolean);
        delete body.assigned_to; // keep normalized assignedUsers but ensure assigned_to exists below if needed
      }

      // If assignedUsers were provided directly, ensure assigned_to is populated
      if (Array.isArray(body.assignedUsers) && body.assignedUsers.length) {
        body.assigned_to = body.assignedUsers.map(u => u.id || u.internalId || u.internal_id || u._id).filter(Boolean);
      }
      if (taskData.estimated_hours && !body.estimatedHours) body.estimatedHours = taskData.estimated_hours;

      const response = await httpPostService("api/projects/tasks", body);
      return response?.data || response || {};
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response ? error.response.data : error.message
      );
    }
  }
);

// Update Task Status
// export const updateTaskStatuss = createAsyncThunk(
//   "tasks/updateStatus",
//   async ({ id, stage }, { rejectWithValue }) => {
//     try {
//       const response = await httpPutService(`api/tasks/updatetask/${id}`, {
//         stage,
//       });
//       return response;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );
export const updateTaskStatuss = createAsyncThunk(
  "tasks/updateStatus",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await httpPutService(`api/projects/tasks/${id}`, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete Task
export const deleteTask = createAsyncThunk(
  "/api/tasks/deltask",
  async (data, thunkAPI) => {
    const { id } = data;
    try {
      const response = await httpDeleteService(`api/projects/tasks/${id}`);
      return { id, ...((response && typeof response === 'object') ? response : {}) };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response ? error.response.data : error.message
      );
    }
  }
);

// In taskSlice.js
export const fetchTasksbyId = createAsyncThunk(
  "api/tasks/gettaskbyId/task_id",
  async ({ task_id }, thunkAPI) => {
    try {
      const response = await httpGetService(`api/projects/tasks/${task_id}`);
      return response?.data || response || {};
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// Update Task (general task update)
export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async ({ id, updatedTaskData }, thunkAPI) => {
    try {
      const response = await httpPutService(`api/projects/tasks/${id}`, updatedTaskData);
      return response?.data || response || {};
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create Sub Task
export const createSubTask = createAsyncThunk(
  "tasks/createSubTask",
  async ({ id, title, due_date, tag }) => {
    try {
      const response = await httpPostService(`api/projects/subtasks`, {
        task_id: id,
        name: title,
        due_date,
        priority: tag,
      });
      return response?.data || response || {};
    } catch (error) {
      throw new Error(error.message);
    }
  }
);

// Get Sub Tasks
export const getSubTask = createAsyncThunk(
  "/api/tasks/getsubtasks",
  async (taskId) => {
    const response = await httpGetService(`api/projects/subtasks/task/${taskId}`);
    return Array.isArray(response) ? response : response?.data || response || [];
  }
);

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    // Add temporary task for immediate UI update
    addTempTask: (state, action) => {
      state.tasks.unshift({ ...action.payload, isTemp: true });
    },
    // Replace temporary task with actual task from server
    confirmTask: (state, action) => {
      state.tasks = state.tasks.map((task) =>
        task.isTemp && task.title === action.payload.title
          ? action.payload
          : task
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tasks
      .addCase(fetchTaskss.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchTaskss.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.tasks = action.payload;
      })
      .addCase(fetchTaskss.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateTask.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.status = "succeeded";

        const updatedId =
          action.payload._id || action.payload.id || action.payload.task_id;

        state.tasks = state.tasks.map((task) =>
          (task._id || task.id || task.task_id) === updatedId
            ? { ...task, ...action.payload }
            : task
        );
      })

      .addCase(updateTask.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Create Task
      .addCase(createTask.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Replace temp task or add new if not found
        const tempTaskIndex = state.tasks.findIndex(
          (t) => t.isTemp && t.title === action.payload.title
        );
        if (tempTaskIndex >= 0) {
          state.tasks[tempTaskIndex] = action.payload;
        } else {
          state.tasks.unshift(action.payload);
        }
      })
      .addCase(createTask.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        // Remove temporary task if creation failed
        state.tasks = state.tasks.filter((task) => !task.isTemp);
      })

      // Update Task Status
      .addCase(updateTaskStatuss.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateTaskStatuss.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.tasks = state.tasks.map((task) =>
          task._id === action.payload._id ? action.payload : task
        );
      })
      .addCase(updateTaskStatuss.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Delete Task
      .addCase(deleteTask.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.tasks = state.tasks.filter(
          (task) => task._id !== action.payload.id
        );
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Sub Tasks
      .addCase(createSubTask.fulfilled, (state, action) => {
        state.subs.push(action.payload);
      })
      .addCase(getSubTask.fulfilled, (state, action) => {
        state.subs = action.payload;
      });
  },
});

// Export actions
export const { addTempTask, confirmTask } = taskSlice.actions;

// Selectors
export const selectTasks = (state) => state.tasks.tasks;
export const selectTaskStatus = (state) => state.tasks.status;
export const selectTaskError = (state) => state.tasks.error;
// export const selectTaskById = (state, taskId) =>
//   state.tasks.tasks.find((task) => task._id === taskId);
export const selectTaskById = (state, taskId) =>
  state.tasks.tasks.find(
    (task) => task._id === taskId || task.task_id === taskId
  );
export const selectSubTasks = (state) => state.tasks.subs;

export default taskSlice.reducer;
