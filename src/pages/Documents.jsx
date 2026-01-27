import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/slices/authSlice';
import fetchWithTenant from '../utils/fetchWithTenant';
import { httpGetService, httpPostService } from '../App/httpHandler';
import { toast } from 'sonner';
import * as Icons from '../icons';

const { FileText, Upload, Download, Eye, Plus, Search, Filter, X, AlertCircle, CheckCircle, Clock, User, Calendar, File, Shield } = Icons;

const Documents = () => {
  const user = useSelector(selectUser);
  const userRole = user?.role?.toLowerCase() || 'employee';
  const currentUserId = user?.id ?? user?.userId ?? user?.user_id ?? user?.publicId ?? '';

  // Normalize access types to canonical values: VIEW, EDIT, OWNER
  const normalizeAccessType = (val) => {
    if (val === null || typeof val === 'undefined') throw new Error('Invalid access type: empty. Allowed values: VIEW, EDIT, OWNER');
    const s = String(val).trim().toLowerCase();
    const view = ['view', 'read', 'preview', 'download', 'none'];
    const edit = ['edit', 'write', 'delete'];
    const owner = ['owner', 'admin'];
    if (view.includes(s)) return 'VIEW';
    if (edit.includes(s)) return 'EDIT';
    if (owner.includes(s)) return 'OWNER';
    throw new Error(`Invalid access type: ${val}. Allowed values: VIEW, EDIT, OWNER`);
  };

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
  const [showManageAccessModal, setShowManageAccessModal] = useState(false);
  const [managingDocId, setManagingDocId] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [modalMembers, setModalMembers] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [permissionLevel, setPermissionLevel] = useState('VIEW');
  const [assigningAccess, setAssigningAccess] = useState(false);

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

  // Memoize entity types to prevent unnecessary re-renders
  const entityTypes = useMemo(() => getEntityTypes(), [userRole]);

  // Load documents - accepts projectId and pagination
  const loadDocuments = useCallback(async (projectId = '', page = 1, limit = 25) => {
    try {
      setLoading(true);
      setError(null);

      // Find the selected project to get a stable project identifier
      const selectedProject = projects.find(p =>
        p.id === projectId || p._id === projectId || p.public_id === projectId || p.projectId === projectId
      );

      let projectQueryValue = '';
      if (selectedProject && (selectedProject.projectId || selectedProject.public_id)) {
        projectQueryValue = selectedProject.projectId || selectedProject.public_id;
      } else if (projectId) {
        projectQueryValue = projectId;
      }

      // Build query string using Postman-friendly `projectId` param
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (projectQueryValue) params.set('projectId', projectQueryValue);

      // If the current user is an employee and no project is provided, use the employee-scoped endpoint
      const path = (userRole === 'employee' && !projectQueryValue)
        ? 'documents/my'
        : `documents?${params.toString()}`;
      
      console.debug('[Documents] loading documents', { path });

      // Use axios-backed httpGetService which attaches Authorization and tenant headers
      const resp = await httpGetService(path);
      // httpGetService returns resp.data normally; be tolerant of shapes
      const data = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : (resp?.documents || resp?.data?.documents || []));
      
      if (Array.isArray(data)) {
        setDocuments(data);
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
  }, [projects, userRole]);

  // Load projects
  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      // prefer projects dropdown endpoint
      const resp = await httpGetService('projects?dropdown=1');
      const data = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : resp?.data);
      const projectsArray = Array.isArray(data) ? data : [];
      console.log('Loaded projects:', projectsArray);
      setProjects(projectsArray);

      // Auto-select the first project and load documents for it
      if (projectsArray && projectsArray.length > 0) {
        const first = projectsArray[0];
        const firstVal = first.projectId ?? first.public_id ?? first.id ?? first._id ?? '';
        if (firstVal) {
          setSelectedProjectId(firstVal);
          // Load documents for the first project (initial load)
          await loadDocuments(firstVal, 1, 25);
        }
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      toast.error('Failed to load projects');
    } finally {
      setProjectsLoading(false);
    }
  }, [loadDocuments]);

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
      // Postman: include projectId, clientId, taskId and optional fileName
      formData.append('projectId', selectedProjectId || '');
      if (uploadForm.taskId) formData.append('taskId', uploadForm.taskId);
      if (uploadForm.clientId) formData.append('clientId', uploadForm.clientId);
      formData.append('fileName', uploadForm.file.name || '');

      // Use httpPostService which handles FormData and attaches auth/tenant headers
      const result = await httpPostService('documents/upload', formData);

      // Check for 200 status or success flag
      const isSuccess = (result && (result.success || result?.data?.success)) || 
                       (result?.status >= 200 && result?.status < 300);

      if (isSuccess) {
        toast.success('Document uploaded successfully!');
        setShowUploadModal(false);
        setUploadForm({ file: null, entityType: 'PROJECT', entityId: '', accessType: 'READ' });
        loadDocuments(selectedProjectId, 1, 25);
      } else {
        throw new Error((result && result.error) || 'Upload failed');
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
      const selectedProject = projects.find(p =>
        p.projectId === selectedProjectId || p.public_id === selectedProjectId || p.id === selectedProjectId || p._id === selectedProjectId
      );

      const projectQuery = selectedProject && (selectedProject.projectId || selectedProject.public_id)
        ? `?projectId=${encodeURIComponent(selectedProject.projectId || selectedProject.public_id)}`
        : (selectedProjectId ? `?projectId=${encodeURIComponent(selectedProjectId)}` : '');

      const resp = await httpGetService(`documents/${documentId}/preview${projectQuery}`);
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
      console.error('Preview error:', err);
      toast.error('Failed to preview document');
    }
  };

  // Download document
  const handleDownload = async (documentId, fileName) => {
    setDownloading(documentId);

    try {
      const selectedProject = projects.find(p =>
        p.projectId === selectedProjectId || p.public_id === selectedProjectId || p.id === selectedProjectId || p._id === selectedProjectId
      );

      const projectQuery = selectedProject && (selectedProject.projectId || selectedProject.public_id)
        ? `?projectId=${encodeURIComponent(selectedProject.projectId || selectedProject.public_id)}`
        : (selectedProjectId ? `?projectId=${encodeURIComponent(selectedProjectId)}` : '');

      // Use axios helper to download blob with auth/tenant headers attached
      const blob = await httpGetService(`documents/${documentId}/download${projectQuery}`, { responseType: 'blob' });
      
      if (blob) {
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

  // Fetch project members for access assignment
  const fetchProjectMembers = async (projectIdentifier) => {
    setMembersLoading(true);
    setMembers([]);
    try {
      if (!projectIdentifier) {
        toast.error('Project identifier missing for fetching members');
        return;
      }

      // projectIdentifier may already be a public_id or internal id
      const path = `documents/project/${encodeURIComponent(projectIdentifier)}/members`;
      const resp = await httpGetService(path);
      
      // Handle 200 status
      const isSuccess = (resp && (resp.success || resp?.data?.success)) || 
                       (resp?.status >= 200 && resp?.status < 300);

      if (isSuccess) {
        const payload = resp?.data ?? resp;
        const membersArray = (payload && (payload.members || payload.data?.members)) || payload || [];
        setMembers(Array.isArray(membersArray) ? membersArray : []);
      } else {
        throw new Error(resp?.error || 'Failed to load members');
      }
    } catch (err) {
      console.error('Failed to load project members:', err);
      toast.error('Failed to load project members');
    } finally {
      setMembersLoading(false);
    }
  };

  const openManageAccess = async (doc) => {
    try {
      const projectCandidate = doc?.projectId || doc?.project_public_id || doc?.project || selectedProjectId;
      const projectIdentifier = projectCandidate || selectedProjectId;
      setManagingDocId(doc?.documentId || doc?.id || null);
      setSelectedAssignees([]);
      setPermissionLevel('VIEW');
      setShowManageAccessModal(true);
      if (projectIdentifier) await fetchProjectMembers(projectIdentifier);
    } catch (err) {
      console.error('openManageAccess error:', err);
      toast.error('Unable to open access manager');
    }
  };

  const toggleAssignee = (assigneeId) => {
    setSelectedAssignees(prev => {
      if (prev.includes(assigneeId)) return prev.filter(id => id !== assigneeId);
      return [...prev, assigneeId];
    });
  };

  const submitAssignAccess = async () => {
    if (!managingDocId) {
      toast.error('No document selected');
      return;
    }
    if (!selectedAssignees || selectedAssignees.length === 0) {
      toast.error('Select at least one user to assign access');
      return;
    }
    
    // Get the project identifier from the managing document
    const managingDoc = documents.find(d => d.documentId === managingDocId || d.id === managingDocId);
    const projectIdentifier = managingDoc?.projectId || managingDoc?.project_public_id || managingDoc?.project || selectedProjectId;
    
    setAssigningAccess(true);
    try {
      // Normalize permission level and try bulk assign first
      let normalizedPermission;
      try {
        normalizedPermission = normalizeAccessType(permissionLevel || 'VIEW');
      } catch (err) {
        toast.error(err.message);
        setAssigningAccess(false);
        return;
      }

      const bulkPayload = {
        documentId: managingDocId,
        assigneeIds: Array.isArray(selectedAssignees) ? selectedAssignees : [selectedAssignees],
        accessType: normalizedPermission,
        projectId: projectIdentifier || undefined
      };
      
      console.debug('[Documents] submitAssignAccess bulk payload:', bulkPayload);

      let aggregatedResults = [];
      let serverSuccessMessage = null;
      let hasSuccess = false;
      
      try {
        const resp = await httpPostService('documents/access', bulkPayload);
        console.debug('[Documents] API raw response:', resp);
        
        const result = resp?.data ?? resp;
        console.debug('[Documents] API response data:', result);

        // Check HTTP status code first
        const httpStatus = resp?.status || resp?.statusCode || 200;
        const isHttpSuccess = httpStatus >= 200 && httpStatus < 300;
        
        // Check success flags
        const hasSuccessFlag = result?.success === true || result?.status === 'success';
        
        console.debug('[Documents] Status check:', {
          httpStatus,
          isHttpSuccess,
          hasSuccessFlag,
          resultSuccess: result?.success,
          resultStatus: result?.status
        });

        if (isHttpSuccess || hasSuccessFlag) {
          hasSuccess = true;
          serverSuccessMessage = result?.message || result?.data?.message || 'Access assigned successfully';
          
          // Extract assignments from the response
          const assignments = result?.data?.assignments || result?.assignments || result?.data?.results || result?.results || [];
          
          console.debug('[Documents] Assignments found:', assignments);
          
          if (Array.isArray(assignments) && assignments.length > 0) {
            aggregatedResults = assignments.map(a => {
              const raw = a.accessType ?? a.permissionLevel ?? a.action ?? a.access_type ?? permissionLevel;
              let norm;
              try {
                norm = normalizeAccessType(raw);
              } catch (e) {
                console.warn('[Documents] Invalid accessType from server, defaulting to VIEW:', raw);
                norm = permissionLevel || 'VIEW';
              }
              return {
                assigneeId: a.userId ?? a.assigneeId ?? a.id ?? a.user_id,
                permissionLevel: norm
              };
            });
          } else {
            // If no assignments array but success, assume it worked
            aggregatedResults = selectedAssignees.map(assigneeId => ({
              assigneeId,
              permissionLevel: normalizedPermission || 'VIEW'
            }));
          }
          
          console.debug('[Documents] Aggregated results:', aggregatedResults);
          
          // Show success message and close modal
          toast.success(serverSuccessMessage);
          setShowManageAccessModal(false);
        } else {
          // Check if there's an error message in the response
          const errorMsg = result?.error || result?.message || 'Failed to assign access';
          console.error('[Documents] API returned error:', errorMsg);
          throw new Error(errorMsg);
        }
      } catch (err) {
        console.error('[Documents] Bulk assign failed:', err.message || err);
        
        // If we already have success from HTTP 200, don't fallback
        if (hasSuccess) {
          console.log('[Documents] Already succeeded, skipping fallback');
        } else {
          // Fallback to individual assignments if bulk fails
          console.log('[Documents] Falling back to individual assignments...');
          
          let successfulCount = 0;
          let failedCount = 0;
          
          for (const assignee of selectedAssignees) {
            try {
              const singlePayload = {
                documentId: managingDocId,
                assigneeId: assignee,
                accessType: normalizedPermission || 'VIEW',
                projectId: projectIdentifier || undefined
              };
              
              console.debug('[Documents] Individual payload:', singlePayload);
              
              const resp = await httpPostService('documents/access', singlePayload);
              const result = resp?.data ?? resp;
              
              console.debug('[Documents] Individual response:', result);
              
              // Check HTTP status code for individual request
              const httpStatus = resp?.status || resp?.statusCode || 200;
              const isHttpSuccess = httpStatus >= 200 && httpStatus < 300;
              
              // Check success flags for individual request
              const hasSuccessFlag = result?.success === true || result?.status === 'success';
              
              if (isHttpSuccess || hasSuccessFlag) {
                aggregatedResults.push({
                  assigneeId: assignee,
                  permissionLevel: normalizedPermission || 'VIEW'
                });
                successfulCount++;
              } else {
                aggregatedResults.push({
                  assigneeId: assignee,
                  error: result?.error || result?.message || 'failed'
                });
                failedCount++;
              }
            } catch (singleErr) {
              console.error(`[Documents] Failed for assignee ${assignee}:`, singleErr);
              aggregatedResults.push({
                assigneeId: assignee,
                error: singleErr.message || 'failed'
              });
              failedCount++;
            }
          }
          
          // Show summary of results
          if (successfulCount > 0) {
            toast.success(`Successfully assigned access to ${successfulCount} users${failedCount > 0 ? `, ${failedCount} failed` : ''}`);
            // Close modal on partial success
            setShowManageAccessModal(false);
          } else {
            toast.error('Failed to assign access to any users');
            // Don't close modal if all failed
          }
        }
      }

      // Update UI based on aggregatedResults
      if (aggregatedResults.length > 0) {
        setMembers(prev => prev.map(m => {
          const match = aggregatedResults.find(r => 
            String(r.assigneeId) === String(m.id) || 
            String(r.assigneeId) === String(m.publicId) ||
            String(r.assigneeId) === String(m.userId)
          );
          if (match && !match.error) {
            return { ...m, permissionLevel: match.permissionLevel || permissionLevel };
          }
          return m;
        }));
      }

      // Refresh documents list if any success
      if (hasSuccess || aggregatedResults.some(r => !r.error)) {
        loadDocuments(selectedProjectId, 1, 25);
      }
    } catch (err) {
      console.error('[Documents] submitAssignAccess error:', err);
      toast.error(err.message || 'Failed to assign access');
    } finally {
      setAssigningAccess(false);
    }
  };

  // Determine if current user has only VIEW access for a document
  const userHasViewOnly = useCallback((doc) => {
    if (!doc) return false;
    
    // Admins and managers can always download
    if (['admin', 'manager'].includes(userRole)) return false;
    
    // Check user's access from accessMembers array
    const membersList = doc.accessMembers || [];
    const userAccess = membersList.find(m => 
      String(m.userId) === String(currentUserId) || 
      String(m.id) === String(currentUserId)
    );
    
    if (!userAccess) {
      // If user is not in accessMembers, they might have default access
      // For safety, assume VIEW only for employees
      return userRole === 'employee';
    }
    
    const accessType = (userAccess.accessType || userAccess.permissionLevel || '').toString().toUpperCase();
    
    // Only truly restrictive access types should prevent download
    // VIEWONLY and READONLY mean view only, no download
    // VIEW now allows download
    return ['VIEWONLY', 'READONLY', 'NONE'].includes(accessType);
  }, [userRole, currentUserId]);

  // Check if user can download the document
  const userCanDownload = useCallback((doc) => {
    if (!doc) return false;
    
    // Admins and managers can always download
    if (['admin', 'manager'].includes(userRole)) return true;
    
    // Check user's access from accessMembers array
    const membersList = doc.accessMembers || [];
    const userAccess = membersList.find(m => 
      String(m.userId) === String(currentUserId) || 
      String(m.id) === String(currentUserId)
    );
    
    if (!userAccess) {
      // If user is not in accessMembers, check if they're the uploader
      const isUploader = String(doc.uploadedById) === String(currentUserId) || 
                         String(doc.uploadedBy) === String(currentUserId);
      return isUploader || userRole !== 'employee';
    }
    
    const accessType = (userAccess.accessType || userAccess.permissionLevel || '').toString().toUpperCase();
    
    // VIEW, DOWNLOAD, EDIT, OWNER permissions allow download
    // VIEW now includes download permission
    return ['VIEW', 'DOWNLOAD', 'EDIT', 'OWNER'].includes(accessType);
  }, [userRole, currentUserId]);

  // Filter members for display (hide OWNER details for employees)
  const filterMembersForDisplay = useCallback((membersList) => {
    if (!Array.isArray(membersList)) return [];
    
    if (userRole === 'employee') {
      return membersList.filter(m => {
        const accessType = (m.accessType || m.permissionLevel || '').toString().toUpperCase();
        return accessType !== 'OWNER';
      });
    }
    
    return membersList;
  }, [userRole]);

  // Get user's access level for a document
  const getUserAccessLevel = useCallback((doc) => {
    if (!doc) return 'NONE';
    
    // Admins have full access
    if (userRole === 'admin') return 'ADMIN';
    
    // Managers have manager access
    if (userRole === 'manager') return 'MANAGER';
    
    // Check user's access from accessMembers array
    const membersList = doc.accessMembers || [];
    const userAccess = membersList.find(m => 
      String(m.userId) === String(currentUserId) || 
      String(m.id) === String(currentUserId)
    );
    
    if (!userAccess) {
      // Check if user is the uploader
      const isUploader = String(doc.uploadedById) === String(currentUserId) || 
                         String(doc.uploadedBy) === String(currentUserId);
      return isUploader ? 'OWNER' : 'NONE';
    }
    
    const accessType = (userAccess.accessType || userAccess.permissionLevel || '').toString().toUpperCase();
    return accessType || 'VIEW';
  }, [userRole, currentUserId]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           doc.uploadedBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           doc.entityType?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = filterType === 'all' || doc.entityType === filterType;

      return matchesSearch && matchesFilter;
    });
  }, [documents, searchQuery, filterType]);

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

  // Load projects once on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Main component return
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-2">
            Manage and organize project documents, files, and resources
          </p>
        </div>

        {canUpload() && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload Document
          </button>
        )}
      </div>

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
              <option value="TASK">Tasks</option>
              <option value="GENERAL">General</option>
            </select>

            <select
              value={selectedProjectId}
              onChange={(e) => {
                const newValue = e.target.value;
                console.log('Project selected:', newValue);
                setSelectedProjectId(newValue);
                // Immediately load documents for the selected project
                loadDocuments(newValue, 1, 25);
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

            <div className="flex gap-2">
              <button
                onClick={() => loadDocuments(selectedProjectId, 1, 25)}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Load Documents
              </button>
              <button
                onClick={() => {
                  setSelectedProjectId('');
                  loadDocuments('', 1, 25);
                }}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                Clear Filter
              </button>
            </div>
          </div>
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
          {filteredDocuments.map((doc) => {
            const userAccessLevel = getUserAccessLevel(doc);
            const canDownload = userCanDownload(doc);
            const displayMembers = filterMembersForDisplay(doc.accessMembers || []);
            
            return (
              <div key={doc.documentId || doc.id} className="bg-white rounded-xl border hover:shadow-lg transition-shadow p-6">
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
                  
                  {/* Show user's access level */}
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-gray-500" />
                    <span className={`font-medium ${
                      userAccessLevel === 'OWNER' ? 'text-green-600' :
                      userAccessLevel === 'ADMIN' ? 'text-red-600' :
                      userAccessLevel === 'MANAGER' ? 'text-blue-600' :
                      userAccessLevel === 'EDIT' ? 'text-purple-600' :
                      userAccessLevel === 'DOWNLOAD' ? 'text-blue-500' :
                      'text-gray-600'
                    }`}>
                      Your access: {userAccessLevel}
                    </span>
                  </div>

                  {displayMembers.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 mb-1">
                          {displayMembers.length} member{displayMembers.length !== 1 ? 's' : ''}
                        </div>
                        <button
                          onClick={() => {
                            setModalMembers(displayMembers);
                            setShowMembersModal(true);
                          }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View Members
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {displayMembers.slice(0, 3).map((m) => (
                          <div key={m.userId} className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-700">
                            <strong className="mr-1">{m.name || `User ${m.userId}`}</strong>
                            <span className="uppercase">
                              {(m.accessType && m.accessType !== '') ? m.accessType : 'VIEW'}
                            </span>
                            {m.role && (
                              <span className="ml-1 text-gray-400">({m.role})</span>
                            )}
                          </div>
                        ))}
                        {displayMembers.length > 3 && (
                          <div className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-700">
                            +{displayMembers.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePreview(doc.documentId || doc.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  
                  {/* Show download button if user can download (VIEW, DOWNLOAD, EDIT, OWNER) */}
                  {canDownload ? (
                    <button
                      onClick={() => handleDownload(doc.documentId || doc.id, doc.fileName)}
                      disabled={downloading === (doc.documentId || doc.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
                    >
                      {downloading === (doc.documentId || doc.id) ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700"></div>
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Download
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
                      title="You don't have permission to download this document"
                    >
                      <Download className="w-4 h-4" />
                      No Download
                    </button>
                  )}
                </div>

                {canAssignAccess() && (
                  <div className="mt-3 pt-3 border-t">
                    <button
                      onClick={() => openManageAccess(doc)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      Manage Access
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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
                  {entityTypes.map(type => (
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

      {/* Manage Access Modal */}
      {showManageAccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Manage Document Access</h3>
              <button 
                onClick={() => setShowManageAccessModal(false)} 
                className="text-gray-500 hover:text-gray-700"
                disabled={assigningAccess}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Members</label>
                {membersLoading ? (
                  <div className="text-sm text-gray-500">Loading members...</div>
                ) : members.length === 0 ? (
                  <div className="text-sm text-gray-500">No members found for this project.</div>
                ) : (
                  <div className="max-h-48 overflow-auto border rounded-md p-2">
                    {members.map(m => (
                      <label key={m.id || m.publicId} className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={selectedAssignees.includes(m.id || m.publicId)}
                          onChange={() => toggleAssignee(m.id || m.publicId)}
                          disabled={assigningAccess}
                        />
                        <span className="text-sm">{m.name} <span className="text-xs text-gray-400">({m.role})</span></span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permission Level</label>
                <select 
                  value={permissionLevel} 
                  onChange={(e) => setPermissionLevel(e.target.value)} 
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={assigningAccess}
                >
                  <option value="VIEW">View</option>
                  <option value="DOWNLOAD">Download</option>
                  <option value="EDIT">Edit</option>
                  <option value="OWNER">Owner</option>
                  <option value="NONE">Revoke</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setShowManageAccessModal(false)} 
                  className="px-4 py-2 border rounded-md"
                  disabled={assigningAccess}
                >
                  Cancel
                </button>
                <button 
                  disabled={assigningAccess || membersLoading} 
                  onClick={submitAssignAccess} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                >
                  {assigningAccess ? 'Assigning...' : 'Assign Access'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members Detail Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Document Members</h3>
              <button onClick={() => setShowMembersModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-auto">
              {modalMembers.length === 0 ? (
                <div className="text-sm text-gray-500">No members available.</div>
              ) : (
                modalMembers.map(m => {
                  const accessType = (m.accessType || m.permissionLevel || '').toString().toUpperCase();
                  return (
                    <div key={m.userId} className="flex items-center justify-between p-2 border rounded-md">
                      <div>
                        <div className="text-sm font-medium">{m.name || `User ${m.userId}`}</div>
                        <div className="text-xs text-gray-500">ID: {m.userId}</div>
                        {m.role && (
                          <div className="text-xs text-gray-500">Role: {m.role}</div>
                        )}
                      </div>
                      <div className={`text-sm font-semibold uppercase px-2 py-1 rounded ${
                        accessType === 'OWNER' ? 'bg-green-100 text-green-800' :
                        accessType === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        accessType === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                        accessType === 'EDIT' ? 'bg-purple-100 text-purple-800' :
                        accessType === 'DOWNLOAD' ? 'bg-blue-50 text-blue-700' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {accessType || 'VIEW'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={() => setShowMembersModal(false)} className="px-4 py-2 bg-gray-200 rounded-md">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;