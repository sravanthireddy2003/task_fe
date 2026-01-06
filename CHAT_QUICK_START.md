# 💬 Real-Time Chat System - Quick Start Guide

## 🎯 Overview
Complete real-time chat system for Task Manager with Socket.IO integration, built for Admin, Manager, and Employee roles.

## ✅ What's Implemented

| Feature | Status | Location |
|---------|--------|----------|
| Redux Chat Slice | ✅ | `src/redux/slices/chatSlice.js` |
| Socket.IO Hook | ✅ | `src/hooks/useChat.js` |
| Chat UI Component | ✅ | `src/components/ChatInterface.jsx` |
| Admin Chat Page | ✅ | `src/pages/Chat.jsx` |
| Manager Chat Page | ✅ | `src/pages/ManagerChat.jsx` |
| Employee Chat Page | ✅ | `src/pages/EmployeeChat.jsx` |
| API Integration | ✅ | httpHandler (existing) |
| Redux Registration | ✅ | `src/redux/store.js` |
| Route Configuration | ✅ | `src/App.jsx` |

## 🚀 Routes Available

### Admin
```
/admin/chat → Chat.jsx
```
View all projects and their chats

### Manager
```
/manager/chat → ManagerChat.jsx
```
View only managed projects and chats

### Employee
```
/employee/chat → EmployeeChat.jsx
```
View only assigned projects and chats

## 🔧 Usage

### Access via Sidebar
1. Click "Chat / Real-Time Collaboration" in sidebar
2. Select a project from dropdown
3. Start chatting!

### API Endpoints Used
```
GET  /api/projects/{projectId}/chat/messages
POST /api/projects/{projectId}/chat/messages
GET  /api/projects/{projectId}/chat/participants
GET  /api/projects/{projectId}/chat/stats
DELETE /api/projects/{projectId}/chat/messages/{messageId}
```

### Socket.IO Events
```javascript
// Real-time message delivery
socket.on('chat_message', (message) => {});

// User presence
socket.on('user_joined', (data) => {});
socket.on('user_left', (data) => {});

// Participant updates
socket.on('online_participants', (participants) => {});

// Typing indicators
socket.on('user_typing', (data) => {});

// Message deletion
socket.on('message_deleted', (data) => {});
```

## 🎨 UI Components

### ChatInterface.jsx - Main Component
- **Message Display:**
  - User avatars with initials
  - Timestamps for each message
  - Auto-scroll to latest
  - Color-coded (yours = blue, others = gray)

- **Header Panel:**
  - Project name display
  - Statistics button
  - Participants button
  - Chatbot help button

- **Statistics Panel:**
  - Total messages
  - Unique senders
  - Online members
  - Bot messages
  - Last message time

- **Participants Panel:**
  - Online member list
  - User roles
  - Green online indicator

- **Chatbot Panel:**
  - `/help` - Show commands
  - `/tasks` - List tasks
  - `/status` - Show stats
  - `/members` - Project members
  - `/online` - Online members
  - `/project` - Project info

- **Message Input:**
  - Type message area
  - Send button
  - Auto typing indicators
  - Placeholder with help text

## 🔄 Redux State

```javascript
state.chat = {
  messages: [],           // Array of message objects
  participants: [],       // Array of online users
  stats: null,           // Statistics object
  loading: false,        // Overall loading state
  messageLoading: false, // Message fetch loading
  error: null,          // Error message string
  currentProjectId: null, // Active project ID
  pagination: {         // Pagination info
    limit: 50,
    offset: 0
  },
  hasMore: true        // More messages available
}
```

## 🎯 Core Functions

### Get Messages
```javascript
dispatch(getProjectMessages({
  projectId: 'PROJ_123',
  limit: 50,
  offset: 0
}));
```

### Send Message
```javascript
dispatch(sendChatMessage({
  projectId: 'PROJ_123',
  message: 'Hello team!'
}));
```

### Get Participants
```javascript
dispatch(getProjectParticipants('PROJ_123'));
```

### Get Statistics
```javascript
dispatch(getChatStats('PROJ_123'));
```

### Delete Message
```javascript
dispatch(deleteChatMessage({
  projectId: 'PROJ_123',
  messageId: 157
}));
```

## 🔌 Socket.IO Usage

### Connect & Send Message
```javascript
const { sendMessage, sendTypingStart, sendTypingStop } = 
  useChat(projectId, authToken);

// Send message
sendMessage('Hello!');

// Show typing
sendTypingStart();
// Auto-stops after 3 seconds
```

### Chatbot Commands
```javascript
const { sendChatbotCommand } = useChat(projectId, authToken);

// Get help
sendChatbotCommand('/help');

// List tasks
sendChatbotCommand('/tasks');

// Check status
sendChatbotCommand('/status');
```

## 🎨 Message Features

### Message Types
- 💬 **Text Messages** - Normal user messages
- 🤖 **Bot Messages** - System chatbot responses
- ℹ️ **System Messages** - System notifications

### Actions Available
- ✏️ Delete message (own messages only)
- ⏱️ View timestamp
- 👤 See sender name
- 🟢 Online indicator

## 📱 Responsive Design

### Mobile
- Single column layout
- Dropdown project selector
- Full-screen chat
- Touch-friendly buttons

### Tablet
- Project selector + chat side by side
- Optimized spacing
- All features accessible

### Desktop
- Side-by-side layout
- All panels visible
- Statistics always shown
- Smooth scrolling

## 🔐 Security

✅ **JWT Authentication:**
- Token in Socket.IO auth header
- All REST APIs require Bearer token

✅ **Access Control:**
- Admin: All projects
- Manager: Managed projects only
- Employee: Assigned projects only

✅ **Message Safety:**
- Delete only own messages
- Admin can override
- Audit trail maintained

## 🧪 Testing the Chat

### Test as Admin
```
1. Login as Admin user
2. Navigate to /admin/chat
3. Select any project
4. Send test message
5. Should appear in real-time
6. Check stats/participants
7. Try chatbot: /help
```

### Test as Manager
```
1. Login as Manager user
2. Navigate to /manager/chat
3. See only managed projects
4. Send message to team
5. Check real-time updates
6. Try commands: /tasks
```

### Test as Employee
```
1. Login as Employee user
2. Navigate to /employee/chat
3. See only assigned projects
4. Send message to manager
5. View online team members
6. Try commands: /status
```

## 📊 Performance

- **Message Load:** 50 messages per request (configurable)
- **Pagination:** Scroll up to load older messages
- **Auto-scroll:** Only on new messages
- **Socket.IO:** Reconnects automatically
- **Redux:** Memoized selectors prevent re-renders

## 🆘 Troubleshooting

### Messages not sending
- Check JWT token in localStorage
- Verify Socket.IO connection
- Check browser console for errors
- Ensure `/api/projects/{projectId}/chat/messages` endpoint works

### No online participants
- Verify Socket.IO server is running
- Check network tab for WebSocket connection
- Ensure `VITE_SERVERURL` is correct
- Check server logs for connection issues

### Chatbot not responding
- Try `/help` command first
- Check server has chatbot service enabled
- Verify command syntax (lowercase, with /)
- Check server console for bot errors

### Messages not real-time
- Verify Socket.IO connected
- Check if message appears after refresh
- Try disconnecting and reconnecting
- Check network latency

## 📚 Documentation

- **Full Guide:** `CHAT_SYSTEM_GUIDE.md`
- **API Reference:** Backend Postman collection
- **Socket.IO Docs:** https://socket.io/docs/

## ✨ Key Features Summary

| Feature | Details |
|---------|---------|
| **Real-Time** | Socket.IO instant messaging |
| **Persistent** | Messages saved to database |
| **Online Status** | See who's online in real-time |
| **Chatbot** | Built-in `/help` commands |
| **Statistics** | Message counts and analytics |
| **Mobile** | Fully responsive design |
| **Secure** | JWT auth + role-based access |
| **Scalable** | Pagination & efficient loading |
| **User-Friendly** | Intuitive UI with visual feedback |

## 🚀 Next Steps

1. **Start using:** Navigate to `/admin/chat`, `/manager/chat`, or `/employee/chat`
2. **Integrate:** Add chat to other pages using `ChatInterface` component
3. **Customize:** Modify UI colors/fonts in `ChatInterface.jsx`
4. **Extend:** Add features like file uploads, message search, etc.

---

**Status:** ✅ Ready to Use!

Start chatting with your team now! 💬🎉
