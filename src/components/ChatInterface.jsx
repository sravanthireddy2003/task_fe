import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Send,
  Plus,
  MoreVertical,
  Trash2,
  Users,
  BarChart3,
  Zap,
  Clock,
  MessageCircle,
  Paperclip,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getProjectMessages,
  sendChatMessage,
  getProjectParticipants,
  getChatStats,
  deleteChatMessage,
  selectChatMessages,
  selectParticipants,
  selectChatStats,
  selectMessageLoading,
  selectChatLoading,
  selectChatError,
  clearError,
} from '../redux/slices/chatSlice';
import useChat from '../hooks/useChat';

const ChatInterface = ({ projectId, projectName, authToken, currentUserId, currentUserName }) => {
  const dispatch = useDispatch();
  const messages = useSelector(selectChatMessages);
  const participants = useSelector(selectParticipants);
  const stats = useSelector(selectChatStats);
  const messageLoading = useSelector(selectMessageLoading);
  const chatLoading = useSelector(selectChatLoading);
  const error = useSelector(selectChatError);

  const [newMessage, setNewMessage] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageCountRef = useRef(messages.length);

  const { sendMessage, sendTypingStart, sendTypingStop, sendChatbotCommand, isConnected, reconnect } =
    useChat(projectId, authToken, {
      onMessageReceived: () => {
        dispatch(getProjectMessages({ projectId, limit: 50, offset: 0 }));
      }
    });

  // ✅ Load data on mount and projectId change
  useEffect(() => {
    if (projectId) {
      console.log('📨 Loading messages for projectId:', projectId);
      
      // Fetch messages immediately
      dispatch(getProjectMessages({ projectId, limit: 50, offset: 0 }))
        .then((result) => {
          console.log('✅ Messages loaded:', result.payload?.data?.length || 0);
        })
        .catch((err) => {
          console.error('❌ Error loading messages:', err);
        });
      
      // Fetch participants
      dispatch(getProjectParticipants(projectId));
      
      // Fetch stats
      dispatch(getChatStats(projectId));
      
      // Re-fetch messages every 5 seconds to catch new messages
      const refetchInterval = setInterval(() => {
        console.log('🔄 Refetching messages...');
        dispatch(getProjectMessages({ projectId, limit: 50, offset: 0 }));
      }, 5000);
      
      return () => clearInterval(refetchInterval);
    }
  }, [projectId, dispatch]);

  // ✅ Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // ✅ Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ Handle typing indicator
  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      sendTypingStart();
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingStop();
    }, 3000);
  };

  // ✅ Handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage;
    setNewMessage('');

    try {
      if (!isConnected()) {
        reconnect();
        toast.warning('Connection issue, retrying...');
      }

      sendMessage(messageContent);

      const result = await dispatch(
        sendChatMessage({ projectId, message: messageContent })
      ).unwrap();
      
      dispatch(getProjectMessages({ projectId, limit: 50, offset: 0 }));
      toast.success('Message sent');
      setIsTyping(false);
      sendTypingStop();
    } catch (err) {
      toast.error('Failed to send message');
      setNewMessage(messageContent);
    }
  };

  // ✅ Handle message deletion
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;

    try {
      await dispatch(deleteChatMessage({ projectId, messageId })).unwrap();
      toast.success('Message deleted');
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  // ✅ Handle chatbot commands
  const handleChatbotCommand = (command) => {
    sendChatbotCommand(command);
    setShowHelp(false);
  };

  const formatTime = (dateString) => {
    const d = new Date(dateString);
    return `${d.getHours().toString().padStart(2, '0')}:${d
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  // ✅ Determine if message is from current user (robust detection)
  const isCurrentUserMessage = (msg) => {
    // Bot messages always go on the left
    if (msg.message_type === 'bot') {
      return false;
    }

    // Message sender ID
    const senderIdRaw =
      msg.sender_id ?? msg.senderId ?? msg.user_id ?? msg.userId ?? msg.sender ?? msg.from ?? (msg.user && (msg.user.id || msg.user._id));
    
    // Get current user ID - prioritize public_id from localStorage
    let currentIdRaw = null;

    // 1. Try localStorage userInfo (contains public_id which matches sender_id in messages)
    try {
      const stored = JSON.parse(localStorage.getItem('userInfo') || '{}');
      currentIdRaw = stored.public_id || stored._id || stored.id || stored.userId;
      console.log('✅ Got currentIdRaw from localStorage.userInfo:', currentIdRaw);
    } catch (e) {
      console.log('⚠️ Could not parse localStorage.userInfo');
    }

    // 2. If still not found, try prop
    if (!currentIdRaw) {
      currentIdRaw = currentUserId;
      console.log('✅ Got currentIdRaw from prop:', currentIdRaw);
    }

    // 3. If still not available, try decode from authToken JWT payload
    if (!currentIdRaw && typeof authToken === 'string') {
      try {
        const parts = authToken.split('.');
        if (parts.length >= 2) {
          const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const json = decodeURIComponent(
            atob(b64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(json);
          currentIdRaw = payload.id || payload._id || payload.sub || payload.userId || payload.public_id;
          console.log('✅ Got currentIdRaw from JWT:', currentIdRaw);
        }
      } catch (e) {
        console.log('⚠️ Could not decode JWT');
      }
    }

    const normalize = (v) => (v || v === 0 ? String(v).trim().toLowerCase() : null);
    const senderId = normalize(senderIdRaw);
    const curId = normalize(currentIdRaw);

    // DEBUG LOG
    console.log('📨 Message sender check:', {
      senderIdRaw,
      currentIdRaw,
      senderId,
      curId,
      messageType: msg.message_type,
      messageText: msg.message?.substring(0, 30),
      isMatch: senderId && curId && senderId === curId
    });

    // Compare normalized IDs
    if (senderId && curId && senderId === curId) {
      console.log('✅ MATCH FOUND - Message is from current user');
      return true;
    }
    
    return false;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ===== HEADER ===== */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
            💬
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{projectName || 'Chat'}</h2>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              {isConnected() ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Connected
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Reconnecting...
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              console.log('🔄 Manually refreshing messages...');
              dispatch(getProjectMessages({ projectId, limit: 50, offset: 0 }));
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-blue-600"
            title="Refresh messages"
          >
            <MessageCircle size={18} />
          </button>
          <button
            onClick={() => {
              setShowStats(!showStats);
              setShowParticipants(false);
              setShowHelp(false);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            title="Chat Statistics"
          >
            <BarChart3 size={18} />
          </button>
          <button
            onClick={() => {
              setShowParticipants(!showParticipants);
              setShowStats(false);
              setShowHelp(false);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 relative"
            title="Online Members"
          >
            <Users size={18} />
            {participants.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {participants.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setShowHelp(!showHelp);
              setShowStats(false);
              setShowParticipants(false);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            title="Help"
          >
            <Zap size={18} />
          </button>
        </div>
      </div>

      {/* ===== STATS PANEL ===== */}
      {showStats && stats && (
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xl font-bold text-blue-600">{stats.total_messages || 0}</p>
            <p className="text-xs text-gray-600 mt-1">Messages</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-green-600">{stats.unique_senders || 0}</p>
            <p className="text-xs text-gray-600 mt-1">Participants</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-purple-600">{stats.online_participants || 0}</p>
            <p className="text-xs text-gray-600 mt-1">Online</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">
              {stats.last_message_time ? formatTime(stats.last_message_time) : '—'}
            </p>
            <p className="text-xs text-gray-600 mt-1">Last Message</p>
          </div>
        </div>
      )}

      {/* ===== PARTICIPANTS PANEL ===== */}
      {showParticipants && (
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 max-h-64 overflow-y-auto">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-lg">👥</span>
            Members ({participants.length})
          </h3>
          <div className="space-y-3">
            {participants.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No members yet</p>
            ) : (
              participants.map((p) => (
                <div
                  key={p.user_id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {(p.user_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {p.user_name}
                    </p>
                    <p className="text-xs text-gray-500">{p.user_role || 'Member'}</p>
                  </div>
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0"></div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===== CHATBOT HELP PANEL ===== */}
      {showHelp && (
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-6 py-4 max-h-64 overflow-y-auto">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-lg">💡</span>
            Quick Commands
          </h3>
          <div className="space-y-2">
            {[
              { cmd: '/help', desc: 'Show available commands' },
              { cmd: '/tasks', desc: 'List your assigned tasks' },
              { cmd: '/status', desc: 'Show chat statistics' },
              { cmd: '/members', desc: 'Show project members' },
              { cmd: '/online', desc: 'Show online members' },
              { cmd: '/project', desc: 'Show project information' },
            ].map((item) => (
              <button
                key={item.cmd}
                onClick={() => handleChatbotCommand(item.cmd)}
                className="w-full text-left p-3 bg-white rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-between group border border-blue-100 hover:border-blue-300"
              >
                <div>
                  <p className="text-sm font-semibold text-blue-600">{item.cmd}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== MAIN MESSAGES AREA ===== */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
        <div className="px-4 py-6 max-w-5xl mx-auto space-y-3">
          {/* Loading state */}
          {messageLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading messages...</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!messageLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-96 text-gray-400">
              <MessageCircle size={48} className="mb-3 opacity-50" />
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          )}

          {/* Messages list */}
          {messages.map((msg) => {
            const isCurrentUser = isCurrentUserMessage(msg);
            
            return (
              <div
                key={msg.id || msg._id}
                className={`flex gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar for non-current users */}
                {!isCurrentUser && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {msg.sender_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}

                <div className={`flex flex-col gap-1 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                  {/* Message group */}
                  <div className={`max-w-sm ${isCurrentUser ? 'lg:max-w-md' : ''}`}>
                    {/* Sender label for non-current users */}
                    {!isCurrentUser && msg.sender_name && (
                      <p className="text-xs font-semibold text-gray-600 mb-1 px-2">
                        {msg.sender_name}
                      </p>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm transition-all ${
                        isCurrentUser
                          ? 'bg-blue-600 text-white rounded-br-lg'
                          : 'bg-gray-200 text-gray-900 rounded-bl-lg'
                      } break-words whitespace-pre-wrap`}
                    >
                      <p className="text-sm leading-relaxed">
                        {msg.message}
                      </p>
                    </div>

                    {/* Timestamp and delete button */}
                    <div className={`flex items-center gap-2 mt-1 px-2 text-xs ${
                      isCurrentUser ? 'justify-end text-blue-600' : 'justify-start text-gray-500'
                    }`}>
                      <span>{formatTime(msg.created_at || msg.timestamp)}</span>

                      {/* YOU label for current user */}
                      {isCurrentUser && (
                        <span className="font-semibold">YOU</span>
                      )}

                      {/* Delete button for current user messages */}
                      {isCurrentUser && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id || msg._id)}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                          title="Delete message"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Avatar for current user */}
                {isCurrentUser && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {currentUserName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start gap-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-bold">
                ?
              </div>
              <div className="flex flex-col gap-1">
                <div className="bg-gray-200 text-gray-900 rounded-2xl rounded-bl-lg px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ===== INPUT AREA ===== */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white">
        <form 
          onSubmit={handleSendMessage} 
          className="px-4 py-4 max-w-5xl mx-auto"
        >
          <div className="flex items-center gap-3">
            {/* Attachment button (optional) */}
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Attach file"
            >
              <Paperclip size={20} />
            </button>
            
            {/* Message input */}
            <input
              type="text"
              value={newMessage}
              onChange={handleMessageChange}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 transition-all"
              disabled={chatLoading}
            />
            
            {/* Send button */}
            <button
              type="submit"
              disabled={!newMessage.trim() || chatLoading}
              className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[44px] min-h-[44px] flex items-center justify-center shadow-md hover:shadow-lg"
              title="Send message"
            >
              {chatLoading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;