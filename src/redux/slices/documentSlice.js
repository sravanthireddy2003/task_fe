import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { httpGetService, httpPostService, httpPutService, httpDeleteService } from '../../App/httpHandler';

// --- Async Thunks ---

// Fetch documents (global list with filtering)
export const fetchDocuments = createAsyncThunk(
    'documents/fetchDocuments',
    async (params = {}, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.set('page', params.page);
            if (params.limit) queryParams.set('limit', params.limit);
            if (params.projectId) queryParams.set('projectId', params.projectId);
            if (params.clientId) queryParams.set('clientId', params.clientId);
            if (params.search) queryParams.set('search', params.search);
            if (params.type && params.type !== 'all') queryParams.set('type', params.type);

            // Endpoint determines scope (my docs vs all docs) based on backend logic,
            // but frontend can also hint or use specific endpoints if needed.
            // For now, we use the standard list endpoint which backend filters by role.
            const response = await httpGetService(`documents?${queryParams.toString()}`);
            return response.data || response; // Return data if available
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch documents');
        }
    }
);

// Fetch documents for a specific project
export const fetchProjectDocuments = createAsyncThunk(
    'documents/fetchProjectDocuments',
    async (projectId, { rejectWithValue }) => {
        try {
            const response = await httpGetService(`projects/${projectId}/documents`);
            return response;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch project documents');
        }
    }
);

// Fetch documents for a specific client
export const fetchClientDocuments = createAsyncThunk(
    'documents/fetchClientDocuments',
    async (clientId, { rejectWithValue }) => {
        try {
            const response = await httpGetService(`clients/${clientId}/documents`);
            return response;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch client documents');
        }
    }
);

// Upload document
export const uploadDocument = createAsyncThunk(
    'documents/uploadDocument',
    async ({ file, entityType, entityId, projectId, clientId }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('document', file);
            formData.append('entityType', entityType);

            if (entityId) formData.append('entityId', entityId);
            if (projectId) formData.append('projectId', projectId);
            if (clientId) formData.append('clientId', clientId);

            // Determine endpoint based on context if needed, or use a generic upload
            // Using generic upload endpoint which handles routing based on entityType/Id
            // Note: httpPostService automatically handles FormData Content-Type and Authorization
            const response = await httpPostService('documents/upload', formData);
            return response;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to upload document');
        }
    }
);

// Delete document
export const deleteDocument = createAsyncThunk(
    'documents/deleteDocument',
    async (documentId, { rejectWithValue }) => {
        try {
            await httpDeleteService(`documents/${documentId}`);
            return documentId;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to delete document');
        }
    }
);

// --- Slice ---

const documentSlice = createSlice({
    name: 'documents',
    initialState: {
        items: [], // Main list of documents
        projectDocs: {}, // Cache by projectId
        clientDocs: {}, // Cache by clientId
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
        pagination: {
            page: 1,
            limit: 25,
            total: 0,
        },
        uploadStatus: 'idle',
    },
    reducers: {
        clearDocuments: (state) => {
            state.items = [];
            state.status = 'idle';
            state.error = null;
        },
        clearUploadStatus: (state) => {
            state.uploadStatus = 'idle';
        }
    },
    extraReducers: (builder) => {
        // Fetch Documents
        builder
            .addCase(fetchDocuments.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchDocuments.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // Handle different response structures gracefully
                // Handle different response structures gracefully
                const payload = action.payload;
                let data = [];
                let meta = {};

                // Check for extractable documents array in various locations
                if (payload?.data?.data?.documents && Array.isArray(payload.data.data.documents)) {
                    // Axios Response -> Body { data: { documents: [] } }
                    data = payload.data.data.documents;
                    meta = payload.data.data.pagination || payload.data.meta || {};
                } else if (payload?.data?.documents && Array.isArray(payload.data.documents)) {
                    // Body { data: { documents: [] } } OR Axios Response -> Body { documents: [] }
                    data = payload.data.documents;
                    meta = payload.data.pagination || payload.meta || {};
                } else if (Array.isArray(payload?.data)) {
                    // Body { data: [] }
                    data = payload.data;
                    meta = payload.meta || payload.pagination || {};
                } else if (Array.isArray(payload?.documents)) {
                    // Body { documents: [] }
                    data = payload.documents;
                    meta = payload.meta || payload.pagination || {};
                } else if (Array.isArray(payload)) {
                    // Body []
                    data = payload;
                } else if (payload?.data?.data && Array.isArray(payload.data.data)) {
                    // Axios Response -> Body { data: [] }
                    data = payload.data.data;
                }

                // If data is still empty, and payload IS the array
                if (data.length === 0 && Array.isArray(payload)) {
                    data = payload;
                }

                const { projectId, clientId, type, internalId, possibleIds } = action.meta.arg;

                // Client-side filtering fallback (since backend seems to ignore filters)
                // Client-side filtering fallback
                // If the user requested specific project/client docs via params (projectId/clientId), 
                // we TRUST the backend to return the correct documents.
                // We ONLY apply strict client-side filtering if:
                // 1. We are looking at "All" docs but want to manually filter (unlikely case with current API)
                // 2. OR if we suspect the backend ignores the filter (but user confirmed it works).

                // CRITICAL FIX: The backend query uses Public ID, but returns documents with Internal ID.
                // The frontend 'possibleIds' map might miss the Internal ID if project details aren't fully loaded.
                // Therefore, strict filtering removes valid documents.

                // Solution: If specific ID params were used in the fetch, we skip strict verification 
                // and assume the backend did its job.

                const hasExplicitFilter = !!(projectId || clientId);

                if (!hasExplicitFilter && possibleIds && possibleIds.length > 0) {
                    // Only filter if we requested "All" but want to narrow down, AND we have a map.
                    // (This path might rarely be taken if we always pass params for filtering)
                    data = data.filter(doc => {
                        const pId = doc.projectId ? String(doc.projectId) : null;
                        const cId = doc.clientId ? String(doc.clientId) : null;
                        const eId = doc.entityId ? String(doc.entityId) : null;

                        if (possibleIds.includes(pId)) return true;
                        if (possibleIds.includes(cId)) return true;
                        if (possibleIds.includes(eId)) return true;

                        return false;
                    });
                }

                if (type && type !== 'all') {
                    data = data.filter(doc => doc.entityType && doc.entityType.toUpperCase() === type.toUpperCase());
                }

                state.items = data;
                state.pagination = {
                    page: meta.page || state.pagination.page,
                    limit: meta.limit || state.pagination.limit,
                    total: data.length, // Update total to match filtered length
                };
            })
            .addCase(fetchDocuments.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });

        // Fetch Project Documents
        builder
            .addCase(fetchProjectDocuments.pending, (state) => {
                // We might want separate status for this to avoid clearing main list
                // For now, simple implementation
            })
            .addCase(fetchProjectDocuments.fulfilled, (state, action) => {
                const projectId = action.meta.arg;
                const data = action.payload?.data || action.payload?.documents || [];
                state.projectDocs[projectId] = data;
            });

        // Fetch Client Documents
        builder
            .addCase(fetchClientDocuments.fulfilled, (state, action) => {
                const clientId = action.meta.arg;
                const data = action.payload?.data || action.payload?.documents || [];
                state.clientDocs[clientId] = data;
            });

        // Upload Document
        builder
            .addCase(uploadDocument.pending, (state) => {
                state.uploadStatus = 'loading';
            })
            .addCase(uploadDocument.fulfilled, (state, action) => {
                state.uploadStatus = 'succeeded';
                // Optimistic update or refresh? 
                // Typically explicit refresh is safer, but we can append if structure matches
                const newDoc = action.payload?.data || action.payload?.document;
                if (newDoc) {
                    state.items.unshift(newDoc);
                }
            })
            .addCase(uploadDocument.rejected, (state, action) => {
                state.uploadStatus = 'failed';
                state.error = action.payload; // Optional: separate upload error
            });

        // Delete Document
        builder
            .addCase(deleteDocument.fulfilled, (state, action) => {
                const id = action.payload;
                state.items = state.items.filter(doc => (doc.id !== id && doc.documentId !== id && doc._id !== id));
                // Also cleanup caches if needed, but might be overkill for now
            });
    },
});

export const { clearDocuments, clearUploadStatus } = documentSlice.actions;

// Selectors
export const selectDocuments = (state) => state.documents.items;
export const selectDocumentStatus = (state) => state.documents.status;
export const selectDocumentError = (state) => state.documents.error;
export const selectDocumentPagination = (state) => state.documents.pagination;
export const selectUploadStatus = (state) => state.documents.uploadStatus;

export const selectProjectDocuments = (projectId) => (state) => state.documents.projectDocs[projectId] || [];
export const selectClientDocuments = (clientId) => (state) => state.documents.clientDocs[clientId] || [];

export default documentSlice.reducer;
