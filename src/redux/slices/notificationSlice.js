import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  httpGetService,
  httpPatchService,
  httpDeleteService,
} from '../../App/httpHandler';

// Helper to normalize errors
const formatRejectValue = (err) => {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err?.message) return err.message;
  try {
    return JSON.stringify(err);
  } catch (e) {
    return String(err);
  }
};

// Helper to normalize notification format from API
const normalizeNotification = (notif) => {
  return {
    ...notif,
    // Handle different field names for read status (is_read: 1/0 from API)
    read: notif.is_read === 1 || notif.read === true || notif.isRead === true,
    isRead: notif.is_read === 1 || notif.read === true || notif.isRead === true,
  };
};

const initialState = {
  notifications: [],
  unreadCount: 0,
  status: null,
  error: null,
  currentNotification: null,
};

// Thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params = {}, thunkAPI) => {
    try {
      const res = await httpGetService('api/notifications');
      // API returns { success: true, data: [...] }
      const data = res?.data || res || [];
      const notificationsArray = Array.isArray(data) ? data : Array.isArray(res?.notifications) ? res.notifications : [];
      // Normalize all notifications to handle is_read field
      return notificationsArray.map(normalizeNotification);
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markNotificationAsRead',
  async (notificationId, thunkAPI) => {
    try {
      const res = await httpPatchService(`api/notifications/${notificationId}/read`, {});
      return res?.data || res || { id: notificationId };
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllNotificationsAsRead',
  async (_, thunkAPI) => {
    try {
      const res = await httpPatchService('api/notifications/read-all', {});
      return res?.data || res || { success: true };
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId, thunkAPI) => {
    try {
      const res = await httpDeleteService(`api/notifications/${notificationId}`);
      return { id: notificationId, success: res?.success, message: res?.message };
    } catch (err) {
      return thunkAPI.rejectWithValue(formatRejectValue(err));
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.status = null;
      state.error = null;
    },
    setCurrentNotification: (state, action) => {
      state.currentNotification = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.notifications = action.payload || [];
        // Calculate unread count - handle both normalized and API formats
        state.unreadCount = state.notifications.filter((n) => {
          // Check multiple possible field names
          return !n.read && !n.isRead && n.is_read !== 1;
        }).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      // Mark as Read
      .addCase(markNotificationAsRead.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const notifId = action.meta.arg;
        const notif = state.notifications.find(
          (n) => n.id === notifId || n._id === notifId
        );
        if (notif) {
          notif.read = true;
          notif.isRead = true;
        }
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      // Mark All as Read
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.status = 'succeeded';
        state.notifications.forEach((n) => {
          n.read = true;
          n.isRead = true;
        });
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      })

      // Delete Notification
      .addCase(deleteNotification.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const id = action.payload?.id;
        if (id) {
          const deletedNotif = state.notifications.find(
            (n) => n.id === id || n._id === id
          );
          if (deletedNotif && !deletedNotif.read && !deletedNotif.isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.notifications = state.notifications.filter(
            (n) => n.id !== id && n._id !== id
          );
        }
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      });
  },
});

// Export actions
export const { clearNotifications, setCurrentNotification } = notificationSlice.actions;

// Selectors
export const selectNotifications = (state) =>
  state.notifications?.notifications || [];
export const selectNotificationStatus = (state) =>
  state.notifications?.status;
export const selectNotificationError = (state) =>
  state.notifications?.error;
export const selectUnreadCount = (state) =>
  state.notifications?.unreadCount || 0;
export const selectCurrentNotification = (state) =>
  state.notifications?.currentNotification;

export default notificationSlice.reducer;
