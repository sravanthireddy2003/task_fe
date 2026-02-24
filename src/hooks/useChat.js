import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import io from 'socket.io-client';
import { WS_BASE_URL } from '../utils/envConfig';
import {
  addRealtimeMessage,
  updateParticipants,
  addParticipant,
  removeParticipant,
  removeMessageLocally,
} from '../redux/slices/chatSlice';

export const useChat = (projectId, authToken, callbacks = {}) => {
  const socketRef = useRef(null);
  const dispatch = useDispatch();
  const projectIdRef = useRef(projectId);
  const connectedProjectRef = useRef(null);
  const { onMessageReceived } = callbacks;

  // ✅ Update project ID ref when it changes
  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  // ✅ Initialize Socket.IO connection (persistent)
  useEffect(() => {
    if (!authToken) return;

    const serverUrl = WS_BASE_URL || undefined;
    
    // ✅ Create connection if it doesn't exist
    if (!socketRef.current) {
      socketRef.current = io(serverUrl, {
        auth: { token: authToken },
        reconnection: true,
        reconnectionDelay: 500,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        transports: ['websocket', 'polling'],
      });
      socketRef.current.on('connect', () => {});
      socketRef.current.on('disconnect', () => {});
      socketRef.current.on('connect_error', () => {});
    }

    return () => {
      // Don't disconnect here - keep persistent connection
    };
  }, [authToken]);

  // ✅ Handle project room changes
  useEffect(() => {
    if (!projectId || !socketRef.current) return;

    // Leave previous room if different
    if (connectedProjectRef.current && connectedProjectRef.current !== projectId) {
      socketRef.current.emit('leave_project_chat', connectedProjectRef.current);
    }

    // Join new room
    socketRef.current.emit('join_project_chat', projectId);
    connectedProjectRef.current = projectId;
  }, [projectId]);

  // ✅ Setup event listeners
  useEffect(() => {
    if (!socketRef.current) return;

    // ✅ Listen for incoming messages - REAL-TIME (IMMEDIATE DISPATCH + FETCH)
    const handleChatMessage = (message) => {
      if (message && (message.id || message._id)) {
        dispatch(addRealtimeMessage(message));
        
        if (onMessageReceived) {
          onMessageReceived();
        }
      } else {
        
      }
    };

    // ✅ Listen for participants update - REAL-TIME
    const handleParticipants = (participants) => {
      if (participants && Array.isArray(participants)) {
        dispatch(updateParticipants(participants));
      }
    };

    // ✅ Listen for user joined - REAL-TIME
    const handleUserJoined = (data) => {
      if (data?.userId) {
        dispatch(addParticipant({
          user_id: data.userId,
          user_name: data.userName || 'Unknown',
          user_role: data.userRole || 'user',
          is_online: true,
          last_seen: new Date().toISOString(),
        }));
      }
    };

    // ✅ Listen for user left - REAL-TIME
    const handleUserLeft = (data) => {
      if (data?.userId) {
        dispatch(removeParticipant(data.userId));
      }
    };

    // ✅ Listen for message deletion - REAL-TIME
    const handleMessageDeleted = (data) => {
      if (data?.messageId) {
        dispatch(removeMessageLocally(data.messageId));
      }
    };

    // ✅ Listen for errors
    const handleError = (error) => {};

    // ✅ Listen for new messages batch (fallback)
    const handleNewMessages = (messages) => {
      if (messages && Array.isArray(messages)) {
        messages.forEach(msg => {
          if (msg && (msg.id || msg._id)) {
            dispatch(addRealtimeMessage(msg));
          }
        });
        // ✅ Trigger callback to fetch fresh messages immediately
        if (onMessageReceived) {
          onMessageReceived();
        }
      }
    };

    // Register listeners - Order matters!
    socketRef.current.on('chat_message', handleChatMessage);
    socketRef.current.on('new_message', handleChatMessage); // Fallback event name
    socketRef.current.on('message_received', handleChatMessage); // Another fallback
    socketRef.current.on('new_messages_batch', handleNewMessages);
    socketRef.current.on('online_participants', handleParticipants);
    socketRef.current.on('user_joined', handleUserJoined);
    socketRef.current.on('user_left', handleUserLeft);
    socketRef.current.on('message_deleted', handleMessageDeleted);
    socketRef.current.on('error', handleError);

    // ✅ Cleanup listeners
    return () => {
      if (socketRef.current) {
        socketRef.current.off('chat_message', handleChatMessage);
        socketRef.current.off('new_message', handleChatMessage);
        socketRef.current.off('message_received', handleChatMessage);
        socketRef.current.off('new_messages_batch', handleNewMessages);
        socketRef.current.off('online_participants', handleParticipants);
        socketRef.current.off('user_joined', handleUserJoined);
        socketRef.current.off('user_left', handleUserLeft);
        socketRef.current.off('message_deleted', handleMessageDeleted);
        socketRef.current.off('error', handleError);
      }
    };
  }, [dispatch]);

  // ✅ Send message via Socket.IO + REST API
  const sendMessage = useCallback((message) => {
    if (socketRef.current && projectIdRef.current) {
      socketRef.current.emit('send_message', {
        projectId: projectIdRef.current,
        message,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  // ✅ Send typing indicator START
  const sendTypingStart = useCallback(() => {
    if (socketRef.current && projectIdRef.current) {
      socketRef.current.emit('typing_start', {
        projectId: projectIdRef.current,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  // ✅ Send typing indicator STOP
  const sendTypingStop = useCallback(() => {
    if (socketRef.current && projectIdRef.current) {
      socketRef.current.emit('typing_stop', {
        projectId: projectIdRef.current,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  // ✅ Send chatbot command
  const sendChatbotCommand = useCallback((command) => {
    if (socketRef.current && projectIdRef.current) {
      socketRef.current.emit('chatbot_command', {
        projectId: projectIdRef.current,
        command,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  // ✅ Check if socket is connected
  const isConnected = useCallback(() => {
    return socketRef.current?.connected || false;
  }, []);

  // ✅ Manual reconnect if needed
  const reconnect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  return {
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    sendChatbotCommand,
    socket: socketRef.current,
    isConnected,
    reconnect,
  };
};

export default useChat;
