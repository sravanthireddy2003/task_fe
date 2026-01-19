import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

// Mock fetchWithTenant used by the slice (module path from test file to utils)
vi.mock('../utils/fetchWithTenant', () => ({ default: vi.fn() }));
import fetchWithTenant from '../utils/fetchWithTenant';

import reportsReducer, { fetchProjects, generateProjectReport } from '../redux/slices/reportsSlice';

describe('reportsSlice thunks', () => {
  let store;

  beforeEach(() => {
    // reset mock and store before each test
    fetchWithTenant.mockReset();
    store = configureStore({ reducer: { reports: reportsReducer } });
  });

  it('fetchProjects stores project list on success', async () => {
    const projects = [
      { projectId: 'p1', projectName: 'One' },
      { projectId: 'p2', projectName: 'Two' },
    ];
    fetchWithTenant.mockResolvedValueOnce(projects);

    await store.dispatch(fetchProjects());

    const state = store.getState().reports;
    expect(state.projects).toEqual(projects);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('generateProjectReport stores nested data on success', async () => {
    const mockData = {
      project: { projectId: '22671f16d94a9d0a', projectName: 'HRMS Implementation' },
      summary: { total: 12, completed: 5, pending: 6, overdue: 1 },
      tasks: [
        { taskId: 't-001', taskName: 'Design Landing Page', assignedTo: 'John Doe', status: 'In Progress', hoursLogged: 5.5, dueDate: '2026-01-20' }
      ]
    };
    fetchWithTenant.mockResolvedValueOnce({ success: true, data: mockData });

    const res = await store.dispatch(generateProjectReport({ projectId: '22671f16d94a9d0a', startDate: '2026-01-05', endDate: '2026-01-22' }));

    // check action result
    expect(res.type).toMatch(/fulfilled$/);

    const state = store.getState().reports;
    expect(state.report).toEqual(mockData);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('generateProjectReport rejects and sets error on API failure', async () => {
    const errMsg = 'projectId, startDate and endDate are required';
    fetchWithTenant.mockResolvedValueOnce({ success: false, message: errMsg });

    const res = await store.dispatch(generateProjectReport({ projectId: '', startDate: '', endDate: '' }));

    expect(res.type).toMatch(/rejected$/);
    const state = store.getState().reports;
    expect(state.report).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBe(errMsg);
  });
});
