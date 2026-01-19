import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/slices/authSlice';
import fetchWithTenant from '../utils/fetchWithTenant';
import { toast } from 'sonner';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Plus,
  Search,
  Filter,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  File,
  Shield
} from 'lucide-react';

const Documents = () => {
  const user = useSelector(selectUser);
  const userRole = user?.role?.toLowerCase() || 'employee';

  // State management
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    file: null,
    entityType: 'PROJECT',
    entityId: '',
    accessType: 'READ'
  });

  // Available entity types based on role
  const getEntityTypes = () => {
    switch (userRole) {
      case 'admin':
        return [
          { value: 'PROJECT', label: 'Project' },
          { value: 'CLIENT', label: 'Client' },
          { value: 'GENERAL', label: 'General' }
        ];
      case 'manager':
        return [
          { value: 'PROJECT', label: 'Project' },
          { value: 'CLIENT', label: 'Client' }
        ];
      default:
        return [
          { value: 'TASK', label: 'Task' }
        ];
    }
  };

  // Load documents - accepts projectId and pagination
  const loadDocuments = useCallback(async (projectId = '', page = 1, limit = 25) => {
    try {
      setLoading(true);
      setError(null);

      // Find the selected project to get its public_id
      const selectedProject = projects.find(p =>
        p.id === projectId || p._id === projectId || p.public_id === projectId
      );

      const headers = {};
      let projectHeaderValue = '';
      if (selectedProject && selectedProject.public_id) {
        projectHeaderValue = selectedProject.public_id;
      } else if (projectId) {
        // Fallback to projectId if public_id not found
        projectHeaderValue = projectId;
      }

      // If available, send the project public id as header (backend expects `project-id`)
      if (projectHeaderValue) {
        headers['project-id'] = projectHeaderValue;
        console.log('Sending project-id header:', projectHeaderValue);
      }

      // Always include Authorization like the curl example
      const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('tm_access_token');
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Use page & limit as query params (backend expects these)
      const queryObj = { page: String(page), limit: String(limit) };
      // Also include project_public_id and public_id in query when available (backend may accept either)
      if (projectHeaderValue) {
        queryObj.project_public_id = projectHeaderValue;
        queryObj.public_id = projectHeaderValue;
      }
      const query = new URLSearchParams(queryObj).toString();
      const path = `/api/documents?${query}`;
      console.log('Making request to', path, 'with headers:', headers);

      const response = await fetchWithTenant(path, {
        headers
      });

      console.log('API response:', response);

      if (response && response.success && Array.isArray(response.data)) {
        setDocuments(response.data);
      } else {
        setDocuments([]);
        setError('Failed to load documents');
      }
    } catch (err) {
      console.error('Error loading documents:', err);
      setError(err.message || 'Failed to load documents');
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [projects]);

  // Load projects
  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      // prefer projects dropdown endpoint
      const resp = await fetchWithTenant('/api/projects?dropdown=1');
      const data = Array.isArray(resp?.data) ? resp.data : resp;
      const projectsArray = Array.isArray(data) ? data : [];
      console.log('Loaded projects:', projectsArray);
      setProjects(projectsArray);
    } catch (err) {
      console.error('Error loading projects:', err);
      toast.error('Failed to load projects');
    } finally {
      setProjectsLoading(false);
    }
  }, [userRole]);

  // Upload document
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadForm.file) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!uploadForm.entityId && uploadForm.entityType !== 'GENERAL') {
      toast.error('Please provide an entity ID');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('document', uploadForm.file);
      // follow Postman: include projectId, taskId, clientId, fileName
      formData.append('projectId', selectedProjectId || '');
      formData.append('taskId', uploadForm.taskId || '');
      formData.append('clientId', uploadForm.clientId || '');
      formData.append('fileName', uploadForm.file.name || '');

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'x-tenant-id': localStorage.getItem('tenantId') || 'default'
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Document uploaded successfully!');
        setShowUploadModal(false);
        setUploadForm({ file: null, entityType: 'PROJECT', entityId: '', accessType: 'READ' });
        loadDocuments(selectedProjectId, 1, 25);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  // Preview document
  const handlePreview = async (documentId) => {
    try {
      // Find the selected project to get its projectId or public_id
      const selectedProject = projects.find(p =>
        p.projectId === selectedProjectId || p.public_id === selectedProjectId || p.id === selectedProjectId || p._id === selectedProjectId
      );

      const headers = {};
      if (selectedProject && (selectedProject.projectId || selectedProject.public_id)) {
        headers['project-id'] = selectedProject.projectId ?? selectedProject.public_id;
      } else if (selectedProjectId) {
        // Fallback to selectedProjectId if not found
        headers['project-id'] = selectedProjectId;
      }

      const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('tm_access_token');
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      let projectHeaderValue = '';
      if (selectedProject && (selectedProject.projectId || selectedProject.public_id)) projectHeaderValue = selectedProject.projectId ?? selectedProject.public_id;
      else if (selectedProjectId) projectHeaderValue = selectedProjectId;

      let previewPath = `/api/documents/preview/${documentId}`;
      // also attach project_public_id as query param
      if (projectHeaderValue) previewPath += `?project_public_id=${encodeURIComponent(projectHeaderValue)}`;

      const response = await fetchWithTenant(previewPath, {
        headers
      });

      if (response && response.success && response.data) {
        // Handle preview - could be a URL or base64 data
        if (response.data.previewUrl) {
          const previewUrl = response.data.previewUrl;
          // If preview URL is same-origin or protected, fetch using Authorization header then open blob URL
          try {
            const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('tm_access_token');
            const tenant = localStorage.getItem('tenantId') || 'default';
            const isSameOrigin = previewUrl.startsWith(window.location.origin) || previewUrl.startsWith('/');
            if (isSameOrigin && accessToken) {
              const fileResp = await fetch(previewUrl, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'x-tenant-id': tenant
                }
              });
              if (fileResp.ok) {
                const blob = await fileResp.blob();
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
                // revoke after short delay
                setTimeout(() => window.URL.revokeObjectURL(url), 10000);
              } else {
                // fallback to opening the URL directly
                window.open(previewUrl, '_blank');
              }
            } else {
              // external URL or no token — open directly
              window.open(previewUrl, '_blank');
            }
          } catch (err) {
            console.error('Preview fetch error:', err);
            window.open(response.data.previewUrl, '_blank');
          }
        } else {
          toast.info('Preview not available for this document type');
        }
      } else {
        toast.error('Failed to load document preview');
      }
    } catch (err) {
      console.error('Preview error:', err);
      toast.error('Failed to preview document');
    }
  };

  // Download document
  const handleDownload = async (documentId, fileName) => {
    setDownloading(documentId);

    try {

      // Find the selected project to get its projectId or public_id
      const selectedProject = projects.find(p =>
        p.projectId === selectedProjectId || p.public_id === selectedProjectId || p.id === selectedProjectId || p._id === selectedProjectId
      );

      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'x-tenant-id': localStorage.getItem('tenantId') || 'default'
      };

      if (selectedProject && (selectedProject.projectId || selectedProject.public_id)) {
        headers['project-id'] = selectedProject.projectId ?? selectedProject.public_id;
      } else if (selectedProjectId) {
        // Fallback to selectedProjectId if not found
        headers['project-id'] = selectedProjectId;
      }

      let projectHeaderValue = '';
      if (selectedProject && (selectedProject.projectId || selectedProject.public_id)) projectHeaderValue = selectedProject.projectId ?? selectedProject.public_id;
      else if (selectedProjectId) projectHeaderValue = selectedProjectId;

      let downloadPath = `/api/documents/download/${documentId}`;
      if (projectHeaderValue) downloadPath += `?project_public_id=${encodeURIComponent(projectHeaderValue)}`;

      const response = await fetch(downloadPath, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Document downloaded successfully!');
      } else {
        throw new Error('Download failed');
      }
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download document');
    } finally {
      setDownloading(null);
    }
  };

  // Assign document access (Admin only)
  const handleAssignAccess = async (documentId, userId, accessType) => {
    if (userRole !== 'admin') {
      toast.error('Access denied');
      return;
    }

    try {
      // Find the selected project to get its projectId or public_id
      const selectedProject = projects.find(p =>
        p.projectId === selectedProjectId || p.public_id === selectedProjectId || p.id === selectedProjectId || p._id === selectedProjectId
      );

      const headers = {
        'Content-Type': 'application/json',
      };

      if (selectedProject && (selectedProject.projectId || selectedProject.public_id)) {
        headers['project-id'] = selectedProject.projectId ?? selectedProject.public_id;
      } else if (selectedProjectId) {
        // Fallback to selectedProjectId if not found
        headers['project-id'] = selectedProjectId;
      }

      const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('tm_access_token');
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      let projectHeaderValue = '';
      if (selectedProject && (selectedProject.projectId || selectedProject.public_id)) projectHeaderValue = selectedProject.projectId ?? selectedProject.public_id;
      else if (selectedProjectId) projectHeaderValue = selectedProjectId;

      const bodyPayload = { userId, accessType };
      if (projectHeaderValue) bodyPayload.project_public_id = projectHeaderValue;

      const response = await fetchWithTenant(`/api/documents/${documentId}/assign-access`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload)
      });

      if (response && response.success) {
        toast.success('Access assigned successfully!');
        loadDocuments(selectedProjectId, 1, 25);
      } else {
        throw new Error(response.error || 'Failed to assign access');
      }
    } catch (err) {
      console.error('Assign access error:', err);
      toast.error('Failed to assign document access');
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.uploadedBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.entityType?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterType === 'all' || doc.entityType === filterType;

    return matchesSearch && matchesFilter;
  });

  // Get file icon based on type
  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType?.includes('image')) return <File className="w-5 h-5 text-green-500" />;
    if (mimeType?.includes('word') || mimeType?.includes('doc')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (mimeType?.includes('excel') || mimeType?.includes('xls')) return <File className="w-5 h-5 text-green-600" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Check if user can upload
  const canUpload = () => {
    return ['admin', 'manager'].includes(userRole);
  };

  // Check if user can assign access
  const canAssignAccess = () => {
    return userRole === 'admin';
  };

  // Load documents when selected project changes
  useEffect(() => {
    console.log('useEffect triggered - selectedProjectId:', selectedProjectId);
    loadDocuments(selectedProjectId, 1, 25);
  }, [loadDocuments, selectedProjectId]);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Document Management</h2>
          <p className="text-gray-600 mt-1">Select a project to view and manage its documents</p>
        </div>

        <div className="flex gap-3">
          {canUpload() && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="PROJECT">Projects</option>
            <option value="CLIENT">Clients</option>
            <option value="TASK">Tasks</option>
            <option value="GENERAL">General</option>
          </select>

          <select
            value={selectedProjectId}
            onChange={(e) => {
              const newValue = e.target.value;
              console.log('Project selected:', newValue);
              setSelectedProjectId(newValue);
            }}
            disabled={projectsLoading}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">
              {projectsLoading ? 'Loading projects...' : 'All Projects'}
            </option>
            {projects.map(project => {
              const val = project.projectId ?? project.public_id ?? project.id ?? project._id;
              const label = project.projectName ?? project.name ?? project.title ?? project.project_name ?? `Project ${val ?? ''}`;
              return (
                <option key={val} value={val}>
                  {label}
                </option>
              );
            })}
          </select>

          <button
            onClick={() => setSelectedProjectId('')}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Clear Filter
          </button>
        </div>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Documents</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadDocuments(selectedProjectId, 1, 25)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Documents Found</h3>
          <p className="text-gray-600 mb-6">
            {selectedProjectId
              ? (searchQuery || filterType !== 'all'
                  ? 'No documents match your search criteria.'
                  : 'No documents have been uploaded for this project yet.')
              : 'Please select a project from the dropdown above to view its documents.'}
          </p>
          {canUpload() && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload Your First Document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <div key={doc.documentId} className="bg-white rounded-xl border hover:shadow-lg transition-shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getFileIcon(doc.mimeType)}
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate max-w-[200px]" title={doc.fileName}>
                      {doc.fileName}
                    </h3>
                    <p className="text-sm text-gray-500">{formatFileSize(doc.fileSize)}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  doc.entityType === 'PROJECT' ? 'bg-blue-100 text-blue-800' :
                  doc.entityType === 'CLIENT' ? 'bg-green-100 text-green-800' :
                  doc.entityType === 'TASK' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {doc.entityType}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{doc.uploadedBy || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                </div>
                {doc.entityId && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="w-4 h-4" />
                    <span>ID: {doc.entityId}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handlePreview(doc.documentId)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={() => handleDownload(doc.documentId, doc.fileName)}
                  disabled={downloading === doc.documentId}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
                >
                  {downloading === doc.documentId ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700"></div>
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Download
                </button>
              </div>

              {canAssignAccess() && (
                <div className="mt-3 pt-3 border-t">
                  <button
                    onClick={() => {
                      // TODO: Implement access assignment modal
                      toast.info('Access assignment feature coming soon');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    Manage Access
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Upload Document</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document File *
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entity Type
                </label>
                <select
                  value={uploadForm.entityType}
                  onChange={(e) => setUploadForm({ ...uploadForm, entityType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getEntityTypes().map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {uploadForm.entityType !== 'GENERAL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entity ID *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.entityId}
                    onChange={(e) => setUploadForm({ ...uploadForm, entityId: e.target.value })}
                    placeholder={`Enter ${uploadForm.entityType.toLowerCase()} ID`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
