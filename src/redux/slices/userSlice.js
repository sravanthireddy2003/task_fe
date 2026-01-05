import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  httpGetService,
  httpDeleteService,
  httpPutService,
  httpPostService,
  setAuthToken,
  clearAuthTokens
} from "../../App/httpHandler";
import { getAccessToken } from "../../utils/tokenService";
import { toast } from 'sonner';
import { fetchNotifications } from "./notificationSlice";

const initialState = {
  isSidebarOpen: false,
  status: null,
  error: null,
  users: [],
  auth: {
    token: getAccessToken(),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    isAuthenticated: !!getAccessToken(),
  }
};

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await httpPostService("api/auth/login", credentials);
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
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await httpPostService("api/auth/logout");
    } catch (error) {
    } finally {
      clearAuthTokens();
    }
    return null;
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await httpPostService("api/auth/register", userData);
      if (response.accessToken) {
        setAuthToken(response.accessToken, response.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user || response.data));
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchUsers = createAsyncThunk(
  "api/users/getusers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await httpGetService("api/users/getusers");
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// ✅ FIXED: Create user
export const createUser = createAsyncThunk(
  'api/users/create',
  async (userData, { rejectWithValue, dispatch }) => {
    try {
      const resp = await httpPostService('api/users/create', userData);
      // ✅ NEW: Refresh notifications after successful user creation
      await new Promise(resolve => setTimeout(resolve, 500));
      dispatch(fetchNotifications());
      if (!resp.success) {
        return rejectWithValue(resp);
      }
      return resp;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, ...userData }, { rejectWithValue, dispatch }) => {
    try {
      console.log('🔍 UPDATE THUNK - ID:', id, 'Data:', userData);
      const response = await httpPutService(`api/users/update/${id}`, userData);
      
      // ✅ NEW: Refresh notifications after successful user update
      await new Promise(resolve => setTimeout(resolve, 500));
      dispatch(fetchNotifications());
      
      if (!response.success) {
        return rejectWithValue(response);
      }
      
      return response.user || response.data || response;
    } catch (error) {
      console.error('Update error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (userData, { rejectWithValue }) => {
    try {
      let id;
      if (!userData) {
        return rejectWithValue({ message: 'Missing user data' });
      }
      
      if (typeof userData === 'string' || typeof userData === 'number') {
        id = userData;
      } else {
        id = userData.id || userData.public_id || userData._id || userData.publicId;
      }
      
      if (!id) {
        return rejectWithValue({ message: 'Missing user ID for delete' });
      }
      console.log('🗑️ DELETE THUNK - ID:', id);
      
      const response = await httpDeleteService(`api/users/delete/${id}`);
      if (!response.success) {
        return rejectWithValue(response);
      }
      
      return { removedId: id, success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
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
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
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

      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = 'succeeded';
        state.auth.token = null;
        state.auth.user = null;
        state.auth.isAuthenticated = false;
      })

      // Register
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

      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = Array.isArray(action.payload) ? action.payload : action.payload || [];
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Create user
      .addCase(createUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const created = action.payload?.data || action.payload;
        if (created) {
          state.users.unshift(created);
        }
      })
      .addCase(createUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // 🔥 FIXED: Update user - matches frontend call pattern
      .addCase(updateUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const updatedUser = action.payload;
        
        // Update user in list - comprehensive ID matching
        state.users = state.users.map(user => {
          const userIds = [user._id, user.id, user.public_id, user.publicId].filter(Boolean);
          const updatedIds = [updatedUser._id, updatedUser.id, updatedUser.public_id, updatedUser.publicId].filter(Boolean);
          
          if (userIds.some(id => updatedIds.includes(id))) {
            return updatedUser;
          }
          return user;
        });
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const removedId = action.payload?.removedId || action.payload?.id || action.meta.arg?.id;
        
        if (removedId) {
          state.users = state.users.filter(user => {
            const ids = [user._id, user.id, user.public_id, user.publicId].filter(Boolean);
            return !ids.includes(removedId);
          });
        }
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
  clearAuth,
  clearError
} = userSlice.actions;

// Selectors
export const selectUsers = (state) => state.users.users;
export const selectUserStatus = (state) => state.users.status;
export const selectUserError = (state) => state.users.error;
export const selectAuth = (state) => state.users.auth;
export const selectIsAuthenticated = (state) => state.users.auth.isAuthenticated;
export const selectCurrentUser = (state) => state.users.auth.user;
export const selectTenantId = () => localStorage.getItem("tenantId") || import.meta.env.VITE_TENANT_ID;

export default userSlice.reducer;
