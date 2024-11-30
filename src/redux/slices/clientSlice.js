import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { httpGetService, httpPutService, httpPostService, httpDeleteService } from "../../App/httpHandler";

const initialState = {
  clients: [],
  status: null,
  error: null,
};

// Async thunks for CRUD operations
export const fetchClients = createAsyncThunk(
  'clients/fetchClients',
  async (_, thunkAPI) => {
    try {
      const response = await httpGetService('api/clients/getclients');
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const fetchClientById = createAsyncThunk(
  'clients/fetchClientById',
  async (clientId, thunkAPI) => {
    try {
      const response = await httpGetService(`api/clients/getclient/${clientId}`);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const createClient = createAsyncThunk(
  'clients/createClient',
  async (clientData, thunkAPI) => {
    try {
      const response = await httpPostService('api/clients/create', clientData);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const updateClient = createAsyncThunk(
  'clients/updateClient',
  async ({ clientId, clientData }, thunkAPI) => {
    try {
      const response = await httpPutService(`api/clients/update/${clientId}`, clientData);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const deleteClient = createAsyncThunk(
  'clients/deleteClient',
  async (clientId, thunkAPI) => {
    try {
      const response = await httpDeleteService(`api/clients/delete/${clientId}`);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

// Slice
const clientSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch clients
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

      // Fetch client by ID
      .addCase(fetchClientById.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchClientById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.clients = state.clients.concat(action.payload);
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Create client
      .addCase(createClient.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.clients.push(action.payload);
      })
      .addCase(createClient.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Update client
      .addCase(updateClient.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const updatedClient = action.payload;
        const index = state.clients.findIndex(client => client.id === updatedClient.id);
        if (index !== -1) {
          state.clients[index] = updatedClient;
        }
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Delete client
      .addCase(deleteClient.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.clients = state.clients.filter(client => client.id !== action.payload);
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectClients = (state) => state.clients.clients;
export const selectClientStatus = (state) => state.clients.status;
export const selectClientError = (state) => state.clients.error;

// Reducer
export default clientSlice.reducer;
