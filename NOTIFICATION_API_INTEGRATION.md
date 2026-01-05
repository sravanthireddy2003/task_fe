# Notification API Integration Documentation

## Overview
The notification system is fully integrated with Redux and the backend API. It provides real-time notification management with features like:
- Fetch notifications from backend
- Mark single notification as read
- Mark all notifications as read
- Delete individual notifications
- Unread count tracking
- Filter by status (all, unread, read)
- Relative date formatting

## Architecture

### 1. Redux Slice (`src/redux/slices/notificationSlice.js`)

#### State Structure
```javascript
{
  notifications: [],      // Array of notification objects
  unreadCount: 0,        // Count of unread notifications
  status: null,          // Loading status: 'loading' | 'succeeded' | 'failed'
  error: null,           // Error message if failed
  currentNotification: null  // Currently selected notification
}
```

#### Async Thunks (API Calls)

**1. fetchNotifications**
- **Endpoint**: `GET /api/notifications`
- **Purpose**: Fetch all notifications
- **Response**: Array of notification objects
- **Usage**:
```javascript
dispatch(fetchNotifications())
```

**2. markNotificationAsRead**
- **Endpoint**: `PATCH /api/notifications/:id/read`
- **Purpose**: Mark a single notification as read
- **Payload**: Notification ID
- **Usage**:
```javascript
dispatch(markNotificationAsRead(notificationId))
```

**3. markAllNotificationsAsRead**
- **Endpoint**: `PATCH /api/notifications/read-all`
- **Purpose**: Mark all notifications as read
- **Payload**: Empty object `{}`
- **Usage**:
```javascript
dispatch(markAllNotificationsAsRead())
```

**4. deleteNotification**
- **Endpoint**: `DELETE /api/notifications/:id`
- **Purpose**: Delete a notification
- **Payload**: Notification ID
- **Usage**:
```javascript
dispatch(deleteNotification(notificationId))
```

#### Selectors
All Redux selectors follow the pattern `selectXxx` and can be used with `useSelector`:

```javascript
const notifications = useSelector(selectNotifications);      // Array
const status = useSelector(selectNotificationStatus);        // 'loading' | 'succeeded' | 'failed'
const error = useSelector(selectNotificationError);          // Error message
const unreadCount = useSelector(selectUnreadCount);          // Number
const currentNotification = useSelector(selectCurrentNotification);  // Object
```

#### State Reducers
- **clearNotifications**: Clears all notifications and resets state
- **setCurrentNotification**: Sets the currently selected notification

### 2. Redux Store Integration (`src/redux/store.js`)

The notification reducer is automatically registered in the Redux store:
```javascript
import notificationReducer from "./slices/notificationSlice";

const store = configureStore({
  reducer: {
    // ... other reducers
    notifications: notificationReducer,
  },
  // ...
});
```

### 3. Components

#### NotificationPanel (`src/components/NotificationPanel.jsx`)
**Purpose**: Dropdown notification preview in header
**Features**:
- Displays first 5 unread notifications
- Shows unread count badge in header
- Quick mark as read action
- Quick delete action
- Link to full Notifications page
- Mark all as read button
- Relative date formatting

**Integration Points**:
- Uses `selectNotifications` and `selectUnreadCount` selectors
- Dispatches `markNotificationAsRead`, `markAllNotificationsAsRead`, `deleteNotification`
- Fetches notifications on mount via `useEffect`

#### Navbar (`src/components/Navbar.jsx`)
**Purpose**: Top navigation bar
**Updates**:
- Added `NotificationPanel` component
- Displays notification badge with unread count
- Positioned in header alongside UserAvatar

#### Notifications Page (`src/pages/Notifications.jsx`)
**Purpose**: Full notifications management interface
**Features**:
- List all notifications
- Filter by status (all, unread, read)
- Mark single notification as read
- Mark all notifications as read
- Delete notifications with confirmation
- Refresh notifications manually
- Loading states and error handling
- Empty state messages
- Relative date formatting
- Priority and type badges

## API Endpoints

### GET /api/notifications
**Headers**:
- `Authorization: Bearer <jwt-token>`
- `x-tenant-id: <tenant-id>` (auto-added by httpHandler)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "_id": "123",
      "title": "New Task Assigned",
      "message": "Task details...",
      "type": "task",
      "priority": "high",
      "read": false,
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### PATCH /api/notifications/:id/read
**Headers**:
- `Authorization: Bearer <jwt-token>`
- `x-tenant-id: <tenant-id>`

**Body**: `{}`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "123",
    "read": true
  }
}
```

### PATCH /api/notifications/read-all
**Headers**:
- `Authorization: Bearer <jwt-token>`
- `x-tenant-id: <tenant-id>`

**Body**: `{}`

**Response**:
```json
{
  "success": true,
  "data": { "message": "All notifications marked as read" }
}
```

### DELETE /api/notifications/:id
**Headers**:
- `Authorization: Bearer <jwt-token>`
- `x-tenant-id: <tenant-id>`

**Response**:
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

## Field Mapping

The notification objects support flexible field naming to handle different API response formats:

| Display Field | Supported API Field Names |
|---|---|
| Title | `title`, `subject` |
| Message | `message`, `body`, `text` |
| Read Status | `read`, `isRead` |
| Date | `createdAt`, `created_at` |
| Notification ID | `id`, `_id` |

## Usage Examples

### Example 1: Using in a Component
```javascript
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotifications,
  selectNotifications,
  selectUnreadCount,
  markNotificationAsRead,
} from '../redux/slices/notificationSlice';

function MyComponent() {
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkRead = (id) => {
    dispatch(markNotificationAsRead(id));
  };

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {notifications.map(n => (
        <div key={n.id || n._id}>
          <h4>{n.title}</h4>
          <button onClick={() => handleMarkRead(n.id || n._id)}>Mark Read</button>
        </div>
      ))}
    </div>
  );
}
```

### Example 2: API Integration Wrapper
```javascript
// The httpHandler automatically adds:
// - Authorization header with Bearer token
// - x-tenant-id header from localStorage or userInfo
// - Proper Content-Type headers
// - Error formatting

// Usage is simple:
import { httpGetService, httpPatchService, httpDeleteService } from '../App/httpHandler';

// Get notifications
const data = await httpGetService('api/notifications');

// Mark as read
const result = await httpPatchService('api/notifications/123/read', {});

// Delete
const deleted = await httpDeleteService('api/notifications/123');
```

## Error Handling

All API calls include comprehensive error handling:

1. **Try-Catch**: Wraps all thunks
2. **Format Rejection**: Converts errors to readable messages
3. **Toast Notifications**: User feedback via Sonner toast
4. **Redux State**: Error stored in `state.notifications.error`

Example:
```javascript
try {
  await dispatch(markNotificationAsRead(id)).unwrap();
  toast.success('Marked as read');
} catch (err) {
  toast.error(err?.message || 'Failed to mark as read');
}
```

## Performance Considerations

1. **Caching**: Notifications are cached in Redux state
2. **Pagination**: Fetch only first 5 in dropdown, all in full page
3. **Lazy Loading**: NotificationPanel fetches on mount
4. **Unread Count**: Computed automatically from notifications array
5. **Local Updates**: Redux state updates optimistically before API returns

## Testing the Integration

### Test in Console
```javascript
// Get current notifications
store.getState().notifications

// Manually dispatch (test only)
store.dispatch(fetchNotifications())

// Check unread count
const state = store.getState();
console.log(state.notifications.unreadCount);
```

### Environment Variables
The notification system uses standard authentication:
- **Token**: Read from `localStorage` via `tokenService.js`
- **Tenant ID**: Read from `localStorage.tenantId` or computed from `userInfo`
- **API Base**: Uses `VITE_SERVERURL` from Vite config

## Future Enhancements

### Suggested Improvements
1. **WebSocket Support**: Real-time push notifications
2. **Sound/Desktop Alerts**: Browser notifications API
3. **Notification Categories**: Filter by type/priority
4. **Search**: Find notifications by keyword
5. **Archiving**: Mark as archived instead of delete
6. **Bulk Actions**: Select multiple and mark read/delete
7. **Notification Settings**: User preferences per notification type
8. **Persistence**: Save last seen timestamp

## Troubleshooting

### Notifications not loading
- Check token: `localStorage.getItem('tm_access_token')`
- Check tenant ID: `localStorage.getItem('tenantId')`
- Check API URL: `import.meta.env.VITE_SERVERURL`
- Check browser console for errors

### Mark as read not working
- Verify notification ID field (`id` or `_id`)
- Check API response structure
- Verify Bearer token is valid

### Count not updating
- Ensure notification objects have `read` or `isRead` field
- Manually trigger `dispatch(fetchNotifications())`
- Check Redux DevTools for state changes

## File Structure
```
src/
├── redux/
│   ├── slices/
│   │   └── notificationSlice.js      (Redux logic)
│   └── store.js                       (Store config)
├── components/
│   ├── NotificationPanel.jsx          (Header dropdown)
│   └── Navbar.jsx                     (Integrated notification)
├── pages/
│   └── Notifications.jsx              (Full page)
└── App/
    └── httpHandler.js                 (API calls)
```

## Conclusion

The notification system is production-ready with:
✅ Full Redux integration
✅ All 4 API operations implemented
✅ Proper error handling
✅ User feedback via toast
✅ Unread count tracking
✅ Filter system
✅ Responsive UI
✅ Header badge integration
✅ Relative date formatting
✅ Field name flexibility
