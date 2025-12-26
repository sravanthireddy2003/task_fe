import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokenService';

const baseURL = import.meta.env.VITE_SERVERURL || '';

export default async function fetchWithTenant(pathOrUrl, options = {}) {
  const isFullUrl = /^https?:\/\//i.test(pathOrUrl);
  const url = isFullUrl ? pathOrUrl : `${baseURL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;

  const tenantId = (() => {
    try {
      return localStorage.getItem('tenantId') || import.meta.env.VITE_TENANT_ID || '';
    } catch (e) {
      return import.meta.env.VITE_TENANT_ID || '';
    }
  })();

  const headers = options.headers ? { ...options.headers } : {};

  if (tenantId) headers['x-tenant-id'] = tenantId;

  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Do not set Content-Type if body is FormData
  if (options.body instanceof FormData) {
    // leave headers as-is (browser will add correct Content-Type)
  } else if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const merged = { ...options, headers };

  let resp = await fetch(url, merged);

  // If 401, attempt a refresh and retry once
  if (resp.status === 401) {
    try {
      const storedRefresh = getRefreshToken();
      if (!storedRefresh) throw new Error('No refresh token');

      // call refresh endpoint
      const refreshUrl = `${baseURL}/api/auth/refresh`;
      const refreshResp = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedRefresh}`,
          ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
        },
        body: JSON.stringify({}), // empty body
      });

      if (!refreshResp.ok) {
        // Refresh failed, clear tokens and surface original 401
        clearTokens();
        const txt = await refreshResp.text();
        const err = new Error('Refresh failed');
        err.status = refreshResp.status;
        err.body = txt;
        throw err;
      }

      const refreshJson = await refreshResp.json();
      const newAccess = refreshJson?.accessToken || refreshJson?.token || null;
      const newRefresh = refreshJson?.refreshToken || refreshJson?.refresh || storedRefresh;
      if (newAccess) {
        setTokens(newAccess, newRefresh || null);
      }

      // retry original request with new token
      const retryHeaders = { ...(merged.headers || {}) };
      if (newAccess) retryHeaders['Authorization'] = `Bearer ${newAccess}`;
      const retryMerged = { ...merged, headers: retryHeaders };
      resp = await fetch(url, retryMerged);
    } catch (err) {
      const e = new Error('Unauthorized');
      e.status = 401;
      throw e;
    }
  }

  // If still unauthorized, throw with details
  if (resp.status === 401) {
    const text = await resp.text();
    const err = new Error('Unauthorized');
    err.status = 401;
    err.body = text;
    throw err;
  }

  // Return parsed JSON when possible
  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await resp.json();
  }
  // fallback to text
  return await resp.text();
}
