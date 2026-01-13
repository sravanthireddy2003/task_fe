import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, Filter, List, Grid, Calendar, Clock, User, RefreshCw } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
 
import {
  fetchTasks,
  fetchSelectedTaskDetails,
  createTask,
  updateTask,
  deleteTask,
  clearTasks,
  selectTasks,
  selectTaskStatus,
  selectTaskError,
} from '../redux/slices/taskSlice';
import { fetchProjects, selectProjects } from '../redux/slices/projectSlice';
import { fetchUsers, selectUsers, selectCurrentUser } from '../redux/slices/userSlice';
 
export default function Tasks() {
  const dispatch = useDispatch();
 
  // Redux state
  const tasks = useSelector(selectTasks) || [];
  const status = useSelector(selectTaskStatus);
  const error = useSelector(selectTaskError);
  const projects = useSelector(selectProjects) || [];
  const users = useSelector(selectUsers) || [];
 
  // Local UI state
  const [view, setView] = useState('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_id: '',
    assigned_to: [],
    estimated_hours: '',
    due_date: '',
    priority: 'medium',
    status: 'pending',
  });
 
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeStatusEdit, setActiveStatusEdit] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
 
  const statusOptions = ['pending', 'in_progress', 'completed', 'on_hold'];
  const priorityOptions = ['low', 'medium', 'high'];
 
  const isLoading = status === 'loading';
 
  // Fetch projects and users on initial load
  useEffect(() => {
    console.log('Initial useEffect - fetching projects and users');
    dispatch(fetchProjects());
    dispatch(fetchUsers());
  }, [dispatch]);
 
  // Debug: Log when selectedProjectId changes
  useEffect(() => {
    console.log('selectedProjectId changed to:', selectedProjectId);
  }, [selectedProjectId]);
 
  // Debug: Log tasks and projects
  useEffect(() => {
    console.log('Tasks updated:', tasks.length);
    console.log('Projects available:', projects.length);
  }, [tasks, projects]);
 
  // Handle project selection change - FIXED VERSION
  const handleProjectChange = async (e) => {
    const projectId = e.target.value;
    console.log('handleProjectChange called with projectId:', projectId);
    setSelectedProjectId(projectId);
 
    if (projectId === 'all') {
      console.log('Clearing tasks for "All Projects"');
      dispatch(clearTasks());
      return;
    }
 
    // Validate project exists
    const selectedProject = projects.find(p =>
      p.id === projectId || p._id === projectId || p.public_id === projectId
    );
 
    if (!selectedProject) {
      console.error('Selected project not found in projects list');
      toast.error('Selected project not found');
      return;
    }
 
    console.log('Selected project found:', selectedProject.name);
 
    // Fetch tasks for the selected project
    setIsFetching(true);
    try {
      console.log('Dispatching fetchTasks with project_id:', projectId);
 
      // IMPORTANT: Make sure we're passing the correct parameter name
      // The fetchTasks thunk expects { project_id: value }
      const result = await dispatch(fetchTasks({ project_id: projectId }));
      console.log('fetchTasks result:', result);
 
      if (fetchTasks.fulfilled.match(result)) {
        console.log('Tasks fetched successfully:', result.payload?.length || 0, 'tasks');
        toast.success(`Loaded ${result.payload?.length || 0} tasks for ${selectedProject.name}`);
      } else if (fetchTasks.rejected.match(result)) {
        console.error('fetchTasks rejected:', result.payload || result.error);
        toast.error('Failed to fetch tasks: ' + (result.payload || result.error?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error in handleProjectChange:', err);
      toast.error('Failed to fetch tasks');
    } finally {
      setIsFetching(false);
    }
  };
 
  // Alternative: Fetch tasks when selectedProjectId changes (useEffect approach)
  useEffect(() => {
    const fetchTasksForProject = async () => {
      if (selectedProjectId && selectedProjectId !== 'all') {
        console.log('useEffect: Fetching tasks for project:', selectedProjectId);
        setIsFetching(true);
        try {
          await dispatch(fetchTasks({ project_id: selectedProjectId })).unwrap();
        } catch (err) {
          console.error('Failed to fetch tasks in useEffect:', err);
        } finally {
          setIsFetching(false);
        }
      }
    };
 
    fetchTasksForProject();
  }, [selectedProjectId, dispatch]);
 
  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      console.error('Task error:', error);
      toast.error(error?.message || String(error));
    }
  }, [error]);
 
  // Manual refresh function
  const handleRefreshTasks = useCallback(async () => {
    if (selectedProjectId === 'all') {
      toast.info('Please select a project to refresh tasks');
      return;
    }
 
    console.log('Manual refresh for project:', selectedProjectId);
    setIsFetching(true);
    try {
      const result = await dispatch(fetchTasks({ project_id: selectedProjectId })).unwrap();
      console.log('Refresh successful, tasks:', result?.length || 0);
      toast.success(`Refreshed tasks (${result?.length || 0} found)`);
    } catch (err) {
      console.error('Refresh failed:', err);
      toast.error('Refresh failed: ' + (err?.message || String(err)));
    } finally {
      setIsFetching(false);
    }
  }, [selectedProjectId, dispatch]);
 
  const openModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        name: task.title || task.name || '',
        description: task.description || '',
        project_id: task.projectId || task.project_id || selectedProjectId,
        assigned_to: (task.assignedUsers || []).map(u => u.public_id || u.id || u._id),
        estimated_hours: task.estimatedHours || task.timeAlloted || '',
        due_date: task.dueDate || task.taskDate ? task.taskDate.split('T')[0] : '',
        priority: (task.priority || 'MEDIUM').toLowerCase(),
        status: task.stage ? task.stage.toLowerCase() : 'pending',
      });
    } else {
      // Clear form for new task
      setEditingTask(null);
      setFormData({
        name: '',
        description: '',
        project_id: selectedProjectId !== 'all' ? selectedProjectId : '',
        assigned_to: [],
        estimated_hours: '',
        due_date: '',
        priority: 'medium',
        status: 'pending',
      });
    }
    setIsModalOpen(true);
  };
 
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Get the project ID (numeric ID from backend)
      const selectedProject = projects.find(
        (p) => (p.id || p._id || p.public_id) === formData.project_id
      );
 
      if (!formData.name || !formData.project_id) {
        toast.error('Please provide a task name and select a project');
        return;
      }
 
      // Prepare payload according to backend API
      const projectId = selectedProject?.id ?? selectedProject?._id ?? null;
      const projectPublicId = selectedProject?.public_id ?? selectedProject?.project_public_id ?? null;
      const client_id = selectedProject?.client_id ?? selectedProject?.clientId ?? selectedProject?.client?.id ?? selectedProject?.client?._id ?? null;
 
      const payload = {
        project_id: projectId || formData.project_id,
        projectId: projectId || undefined,
        projectPublicId: projectPublicId || undefined,
        client_id: client_id || undefined,
        title: formData.name,
        description: formData.description || '',
        stage: (formData.status || 'pending').toUpperCase(),
        taskDate: formData.due_date ? new Date(formData.due_date).toISOString() : new Date().toISOString(),
        priority: (formData.priority || 'medium').toUpperCase(),
        estimatedHours: formData.estimated_hours ? Number(formData.estimated_hours) : 0,
        timeAlloted: formData.estimated_hours ? Number(formData.estimated_hours) : 0,
      };
 
      // Handle assigned users: support single or multiple selections
      if (formData.assigned_to && (Array.isArray(formData.assigned_to) ? formData.assigned_to.length > 0 : !!formData.assigned_to)) {
        const ids = Array.isArray(formData.assigned_to) ? formData.assigned_to : [formData.assigned_to];
        payload.assignedUsers = ids.map((id) => {
          const assignedUser = users.find(u => u.id === id || u._id === id || u.public_id === id);
          if (assignedUser) {
            return {
              id: assignedUser.public_id || assignedUser.id || assignedUser._id,
              internalId: assignedUser.id || assignedUser._id,
              name: assignedUser.name || ''
            };
          }
          // Fallback: send id only
          return { id };
        }).filter(Boolean);
        payload.assigned_to = ids;
      }
 
      if (editingTask) {
        const taskId = editingTask.id || editingTask._id || editingTask.public_id;
        await dispatch(updateTask({ taskId, data: payload })).unwrap();
        toast.success('Task updated successfully');
      } else {
        await dispatch(createTask(payload)).unwrap();
        toast.success('Task created successfully');
      }
 
      closeModal();
 
      // Refresh tasks for the current project
      handleRefreshTasks();
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err?.message || 'Operation failed');
    }
  };
 
  const handleDelete = async (task) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
 
    try {
      const taskId = task.id || task._id || task.public_id;
      await dispatch(deleteTask(taskId)).unwrap();
      toast.success('Task deleted successfully');
 
      // Refresh tasks for the current project
      handleRefreshTasks();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err?.message || 'Delete failed');
    }
  };
 
  const handleOpenTaskDetails = async (task) => {
    const taskId = task.id || task._id || task.public_id || task.task_id;
    if (!taskId) return;
    try {
      const resp = await dispatch(fetchSelectedTaskDetails([taskId])).unwrap();
      const details = Array.isArray(resp) && resp.length ? resp[0] : resp;
      setSelectedTaskDetails(details || null);
    } catch (err) {
      console.error('Failed to fetch task details:', err);
      toast.error(err?.message || 'Failed to load task details');
    }
  };
 
  const closeDetails = () => {
    setSelectedTaskDetails(null);
  };
 
  const updateStatusInline = async (task, newStatus) => {
    if (!newStatus) return;
 
    try {
      const taskId = task.id || task._id || task.public_id;
      await dispatch(updateTask({
        taskId,
        data: {
          stage: newStatus.toUpperCase(),
          // Keep other fields unchanged
          title: task.title || task.name,
          description: task.description,
          priority: task.priority,
          estimatedHours: task.estimatedHours,
          timeAlloted: task.timeAlloted
        }
      })).unwrap();
 
      setActiveStatusEdit(null);
      toast.success('Status updated');
 
      // Refresh tasks for the current project
      handleRefreshTasks();
    } catch (err) {
      console.error('Status update error:', err);
      toast.error(err?.message || 'Status update failed');
    }
  };
 
  // Get status text for display
  const getStatusText = (status) => {
    if (!status) return 'To Do';
    const normalized = String(status).toLowerCase();
    if (normalized === 'completed') return 'Completed';
    if (normalized === 'on_hold' || normalized === 'on hold') return 'Blocked';
    if (normalized === 'in_progress') return 'In Progress';
    if (normalized === 'pending') return 'To Do';
    if (normalized === 'review') return 'Review';
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Filter tasks based on selected status
  const filteredTasks = tasks.filter((task) => {
    if (filterStatus === 'all') return true;
    const taskStatus = (task.status || task.stage || 'pending').toLowerCase();
    return taskStatus === filterStatus.toLowerCase();
  });

  // Get project name by ID
  const getProjectName = (projectId) => {
    const project = projects.find((p) =>
      p.id === projectId || p._id === projectId || p.public_id === projectId
    );
    return project?.name || project?.title || 'Unknown Project';
  };

  // Get assigned user names
  const getAssignedUsers = (task) => {
    if (!task.assignedUsers || !task.assignedUsers.length) return 'Unassigned';
    return task.assignedUsers.map(u => u.name).join(', ');
  };
 
  // Status colors
  const statusColors = {
    pending: 'bg-gray-100 text-gray-800 border border-gray-200', // To Do
    in_progress: 'bg-blue-100 text-blue-800 border border-blue-200', // In Progress
    review: 'bg-yellow-100 text-yellow-800 border border-yellow-200', // Review
    completed: 'bg-green-100 text-green-800 border border-green-200', // Completed
    on_hold: 'bg-red-100 text-red-800 border border-red-200', // Blocked
  };
 
  // Priority colors
  const priorityColors = {
    low: 'bg-gray-100 text-gray-800 border border-gray-200',
    medium: 'bg-amber-100 text-amber-800 border border-amber-200',
    high: 'bg-red-100 text-red-800 border border-red-200',
  };
 
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
 
  // Helper: filter only employee-role users for assignee dropdown
  const isEmployeeUser = (u) => {
    if (!u) return false;
    const role = (u.role || u.userType || u.type || '').toString().toLowerCase();
    if (role === 'employee') return true;
    if (Array.isArray(u.roles) && u.roles.some(r => String(r).toLowerCase().includes('employee'))) return true;
    return false;
  };
 
  const employeeUsers = Array.isArray(users) ? users.filter(isEmployeeUser) : [];
 
  // Current user and admin check
  const currentUser = useSelector(selectCurrentUser);
  const isAdminCurrentUser = (() => {
    const u = currentUser;
    if (!u) return false;
    const role = (u.role || u.userType || u.type || '').toString().toLowerCase();
    if (role.includes('admin') || role === 'superadmin' || role === 'administrator') return true;
    if (Array.isArray(u.roles) && u.roles.some(r => String(r).toLowerCase().includes('admin'))) return true;
    return false;
  })();
   return (
    <div className="p-8 bg-gray-50">
      {/* DEBUG INFO - Remove in production */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
        <div>Selected Project: {selectedProjectId}</div>
        <div>Tasks Count: {tasks.length}</div>
        <div>Projects Count: {projects.length}</div>
        <div>Status: {status}</div>
        <div>Fetching: {isFetching ? 'Yes' : 'No'}</div>
      </div>
 
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading-2 mb-2">Tasks</h1>
          <p className="text-body text-gray-600">Manage and track all your tasks</p>
        </div>
 
        <div className="flex items-center gap-3">
          {/* Project Selector */}
          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={handleProjectChange}
              className="border border-gray-300 rounded-lg px-4 py-2 pr-8 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none min-w-[200px]"
              disabled={isFetching}
            >
              <option value="all">All Projects</option>
              {projects.map((project) => {
                const projectId = project.id || project._id || project.public_id;
                return (
                  <option key={projectId} value={projectId}>
                    {project.name || project.title}
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
            onClick={handleRefreshTasks}
            disabled={selectedProjectId === 'all' || isFetching}
            className={`p-2 rounded-lg border ${selectedProjectId === 'all' || isFetching
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-600 hover:bg-blue-50 border-blue-200'
              }`}
            title="Refresh tasks"
          >
            <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
 
          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('list')}
              disabled={isFetching}
              className={`px-3 py-2 ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} ${isFetching ? 'opacity-50' : ''
                }`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('card')}
              disabled={isFetching}
              className={`px-3 py-2 ${view === 'card' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} ${isFetching ? 'opacity-50' : ''
                }`}
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>
 
          {/* Add Task Button */}
          <button
            onClick={() => openModal()}
            disabled={selectedProjectId === 'all' || isFetching}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${selectedProjectId === 'all' || isFetching
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
      {isFetching && (
        <div className="flex items-center justify-center p-4 mb-6 bg-blue-50 rounded-lg">
          <RefreshCw className="w-5 h-5 mr-2 animate-spin text-blue-600" />
          <span className="text-blue-600 font-medium">Loading tasks...</span>
        </div>
      )}
 
      {/* STATUS SUMMARY - Only show when a project is selected */}
      {selectedProjectId !== 'all' && tasks.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 font-semibold shadow-sm border border-gray-200">
            To Do: {tasks.filter((t) => (t.stage || '').toLowerCase() === 'pending').length}
          </div>
          <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-semibold shadow-sm border border-blue-200">
            In Progress: {tasks.filter((t) => (t.stage || '').toLowerCase() === 'in_progress').length}
          </div>
          <div className="px-4 py-2 rounded-lg bg-yellow-100 text-yellow-800 font-semibold shadow-sm border border-yellow-200">
            Review: {tasks.filter((t) => (t.stage || '').toLowerCase() === 'review').length}
          </div>
          <div className="px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold shadow-sm border border-green-200">
            Completed: {tasks.filter((t) => (t.stage || '').toLowerCase() === 'completed').length}
          </div>
          <div className="px-4 py-2 rounded-lg bg-red-100 text-red-800 font-semibold shadow-sm border border-red-200">
            Blocked: {tasks.filter((t) => (t.stage || '').toLowerCase() === 'on_hold').length}
          </div>
        </div>
      )}
 
      {/* PROJECT INFO - Show selected project info */}
      {selectedProjectId !== 'all' && tasks.length > 0 && (
        <div className="bg-white rounded-xl border p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {getProjectName(selectedProjectId)} - Tasks ({tasks.length})
          </h2>
          <p className="text-gray-600">
            Showing tasks for selected project
          </p>
        </div>
      )}
 
      {/* FILTERS - Only show when a project is selected */}
      {selectedProjectId !== 'all' && tasks.length > 0 && (
        <div className="bg-white rounded-xl border p-4 mb-6 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700 font-medium">Filters:</span>
          </div>
 
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isFetching}
          >
            <option value="all">All Status</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {getStatusText(s)}
              </option>
            ))}
          </select>
        </div>
      )}
 
      {/* NO PROJECT SELECTED STATE */}
      {selectedProjectId === 'all' && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Project</h3>
          <p className="text-gray-600 mb-6">
            Please select a project from the dropdown above to view and manage tasks.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {projects.slice(0, 5).map((project) => {
              const projectId = project.id || project._id || project.public_id;
              return (
                <button
                  key={projectId}
                  onClick={() => setSelectedProjectId(projectId)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  {project.name || project.title}
                </button>
              );
            })}
          </div>
        </div>
      )}
 
      {/* NO TASKS STATE - When project selected but no tasks */}
      {selectedProjectId !== 'all' && !isFetching && tasks.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Found</h3>
          <p className="text-gray-600 mb-6">
            No tasks found for project "{getProjectName(selectedProjectId)}".
            Create your first task or try refreshing.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Task
            </button>
            <button
              onClick={handleRefreshTasks}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
 
      {/* DETAILS PANEL */}
      {selectedTaskDetails && (
        <div className="bg-white border rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">{(selectedTaskDetails.title || selectedTaskDetails.name || '').slice(0, 2).toUpperCase()}</div>
                </div>
                <div className="min-w-0">
                  <h3 className="text-2xl font-bold truncate">{selectedTaskDetails.title || selectedTaskDetails.name}</h3>
                  <p className="text-sm text-gray-500 truncate mt-1">{selectedTaskDetails.description || 'No description'}</p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded-full ${(selectedTaskDetails.status || '').toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' : (selectedTaskDetails.status || '').toLowerCase() === 'on hold' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                      {getStatusText(selectedTaskDetails.status || selectedTaskDetails.stage || '')}
                    </span>
                    {selectedTaskDetails.summary?.dueStatus && (
                      <span className={`text-xs px-2 py-1 rounded-full ${selectedTaskDetails.summary.dueStatus === 'Overdue' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {selectedTaskDetails.summary.dueStatus}
                      </span>
                    )}
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-800">Priority: {(selectedTaskDetails.priority || '').toString()}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-emerald-800">Est: {selectedTaskDetails.timeAlloted ?? selectedTaskDetails.estimatedHours ?? 0}h</span>
                    {selectedTaskDetails.total_time_hhmmss && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">Done: {selectedTaskDetails.total_time_hhmmss}</span>
                    )}
                    <span className="text-xs px-2 py-1 rounded-full bg-white border text-gray-600">Due: {formatDate(selectedTaskDetails.summary?.dueDate || selectedTaskDetails.taskDate || selectedTaskDetails.dueDate)}</span>
                  </div>
                </div>
              </div>
            </div>
 
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">{getProjectName(selectedProjectId)}</div>
                <button onClick={() => { setSelectedTaskDetails(null); }} className="px-3 py-1 bg-gray-100 rounded-lg text-sm">Back</button>
              </div>
              <div className="mt-4">
                <div className="flex -space-x-2">
                  {(selectedTaskDetails.assignedUsers || selectedTaskDetails.assigned_users || []).map((u) => (
                    <div key={u.id || u.internalId || u._id} className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold border-2 border-white shadow" title={u.name}>
                      {String(u.name || u.fullName || u.username || u.id).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Checklist card */}
              <div className="bg-white border rounded-xl p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    checked={
                      !!(selectedTaskDetails.checklist ||
                        selectedTaskDetails.check_lists ||
                        selectedTaskDetails.check_items)?.length &&
                      (selectedTaskDetails.checklist ||
                        selectedTaskDetails.check_lists ||
                        selectedTaskDetails.check_items).every(c => c.completed)
                    }
                    readOnly
                  />
                  Checklist
                </h4>
 
                {((selectedTaskDetails.checklist ||
                  selectedTaskDetails.check_lists ||
                  selectedTaskDetails.check_items) || []).length ? (
                  <ul className="space-y-2 text-sm text-gray-700">
                    {(selectedTaskDetails.checklist ||
                      selectedTaskDetails.check_lists ||
                      selectedTaskDetails.check_items).map((item, idx) => (
                        <li
                          key={item.id || item._id || idx}
                          className="flex items-center gap-3"
                        >
                          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700">
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-500">
                              <svg
                                viewBox="0 0 20 20"
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M5 10l3 3 7-7" />
                              </svg>
                            </span>
                            <span>{item.title || item.name || item.text}</span>
                          </span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No checklist items</p>
                )}
 
                {/* Activities */}
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Activities</h4>
                  {((selectedTaskDetails.activities ||
                    selectedTaskDetails.activity_log) || []).length ? (
                    <div className="space-y-3 max-h-56 overflow-auto text-sm text-gray-700">
                      {(selectedTaskDetails.activities ||
                        selectedTaskDetails.activity_log).map((a, i) => (
                          <div
                            key={a.id || a._id || i}
                            className="border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                          >
                            <div className="text-xs text-gray-500">
                              {a.by || a.user || a.actor} •{" "}
                              {a.when || a.createdAt || a.timestamp
                                ? new Date(
                                  a.createdAt || a.when || a.timestamp
                                ).toLocaleString()
                                : ""}
                            </div>
                            <div className="text-sm">
                              {a.text || a.message || a.summary}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No activities</p>
                  )}
                </div>
              </div>
            </div>
 
            {/* Summary card */}
            <div className="bg-white p-4 rounded-xl border">
              <h4 className="font-semibold mb-3">Summary</h4>
              <div className="text-sm text-gray-700 mb-2">
                <strong>Client:</strong>{" "}
                {selectedTaskDetails.client?.name || "-"}
              </div>
              <div className="text-sm text-gray-700 mb-2">
                <strong>Estimated:</strong>{" "}
                {selectedTaskDetails.estimatedHours ??
                  selectedTaskDetails.timeAlloted ??
                  0}{" "}
                hrs
              </div>
              <div className="text-sm text-gray-700 mb-2">
                <strong>Total Hours:</strong>{" "}
                {selectedTaskDetails.totalHours ??
                  selectedTaskDetails.total_hours ??
                  0}{" "}
                hrs
              </div>
              <div className="text-sm text-gray-700 mb-2">
                <strong>Created:</strong>{" "}
                {selectedTaskDetails.createdAt
                  ? new Date(
                    selectedTaskDetails.createdAt
                  ).toLocaleString()
                  : "-"}
              </div>
              <div className="text-sm text-gray-700">
                <strong>Updated:</strong>{" "}
                {selectedTaskDetails.updatedAt
                  ? new Date(
                    selectedTaskDetails.updatedAt
                  ).toLocaleString()
                  : "-"}
              </div>
            </div>
          </div>
        </div>
      )}
 
      {/* LIST VIEW */}
      {!selectedTaskDetails && selectedProjectId !== 'all' && !isFetching && tasks.length > 0 && view === 'list' && (
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
                filteredTasks.map((task) => (
                  <tr
                    key={task.id || task._id || task.public_id}
                    onClick={() => handleOpenTaskDetails(task)}
                    role="button"
                    className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="p-4">
                      <div onClick={() => handleOpenTaskDetails(task)} title="View task details" className="font-medium text-gray-900 cursor-pointer hover:underline">{task.title || task.name}</div>
                      {task.description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</div>
                      )}
                    </td>
 
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{getAssignedUsers(task)}</span>
                      </div>
                    </td>
 
                    <td className="p-4">
                      {activeStatusEdit === (task.id || task._id || task.public_id) ? (
                        <select
                          value={(task.status || task.stage || 'pending').toLowerCase()}
                          onChange={(e) => updateStatusInline(task, e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onBlur={() => setActiveStatusEdit(null)}
                          autoFocus
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {getStatusText(s)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="space-y-1">
                          <span
                            onClick={() => setActiveStatusEdit(task.id || task._id || task.public_id)}
                            className={`px-3 py-1 rounded-full cursor-pointer text-sm font-medium block ${statusColors[(task.status || task.stage || 'pending').toLowerCase()]}`}
                          >
                            {getStatusText(task.status || task.stage || 'pending')}
                          </span>
                          {task.summary?.dueStatus && (
                            <span className={`text-xs px-2 py-0.5 rounded ${task.summary.dueStatus === 'Overdue' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                              {task.summary.dueStatus}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
 
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[(task.priority || 'MEDIUM').toLowerCase()]}`}>
                        {(task.priority || 'MEDIUM').toUpperCase()}
                      </span>
                    </td>
 
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{formatDate(task.taskDate || task.dueDate)}</span>
                      </div>
                    </td>
 
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-600">Est: {task.timeAlloted || task.estimatedHours || 0}h</span>
                        </div>
                        {task.total_time_hhmmss && (
                          <div className="text-xs text-blue-600 font-medium">Done: {task.total_time_hhmmss}</div>
                        )}
                      </div>
                    </td>
 
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openModal(task); }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(task); }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
 
      {/* CARD VIEW */}
      {!selectedTaskDetails && selectedProjectId !== 'all' && !isFetching && tasks.length > 0 && view === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl border p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-gray-500">No tasks found for the selected filters</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id || task._id || task.public_id}
                onClick={() => handleOpenTaskDetails(task)}
                role="button"
                className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 onClick={() => handleOpenTaskDetails(task)} title="View task details" className="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:underline">{task.title || task.name}</h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 line-clamp-3">{task.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); openModal(task); }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(task); }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
 
                {/* Status and Priority */}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    onClick={() => setActiveStatusEdit(task.id || task._id || task.public_id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${statusColors[(task.status || task.stage || 'pending').toLowerCase()]}`}
                  >
                    {getStatusText(task.status || task.stage || 'pending')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[(task.priority || 'MEDIUM').toLowerCase()]}`}>
                    {(task.priority || 'MEDIUM').toUpperCase()}
                  </span>
                </div>
 
                {/* Task Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{getAssignedUsers(task)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(task.taskDate || task.dueDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{task.estimatedHours || task.timeAlloted || 0} hours estimated</span>
                  </div>
                </div>
 
                {/* Project Info */}
                <div className="pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    Project: <span className="font-medium text-gray-700">{getProjectName(selectedProjectId)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
 
      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
 
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Task Name */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Task Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter task name"
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
                    placeholder="Enter task description"
                  />
                </div>
 
                {/* Project and Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Project <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.project_id}
                      onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={selectedProjectId !== 'all'}
                    >
                      {selectedProjectId === 'all' ? (
                        <>
                          <option value="">Select a project</option>
                          {projects.map((project) => (
                            <option
                              key={project.id || project._id || project.public_id}
                              value={project.id || project._id || project.public_id}
                            >
                              {project.name || project.title}
                            </option>
                          ))}
                        </>
                      ) : (
                        // If a project is selected from the list, lock the modal project to that project only
                        projects.filter(p => (p.id || p._id || p.public_id) === selectedProjectId).map((project) => (
                          <option
                            key={project.id || project._id || project.public_id}
                            value={project.id || project._id || project.public_id}
                          >
                            {project.name || project.title}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
 
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {getStatusText(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
 
                {/* Priority and Assignee */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {priorityOptions.map((p) => (
                        <option key={p} value={p}>
                          {p.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
 
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Assign To
                    </label>
                    {isAdminCurrentUser ? (
                      <select
                        multiple
                        value={formData.assigned_to}
                        onChange={(e) => {
                          const vals = Array.from(e.target.selectedOptions).map(o => o.value);
                          setFormData({ ...formData, assigned_to: vals });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-36"
                      >
                        {employeeUsers.map((user) => (
                          <option
                            key={user.id || user._id || user.public_id}
                            value={user.id || user._id || user.public_id}
                          >
                            {user.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={formData.assigned_to[0] || ''}
                        onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value ? [e.target.value] : [] })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a user (optional)</option>
                        {employeeUsers.map((user) => (
                          <option
                            key={user.id || user._id || user.public_id}
                            value={user.id || user._id || user.public_id}
                          >
                            {user.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
 
                {/* Estimated Hours and Due Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.estimated_hours}
                      onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 8"
                    />
                  </div>
 
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
 
              {/* Form Actions */}
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
 