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

// Bootstrapping sequence: initialize tokens/axios, try silent refresh, then render
async function boot() {
  try {
    // Load dev seed if exists (optional)
    try {
      const mod = await import("./dev/dev_token");
      const seed = mod?.DEV_SEED;
      if (seed?.token) {
        setTokens(seed.token, seed.refreshToken || null, "local");
        localStorage.setItem("userInfo", JSON.stringify(seed.user));
        localStorage.setItem("user", JSON.stringify(seed.user));
        localStorage.setItem("tm_access_token", seed.token);
        localStorage.setItem("accessToken", seed.token);
      }
    } catch (e) {
      // no dev seed — ignore
    }

    // Initialize axios default Authorization header
    try {
      const access = getAccessToken();
      const refresh = getRefreshToken();
      if (access) {
        setAuthToken(access, refresh || null, "local");

        // Try silent refresh on startup
        try {
          await store.dispatch(refreshToken()).unwrap();
        } catch (err) {
          console.warn("Token refresh on startup failed", err);
        }
      }
    } catch (e) {
      // ignore
    }
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
