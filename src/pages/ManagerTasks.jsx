import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
  const [showReassignForm, setShowReassignForm] = useState(false);
  
  const reassignFormRef = useRef(null);

  // Status options
  const statusOptions = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'];

  // Utility functions
  const getStatusText = (status) => {
    const statusMap = {
      'PENDING': 'Pending',
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed',
      'ON_HOLD': 'On Hold',
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'on_hold': 'On Hold',
      'TO DO': 'To Do',
      'Request Approved': 'Request Approved'
    };
    return statusMap[status] || status || 'Pending';
  };

  // Check if task has pending reassignment request
  const hasReassignmentRequest = (task) => {
    // Check if task has lock_info with request_status
    return task.lock_info && 
           task.lock_info.request_status && 
           task.lock_info.request_status === 'APPROVE' &&
           !task.is_locked;
  };

  // Get task display status
  const getTaskStatus = (task) => {
    // Use task_status.current_status if available, otherwise fallback
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

  const getAssignedUsers = (task) => {
    if (Array.isArray(task.assignedUsers) && task.assignedUsers.length) {
      return task.assignedUsers.map(u => u.name).join(', ');
    }
    if (Array.isArray(task.assigned_to) && task.assigned_to.length) {
      return task.assigned_to.join(', ');
    }
    return 'Unassigned';
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p =>
      p.id === projectId ||
      p._id === projectId ||
      p.public_id === projectId ||
      p.internalId === projectId
    );
    return project?.name || project?.title || 'Unknown Project';
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
      'request_approved': 0
    };
    
    tasks.forEach(task => {
      const status = getTaskStatus(task).toLowerCase();
      if (status === 'request approved') {
        counts['request_approved']++;
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
      const resp = await fetchWithTenant(`/api/manager/tasks?projectId=${encodeURIComponent(projectId)}`);
      const data = Array.isArray(resp?.data) ? resp.data : resp;
      setTasks(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load tasks for the project');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    try {
      const resp = await fetchWithTenant('/api/manager/employees/all');
      const data = Array.isArray(resp?.data) ? resp.data : resp;
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      // ignore silently
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const resp = await fetchWithTenant('/api/manager/projects');
      const data = Array.isArray(resp?.data) ? resp.data : resp;
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      // silently ignore
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  // Effects
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      const firstProject = projects[0];
      const firstId = firstProject?.public_id || firstProject?.id || firstProject?._id || firstProject?.internalId;
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
    setShowReassignForm(false);
  }, [selectedProjectId]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Effect to reset reassign form when task changes
  useEffect(() => {
    if (selectedTask) {
      setShowReassignForm(false);
      setSelectedAssignee('');
    }
  }, [selectedTask]);

  // Effect to focus on reassign form when it becomes visible
  useEffect(() => {
    if (showReassignForm && reassignFormRef.current) {
      setTimeout(() => {
        const select = reassignFormRef.current?.querySelector('select');
        if (select) {
          select.focus();
        }
      }, 150);
    }
  }, [showReassignForm]);

  // Computed values
  const detailProject = selectedTask?.project || selectedTask?.meta?.project;
  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find((project) => {
      const projectId = project.public_id || project.id || project._id || project.internalId;
      return projectId === selectedProjectId;
    }) || null;
  }, [projects, selectedProjectId]);

  // Task Actions
  const handleCreateTask = async (event) => {
    event.preventDefault();
    if (!formData.title || !selectedProjectId) {
      toast.error('Title and project are required');
      return;
    }
    setActionLoading(true);
    try {
      const selectedProject = projects.find(
        (project) =>
          project.public_id === selectedProjectId ||
          project.id === selectedProjectId ||
          project._id === selectedProjectId
      );
      const payload = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        stage: formData.stage,
        taskDate: formData.taskDate ? new Date(formData.taskDate).toISOString() : undefined,
        timeAlloted: Number(formData.timeAlloted) || 0,
        projectId: selectedProjectId,
        client_id: selectedProject?.client?.public_id || selectedProject?.client?.id || selectedProject?.client_id,
        assigned_to: formData.assignedUsers,
      };
      const resp = await fetchWithTenant('api/projects/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast.success(resp?.message || 'Task created successfully');
      
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
    } catch (err) {
      toast.error(err?.message || 'Unable to create task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassignTask = async () => {
    if (!selectedTask || !selectedAssignee) {
      toast.error('Select an employee to reassign the task.');
      return;
    }
    setReassigning(true);
    try {
      const projectId = selectedTask.project_id || selectedTask.projectId || detailProject?.id || detailProject?.public_id || detailProject?._id;
      const taskId = selectedTask.id || selectedTask.public_id || selectedTask._id || selectedTask.internalId;
      const payload = {
        assigned_to: [selectedAssignee],
        projectId,
      };
      const resp = await fetchWithTenant(`/api/projects/tasks/${encodeURIComponent(taskId)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      toast.success(resp?.message || 'Task reassigned successfully');
      
      const targetEmployee = employees.find((emp) =>
        String(emp.internalId || emp.id || emp._id || emp.public_id) === String(selectedAssignee)
      );
      setSelectedTask((prev) => ({
        ...prev,
        assignedUsers: targetEmployee ? [{
          id: targetEmployee.public_id || targetEmployee.id || targetEmployee._id,
          name: targetEmployee.name || targetEmployee.title || 'Employee',
          internalId: targetEmployee.internalId || targetEmployee.id || targetEmployee._id,
        }] : prev.assignedUsers,
        assigned_to: targetEmployee ? [targetEmployee.internalId || targetEmployee.public_id || targetEmployee.id || targetEmployee._id] : prev.assigned_to,
        is_locked: false,
      }));
      
      setShowReassignForm(false);
      setSelectedAssignee('');
      loadTasks(selectedProjectId);
    } catch (err) {
      toast.error(err?.message || 'Unable to reassign task');
    } finally {
      setReassigning(false);
    }
  };

  // Lock Handlers - Updated for new API structure
  const handleApproveRequest = async (requestId) => {
    if (!requestId || actionLoading) return;
    
    setActionLoading(true);
    try {
      const taskId = selectedTask.id || selectedTask.public_id;
      const resp = await fetchWithTenant(`/api/tasks/${taskId}/reassign-requests/${requestId}/approve`, {
        method: 'POST',
      });
      
      toast.success(resp?.message || '✅ Task unlocked for reassignment!');
      
      // Update selected task to remove lock info
      setSelectedTask(prev => ({
        ...prev,
        lock_info: null,
        task_status: {
          ...prev.task_status,
          current_status: 'Request Approved',
          is_locked: false
        }
      }));
      
      // Show reassign form
      setShowReassignForm(true);
      
      loadTasks(selectedProjectId);
    } catch (err) {
      toast.error(err?.message || 'Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!requestId || actionLoading) return;
    
    setActionLoading(true);
    try {
      const taskId = selectedTask.id || selectedTask.public_id;
      const resp = await fetchWithTenant(`/api/tasks/${taskId}/reassign-requests/${requestId}/reject`, {
        method: 'POST',
      });
      
      toast.success(resp?.message || '✅ Request rejected. Task unlocked.');
      
      // Update selected task to remove lock info
      setSelectedTask(prev => ({
        ...prev,
        lock_info: null,
        task_status: {
          ...prev.task_status,
          current_status: getTaskStatus(prev),
          is_locked: false
        }
      }));
      
      // Show reassign form
      setShowReassignForm(true);
      
      loadTasks(selectedProjectId);
    } catch (err) {
      toast.error(err?.message || 'Failed to reject request');
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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* DEBUG INFO - Remove in production */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
        <div>Selected Project: {selectedProjectId}</div>
        <div>Tasks Count: {tasks.length}</div>
        <div>Projects Count: {projects.length}</div>
        <div>Status: {loading ? 'loading' : error ? 'error' : 'succeeded'}</div>
        <div>Tasks with Lock Info: {tasks.filter(t => t.lock_info && t.lock_info.request_status).length}</div>
      </div>

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
                const projectId = project.public_id || project.id || project._id || project.internalId;
                return (
                  <option key={projectId} value={projectId}>
                    {project.name}
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
            className={`p-2 rounded-lg border ${
              !selectedProjectId || loading
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              !selectedProjectId || loading
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

      {/* STATUS SUMMARY - Updated to include Request Approved */}
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
        </div>
      )}

      {/* PROJECT INFO */}
      {selectedProjectId && tasks.length > 0 && selectedProject && (
        <div className="bg-white rounded-xl border p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {selectedProject.name} - Tasks ({tasks.length})
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
              const projectId = project.public_id || project.id || project._id;
              return (
                <button
                  key={projectId}
                  onClick={() => setSelectedProjectId(projectId)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  {project.name}
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
                No tasks found for project "{getProjectName(selectedProjectId)}".
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
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No tasks found for the selected filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const isActive = selectedTask?.id === task.id || selectedTask?.public_id === task.public_id;
                      const hasRequest = hasReassignmentRequest(task);
                      const taskStatus = getTaskStatus(task);
                      
                      return (
                        <tr
                          key={task.id || task.public_id || task._id || task.internalId}
                          className={`border-b transition-colors ${
                            isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                          } ${hasRequest ? 'bg-orange-50' : ''}`}
                        >
                          <td className="p-4">
                            <div className="font-medium text-gray-900">{task.title || task.name}</div>
                            {task.description && (
                              <div className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</div>
                            )}
                            {hasRequest && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertTriangle className="w-3 h-3 text-orange-500" />
                                <span className="text-xs text-orange-700 font-medium">Reassignment Requested</span>
                              </div>
                            )}
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{getAssignedUsers(task)}</span>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              taskStatus === 'COMPLETED' || taskStatus === 'Completed'
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
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              (task.priority || 'MEDIUM').toUpperCase() === 'HIGH' 
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

                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setSelectedTask(task)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
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
                      setShowReassignForm(false);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs uppercase text-gray-500 font-medium mb-1">Project</div>
                    <div className="font-semibold text-gray-900">{detailProject?.name || 'Unknown'}</div>
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
                  <div className={`p-3 rounded-lg ${
                    getTaskStatus(selectedTask) === 'COMPLETED' || getTaskStatus(selectedTask) === 'Completed'
                      ? 'bg-green-50' 
                      : selectedTask.summary?.dueStatus === 'Overdue' 
                      ? 'bg-red-50' 
                      : 'bg-gray-50'
                  }`}>
                    <div className="text-xs uppercase text-gray-500 font-medium mb-1">Total Hours Worked</div>
                    <div className={`font-semibold ${
                      getTaskStatus(selectedTask) === 'COMPLETED' || getTaskStatus(selectedTask) === 'Completed'
                        ? 'text-green-800' 
                        : selectedTask.summary?.dueStatus === 'Overdue' 
                        ? 'text-red-800' 
                        : 'text-gray-900'
                    }`}>
                      {selectedTask.total_time_hhmmss || '0h 0m'}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    selectedTask.summary?.dueStatus === 'Overdue' 
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

                {/* REASSIGNMENT REQUEST SECTION - Updated logic */}
                {hasReassignmentRequest(selectedTask) && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-orange-500 text-white rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-orange-900">Reassignment Request</h3>
                        <p className="text-orange-800">Employee requested reassignment. Approve or Reject:</p>
                      </div>
                    </div>

                    {/* Request Details */}
                    <div className="bg-white border rounded-lg p-4 mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Request ID:</span>
                          <div className="font-semibold text-gray-900">#{selectedTask.lock_info.request_id}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <div className="font-semibold text-orange-600">
                            {selectedTask.lock_info.request_status || 'Pending'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Task Status:</span>
                          <div className="font-semibold">{getTaskStatus(selectedTask)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Requested By:</span>
                          <div className="font-semibold">
                            {selectedTask.lock_info.requester_name || selectedTask.task_status?.requester_name || 'Unknown'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Requested At:</span>
                          <div className="font-semibold">
                            {formatDate(selectedTask.lock_info.requested_at)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Responded At:</span>
                          <div className="font-semibold">
                            {selectedTask.lock_info.responded_at ? formatDate(selectedTask.lock_info.responded_at) : 'Pending'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* APPROVE / REJECT BUTTONS */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApproveRequest(selectedTask.lock_info.request_id)}
                        disabled={actionLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            ✅ Approve Reassignment
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectRequest(selectedTask.lock_info.request_id)}
                        disabled={actionLoading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Rejecting...
                          </>
                        ) : (
                          <>
                            ❌ Reject Request
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* REASSIGN SECTION - Show for non-completed tasks or when showReassignForm is true */}
                {(!(getTaskStatus(selectedTask) === 'COMPLETED' || getTaskStatus(selectedTask) === 'Completed') || showReassignForm) && (
                  <div 
                    ref={reassignFormRef}
                    className={`bg-blue-50 border border-blue-200 rounded-lg p-4 transition-all duration-300 ${
                      showReassignForm ? 'ring-2 ring-blue-500 shadow-lg' : ''
                    }`}
                  >
                    {/* Auto-open notification */}
                    {showReassignForm && (
                      <div className="mb-3 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-800 font-medium">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Ready to reassign task</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          Select an employee to reassign this task
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mb-3">
                      <RefreshCw className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Reassign Task</span>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <select
                        value={selectedAssignee}
                        onChange={(e) => setSelectedAssignee(e.target.value)}
                        disabled={employeesLoading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                        disabled={reassigning || !selectedAssignee || employeesLoading}
                        className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                          reassigning || !selectedAssignee || employeesLoading
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
                    
                    {employeesLoading && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading employees...
                      </div>
                    )}
                  </div>
                )}

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

      {/* CREATE TASK MODAL - Updated to match isModalOpen structure */}
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
                    {selectedProject?.name || 'Selected Project'} ✓
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
                    Assign To
                  </label>
                  <select
                    multiple
                    value={formData.assignedUsers}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions).map(o => o.value);
                      setFormData({ ...formData, assignedUsers: values });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                  >
                    {employees.map((employee) => {
                      const key = employee.internalId || employee.id || employee.public_id || employee._id;
                      return (
                        <option key={key} value={key}>
                          {employee.name || employee.email || 'Unnamed'}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
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