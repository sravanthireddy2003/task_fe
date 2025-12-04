// import api from "./apiClient";

// export async function httpPostService(url, data, config = {}) {
//     try {
//         const resp = await api.post(`/${url}`.replace(/^\/+/, ""), data, config);
//         return resp.data;
//     } catch (error) {
//         throw formatAxiosError(error);
//     }
// }

// export async function httpDeleteService(url, config = {}) {
//     try {
//         const resp = await api.delete(`/${url}`.replace(/^\/+/, ""), config);
//         return resp.data;
//     } catch (error) {
//         throw formatAxiosError(error);
//     }
// }

// export async function httpPatchService(url, data, config = {}) {
//     try {
//         const resp = await api.patch(`/${url}`.replace(/^\/+/, ""), data, config);
//         return resp.data;
//     } catch (error) {
//         throw formatAxiosError(error);
//     }
// }

// export async function httpPutService(url, data, config = {}) {
//     try {
//         const resp = await api.put(`/${url}`.replace(/^\/+/, ""), data, config);
//         return resp.data;
//     } catch (error) {
//         throw formatAxiosError(error);
//     }
// }

// export async function httpGetService(url, config = {}) {
//     try {
//         const resp = await api.get(`/${url}`.replace(/^\/+/, ""), config);
//         return resp.data;
//     } catch (error) {
//         throw formatAxiosError(error);
//     }
// }

// const formatAxiosError = (error) => {
//     if (error.response) {
//         return error.response.data || { message: error.response.statusText };
//     }
//     if (error.request) {
//         return { message: "No response from server" };
//     }
//     return { message: error.message };
// };


// httpHandler.js
import api from "./apiClient";

export async function httpPostService(url, data, config = {}) {
    try {
        const resp = await api.post(`/${url}`.replace(/^\/+/, ""), data, config);
        return resp.data;
    } catch (error) {
        throw formatAxiosError(error);
    }
}

export async function httpDeleteService(url, config = {}) {
    try {
        const resp = await api.delete(`/${url}`.replace(/^\/+/, ""), config);
        return resp.data;
    } catch (error) {
        throw formatAxiosError(error);
    }
}

export async function httpPatchService(url, data, config = {}) {
    try {
        const resp = await api.patch(`/${url}`.replace(/^\/+/, ""), data, config);
        return resp.data;
    } catch (error) {
        throw formatAxiosError(error);
    }
}

export async function httpPutService(url, data, config = {}) {
    try {
        const resp = await api.put(`/${url}`.replace(/^\/+/, ""), data, config);
        return resp.data;
    } catch (error) {
        throw formatAxiosError(error);
    }
}

export async function httpGetService(url, config = {}) {
    try {
        const resp = await api.get(`/${url}`.replace(/^\/+/, ""), config);
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

// Helper functions for token management
export const setAuthToken = (accessToken, refreshToken = null, storageType = 'local') => {
    if (storageType === 'local') {
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
    } else {
        sessionStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
            sessionStorage.setItem('refreshToken', refreshToken);
        }
    }
};

export const getAuthToken = () => {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
};

export const clearAuthTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
};