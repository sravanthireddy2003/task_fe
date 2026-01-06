import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { httpGetService, httpPostService, httpDeleteService } from '../../App/httpHandler';

const initialState = {
  messages: [],
  participants: [],
  stats: null,
  loading: false,
  messageLoading: false,
  participantsLoading: false,
  error: null,
  currentProjectId: null,
  pagination: {
    limit: 50,
    offset: 0,
  },
  hasMore: true,
};

// ✅ 1. Get Chat Messages
export const getProjectMessages = createAsyncThunk(
  'chat/getProjectMessages',
  async ({ projectId, limit = 50, offset = 0 }, thunkAPI) => {
    try {
      const res = await httpGetService(
        `api/projects/${projectId}/chat/messages?limit=${limit}&offset=${offset}`
      );
      return {
        data: res?.data || [],
        projectId,
        limit,
        offset,
        pagination: res?.pagination || {},
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err?.message || 'Failed to fetch chat messages'
      );
    }
  }
);

// ✅ 2. Send Chat Message
export const sendChatMessage = createAsyncThunk(
  'chat/sendChatMessage',
  async ({ projectId, message }, thunkAPI) => {
    try {
      const res = await httpPostService(
        `api/projects/${projectId}/chat/messages`,
        { message }
      );
      return {
        data: res?.data || {},
        projectId,
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err?.message || 'Failed to send message'
      );
    }
  }
);

// ✅ 3. Get Online Participants
export const getProjectParticipants = createAsyncThunk(
  'chat/getProjectParticipants',
  async (projectId, thunkAPI) => {
    try {
      const res = await httpGetService(
        `api/projects/${projectId}/chat/participants`
      );
      return {
        data: res?.data || [],
        projectId,
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err?.message || 'Failed to fetch participants'
      );
    }
  }
);

// ✅ 4. Get Chat Statistics
export const getChatStats = createAsyncThunk(
  'chat/getChatStats',
  async (projectId, thunkAPI) => {
    try {
      const res = await httpGetService(
        `api/projects/${projectId}/chat/stats`
      );
      return {
        data: res?.data || {},
        projectId,
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err?.message || 'Failed to fetch chat statistics'
      );
    }
  }
);

// ✅ 5. Delete Chat Message
export const deleteChatMessage = createAsyncThunk(
  'chat/deleteChatMessage',
  async ({ projectId, messageId }, thunkAPI) => {
    try {
      const res = await httpDeleteService(
        `api/projects/${projectId}/chat/messages/${messageId}`
      );
      return {
        success: res?.success,
        messageId,
        projectId,
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err?.message || 'Failed to delete message'
      );
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Set current project for chat
    setCurrentProjectId: (state, action) => {
      state.currentProjectId = action.payload;
    },

    // Add real-time message (from Socket.IO) - IMMEDIATE
    addRealtimeMessage: (state, action) => {
      const newMessage = action.payload;
      // Avoid duplicates by checking both id and _id
      const isDuplicate = state.messages.some(
        (msg) => (msg.id && msg.id === newMessage.id) || 
                 (msg._id && msg._id === newMessage._id)
      );
      if (!isDuplicate && newMessage && (newMessage.id || newMessage._id)) {
        state.messages.push(newMessage);
      }
    },

    // Update participants list (from Socket.IO)
    updateParticipants: (state, action) => {
      state.participants = action.payload;
    },

    // Add participant
    addParticipant: (state, action) => {
      const exists = state.participants.find(
        (p) => p.user_id === action.payload.user_id
      );
      if (!exists) {
        state.participants.push(action.payload);
      }
    },

    // Remove participant
    removeParticipant: (state, action) => {
      state.participants = state.participants.filter(
        (p) => p.user_id !== action.payload
      );
    },

    // Remove message locally (after deletion)
    removeMessageLocally: (state, action) => {
      state.messages = state.messages.filter(
        (m) => m.id !== action.payload
      );
    },

    // Clear messages when switching projects
    clearMessages: (state) => {
      state.messages = [];
      state.pagination = { limit: 50, offset: 0 };
      state.hasMore = true;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // ✅ Get Messages
    builder
      .addCase(getProjectMessages.pending, (state) => {
        state.messageLoading = true;
        state.error = null;
      })
      .addCase(getProjectMessages.fulfilled, (state, action) => {
        state.messageLoading = false;
        if (action.payload.offset === 0) {
          state.messages = action.payload.data;
        } else {
          state.messages = [...action.payload.data, ...state.messages];
        }
        state.pagination = action.payload.pagination;
        state.hasMore = action.payload.data.length === action.payload.limit;
      })
      .addCase(getProjectMessages.rejected, (state, action) => {
        state.messageLoading = false;
        state.error = action.payload;
      });

    // ✅ Send Message
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push(action.payload.data);
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ✅ Get Participants
    builder
      .addCase(getProjectParticipants.pending, (state) => {
        state.participantsLoading = true;
      })
      .addCase(getProjectParticipants.fulfilled, (state, action) => {
        state.participantsLoading = false;
        state.participants = action.payload.data;
      })
      .addCase(getProjectParticipants.rejected, (state, action) => {
        state.participantsLoading = false;
        state.error = action.payload;
      });

    // ✅ Get Stats
    builder
      .addCase(getChatStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(getChatStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.data;
      })
      .addCase(getChatStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ✅ Delete Message
    builder
      .addCase(deleteChatMessage.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteChatMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = state.messages.filter(
          (m) => m.id !== action.payload.messageId
        );
      })
      .addCase(deleteChatMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ✅ Selectors
export const selectChatMessages = (state) => state.chat?.messages || [];
export const selectParticipants = (state) => state.chat?.participants || [];
export const selectChatStats = (state) => state.chat?.stats;
export const selectMessageLoading = (state) => state.chat?.messageLoading || false;
export const selectParticipantsLoading = (state) => state.chat?.participantsLoading || false;
export const selectChatLoading = (state) => state.chat?.loading || false;
export const selectChatError = (state) => state.chat?.error;
export const selectCurrentProjectId = (state) => state.chat?.currentProjectId;
export const selectChatPagination = (state) => state.chat?.pagination;
export const selectHasMoreMessages = (state) => state.chat?.hasMore;

// ✅ Actions
export const {
  setCurrentProjectId,
  addRealtimeMessage,
  updateParticipants,
  addParticipant,
  removeParticipant,
  removeMessageLocally,
  clearMessages,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;
