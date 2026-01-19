import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
 
import store from "./redux/store";
import { setTokens, getAccessToken, getRefreshToken } from "./utils/tokenService";
import { setAuthToken } from "./App/httpHandler";
import { refreshToken } from "./redux/slices/authSlice";
 
// Ensure tenantId default from environment is persisted for API calls
try {
  const defaultTenant = import.meta.env.VITE_TENANT_ID || null;
  if (defaultTenant && !localStorage.getItem("tenantId")) {
    localStorage.setItem("tenantId", defaultTenant);
  }
} catch (e) {}
 
// ✅ FIXED: Bootstrapping sequence - NO DEV TOKEN AUTO-LOGIN
async function boot() {
  try {
    // Wrap global fetch to automatically attach Authorization and x-tenant-id for API calls
    try {
      const originalFetch = window.fetch.bind(window);
      const baseURL = import.meta.env.VITE_SERVERURL || '';
      window.fetch = async (input, init = {}) => {
        try {
          let url = typeof input === 'string' ? input : input.url;
          const isApiCall = url && (url.startsWith(baseURL) || url.startsWith('/api') || url.includes('/api/'));
          const headers = new Headers(init.headers || (typeof input === 'object' && input.headers) || {});
          const token = getAccessToken();
          const tenant = localStorage.getItem('tenantId') || import.meta.env.VITE_TENANT_ID || '';
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
    } catch (e) {
      console.warn('Could not patch global fetch to auto-attach tokens', e);
    }
    // ✅ STEP 1: ONLY load existing tokens from localStorage (NO dev seed)
    const access = getAccessToken();
    const refresh = getRefreshToken();
   
    if (access) {
      setAuthToken(access, refresh || null, "local");
 
      // ✅ STEP 2: Try silent refresh ONLY if valid token exists
      try {
        await store.dispatch(refreshToken()).unwrap();
      } catch (err) {
        console.warn("Token refresh on startup failed", err);
        // ✅ Clear invalid tokens on refresh fail
        localStorage.removeItem("tm_access_token");
        localStorage.removeItem("accessToken");
      }
    }
    // ✅ NO DEV SEED - Let user login normally
  } finally {
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
 