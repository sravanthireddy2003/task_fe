import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  httpPostService,
  httpPatchService,
  httpPutService,
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

      // If backend indicates 2FA is required, return the response so UI can navigate to OTP flow.
      const requires2fa = response?.requires2fa || response?.requires_2fa || false;
      if (requires2fa) {
        // persist temp token into redux so VerifyOTP can use it even if navigation flow doesn't pass it
        const tt = response?.tempToken || response?.temp_token || response?.temp || null;
        try {
          thunkAPI.dispatch({ type: 'auth/setTempToken', payload: tt });
        } catch (e) {
          // ignore
        }
        return response;
      }

      // If there is a hard failure indicated by the API, reject
      if (response.auth === false || response.error) {
        return thunkAPI.rejectWithValue(response.message || response.error);
      }

      // If response contains access token(s), persist them immediately
      const access = response?.accessToken || response?.token || response?.data?.accessToken || response?.data?.token;
      const refresh = response?.refreshToken || response?.refresh || response?.data?.refreshToken || response?.data?.refresh;
      if (access) {
        try {
          setTokens(access, refresh || null);
          try { setAuthToken(access, refresh || null, 'local'); } catch (e) { }
        } catch (e) {
          // ignore storage errors
        }
      }

      return response; // normal successful login
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
      // verify-otp uses tempToken; skip attaching any stale Authorization header
      const response = await httpPostService("api/auth/verify-otp", data, { skipAuth: true });
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
      // resend-otp should not send Authorization header (uses temp token)
      const response = await httpPostService("api/auth/resend-otp", data, { skipAuth: true });
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
        try { setAuthToken(response.accessToken, response.refreshToken, 'local'); } catch (e) { }
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
      } catch (e) { }

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

// 2FA: enable/verify/disable
export const enable2FA = createAsyncThunk(
  "api/auth/enable2FA",
  async (_, thunkAPI) => {
    try {
      const response = await httpPostService("api/auth/2fa/enable");
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.message || "Failed to enable 2FA");
    }
  }
);

export const verify2FA = createAsyncThunk(
  "api/auth/verify2FA",
  async (data, thunkAPI) => {
    try {
      const response = await httpPostService("api/auth/2fa/verify", data);

      // If server returned fresh tokens, persist them for immediate use
      const access = response?.accessToken || response?.token;
      const refresh = response?.refreshToken || response?.refresh;
      if (access) {
        setTokens(access, refresh || null);
        try { setAuthToken(access, refresh || null, 'local'); } catch (e) { }
      }

      // Refresh profile in store so UI reflects 2FA enabled state
      try {
        thunkAPI.dispatch(getProfile());
      } catch (e) { }

      return response;
    } catch (error) {
      // If access token is expired/invalid, try refreshing using refresh token and retry once
      const status = error?.status || error?.response?.status;
      if (status === 401) {
        try {
          const storedRefresh = getRefreshToken();
          if (!storedRefresh) throw new Error('No refresh token available');

          const refreshResp = await httpPostService("api/auth/refresh", { refreshToken: storedRefresh });
          const newAccess = refreshResp?.accessToken || refreshResp?.token;
          const newRefresh = refreshResp?.refreshToken || refreshResp?.refresh || storedRefresh;
          if (newAccess) {
            // Persist new tokens and update axios header
            setTokens(newAccess, newRefresh || null);
            try { setAuthToken(newAccess, newRefresh || null, 'local'); } catch (e) { }
          }

          // Retry verify call once with refreshed token
          const retryResp = await httpPostService("api/auth/2fa/verify", data);

          // Persist tokens if returned on retry as well
          const retryAccess = retryResp?.accessToken || retryResp?.token;
          const retryRefresh = retryResp?.refreshToken || retryResp?.refresh;
          if (retryAccess) {
            setTokens(retryAccess, retryRefresh || null);
            try { setAuthToken(retryAccess, retryRefresh || null, 'local'); } catch (e) { }
          }

          // Refresh profile after successful verify
          try {
            thunkAPI.dispatch(getProfile());
          } catch (e) { }

          return retryResp;
        } catch (refreshError) {
          // Clear tokens and surface refresh error
          clearTokens();
          return thunkAPI.rejectWithValue(refreshError?.message || 'Session expired');
        }
      }

      return thunkAPI.rejectWithValue(error?.message || "Failed to verify 2FA token");
    }
  }
);

export const disable2FA = createAsyncThunk(
  "api/auth/disable2FA",
  async (_, thunkAPI) => {
    try {
      const response = await httpPostService("api/auth/2fa/disable");
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.message || "Failed to disable 2FA");
    }
  }
);

// Update profile thunk (PUT /api/auth/profile)
export const updateProfile = createAsyncThunk(
  "api/auth/updateProfile",
  async (formData, thunkAPI) => {
    try {
      // Check if it's FormData (file upload)
      const isFormData = formData instanceof FormData;

      const response = await (isFormData
        ? httpPutService("api/auth/profile", formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          skipContentType: true // Tell httpPutService NOT to override Content-Type
        })
        : httpPutService("api/auth/profile", formData)
      );

      return response;
    } catch (error) {
      console.error('Update profile error:', error); // ✅ Add logging
      return thunkAPI.rejectWithValue(error?.message || "Failed to update profile");
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
      // Use POST to /api/auth/change-password per API collection
      const response = await httpPostService("api/auth/change-password", data);
      return response;
    } catch (error) {
      const message = error?.message || "Password change failed.";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// ✅ ADD THIS - Complete logout with backend call
export const logoutUser = createAsyncThunk(
  "api/auth/apiLogout",
  async (_, thunkAPI) => {
    try {
      await httpPostService("api/auth/logout", {});
      console.log('✅ Backend logout called');
    } catch (error) {
      console.warn('⚠️ Logout API failed (OK):', error.message);
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
    setTempToken: (state, action) => {
      state.tempToken = action.payload;
    },
    logout: (state) => {
      console.log('🔥 LOGOUT - Full cleanup');

      // Clear Redux
      state.user = null;
      state.authError = null;
      state.status = null;
      state.tempToken = null;

      // ✅ NUCLEAR CLEANUP
      localStorage.clear();      // Everything gone
      sessionStorage.clear();    // Everything gone

      // Clear tokens
      clearTokens();

      // Clear cookies (best-effort) so Application > Cookies is empty
      try {
        if (typeof document !== 'undefined' && document.cookie) {
          document.cookie.split(';').forEach(function(c) {
            const idx = c.indexOf('=');
            const name = idx > -1 ? c.substr(0, idx).trim() : c.trim();
            if (!name) return;
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;';
          });
        }
      } catch (e) {}

      // Clear axios headers (multiple possible refs)
      try {
        if (window.api?.defaults?.headers?.common?.Authorization) {
          delete window.api.defaults.headers.common['Authorization'];
        }
        if (window.__API_CLIENT__?.defaults?.headers?.common?.Authorization) {
          delete window.__API_CLIENT__.defaults.headers.common['Authorization'];
        }
      } catch (e) { }
    },

    setOpenSidebar: (state, action) => {
      state.isSidebarOpen = action.payload;
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
        // If login returned access tokens, persist user and clear any tempToken
        const payload = action.payload || {};
        const access = payload?.accessToken || payload?.token || payload?.data?.accessToken || payload?.data?.token;
        const returnedUser = payload?.user || payload?.userInfo || payload?.data?.user || null;

        if (access) {
          // persist user if present
          if (returnedUser) {
            state.user = returnedUser;
            localStorage.setItem("userInfo", JSON.stringify(returnedUser));
          }
          state.tempToken = null;
        } else {
          // no access token -> likely OTP flow, store tempToken for VerifyOTP
          state.tempToken = payload?.tempToken || payload?.temp_token || payload?.temp || null;
        }
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
      // ✅ ADD THIS in extraReducers (before getProfile.fulfilled):
      .addCase(getProfile.pending, (state) => {
        state.status = "loading profile";
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        // backend may return { user: { ... } } or the user object directly
        const payloadUser = action.payload?.user || action.payload;
        state.user = payloadUser;
        state.authError = null;
        localStorage.setItem("userInfo", JSON.stringify(payloadUser));
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.authError = action.payload;
      })

      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.status = 'loading';
        state.authError = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // update local user
        const payloadUser = action.payload?.user || action.payload || null;
        if (payloadUser) {
          state.user = payloadUser;
          localStorage.setItem('userInfo', JSON.stringify(payloadUser));
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.authError = action.payload || action.error?.message;
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
      })
      // ✅ ADD THESE 3 CASES in extraReducers builder:
      .addCase(logoutUser .pending, (state) => {
        state.status = "logging out";
      })
      .addCase(logoutUser .fulfilled, (state) => {
        state.status = "logged out";
      })
      .addCase(logoutUser .rejected, (state) => {
        state.status = "logged out"; // Always succeed
      });
  },
});

// ✅ Actions
export const { setCredentials, setTempToken, logout, setOpenSidebar, clearTempToken } = authSlice.actions;

// ✅ Selectors
export const selectUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.authError;
export const selectTempToken = (state) => state.auth.tempToken;

// ✅ Reducer
export default authSlice.reducer;