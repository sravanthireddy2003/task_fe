import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Icons from '../icons';
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

  // âœ… Load data on mount and projectId change
  useEffect(() => {
    if (projectId) {
      // Fetch messages immediately
      dispatch(getProjectMessages({ projectId, limit: 50, offset: 0 }))
        .then((result) => { })
        .catch((err) => { });

      // Fetch participants
      dispatch(getProjectParticipants(projectId));

      // Fetch stats
      dispatch(getChatStats(projectId));

      // Re-fetch messages every 5 seconds to catch new messages
      const refetchInterval = setInterval(() => {
        dispatch(getProjectMessages({ projectId, limit: 50, offset: 0 }));
      }, 5000);

      return () => clearInterval(refetchInterval);
    }
  }, [projectId, dispatch]);

  // Diagnostic: log icons to detect undefined icon components
  useEffect(() => { }, []);

  // Remove diagnostic log once icons are stable

  // âœ… Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // âœ… Auto-scroll to bottom only if user is near bottom
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

  // âœ… Handle scroll to show/hide scroll to bottom button
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

  // âœ… Handle typing indicator and mentions
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

  // âœ… Handle mention selection
  const handleMentionSelect = (memberName) => {
    const beforeAt = newMessage.substring(0, mentionCursorPos);
    const afterAt = newMessage.substring(newMessage.indexOf(' ', mentionCursorPos) === -1 ? newMessage.length : newMessage.indexOf(' ', mentionCursorPos));
    const newMsg = `${beforeAt}@${memberName} ${afterAt}`.replace(/\s+/g, ' ').trim();
    setNewMessage(newMsg);
    setShowMentionDropdown(false);
    setMentionQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // âœ… Get filtered members for mention dropdown
  const getMentionSuggestions = () => {
    const suggestions = [
      { name: 'everyone', type: 'special', icon: 'ðŸ‘¥' },
      ...participants.map(p => ({ name: p.user_name, type: 'user', icon: 'ðŸ‘¤', role: p.user_role }))
    ];

    if (!mentionQuery) return suggestions.slice(0, 8);
    return suggestions.filter(s =>
      s.name.toLowerCase().includes(mentionQuery.toLowerCase())
    );
  };

  // âœ… Handle send message
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
      toast.error('Failed to send message');
      setNewMessage(messageContent);
    }
  };

  // âœ… Handle message deletion
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;

    try {
      await dispatch(deleteChatMessage({ projectId, messageId })).unwrap();
      toast.success('Message deleted');
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  // âœ… Handle chatbot commands
  const handleChatbotCommand = (command) => {
    const cmd = command.toLowerCase().trim();
    switch (cmd) {
      case '/help':
        setShowHelp(!showHelp);
        break;
      case '/tasks':
        // Could integrate with tasks API
        sendChatbotCommand(command);
        break;
      case '/status':
        setShowStats(!showStats);
        break;
      case '/members':
      case '/online':
        setShowParticipants(!showParticipants);
        break;
      case '/project':
        // Could show project info
        sendChatbotCommand(command);
        break;
      default:
        sendChatbotCommand(command);
    }
  };

  const formatTime = (dateString) => {
    const d = new Date(dateString);
    return `${d.getHours().toString().padStart(2, '0')}:${d
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  // âœ… Handle scroll to bottom
  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // âœ… FIXED: Render message with colored mentions (handles undefined text)
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
            className={`font-semibold ${isEveryone
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
            className={`font-semibold ${isEveryone
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

  // âœ… Determine if message is from current user (robust detection)
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
    } catch (e) { }

    // 2. If still not found, try prop
    if (!currentIdRaw) {
      currentIdRaw = currentUserId;
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
        }
      } catch (e) { }
    }

    const normalize = (v) => (v || v === 0 ? String(v).trim().toLowerCase() : null);
    const senderId = normalize(senderIdRaw);
    const curId = normalize(currentIdRaw);

    // Compare normalized IDs
    if (senderId && curId && senderId === curId) {
      return true;
    }

    return false;
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] sm:rounded-tl-2xl shadow-inner relative">
      {/* ===== HEADER ===== */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between z-20 sticky top-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-50 to-blue-50 flex items-center justify-center text-indigo-500 font-bold text-lg border border-indigo-100/50 shadow-inner">
            <Icons.MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-section-title bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 tracking-tight">{projectName || 'Project Chat'}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isConnected() ? 'bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`}></span>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {isConnected() ? 'Connected' : 'Reconnecting...'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-gray-50/50 p-1 rounded-xl border border-gray-100">
          <button
            onClick={() => {
              dispatch(getProjectMessages({ projectId, limit: 50, offset: 0 }));
            }}
            className="p-2 sm:p-2.5 hover:bg-white text-gray-500 hover:text-indigo-600 hover:shadow-sm rounded-lg transition-all duration-300 group"
            title="Refresh messages"
          >
            {Icons.RefreshCw && <Icons.RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />}
          </button>

          <button
            className="p-2 sm:p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-300"
            title="Messages"
          >
            {Icons.MessageCircle && <Icons.MessageCircle className="w-5 h-5" />}
          </button>

          <button
            className="p-2 sm:p-2.5 text-gray-500 hover:text-amber-500 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-300"
            title="Commands"
          >
            {Icons.Zap && <Icons.Zap className="w-5 h-5" />}
          </button>

          <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block"></div>

          <button
            onClick={() => setShowStats(!showStats)}
            className={`p-2 sm:p-2.5 rounded-lg transition-all duration-300 ${showStats ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm'
              }`}
            title="Stats"
          >
            {Icons.BarChart3 && <Icons.BarChart3 className="w-5 h-5" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={`p-2 sm:p-2.5 rounded-lg transition-all duration-300 relative ${showParticipants ? 'bg-white shadow-sm text-indigo-600' : 'hover:bg-white hover:shadow-sm text-gray-500 hover:text-indigo-600'
                }`}
              title="Online Members"
            >
              {Icons.Users && <Icons.Users className="w-5 h-5" />}
              {participants.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                  {participants.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`p-2 sm:p-2.5 rounded-lg transition-all duration-300 ${showHelp ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm'
              }`}
            title="Help"
          >
            {Icons.HelpCircle && <Icons.HelpCircle className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {/* ===== STATS PANEL ===== */}
      {showStats && stats && (
        <div className="flex-shrink-0 bg-white shadow-[0_4px_15px_-5px_rgba(0,0,0,0.05)] border-b border-gray-100 px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10 animate-[slideDown_0.2s_ease-out]">
          <button
            onClick={() => setShowStats(false)}
            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close"
          >
            {Icons.X && <Icons.X className="w-4 h-4" /> || 'âœ•'}
          </button>
          <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 p-4 rounded-2xl border border-indigo-100/50">
            <p className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">{stats.total_messages || 0}</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Messages</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 p-4 rounded-2xl border border-indigo-100/50">
            <p className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">{stats.unique_senders || 0}</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Participants</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 p-4 rounded-2xl border border-emerald-100/50">
            <p className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">{stats.online_participants || 0}</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Online</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 p-4 rounded-2xl border border-purple-100/50">
            <p className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 line-clamp-1 mt-1">
              {stats.last_message_time ? formatTime(stats.last_message_time) : 'â€”'}
            </p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Last Active</p>
          </div>
        </div>
      )}
      {/* ===== PARTICIPANTS PANEL ===== */}
      {showParticipants && (
        <div className="flex-shrink-0 bg-white shadow-md border-b border-gray-200 px-6 py-5 max-h-72 overflow-y-auto relative z-10 custom-scrollbar animate-[slideDown_0.2s_ease-out]">
          <button
            onClick={() => setShowParticipants(false)}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close"
          >
            {Icons.X && <Icons.X className="w-4 h-4" /> || 'âœ•'}
          </button>
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm tracking-tight">
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              {Icons.Users && <Icons.Users className="w-4 h-4" /> || 'ðŸ‘¥'}
            </div>
            Team Members ({participants.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {participants.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 col-span-full">No members yet</p>
            ) : (
              participants.map((p) => (
                <div
                  key={p.user_id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 group-hover:from-indigo-200 group-hover:to-blue-200 text-gray-600 group-hover:text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm transition-colors">
                    {(p.user_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-900 transition-colors">
                      {p.user_name}
                    </p>
                    <p className="text-xs font-medium text-gray-500 capitalize">{p.user_role || 'Member'}</p>
                  </div>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {/* ===== CHATBOT HELP PANEL ===== */}
      {showHelp && (
        <div className="flex-shrink-0 bg-white shadow-md border-b border-gray-200 px-6 py-5 max-h-72 overflow-y-auto relative z-10 custom-scrollbar animate-[slideDown_0.2s_ease-out]">
          <button
            onClick={() => setShowHelp(false)}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close"
          >
            {Icons.X && <Icons.X className="w-4 h-4" /> || 'âœ•'}
          </button>
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm tracking-tight">
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-500">
              {Icons.Zap && <Icons.Zap className="w-4 h-4" /> || 'ðŸ’¡'}
            </div>
            Quick Commands
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { cmd: '/help', desc: 'Show available commands', icon: Icons.HelpCircle },
              { cmd: '/tasks', desc: 'List your assigned tasks', icon: Icons.CheckSquare },
              { cmd: '/status', desc: 'Show chat statistics', icon: Icons.BarChart3 },
              { cmd: '/members', desc: 'Show project members', icon: Icons.Users },
              { cmd: '/online', desc: 'Show online members', icon: Icons.Wifi },
              { cmd: '/project', desc: 'Show project info', icon: Icons.Folder },
            ].map((item) => (
              <button
                key={item.cmd}
                onClick={() => handleChatbotCommand(item.cmd)}
                className="w-full text-left p-3.5 bg-gray-50 hover:bg-indigo-50/50 rounded-xl transition-all duration-200 border border-transparent hover:border-indigo-100 flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-indigo-500 group-hover:border-indigo-200 shadow-sm transition-colors">
                  {item.icon ? <item.icon className="w-4 h-4" /> : <div className="w-1.5 h-1.5 rounded-full bg-current"></div>}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{item.cmd}</p>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* ===== MAIN MESSAGES AREA ===== */}
      <div ref={messagesContainerRef} className="relative flex-1 overflow-y-auto bg-transparent custom-scrollbar">
        {/* Chat Header for scroll context - Sticky with backdrop blur */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2 z-10 sm:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 truncate">{projectName}</h2>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              {participants.length}
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto space-y-6">
          {/* Loading state */}
          {messageLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <span className="text-sm font-semibold text-gray-600">Loading history...</span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!messageLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-96 text-gray-400">
              {Icons.MessageCircle && <Icons.MessageCircle className="tm-icon-hero mb-3 opacity-50" />}
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          )}

          {/* Messages list */}
          {messages
            .filter(msg => msg && (msg.message || msg.message === ''))
            .map((msg, index, arr) => {
              const isCurrentUser = isCurrentUserMessage(msg);
              const prevMsg = index > 0 ? arr[index - 1] : null;
              const isSequential = prevMsg &&
                isCurrentUserMessage(prevMsg) === isCurrentUser &&
                (prevMsg.sender_name === msg.sender_name || (isCurrentUser && prevMsg.user_id === msg.user_id));

              return (
                <div
                  key={msg.id || msg._id}
                  className={`flex gap-3 group/msg ${isCurrentUser ? 'justify-end' : 'justify-start'} ${isSequential ? 'mt-1' : 'mt-4'}`}
                >
                  {/* Avatar for non-current users */}
                  {!isCurrentUser && (
                    <div className="flex flex-col justify-end pb-1 w-9 flex-shrink-0">
                      {!isSequential && (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${msg.message_type === 'bot'
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                          : 'bg-gradient-to-br from-slate-400 to-slate-500'
                          }`}>
                          {msg.message_type === 'bot' ? <Icons.Zap className="w-4 h-4 text-white" /> : msg.sender_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-md lg:max-w-lg ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    {/* Sender label for non-current users */}
                    {!isCurrentUser && !isSequential && msg.sender_name && (
                      <p className={`text-[11px] font-bold tracking-wide uppercase px-1 mb-0.5 ${msg.message_type === 'bot'
                        ? 'text-indigo-500'
                        : 'text-slate-500'
                        }`}>
                        {msg.message_type === 'bot' ? 'ðŸ¤– ' : ''}{msg.sender_name}
                      </p>
                    )}

                    {/* Message bubble */}
                    <div className="relative group/bubble flex items-center gap-2">
                      {/* Delete button (left of bubble for current user) */}
                      {isCurrentUser && (
                        <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDeleteMessage(msg.id || msg._id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete message"
                          >
                            {Icons.Trash2 && <Icons.Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      )}

                      <div
                        className={`px-5 py-3.5 shadow-sm transition-all ${isCurrentUser
                          ? `bg-gradient-to-br from-indigo-600 to-blue-600 text-white ${isSequential ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-br-none'} shadow-indigo-500/10`
                          : msg.message_type === 'bot'
                            ? `bg-white text-gray-800 border border-indigo-100 ${isSequential ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl rounded-bl-none'} shadow-gray-200/50`
                            : `bg-white text-gray-800 border border-gray-100 ${isSequential ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl rounded-bl-none'} shadow-gray-200/50`
                          } break-words whitespace-pre-wrap`}
                      >
                        <p className="text-[15px] leading-[1.6] font-medium tracking-[-0.01em]">
                          {renderMessageWithMentions(msg.message || '', isCurrentUser)}
                        </p>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className={`flex items-center gap-2 px-1 text-[10px] font-bold text-gray-400 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-300 ${isCurrentUser ? 'justify-end' : 'justify-start'
                      }`}>
                      <span>{formatTime(msg.created_at || msg.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-end gap-2 animate-fadeIn">
              <div className="flex flex-col gap-1 items-end">
                <div className="bg-blue-600 text-white rounded-2xl rounded-br-none px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 px-2">Typing...</span>
              </div>
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {currentUserName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          )}

          {/* Scroll to bottom button */}
          {showScrollToBottom && (
            <button
              onClick={handleScrollToBottom}
              className="absolute bottom-4 right-4 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 z-10"
              title="Scroll to bottom"
            >
              {Icons.ChevronDown && <Icons.ChevronDown className="tm-icon" />}
            </button>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
      {/* ===== INPUT AREA ===== */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 relative z-20 pb-safe shadow-sm">
        {/* Mention Dropdown */}
        {showMentionDropdown && getMentionSuggestions().length > 0 && (
          <div className="absolute bottom-full left-4 sm:left-6 right-4 sm:right-auto sm:w-80 mb-4 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 max-h-60 overflow-y-auto custom-scrollbar animate-[slideUp_0.2s_ease-out]">
            <div className="p-2 space-y-1">
              {getMentionSuggestions().map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleMentionSelect(suggestion.name)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl transition-all duration-200 flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-100 transition-colors text-lg shadow-sm border border-indigo-100/50">
                    {suggestion.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                      @{suggestion.name}
                      {suggestion.type === 'special' && <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-2 border border-gray-200 px-1.5 py-0.5 rounded-md">All</span>}
                    </p>
                    {suggestion.role && (
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{suggestion.role}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={handleSendMessage}
          className="px-4 sm:px-6 py-4 sm:py-5 max-w-5xl mx-auto"
        >
          <div className="flex items-end gap-2 sm:gap-3 bg-gray-50 p-2 sm:p-2.5 rounded-[2rem] border border-gray-200 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all duration-300 shadow-inner">
            {/* Attachment button */}
            <button
              type="button"
              className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-full transition-all duration-200 flex-shrink-0"
              title="Attach file"
            >
              {Icons.Paperclip && <Icons.Paperclip className="w-5 h-5 -rotate-45" />}
            </button>

            {/* Message input */}
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={handleMessageChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type @ to mention, or type / for commands..."
              className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none px-2 py-3 focus:outline-none focus:ring-0 text-[15px] resize-none overflow-y-auto custom-scrollbar font-medium text-gray-800 placeholder-gray-400"
              disabled={chatLoading}
              rows={1}
              style={{ overflow: 'hidden' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = (e.target.scrollHeight) + 'px';
              }}
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={!newMessage.trim() || chatLoading}
              className="flex-shrink-0 bg-gradient-to-tr from-indigo-600 to-blue-600 text-white p-3 rounded-full hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 min-w-[48px] min-h-[48px] flex items-center justify-center disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0"
              title="Send message"
            >
              {chatLoading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                Icons.Send && <Icons.Send className="w-5 h-5 translate-x-0.5 -translate-y-0.5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
