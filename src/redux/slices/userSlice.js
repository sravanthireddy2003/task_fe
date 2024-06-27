import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { httpGetService,httpDeleteService } from "../../App/httpHandler";

const initialState = {
  isSidebarOpen: false,
  status: null,
  error: null,
  users: []
};


export const fetchUsers = createAsyncThunk(
  "api/users/getusers",
  async (data, thunkAPI) => {
    try {
      const response = await httpGetService("api/users/getusers", data);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (data, thunkAPI) => {
    const { id } = data;
    try {
      const response = await httpDeleteService(`api/users/delete/${id}`, data);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || 'Something went wrong');
    }
  }
);


const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload; 
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; 
      })
      .addCase(deleteUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Filter out the deleted user based on the ID returned by the fulfilled action
        state.users = state.users.filter((user) => user._id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
}
});

export const { setOpenSidebar } = userSlice.actions;

// Selectors
export const selectUsers = (state) => state.users.users;
export const selectUserStatus = (state) => state.users.status;
export const selectUserError = (state) => state.users.error;

// Reducer
export default userSlice.reducer;
