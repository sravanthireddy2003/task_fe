import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';
import { selectUser } from '../redux/slices/authSlice';
import {
  RefreshCw, AlertCircle, Calendar, Clock, User, Plus, CheckSquare, Check, Eye, Filter,
  Lock, UserCheck, Clock as ClockIcon, AlertTriangle
} from 'lucide-react';

const ManagerTasks = () => {
  const user = useSelector(selectUser);
  const resources = user?.resources || {};

  // States
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    stage: 'PENDING',
    taskDate: '',
    assignedUsers: [], // This will contain only one ID
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

  // Status options
  const statusOptions = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'];

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

  // Utility functions
  const getStatusText = (status) => {
    const statusMap = {
      'PENDING': 'Pending',
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed',
      'ON_HOLD': 'On Hold',
      'LOCKED': 'Locked - Pending Approval',
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'on_hold': 'On Hold',
      'locked': 'Locked - Pending Approval',
      'TO DO': 'To Do',
      'Request Approved': 'Request Approved',
      'REQUEST APPROVED': 'Request Approved'
    };
    return statusMap[status] || status || 'Pending';
  };

  // Check if task has approved request
  const hasApprovedRequest = (task) => {
    return (task.lock_info && task.lock_info.request_status === 'APPROVE') ||
      (task.lock_info && task.lock_info.request_status === 'APPROVED') ||
      (task.status === 'Request Approved') ||
      (task.task_status?.current_status === 'Request Approved') ||
      (task.is_locked === true && task.status === 'Request Approved');
  };

  // Get task display status
  const getTaskStatus = (task) => {
    if (task.lock_info?.request_status === 'PENDING') {
      return 'LOCKED';
    }
    if (hasApprovedRequest(task)) {
      return 'Request Approved';
    }
    if (task.is_locked === true && task.status === 'Request Approved') {
      return 'Request Approved';
    }
    return task.task_status?.current_status || task.status || task.stage || 'PENDING';
  };

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
      const taskStatus = getTaskStatus(task).toUpperCase();
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
      const status = getTaskStatus(task).toLowerCase();
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
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const resp = await fetchWithTenant(`/api/tasks?projectId=${encodeURIComponent(projectId)}`);
      
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
      toast.error('Failed to load tasks');
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
      setProjects(projectsArray);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setProjectsLoading(false);
    }
  }, []);

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
  }, [loadProjects]);

  useEffect(() => {
    loadTasks(selectedProjectId);
  }, [loadTasks, selectedProjectId]);

  useEffect(() => {
    setSelectedTask(null);
  }, [selectedProjectId]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Computed values
  const detailProject = selectedTask?.project || selectedTask?.project_details || selectedTask?.meta?.project;
  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    
    const foundProject = projects.find((project) => {
      const projectIds = [
        project.public_id,
        project.id,
        project._id,
        project.internalId,
        project.project_id
      ];
      
      return projectIds.some(id => id && id.toString() === selectedProjectId.toString());
    }) || null;
    
    return foundProject;
  }, [projects, selectedProjectId]);

  // Effects
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadTasks(selectedProjectId);
  }, [loadTasks, selectedProjectId]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Task Actions - FIXED VERSION
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
        assigned_to: assignedUserId, // Send single user ID instead of array
      };
      
      const resp = await fetchWithTenant('api/projects/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      // Handle response - FIXED: Check for error property, not success property
      if (resp && resp.error) {
        if (resp.error.includes('assigned_to') && resp.error.includes('exactly one')) {
          toast.error('Error: Task must be assigned to exactly one user');
          return;
        }
        throw new Error(resp.error || 'Unable to create task');
      }
      
      // Success - show message from response or default
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
      
      // Check if this is actually a success response that was thrown as an error
      if (err.response && err.response.message && err.response.message.includes('successfully')) {
        // This was actually a success
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
        // Real error
        toast.error(err?.message || 'Unable to create task');
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

  // Handle row click
  const handleRowClick = (task) => {
    setSelectedTask(task);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tasks</h1>
          <p className="text-gray-600">Manage and track all your tasks</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Project Selector */}
          <div className="relative">
            <select
              value={selectedProjectId || ""}
              onChange={(e) => setSelectedProjectId(e.target.value)}
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

          {/* Refresh Button */}
          <button
            onClick={() => selectedProjectId && loadTasks(selectedProjectId)}
            disabled={!selectedProjectId || loading}
            className={`p-2 rounded-lg border ${!selectedProjectId || loading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-600 hover:bg-blue-50 border-blue-200'
              }`}
            title="Refresh tasks"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Add Task Button */}
          <button
            onClick={openCreateTaskModal}
            disabled={!selectedProjectId || loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${!selectedProjectId || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            <Plus className="w-5 h-5" />
            Add Task
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center p-4 mb-6 bg-blue-50 rounded-lg">
          <RefreshCw className="w-5 h-5 mr-2 animate-spin text-blue-600" />
          <span className="text-blue-600 font-medium">Loading tasks...</span>
        </div>
      )}

      {/* STATUS SUMMARY */}
      {selectedProjectId && tasks.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="px-4 py-2 rounded-lg bg-yellow-100 text-yellow-800 font-semibold shadow-sm border border-yellow-200">
            Pending: {getStatusCounts().pending}
          </div>
          <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-semibold shadow-sm border border-blue-200">
            In Progress: {getStatusCounts().in_progress}
          </div>
          <div className="px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold shadow-sm border border-green-200">
            Completed: {getStatusCounts().completed}
          </div>
          <div className="px-4 py-2 rounded-lg bg-red-100 text-red-800 font-semibold shadow-sm border border-red-200">
            On Hold: {getStatusCounts().on_hold}
          </div>
          <div className="px-4 py-2 rounded-lg bg-purple-100 text-purple-800 font-semibold shadow-sm border border-purple-200">
            Request Approved: {getStatusCounts().request_approved}
          </div>
          <div className="px-4 py-2 rounded-lg bg-orange-100 text-orange-800 font-semibold shadow-sm border border-orange-200">
            Locked: {getStatusCounts().locked}
          </div>
        </div>
      )}

      {/* PROJECT INFO */}
      {selectedProjectId && tasks.length > 0 && selectedProject && (
        <div className="bg-white rounded-xl border p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {getProjectDisplayName(selectedProject)} - Tasks ({tasks.length})
          </h2>
          <p className="text-gray-600">
            Showing tasks for selected project
          </p>
        </div>
      )}

      {/* FILTERS */}
      {selectedProjectId && tasks.length > 0 && (
        <div className="bg-white rounded-xl border p-4 mb-6 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
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
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
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
                  onClick={() => setSelectedProjectId(projectId)}
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
          {/* NO TASKS STATE */}
          {selectedProjectId && !loading && tasks.length === 0 && (
            <div className="bg-white rounded-xl border p-12 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Found</h3>
              <p className="text-gray-600 mb-6">
                No tasks found for project "{selectedProject ? getProjectDisplayName(selectedProject) : selectedProjectId}".
                Create your first task or try refreshing.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={openCreateTaskModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ➕ Create First Task
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
          {selectedProjectId && !loading && tasks.length > 0 && (
            <div className="bg-white border rounded-xl overflow-hidden">
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
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No tasks found for the selected filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const isActive = selectedTask?.id === task.id || selectedTask?.public_id === task.public_id;
                      const taskStatus = getTaskStatus(task);

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
                              <User className="w-4 h-4 text-gray-400" />wa
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
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">
                                {formatDate(task.taskDate || task.dueDate)}
                              </span>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <ClockIcon className="w-4 h-4 text-gray-400" />
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
        </div>

        {/* TASK DETAILS & ACTIONS */}
        {selectedTask && (
          <div className="lg:w-2/5">
            <div className="bg-white border rounded-xl p-6">
              <div className="space-y-6">
                {/* Task Header */}
                <div className="flex items-start justify-between pb-4 border-b">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTask.title}</h2>
                    <p className="text-gray-600">
                      {selectedTask.client?.name || detailProject?.client?.name || 'Client'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTask(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Project Information */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs uppercase text-gray-500 font-medium mb-1">Project</div>
                    <div className="font-semibold text-gray-900">
                      {selectedProject ? getProjectDisplayName(selectedProject) : 'Loading...'}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs uppercase text-gray-500 font-medium mb-1">Assigned To</div>
                    <div className="font-semibold text-gray-900">{getAssignedUsers(selectedTask)}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs uppercase text-gray-500 font-medium mb-1">Priority</div>
                    <div className="font-semibold text-gray-900">{selectedTask.priority || 'MEDIUM'}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs uppercase text-gray-500 font-medium mb-1">Due Date</div>
                    <div className="font-semibold text-gray-900">{formatDate(selectedTask.taskDate)}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs uppercase text-gray-500 font-medium mb-1">Estimated Hours</div>
                    <div className="font-semibold text-gray-900">{selectedTask.timeAlloted ?? '—'}h</div>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${getTaskStatus(selectedTask) === 'COMPLETED' || getTaskStatus(selectedTask) === 'Completed'
                      ? 'bg-green-50'
                      : selectedTask.summary?.dueStatus === 'Overdue'
                        ? 'bg-red-50'
                        : 'bg-gray-50'
                    }`}>
                    <div className="text-xs uppercase text-gray-500 font-medium mb-1">Total Hours Worked</div>
                    <div className={`font-semibold ${getTaskStatus(selectedTask) === 'COMPLETED' || getTaskStatus(selectedTask) === 'Completed'
                        ? 'text-green-800'
                        : selectedTask.summary?.dueStatus === 'Overdue'
                          ? 'text-red-800'
                          : 'text-gray-900'
                      }`}>
                      {selectedTask.total_time_hhmmss || '0h 0m'}
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${selectedTask.summary?.dueStatus === 'Overdue'
                      ? 'bg-red-50'
                      : 'bg-green-50'
                    }`}>
                    <div className="text-xs uppercase text-gray-500 font-medium mb-1">Due Status</div>
                    <div className="flex items-center gap-2">
                      {selectedTask.summary?.dueStatus === 'Overdue' ? (
                        <>
                          <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                          <span className="font-semibold text-red-800">{selectedTask.summary.dueStatus}</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                          <span className="font-semibold text-green-800">{selectedTask.summary?.dueStatus || 'On Time'}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                {selectedTask.checklist?.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckSquare className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-700">Checklist</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedTask.checklist.map((item, index) => (
                        <div key={item.id || index} className="flex items-center gap-3 p-2 bg-white border rounded">
                          <div className="w-5 h-5 bg-emerald-100 rounded flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-emerald-600" />
                          </div>
                          <span className="text-sm">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE TASK MODAL */}
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
                    {selectedProject ? getProjectDisplayName(selectedProject) : 'Selected Project'} ✓
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
                      <RefreshCw className="w-4 h-4 animate-spin" />
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