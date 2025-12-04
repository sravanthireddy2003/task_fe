import { describe, it, expect } from 'vitest';
import authReducer, { setCredentials, logout } from '../redux/slices/authSlice';

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
