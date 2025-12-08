import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  httpPostService,
  httpPatchService,
  httpGetService,
} from "../../App/httpHandler";
import { setTokens, clearTokens, getRefreshToken } from "../../utils/tokenService";
import { setAuthToken } from "../../App/httpHandler";

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
  tempToken: null,
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

      // Expected response: { message, tempToken }
      if (!response) return thunkAPI.rejectWithValue("No response from server");
      if (response.auth === false || response.error) {
        return thunkAPI.rejectWithValue(response.message || response.error);
      }
      return response; // caller (UI) should use tempToken for OTP step
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Login failed. Please try again.";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Verify OTP thunk - exchanges tempToken+otp for access+refresh tokens and user
export const verifyOtp = createAsyncThunk(
  "api/auth/verifyOtp",
  async (data, thunkAPI) => {
    try {
      const response = await httpPostService("api/auth/verify-otp", data);
      // expected response shapes: { accessToken, refreshToken, user } OR { token, user }
      const access = response?.accessToken || response?.token;
      const refresh = response?.refreshToken || response?.refresh;
      if (access) {
        setTokens(access, refresh || null);
      }

      // normalize returned payload
      return response;
    } catch (error) {
      const msg = error?.message || "OTP verification failed";
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// ✅ Resend OTP thunk
export const resendOtp = createAsyncThunk(
  "api/auth/resendOtp",
  async (data, thunkAPI) => {
    try {
      const response = await httpPostService("api/auth/resend-otp", data);
      return response; // Should return new tempToken or success message
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to resend OTP";
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Refresh token thunk
export const refreshToken = createAsyncThunk(
  "api/auth/refreshToken",
  async (_, thunkAPI) => {
    try {
      // use tokenService helper to read refresh token from local/session storage
      const storedRefresh = getRefreshToken();
      const response = await httpPostService("api/auth/refresh", {
        refreshToken: storedRefresh,
      });
      if (response?.accessToken) {
        // persist tokens and update axios default header for immediate use
        setTokens(response.accessToken, response.refreshToken);
        try { setAuthToken(response.accessToken, response.refreshToken, 'local'); } catch (e) {}
      }
      return response;
    } catch (error) {
        // error comes from httpHandler.formatAxiosError and includes `status`
        try {
          const status = error?.status || error?.response?.status;
          if (status === 404) {
            // Refresh endpoint not present on backend — clear tokens and return a clear message
            clearTokens();
            return thunkAPI.rejectWithValue('Refresh endpoint not found (404)');
          }
        } catch (e) {}

        clearTokens();
        return thunkAPI.rejectWithValue(error?.message || "Refresh failed");
    }
  }
);

export const getProfile = createAsyncThunk(
  "api/auth/getProfile",
  async (_, thunkAPI) => {
    try {
      const response = await httpGetService("api/auth/profile");
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.message || "Failed to get profile");
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "api/auth/forgotPassword",
  async (data, thunkAPI) => {
    try {
      const response = await httpPostService("api/auth/forgot-password", data);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.message || "Failed to send OTP");
    }
  }
);

export const resetPassword = createAsyncThunk(
  "api/auth/resetPassword",
  async (data, thunkAPI) => {
    try {
      const response = await httpPostService("api/auth/reset-password", data);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.message || "Reset password failed");
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
  "api/auth/changePassword",
  async (data, thunkAPI) => {
    try {
      // backend expects /api/auth/change-password (Postman); accept both
      const response = await httpPatchService("api/auth/change-password", data);
      return response;
    } catch (error) {
      const message = error?.message || "Password change failed.";
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
      state.tempToken = null;
      localStorage.removeItem("userInfo");
      clearTokens();
    },
    setOpenSidebar: (state, action) => {
      state.isSidebarOpen = action.payload;
    },
    clearTempToken: (state) => {
      state.tempToken = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(authRegister.pending, (state) => {
        state.status = "loading";
        state.authError = null;
      })
      .addCase(authRegister.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.authError = null;
        localStorage.setItem("userInfo", JSON.stringify(action.payload));
      })
      .addCase(authRegister.rejected, (state, action) => {
        state.status = "failed";
        state.authError = action.payload;
      })

      // Login
      .addCase(authLogin.pending, (state) => {
        state.status = "loading";
        state.authError = null;
      })
      .addCase(authLogin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.authError = null;
        // store tempToken returned from login (OTP step)
        state.tempToken = action.payload?.tempToken || action.payload?.temp_token || null;
      })
      .addCase(authLogin.rejected, (state, action) => {
        state.status = "failed";
        state.authError = action.payload;
      })

      // Google Login
      .addCase(authGoogleLogin.pending, (state) => {
        state.status = "loading";
        state.authError = null;
      })
      .addCase(authGoogleLogin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.authError = null;
        localStorage.setItem("userInfo", JSON.stringify(action.payload));
      })
      .addCase(authGoogleLogin.rejected, (state, action) => {
        state.status = "failed";
        state.authError = action.payload;
      })

      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.status = "loading";
        state.authError = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.status = "succeeded";
        state.authError = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.status = "failed";
        state.authError = action.payload;
      })

      // Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.status = "loading";
        state.authError = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.tempToken = null;
        // action.payload expected to include user (and token stored by thunk)
        const payloadUser = action.payload?.user || action.payload?.userInfo || action.payload;
        if (payloadUser) {
          // If payloadUser contains modules, keep them
          state.user = payloadUser;
          localStorage.setItem("userInfo", JSON.stringify(payloadUser));
        }
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.status = "failed";
        state.authError = action.payload;
      })

      // Resend OTP
      .addCase(resendOtp.pending, (state) => {
        state.status = "loading";
        state.authError = null;
      })
      .addCase(resendOtp.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.authError = null;
        // Update tempToken if returned
        if (action.payload?.tempToken || action.payload?.temp_token) {
          state.tempToken = action.payload.tempToken || action.payload.temp_token;
        }
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.status = "failed";
        state.authError = action.payload;
      })

      // Get Profile
      .addCase(getProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.authError = null;
        localStorage.setItem("userInfo", JSON.stringify(action.payload));
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.authError = action.payload;
      })

      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.status = "loading";
        state.authError = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.status = "succeeded";
        state.authError = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.status = "failed";
        state.authError = action.payload;
      })

      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.status = "loading";
        state.authError = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.status = "succeeded";
        state.authError = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = "failed";
        state.authError = action.payload;
      })

      // Refresh token failure should clear auth
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.tempToken = null;
        state.authError = "Session expired";
        localStorage.removeItem("userInfo");
      });
  },
});

// ✅ Actions
export const { setCredentials, logout, setOpenSidebar, clearTempToken } = authSlice.actions;

// ✅ Selectors
export const selectUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.authError;
export const selectTempToken = (state) => state.auth.tempToken;

// ✅ Reducer
export default authSlice.reducer;