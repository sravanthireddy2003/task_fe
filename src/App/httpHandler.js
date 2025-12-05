

// httpHandler.js
import api from "./apiClient";
import { setTokens, clearTokens, getAccessToken } from "../utils/tokenService";

const defaultTenantId = import.meta.env.VITE_TENANT_ID || null;

const getTenantFromStorage = () => {
    try {
        const tenantFromLocal = localStorage.getItem('tenantId');
        if (tenantFromLocal) return tenantFromLocal;

        const userJson = localStorage.getItem('userInfo') || localStorage.getItem('user');
        if (userJson) {
            const user = JSON.parse(userJson);
            // possible tenant keys
            return user?.tenantId || user?.tenant_id || user?.public_id || user?.publicId || user?.tenant || user?.company || null;
        }
    } catch (e) {
        // ignore
    }
    return null;
}

export async function httpPostService(url, data, config = {}) {
    try {
        const token = getAccessToken();
        const tenantId = localStorage.getItem("tenantId") || getTenantFromStorage() || defaultTenantId;
        const headers = Object.assign({}, config.headers || {});
        if (tenantId) headers["x-tenant-id"] = tenantId;
        if (token) headers["Authorization"] = `Bearer ${token}`;
        else console.warn(`[httpPostService] no access token found for request to ${url}`);
        const resp = await api.post(`/${url}`.replace(/^\/+/, ""), data, { ...config, headers });
        return resp.data;
    } catch (error) {
        throw formatAxiosError(error);
    }
}

export async function httpDeleteService(url, config = {}) {
    try {
        const token = getAccessToken();
        const tenantId = localStorage.getItem("tenantId") || getTenantFromStorage() || defaultTenantId;
        const headers = Object.assign({}, config.headers || {});
        if (tenantId) headers["x-tenant-id"] = tenantId;
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const resp = await api.delete(`/${url}`.replace(/^\/+/, ""), { ...config, headers });
        return resp.data;
    } catch (error) {
        throw formatAxiosError(error);
    }
}

export async function httpPatchService(url, data, config = {}) {
    try {
        const token = getAccessToken();
        const tenantId = localStorage.getItem("tenantId") || getTenantFromStorage() || defaultTenantId;
        const headers = Object.assign({}, config.headers || {});
        if (tenantId) headers["x-tenant-id"] = tenantId;
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const resp = await api.patch(`/${url}`.replace(/^\/+/, ""), data, { ...config, headers });
        return resp.data;
    } catch (error) {
        throw formatAxiosError(error);
    }
}
    
export async function httpPutService(url, data, config = {}) {
    try {
        const token = getAccessToken();
        const tenantId = localStorage.getItem("tenantId") || getTenantFromStorage() || defaultTenantId;
        const headers = Object.assign({}, config.headers || {});
        if (tenantId) headers["x-tenant-id"] = tenantId;
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const resp = await api.put(`/${url}`.replace(/^\/+/, ""), data, { ...config, headers });
        return resp.data;
    } catch (error) {
        throw formatAxiosError(error);
    }
}

export async function httpGetService(url, config = {}) {
    try {
        const token = getAccessToken();
        const tenantId = localStorage.getItem("tenantId") || getTenantFromStorage() || defaultTenantId;
        const headers = Object.assign({}, config.headers || {});
        if (tenantId) headers["x-tenant-id"] = tenantId;
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const resp = await api.get(`/${url}`.replace(/^\/+/, ""), { ...config, headers });
        return resp.data;
    } catch (error) {
        throw formatAxiosError(error);
    }
}

const formatAxiosError = (error) => {
    if (error.response) {
    // Normalize axios error into a plain object with useful fields
    try {
        if (error && error.response) {
            return {
                message: error.response.data?.message || error.response.data?.error || error.message || 'Request failed',
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers,
            };
        }

        if (error && error.request) {
            return {
                message: 'No response received from server',
                status: null,
                data: null,
            };
        }
    } catch (e) {
        // fallback
    }

    return { message: error?.message || 'Unknown error', status: null };
    }
    if (error.request) {
        return { message: "No response from server" };
    }
    return { message: error.message };
};

// Helper functions for token management — delegate to tokenService to keep keys consistent
export const setAuthToken = (accessToken, refreshToken = null, storageType = 'local') => {
    setTokens(accessToken, refreshToken, storageType === 'session' ? 'session' : 'local');
    try {
        if (accessToken) {
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } else {
            delete api.defaults.headers.common['Authorization'];
        }
    } catch (e) {
        // ignore
    }
};

export const clearAuthTokens = () => {
    clearTokens();
    try {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
            // also clear axios default auth header if set
            try { delete api.defaults.headers.common['Authorization']; } catch (e) {}
    } catch (e) {}
};