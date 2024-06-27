import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { httpGetService, httpPostService,httpDeleteService } from "../../App/httpHandler";

const initialState = {
  isSidebarOpen: false,
  status: null,
  error: null,
  tasks: [],
  subs:[]
};

export const fetchTasks = createAsyncThunk(
  "api/tasks/gettasks",
  async (data, thunkAPI) => {
    try {
      const response = await httpGetService("api/tasks/gettasks", data);
      return response; 
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);


// export const fetchTasksbyId = createAsyncThunk(
//   "api/tasks/gettaskbyId/task_id",
//   async (data, thunkAPI) => {
//     const {task_id}=data;
//     try {
//       const response = await httpGetService(`api/tasks/gettaskbyId/${task_id}`,data);
//       return response; 
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   } 
// );
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

export const createTask = createAsyncThunk(
  "/api/tasks/create",
  async (taskData, thunkAPI) => {
    try {
      const response = await httpPostService("api/tasks/create", taskData);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const deleteTask = createAsyncThunk(
  "/api/tasks/deltask",
  async (data, thunkAPI) => {
    const { id } = data;
    try {
      const response = await httpDeleteService(`api/tasks/deltask/${id}`, data);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

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
      throw new Error(error.message); // Handle errors appropriately
    }
  }
);


export const getSubTask = createAsyncThunk(
  "/api/tasks/getsubtasks",
  async (data, thunkAPI) => {
    const { id } = data;
    try {
      const response = await httpGetService(`api/tasks/getsubtasks/${id}`, data);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);
// export const getSubTask = createAsyncThunk(
//   "/api/tasks/getsubtasks",
//   async (data, thunkAPI) => {
//     try {
//       const response = await httpGetService("api/tasks/getsubtasks", data);
//       // console.log(response);
//       return response;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks = action.payload; 
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; 
      })
      .addCase(fetchTasksbyId.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTasksbyId.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks = state.tasks.concat(action.payload);
      })
      .addCase(fetchTasksbyId.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createTask.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; 
      })
      .addCase(deleteTask.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tasks = state.users.filter((task) => task.id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })



      .addCase(createSubTask.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createSubTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.subs.push(action.payload);
      })
      .addCase(createSubTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; 
      })
      .addCase(getSubTask.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getSubTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.subs.push(action.payload);
      })
      .addCase(getSubTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; 
      })
  },
});

// Selectors
export const selectTaskById = (state, taskId) =>
  state.tasks.tasks.find((task) => task.id === taskId);
// export const selectSubTasks = (state) => state.subs.subs;
export const selectTasks = (state) => state.tasks.tasks;
export const selectTaskStatus = (state) => state.tasks.status;
export const selectTaskError = (state) => state.tasks.error;

// Reducer
export default taskSlice.reducer;
