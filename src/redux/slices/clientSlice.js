import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { httpGetService, httpPutService, httpPostService, httpDeleteService } from "../../App/httpHandler";

const initialState = {
  clients: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const fetchClients = createAsyncThunk(
  'clients/fetchClients',
  async (_, thunkAPI) => {
    try {
      const response = await httpGetService('api/clients/clients'); // Updated endpoint
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const deleteClient = createAsyncThunk(
  'clients/deleteClient',
  async (clientId, thunkAPI) => {
    try {
      await httpDeleteService(`api/clients/clients/${clientId}`);
      return clientId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const updateClient = createAsyncThunk(
  'clients/updateClient',
  async ({ clientId, clientData }, thunkAPI) => {
    try {
      const response = await httpPutService(`api/clients/clients/${clientId}`, clientData);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const clientSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.clients = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.clients = state.clients.filter(client => client.id !== action.payload);
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        const index = state.clients.findIndex(client => client.id === action.payload.id);
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
      });
  },
});

export const selectClients = (state) => state.clients.clients || [];
export const selectClientStatus = (state) => state.clients.status;
export const selectClientError = (state) => state.clients.error;

export default clientSlice.reducer;

// Thunks for adding a new client