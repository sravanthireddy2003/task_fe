import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../redux/slices/authSlice';
import {
  fetchDocuments,
  deleteDocument,
  selectDocuments,
  selectDocumentStatus,
  selectDocumentError
} from '../redux/slices/documentSlice';
import { fetchProjects, getProject, selectProjects, selectProjectStatus } from '../redux/slices/projectSlice';
import { fetchClients, getClient, selectClients } from '../redux/slices/clientSlice';
import { fetchUsers, selectUsers } from '../redux/slices/userSlice';
import { httpGetService } from '../App/httpHandler'; // For downloads/previews
import { toast } from 'sonner';
import * as Icons from '../icons';
import PageHeader from '../components/PageHeader';

const { FileText, Download, Eye, Search, AlertCircle, Calendar, File, Shield, Trash2, User: UserIcon } = Icons;

const Documents = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const userRole = user?.role?.toLowerCase() || 'employee';
  const currentUserId = user?.id ?? user?.userId ?? user?.user_id ?? user?.publicId ?? '';

  // Redux state
  const documents = useSelector(selectDocuments);
  const loading = useSelector(selectDocumentStatus) === 'loading';
  const error = useSelector(selectDocumentError);

  // Redux Projects
  const projects = useSelector(selectProjects);
  const projectsLoading = useSelector(selectProjectStatus) === 'loading';

  // Redux Clients
  const clients = useSelector(selectClients);

  // Redux Users
  const allUsers = useSelector(selectUsers) || [];

  // Local UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [downloading, setDownloading] = useState(null);

  // Fetch projects and clients on mount
  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchClients());
    dispatch(fetchUsers());
  }, [dispatch]);

  // Fetch documents when filter changes
  useEffect(() => {
    const loadAndFetch = async () => {
      let projectId = undefined;
      let clientId = undefined;
      let internalId = undefined;
      let possibleIds = [];

      // --- PROJECT FILTERING ---
      if (filterType === 'PROJECT' || filterType === 'all') { // Default to project logic for 'all' or specific 'PROJECT'
        if (selectedProjectId) {
          projectId = selectedProjectId;
          let projectToUse = projects.find(p =>
            (p.id && String(p.id) === String(projectId)) ||
            (p._id && String(p._id) === String(projectId)) ||
            (p.projectId && String(p.projectId) === String(projectId)) ||
            (p.public_id && String(p.public_id) === String(projectId))
          );

          // Fetch details if missing internal ID
          if (!projectToUse || (!projectToUse.id && !projectToUse._id)) {
            try {
              const result = await dispatch(getProject(projectId)).unwrap();
              if (result) projectToUse = result;
            } catch (err) {}
          }

          if (projectToUse) {
            // Prioritize public ID for API calls if available
            const publicId = projectToUse.projectId || projectToUse.public_id;
            if (publicId) projectId = publicId;

            internalId = projectToUse.id || projectToUse._id;
            possibleIds = [
              projectToUse.id, projectToUse._id, projectToUse.projectId,
              projectToUse.public_id, projectToUse.uuid
            ].filter(id => id).map(String);
          }
        }
      }

      // --- CLIENT FILTERING ---
      if (filterType === 'CLIENT') {
        if (selectedClientId) {
          clientId = selectedClientId;
          let clientToUse = clients.find(c =>
            (c.id && String(c.id) === String(clientId)) ||
            (c._id && String(c._id) === String(clientId)) ||
            (c.public_id && String(c.public_id) === String(clientId))
          );

          if (clientToUse) {
            internalId = clientToUse.id || clientToUse._id;
            possibleIds = [clientToUse.id, clientToUse._id, clientToUse.public_id].filter(id => id).map(String);
          }
        }
      }

      dispatch(fetchDocuments({
        projectId: projectId || undefined,
        clientId: clientId || undefined,
        internalId,
        possibleIds,
        type: filterType === 'all' ? undefined : filterType,
        search: searchQuery || undefined
      }));
    };

    loadAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, selectedProjectId, selectedClientId, filterType, searchQuery, projects, clients]);

  // Initial project load handled by fetchProjects() above

  // Handlers
  const handlePreview = async (documentId) => {
    try {
      const resp = await httpGetService(`documents/${documentId}/preview`);
      const payload = resp?.data ?? resp;

      if (payload && payload.previewUrl) {
        window.open(payload.previewUrl, '_blank');
      } else if (payload && payload.blob) {
        const url = window.URL.createObjectURL(payload.blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      } else {
        toast.info('Preview not available for this document type');
      }
    } catch (err) {
      toast.error('Failed to preview document');
    }
  };

  const handleDownload = async (doc) => {
    const documentId = doc.documentId || doc.id || doc._id;
    setDownloading(documentId);

    try {
      const blob = await httpGetService(`documents/${documentId}/download`, { responseType: 'blob' });

      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName || 'document';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Document downloaded successfully!');
      } else {
        throw new Error('Download failed');
      }
    } catch (err) {
      toast.error('Failed to download document');
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await dispatch(deleteDocument(documentId)).unwrap();
      toast.success('Document deleted');
      // List is updated automatically via Redux slice (deleteDocument.fulfilled)
    } catch (err) {
      toast.error(err?.message || 'Failed to delete document');
    }
  };

  // Helper functions
  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType?.includes('image')) return <File className="w-5 h-5 text-green-500" />;
    if (mimeType?.includes('word') || mimeType?.includes('doc')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (mimeType?.includes('excel') || mimeType?.includes('xls')) return <File className="w-5 h-5 text-green-600" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // RBAC Access Checks
  const canUpload = userRole === 'admin';
  const canDelete = (doc) => {
    if (userRole === 'admin') return true;
    return false; // Strict RBAC: Manager/Employee cannot delete in global view
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Documents"
        subtitle="Manage and organize project documents, files, and resources"
        onRefresh={() => dispatch(fetchDocuments({ projectId: selectedProjectId, search: searchQuery }))}
      />

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl border p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search documents by name, type, or uploader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="PROJECT">Projects</option>
              <option value="CLIENT">Clients</option>
            </select>

            {/* Project Filter */}
            {(filterType === 'all' || filterType === 'PROJECT') && (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={projectsLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">
                  {projectsLoading ? 'Loading projects...' : 'All Projects'}
                </option>
                {projects.map(project => {
                  const val = project.projectId ?? project.public_id ?? project.id ?? project._id;
                  const label = project.name ?? project.projectName ?? project.title ?? project.project_name ?? `Project ${val ?? ''}`;
                  return (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  );
                })}
              </select>
            )}

            {/* Client Filter */}
            {filterType === 'CLIENT' && (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">All Clients</option>
                {clients.map(client => {
                  const val = client.id ?? client._id ?? client.public_id;
                  const label = client.clientName ?? client.name ?? `Client ${val}`;
                  return (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-600 mb-4"></div>
          <p className="text-gray-500 font-medium">Loading documents...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-100 p-12 text-center max-w-2xl mx-auto mt-8 shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Documents</h3>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => dispatch(fetchDocuments({ projectId: selectedProjectId }))}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            Try Again
          </button>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-gray-200">
            <FileText className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Documents Found</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {searchQuery
              ? "We couldn't find any documents matching your search criteria. Try adjusting your filters."
              : "There are currently no documents available in this view."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {documents.map((doc) => {
            const rawDate = doc.createdAt || doc.uploadedAt;
            const formattedDate = rawDate
              ? new Date(rawDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
              : 'N/A';

            const projectObj = projects.find(p => String(p.projectId || p.id || p._id || p.public_id) === String(doc.projectId || doc.entityId));
            const projectName = projectObj?.name || projectObj?.projectName || `Project ID: ${doc.projectId || doc.entityId || 'N/A'}`;

            const clientObj = clients.find(c => String(c.id || c._id || c.public_id) === String(doc.clientId || doc.entityId));
            const clientName = clientObj?.clientName || clientObj?.name || `Client ID: ${doc.clientId || doc.entityId || 'N/A'}`;

            const uploaderObj = allUsers.find(u => String(u.id || u._id || u.public_id || u.email || u.publicId) === String(doc.uploadedBy));
            const uploaderName = uploaderObj?.name || (uploaderObj?.firstName ? `${uploaderObj.firstName} ${uploaderObj.lastName || ''}`.trim() : null) || doc.uploadedBy || 'System';

            return (
              <div key={doc.documentId || doc.id || doc._id} className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 flex flex-col group">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                        {getFileIcon(doc.mimeType)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 truncate max-w-[180px] sm:max-w-[220px]" title={doc.fileName}>
                          {doc.fileName || 'Unnamed Document'}
                        </h3>
                        {doc.fileSize && (
                          <p className="text-xs text-gray-500 mt-1 font-medium">{formatFileSize(doc.fileSize)}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${doc.entityType === 'PROJECT' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        doc.entityType === 'CLIENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          doc.entityType === 'TASK' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                      {doc.entityType || 'DOCUMENT'}
                    </span>

                    {(doc.entityType === 'PROJECT' || doc.entityType === 'CLIENT') && (
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border truncate max-w-[150px] ${doc.entityType === 'PROJECT' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-teal-50 text-teal-700 border-teal-100'
                          }`}
                        title={doc.entityType === 'PROJECT' ? projectName : clientName}
                      >
                        {doc.entityType === 'PROJECT' ? projectName : clientName}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <UserIcon className="w-3 h-3" /> Uploaded By
                      </div>
                      <div className="text-sm text-gray-800 font-semibold truncate" title={uploaderName}>
                        {uploaderName}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Date Added
                      </div>
                      <div className="text-sm text-gray-800 font-semibold">
                        {formattedDate}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 rounded-b-xl flex items-center justify-end gap-2">
                  <button
                    onClick={() => handlePreview(doc.documentId || doc.id || doc._id)}
                    className="flex items-center justify-center w-9 h-9 text-gray-500 bg-white border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 rounded-lg transition-all shadow-sm"
                    title="Preview Document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={downloading === (doc.documentId || doc.id || doc._id)}
                    className="flex items-center justify-center w-9 h-9 text-gray-500 bg-white border border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Download Document"
                  >
                    {downloading === (doc.documentId || doc.id || doc._id) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-200 border-t-emerald-600"></div>
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                  {canDelete(doc) && (
                    <button
                      onClick={() => handleDelete(doc.documentId || doc.id || doc._id)}
                      className="flex items-center justify-center w-9 h-9 text-gray-500 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg transition-all shadow-sm ml-1"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Documents;