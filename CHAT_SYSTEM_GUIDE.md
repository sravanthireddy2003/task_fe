# 🚀 Real-Time Chat System - Complete Implementation Guide

## Overview
Complete real-time chat system with Socket.IO integration for Admin, Manager, and Employee roles using the backend API.

## ✅ What Was Implemented

### 1. Redux Chat Slice (`src/redux/slices/chatSlice.js`)
**Purpose:** Manage chat state globally using Redux Toolkit

**Features:**
- 5 async thunks for API integration:
  - `getProjectMessages` - Fetch message history
  - `sendChatMessage` - Send new message
  - `getProjectParticipants` - Get online members
  - `getChatStats` - Fetch chat statistics
  - `deleteChatMessage` - Delete a message

- 8 reducer actions:
  - `setCurrentProjectId` - Track active project
  - `addRealtimeMessage` - Add Socket.IO message
  - `updateParticipants` - Update member list
  - `addParticipant` - Add single participant
  - `removeParticipant` - Remove single participant
  - `removeMessageLocally` - Remove deleted message
  - `clearMessages` - Reset messages on project change
  - `clearError` - Clear error state

- 6 selectors for easy component access:
  - `selectChatMessages` - All messages
  - `selectParticipants` - Online participants
  - `selectChatStats` - Chat statistics
  - `selectMessageLoading` - Message loading state
  - `selectChatLoading` - Overall loading state
  - `selectChatError` - Error messages

### 2. Socket.IO Integration Hook (`src/hooks/useChat.js`)
**Purpose:** Manage real-time WebSocket connections

**Features:**
- Auto-connects to Socket.IO server with JWT auth
- Listens for real-time events:
  - `chat_message` - Incoming messages
  - `online_participants` - Member updates
  - `user_joined` - User joins chat
  - `user_left` - User leaves chat
  - `message_deleted` - Message deletion
  - `error` - Socket errors

- Provides helper functions:
  - `sendMessage(message)` - Send via Socket.IO
  - `sendTypingStart()` - Start typing indicator
  - `sendTypingStop()` - Stop typing indicator
  - `sendChatbotCommand(command)` - Execute chatbot commands

### 3. Reusable Chat Component (`src/components/ChatInterface.jsx`)
**Purpose:** Beautiful, feature-rich chat UI component

**Features:**
- **Message Display:**
  - Timestamps for each message
  - User avatars with initials
  - Message type badges (text/system/bot)
  - Auto-scroll to latest message
  - Color-coded messages (yours vs others)

- **Online Members Panel:**
  - Real-time member list
  - Online status indicators
  - User role display

- **Chat Statistics Panel:**
  - Total messages count
  - Unique participants
  - Online members now
  - Bot messages count
  - Last message time

- **Chatbot Commands:**
  - `/help` - Show commands
  - `/tasks` - List assigned tasks
  - `/status` - Show statistics
  - `/members` - Show project members
  - `/online` - Show online members
  - `/project` - Show project info

- **User Interactions:**
  - Send messages
  - Delete own messages
  - Typing indicators
  - Responsive design
  - Error handling with toast

### 4. Admin Chat Page (`src/pages/Chat.jsx`)
**Role:** Admin - View all projects

**Features:**
- Project selector dropdown
- Lists all projects in system
- Loads chat for selected project
- Real-time message updates
- Participant tracking

**Route:** `/admin/chat`

### 5. Manager Chat Page (`src/pages/ManagerChat.jsx`)
**Role:** Manager - View managed projects

**Features:**
- Auto-loads manager's projects
- Project selector dropdown
- Chat for managed projects only
- Real-time updates
- Team collaboration

**Route:** `/manager/chat`

**API Used:**
```
GET /api/projects?manager_id={userId}
```

### 6. Employee Chat Page (`src/pages/EmployeeChat.jsx`)
**Role:** Employee - View assigned projects

**Features:**
- Auto-loads assigned projects
- Project selector dropdown
- Chat for projects with assigned tasks
- Real-time updates
- Team communication

**Route:** `/employee/chat`

**API Used:**
```
GET /api/projects?user_id={userId}
```

## 🔌 API Endpoints Used

All endpoints require JWT token in `Authorization: Bearer <token>` header.

### Message Management
```
GET  /api/projects/{projectId}/chat/messages
POST /api/projects/{projectId}/chat/messages
DELETE /api/projects/{projectId}/chat/messages/{messageId}
```

### Participant Management
```
GET /api/projects/{projectId}/chat/participants
```

### Statistics
```
GET /api/projects/{projectId}/chat/stats
```

## 🔄 Socket.IO Events

### Client → Server
```javascript
// Join chat room
socket.emit('join_project_chat', projectId);

// Leave chat room
socket.emit('leave_project_chat', projectId);

// Send message
socket.emit('send_message', {
  projectId: 'PROJ_123',
  message: 'Hello team!'
});

// Typing indicators
socket.emit('typing_start', projectId);
socket.emit('typing_stop', projectId);

// Bot commands
socket.emit('chatbot_command', {
  projectId: 'PROJ_123',
  command: '/help'
});
```

### Server → Client
```javascript
// Receive message
socket.on('chat_message', (message) => {
  // { id, project_id, sender_id, sender_name, message, message_type, created_at }
});

// User joined
socket.on('user_joined', (data) => {
  // { userId, userName, userRole, timestamp }
});

// User left
socket.on('user_left', (data) => {
  // { userId, userName, timestamp }
});

// Online members updated
socket.on('online_participants', (participants) => {
  // Array of participant objects
});

// User typing
socket.on('user_typing', (data) => {
  // { userId, userName, isTyping: true/false }
});

// Message deleted
socket.on('message_deleted', (data) => {
  // { messageId, deleted_by }
});

// Error
socket.on('error', (error) => {
  // { message: 'Error description' }
});
```

## 🎯 Workflow & Usage

### For Users
1. Navigate to `/admin/chat`, `/manager/chat`, or `/employee/chat`
2. Select a project from dropdown
3. Chat interface loads with message history
4. See online participants in real-time
5. Send messages instantly
6. Type commands with `/` prefix for chatbot help
7. Delete own messages by hovering over them

### For Developers

#### Using ChatInterface Component
```jsx
import ChatInterface from '../components/ChatInterface';

<ChatInterface
  projectId="PROJ_123"
  projectName="My Project"
  authToken={localStorage.getItem('tm_access_token')}
  currentUserId={user?._id}
  currentUserName={user?.name}
/>
```

#### Using Redux Actions
```javascript
import { useDispatch, useSelector } from 'react-redux';
import {
  getProjectMessages,
  sendChatMessage,
  selectChatMessages,
} from '../redux/slices/chatSlice';

const dispatch = useDispatch();
const messages = useSelector(selectChatMessages);

// Fetch messages
dispatch(getProjectMessages({ 
  projectId: 'PROJ_123', 
  limit: 50, 
  offset: 0 
}));

// Send message
dispatch(sendChatMessage({
  projectId: 'PROJ_123',
  message: 'Hello!'
}));
```

#### Using Socket.IO Hook
```javascript
import useChat from '../hooks/useChat';

const { 
  sendMessage, 
  sendTypingStart, 
  sendTypingStop,
  sendChatbotCommand 
} = useChat(projectId, authToken);

// Send message
sendMessage('Hello everyone!');

// Typing indicator
sendTypingStart();
// ... after 3 seconds auto-stops

// Bot command
sendChatbotCommand('/help');
```

## 📦 Redux Store Integration

The chat slice is registered in `src/redux/store.js`:

```javascript
import chatReducer from './slices/chatSlice';

const store = configureStore({
  reducer: {
    // ... other reducers
    chat: chatReducer,
  },
});
```

## 🎨 UI Features

### Message Types
- **Text Messages** - Normal user messages (blue for sender, gray for others)
- **System Messages** - Gray background, italic text
- **Bot Messages** - Purple background, chatbot responses

### Status Indicators
- 🟢 Green dot - User is online
- ⏱️ Timestamp - When message was sent
- 🗑️ Delete button - Appears on hover for own messages

### Responsive Design
- Mobile: Single column, optimized buttons
- Tablet: Dropdown project selector + chat
- Desktop: Full interface with all panels

## 🔒 Security Features

✅ JWT token authentication on Socket.IO
✅ Per-project access validation
✅ Role-based chat visibility
✅ Message ownership for deletion
✅ Secure API endpoints with CORS

## 🧪 Testing

### Manual Testing Checklist
- [ ] Admin can view all project chats
- [ ] Manager can view only managed projects
- [ ] Employee can view only assigned projects
- [ ] Messages send and appear in real-time
- [ ] Participants list updates live
- [ ] Statistics panel shows correct data
- [ ] Chatbot commands work (e.g., `/help`)
- [ ] Messages can be deleted by sender
- [ ] Typing indicators work
- [ ] Socket.IO reconnects on disconnect
- [ ] Error handling works (no message = error toast)
- [ ] Mobile responsive works
- [ ] Multiple projects can be switched

### Test Commands in Browser
```javascript
// Open browser console and test
const state = store.getState();
console.log(state.chat.messages);
console.log(state.chat.participants);
console.log(state.chat.stats);
```

## 📊 Performance Optimizations

- **Redux Memoization:** Messages/participants cached until refresh
- **Pagination:** Load 50 messages at a time
- **Lazy Loading:** Messages load on-demand
- **Socket.IO Buffering:** Messages queued if disconnected
- **Auto-scroll:** Only on new messages, not on scroll up
- **Typing Debounce:** 3-second timeout before auto-stop

## 🚀 Future Enhancements

1. **Message Search** - Search across message history
2. **File Uploads** - Share images/documents in chat
3. **Message Reactions** - Emoji reactions to messages
4. **Threading** - Reply to specific messages
5. **Message Editing** - Edit sent messages
6. **Rich Text** - Bold, italic, code formatting
7. **Notifications** - Chat notifications in real-time
8. **Chat Export** - Download chat history
9. **Mentions** - @mention users in chat
10. **Chat Analytics** - Message frequency, top contributors

## 📁 File Structure

```
src/
├── redux/slices/
│   └── chatSlice.js              (API & state management)
├── hooks/
│   └── useChat.js                (Socket.IO integration)
├── components/
│   └── ChatInterface.jsx          (Reusable chat UI)
└── pages/
    ├── Chat.jsx                  (Admin chat)
    ├── ManagerChat.jsx           (Manager chat)
    └── EmployeeChat.jsx          (Employee chat)
```

## 🔌 Environment Variables

Make sure `.env` has:
```
VITE_SERVERURL=http://localhost:4000
```

The Socket.IO connection will automatically use this URL.

## ✨ Summary

**Status:** ✅ COMPLETE & READY TO USE

All three chat interfaces are fully implemented with:
- ✅ Real-time Socket.IO messaging
- ✅ REST API integration
- ✅ Redux state management
- ✅ Role-based access (Admin/Manager/Employee)
- ✅ Beautiful responsive UI
- ✅ Error handling & loading states
- ✅ Chatbot command support
- ✅ Online participant tracking
- ✅ Chat statistics
- ✅ Message deletion
- ✅ Typing indicators

Start chatting now! 🎉
