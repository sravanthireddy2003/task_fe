import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';
import { selectUser } from '../redux/slices/authSlice';
import { fetchPendingApprovals, approveWorkflow } from '../redux/slices/workflowSlice';
import * as Icons from '../icons';
import { getStatusText, hasApprovedRequest, getManagerTaskStatus } from '../utils/taskHelpers';
import ViewToggle from '../components/ViewToggle';
import RefreshButton from '../components/RefreshButton';
import PageHeader from '../components/PageHeader';
import Card from "../components/Card";
import ApprovalCard from '../components/ApprovalCard';

const { RefreshCw, AlertCircle, Calendar, Clock, User, Plus, CheckSquare, Check, Eye, Filter, Lock, UserCheck, Clock: ClockIcon, AlertTriangle, CheckCircle } = Icons;

const ManagerTasks = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const resources = user?.resources || {};

  // States
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Approval queue states
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [showApprovalsPanel, setShowApprovalsPanel] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    stage: 'TODO',
    taskDate: '',
    assignedUsers: [],
    projectId: '',
    timeAlloted: 8,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [detailLoading, setDetailLoading] = useState(false);

  const [projectDetails, setProjectDetails] = useState(null);
  const [isProjectLocked, setIsProjectLocked] = useState(false);

  // Status options - aligned with workflow specification
  const statusOptions = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ON_HOLD'];

  // Status display mapping
  const statusDisplayMap = {
    'TODO': 'To Do',
    'IN_PROGRESS': 'In Progress',
    'REVIEW': 'In Review',
    'COMPLETED': 'Completed',
    'ON_HOLD': 'On Hold'
  };

  // Status colors aligned with workflow
  const statusColorMap = {
    'TODO': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'IN_PROGRESS': 'bg-blue-100 text-blue-800 border-blue-200',
    'REVIEW': 'bg-purple-100 text-purple-800 border-purple-200',
    'COMPLETED': 'bg-green-100 text-green-800 border-green-200',
    'ON_HOLD': 'bg-orange-100 text-orange-800 border-orange-200'
  };

  // Helper function to normalize project ID
  const normalizeProjectId = (project) => {
    if (!project) return null;
    return project.public_id || project.id || project._id || project.internalId || project.project_id;
  };

  // Helper function to get project name
  const getProjectDisplayName = (project) => {
    if (!project) return 'Unknown Project';
    return project.name || project.title || `Project ${normalizeProjectId(project)?.slice(0, 8)}...`;
  };

  // Helper to get client name
  const getClientName = (project) => {
    if (!project) return 'No Client';
    return project.client?.name || project.client_name || 'No Client';
  };

  // Helper to get project status
  const getProjectStatus = (project) => {
    if (!project) return 'Unknown';
    const status = project.status || project.project_status;
    const statusMap = {
      'ACTIVE': 'Active',
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed',
      'ON_HOLD': 'On Hold',
      'PENDING': 'Pending',
      'active': 'Active',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'on_hold': 'On Hold',
      'pending': 'Pending'
    };
    return statusMap[status] || status || 'Unknown';
  };

  // Validation helper function
  const validateAssignment = (userIds) => {
    if (!userIds || userIds.length === 0) {
      return { valid: false, error: 'Task must be assigned to one employee' };
    }
    if (userIds.length > 1) {
      return { valid: false, error: 'Only one employee can be assigned to a task' };
    }
    return { valid: true, error: null };
  };

  // Utility: status text / derived status come from shared helpers

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAssignedUsers = (task) => {
    if (Array.isArray(task.assignedUsers) && task.assignedUsers.length) {
      return task.assignedUsers.map(u => u.name).join(', ');
    }
    if (Array.isArray(task.assigned_to) && task.assigned_to.length) {
      return task.assigned_to.join(', ');
    }
    return 'Unassigned';
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (filterStatus === 'all') return tasks;
    return tasks.filter(task => {
      const taskStatus = getManagerTaskStatus(task).toUpperCase();
      const filterStatusUpper = filterStatus.toUpperCase();
      return taskStatus === filterStatusUpper;
    });
  }, [tasks, filterStatus]);

  // Get status counts
  const getStatusCounts = () => {
    const counts = {
      'pending': 0,
      'in_progress': 0,
      'completed': 0,
      'on_hold': 0,
      'request_approved': 0,
      'locked': 0
    };

    tasks.forEach(task => {
      const status = getManagerTaskStatus(task).toLowerCase();
      if (status === 'request approved') {
        counts['request_approved']++;
      } else if (status === 'locked') {
        counts['locked']++;
      } else if (counts.hasOwnProperty(status)) {
        counts[status]++;
      }
    });

    return counts;
  };

  // API Functions
  const loadTasks = useCallback(async (projectId = '') => {
    if (!projectId) {
      setTasks([]);
      setError(null);
      setIsProjectLocked(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsProjectLocked(false);

    try {
      const resp = await fetchWithTenant(`/api/tasks?projectId=${encodeURIComponent(projectId)}`);

      // Handle "Project is closed" response which comes as success: false
      if (resp && resp.success === false && resp.message) {
        if (resp.message.includes("Project is closed") || resp.message.includes("Tasks are locked")) {
          setIsProjectLocked(true);
          setError(resp.message);
          setTasks([]);
          setSelectedTask(null);
          return;
        }
      }

      if (resp && resp.error) {
        if (resp.error.includes('assigned_to')) {
          console.warn('Backend assignment error:', resp.error);
        }
        throw new Error(resp.error || 'Failed to load tasks');
      }

      const tasksData = Array.isArray(resp?.data) ? resp.data : [];

      // Find the selected project in the projects array
      const selectedProject = projects.find(p => {
        const possibleIds = [
          p.public_id,
          p.id,
          p._id,
          p.internalId,
          p.project_id
        ];
        return possibleIds.includes(projectId);
      });

      // Since backend doesn't return project info with tasks, 
      // we need to add it manually
      const tasksWithProjectInfo = tasksData.map(task => {
        // If task doesn't have project info, add it
        if (!task.project_id && !task.projectId && !task.project) {
          return {
            ...task,
            project_id: projectId,
            projectId: projectId,
            project: selectedProject || {
              name: getProjectDisplayName(selectedProject),
              id: projectId
            }
          };
        }
        return task;
      });

      setTasks(tasksWithProjectInfo);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load tasks for the project');
      toast.error(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [projects]);

  const loadEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    try {
      const resp = await fetchWithTenant('/api/manager/employees/all');
      const data = Array.isArray(resp?.data) ? resp.data : resp;
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      // Silently fail
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const resp = await fetchWithTenant('/api/manager/projects');
      const data = Array.isArray(resp?.data) ? resp.data : resp;
      const projectsArray = Array.isArray(data) ? data : [];

      // Filter projects to exclude those with CLOSED status
      const filteredProjects = projectsArray.filter(project =>
        !project.project_status_info?.is_closed
      );

      setProjects(filteredProjects);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  // Load pending approval requests (workflow specification)
  const loadPendingApprovals = useCallback(async () => {
    setApprovalsLoading(true);
    try {
      const result = await dispatch(fetchPendingApprovals('MANAGER')).unwrap();
      const approvals = result?.approvals || result?.data || [];
      setPendingApprovals(Array.isArray(approvals) ? approvals : []);
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
      setPendingApprovals([]);
    } finally {
      setApprovalsLoading(false);
    }
  }, [dispatch]);

  // Handle approval of task completion request
  const handleApproveRequest = async (requestId) => {
    try {
      const result = await dispatch(approveWorkflow({
        requestId,
        action: 'APPROVE'
      })).unwrap();

      if (result?.success) {
        toast.success('Task approved successfully');
        await loadPendingApprovals(); // Refresh approval queue
        if (selectedProjectId) {
          await loadTasks(selectedProjectId); // Refresh tasks
        }
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to approve request');
    }
  };

  // Handle rejection of task completion request
  const handleRejectRequest = async (requestId, reason) => {
    try {
      const result = await dispatch(approveWorkflow({
        requestId,
        action: 'REJECT',
        reason: reason || 'Task does not meet quality standards'
      })).unwrap();

      if (result?.success) {
        toast.success('Task rejected - returned to employee');
        await loadPendingApprovals(); // Refresh approval queue
        if (selectedProjectId) {
          await loadTasks(selectedProjectId); // Refresh tasks
        }
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to reject request');
    }
  };

  // Get project details when project is selected
  const getProjectDetails = useCallback((projectId) => {
    if (!projectId || projects.length === 0) {
      setProjectDetails(null);
      return;
    }

    const foundProject = projects.find((project) => {
      const projectIds = [
        project.public_id,
        project.id,
        project._id,
        project.internalId,
        project.project_id
      ];

      return projectIds.some(id => id && id.toString() === projectId.toString());
    }) || null;

    setProjectDetails(foundProject);
  }, [projects]);

  // Effects
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      const firstProject = projects[0];
      const firstId = normalizeProjectId(firstProject);
      if (firstId) {
        setSelectedProjectId(firstId);
      }
    }
  }, [projects]);

  useEffect(() => {
    loadProjects();
    loadPendingApprovals(); // Load approval queue on mount
  }, [loadProjects]);

  useEffect(() => {
    if (selectedProjectId) {
      loadTasks(selectedProjectId);
      getProjectDetails(selectedProjectId);
    }
  }, [loadTasks, selectedProjectId, getProjectDetails]);

  useEffect(() => {
    setSelectedTask(null);
  }, [selectedProjectId]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Handle project selection change
  const handleProjectChange = (projectId) => {
    setSelectedProjectId(projectId);
    setSelectedTask(null);
    setTasks([]);
    if (projectId) {
      getProjectDetails(projectId);
    } else {
      setProjectDetails(null);
    }
  };

  // Task Actions
  const handleCreateTask = async (event) => {
    event.preventDefault();

    // Validate required fields
    if (!formData.title || !selectedProjectId) {
      toast.error('Title and project are required');
      return;
    }

    // Validate single user assignment
    const assignmentValidation = validateAssignment(formData.assignedUsers);
    if (!assignmentValidation.valid) {
      toast.error(assignmentValidation.error);
      return;
    }

    setActionLoading(true);
    try {
      const selectedProject = projects.find(
        (project) => {
          const projectIds = [
            project.public_id,
            project.id,
            project._id,
            project.internalId,
            project.project_id
          ];
          return projectIds.includes(selectedProjectId);
        }
      );

      // Ensure only one user ID is sent
      const assignedUserId = formData.assignedUsers[0];

      const payload = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        stage: formData.stage,
        taskDate: formData.taskDate ? new Date(formData.taskDate).toISOString() : undefined,
        timeAlloted: Number(formData.timeAlloted) || 0,
        projectId: selectedProjectId,
        client_id: selectedProject?.client?.public_id || selectedProject?.client?.id || selectedProject?.client_id,
        assigned_to: assignedUserId,
      };

      const resp = await fetchWithTenant('api/projects/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (resp && resp.error) {
        if (resp.error.includes('assigned_to') && resp.error.includes('exactly one')) {
          toast.error('Error: Task must be assigned to exactly one user');
          return;
        }
        throw new Error(resp.error || 'Unable to create task');
      }

      const successMessage = resp?.message || 'Task created successfully';
      toast.success(successMessage);

      // Reset form
      setFormData({
        title: '',
        description: '',
        assignedUsers: [],
        priority: 'MEDIUM',
        stage: 'PENDING',
        taskDate: '',
        timeAlloted: 8,
        projectId: selectedProjectId
      });

      // Close modal and refresh tasks
      setShowCreateTaskModal(false);
      loadTasks(selectedProjectId);
    } catch (err) {
      console.error('Error creating task:', err);

      if (err.response && err.response.message && err.response.message.includes('successfully')) {
        toast.success(err.response.message || 'Task created successfully');
        setFormData({
          title: '',
          description: '',
          assignedUsers: [],
          priority: 'MEDIUM',
          stage: 'PENDING',
          taskDate: '',
          timeAlloted: 8,
          projectId: selectedProjectId
        });
        setShowCreateTaskModal(false);
        loadTasks(selectedProjectId);
      } else {
        const errorMessage = err?.response?.data?.message || err?.message || err?.data?.message || 'Unable to create task';
        toast.error(errorMessage);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // UI Modals & Actions
  const openCreateTaskModal = () => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }
    setShowCreateTaskModal(true);
  };

  // Handle row click - fetch selected task details from API
  const handleRowClick = async (task) => {
    if (!task) return;
    const id = task.id || task.public_id || task._id || task.internalId;
    if (!id) {
      setSelectedTask(task);
      return;
    }

    setDetailLoading(true);
    try {
      const resp = await fetchWithTenant('/api/tasks/selected-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskIds: [id] }),
      });

      if (resp && resp.error) {
        throw new Error(resp.error || 'Failed to fetch task details');
      }

      const payload = resp?.data ?? resp;
      const details = Array.isArray(payload) ? payload[0] : payload;
      setSelectedTask(details || task);
    } catch (err) {
      console.error('Failed to load task details:', err);
      toast.error(err?.message || 'Failed to load task details');
      // fallback: set the minimal task so UI still shows something
      setSelectedTask(task);
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle task reassignment
  const handleReassignTask = async () => {
    if (!selectedTask || !selectedAssignee) return;

    const taskId = selectedTask.id || selectedTask.public_id || selectedTask._id;
    if (!taskId) {
      toast.error('Task ID not found');
      return;
    }

    setReassigning(true);
    try {
      const resp = await fetchWithTenant(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assigned_to: selectedAssignee,
        }),
      });

      if (resp && resp.error) {
        throw new Error(resp.error || 'Failed to reassign task');
      }

      toast.success('Task reassigned successfully');

      // Update the task in local state
      setTasks(prevTasks => prevTasks.map(task =>
        (task.id || task.public_id || task._id) === taskId
          ? { ...task, assigned_to: [selectedAssignee] }
          : task
      ));

      // Update selected task if it's the one being reassigned
      if (selectedTask && (selectedTask.id || selectedTask.public_id || selectedTask._id) === taskId) {
        setSelectedTask(prev => prev ? { ...prev, assigned_to: [selectedAssignee] } : null);
      }

      // Clear the selected assignee
      setSelectedAssignee('');

      // Refresh tasks to get updated data
      if (selectedProjectId) {
        loadTasks(selectedProjectId);
      }
    } catch (err) {
      console.error('Failed to reassign task:', err);
      const errorMessage = err?.response?.data?.message || err?.message || err?.data?.message || 'Failed to reassign task';
      toast.error(errorMessage);
    } finally {
      setReassigning(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <PageHeader
        title="Tasks"
        subtitle="Manage and track all your tasks"
        onRefresh={() => selectedProjectId && loadTasks(selectedProjectId)}
        refreshing={loading}
      >
        <div className="flex items-center gap-3">
          {/* Project Selector */}
          <div className="relative">
            <select
              value={selectedProjectId || ""}
              onChange={(e) => handleProjectChange(e.target.value)}
              disabled={projectsLoading}
              className="border border-gray-300 rounded-lg px-4 py-2 pr-8 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none min-w-[200px]"
            >
              <option value="">Select a project</option>
              {projects.map((project) => {
                const projectId = normalizeProjectId(project);
                const projectName = getProjectDisplayName(project);

                return (
                  <option key={projectId} value={projectId}>
                    {projectName}
                  </option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>

          {/* View Toggle */}
          <ViewToggle
            mode={viewMode}
            onChange={setViewMode}
            className="ml-1"
          />

          {/* Add Task Button - show in header only when project selected, not loading, and project has tasks */}
          {selectedProjectId && !loading && Array.isArray(tasks) && tasks.length > 0 && (
            <button
              onClick={openCreateTaskModal}
              disabled={!selectedProjectId || loading || isProjectLocked}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${!selectedProjectId || loading || isProjectLocked
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              {isProjectLocked ? <Lock className="tm-icon" /> : <Plus className="tm-icon" />}
              {isProjectLocked ? 'Locked' : 'Add Task'}
            </button>
          )}
        </div>
      </PageHeader>

      {/* Loading Indicator for tasks */}
      {loading && selectedProjectId && (
        <div className="flex items-center justify-center p-4 mb-6 bg-blue-50 rounded-lg">
          <RefreshCw className="tm-icon mr-2 animate-spin text-blue-600" />
          <span className="text-blue-600 font-medium">Loading tasks...</span>
        </div>
      )}

      {/* ERROR / LOCKED PROJECT BANNER */}
      {(error || isProjectLocked) && !loading && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-800 animate-fadeIn">
          <AlertTriangle className="tm-icon-md flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg">{isProjectLocked ? 'Project Locked' : 'Error'}</h3>
            <p className="text-red-700 mt-1">{error}</p>
            {isProjectLocked && (
              <p className="text-red-600 text-sm mt-2">
                This project is currently closed or pending approval. Creating or modifying tasks is disabled.
              </p>
            )}
          </div>
        </div>
      )}

      {/* PROJECT DETAILS CARD - Always shown when project is selected */}
      {selectedProjectId && projectDetails && (
        <div className="bg-white rounded-xl border p-6 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="text-blue-600 font-bold text-lg">
                    {getProjectDisplayName(projectDetails).charAt(0)}
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {getProjectDisplayName(projectDetails)}
                  </h2>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <User className="tm-icon text-gray-500" />
                      <span className="text-gray-700">
                        Client: <span className="font-medium">{getClientName(projectDetails)}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getProjectStatus(projectDetails) === 'Active' || getProjectStatus(projectDetails) === 'In Progress'
                        ? 'bg-green-500'
                        : getProjectStatus(projectDetails) === 'Completed'
                          ? 'bg-blue-500'
                          : 'bg-yellow-500'
                        }`} />
                      <span className="text-gray-700">
                        Status: <span className="font-medium">{getProjectStatus(projectDetails)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {projectDetails.description && (
                <p className="text-gray-600 mb-4">
                  {projectDetails.description}
                </p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Total Tasks</div>
                  <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Pending</div>
                  <div className="text-2xl font-bold text-yellow-700">{getStatusCounts().pending}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">In Progress</div>
                  <div className="text-2xl font-bold text-blue-700">{getStatusCounts().in_progress}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Completed</div>
                  <div className="text-2xl font-bold text-green-700">{getStatusCounts().completed}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:w-auto w-full">
              {/* Primary actions (Add / Refresh) are shown in the header to avoid duplication.
                  The project card intentionally hides create/refresh controls. */}
            </div>
          </div>
        </div>
      )}

      {/* FILTERS - Only show when there are tasks */}
      {selectedProjectId && tasks.length > 0 && (
        <div className="bg-white rounded-xl border p-4 mb-6 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="tm-icon text-gray-600" />
            <span className="text-gray-700 font-medium">Filters:</span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="all">All Status</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {getStatusText(s)}
              </option>
            ))}
            <option value="Request Approved">Request Approved</option>
            <option value="LOCKED">Locked</option>
          </select>
        </div>
      )}

      {/* NO PROJECT SELECTED STATE */}
      {!selectedProjectId && !projectsLoading && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <AlertCircle className="tm-icon-hero mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Project</h3>
          <p className="text-gray-600 mb-6">
            Please select a project from the dropdown above to view and manage tasks.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {projects.slice(0, 5).map((project) => {
              const projectId = normalizeProjectId(project);
              const projectName = getProjectDisplayName(project);

              return (
                <button
                  key={projectId}
                  onClick={() => handleProjectChange(projectId)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  {projectName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* TASKS LIST */}
        <div className={`${selectedTask ? 'lg:w-3/5' : 'flex-1'}`}>
          {/* NO TASKS STATE - Only show when project is selected but no tasks */}
          {selectedProjectId && !loading && tasks.length === 0 && (
            <div className="bg-white rounded-xl border p-12 text-center">
              <AlertCircle className="tm-icon-hero mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Found</h3>
              <p className="text-gray-600 mb-6">
                No tasks found for this project. Create your first task or try refreshing.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={openCreateTaskModal}
                  disabled={isProjectLocked}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isProjectLocked
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {isProjectLocked ? <Lock className="tm-icon" /> : null}
                  {isProjectLocked ? 'Project Locked' : 'Create First Task'}
                </button>
                <button
                  onClick={() => loadTasks(selectedProjectId)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}

          {/* TASKS TABLE */}
          {selectedProjectId && !loading && tasks.length > 0 && viewMode === 'list' && (
            <div className="tm-list-container">
              <table className="w-full table-auto">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="p-4 text-left">Task</th>
                    <th className="p-4 text-left">Assigned To</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Priority</th>
                    <th className="p-4 text-left">Due Date</th>
                    <th className="p-4 text-left">Estimated Hours</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500">
                        <AlertCircle className="tm-icon-xl mx-auto mb-3 opacity-50" />
                        <p>No tasks found for the selected filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const isActive = selectedTask?.id === task.id || selectedTask?.public_id === task.public_id;
                      const taskStatus = getManagerTaskStatus(task);

                      return (
                        <tr
                          key={task.id || task.public_id || task._id || task.internalId}
                          onClick={() => handleRowClick(task)}
                          className={`border-b transition-colors cursor-pointer ${isActive ? 'bg-gray-50' : 'hover:bg-gray-50'
                            }`}
                        >
                          <td className="p-4">
                            <div className="font-medium text-gray-900">{task.title || task.name}</div>
                            {task.description && (
                              <div className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</div>
                            )}
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <User className="tm-icon text-gray-400" />
                              <span className="text-sm text-gray-700">
                                {getAssignedUsers(selectedTask || task)}
                              </span>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${taskStatus === 'LOCKED'
                              ? 'bg-red-100 text-red-800'
                              : taskStatus === 'COMPLETED' || taskStatus === 'Completed'
                                ? 'bg-green-100 text-green-800'
                                : taskStatus === 'IN_PROGRESS' || taskStatus === 'In Progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : taskStatus === 'ON_HOLD' || taskStatus === 'On Hold'
                                    ? 'bg-red-100 text-red-800'
                                    : taskStatus === 'Request Approved'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {getStatusText(taskStatus)}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${(task.priority || 'MEDIUM').toUpperCase() === 'HIGH'
                              ? 'bg-red-100 text-red-800'
                              : (task.priority || 'MEDIUM').toUpperCase() === 'MEDIUM'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-800'
                              }`}>
                              {(task.priority || 'MEDIUM').toUpperCase()}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="tm-icon text-gray-400" />
                              <span className="text-sm text-gray-700">
                                {formatDate(task.taskDate || task.dueDate)}
                              </span>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <ClockIcon className="tm-icon text-gray-400" />
                              <span className="text-sm text-gray-700">
                                {task.estimatedHours || task.timeAlloted || 0}h
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* GRID VIEW */}
          {selectedProjectId && !loading && tasks.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.length === 0 ? (
                <Card className="col-span-full text-center">
                  <AlertCircle className="tm-icon-xl mx-auto mb-3 opacity-50" />
                  <p className="text-gray-500">No tasks found for the selected filters</p>
                </Card>
              ) : (
                filteredTasks.map((task) => {
                  const taskStatus = getManagerTaskStatus(task);

                  return (
                    <Card
                      key={task.id || task.public_id || task._id || task.internalId}
                      onClick={() => handleRowClick(task)}
                      role="button"
                      className="cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {task.title || task.name}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 line-clamp-3">{task.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${taskStatus === 'LOCKED'
                            ? 'bg-red-100 text-red-800'
                            : taskStatus === 'COMPLETED' || taskStatus === 'Completed'
                              ? 'bg-green-100 text-green-800'
                              : taskStatus === 'IN_PROGRESS' || taskStatus === 'In Progress'
                                ? 'bg-blue-100 text-blue-800'
                                : taskStatus === 'ON_HOLD' || taskStatus === 'On Hold'
                                  ? 'bg-red-100 text-red-800'
                                  : taskStatus === 'Request Approved'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-yellow-100 text-yellow-800'
                            }`}
                        >
                          {getStatusText(taskStatus)}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${(task.priority || 'MEDIUM').toUpperCase() === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : (task.priority || 'MEDIUM').toUpperCase() === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {(task.priority || 'MEDIUM').toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-700 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="tm-icon text-gray-400" />
                          <span>{getAssignedUsers(task)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="tm-icon text-gray-400" />
                          <span>{formatDate(task.taskDate || task.dueDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="tm-icon text-gray-400" />
                          <span>{task.estimatedHours || task.timeAlloted || 0} hours estimated</span>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* TASK DETAILS PANEL - Right Column */}
        {selectedTask && (
          <div className="lg:w-2/5">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sticky top-6">
              <div className="space-y-4">
                {/* Task header */}
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">{selectedTask.title}</h2>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getManagerTaskStatus(selectedTask) === 'LOCKED'
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : getManagerTaskStatus(selectedTask) === 'COMPLETED' || getManagerTaskStatus(selectedTask) === 'Completed'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : getManagerTaskStatus(selectedTask) === 'IN_PROGRESS' || getManagerTaskStatus(selectedTask) === 'In Progress'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : getManagerTaskStatus(selectedTask) === 'ON_HOLD' || getManagerTaskStatus(selectedTask) === 'On Hold'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : getManagerTaskStatus(selectedTask) === 'Request Approved'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }`}>
                    {getStatusText(getManagerTaskStatus(selectedTask))}
                  </span>
                </div>

                <p className="text-sm text-gray-500">
                  {selectedTask.project?.name && `Project: ${selectedTask.project.name}`}
                </p>

                {/* Task completion alert */}
                {(getManagerTaskStatus(selectedTask) === 'COMPLETED' || getManagerTaskStatus(selectedTask) === 'Completed') && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    <p className="font-semibold">✓ Task Completed</p>
                    <p className="text-xs mt-1">
                      Total working hours: <span className="font-bold">{selectedTask.total_time_hhmmss || '0h 0m'}</span>
                    </p>
                    <p className="text-xs mt-1">This task is locked and cannot be modified further.</p>
                  </div>
                )}

                {/* Locked task alert */}
                {getManagerTaskStatus(selectedTask) === 'LOCKED' && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <p className="font-semibold">🔒 Task Locked - Pending Approval</p>
                    <p className="text-xs">Task is locked pending manager approval for reassignment request.</p>
                  </div>
                )}

                {/* Request approved alert */}
                {getManagerTaskStatus(selectedTask) === 'Request Approved' && (
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-700">
                    <p className="font-semibold">✅ Reassignment Approved</p>
                    <p className="text-xs">Employee reassignment request has been approved.</p>
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  Due {formatDate(selectedTask.taskDate || selectedTask.dueDate)}
                </p>

                {/* Refresh task button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRowClick(selectedTask)}
                    disabled={detailLoading}
                    className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${detailLoading ? 'animate-spin' : ''}`} />
                    Refresh Task
                  </button>
                </div>

                {/* Description */}
                {selectedTask.description && (
                  <div>
                    <p className="text-xs uppercase text-gray-500">Description</p>
                    <p className="mt-1 text-sm text-gray-700">{selectedTask.description}</p>
                  </div>
                )}

                {/* Assigned Users */}
                {selectedTask.assignedUsers && selectedTask.assignedUsers.length > 0 && (
                  <div>
                    <p className="text-xs uppercase text-gray-500">Assigned To</p>
                    <div className="mt-2 space-y-2">
                      {selectedTask.assignedUsers.map((user, index) => (
                        <div key={user.id || user.public_id || index} className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{user.name || user.email || 'Unknown User'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reassign Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Reassign Task</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <select
                      value={selectedAssignee}
                      onChange={(e) => setSelectedAssignee(e.target.value)}
                      disabled={employees.length === 0 || getManagerTaskStatus(selectedTask) === 'COMPLETED' || getManagerTaskStatus(selectedTask) === 'LOCKED'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    >
                      <option value="">Select employee</option>
                      {employees.map((employee) => {
                        const key = employee.internalId || employee.id || employee.public_id || employee._id;
                        return (
                          <option key={key} value={key}>
                            {employee.name || employee.email || 'Unnamed'}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      onClick={handleReassignTask}
                      disabled={reassigning || !selectedAssignee || employees.length === 0 || getManagerTaskStatus(selectedTask) === 'COMPLETED' || getManagerTaskStatus(selectedTask) === 'LOCKED'}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm ${reassigning || !selectedAssignee || employees.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                      {reassigning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Reassigning...
                        </>
                      ) : (
                        'Reassign Task'
                      )}
                    </button>
                  </div>
                </div>

                {/* Checklist Section */}
                {selectedTask.checklist && selectedTask.checklist.length > 0 && (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs uppercase text-gray-500">Checklist</p>
                      <span className="text-xs text-gray-500">
                        {selectedTask.checklist.filter(item => item.status === 'Completed').length} / {selectedTask.checklist.length} completed
                      </span>
                    </div>
                    <ul className="space-y-3">
                      {selectedTask.checklist.map((item, index) => {
                        const itemId = item.id || item.public_id || `${index}`;
                        const isCompleted = item.status === 'Completed';

                        return (
                          <li key={itemId} className="rounded-2xl border border-gray-200 bg-white p-3">
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                {isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" />
                                )}
                                <div>
                                  <p className={`font-medium ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                    {item.title || 'Untitled item'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Due {formatDate(item.dueDate)}
                                  </p>
                                  {item.completedAt && (
                                    <p className="text-[10px] text-emerald-600">
                                      Completed {formatDate(item.completedAt)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Activities/Timeline */}
                {selectedTask.activities && selectedTask.activities.length > 0 && (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm">
                    <p className="text-xs uppercase text-gray-500 mb-3">Recent Activity</p>
                    <div className="space-y-3">
                      {selectedTask.activities.slice(0, 5).map((activity, index) => (
                        <div key={activity.id || index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">{activity.description || activity.action}</p>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(activity.createdAt || activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Time Tracking Summary */}
                {selectedTask.time_tracking && (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm">
                    <p className="text-xs uppercase text-gray-500 mb-3">Time Tracking</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Estimated</p>
                        <p className="text-sm font-medium">{selectedTask.estimatedHours || selectedTask.timeAlloted || 0}h</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Worked</p>
                        <p className="text-sm font-medium">{selectedTask.total_time_hhmmss || '0h 0m'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-semibold">
                  ➕
                </div>
                Create New Task
              </h2>
              <button
                onClick={() => setShowCreateTaskModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Task description (optional)"
                />
              </div>

              {/* Project and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Project
                  </label>
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-medium">
                    {projectDetails ? getProjectDisplayName(projectDetails) : 'Selected Project'} ✓
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Project selected from dropdown</p>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              {/* Status and Estimated Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Status
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {getStatusText(s)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.timeAlloted}
                    onChange={(e) => setFormData({ ...formData, timeAlloted: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 8"
                  />
                </div>
              </div>

              {/* Due Date and Assignees */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.taskDate}
                    onChange={(e) => setFormData({ ...formData, taskDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Assign To <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.assignedUsers[0] || ''}
                    onChange={(e) => {
                      const selectedUserId = e.target.value;
                      setFormData({
                        ...formData,
                        assignedUsers: selectedUserId ? [selectedUserId] : []
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select an employee</option>
                    {employees.map((employee) => {
                      const key = employee.internalId || employee.id || employee.public_id || employee._id;
                      return (
                        <option key={key} value={key}>
                          {employee.name || employee.email || 'Unnamed'}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Only one employee can be assigned</p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(false)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="tm-icon animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Task'
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

export default ManagerTasks;