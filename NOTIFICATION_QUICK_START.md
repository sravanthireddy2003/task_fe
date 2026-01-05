# Notification System - Quick Start Guide

## ✅ What's Implemented

Your notification system is **fully integrated and ready to use**! Here's what's been set up:

### 1. **Redux State Management** ✅
- Created `src/redux/slices/notificationSlice.js`
- Registered in Redux store (`src/redux/store.js`)
- All 4 API operations implemented with proper error handling

### 2. **Notification Dropdown Panel** ✅
- Updated `src/components/NotificationPanel.jsx`
- Shows unread notification badge in header
- Displays first 5 unread notifications in dropdown
- Quick actions: mark as read, delete
- "View All" link to full notifications page
- "Mark All as Read" button

### 3. **Navbar Integration** ✅
- Updated `src/components/Navbar.jsx`
- NotificationPanel now displays in header next to UserAvatar
- Red badge shows unread count (9+ for large numbers)
- Smooth animations and transitions

### 4. **Full Notifications Page** ✅
- Updated `src/pages/Notifications.jsx`
- Filter by status: All / Unread / Read
- Mark single notification as read
- Mark all notifications as read
- Delete notifications with confirmation
- Refresh notifications manually
- Relative date formatting (Just now, Xm ago, Xh ago, Xd ago)
- Priority badges with color coding
- Type badges
- Empty state messaging

### 5. **API Integration** ✅
All endpoints properly integrated using `httpHandler`:
- `GET /api/notifications` - Fetch all notifications
- `PATCH /api/notifications/:id/read` - Mark single as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## 🚀 How to Use

### Basic Integration (Already Done!)

The notification system is automatically active when you:
1. Login to the application
2. View the header (notification badge appears)
3. Navigate to `/notifications` page

### In Your Components

```jsx
import { useDispatch, useSelector } from 'react-redux';
import {
  selectNotifications,
  selectUnreadCount,
  fetchNotifications,
  markNotificationAsRead,
} from '../redux/slices/notificationSlice';

function MyComponent() {
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Mark as read
  const handleMarkRead = (id) => {
    dispatch(markNotificationAsRead(id));
  };

  return (
    <div>
      <h3>You have {unreadCount} unread notifications</h3>
      {notifications.map(n => (
        <div key={n.id || n._id}>
          <h4>{n.title}</h4>
          <p>{n.message}</p>
          <button onClick={() => handleMarkRead(n.id || n._id)}>
            Mark as Read
          </button>
        </div>
      ))}
    </div>
  );
}
```

## 📋 API Endpoints

All endpoints use your JWT token and tenant ID automatically (via httpHandler):

### GET /api/notifications
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "x-tenant-id: YOUR_TENANT_ID" \
     http://localhost:4000/api/notifications
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "title": "New Task Assigned",
      "message": "Task details...",
      "type": "task",
      "priority": "high",
      "read": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### PATCH /api/notifications/:id/read
```bash
curl -X PATCH \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "x-tenant-id: YOUR_TENANT_ID" \
     -H "Content-Type: application/json" \
     -d '{}' \
     http://localhost:4000/api/notifications/123/read
```

### PATCH /api/notifications/read-all
```bash
curl -X PATCH \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "x-tenant-id: YOUR_TENANT_ID" \
     -H "Content-Type: application/json" \
     -d '{}' \
     http://localhost:4000/api/notifications/read-all
```

### DELETE /api/notifications/:id
```bash
curl -X DELETE \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "x-tenant-id: YOUR_TENANT_ID" \
     http://localhost:4000/api/notifications/123
```

## 🧪 Testing

### Test in Browser Console
```javascript
// Check Redux state
const state = window.__store__.getState();
console.log(state.notifications);

// Check unread count
console.log('Unread:', state.notifications.unreadCount);

// Manually trigger fetch
window.__store__.dispatch(fetchNotifications());
```

### Test Endpoints with Postman/Thunder Client

1. Set collection variable `{{base_url}}` = `http://localhost:4000`
2. Set `{{token}}` = Your JWT token
3. Set `{{tenant_id}}` = Your tenant ID
4. Send requests with Authorization header: `Bearer {{token}}`
5. Add header: `x-tenant-id: {{tenant_id}}`

## 🔧 Configuration

### Redux State Shape
```javascript
{
  notifications: {
    notifications: [],        // Array of notification objects
    unreadCount: 0,           // Count of unread
    status: null,             // 'loading' | 'succeeded' | 'failed'
    error: null,              // Error message
    currentNotification: null // Selected notification
  }
}
```

### Notification Object Fields
```javascript
{
  id: string,              // Unique ID (or _id)
  title: string,           // Notification title
  message: string,         // Notification body
  type: string,            // Category (task, message, alert, etc)
  priority: string,        // 'high' | 'medium' | 'low'
  read: boolean,           // Is read (or isRead)
  createdAt: string,       // ISO date string
  // Plus any custom fields
}
```

## ⚙️ Customization

### Change Notification Fetch Interval

In `src/pages/Notifications.jsx` or `NotificationPanel.jsx`:
```jsx
useEffect(() => {
  // Fetch on mount
  dispatch(fetchNotifications());
  
  // Optional: Auto-refresh every 30 seconds
  const interval = setInterval(() => {
    dispatch(fetchNotifications());
  }, 30000); // 30 seconds
  
  return () => clearInterval(interval);
}, [dispatch]);
```

### Add WebSocket Support

Create `src/hooks/useNotificationListener.js`:
```jsx
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchNotifications } from '../redux/slices/notificationSlice';

export function useNotificationListener() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket('ws://your-backend/notifications');
    
    ws.onmessage = (event) => {
      // Refresh notifications when new one arrives
      dispatch(fetchNotifications());
    };
    
    return () => ws.close();
  }, [dispatch]);
}
```

### Custom Toast Messages

All actions include toast notifications via Sonner. Customize in components:
```jsx
import { toast } from 'sonner';

toast.success('Notification marked as read');
toast.error('Failed to delete notification');
toast.info('All notifications are already read');
```

## 📁 File Structure

```
src/
├── redux/
│   ├── slices/
│   │   └── notificationSlice.js      ← Redux state & thunks
│   └── store.js                       ← Notification reducer registered
│
├── components/
│   ├── NotificationPanel.jsx          ← Header dropdown (updated)
│   └── Navbar.jsx                     ← Integrated NotificationPanel (updated)
│
├── pages/
│   └── Notifications.jsx              ← Full page (updated)
│
├── App/
│   └── httpHandler.js                 ← API calls (uses existing)
│
└── NOTIFICATION_API_INTEGRATION.md    ← Full documentation
```

## 🐛 Troubleshooting

### Notifications not loading?
1. Check localStorage for token: `localStorage.getItem('tm_access_token')`
2. Check tenant: `localStorage.getItem('tenantId')`
3. Open DevTools > Network tab and check API response
4. Check Redux DevTools for state updates

### Badge not showing unread count?
1. Verify API returns `read` or `isRead` field
2. Check Redux DevTools state: `state.notifications.unreadCount`
3. Force refresh: Open DevTools console and run:
   ```javascript
   store.dispatch(fetchNotifications())
   ```

### API calls returning 401?
1. Token may be expired
2. Check if refresh token logic is working
3. Try logging out and back in
4. Check `src/App/apiClient.js` for token refresh config

### Styles not applied?
1. Verify Tailwind CSS is working in project
2. Check browser DevTools for class names
3. Ensure Lucide icons are installed: `npm list lucide-react`

## 🎯 Next Steps (Optional)

1. **Real-time updates**: Implement WebSocket listener
2. **Sound alerts**: Add browser notification sound on new notification
3. **Categories**: Filter by notification type/priority
4. **Search**: Add search functionality
5. **Archive**: Replace delete with archive option
6. **Persistence**: Save user notification preferences

## 📞 Support

For issues or questions about the notification system:
1. Check `NOTIFICATION_API_INTEGRATION.md` for detailed docs
2. Review Redux DevTools to inspect state changes
3. Check browser DevTools Network tab for API responses
4. Review `src/redux/slices/notificationSlice.js` for thunk logic

---

**Status**: ✅ Production Ready

The notification system is fully functional and integrated. All API operations are working with proper error handling, loading states, and user feedback via toast notifications.
