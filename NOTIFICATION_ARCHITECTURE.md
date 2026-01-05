# Notification System Architecture

## High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TASK MANAGER UI                             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
          ┌──────────────────┐          ┌──────────────────┐
          │  Navbar.jsx      │          │  Notifications   │
          │ (Header Badge)   │          │    Page          │
          └──────────────────┘          └──────────────────┘
                    │                               │
                    │ Imports                       │ Uses
                    ▼                               ▼
          ┌──────────────────────────────────────────────┐
          │      NotificationPanel.jsx                    │
          │  (Dropdown with first 5 unread)              │
          └──────────────────────────────────────────────┘
                    │
         ┌──────────┼──────────┐
         │          │          │
         ▼          ▼          ▼
      Fetch      Mark Read   Delete
      Redux      Redux       Redux
      Action     Action      Action
         │          │          │
         └──────────┴──────────┘
              │
              ▼
    ┌──────────────────────────────────┐
    │   Redux notificationSlice.js      │
    │                                  │
    │  State:                          │
    │  - notifications []              │
    │  - unreadCount                   │
    │  - status                        │
    │  - error                         │
    │                                  │
    │  Thunks:                         │
    │  - fetchNotifications            │
    │  - markNotificationAsRead        │
    │  - markAllNotificationsAsRead    │
    │  - deleteNotification            │
    └──────────────────────────────────┘
              │
              ▼
    ┌──────────────────────────────────┐
    │   httpHandler.js                  │
    │  (Auto-adds token & tenant ID)   │
    └──────────────────────────────────┘
              │
              ▼
    ┌──────────────────────────────────┐
    │   Backend API                     │
    │                                  │
    │  GET    /api/notifications       │
    │  PATCH  /api/notifications/:id/read
    │  PATCH  /api/notifications/read-all
    │  DELETE /api/notifications/:id   │
    └──────────────────────────────────┘
```

## Component Hierarchy

```
App.jsx
├── Navbar.jsx
│   ├── NotificationPanel.jsx ✨ NEW
│   │   └── useSelector(selectNotifications)
│   │   └── useDispatch(fetchNotifications)
│   │   └── useDispatch(markNotificationAsRead)
│   │   └── useDispatch(deleteNotification)
│   │   └── useDispatch(markAllNotificationsAsRead)
│   └── UserAvatar.jsx
│
└── Routes
    └── /notifications
        └── Notifications.jsx
            └── useSelector(selectNotifications)
            └── useDispatch(fetchNotifications)
            └── etc...
```

## Data Flow

### 1. Fetch Notifications (on component mount)

```
NotificationPanel.jsx
        │
        ├─ useEffect([dispatch])
        │   └─ dispatch(fetchNotifications())
        │       │
        │       ├─ Redux Thunk
        │       │
        │       └─ httpGetService('api/notifications')
        │           │
        │           ├─ Add Bearer token (from localStorage)
        │           ├─ Add x-tenant-id header
        │           │
        │           └─ GET Backend
        │               │
        │               ├─ Return { success, data: [...] }
        │               │
        │               ├─ Redux Reducer (fulfilled)
        │               │   ├─ state.notifications = data
        │               │   ├─ Calculate unreadCount
        │               │   └─ state.status = 'succeeded'
        │               │
        │               └─ Component re-renders
        │                   └─ useSelector sees new state
        │                       └─ Display notifications
        │
        └─ Fallback error handling
            └─ Toast notification
```

### 2. Mark as Read (single)

```
handleMarkAsRead(notificationId)
        │
        ├─ dispatch(markNotificationAsRead(notificationId))
        │   │
        │   └─ httpPatchService(`api/notifications/${id}/read`, {})
        │       │
        │       ├─ Add Bearer token
        │       ├─ Add x-tenant-id header
        │       │
        │       └─ PATCH Backend
        │           │
        │           ├─ Return { success, data: { read: true } }
        │           │
        │           ├─ Redux Reducer (fulfilled)
        │           │   ├─ Find notification by id
        │           │   ├─ Set read = true
        │           │   ├─ Decrement unreadCount
        │           │   └─ state.status = 'succeeded'
        │           │
        │           └─ Component re-renders
        │               └─ UI updates
        │
        └─ Toast success
```

### 3. Mark All as Read

```
handleMarkAllAsRead()
        │
        ├─ Check unreadCount > 0
        │
        ├─ dispatch(markAllNotificationsAsRead())
        │   │
        │   └─ httpPatchService('api/notifications/read-all', {})
        │       │
        │       ├─ Add Bearer token
        │       ├─ Add x-tenant-id header
        │       │
        │       └─ PATCH Backend
        │           │
        │           ├─ Return { success, data: {...} }
        │           │
        │           ├─ Redux Reducer (fulfilled)
        │           │   ├─ Mark all notifications as read
        │           │   ├─ Set unreadCount = 0
        │           │   └─ state.status = 'succeeded'
        │           │
        │           └─ Component re-renders
        │
        └─ Toast success
```

### 4. Delete Notification

```
handleDelete(notificationId)
        │
        ├─ Confirm dialog
        │
        ├─ dispatch(deleteNotification(notificationId))
        │   │
        │   └─ httpDeleteService(`api/notifications/${id}`)
        │       │
        │       ├─ Add Bearer token
        │       ├─ Add x-tenant-id header
        │       │
        │       └─ DELETE Backend
        │           │
        │           ├─ Return { success: true }
        │           │
        │           ├─ Redux Reducer (fulfilled)
        │           │   ├─ Filter notification from array
        │           │   ├─ Update unreadCount if was unread
        │           │   └─ state.status = 'succeeded'
        │           │
        │           └─ Component re-renders
        │
        └─ Toast success
```

## State Structure

```javascript
Redux Store
│
└─ state.notifications
   │
   ├─ notifications: [
   │  │
   │  ├─ {
   │  │   id: "123",           // or _id
   │  │   title: "New Task",   // or subject
   │  │   message: "...",      // or body or text
   │  │   type: "task",
   │  │   priority: "high",
   │  │   read: false,         // or isRead
   │  │   createdAt: "2024-01-15T10:30:00Z",  // or created_at
   │  │   ... (other fields)
   │  │ },
   │  │ ... more notifications
   │  │
   │  └─ ]
   │
   ├─ unreadCount: 5         // Auto-calculated
   │
   ├─ status: "succeeded"    // 'loading' | 'succeeded' | 'failed'
   │
   ├─ error: null            // Error message if status='failed'
   │
   └─ currentNotification: null  // For detail view
```

## Selector Chain

```
Redux State
    │
    ├─ selectNotifications(state)
    │  └─ Returns: state.notifications.notifications
    │
    ├─ selectUnreadCount(state)
    │  └─ Returns: state.notifications.unreadCount
    │
    ├─ selectNotificationStatus(state)
    │  └─ Returns: state.notifications.status
    │
    ├─ selectNotificationError(state)
    │  └─ Returns: state.notifications.error
    │
    └─ selectCurrentNotification(state)
       └─ Returns: state.notifications.currentNotification
```

## Component Usage Pattern

```jsx
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotifications,
  selectNotifications,
  selectUnreadCount,
} from '../redux/slices/notificationSlice';

function MyComponent() {
  const dispatch = useDispatch();
  
  // Get data from Redux
  const notifications = useSelector(selectNotifications);    // [...]
  const unreadCount = useSelector(selectUnreadCount);        // number
  
  // Fetch on mount
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);
  
  // Dispatch actions
  const handleMarkRead = (id) => {
    dispatch(markNotificationAsRead(id));
  };
  
  return <div>Unread: {unreadCount}</div>;
}
```

## API Request/Response Cycle

### GET /api/notifications

```
REQUEST:
─────────
GET /api/notifications HTTP/1.1
Host: localhost:4000
Authorization: Bearer eyJhbGc...
x-tenant-id: tenant-123
Accept: application/json

RESPONSE:
─────────
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": [
    {
      "id": "notif-1",
      "title": "Task Assigned",
      "message": "You have a new task",
      "read": false,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    ...
  ]
}
```

### PATCH /api/notifications/:id/read

```
REQUEST:
─────────
PATCH /api/notifications/notif-1/read HTTP/1.1
Host: localhost:4000
Authorization: Bearer eyJhbGc...
x-tenant-id: tenant-123
Content-Type: application/json
Content-Length: 2

{}

RESPONSE:
─────────
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "notif-1",
    "read": true
  }
}
```

### DELETE /api/notifications/:id

```
REQUEST:
─────────
DELETE /api/notifications/notif-1 HTTP/1.1
Host: localhost:4000
Authorization: Bearer eyJhbGc...
x-tenant-id: tenant-123

RESPONSE:
─────────
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Notification deleted"
}
```

## Error Handling Flow

```
API Call (httpGetService, httpPatchService, etc.)
    │
    ├─ Success
    │  └─ Return response data
    │     └─ Redux Reducer (fulfilled)
    │        └─ Update state
    │           └─ Component re-renders
    │
    └─ Error
       └─ Catch block
          └─ formatRejectValue(error)
             ├─ Extract message
             ├─ Return readable string
             │
             └─ thunkAPI.rejectWithValue(message)
                └─ Redux Reducer (rejected)
                   ├─ state.status = 'failed'
                   ├─ state.error = message
                   │
                   └─ Component notified
                      └─ useEffect watches error
                         └─ toast.error(error)
                            └─ User sees message
```

## Feature Matrix

```
┌─────────────────────┬─────────────────┬──────────────┬─────────────────┐
│ Feature             │ Component       │ Redux Action │ API Endpoint    │
├─────────────────────┼─────────────────┼──────────────┼─────────────────┤
│ Fetch Notifications │ All             │ fetch...     │ GET /api/...    │
│ Unread Badge        │ NotificationPanel│ select...   │ (No API)        │
│ Mark as Read        │ All             │ mark...AsRead│ PATCH /api/..   │
│ Mark All as Read    │ All             │ mark...All...│ PATCH /api/..   │
│ Delete Notification │ All             │ delete...    │ DELETE /api/..  │
│ Filter Notifications│ Notifications   │ (Local)      │ (No API)        │
│ Relative Dates      │ All             │ (Computed)   │ (No API)        │
└─────────────────────┴─────────────────┴──────────────┴─────────────────┘
```

## Performance Optimization

```
NotificationPanel
    │
    ├─ Fetch on Mount (once)
    │  └─ useEffect([dispatch])
    │
    ├─ Cache in Redux
    │  └─ No redundant API calls
    │
    ├─ Show first 5 only
    │  └─ Reduce DOM elements
    │
    ├─ Lazy compute unread count
    │  └─ Single pass filter
    │
    └─ Optimistic updates
       └─ Immediate UI feedback
          └─ API confirmation after
```

## Deployment Topology

```
localhost:3000 (Dev)
│
├─ src/redux/slices/notificationSlice.js
├─ src/components/NotificationPanel.jsx
├─ src/components/Navbar.jsx
├─ src/pages/Notifications.jsx
│
└─ Build Process
   │
   ├─ npm install
   ├─ npm run build
   │
   └─ dist/
      │
      ├─ Bundled JS (includes Redux + Components)
      ├─ CSS (Tailwind + styles)
      │
      └─ Ready for deployment
```

## Security Architecture

```
User Credentials
│
├─ Login
│  └─ Store tokens in localStorage
│     ├─ tm_access_token
│     └─ tm_refresh_token
│
├─ Every API Call
│  └─ httpHandler extracts token
│     ├─ Add "Bearer " prefix
│     ├─ Add to Authorization header
│     ├─ Add x-tenant-id from localStorage
│     │
│     └─ API validates
│        ├─ Verify JWT signature
│        ├─ Check tenant isolation
│        │
│        └─ Process request
│
├─ Token Refresh
│  └─ If 401 Unauthorized
│     ├─ Use refresh token
│     ├─ Get new access token
│     │
│     └─ Retry original request
│
└─ Logout
   └─ Clear tokens from localStorage
      └─ All subsequent requests fail with 401
```

---

## Summary

The notification system follows a clean architecture with:
- **Separation of concerns**: UI, Redux, and API layers are distinct
- **Unidirectional data flow**: Components → Actions → Redux → Components
- **Reusability**: Selectors and thunks can be used in any component
- **Error handling**: Comprehensive at every level
- **Performance**: Caching and optimistic updates
- **Security**: Automatic token and tenant ID management
- **Maintainability**: Clear structure and comprehensive documentation
