import { getAccessToken } from './tokenService';

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

  const resp = await fetch(url, merged);

  // If 401, throw to let higher-level logic handle refresh
  if (resp.status === 401) {
    const text = await resp.text();
    const err = new Error('Unauthorized');
    err.status = 401;
    err.body = text;
    throw err;
  }

  return resp;
}
