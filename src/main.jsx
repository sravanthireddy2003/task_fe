import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
 
import store from "./redux/store";
import { DEV_SEED } from "./dev/dev_token";
import { getAccessToken, getRefreshToken, setTokens } from './utils/tokenService';
import { setAuthToken } from './App/httpHandler';
import { refreshToken } from './redux/slices/authSlice';
import { initWorkflowSocket } from './socket/initWorkflowSocket';
import { API_BASE_URL, TENANT_ID_FALLBACK } from './utils/envConfig';
 
// Ensure tenantId default from environment is persisted for API calls
try {
  const defaultTenant = TENANT_ID_FALLBACK || null;
  if (defaultTenant && !localStorage.getItem("tenantId")) {
    localStorage.setItem("tenantId", defaultTenant);
  }
} catch (e) {}
 
// ✅ FIXED: Bootstrapping sequence - NO DEV TOKEN AUTO-LOGIN (gated by env flag)
async function boot() {
  try {
    // Wrap global fetch to automatically attach Authorization and x-tenant-id for API calls
    try {
      const originalFetch = window.fetch.bind(window);
      const baseURL = API_BASE_URL || '';
      window.fetch = async (input, init = {}) => {
        try {
          let url = typeof input === 'string' ? input : input.url;
          const isApiCall = url && (url.startsWith(baseURL) || url.startsWith('/api') || url.includes('/api/'));
          const headers = new Headers(init.headers || (typeof input === 'object' && input.headers) || {});
          const token = getAccessToken();
          const tenant = localStorage.getItem('tenantId') || TENANT_ID_FALLBACK || '';
          if (isApiCall) {
            if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
            if (tenant && !headers.has('x-tenant-id')) headers.set('x-tenant-id', tenant);
          }
          const newInit = { ...init, headers };
          return await originalFetch(input, newInit);
        } catch (e) {
          return await originalFetch(input, init);
        }
      };
    } catch (e) {}
    // ✅ STEP 1: Load existing tokens OR use dev seed for development (only when explicitly enabled)
    let access = getAccessToken();
    let refresh = getRefreshToken();
    
    const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
    const useDevSeed = typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_USE_DEV_SEED === 'true');
    // Use dev seed only if: no tokens, running in dev, and flag enabled
    if (!access && isDev && useDevSeed && DEV_SEED) {
      access = DEV_SEED.token;
      refresh = DEV_SEED.refreshToken;
      setTokens(access, refresh, 'local');
      try {
        localStorage.setItem('userInfo', JSON.stringify(DEV_SEED.user));
      } catch (e) {}
    }
   
    if (access) {
      setAuthToken(access, refresh || null, "local");
 
      // ✅ STEP 2: Try silent refresh ONLY if valid token exists
      try {
        await store.dispatch(refreshToken()).unwrap();
      } catch (err) {
        // ✅ Clear invalid tokens on refresh fail
        localStorage.removeItem("tm_access_token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("tm_refresh_token");
        localStorage.removeItem("refreshToken");
        // Also clear any dev/user seed to avoid stale identity on reload
        localStorage.removeItem("userInfo");
      }
    }
    // ✅ NO DEV SEED - Let user login normally
  } finally {
    // initialize workflow socket after store is ready
    try {
      initWorkflowSocket(store);
    } catch (e) {}

    ReactDOM.createRoot(document.getElementById("root")).render(
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    );
  }
}
 
boot();
 