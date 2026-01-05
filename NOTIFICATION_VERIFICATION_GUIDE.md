# Notification System - Verification & Testing Guide

## Quick Verification Steps

### 1. Start the Development Server
```bash
npm run dev
```
The app should start on http://localhost:3000

### 2. Open Browser DevTools
- Press `F12` to open Developer Tools
- Go to Redux DevTools extension (if installed)
- Go to Application → LocalStorage to check tokens

### 3. Login to the Application
- Navigate to the login page
- Use your test credentials
- Upon successful login, notifications should be fetched automatically

### 4. Check Notification Badge
Look at the top navbar:
- ✅ **Bell icon** with notification count badge
- ✅ **Red circle badge** showing unread count
- ✅ **Number indicator** (or "9+" if more than 9 unread)

### 5. Click Notification Panel
Click the bell icon to see the dropdown:
- ✅ **Up to 5 unread notifications** displayed
- ✅ **Blue background** for unread notifications
- ✅ **Gray background** for read notifications (if any)
- ✅ **"New" badge** on unread notifications
- ✅ **Type badges** showing notification type
- ✅ **Timestamps** in relative format

## Visual Verification

### Expected Unread Notification Display

```
NAVBAR:
┌─────────────────────┐
│  [🔔9] Home | ...   │  ← Bell icon with badge showing 9 unread
└─────────────────────┘

DROPDOWN (after clicking bell):
┌──────────────────────────────────────┐
│ Unread (5)           [View All]      │
├──────────────────────────────────────┤
│ ■ ● System Announcement     [New]    │
│   Important system update            │
│   [SYSTEM] 2 days ago               │
├──────────────────────────────────────┤
│ ■ ● Client Added              [New]  │
│   A new client has been added        │
│   [CLIENT_ADDED] 5 days ago          │
└──────────────────────────────────────┘
```

**Legend:**
- `■` = Left border (blue for unread)
- `●` = Dot indicator (blue for unread)
- `[New]` = Unread badge (blue with white text)
- `[SYSTEM]` = Notification type badge

### Expected Read Notification Display

```
┌──────────────────────────────────────┐
│ ■ ● Update Complete                  │
│   Your report is ready to download   │
│   [REPORT] 1 week ago               │
└──────────────────────────────────────┘
```

**Changes from unread:**
- Left border is **gray** instead of blue
- Dot indicator is **gray** instead of blue
- NO "New" badge displayed

## Verify Read Status Handling

### Test 1: Check Redux State
1. Open Redux DevTools
2. Navigate to notifications state
3. Verify notifications array structure:

```javascript
notifications: [
  {
    id: 37,
    user_id: 23,
    title: "System Announcement",
    is_read: 0,      // Original API field
    read: false,     // Normalized boolean
    isRead: false,   // Normalized boolean
    type: "SYSTEM",
    created_at: "2026-01-03T06:55:23.000Z"
  },
  {
    id: 39,
    user_id: 23,
    title: "Client Added",
    is_read: 1,      // Original API field
    read: true,      // Normalized boolean
    isRead: true,    // Normalized boolean
    type: "CLIENT_ADDED",
    created_at: "2026-01-05T03:55:23.000Z"
  }
]
```

✅ **Verification**: All notifications have both `is_read` (API format) and `read`/`isRead` (normalized)

### Test 2: Check Unread Count
In Redux DevTools or browser console:
```javascript
// Open browser console (F12 → Console)
store.getState().notifications.unreadCount
```

Expected output: Number matching count of notifications where `is_read === 0`

### Test 3: Mark Notification as Read
1. Hover over an unread notification in the dropdown
2. Click the checkmark (✓) button
3. Notification should disappear from dropdown
4. Badge count should decrease by 1
5. Red circle badge should update

### Test 4: Delete Notification
1. Hover over any notification
2. Click the delete (×) button
3. Notification should disappear
4. Badge count should update if it was unread
5. Toast message should appear: "Notification deleted"

## Browser Console Commands

### View All Notifications
```javascript
store.getState().notifications.notifications
```

### View Unread Count
```javascript
store.getState().notifications.unreadCount
```

### View Unread Notifications Only
```javascript
store.getState().notifications.notifications.filter(n => !n.read)
```

### View Read Notifications Only
```javascript
store.getState().notifications.notifications.filter(n => n.read)
```

### Manually Trigger Fetch
```javascript
store.dispatch(fetchNotifications())
```

### Get Specific Notification
```javascript
store.getState().notifications.notifications.find(n => n.id === 37)
```

## Network Tab Verification

### Check API Calls
1. Open DevTools Network tab
2. Reload the page
3. Look for GET request to `/api/notifications`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 39,
      "user_id": 23,
      "title": "Client Added",
      "message": "A new client has been added",
      "type": "CLIENT_ADDED",
      "entity_type": "client",
      "entity_id": "62",
      "is_read": 1,
      "created_at": "2026-01-05T03:55:23.000Z"
    },
    {
      "id": 37,
      "user_id": 23,
      "title": "System Announcement",
      "message": "Important system update",
      "type": "SYSTEM",
      "entity_type": null,
      "entity_id": null,
      "is_read": 0,
      "created_at": "2026-01-03T06:55:23.000Z"
    }
  ]
}
```

### Check Mark as Read
When you click the checkmark button:
1. Look for PATCH request to `/api/notifications/{id}/read`
2. Check response contains `success: true`
3. Redux state should update
4. UI should refresh

### Check Delete
When you click the delete button:
1. Look for DELETE request to `/api/notifications/{id}`
2. Check response contains `success: true`
3. Notification should be removed from list
4. Badge count should update

## Troubleshooting Checklist

### ❌ Issue: No notifications showing

**Causes:**
1. API endpoint not accessible
2. Authentication token missing
3. Tenant ID not set correctly
4. No notifications created in backend

**Solutions:**
```javascript
// Check if notifications fetch is failing
store.getState().notifications.error

// Check if status is 'loading' or 'failed'
store.getState().notifications.status

// Check if fetch was called
// Look in Network tab for GET /api/notifications

// Verify token is set
localStorage.getItem('tm_access_token')

// Verify tenant ID is set
localStorage.getItem('tenantId')
```

### ❌ Issue: Badge shows wrong count

**Causes:**
1. Unread count not calculated correctly
2. is_read field not being recognized
3. Normalization not working

**Solutions:**
```javascript
// Check actual unread count
const unread = store.getState().notifications.notifications
  .filter(n => !n.read && !n.isRead && n.is_read !== 1)
  .length;
console.log('Actual unread count:', unread);

// Check Redux unread count
console.log('Redux unread count:', store.getState().notifications.unreadCount);

// Should match
```

### ❌ Issue: Read/unread status not displaying correctly

**Causes:**
1. is_read field not in API response
2. Normalization function not running
3. Component not rendering

**Solutions:**
```javascript
// Check if notifications have is_read field
store.getState().notifications.notifications
  .forEach(n => console.log('id:', n.id, 'is_read:', n.is_read, 'read:', n.read))

// Check if normalization is applied
const notif = store.getState().notifications.notifications[0];
console.log('has read field:', 'read' in notif);
console.log('has isRead field:', 'isRead' in notif);
console.log('read value:', notif.read);
console.log('isRead value:', notif.isRead);
```

### ❌ Issue: Mark as read button not working

**Causes:**
1. API endpoint not working
2. Token not being sent
3. Error in API call

**Solutions:**
```javascript
// Check Network tab for PATCH request
// Check response status (should be 200)
// Check error in browser console

// Manually try in console
store.dispatch(markNotificationAsRead(37))
  .then(() => console.log('Success'))
  .catch(err => console.error('Error:', err))
```

## Performance Verification

### Check Initial Load Time
1. Open DevTools Network tab
2. Reload page
3. Check time for GET `/api/notifications` request
4. Should be < 1 second typically

### Check Notification Count
- Typical: 0-50 notifications per user
- Display limit: 5 in dropdown, all on page
- Performance should be fine with up to 100+

### Check State Size
```javascript
JSON.stringify(store.getState().notifications).length
// Should be < 100KB for typical usage
```

## Accessibility Verification

### Check for Required Attributes
1. Bell icon has a title/aria-label
2. Buttons are keyboard accessible
3. Badge has proper color contrast
4. Timestamps are readable

### Keyboard Navigation
- Tab through notification items
- Enter to activate buttons
- Escape to close dropdown

## Mobile/Responsive Testing

### Test on Mobile View
1. Open DevTools
2. Enable device emulation (Ctrl+Shift+M)
3. Select different device sizes
4. Verify layout adapts:
   - Dropdown fits on screen
   - Buttons are easily tappable (44px minimum)
   - Text is readable
   - No horizontal scrolling

## Test Data Scenarios

### Scenario 1: All Unread
```javascript
// All notifications have is_read: 0
// Expected: Badge shows total count
// Expected: All notifications blue in dropdown
// Expected: All have "New" badge
```

### Scenario 2: All Read
```javascript
// All notifications have is_read: 1
// Expected: Badge shows 0
// Expected: Dropdown shows "You're all caught up!"
// Expected: All notifications gray if any shown
```

### Scenario 3: Mixed Read/Unread
```javascript
// Some is_read: 1, some is_read: 0
// Expected: Badge shows unread count
// Expected: Only unread in dropdown
// Expected: Correct color coding for each
```

### Scenario 4: Empty List
```javascript
// No notifications
// Expected: Badge shows 0 (or hidden)
// Expected: Dropdown shows "You're all caught up!"
// Expected: Full page shows empty state
```

### Scenario 5: New Notifications
```javascript
// Notifications added while app is open
// Expected: Badge count updates
// Expected: New notifications appear in dropdown
// Expected: No page reload needed
```

## Final Verification Checklist

### UI Components
- [ ] Bell icon displays in navbar
- [ ] Badge shows unread count
- [ ] Badge hides when count is 0
- [ ] Notification dropdown opens on click
- [ ] Notifications list shows correctly
- [ ] Unread notifications are blue
- [ ] Read notifications are gray
- [ ] "New" badge shows on unread
- [ ] Type badge displays notification type
- [ ] Timestamp displays in relative format
- [ ] Action buttons are visible on hover

### Functionality
- [ ] Notifications fetch on app load
- [ ] Badge updates automatically
- [ ] Dropdown shows up to 5 unread
- [ ] Mark as read button works
- [ ] Delete button works
- [ ] Full page filters by read/unread
- [ ] Loading state displays
- [ ] Error state displays
- [ ] Empty state displays

### Data Integrity
- [ ] API response format matches expected
- [ ] is_read field converted to boolean
- [ ] Unread count calculated correctly
- [ ] All notification fields preserved
- [ ] No data loss during normalization

### Performance
- [ ] Initial load time < 2 seconds
- [ ] Dropdown opens instantly
- [ ] State updates are smooth
- [ ] No memory leaks
- [ ] No console errors

### Compatibility
- [ ] Works with new API format (is_read: 1/0)
- [ ] Works with legacy boolean format
- [ ] Works with different field names
- [ ] Backward compatible

---

**Verification Complete!** ✅

If all checks pass, the notification system is working correctly and ready for production use.
