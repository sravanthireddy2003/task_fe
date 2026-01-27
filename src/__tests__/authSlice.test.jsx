import { describe, it, expect, beforeAll } from 'vitest';
import authReducer, { setCredentials, logout } from '../redux/slices/authSlice';

// Simple localStorage mock for Node/Vitest environment
beforeAll(() => {
  global.localStorage = {
    _store: {},
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(this._store, key)
        ? this._store[key]
        : null;
    },
    setItem(key, value) {
      this._store[key] = value;
    },
    removeItem(key) {
      delete this._store[key];
    },
    clear() {
      this._store = {};
    },
  };
});

describe('authSlice reducers', () => {
  const initialState = {
    user: null,
    tempToken: null,
    isSidebarOpen: false,
    status: null,
    error: null,
    authError: null,
    users: {},
  };

  it('should handle setCredentials', () => {
    const user = { id: 'u1', name: 'Test', role: 'Admin' };
    const next = authReducer(initialState, setCredentials(user));
    expect(next.user).toEqual(user);
    expect(JSON.parse(localStorage.getItem('userInfo'))).toEqual(user);
  });

  it('should handle logout', () => {
    localStorage.setItem('userInfo', JSON.stringify({ id: 'u1' }));
    const stateWithUser = { ...initialState, user: { id: 'u1' } };
    const next = authReducer(stateWithUser, logout());
    expect(next.user).toBeNull();
    expect(localStorage.getItem('userInfo')).toBeNull();
  });
});
