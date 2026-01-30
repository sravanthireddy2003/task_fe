import axios from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "../utils/tokenService";
import { API_BASE_URL, TENANT_ID_FALLBACK } from "../utils/envConfig";

const baseURL = API_BASE_URL;
const defaultTenantId = TENANT_ID_FALLBACK || null;

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach tenant id and authorization header
api.interceptors.request.use((config) => {
  try {
    const tenantId = localStorage.getItem("tenantId") || defaultTenantId;
    if (tenantId) config.headers["x-tenant-id"] = tenantId;
    const token = getAccessToken();
    // Do NOT attach Authorization for refresh endpoint
    const url = config?.url || '';
    const isRefresh = typeof url === 'string' && /\/auth\/refresh/i.test(url);
    if (token && !isRefresh) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  try {
    // Log method/url and whether auth header is present (mask token)
    const safeHeaders = {};
    if (config && config.headers) {
      Object.keys(config.headers).forEach((k) => {
        if (/authorization/i.test(k)) {
          const val = config.headers[k];
          safeHeaders[k] = typeof val === 'string' ? (val.length > 20 ? `${val.slice(0,10)}...${val.slice(-6)}` : val) : val;
        } else {
          safeHeaders[k] = config.headers[k];
        }
      });
    }
    console.debug('[apiClient] request ->', { method: (config && config.method) || 'get', url: config.url, headers: safeHeaders });
  } catch (e) {}
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const tenantId = localStorage.getItem("tenantId") || defaultTenantId;
        // Send refresh token in body (align with authSlice refresh flow)
        // Use a "naked" axios instance with no default Authorization
        const nakedAxios = axios.create();
        const resp = await nakedAxios.post(
          `${baseURL}/api/auth/refresh`,
          { refreshToken },
          { 
            headers: { 
              "Content-Type": "application/json",
              "x-tenant-id": tenantId
            } 
          }
        );
        // Support backend returning either { accessToken, refreshToken } or { token, refreshToken }
        const newAccess = resp.data?.accessToken || resp.data?.token || null;
        const newRefresh = resp.data?.refreshToken || resp.data?.refresh || null;
        if (newAccess) {
          setTokens(newAccess, newRefresh || refreshToken);
          api.defaults.headers.common["Authorization"] = `Bearer ${newAccess}`;
          processQueue(null, newAccess);
          originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
        // If no access token was returned, treat as failure
        throw new Error('No access token returned from refresh');
      } catch (err) {
        processQueue(err, null);
        clearTokens();
        // Dispatch logout event when refresh fails
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'refresh_failed' } }));
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;