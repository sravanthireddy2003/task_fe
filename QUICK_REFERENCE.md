# Notification System - Quick Reference Commands

## 🚀 Getting Started

### Development Server
```bash
# Start development server (default port 3000)
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

## 📋 Files to Review

### Core Implementation
```bash
# View the Redux slice
cat src/redux/slices/notificationSlice.js

# View the updated store
cat src/redux/store.js

# View NotificationPanel
cat src/components/NotificationPanel.jsx

# View Navbar integration
cat src/components/Navbar.jsx

# View Notifications page
cat src/pages/Notifications.jsx
```

### Documentation
```bash
# Complete API documentation
cat NOTIFICATION_API_INTEGRATION.md

# Quick start guide
cat NOTIFICATION_QUICK_START.md

# Architecture and diagrams
cat NOTIFICATION_ARCHITECTURE.md

# Implementation summary
cat NOTIFICATION_IMPLEMENTATION_SUMMARY.md

# Verification checklist
cat NOTIFICATION_CHECKLIST.md

# This implementation report
cat IMPLEMENTATION_REPORT.md
```

## 🔍 Verification Commands

### Check Redux Integration
```bash
# Verify notification reducer in store
grep "notifications: notificationReducer" src/redux/store.js

# Verify notificationSlice exists
test -f src/redux/slices/notificationSlice.js && echo "✅ notificationSlice.js exists"

# Count selectors in notification slice
grep -c "export const select" src/redux/slices/notificationSlice.js

# Count thunks in notification slice
grep -c "export const.*Thunk\|export const.*Async" src/redux/slices/notificationSlice.js
```

### Check Component Integration
```bash
# Verify NotificationPanel imported in Navbar
grep "NotificationPanel" src/components/Navbar.jsx

# Verify notification redux imports in NotificationPanel
grep "redux/slices/notificationSlice" src/components/NotificationPanel.jsx

# Verify Notifications page exists
test -f src/pages/Notifications.jsx && echo "✅ Notifications.jsx exists"
```

### Check Imports and Dependencies
```bash
# Check if lucide-react is in package.json
grep "lucide-react" package.json

# Check if sonner is in package.json
grep "sonner" package.json

# Check if redux is in package.json
grep "redux" package.json

# List all notification imports
grep -r "notification" src/ --include="*.jsx" --include="*.js" | grep import
```

## 🧪 Testing Commands

### Run Development Build
```bash
# Start dev server
npm run dev

# In another terminal, test API endpoints with curl
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "x-tenant-id: YOUR_TENANT_ID" \
     http://localhost:4000/api/notifications
```

### Test with Postman/Thunder Client
```bash
# GET all notifications
GET http://localhost:4000/api/notifications
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  x-tenant-id: YOUR_TENANT_ID

# Mark as read
PATCH http://localhost:4000/api/notifications/NOTIFICATION_ID/read
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  x-tenant-id: YOUR_TENANT_ID
Body: {}

# Mark all as read
PATCH http://localhost:4000/api/notifications/read-all
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  x-tenant-id: YOUR_TENANT_ID
Body: {}

# Delete notification
DELETE http://localhost:4000/api/notifications/NOTIFICATION_ID
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  x-tenant-id: YOUR_TENANT_ID
```

### Browser Console Testing
```javascript
// Get Redux store (if exposed in window)
const state = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ 
  ? store.getState() 
  : null;

// Check notifications state
console.log(state?.notifications);

// Check unread count
console.log(state?.notifications?.unreadCount);

// Manually dispatch fetch (for testing)
// store.dispatch(fetchNotifications())

// Check if notifications exist
console.log('Notifications:', state?.notifications?.notifications?.length);
```

## 🐛 Debugging Commands

### Check LocalStorage
```javascript
// In browser console:

// Check token
localStorage.getItem('tm_access_token')

// Check tenant ID
localStorage.getItem('tenantId')

// Check user info
JSON.parse(localStorage.getItem('userInfo'))
```

### Check Network Requests
```bash
# In browser DevTools:
# 1. Open DevTools (F12)
# 2. Go to Network tab
# 3. Trigger notification action
# 4. Look for api/notifications requests
# 5. Check request headers:
#    - Authorization: Bearer...
#    - x-tenant-id: ...
# 6. Check response status (200 = success)
# 7. Check response body for data
```

### Check Redux DevTools
```bash
# In browser:
# 1. Install Redux DevTools Extension
# 2. Open Redux DevTools from browser menu
# 3. Look for notifications state
# 4. Watch actions: 
#    - notifications/fetchNotifications/pending
#    - notifications/fetchNotifications/fulfilled
#    - notifications/fetchNotifications/rejected
# 5. Inspect state changes
# 6. Replay actions
```

## 📊 File Statistics

### Line Counts
```bash
# Count lines in key files
wc -l src/redux/slices/notificationSlice.js    # Should be ~200
wc -l src/components/NotificationPanel.jsx     # Should be ~228
wc -l src/pages/Notifications.jsx              # Should be ~380
wc -l src/components/Navbar.jsx                # Should be ~37

# Count documentation lines
wc -l NOTIFICATION_*.md IMPLEMENTATION_REPORT.md
```

### Code Statistics
```bash
# Count thunks
grep -c "createAsyncThunk" src/redux/slices/notificationSlice.js

# Count selectors
grep -c "export const select" src/redux/slices/notificationSlice.js

# Count reducers
grep -c "\.addCase\|reducers:" src/redux/slices/notificationSlice.js

# Count components using notifications
grep -r "notificationSlice\|selectNotifications" src/ --include="*.jsx" | wc -l
```

## 🔧 Useful Aliases

### Add to your `.bashrc` or `.zshrc`

```bash
# View notification files
alias viznot='echo "=== notificationSlice.js ===" && cat src/redux/slices/notificationSlice.js | head -50'

# Check notification integration
alias checkznot='echo "=== Checking Notification Integration ===" && \
  grep -l "notificationSlice\|selectNotifications" src/components/*.jsx src/pages/*.jsx'

# Run dev with notification focus
alias devznot='echo "Starting dev server..." && npm run dev'

# Check API endpoints in docs
alias apiznot='grep -A 5 "GET\|PATCH\|DELETE" NOTIFICATION_API_INTEGRATION.md'
```

## 📈 Performance Monitoring

### Check Bundle Size
```bash
# Build and check size
npm run build

# Check main bundle size
ls -lh dist/assets/*.js | grep main

# Analyze with vite-plugin-visualizer (if available)
npm run build -- --visualize
```

### Monitor API Performance
```javascript
// In browser console:
console.time('Fetch Notifications');
// API call happens
console.timeEnd('Fetch Notifications');

// Check actual network time in DevTools Network tab
// Look for api/notifications request
// Check "Time" column
```

## 🚢 Deployment Checklist

```bash
# Before deploying:

# 1. Run tests
npm test

# 2. Run linter
npm run lint

# 3. Build for production
npm run build

# 4. Check bundle size
du -sh dist/

# 5. Verify no console errors
# (manually test in browser)

# 6. Check environment variables
echo "VITE_SERVERURL: $VITE_SERVERURL"
echo "VITE_TENANT_ID: $VITE_TENANT_ID"

# 7. Deploy dist/ directory
# scp -r dist/ user@server:/path/to/app/
```

## 🆘 Emergency Fixes

### Reset Notification State
```javascript
// In browser console (Redux DevTools):
// 1. Open Redux DevTools
// 2. Find clearNotifications action
// 3. Dispatch it
// 4. State will be reset

// Or in code:
dispatch(clearNotifications());
```

### Force Fetch Notifications
```javascript
// In browser console:
// 1. Open Redux DevTools
// 2. Dispatch fetchNotifications
// 3. OR in component:
dispatch(fetchNotifications());
```

### Clear All Cached Notifications
```javascript
// Clear LocalStorage
localStorage.clear();

// Reload page
location.reload();

// This will force fresh authentication and data fetch
```

## 📞 Useful Links

### Documentation Files
- `NOTIFICATION_API_INTEGRATION.md` - Full API reference
- `NOTIFICATION_QUICK_START.md` - Getting started guide
- `NOTIFICATION_ARCHITECTURE.md` - System design
- `NOTIFICATION_IMPLEMENTATION_SUMMARY.md` - Feature overview
- `NOTIFICATION_CHECKLIST.md` - Verification tasks
- `IMPLEMENTATION_REPORT.md` - Detailed report

### Frontend Files
- `src/redux/slices/notificationSlice.js` - Redux logic
- `src/components/NotificationPanel.jsx` - Dropdown component
- `src/components/Navbar.jsx` - Header integration
- `src/pages/Notifications.jsx` - Full page
- `src/redux/store.js` - Store config

### Backend Integration
- Backend API: `http://localhost:4000/api/notifications`
- Auth header: `Authorization: Bearer <token>`
- Tenant header: `x-tenant-id: <tenant_id>`

## 🎯 Common Tasks

### Add Notification Feature to New Component
```javascript
import { useDispatch, useSelector } from 'react-redux';
import {
  selectNotifications,
  selectUnreadCount,
  fetchNotifications,
} from '../redux/slices/notificationSlice';

function MyComponent() {
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  return <div>You have {unreadCount} notifications</div>;
}
```

### Test API Endpoint
```bash
# Test GET endpoint
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-tenant-id: YOUR_TENANT_ID" \
  http://localhost:4000/api/notifications | jq .

# Test PATCH endpoint
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-tenant-id: YOUR_TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:4000/api/notifications/NOTIF_ID/read | jq .

# Test DELETE endpoint
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-tenant-id: YOUR_TENANT_ID" \
  http://localhost:4000/api/notifications/NOTIF_ID | jq .
```

### Monitor Redux Actions
```javascript
// In browser Redux DevTools:
// 1. Click on Redux DevTools in browser
// 2. Go to Diff tab
// 3. Expand notifications
// 4. Watch state changes as you interact
// 5. Dispatch/replay actions for testing
```

## 📚 Learning Resources

### Redux Concepts
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)
- [Async Thunks](https://redux-toolkit.js.org/api/createAsyncThunk)

### React Patterns
- [React Hooks](https://react.dev/reference/react)
- [useSelector Hook](https://react-redux.js.org/api/hooks#useselector)
- [useDispatch Hook](https://react-redux.js.org/api/hooks#usedispatch)

### Styling
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

### HTTP Clients
- [Axios Documentation](https://axios-http.com/)
- [API Best Practices](https://restfulapi.net/)

---

**Last Updated**: January 2024
**Version**: 1.0
**Status**: Production Ready
