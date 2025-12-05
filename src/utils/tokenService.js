const ACCESS_KEY = "tm_access_token";
const REFRESH_KEY = "tm_refresh_token";
const LEGACY_ACCESS_KEY = "accessToken";
const LEGACY_REFRESH_KEY = "refreshToken";

export function getAccessToken() {
  try {
    return (
      localStorage.getItem(ACCESS_KEY) ||
      localStorage.getItem(LEGACY_ACCESS_KEY) ||
      sessionStorage.getItem(ACCESS_KEY) ||
      sessionStorage.getItem(LEGACY_ACCESS_KEY) ||
      null
    );
  } catch (e) {
    return null;
  }
}

export function getRefreshToken() {
  try {
    return (
      localStorage.getItem(REFRESH_KEY) ||
      localStorage.getItem(LEGACY_REFRESH_KEY) ||
      sessionStorage.getItem(REFRESH_KEY) ||
      sessionStorage.getItem(LEGACY_REFRESH_KEY) ||
      null
    );
  } catch (e) {
    return null;
  }
}

export function setTokens(accessToken, refreshToken, storage = 'local') {
  try {
    const storageObj = storage === 'session' ? sessionStorage : localStorage;
    if (accessToken) {
      storageObj.setItem(ACCESS_KEY, accessToken);
      storageObj.setItem(LEGACY_ACCESS_KEY, accessToken);
    }
    if (refreshToken) {
      storageObj.setItem(REFRESH_KEY, refreshToken);
      storageObj.setItem(LEGACY_REFRESH_KEY, refreshToken);
    }
  } catch (e) {
    // ignore
  }
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(LEGACY_ACCESS_KEY);
    localStorage.removeItem(LEGACY_REFRESH_KEY);
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(LEGACY_ACCESS_KEY);
    sessionStorage.removeItem(LEGACY_REFRESH_KEY);
  } catch (e) {}
}

export default { getAccessToken, getRefreshToken, setTokens, clearTokens };
