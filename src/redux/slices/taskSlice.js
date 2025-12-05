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
  async (_, thunkAPI) => {
    try {
      // read current user from either 'userInfo' or legacy 'user'
      const rawUser = localStorage.getItem("userInfo") || localStorage.getItem('user') || null;
      const userInfo = rawUser ? JSON.parse(rawUser) : null;
      const params = userInfo ? (userInfo.isAdmin === 1 ? { isAdmin: 1 } : { userId: userInfo._id || userInfo.id }) : {};
      const queryString = new URLSearchParams(params).toString();
      const url = `api/tasks/gettasks`;
      const response = await httpGetService(url);
      return response;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return thunkAPI.rejectWithValue(
        error.response ? error.response.data : error.message
      );
    }
  }
);

// Create Task with immediate UI update
export const createTask = createAsyncThunk(
  "/api/tasks/createjson",
  async (taskData, thunkAPI) => {
    try {
      const response = await httpPostService("api/tasks/createjson", taskData);
      return response.data || response;
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
      const response = await httpPutService(`api/tasks/updatetask/${id}`, data);
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
      const response = await httpDeleteService(`api/tasks/deltask/${id}`, data);
      return { id, ...response };
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
      const response = await httpGetService(`api/tasks/gettaskbyId/${task_id}`);
      return response;
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
      const response = await httpPutService(
        `api/tasks/updatetask/${id}`,
        updatedTaskData
      );

      if (!response.success) {
        throw new Error(response.error || "Update failed");
      }

      return {
        id: id, // Consistent ID naming
        ...response.task,
      };
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
      const response = await httpPostService(`api/tasks/createsub/${id}`, {
        title,
        due_date,
        tag,
      });
      return response;
    } catch (error) {
      throw new Error(error.message);
    }
  }
);

// Get Sub Tasks
export const getSubTask = createAsyncThunk(
  "/api/tasks/getsubtasks",
  async (taskId) => {
    const response = await httpGetService(`api/tasks/getsubtasks/${taskId}`);
    return response;
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
