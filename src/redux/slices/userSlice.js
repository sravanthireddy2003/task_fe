// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import { httpGetService,httpDeleteService, httpPutService } from "../../App/httpHandler";

// const initialState = {
//   isSidebarOpen: false,
//   status: null,
//   error: null,
//   users: []
// };


// export const fetchUsers = createAsyncThunk(
//   "api/users/getusers",
//   async (data, thunkAPI) => {
//     try {
//       const response = await httpGetService("api/users/getusers", data);
//       return response;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// export const updateUser = createAsyncThunk(
//   'users/update',
//   async (userData, { rejectWithValue }) => {
//     try {
//       const { _id, ...data } = userData;
//       const response = await httpPutService(`api/users/update/${_id}`, data);
//       return { _id, ...response.user }; // Return the updated user data
//     } catch (error) {
//       return rejectWithValue(error.message || 'Something went wrong');
//     }
//   }
// );

// export const deleteUser = createAsyncThunk(
//   'users/delete',
//   async (data, thunkAPI) => {
//     const { id } = data;
//     try {
//       const response = await httpDeleteService(`api/users/delete/${id}`, data);
//       return response;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.message || 'Something went wrong');
//     }
//   }
// );


// const userSlice = createSlice({
//   name: "users",
//   initialState,
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchUsers.pending, (state) => {
//         state.status = 'loading';
//       })
//       .addCase(fetchUsers.fulfilled, (state, action) => {
//         state.status = 'succeeded';
//         state.users = action.payload; 
//       })
//       .addCase(fetchUsers.rejected, (state, action) => {
//         state.status = 'failed';
//         state.error = action.payload; 
//       })
//       .addCase(updateUser.pending, (state) => {
//   state.status = 'loading';
// })
// .addCase(updateUser.fulfilled, (state, action) => {
//   state.status = 'succeeded';
//   const updatedUser = action.payload;
//   state.users = state.users.map(user => 
//     user._id === updatedUser._id ? updatedUser : user
//   );
// })
// .addCase(updateUser.rejected, (state, action) => {
//   state.status = 'failed';
//   state.error = action.payload;
// })
//       .addCase(deleteUser.pending, (state) => {
//         state.status = 'loading';
//       })
//       .addCase(deleteUser.fulfilled, (state, action) => {
//         state.status = 'succeeded';
//         // Filter out the deleted user based on the ID returned by the fulfilled action
//         state.users = state.users.filter((user) => user._id !== action.payload);
//       })
//       .addCase(deleteUser.rejected, (state, action) => {
//         state.status = 'failed';
//         state.error = action.payload;
//       });
// }
// });

// export const { setOpenSidebar } = userSlice.actions;

// // Selectors
// export const selectUsers = (state) => state.users.users;
// export const selectUserStatus = (state) => state.users.status;
// export const selectUserError = (state) => state.users.error;

// // Reducer
// export default userSlice.reducer;



import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
  httpGetService, 
  httpDeleteService, 
  httpPutService, 
  httpPostService,
  setAuthToken,
  clearAuthTokens 
} from "../../App/httpHandler";

const initialState = {
  isSidebarOpen: false,
  status: null,
  error: null,
  users: [],
  // Add auth state
  auth: {
    token: localStorage.getItem('accessToken') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    isAuthenticated: !!(localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')),
  }
};

// Login async thunk
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await httpPostService("api/auth/login", credentials);
      
      // Store tokens based on rememberMe preference
      if (credentials.rememberMe) {
        setAuthToken(response.accessToken, response.refreshToken, 'local');
        localStorage.setItem('user', JSON.stringify(response.user || response.data));
      } else {
        setAuthToken(response.accessToken, response.refreshToken, 'session');
        sessionStorage.setItem('user', JSON.stringify(response.user || response.data));
      }
      
      return {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user || response.data
      };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Logout async thunk
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      // Call logout API if needed
      await httpPostService("api/auth/logout");
    } catch (error) {
      // Continue with clearing tokens even if API call fails
    } finally {
      // Clear all tokens and user data
      clearAuthTokens();
    }
    return null;
  }
);

// Register async thunk
export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await httpPostService("api/auth/register", userData);
      
      // Auto-login after registration if API returns tokens
      if (response.accessToken) {
        setAuthToken(response.accessToken, response.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user || response.data));
      }
      
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Fetch users async thunk (with tenant ID)
export const fetchUsers = createAsyncThunk(
  "api/users/getusers",
  async (data = {}, thunkAPI) => {
    try {
      // Get tenant ID from localStorage or state
      const tenantId = localStorage.getItem("tenantId") || import.meta.env.VITE_TENANT_ID;
      
      const config = {
        headers: tenantId ? { "x-tenant-id": tenantId } : {},
        params: data
      };
      
      const response = await httpGetService("api/users/getusers", config);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// Update user async thunk
export const updateUser = createAsyncThunk(
  'users/update',
  async (userData, { rejectWithValue }) => {
    try {
      const { _id, ...data } = userData;
      const response = await httpPutService(`api/users/update/${_id}`, data);
      return { _id, ...response.user };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Delete user async thunk
export const deleteUser = createAsyncThunk(
  'users/delete',
  async (data, { rejectWithValue }) => {
    const { id } = data;
    try {
      const response = await httpDeleteService(`api/users/delete/${id}`);
      return { id, ...response };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setOpenSidebar: (state, action) => {
      state.isSidebarOpen = action.payload;
    },
    setTenantId: (state, action) => {
      localStorage.setItem("tenantId", action.payload);
    },
    clearTenantId: (state) => {
      localStorage.removeItem("tenantId");
    },
    setAuth: (state, action) => {
      state.auth.token = action.payload.accessToken;
      state.auth.user = action.payload.user || null;
      state.auth.isAuthenticated = true;
      setAuthToken(action.payload.accessToken, action.payload.refreshToken);
      if (action.payload.user) {
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      }
    },
    clearAuth: (state) => {
      state.auth.token = null;
      state.auth.user = null;
      state.auth.isAuthenticated = false;
      clearAuthTokens();
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.auth.token = action.payload.accessToken;
        state.auth.user = action.payload.user;
        state.auth.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.auth.isAuthenticated = false;
      })
      
      // Logout cases
      .addCase(logoutUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = 'succeeded';
        state.auth.token = null;
        state.auth.user = null;
        state.auth.isAuthenticated = false;
      })
      
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload.accessToken) {
          state.auth.token = action.payload.accessToken;
          state.auth.user = action.payload.user;
          state.auth.isAuthenticated = true;
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Fetch users cases
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload.users || action.payload; 
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; 
      })
      
      // Update user cases
      .addCase(updateUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const updatedUser = action.payload;
        state.users = state.users.map(user => 
          user._id === updatedUser._id ? updatedUser : user
        );
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Delete user cases
      .addCase(deleteUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = state.users.filter((user) => user._id !== action.payload.id);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { 
  setOpenSidebar, 
  setTenantId, 
  clearTenantId, 
  setAuth, 
  clearAuth 
} = userSlice.actions;

// Selectors
export const selectUsers = (state) => state.users.users;
export const selectUserStatus = (state) => state.users.status;
export const selectUserError = (state) => state.users.error;
export const selectAuth = (state) => state.users.auth;
export const selectIsAuthenticated = (state) => state.users.auth.isAuthenticated;
export const selectCurrentUser = (state) => state.users.auth.user;
export const selectTenantId = () => localStorage.getItem("tenantId") || import.meta.env.VITE_TENANT_ID;

// Reducer
export default userSlice.reducer;