# 🧪 Real-Time Chat - Quick Test Checklist

## Pre-Test Checklist
- [ ] Backend server running and Socket.IO enabled
- [ ] Frontend dev server running (`npm run dev`)
- [ ] Browser DevTools open (F12) and Console visible
- [ ] Have 2 browser windows/tabs open with chat

---

## Test 1: Real-Time Message Delivery ⚡
**Goal:** Messages appear instantly without page reload

**Steps:**
1. Open chat in **Window A** (Tab 1)
2. Open same chat in **Window B** (Tab 2)
3. Send message from **Window A**
4. **Expected:** Message appears INSTANTLY in **Window B**
5. Look for log: `[Chat] Received message:`

**Result:**
- ✅ Pass: Message visible in <1 second
- ❌ Fail: Message doesn't appear or takes >5 seconds

---

## Test 2: Connection Status Indicator 🟢
**Goal:** See live connection indicator in header

**Steps:**
1. Open chat and look at top header
2. Should see **green dot** with "Live" text
3. Look for **pulsing animation**

**Expected Indicators:**
- 🟢 Green + pulsing = Connected
- 🟠 Orange + steady = Reconnecting
- ❌ Red = Disconnected

**Result:**
- ✅ Pass: Shows appropriate status
- ❌ Fail: Shows wrong status or missing

---

## Test 3: Cross-Module Navigation 🔄
**Goal:** Messages stay synced when navigating away and back

**Steps:**
1. Have chat open in **Window A**
2. Send a message in chat
3. Click on different module (Tasks, Projects, etc.)
4. Wait 3 seconds
5. Click back to Chat
6. **Expected:** New messages from **Window B** visible

**Result:**
- ✅ Pass: Messages visible without reload
- ❌ Fail: Messages only appear after reload

---

## Test 4: Console Logging 📊
**Goal:** Verify messages are being sent/received

**Steps:**
1. Open browser DevTools → Console tab
2. Send message in chat
3. Look for these logs:
   ```
   [Chat] Sending message: ...
   [Chat] Received message: ...
   ```

**Expected Logs:**
- `[Chat] Socket.IO connected: ...`
- `[Chat] Joining room: [projectId]`
- `[Chat] Sending message: [text]`
- `[Chat] Received message: [object]`
- `[Chat] Updated participants: [count]`

**Result:**
- ✅ Pass: All logs present
- ❌ Fail: Missing logs or errors shown

---

## Test 5: Typing Indicators 🖊️
**Goal:** See typing status of other users

**Steps:**
1. In **Window A:** Click message input (don't type)
2. In **Window A:** Type a message slowly
3. In **Window B:** Should see indicator that **Window A** user is typing
4. In **Window A:** Stop typing for 3 seconds
5. In **Window B:** Indicator should disappear

**Result:**
- ✅ Pass: Typing status updates in real-time
- ⚠️ Partial: Appears but with delay
- ❌ Fail: No typing indicators at all

---

## Test 6: Multiple Projects 📁
**Goal:** Switch projects and see correct messages

**Steps:**
1. Open project **ABC** in chat
2. Send message in project **ABC**
3. Switch to project **XYZ** in dropdown
4. Send message in project **XYZ**
5. Switch back to project **ABC**
6. **Expected:** See original message for ABC

**Result:**
- ✅ Pass: Each project has correct messages
- ❌ Fail: Messages mixed between projects

---

## Test 7: Message Deletion 🗑️
**Goal:** Deleted messages removed in real-time

**Steps:**
1. Send message in chat
2. Hover over message (delete button appears)
3. Click delete button in **Window A**
4. Confirm deletion
5. **Expected:** Message disappears in **Window B** instantly

**Result:**
- ✅ Pass: Deleted instantly for all users
- ⚠️ Partial: Deleted with delay
- ❌ Fail: Doesn't delete or only disappears after reload

---

## Test 8: Participants List 👥
**Goal:** Live participants tracking

**Steps:**
1. Open chat in **Window A**
2. Open chat in **Window B**
3. Click 👥 button to show participants
4. **Expected:** Both users visible in list
5. Close **Window B**
6. Wait 5 seconds
7. **Expected:** User disappears from list

**Result:**
- ✅ Pass: Participants update in real-time
- ⚠️ Partial: Updates with 5-10 second delay
- ❌ Fail: Doesn't update

---

## Test 9: Error Recovery 🔧
**Goal:** System handles errors gracefully

**Steps:**
1. Open DevTools → Network tab
2. Set network to "Offline"
3. Try to send message
4. **Expected:** Error toast shown
5. Set network back to "Online"
6. Send message again
7. **Expected:** Message sends successfully

**Result:**
- ✅ Pass: Handles offline gracefully
- ⚠️ Partial: Shows error but recovery slow
- ❌ Fail: Crashes or doesn't recover

---

## Test 10: Chat Statistics 📊
**Goal:** Statistics update in real-time

**Steps:**
1. Click 📊 button to show statistics
2. Note the message count
3. Send new message in **Window A**
4. Watch statistics in **Window B**
5. **Expected:** Message count increases

**Result:**
- ✅ Pass: Updates within 5 seconds
- ⚠️ Partial: Updates but slow
- ❌ Fail: Doesn't update

---

## Test 11: Chatbot Commands 🤖
**Goal:** Bot commands work in real-time

**Steps:**
1. Type `/help` in chat input
2. Click send
3. **Expected:** Help message appears from bot
4. Type `/tasks` in chat input
5. **Expected:** Task list appears from bot

**Result:**
- ✅ Pass: Commands execute and return results
- ⚠️ Partial: Commands work but slow
- ❌ Fail: Commands don't work

---

## Test 12: Auto-Reconnection 🔌
**Goal:** System auto-reconnects after connection loss

**Steps:**
1. Open chat
2. Open DevTools → Network tab
3. Right-click network panel → Disconnect
4. Try to send message
5. **Expected:** See "Reconnecting..." in header
6. Right-click → Reconnect
7. Wait a few seconds
8. **Expected:** Status changes back to "Live"

**Result:**
- ✅ Pass: Auto-reconnects within 5 seconds
- ⚠️ Partial: Reconnects but takes time
- ❌ Fail: Doesn't reconnect

---

## Summary Table

| Test | Expected | Result | Notes |
|------|----------|--------|-------|
| 1. Real-Time Messages | ✅ | | |
| 2. Status Indicator | ✅ | | |
| 3. Cross-Module Nav | ✅ | | |
| 4. Console Logging | ✅ | | |
| 5. Typing Indicators | ✅ | | |
| 6. Multiple Projects | ✅ | | |
| 7. Message Deletion | ✅ | | |
| 8. Participants List | ✅ | | |
| 9. Error Recovery | ✅ | | |
| 10. Chat Statistics | ✅ | | |
| 11. Chatbot Commands | ✅ | | |
| 12. Auto-Reconnection | ✅ | | |

**Overall Result:** _______________

---

## Notes & Observations

```
[Space for notes]




```

---

## Issues Found

```
[List any issues found during testing]




```

---

## Sign Off

- **Tested by:** ___________________
- **Date:** ___________________
- **Status:** ✅ All Tests Pass / ⚠️ Some Issues / ❌ Major Issues

---

## Commands for Debugging

### Check Socket Connection Status
```javascript
// In browser console:
console.log('Connected:', io.sockets.connected);
```

### View Redux Chat State
```javascript
// In browser console (if Redux DevTools installed):
store.getState().chat
```

### Force Refresh Data
```javascript
// In browser console:
dispatch(getProjectMessages({ projectId: 'YOUR_PROJECT_ID' }))
```

### Clear All Messages
```javascript
// In Redux DevTools:
dispatch(clearMessages())
```

---

## Support

If tests fail:
1. Check backend logs for Socket.IO events
2. Verify `VITE_SERVERURL` environment variable
3. Check firewall/proxy blocking WebSocket
4. Try fresh browser tab/window
5. Clear browser cache and reload

**Status: READY FOR TESTING** ✅
