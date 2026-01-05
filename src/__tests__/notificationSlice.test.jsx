import { configureStore } from '@reduxjs/toolkit';
import notificationSlice, { fetchNotifications } from '../redux/slices/notificationSlice';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as httpHandler from '../App/httpHandler';

// Mock the HTTP handler
vi.mock('../App/httpHandler', () => ({
  httpGetService: vi.fn(),
  httpPatchService: vi.fn(),
  httpDeleteService: vi.fn(),
}));

describe('notificationSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        notifications: notificationSlice,
      },
    });
  });

  it('should handle API response with is_read field (1/0 format)', async () => {
    // Simulate actual API response with is_read: 1/0 format
    const mockResponse = {
      success: true,
      data: [
        {
          id: 39,
          user_id: 23,
          title: 'Client Added',
          message: 'A new client has been added',
          type: 'CLIENT_ADDED',
          entity_type: 'client',
          entity_id: '62',
          is_read: 1,  // Read notification
          created_at: '2026-01-05T03:55:23.000Z',
        },
        {
          id: 37,
          user_id: 23,
          title: 'System Announcement',
          message: 'Important system update',
          type: 'SYSTEM',
          entity_type: null,
          entity_id: null,
          is_read: 0,  // Unread notification
          created_at: '2026-01-03T06:55:23.000Z',
        },
      ],
    };

    vi.mocked(httpHandler.httpGetService).mockResolvedValueOnce(mockResponse);

    // Dispatch the thunk
    await store.dispatch(fetchNotifications());

    const state = store.getState().notifications;

    // Verify all notifications were fetched
    expect(state.notifications).toHaveLength(2);

    // Verify first notification is marked as read
    const readNotif = state.notifications[0];
    expect(readNotif.id).toBe(39);
    expect(readNotif.is_read).toBe(1);
    expect(readNotif.read).toBe(true);  // Normalized to boolean
    expect(readNotif.isRead).toBe(true);  // Normalized to boolean
    expect(readNotif.type).toBe('CLIENT_ADDED');

    // Verify second notification is marked as unread
    const unreadNotif = state.notifications[1];
    expect(unreadNotif.id).toBe(37);
    expect(unreadNotif.is_read).toBe(0);
    expect(unreadNotif.read).toBe(false);  // Normalized to boolean
    expect(unreadNotif.isRead).toBe(false);  // Normalized to boolean
    expect(unreadNotif.type).toBe('SYSTEM');

    // Verify unread count is correct (only 1 unread notification)
    expect(state.unreadCount).toBe(1);

    // Verify status is succeeded
    expect(state.status).toBe('succeeded');
  });

  it('should correctly identify read vs unread notifications', () => {
    const readNotif = {
      id: 1,
      title: 'Test',
      is_read: 1,
      read: true,
      isRead: true,
    };

    const unreadNotif = {
      id: 2,
      title: 'Test',
      is_read: 0,
      read: false,
      isRead: false,
    };

    // Test read status detection (as used in UI)
    const isReadCheck1 = readNotif.read || readNotif.isRead || readNotif.is_read === 1;
    const isReadCheck2 = unreadNotif.read || unreadNotif.isRead || unreadNotif.is_read === 1;

    expect(isReadCheck1).toBe(true);
    expect(isReadCheck2).toBe(false);
  });

  it('should handle API response with legacy field names', async () => {
    // Test backward compatibility with different field names
    const mockResponse = {
      success: true,
      data: [
        {
          id: 1,
          title: 'Test',
          read: true,  // Legacy boolean format
        },
        {
          id: 2,
          title: 'Test',
          isRead: false,  // Legacy camelCase format
        },
      ],
    };

    vi.mocked(httpHandler.httpGetService).mockResolvedValueOnce(mockResponse);

    await store.dispatch(fetchNotifications());

    const state = store.getState().notifications;

    // Both should be normalized correctly
    expect(state.notifications[0].read).toBe(true);
    expect(state.notifications[0].isRead).toBe(true);
    expect(state.notifications[1].read).toBe(false);
    expect(state.notifications[1].isRead).toBe(false);

    // Unread count should be 1 (only second notification is unread)
    expect(state.unreadCount).toBe(1);
  });

  it('should handle empty notifications list', async () => {
    const mockResponse = {
      success: true,
      data: [],
    };

    vi.mocked(httpHandler.httpGetService).mockResolvedValueOnce(mockResponse);

    await store.dispatch(fetchNotifications());

    const state = store.getState().notifications;

    expect(state.notifications).toHaveLength(0);
    expect(state.unreadCount).toBe(0);
    expect(state.status).toBe('succeeded');
  });

  it('should preserve all notification fields after normalization', async () => {
    const mockNotif = {
      id: 99,
      user_id: 23,
      title: 'Complete Test',
      message: 'Full message content',
      type: 'TEST_TYPE',
      entity_type: 'task',
      entity_id: '123',
      is_read: 0,
      created_at: '2026-01-10T10:00:00.000Z',
    };

    const mockResponse = {
      success: true,
      data: [mockNotif],
    };

    vi.mocked(httpHandler.httpGetService).mockResolvedValueOnce(mockResponse);

    await store.dispatch(fetchNotifications());

    const state = store.getState().notifications;
    const normalizedNotif = state.notifications[0];

    // All original fields should be preserved
    expect(normalizedNotif.id).toBe(99);
    expect(normalizedNotif.user_id).toBe(23);
    expect(normalizedNotif.title).toBe('Complete Test');
    expect(normalizedNotif.message).toBe('Full message content');
    expect(normalizedNotif.type).toBe('TEST_TYPE');
    expect(normalizedNotif.entity_type).toBe('task');
    expect(normalizedNotif.entity_id).toBe('123');
    expect(normalizedNotif.is_read).toBe(0);
    expect(normalizedNotif.created_at).toBe('2026-01-10T10:00:00.000Z');

    // Normalization should add boolean fields
    expect(normalizedNotif.read).toBe(false);
    expect(normalizedNotif.isRead).toBe(false);
  });
});
