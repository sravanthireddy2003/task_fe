
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  httpPostService,
  httpPatchService,
  httpPutService,
  httpGetService,
} from "../../App/httpHandler";
import { setTokens, clearTokens, getRefreshToken, getAccessToken } from "../../utils/tokenService";
import fetchWithTenant from "../../utils/fetchWithTenant";
import { setAuthToken } from "../../App/httpHandler";

// ✅ Safely parse user from localStorage
let userInfo = null;
try {
  const storedUser = localStorage.getItem("userInfo");
  userInfo = storedUser && storedUser !== "undefined" ? JSON.parse(storedUser) : null;
} catch (e) {
  userInfo = null;
}

// Load sidebar collapsed state
let persistedCollapsed = false;
try {
  const sc = localStorage.getItem("sidebarCollapsed");
  persistedCollapsed = sc === "true";
} catch (e) { }

// ✅ Add timestamp tracking to localStorage
let lastTokenCheckTime = 0;
let lastProfileFetchTime = 0;
try {
  lastTokenCheckTime = parseInt(localStorage.getItem("lastTokenCheckTime") || "0");
  lastProfileFetchTime = parseInt(localStorage.getItem("lastProfileFetchTime") || "0");
} catch (e) { }

const initialState = {
  user: userInfo,
  tempToken: null,
  isSidebarOpen: false,
  isSidebarCollapsed: persistedCollapsed,
  status: null,
  error: null,
  authError: null,
  users: {},
  profileLoading: false,
  profileError: null,
  profileFetched: false,
  lastTokenCheck: lastTokenCheckTime,
  lastProfileFetch: lastProfileFetchTime,
  isTokenValidating: false,
  isProfileFetching: false,
};

// Helper to handle authentication errors
const handleAuthError = (error, thunkAPI) => {
  const status = error?.response?.status;

  if (status === 401) {
    // Let refresh token logic handle it
    return thunkAPI.rejectWithValue("Token expired");
  }

  // For other errors, use the existing error handling
  return thunkAPI.rejectWithValue(
    error?.response?.data?.message || error?.message || "Request failed"
  );
};

// ✅ Ensure valid token before making requests - WITH THROTTLING
export const ensureValidToken = createAsyncThunk(
  "api/auth/ensureValidToken",
  async (_, thunkAPI) => {
    try {
      const refreshToken = getRefreshToken();

      // Always try to refresh token on app start if refresh token exists
      if (refreshToken) {
        try {
          const refreshResp = await httpPostService("api/auth/refresh", {
            refreshToken: refreshToken
          }, {
            skipAuth: true
          });

          if (refreshResp?.accessToken) {
            // Persist new tokens
            setTokens(refreshResp.accessToken, refreshResp.refreshToken);
            setAuthToken(refreshResp.accessToken, refreshResp.refreshToken, 'local');

            thunkAPI.dispatch(setTokenValidating(false));
            return true;
          }
        } catch (refreshError) {
          thunkAPI.dispatch(setTokenValidating(false));
          return false;
        }
      }

      // If no refresh token, check if we have an access token
      const accessToken = getAccessToken();
      thunkAPI.dispatch(setTokenValidating(false));
      return !!accessToken;
    } catch (error) {
      thunkAPI.dispatch(setTokenValidating(false));
      return false;
    }
  }
);

// ✅ Login thunk
export const authLogin = createAsyncThunk(
  "api/auth/login",
  async (data, thunkAPI) => {
    try {
      const response = await httpPostService("api/auth/login", data);

      if (!response) return thunkAPI.rejectWithValue("No response from server");

      const requires2fa = response?.requires2fa || response?.requires_2fa || false;
      if (requires2fa) {
        const tt = response?.tempToken || response?.temp_token || response?.temp || null;
        try {
          thunkAPI.dispatch({ type: 'auth/setTempToken', payload: tt });
        } catch (e) {
          // ignore
        }
        return response;
      }

      if (response.auth === false || response.error) {
        return thunkAPI.rejectWithValue(response.message || response.error);
      }

      const access = response?.accessToken || response?.token || response?.data?.accessToken || response?.data?.token;
      const refresh = response?.refreshToken || response?.refresh || response?.data?.refreshToken || response?.data?.refresh;

      if (access) {
        try {
          setTokens(access, refresh || null);
          setAuthToken(access, refresh || null, 'local');

          // Update timestamps
          const now = Date.now();
          thunkAPI.dispatch(setLastTokenCheck(now));
          thunkAPI.dispatch(setLastProfileFetch(now));
          localStorage.setItem("lastTokenCheckTime", now.toString());
          localStorage.setItem("lastProfileFetchTime", now.toString());
        } catch (e) {
          // ignore storage errors
        }
      }

      return response;
    } catch (error) {
      const message =
        error?.message ||
        error?.data?.message ||
        error?.error ||
        (typeof error === 'string' ? error : "Login failed. Please try again.");
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Verify OTP thunk
export const verifyOtp = createAsyncThunk(
  "api/auth/verifyOtp",
  async (data, thunkAPI) => {
    try {
      const response = await httpPostService("api/auth/verify-otp", data, { skipAuth: true });

      const access = response?.accessToken || response?.token;
      const refresh = response?.refreshToken || response?.refresh;

      if (access) {
        setTokens(access, refresh || null);
        setAuthToken(access, refresh || null, 'local');

        // Update timestamps
        const now = Date.now();
        thunkAPI.dispatch(setLastTokenCheck(now));
        thunkAPI.dispatch(setLastProfileFetch(now));
        localStorage.setItem("lastTokenCheckTime", now.toString());
        localStorage.setItem("lastProfileFetchTime", now.toString());
      }

      return response;
    } catch (error) {
      const msg = error?.message || "OTP verification failed";
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Resend OTP thunk
export const resendOtp = createAsyncThunk(
  "api/auth/resendOtp",
  async (data, thunkAPI) => {
    try {
      const response = await httpPostService("api/auth/resend-otp", data, { skipAuth: true });
      return response;
    } catch (error) {
      const msg = error?.message || error?.error || "Failed to resend OTP";
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Refresh token thunk
// CORRECT refreshToken thunk
export const refreshToken = createAsyncThunk(
  "api/auth/refreshToken",
  async (_, thunkAPI) => {
    try {
      const storedRefresh = getRefreshToken();

      if (!storedRefresh) {
        return thunkAPI.rejectWithValue("No refresh token available");
      }

      // ✅ Send refresh token in BODY (not header)
      const response = await httpPostService("api/auth/refresh", {
        refreshToken: storedRefresh  // In body
      }, {
        skipAuth: true  // Don't add Authorization header
      });

      // Support backend returning either { accessToken, refreshToken } or { token, refreshToken }
      const newAccess = response?.accessToken || response?.token || null;
      const newRefresh = response?.refreshToken || response?.refresh || storedRefresh;

      if (newAccess) {
        setTokens(newAccess, newRefresh);
        setAuthToken(newAccess, newRefresh, 'local');

        // Update timestamps
        const now = Date.now();
        thunkAPI.dispatch(setLastTokenCheck(now));
        localStorage.setItem("lastTokenCheckTime", now.toString());

        return response;
      } else {
        return thunkAPI.rejectWithValue("No access token returned from refresh");
      }
    } catch (error) {

      const status = error?.status || error?.response?.status;
      if (status === 401) {
        clearTokens();
        return thunkAPI.rejectWithValue('Session expired. Please login again.');
      }
      if (status === 404) {
        clearTokens();
        return thunkAPI.rejectWithValue('Refresh endpoint not found (404)');
      }

      clearTokens();
      return thunkAPI.rejectWithValue(error?.message || "Refresh failed");
    }
  }
);

export const getProfile = createAsyncThunk(
  "api/auth/getProfile",
  async (_, thunkAPI) => {
    try {
      const { auth } = thunkAPI.getState();

      // 🚨 FIX: Instead of rejecting, just skip or wait
      if (auth.profileLoading || auth.isProfileFetching) {
        return null;
      }

      thunkAPI.dispatch(setProfileFetching(true));
      const response = await httpGetService("api/auth/profile");

      // Update timestamp
      const now = Date.now();
      thunkAPI.dispatch(setLastProfileFetch(now));
      localStorage.setItem("lastProfileFetchTime", now.toString());

      thunkAPI.dispatch(setProfileFetching(false));
      return response;
    } catch (error) {
      thunkAPI.dispatch(setProfileFetching(false));
      // 🚨 FIX: Don't reject with string, reject with error object
      return thunkAPI.rejectWithValue(error);
    }
  }
);


export const getProfileSilently = createAsyncThunk(
  "api/auth/getProfileSilently",
  async (_, thunkAPI) => {
    try {
      const { auth } = thunkAPI.getState();

      // ✅ THROTTLING: Only fetch every 5 minutes
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (now - auth.lastProfileFetch < fiveMinutes && auth.user) {
        // Skip if recently fetched and we have user data
        return null;
      }

      // 🚨 FIX: Skip if already fetching, don't reject
      if (auth.isProfileFetching || auth.profileLoading) {
        return null;
      }

      thunkAPI.dispatch(setProfileFetching(true));

      // Use existing access token
      const response = await httpGetService("api/auth/profile");

      // Update timestamp
      thunkAPI.dispatch(setLastProfileFetch(now));
      localStorage.setItem("lastProfileFetchTime", now.toString());

      thunkAPI.dispatch(setProfileFetching(false));
      return response;
    } catch (error) {
      thunkAPI.dispatch(setProfileFetching(false));
      return thunkAPI.rejectWithValue(null);
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

      const access = response?.accessToken || response?.token;
      const refresh = response?.refreshToken || response?.refresh;

      if (access) {
        setTokens(access, refresh || null);
        setAuthToken(access, refresh || null, 'local');

        // Update timestamps
        const now = Date.now();
        thunkAPI.dispatch(setLastTokenCheck(now));
        thunkAPI.dispatch(setLastProfileFetch(now));
        localStorage.setItem("lastTokenCheckTime", now.toString());
        localStorage.setItem("lastProfileFetchTime", now.toString());
      }

      // Refresh profile
      try {
        await thunkAPI.dispatch(getProfile()).unwrap();
      } catch (e) { }

      return response;
    } catch (error) {
      const status = error?.status || error?.response?.status;
      if (status === 401) {
        try {
          const storedRefresh = getRefreshToken();
          if (!storedRefresh) throw new Error('No refresh token available');

          const refreshResp = await httpPostService("api/auth/refresh", {
            refreshToken: storedRefresh
          }, {
            skipAuth: true
          });
          const newAccess = refreshResp?.accessToken || refreshResp?.token;
          const newRefresh = refreshResp?.refreshToken || refreshResp?.refresh || storedRefresh;

          if (newAccess) {
            setTokens(newAccess, newRefresh || null);
            setAuthToken(newAccess, newRefresh || null, 'local');

            // Update timestamp
            const now = Date.now();
            thunkAPI.dispatch(setLastTokenCheck(now));
            localStorage.setItem("lastTokenCheckTime", now.toString());
          }

          const retryResp = await httpPostService("api/auth/2fa/verify", data);
          const retryAccess = retryResp?.accessToken || retryResp?.token;
          const retryRefresh = retryResp?.refreshToken || retryResp?.refresh;

          if (retryAccess) {
            setTokens(retryAccess, retryRefresh || null);
            setAuthToken(retryAccess, retryRefresh || null, 'local');
          }

          try {
            await thunkAPI.dispatch(getProfile()).unwrap();
          } catch (e) { }

          return retryResp;
        } catch (refreshError) {
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

// Update profile thunk
export const updateProfile = createAsyncThunk(
  "api/auth/updateProfile",
  async (formData, thunkAPI) => {
    try {
      const isFormData = formData instanceof FormData;
      const response = await (isFormData
        ? httpPutService("api/auth/profile", formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          skipContentType: true
        })
        : httpPutService("api/auth/profile", formData)
      );

      // Update profile fetch timestamp
      const now = Date.now();
      thunkAPI.dispatch(setLastProfileFetch(now));
      localStorage.setItem("lastProfileFetchTime", now.toString());

      return response;
    } catch (error) {
      console.error('Update profile error:', error);
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

// Google login thunk
export const authGoogleLogin = createAsyncThunk(
  "api/auth/googleLogin",
  async (code, thunkAPI) => {
    try {
      const response = await httpGetService(`api/auth/googleLogin?code=${code}`);

      // Update timestamps
      const now = Date.now();
      thunkAPI.dispatch(setLastTokenCheck(now));
      thunkAPI.dispatch(setLastProfileFetch(now));
      localStorage.setItem("lastTokenCheckTime", now.toString());
      localStorage.setItem("lastProfileFetchTime", now.toString());

      return response.user;
    } catch (error) {
      const errorMessage = error?.message || error?.error || "Failed to login with Google";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Register thunk
export const authRegister = createAsyncThunk(
  "api/auth/register",
  async (data, thunkAPI) => {
    try {
      const response = await httpPostService("api/auth/register", data);
      return response;
    } catch (error) {
      const message = error?.message || error?.error || "Registration failed.";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Change password thunk
export const changePassword = createAsyncThunk(
  "api/auth/changePassword",
  async (data, thunkAPI) => {
    try {
      const response = await httpPostService("api/auth/change-password", data);
      return response;
    } catch (error) {
      const message = error?.message || "Password change failed.";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Complete logout
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
      const userData = action.payload;
      state.user = {
        ...userData,
        modules: Array.isArray(userData.modules) ? userData.modules : [],
        sidebar: Array.isArray(userData.sidebar) ? userData.sidebar : [],
      };
      localStorage.setItem("userInfo", JSON.stringify(state.user));
    },
    setTempToken: (state, action) => {
      state.tempToken = action.payload;
    },
    setSidebarCollapsed: (state, action) => {
      state.isSidebarCollapsed = action.payload;
      try {
        localStorage.setItem('sidebarCollapsed', action.payload ? 'true' : 'false');
      } catch (e) { }
    },
    setLastTokenCheck: (state, action) => {
      state.lastTokenCheck = action.payload;
    },
    setLastProfileFetch: (state, action) => {
      state.lastProfileFetch = action.payload;
    },
    setTokenValidating: (state, action) => {
      state.isTokenValidating = action.payload;
    },
    setProfileFetching: (state, action) => {
      state.isProfileFetching = action.payload;
    },
    logout: (state) => {
      console.log('🔥 LOGOUT - Full cleanup');
      state.user = null;
      state.authError = null;
      state.status = null;
      state.tempToken = null;
      state.profileFetched = false;
      state.lastTokenCheck = 0;
      state.lastProfileFetch = 0;
      state.isTokenValidating = false;
      state.isProfileFetching = false;

      // Clear all localStorage items
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userInfo");

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear tokens
      clearTokens();

      // Clear cookies
      try {
        if (typeof document !== 'undefined' && document.cookie) {
          document.cookie.split(';').forEach(function (c) {
            const idx = c.indexOf('=');
            const name = idx > -1 ? c.substr(0, idx).trim() : c.trim();
            if (!name) return;
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;';
          });
        }
      } catch (e) { }

      // Clear API headers
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

        const payload = action.payload || {};
        const returnedUser = payload.user || payload.userInfo || payload.data?.user || null;

        if (returnedUser) {
          // Merge top-level modules/metrics/resources from response into user object
          const mergedModules = Array.isArray(returnedUser.modules)
            ? returnedUser.modules
            : Array.isArray(payload.modules)
              ? payload.modules
              : [];

          state.user = {
            ...returnedUser,
            modules: mergedModules,
            metrics: payload.metrics || returnedUser.metrics || null,
            resources: payload.resources || returnedUser.resources || null,
            sidebar: Array.isArray(returnedUser.sidebar)
              ? returnedUser.sidebar
              : Array.isArray(payload.sidebar)
                ? payload.sidebar
                : [],
          };
          localStorage.setItem("userInfo", JSON.stringify(state.user));
        }

        state.tempToken = payload.tempToken || payload.temp_token || payload.temp || null;
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
        const payloadUser = action.payload?.user || action.payload?.userInfo || action.payload;
        if (payloadUser) {
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
        if (action.payload?.tempToken || action.payload?.temp_token) {
          state.tempToken = action.payload.tempToken || action.payload.temp_token;
        }
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.status = "failed";
        state.authError = action.payload;
      })

      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.status = "loading profile";
        state.profileLoading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        const payloadUser = action.payload?.user || action.payload;
        state.user = payloadUser;
        state.authError = null;
        state.profileLoading = false;
        state.profileFetched = true;
        localStorage.setItem("userInfo", JSON.stringify(payloadUser));
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.authError = action.payload;
        state.profileLoading = false;
        state.isProfileFetching = false;
      })

      // Get Profile Silently
      .addCase(getProfileSilently.pending, (state) => {
        // Don't set loading state for silent requests
        state.isProfileFetching = true;
      })
      .addCase(getProfileSilently.fulfilled, (state, action) => {
        const payloadUser = action.payload?.user || action.payload;
        if (payloadUser) {
          state.user = {
            ...payloadUser,
            modules: Array.isArray(payloadUser.modules) ? payloadUser.modules : [],
          };
          localStorage.setItem("userInfo", JSON.stringify(state.user));
        }
        state.isProfileFetching = false;
      })
      .addCase(getProfileSilently.rejected, (state) => {
        state.isProfileFetching = false;
      })

      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.status = 'loading';
        state.authError = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const payloadUser = action.payload?.user || action.payload || null;
        if (payloadUser) {
          state.user = {
            ...state.user,
            ...payloadUser,
            // Ensure array fields are preserved if not provided in update
            modules: payloadUser.modules || state.user?.modules || [],
            sidebar: payloadUser.sidebar || state.user?.sidebar || [],
          };
          localStorage.setItem('userInfo', JSON.stringify(state.user));
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

      // Refresh token
      .addCase(refreshToken.rejected, (state) => {
        state.tempToken = null;
        state.authError = "Session expired";
      })

      // Logout User
      .addCase(logoutUser.pending, (state) => {
        state.status = "logging out";
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = "logged out";
      })
      .addCase(logoutUser.rejected, (state) => {
        state.status = "logged out";
      })

      // Ensure Valid Token
      .addCase(ensureValidToken.pending, (state) => {
        state.isTokenValidating = true;
      })
      .addCase(ensureValidToken.fulfilled, (state, action) => {
        state.isTokenValidating = false;
      })
      .addCase(ensureValidToken.rejected, (state) => {
        state.isTokenValidating = false;
      })

      .addCase(refreshToken.fulfilled, (state, action) => {
        if (action.payload?.data?.user) {
          // Merge with existing user to preserve modules/sidebar
          state.user = {
            ...state.user,
            ...action.payload.data.user
          };
          localStorage.setItem("userInfo", JSON.stringify(state.user));
        }
      });
  },
});

// ✅ Actions
export const {
  setCredentials,
  setTempToken,
  logout,
  setOpenSidebar,
  setSidebarCollapsed,
  clearTempToken,
  clearProfileError,
  setLastTokenCheck,
  setLastProfileFetch,
  setTokenValidating,
  setProfileFetching,
} = authSlice.actions;

// ✅ Selectors
export const selectUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.authError;
export const selectTempToken = (state) => state.auth.tempToken;
export const selectProfileLoading = (state) => state.auth.profileLoading;
export const selectProfileError = (state) => state.auth.profileError;
export const selectProfileFetched = (state) => state.auth.profileFetched;
export const selectUserModules = (state) => state.auth.user?.modules || [];
export const selectLastTokenCheck = (state) => state.auth.lastTokenCheck;
export const selectLastProfileFetch = (state) => state.auth.lastProfileFetch;
export const selectIsTokenValidating = (state) => state.auth.isTokenValidating;
export const selectIsProfileFetching = (state) => state.auth.isProfileFetching;

// ✅ Reducer
export default authSlice.reducer;