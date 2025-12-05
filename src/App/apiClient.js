// import axios from "axios";
// import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "../utils/tokenService";

// const baseURL = import.meta.env.VITE_SERVERURL || "http://localhost:4000";

// const api = axios.create({
//   baseURL,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // Attach tenant id and authorization header
// api.interceptors.request.use((config) => {
//   try {
//     const tenantId = localStorage.getItem("tenantId") || import.meta.env.VITE_TENANT_ID;
//     if (tenantId) config.headers["x-tenant-id"] = tenantId;
//     const token = getAccessToken();
//     if (token) config.headers["Authorization"] = `Bearer ${token}`;
//   } catch (e) {
//     // ignore
//   }
//   return config;
// });

// let isRefreshing = false;
// let failedQueue = [];

// const processQueue = (error, token = null) => {
//   failedQueue.forEach((prom) => {
//     if (error) prom.reject(error);
//     else prom.resolve(token);
//   });
//   failedQueue = [];
// };

// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
//     if (error.response && error.response.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       if (isRefreshing) {
//         return new Promise(function (resolve, reject) {
//           failedQueue.push({ resolve, reject });
//         })
//           .then((token) => {
//             originalRequest.headers["Authorization"] = `Bearer ${token}`;
//             return api(originalRequest);
//           })
//           .catch((err) => Promise.reject(err));
//       }

//       isRefreshing = true;
//       const refreshToken = getRefreshToken();
//       if (!refreshToken) {
//         clearTokens();
//         isRefreshing = false;
//         return Promise.reject(error);
//       }

//       try {
//         const resp = await axios.post(
//           `${baseURL}/api/auth/refresh`,
//           { refreshToken },
//           { headers: { "x-tenant-id": localStorage.getItem("tenantId") || import.meta.env.VITE_TENANT_ID } }
//         );
//         const { accessToken, refreshToken: newRefresh } = resp.data;
//         setTokens(accessToken, newRefresh || refreshToken);
//         api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
//         processQueue(null, accessToken);
//         originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
//         return api(originalRequest);
//       } catch (err) {
//         processQueue(err, null);
//         clearTokens();
//         return Promise.reject(err);
//       } finally {
//         isRefreshing = false;
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;


import axios from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "../utils/tokenService";

// Use import.meta.env for Vite environment variables
const baseURL = import.meta.env.VITE_SERVERURL || "http://localhost:4000";
const defaultTenantId = import.meta.env.VITE_TENANT_ID || null;

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
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
  } catch (e) {
    // ignore
  }
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
        const resp = await axios.post(
          `${baseURL}/api/auth/refresh`,
          { refreshToken },
          { headers: { "x-tenant-id": tenantId } }
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
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;