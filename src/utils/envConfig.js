// Centralized environment configuration for API and socket URLs
// Note: With Vite, only variables prefixed with VITE_ are exposed to the client

export const API_BASE_URL =
  import.meta.env.VITE_SERVERURL ||
  import.meta.env.VITE_API_BASE_URL ||
  // REACT_APP_* is supported for compatibility but will be undefined
  import.meta.env.REACT_APP_API_BASE_URL ||
  "";

export const TENANT_ID_FALLBACK = import.meta.env.VITE_TENANT_ID || "";

export const WS_BASE_URL =
  import.meta.env.VITE_WS_URL ||
  API_BASE_URL;
