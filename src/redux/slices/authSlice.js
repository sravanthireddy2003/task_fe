import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  httpPostService,
  httpPatchService,
  httpGetService,
} from "../../App/httpHandler";

// ✅ Safely parse user from localStorage
let userInfo = null;
try {
  const storedUser = localStorage.getItem("userInfo");
  userInfo =
    storedUser && storedUser !== "undefined" ? JSON.parse(storedUser) : null;
} catch (e) {
  userInfo = null;
}

const initialState = {
  user: userInfo,
  isSidebarOpen: false,
  status: null,
  error: null,
  authError: null,
  users: {},
};

// ✅ Login thunk with proper error message extraction
export const authLogin = createAsyncThunk(
  "api/auth/login",
  async (data, thunkAPI) => {
    try {
      const response = await httpPostService("api/auth/login", data);

      // ✅ Handle backend failure explicitly
      if (response.auth === false) {
        return thunkAPI.rejectWithValue(response.message);
      }

      // ✅ If successful, return the user
      return response.user;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Login failed. Please try again.";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// ✅ Google login thunk
export const authGoogleLogin = createAsyncThunk(
  "api/auth/googleLogin",
  async (code, thunkAPI) => {
    try {
      const response = await httpGetService(
        `api/auth/googleLogin?code=${code}`
      );
      return response.user;
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || "Failed to login with Google";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// ✅ Register thunk
export const authRegister = createAsyncThunk(
  "api/auth/register",
  async (data, thunkAPI) => {
    try {
      const response = await httpPostService("api/auth/register", data);
      return response;
    } catch (error) {
      const message =
        error?.response?.data?.message || "Registration failed.";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// ✅ Change password thunk
export const changePassword = createAsyncThunk(
  "api/auth/changepass",
  async (data, thunkAPI) => {
    try {
      const response = await httpPatchService("api/auth/changepass", data);
      return response;
    } catch (error) {
      const message =
        error?.response?.data?.message || "Password change failed.";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("userInfo", JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      state.authError = null;
      state.status = null;
      localStorage.removeItem("userInfo");
      localStorage.removeItem("token");
    },
    setOpenSidebar: (state, action) => {
      state.isSidebarOpen = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder

      // Register
      .addCase(authRegister.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        localStorage.setItem("userInfo", JSON.stringify(action.payload));
      })

      // Login
      .addCase(authLogin.pending, (state) => {
        state.status = "loading";
        state.authError = null;
      })
      .addCase(authLogin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.authError = null;
        localStorage.setItem("userInfo", JSON.stringify(action.payload));
      })
      .addCase(authLogin.rejected, (state, action) => {
        state.status = "failed";
        state.authError = action.payload;
      })

      // Google Login
      .addCase(authGoogleLogin.pending, (state) => {
        state.status = "loading";
      })
      .addCase(authGoogleLogin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        localStorage.setItem("userInfo", JSON.stringify(action.payload));
      })
      .addCase(authGoogleLogin.rejected, (state, action) => {
        state.status = "failed";
        state.authError = action.payload;
      })

      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.status = "loading";
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.status = "failed";
        state.authError = action.payload;
      });
  },
});

// ✅ Actions
export const { setCredentials, logout, setOpenSidebar } = authSlice.actions;

// ✅ Selectors
export const selectUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.authError;

// ✅ Reducer
export default authSlice.reducer;
