

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

const initialState = {
  isSidebarOpen: false,
  status: null,
  error: null,
  users: [],
  // Add auth state
  auth: {
    token: getAccessToken(),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    isAuthenticated: !!getAccessToken(),
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
      // httpGetService attaches tenant and auth headers itself; pass params only
      const response = await httpGetService("api/users/getusers", { params: data });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// Create user async thunk (admin creates team member)
export const createUser = createAsyncThunk(
  'api/users/create',
  async (userData, thunkAPI) => {
    try {
      const resp = await httpPostService('api/users/create', userData);
      // return backend response (expected { success, data })
      return resp;
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
    // Accept multiple id variants (plain string, public_id, id, _id) to match backend expectations
    let id;
    if (!data) {
      id = undefined;
    } else if (typeof data === 'string' || typeof data === 'number') {
      id = data;
    } else {
      id = data?.id || data?._id || data?.public_id || data?.publicId || data?.userId;
    }
    if (!id) {
      return rejectWithValue('Missing user id for delete');
    }
    try {
      const response = await httpDeleteService(`api/users/delete/${id}`);
      // Return normalized payload with the id we attempted to delete
      return { removedId: id, ...(response || {}) };
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
      // Create user cases
      .addCase(createUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // backend returns { success, data }
        const created = action.payload?.data || action.payload;
        if (created) state.users.unshift(created);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
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
        // Determine which id was removed (thunk returns `removedId`)
        const removedId = action.payload?.removedId || action.payload?.id || action.meta?.arg?.id || action.meta?.arg?._id || action.meta?.arg?.public_id;
        if (removedId) {
          state.users = state.users.filter((user) => {
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