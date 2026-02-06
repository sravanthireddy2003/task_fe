

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
            // If sending multipart FormData, let axios set the correct Content-Type/boundary
            if (typeof FormData !== 'undefined' && data instanceof FormData) {
                // remove any forced content-type so axios can set multipart boundary
                if (headers['Content-Type']) delete headers['Content-Type'];
                if (headers['content-type']) delete headers['content-type'];
            }
        if (tenantId) headers["x-tenant-id"] = tenantId;
        // allow callers to skip attaching Authorization (for verify-otp/resend flows)
        if (!config.skipAuth && token) {
            headers["Authorization"] = `Bearer ${token}`;
        } else if (!config.skipAuth && !token) {
            // Only warn when we expected an auth header but no token was available
            console.warn(`[httpPostService] no access token found for request to ${url}`);
        }
        console.debug('[httpPostService] POST', url, { tenantId, hasToken: !!token });
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
        if (!config.skipAuth && token) headers["Authorization"] = `Bearer ${token}`;
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
        if (!config.skipAuth && token) headers["Authorization"] = `Bearer ${token}`;
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
        if (!config.skipAuth && token) headers["Authorization"] = `Bearer ${token}`;
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
        if (!config.skipAuth && token) headers["Authorization"] = `Bearer ${token}`;
        console.debug('[httpGetService] GET', url, { tenantId, hasToken: !!token });
        const resp = await api.get(`/${url}`.replace(/^\/+/, ""), { ...config, headers });
        return resp.data;
    } catch (error) {
        throw formatAxiosError(error);
    }
}

const formatAxiosError = (error) => {
    if (error.response) {
        return error.response.data || { message: error.response.statusText };
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