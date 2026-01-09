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
  ChevronDown,
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
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionCursorPos, setMentionCursorPos] = useState(0);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messageCountRef = useRef(messages.length);
  const inputRef = useRef(null);

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

  // ✅ Auto-scroll to bottom only if user is near bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

    if (isNearBottom) {
      // Use setTimeout to ensure DOM has updated
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // ✅ Handle scroll to show/hide scroll to bottom button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold
      setShowScrollToBottom(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ Handle typing indicator and mentions
  const handleMessageChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Check for @ mention
    const cursorPos = e.target.selectionStart;
    const lastAtIndex = value.lastIndexOf('@');
    const spaceAfterAt = value.indexOf(' ', lastAtIndex);
    
    if (lastAtIndex !== -1 && (spaceAfterAt === -1 || spaceAfterAt > cursorPos)) {
      const query = value.substring(lastAtIndex + 1, cursorPos).trim();
      setMentionQuery(query);
      setMentionCursorPos(lastAtIndex);
      setShowMentionDropdown(true);
    } else {
      setShowMentionDropdown(false);
      setMentionQuery('');
    }

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

  // ✅ Handle mention selection
  const handleMentionSelect = (memberName) => {
    const beforeAt = newMessage.substring(0, mentionCursorPos);
    const afterAt = newMessage.substring(newMessage.indexOf(' ', mentionCursorPos) === -1 ? newMessage.length : newMessage.indexOf(' ', mentionCursorPos));
    const newMsg = `${beforeAt}@${memberName} ${afterAt}`.replace(/\s+/g, ' ').trim();
    setNewMessage(newMsg);
    setShowMentionDropdown(false);
    setMentionQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // ✅ Get filtered members for mention dropdown
  const getMentionSuggestions = () => {
    const suggestions = [
      { name: 'everyone', type: 'special', icon: '👥' },
      ...participants.map(p => ({ name: p.user_name, type: 'user', icon: '👤', role: p.user_role }))
    ];
    
    if (!mentionQuery) return suggestions.slice(0, 8);
    return suggestions.filter(s => 
      s.name.toLowerCase().includes(mentionQuery.toLowerCase())
    );
  };

  // ✅ Handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage;
    setNewMessage('');
    setShowMentionDropdown(false);

    try {
      if (!isConnected()) {
        reconnect();
        toast.warning('Connection issue, retrying...');
      }

      // Send via REST API (primary - this persists to database)
      const result = await dispatch(
        sendChatMessage({ projectId, message: messageContent })
      ).unwrap();
      
      // Emit via Socket.IO for real-time delivery to other users (optional, already sent via REST)
      // Commenting out to avoid double sending - REST API handles persistence
      // sendMessage(messageContent);
      
      toast.success('Message sent');
      setIsTyping(false);
      sendTypingStop();
    } catch (err) {
      console.error('❌ Error sending message:', err);
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

  // ✅ Handle scroll to bottom
  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ✅ FIXED: Render message with colored mentions (handles undefined text)
  const renderMessageWithMentions = (text, isCurrentUser = false) => {
    // Handle null/undefined text
    if (!text || typeof text !== 'string') {
      return text || ''; // Return empty string if text is falsy
    }

    // Match @username or @everyone
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add mention with color (different colors for user vs others)
      const mentionName = match[1];
      const isEveryone = mentionName.toLowerCase() === 'everyone';
      
      if (isCurrentUser) {
        // Light colors for white text background
        parts.push(
          <span
            key={`mention-${match.index}`}
            className={`font-semibold ${
              isEveryone
                ? 'bg-red-400 text-white px-1 rounded'
                : 'bg-blue-400 text-white px-1 rounded'
            }`}
          >
            @{mentionName}
          </span>
        );
      } else {
        // Darker colors for dark text background
        parts.push(
          <span
            key={`mention-${match.index}`}
            className={`font-semibold ${
              isEveryone
                ? 'text-red-600 bg-red-200 px-1 rounded'
                : 'text-blue-600 bg-blue-200 px-1 rounded'
            }`}
          >
            @{mentionName}
          </span>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : text;
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
      <div className="flex-shrink-0 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
            💬
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{projectName || 'Project Chat'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${isConnected() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <p className="text-xs font-medium text-slate-600">
                {isConnected() ? 'Connected' : 'Reconnecting...'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              console.log('🔄 Manually refreshing messages...');
              dispatch(getProjectMessages({ projectId, limit: 50, offset: 0 }));
            }}
            className="p-2.5 hover:bg-white text-slate-600 hover:text-blue-600 rounded-lg transition-all duration-200"
            title="Refresh messages"
          >
            <MessageCircle size={20} />
          </button>
          <button
            onClick={() => {
              setShowStats(!showStats);
              setShowParticipants(false);
              setShowHelp(false);
            }}
            className="p-2.5 hover:bg-white text-slate-600 hover:text-blue-600 rounded-lg transition-all duration-200"
            title="Chat Statistics"
          >
            <BarChart3 size={20} />
          </button>
          <button
            onClick={() => {
              setShowParticipants(!showParticipants);
              setShowStats(false);
              setShowHelp(false);
            }}
            className="p-2.5 hover:bg-white text-slate-600 hover:text-blue-600 rounded-lg transition-all duration-200 relative"
            title="Online Members"
          >
            <Users size={20} />
            {participants.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
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
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200 px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <p className="text-2xl font-bold text-blue-600">{stats.total_messages || 0}</p>
            <p className="text-xs font-medium text-slate-600 mt-2">Messages</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <p className="text-2xl font-bold text-emerald-600">{stats.unique_senders || 0}</p>
            <p className="text-xs font-medium text-slate-600 mt-2">Participants</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <p className="text-2xl font-bold text-purple-600">{stats.online_participants || 0}</p>
            <p className="text-xs font-medium text-slate-600 mt-2">Online</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <p className="text-lg font-bold text-slate-700">
              {stats.last_message_time ? formatTime(stats.last_message_time) : '—'}
            </p>
            <p className="text-xs font-medium text-slate-600 mt-2">Last Active</p>
          </div>
        </div>
      )}

      {/* ===== PARTICIPANTS PANEL ===== */}
      {showParticipants && (
        <div className="flex-shrink-0 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200 px-6 py-5 max-h-64 overflow-y-auto">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
            <span className="text-lg">👥</span>
            Team Members ({participants.length})
          </h3>
          <div className="space-y-2">
            {participants.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No members yet</p>
            ) : (
              participants.map((p) => (
                <div
                  key={p.user_id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 transition-colors border border-transparent hover:border-blue-200"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                    {(p.user_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {p.user_name}
                    </p>
                    <p className="text-xs text-slate-600 capitalize">{p.user_role || 'Member'}</p>
                  </div>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full flex-shrink-0 animate-pulse"></div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===== CHATBOT HELP PANEL ===== */}
      {showHelp && (
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200 px-6 py-5 max-h-64 overflow-y-auto">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
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
                className="w-full text-left p-3 bg-white rounded-lg hover:bg-blue-50 transition-all border border-slate-200 hover:border-blue-400 hover:shadow-sm flex items-center justify-between group"
              >
                <div>
                  <p className="text-sm font-semibold text-blue-600">{item.cmd}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== MAIN MESSAGES AREA ===== */}
      <div ref={messagesContainerRef} className="relative flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-white to-blue-50 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400">
        <div className="px-4 py-6 max-w-5xl mx-auto space-y-4">
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

          {/* Messages list - Added filter to skip messages without content */}
          {messages
            .filter(msg => msg && (msg.message || msg.message === '')) // Filter out messages without message property
            .map((msg) => {
              const isCurrentUser = isCurrentUserMessage(msg);
              
              return (
                <div
                  key={msg.id || msg._id}
                  className={`flex gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar for non-current users */}
                  {!isCurrentUser && (
                    <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${
                      msg.message_type === 'bot'
                        ? 'bg-gradient-to-br from-purple-500 to-purple-700'
                        : 'bg-gradient-to-br from-blue-400 to-blue-600'
                    }`}>
                      {msg.message_type === 'bot' ? '🤖' : msg.sender_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}

                  <div className={`flex flex-col gap-1 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    {/* Message group */}
                    <div className={`max-w-sm ${isCurrentUser ? 'lg:max-w-md' : ''}`}>
                      {/* Sender label for non-current users */}
                      {!isCurrentUser && msg.sender_name && (
                        <p className={`text-xs font-semibold mb-1 px-2 ${
                          msg.message_type === 'bot'
                            ? 'text-purple-600'
                            : 'text-slate-600'
                        }`}>
                          {msg.message_type === 'bot' ? '🤖 ' : ''}{msg.sender_name}
                        </p>
                      )}

                      {/* Message bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-md transition-all ${
                          isCurrentUser
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-none'
                            : msg.message_type === 'bot'
                            ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-slate-900 rounded-bl-none border border-purple-200'
                            : 'bg-white text-slate-900 rounded-bl-none border border-slate-200'
                        } break-words whitespace-pre-wrap`}
                      >
                        <p className="text-sm leading-relaxed font-medium">
                          {renderMessageWithMentions(msg.message || '', isCurrentUser)}
                        </p>
                      </div>

                      {/* Timestamp and delete button */}
                      <div className={`flex items-center gap-2 mt-2 px-2 text-xs font-medium ${
                        isCurrentUser ? 'justify-end text-blue-600' : 'justify-start text-slate-500'
                      }`}>
                        <span>{formatTime(msg.created_at || msg.timestamp)}</span>

                        {/* YOU label for current user */}
                        {isCurrentUser && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">YOU</span>
                        )}

                        {/* Delete button for current user messages */}
                        {isCurrentUser && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id || msg._id)}
                            className="text-slate-400 hover:text-red-500 transition-colors ml-1 hover:scale-110"
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
            <div className="flex justify-start gap-2 animate-fadeIn">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                ✏️
              </div>
              <div className="flex flex-col gap-1">
                <div className="bg-white text-slate-900 rounded-2xl rounded-bl-none px-4 py-3 shadow-md border border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Scroll to bottom button */}
          {showScrollToBottom && (
            <button
              onClick={handleScrollToBottom}
              className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 z-10"
              title="Scroll to bottom"
            >
              <ChevronDown size={20} />
            </button>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ===== INPUT AREA ===== */}
      <div className="flex-shrink-0 border-t border-slate-200 bg-gradient-to-r from-white to-blue-50 relative">
        {/* Mention Dropdown */}
        {showMentionDropdown && getMentionSuggestions().length > 0 && (
          <div className="absolute bottom-full left-4 right-4 mb-3 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
            <div className="py-2">
              {getMentionSuggestions().map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleMentionSelect(suggestion.name)}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center gap-3 group"
                >
                  <span className="text-lg">{suggestion.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      @{suggestion.name}
                      {suggestion.type === 'special' && <span className="text-xs text-blue-600 ml-1">(Notify all)</span>}
                    </p>
                    {suggestion.role && (
                      <p className="text-xs text-slate-500 capitalize">{suggestion.role}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <form 
          onSubmit={handleSendMessage} 
          className="px-5 py-4 max-w-5xl mx-auto"
        >
          <div className="flex items-center gap-2">
            {/* Attachment button (optional) */}
            <button
              type="button"
              className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              title="Attach file"
            >
              <Paperclip size={20} />
            </button>
            
            {/* Message input */}
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleMessageChange}
              placeholder="Type @ to mention someone..."
              className="flex-1 border border-slate-300 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-transparent text-sm bg-white transition-all placeholder-slate-400"
              disabled={chatLoading}
            />
            
            {/* Send button */}
            <button
              type="submit"
              disabled={!newMessage.trim() || chatLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-full hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[44px] min-h-[44px] flex items-center justify-center shadow-md hover:shadow-lg disabled:shadow-none"
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