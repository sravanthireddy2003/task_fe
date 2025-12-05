import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

import { setTokens, getAccessToken, getRefreshToken } from './utils/tokenService';
import { setAuthToken } from './App/httpHandler';
import store from './redux/store';
import { refreshToken } from './redux/slices/authSlice';

// Ensure tenantId default from environment is persisted for API calls
try {
  const defaultTenant = import.meta.env.VITE_TENANT_ID || null;
  if (defaultTenant && !localStorage.getItem('tenantId')) {
    localStorage.setItem('tenantId', defaultTenant);
  }
} catch (e) {}
  
// Bootstrapping sequence: load dev seed (if any), initialize tokens/axios, try silent refresh, then render
async function boot() {
  try {
    // Dev seed: if `src/dev/dev_token.js` exists, load and store token+user info (dev convenience)
    try {
      const mod = await import('./dev/dev_token');
      const seed = mod?.DEV_SEED;
      if (seed && seed.token) {
        try {
          setTokens(seed.token, seed.refreshToken || null, 'local');
          // store both canonical and legacy user keys to match app expectations
          localStorage.setItem('userInfo', JSON.stringify(seed.user));
          localStorage.setItem('user', JSON.stringify(seed.user));
          // also ensure legacy accessToken key exists for any legacy code
          localStorage.setItem('tm_access_token', seed.token);
          localStorage.setItem('accessToken', seed.token);
        } catch (e) {
          // ignore write errors
        }
      }
    } catch (e) {
      // no dev seed present — that's fine
    }

    // Initialize axios default auth header from persisted tokens so page reloads keep auth
    try {
      const access = getAccessToken();
      const refresh = getRefreshToken();
      if (access) {
        // set axios default Authorization header and ensure token storage is consistent
        setAuthToken(access, refresh || null, 'local');

        // Try a silent refresh on startup to ensure tokens are valid and refreshed if needed
        try {
          const res = await store.dispatch(refreshToken()).unwrap();
          // If refresh succeeded, tokens are updated by the thunk and axios header set in the thunk
        } catch (err) {
          // Refresh failed: tokens cleared in thunk; don't block render but user will be unauthenticated
          console.warn('Token refresh on startup failed', err);
        }
      }
    } catch (e) {
      // ignore
    }
  } finally {
    // Render the app after attempting the startup refresh so routes won't redirect prematurely
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

// <React.StrictMode>
{/* </React.StrictMode> */}