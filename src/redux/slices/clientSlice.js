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
      const response = await httpGetService('api/clients');
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
      await httpDeleteService(`api/clients/${clientId}`);
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
      const response = await httpPutService(`api/clients/${clientId}`, clientData);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const createClient = createAsyncThunk(
  'clients/createClient',
  async (clientData, thunkAPI) => {
    try {
      if (!clientData || typeof clientData !== 'object') return thunkAPI.rejectWithValue('Invalid client payload');

      // Build payload to match backend expectations.
      // Allow passing managerId and managerName together, and an optional documents array of {file_url, file_name, file_type}
      const {
        managerId,
        managerName,
        documents,
        // rest of client fields
        ...rest
      } = clientData;

      const payload = { ...rest };
      if (managerId) payload.managerId = managerId;
      if (managerName) payload.managerName = managerName;

      if (Array.isArray(documents) && documents.length > 0) {
        // send documents as documented by backend: { documents: [...] }
        payload.documents = documents.map(d => ({
          file_url: d.file_url || d.fileUrl || d.url || null,
          file_name: d.file_name || d.fileName || d.name || null,
          file_type: d.file_type || d.fileType || d.type || null,
        }));
      }

      const response = await httpPostService('api/clients', payload);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

export const getClient = createAsyncThunk(
  'clients/getClient',
  async (clientId, thunkAPI) => {
    try {
      const response = await httpGetService(`api/clients/${clientId}`);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const restoreClient = createAsyncThunk(
  'clients/restoreClient',
  async (clientId, thunkAPI) => {
    try {
      const response = await httpPostService(`api/clients/${clientId}/restore`);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const permanentDeleteClient = createAsyncThunk(
  'clients/permanentDeleteClient',
  async (clientId, thunkAPI) => {
    try {
      await httpDeleteService(`api/clients/${clientId}/permanent`);
      return clientId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const assignManager = createAsyncThunk(
  'clients/assignManager',
  async ({ clientId, managerId }, thunkAPI) => {
    try {
      const response = await httpPostService(`api/clients/${clientId}/assign-manager`, { managerId });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// Contacts
export const addContact = createAsyncThunk(
  'clients/addContact',
  async ({ clientId, contact }, thunkAPI) => {
    try {
      const response = await httpPostService(`api/clients/${clientId}/contacts`, contact);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const updateContact = createAsyncThunk(
  'clients/updateContact',
  async ({ clientId, contactId, contact }, thunkAPI) => {
    try {
      const response = await httpPutService(`api/clients/${clientId}/contacts/${contactId}`, contact);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const deleteContact = createAsyncThunk(
  'clients/deleteContact',
  async ({ clientId, contactId }, thunkAPI) => {
    try {
      await httpDeleteService(`api/clients/${clientId}/contacts/${contactId}`);
      return { clientId, contactId };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const setPrimaryContact = createAsyncThunk(
  'clients/setPrimaryContact',
  async ({ clientId, contactId }, thunkAPI) => {
    try {
      const response = await httpPostService(`api/clients/${clientId}/contacts/${contactId}/set-primary`);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// Documents
export const attachDocument = createAsyncThunk(
  'clients/attachDocument',
  async ({ clientId, document }, thunkAPI) => {
    try {
      if (!clientId) return thunkAPI.rejectWithValue('Missing clientId');

      // Shape the payload according to backend examples:
      // - single: { file_url, file_name, file_type }
      // - multiple: { documents: [ { file_url, file_name }, ... ] }
      let payload;
      if (Array.isArray(document)) {
        payload = { documents: document };
      } else if (document && typeof document === 'object') {
        if (document.documents && Array.isArray(document.documents)) {
          payload = document;
        } else {
          payload = {
            file_url: document.file_url || document.fileUrl || document.url || null,
            file_name: document.file_name || document.fileName || document.name || null,
            file_type: document.file_type || document.fileType || document.type || null,
          };
        }
      } else {
        return thunkAPI.rejectWithValue('Invalid document payload');
      }

      const response = await httpPostService(`api/clients/${clientId}/documents`, payload);

      // Normalize server response: if backend returns { success: true, data: [...] }
      if (response && response.success && Array.isArray(response.data)) {
        return { clientId, documents: response.data };
      }

      // If backend returns updated client object, keep backward compatibility
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
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
        // Normalize API response shapes:
        // - Some APIs return { success: true, data: [...], meta: {...} }
        // - Others return the array directly
        const payload = action.payload;
        if (!payload) {
          state.clients = [];
          return;
        }
        if (Array.isArray(payload)) {
          state.clients = payload;
          return;
        }
        // support { success, data, meta }
        if (payload.data && Array.isArray(payload.data)) {
          state.clients = payload.data;
          return;
        }
        // support { clients: [...] }
        if (payload.clients && Array.isArray(payload.clients)) {
          state.clients = payload.clients;
          return;
        }
        // fallback: try to coerce to array
        state.clients = Array.isArray(payload) ? payload : [];
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
      
      // create client
      builder.addCase(createClient.fulfilled, (state, action) => {
        if (!action.payload) return;
        // Normalize created client shape: support { success, data } or raw object
        const payload = action.payload;
        const created = (payload.data && typeof payload.data === 'object') ? payload.data : payload;
        // prepend newly created client
        state.clients = [created, ...state.clients];
        state.status = 'succeeded';
      });

      // get single client (upsert)
      builder.addCase(getClient.fulfilled, (state, action) => {
        const client = action.payload;
        if (!client) return;
        const id = client.id || client._id || client.public_id;
        const idx = state.clients.findIndex(c => (c.id === id || c._id === id || c.public_id === id));
        if (idx !== -1) state.clients[idx] = client;
        else state.clients.unshift(client);
      });

      // restore client
      builder.addCase(restoreClient.fulfilled, (state, action) => {
        const client = action.payload;
        if (!client) return;
        const id = client.id || client._id || client.public_id;
        const idx = state.clients.findIndex(c => (c.id === id || c._id === id || c.public_id === id));
        if (idx !== -1) state.clients[idx] = client;
        else state.clients.unshift(client);
      });

      // permanent delete
      builder.addCase(permanentDeleteClient.fulfilled, (state, action) => {
        state.clients = state.clients.filter(client => client.id !== action.payload);
      });

      // assign manager (server returns updated client)
      builder.addCase(assignManager.fulfilled, (state, action) => {
        const client = action.payload;
        if (!client) return;
        const id = client.id || client._id || client.public_id;
        const idx = state.clients.findIndex(c => (c.id === id || c._id === id || c.public_id === id));
        if (idx !== -1) state.clients[idx] = client;
      });

      // contacts / documents — expect server returns updated client
      builder.addCase(addContact.fulfilled, (state, action) => {
        const client = action.payload;
        if (!client) return;
        const id = client.id || client._id || client.public_id;
        const idx = state.clients.findIndex(c => (c.id === id || c._id === id || c.public_id === id));
        if (idx !== -1) state.clients[idx] = client;
      });

      builder.addCase(updateContact.fulfilled, (state, action) => {
        const client = action.payload;
        if (!client) return;
        const id = client.id || client._id || client.public_id;
        const idx = state.clients.findIndex(c => (c.id === id || c._id === id || c.public_id === id));
        if (idx !== -1) state.clients[idx] = client;
      });

      builder.addCase(deleteContact.fulfilled, (state, action) => {
        const { clientId, contactId } = action.payload || {};
        if (!clientId || !contactId) return;
        const idx = state.clients.findIndex(c => (c.id === clientId || c._id === clientId || c.public_id === clientId));
        if (idx === -1) return;
        const client = state.clients[idx];
        if (Array.isArray(client.contacts)) {
          client.contacts = client.contacts.filter(ct => (ct.id !== contactId && ct._id !== contactId && ct.public_id !== contactId));
          state.clients[idx] = client;
        }
      });

      builder.addCase(setPrimaryContact.fulfilled, (state, action) => {
        const client = action.payload;
        if (!client) return;
        const id = client.id || client._id || client.public_id;
        const idx = state.clients.findIndex(c => (c.id === id || c._id === id || c.public_id === id));
        if (idx !== -1) state.clients[idx] = client;
      });

      builder.addCase(attachDocument.fulfilled, (state, action) => {
        const payload = action.payload;
        if (!payload) return;

        // Case A: backend returned { clientId, documents: [...] }
        if (payload.clientId && Array.isArray(payload.documents)) {
          const id = payload.clientId;
          const idx = state.clients.findIndex(c => (c.id === id || c._id === id || c.public_id === id));
          if (idx !== -1) {
            const client = state.clients[idx];
            client.documents = Array.isArray(client.documents) ? [...client.documents, ...payload.documents] : payload.documents;
            state.clients[idx] = client;
          }
          return;
        }

        // Case B: backend returned the updated client object (backwards compatibility)
        const client = payload;
        const id = client.id || client._id || client.public_id;
        const idx = state.clients.findIndex(c => (c.id === id || c._id === id || c.public_id === id));
        if (idx !== -1) state.clients[idx] = client;
      });
  },
});

export const selectClients = (state) => state.clients.clients || [];
export const selectClientStatus = (state) => state.clients.status;
export const selectClientError = (state) => state.clients.error;

export default clientSlice.reducer;

// Thunks for adding a new client