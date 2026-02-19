import { useState, useEffect, useCallback } from 'react';
import * as Icons from '../icons';
import ViewToggle from '../components/ViewToggle';
import fetchWithTenant from '../utils/fetchWithTenant';

const { Plus, Edit2, Trash2, AlertCircle, Filter, List, Grid, Calendar, Clock, User, RefreshCw, GitBranch, Search, ChevronDown, MoreVertical, CheckCircle, XCircle, PlayCircle, PauseCircle, Eye, LayoutGrid, Clock4, Folder, ClipboardList, CheckSquare, Pause, Play, X } = Icons;
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import Card from "../components/Card";
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
  const [view, setView] = useState('list'); // 'list', 'kanban', 'calendar', 'timeline'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_id: '',
    assigned_to: [], // Changed to array but will only store single user
    estimated_hours: '',
    due_date: '',
    priority: 'medium',
    status: 'pending',
  });

  const [isProjectLocked, setIsProjectLocked] = useState(false);

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [activeStatusEdit, setActiveStatusEdit] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  const statusOptions = ['pending', 'in_progress', 'completed', 'on_hold'];
  const priorityOptions = ['low', 'medium', 'high'];

  const isLoading = status === 'loading';

  // Derived detail helpers for the task popup UI (UI-only, no API/state changes)
  const detailChecklistItems =
    (selectedTaskDetails?.checklist ||
      selectedTaskDetails?.check_lists ||
      selectedTaskDetails?.check_items ||
      []);

  const detailChecklistCompleted = detailChecklistItems.filter((c) => c && c.completed).length;

  const detailActivities =
    (selectedTaskDetails?.activities ||
      selectedTaskDetails?.activity ||
      selectedTaskDetails?.activity_log ||
      []);

  const detailAttachments =
    (selectedTaskDetails?.attachments ||
      selectedTaskDetails?.files ||
      selectedTaskDetails?.documents ||
      []);

  // Fetch projects and users on initial load
  useEffect(() => {
    console.log('Initial useEffect - fetching projects and users');
    dispatch(fetchProjects());
    dispatch(fetchUsers());
  }, [dispatch]);

  // Handle project selection change
  const handleProjectChange = async (e) => {
    const projectId = e.target.value;
    console.log('handleProjectChange called with projectId:', projectId);
    setSelectedProjectId(projectId);
    setIsProjectLocked(false);

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

    // console.log('Selected project found:', selectedProject.name);
    // Fetching is now handled by the useEffect dependent on selectedProjectId
  };

  // Fetch tasks when selectedProjectId changes
  useEffect(() => {
    const fetchTasksForProject = async () => {
      if (selectedProjectId && selectedProjectId !== 'all') {
        console.log('useEffect: Fetching tasks for project:', selectedProjectId);
        setIsFetching(true);
        // Reset lock state when trying to fetch new project tasks (though handleProjectChange does it too)
        // setIsProjectLocked(false); 

        try {
          const result = await dispatch(fetchTasks({ project_id: selectedProjectId })).unwrap();
          // Success
          // toast.success(`Loaded ${result.length} tasks`);
        } catch (err) {
          console.error('Failed to fetch tasks in useEffect:', err);
          const errorMessage = typeof err === 'string' ? err : err?.message || 'Unknown error';

          if (errorMessage.includes("Project is closed") || errorMessage.includes("Tasks are locked")) {
            setIsProjectLocked(true);
            dispatch(clearTasks());
            setSelectedTaskDetails(null);
            toast.error(errorMessage);
          } else {
            toast.error('Failed to fetch tasks: ' + errorMessage);
          }
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

      // If refresh succeeds, ensure project is unlocked (unless another logic overrides, but usually successful fetch means unlocked)
      setIsProjectLocked(false);

    } catch (err) {
      console.error('Refresh failed:', err);
      const errorMessage = typeof err === 'string' ? err : err?.message || String(err);

      if (errorMessage.includes("Project is closed") || errorMessage.includes("Tasks are locked")) {
        setIsProjectLocked(true);
        dispatch(clearTasks());
        setSelectedTaskDetails(null);
      }

      toast.error('Refresh failed: ' + errorMessage);
    } finally {
      setIsFetching(false);
    }
  }, [selectedProjectId, dispatch]);

  const openModal = (task = null) => {
    if (isProjectLocked) {
      toast.error('Project is locked. Cannot create or edit tasks.');
      return;
    }
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
        assigned_to: [], // Changed to array
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

      // Handle assigned user: single user only
      if (formData.assigned_to && formData.assigned_to.length > 0) {
        const assignedUserId = formData.assigned_to[0];
        const assignedUser = users.find(u => u.id === assignedUserId || u._id === assignedUserId || u.public_id === assignedUserId);
        if (assignedUser) {
          payload.assignedUsers = [{
            id: assignedUser.public_id || assignedUser.id || assignedUser._id,
            internalId: assignedUser.id || assignedUser._id,
            name: assignedUser.name || ''
          }];
          payload.assigned_to = [assignedUserId];
        }
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
      const errorMessage = err?.response?.data?.message || err?.message || err?.data?.message || 'Operation failed';
      toast.error(errorMessage);
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

    setDetailLoading(true);
    try {
      const resp = await fetchWithTenant('/api/tasks/selected-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds: [taskId] }),
      });

      if (resp && resp.error) throw new Error(resp.error || 'Failed to fetch task details');

      const payload = resp?.data ?? resp;
      const details = Array.isArray(payload) ? payload[0] : payload;
      setSelectedTaskDetails(details || null);
    } catch (err) {
      console.error('Failed to fetch task details:', err);
      toast.error(err?.message || 'Failed to load task details');
      setSelectedTaskDetails(task);
    } finally {
      setDetailLoading(false);
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

  // Filter tasks based on search, status, and priority
  const filteredTasks = tasks.filter((task) => {
    // Search filter
    const matchesSearch = searchQuery === '' ||
      (task.title || task.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const taskStatus = (task.status || task.stage || 'pending').toLowerCase();
    const matchesStatus = filterStatus === 'all' || taskStatus === filterStatus.toLowerCase();

    // Priority filter
    const taskPriority = (task.priority || 'MEDIUM').toLowerCase();
    const matchesPriority = filterPriority === 'all' || taskPriority === filterPriority.toLowerCase();

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Normalize backend status/stage into a Kanban column key
  const getStatusKey = (task) => {
    const rawStatus = (task.status || '').toString().toLowerCase();
    const rawStage = (task.stage || '').toString().toLowerCase();
    const src = rawStatus || rawStage;

    if (!src) return 'pending';
    if (src.includes('completed')) return 'completed';
    if (src.includes('in_progress') || src.includes('in progress') || src.includes('in-progress')) return 'in_progress';
    if (src.includes('review')) return 'review';
    if (src.includes('on_hold') || src.includes('on hold') || src.includes('blocked')) return 'on_hold';
    if (src.includes('request')) return 'review';
    if (src.includes('pending')) return 'pending';
    return 'pending';
  };

  // Group tasks for Kanban view based on normalized status
  const kanbanColumns = {
    pending: filteredTasks.filter((task) => getStatusKey(task) === 'pending'),
    in_progress: filteredTasks.filter((task) => getStatusKey(task) === 'in_progress'),
    review: filteredTasks.filter((task) => getStatusKey(task) === 'review'),
    completed: filteredTasks.filter((task) => getStatusKey(task) === 'completed'),
    on_hold: filteredTasks.filter((task) => getStatusKey(task) === 'on_hold'),
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

  // Get column title for Kanban
  const getColumnTitle = (columnId) => {
    const titles = {
      pending: 'To Do',
      in_progress: 'In Progress',
      review: 'Review',
      completed: 'Completed',
      on_hold: 'Blocked'
    };
    return titles[columnId] || columnId;
  };

  // Get project name by ID
  const getProjectName = (projectId) => {
    const project = projects.find((p) =>
      p.id === projectId || p._id === projectId || p.public_id === projectId
    );
    return project?.name || project?.title || 'Unknown Project';
  };

  // Get assigned user names (single user now)
  const getAssignedUsers = (task) => {
    if (!task.assignedUsers || !task.assignedUsers.length) return 'Unassigned';
    return task.assignedUsers[0]?.name || 'Unassigned';
  };

  // Status colors
  const statusColors = {
    pending: 'bg-gray-100 text-gray-800 border border-gray-200',
    in_progress: 'bg-blue-100 text-blue-800 border border-blue-200',
    review: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    completed: 'bg-green-100 text-green-800 border border-green-200',
    on_hold: 'bg-red-100 text-red-800 border border-red-200',
  };

  // Priority colors
  const priorityColors = {
    low: 'bg-gray-100 text-gray-800 border border-gray-200',
    medium: 'bg-amber-100 text-amber-800 border border-amber-200',
    high: 'bg-red-100 text-red-800 border border-red-200',
  };

  // Column colors for Kanban
  const columnColors = {
    pending: 'bg-gray-50',
    in_progress: 'bg-blue-50',
    review: 'bg-yellow-50',
    completed: 'bg-green-50',
    on_hold: 'bg-red-50',
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

  // Render different views
  const renderView = () => {
    if (selectedProjectId === 'all' || isFetching || tasks.length === 0) {
      return null;
    }

    switch (view) {
      case 'list':
        return (
          <div className="tm-list-container">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="p-4 text-left">Task</th>
                  <th className="p-4 text-left">Assigned To</th>
                  <th className="p-4 text-left">Client</th>
                  <th className="p-4 text-left">Priority</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Due Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-gray-500">
                      <AlertCircle className="tm-icon-hero mx-auto mb-3 opacity-50" />
                      <p className="text-lg font-medium text-gray-900 mb-1">No tasks found</p>
                      <p className="mb-6">No tasks match your selected filters.</p>
                      <div className="flex gap-3 justify-center" />
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
                        <div onClick={() => handleOpenTaskDetails(task)} title="View task details" className={`font-medium cursor-pointer hover:underline ${
                          (task.status || task.stage || 'pending').toLowerCase() === 'completed'
                            ? 'text-gray-400 line-through'
                            : 'text-gray-900'
                        }`}>{task.title || task.name}</div>
                        {task.description && (
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</div>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="tm-icon text-gray-400" />
                          <span className="text-sm text-gray-700">{getAssignedUsers(task)}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="text-sm text-gray-700">{getProjectName(selectedProjectId)}</div>
                      </td>

                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[(task.priority || 'MEDIUM').toLowerCase()]}`}>
                          {(task.priority || 'MEDIUM').toUpperCase()}
                        </span>
                      </td>

                      <td className="p-4">
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
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="tm-icon text-gray-400" />
                          <span className="text-sm text-gray-700">{formatDate(task.taskDate || task.dueDate)}</span>
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); openModal(task); }}
                            disabled={isProjectLocked}
                            className={`p-2 rounded-lg transition-colors ${isProjectLocked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            title={isProjectLocked ? "Project Locked" : "Edit task"}
                          >
                            <Edit2 className="tm-icon" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(task); }}
                            disabled={isProjectLocked}
                            className={`p-2 rounded-lg transition-colors ${isProjectLocked ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'
                              }`}
                            title={isProjectLocked ? "Project Locked" : "Delete task"}
                          >
                            <Trash2 className="tm-icon" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );

      case 'kanban':
        if (filteredTasks.length === 0) {
          return (
            <div className="bg-white rounded-xl border p-12 text-center">
              <AlertCircle className="tm-icon-hero mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium text-gray-900 mb-1">No tasks found</p>
              <p className="text-gray-600 mb-6">No tasks match your selected filters.</p>
              <div className="flex gap-3 justify-center" />
            </div>
          );
        }
        return (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Object.entries(kanbanColumns).map(([columnId, columnTasks]) => (
              <div
                key={columnId}
                className={`flex-shrink-0 w-80 ${columnColors[columnId]} rounded-lg p-4`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {getColumnTitle(columnId)}
                    </h3>
                    <span className="bg-white px-2 py-1 rounded-full text-xs font-medium">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <Card
                      key={task.id || task._id || task.public_id}
                      className="cursor-pointer"
                      onClick={() => handleOpenTaskDetails(task)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-medium ${
                          (task.status || task.stage || 'pending').toLowerCase() === 'completed'
                            ? 'text-gray-400 line-through'
                            : 'text-gray-900'
                        }`}>
                          {task.title || task.name}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded text-xs ${priorityColors[(task.priority || 'MEDIUM').toLowerCase()]
                            }`}
                        >
                          {(task.priority || 'MEDIUM').toUpperCase()}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="tm-icon text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {getAssignedUsers(task)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(task.dueDate || task.taskDate)}
                        </div>
                      </div>

                      <div className="mt-3 flex items-start justify-between">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[getStatusKey(task)]
                            }`}
                        >
                          {getStatusText(task.status || task.stage || 'pending')}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'calendar':
        return (
          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Calendar View</h3>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border rounded-lg text-sm bg-blue-50 text-blue-700 font-medium">Today</button>
                <button className="px-3 py-1 border rounded-lg text-sm hover:bg-gray-50">Week</button>
                <button className="px-3 py-1 border rounded-lg text-sm hover:bg-gray-50">Month</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-medium text-gray-600 py-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => {
                const dayNumber = i + 1;
                const dayTasks = filteredTasks.filter(task => {
                  if (!task.dueDate && !task.taskDate) return false;
                  const taskDate = new Date(task.dueDate || task.taskDate);
                  return taskDate.getDate() === dayNumber;
                });

                return (
                  <div key={i} className="min-h-32 border rounded-lg p-2 hover:bg-gray-50">
                    <div className="text-sm font-medium mb-2">{dayNumber}</div>
                    {dayTasks.slice(0, 2).map(task => (
                      <div
                        key={task.id}
                        className="text-xs p-2 mb-1 rounded bg-blue-50 text-blue-700 truncate hover:bg-blue-100 cursor-pointer border border-blue-100"
                        onClick={() => handleOpenTaskDetails(task)}
                      >
                        <div className={`font-medium ${
                          (task.status || task.stage || 'pending').toLowerCase() === 'completed'
                            ? 'line-through'
                            : ''
                        }`}>{task.title || task.name}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`px-1 rounded ${priorityColors[(task.priority || 'MEDIUM').toLowerCase()]}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-gray-500 pl-2">+{dayTasks.length - 2} more</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'timeline':
        return (
          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Timeline View</h3>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border rounded-lg text-sm bg-blue-50 text-blue-700 font-medium">Day</button>
                <button className="px-3 py-1 border rounded-lg text-sm hover:bg-gray-50">Week</button>
                <button className="px-3 py-1 border rounded-lg text-sm hover:bg-gray-50">Month</button>
              </div>
            </div>
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleOpenTaskDetails(task)}
                >
                  <div className="w-32">
                    <div className="text-sm font-medium text-gray-900">{formatDate(task.dueDate || task.taskDate)}</div>
                    <div className="text-xs text-gray-500 mt-1">Due Date</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${(task.status || task.stage || 'pending').toLowerCase() === 'completed' ? 'bg-green-500' :
                        (task.status || task.stage || 'pending').toLowerCase() === 'in_progress' ? 'bg-blue-500' :
                          (task.status || task.stage || 'pending').toLowerCase() === 'pending' ? 'bg-gray-400' : 'bg-red-500'}`}
                      />
                      <h4 className={`font-medium ${
                        (task.status || task.stage || 'pending').toLowerCase() === 'completed'
                          ? 'text-gray-400 line-through'
                          : 'text-gray-900'
                      }`}>{task.title || task.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${priorityColors[(task.priority || 'MEDIUM').toLowerCase()]}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${statusColors[(task.status || task.stage || 'pending').toLowerCase()]}`}>
                        {getStatusText(task.status || task.stage || 'pending')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {getAssignedUsers(task)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {task.estimatedHours || task.timeAlloted || 0}h estimated
                      </div>
                      <div className="flex items-center gap-1">
                        <Folder className="w-4 h-4" />
                        {getProjectName(selectedProjectId)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openModal(task); }}
                      disabled={isProjectLocked}
                      className={`p-2 rounded-lg ${isProjectLocked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      title={isProjectLocked ? "Project Locked" : "Edit task"}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(task); }}
                      disabled={isProjectLocked}
                      className={`p-2 rounded-lg ${isProjectLocked ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'
                        }`}
                      title={isProjectLocked ? "Project Locked" : "Delete task"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Task summary cards with icons */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {(() => {
          const counts = tasks.reduce((acc, t) => {
            const s = (t.status || t.stage || '').toString().toLowerCase();
            if (s.includes('completed')) acc.completed += 1;
            else if (s.includes('in_progress') || s.includes('in progress') || s === 'inprogress') acc.inProgress += 1;
            else if (s.includes('on_hold') || s.includes('on hold') || s === 'onhold') acc.onHold += 1;
            else acc.toDo += 1;
            return acc;
          }, { toDo: 0, inProgress: 0, onHold: 0, completed: 0 });

          const card = (title, count, bg, icon) => (
            <div className={`p-4 rounded-xl shadow-sm bg-white border border-gray-100 flex items-center gap-4`}>
              <div className={`p-3 rounded-lg ${bg} text-white/95`}>
                {icon}
              </div>
              <div>
                <div className="text-sm text-gray-500">{title}</div>
                <div className="text-2xl font-semibold">{count}</div>
              </div>
            </div>
          );

          return (
            <>
              {card('To Do', counts.toDo, 'bg-slate-600', <ClipboardList className="tm-icon-xl" />)}
              {card('In Progress', counts.inProgress, 'bg-blue-600', <Play className="tm-icon-xl" />)}
              {card('On Hold', counts.onHold, 'bg-orange-600', <Pause className="tm-icon-xl" />)}
              {card('Completed', counts.completed, 'bg-emerald-600', <CheckSquare className="tm-icon-xl" />)}
            </>
          );
        })()}
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

          {/* Refresh Button - show in header only when there are tasks for the selected project */}
          {selectedProjectId !== 'all' && !isFetching && Array.isArray(tasks) && tasks.length > 0 && (
            <button
              onClick={handleRefreshTasks}
              disabled={selectedProjectId === 'all' || isFetching}
              className={`p-2 rounded-lg border ${selectedProjectId === 'all' || isFetching
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-600 hover:bg-blue-50 border-blue-200'
                }`}
              title="Refresh tasks"
            >
              <RefreshCw className={`tm-icon ${isFetching ? 'animate-spin' : ''} text-blue-600`} />
            </button>
          )}

          {/* View Toggle: shared list/grid control (grid maps to kanban) */}
          <ViewToggle
            mode={view === 'list' ? 'list' : 'grid'}
            onChange={(mode) => setView(mode === 'list' ? 'list' : 'kanban')}
            className="ml-1"
          />

          {/* Add Task Button - show in header only when there are tasks for the selected project */}
          {selectedProjectId !== 'all' && !isFetching && Array.isArray(tasks) && tasks.length > 0 && (
            <button
              onClick={() => openModal()}
              disabled={selectedProjectId === 'all' || isFetching || isProjectLocked}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${selectedProjectId === 'all' || isFetching || isProjectLocked
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              {isProjectLocked ? <Icons.Lock className="tm-icon" /> : <Plus className="tm-icon" />}
              {isProjectLocked ? 'Locked' : 'Add Task'}
            </button>
          )}
        </div>
      </div>

      {/* ERROR / LOCKED PROJECT BANNER */}
      {(error || isProjectLocked) && !isFetching && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-800 animate-fadeIn">
          <AlertCircle className="tm-icon-md flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg">{isProjectLocked ? 'Project Locked' : 'Error'}</h3>
            <p className="text-red-700 mt-1">{error}</p>
            {isProjectLocked && (
              <p className="text-red-600 text-sm mt-2">
                This project is currently closed or pending approval. Tasks are locked and cannot be modified.
              </p>
            )}
          </div>
        </div>
      )}

      {/* VIEW SELECTOR */}
      <div className="flex items-center gap-1 mb-6">
        <button
          onClick={() => setView('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium ${view === 'list'
            ? 'bg-white text-blue-600 border-t border-l border-r border-gray-300'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <List className="tm-icon" />
          List
        </button>
        <button
          onClick={() => setView('kanban')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium ${view === 'kanban'
            ? 'bg-white text-blue-600 border-t border-l border-r border-gray-300'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <LayoutGrid className="tm-icon" />
          Kanban
        </button>
        <button
          onClick={() => setView('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium ${view === 'calendar'
            ? 'bg-white text-blue-600 border-t border-l border-r border-gray-300'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <Calendar className="tm-icon" />
          Calendar
        </button>
        <button
          onClick={() => setView('timeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium ${view === 'timeline'
            ? 'bg-white text-blue-600 border-t border-l border-r border-gray-300'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <GitBranch className="tm-icon" />
          Timeline
        </button>
      </div>

      {/* SEARCH AND FILTERS */}
      {selectedProjectId !== 'all' && tasks.length > 0 && (
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 tm-icon text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="tm-icon text-gray-600" />
              <span className="text-gray-700 font-medium">Filters:</span>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {getStatusText(status)}
                </option>
              ))}
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Priority</option>
              {priorityOptions.map(priority => (
                <option key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isFetching && (
        <div className="flex items-center justify-center p-4 mb-6 bg-blue-50 rounded-lg">
          <RefreshCw className="tm-icon mr-2 animate-spin text-blue-600" />
          <span className="text-blue-600 font-medium">Loading tasks...</span>
        </div>
      )}

      {/* NO PROJECT SELECTED STATE */}
      {selectedProjectId === 'all' && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <AlertCircle className="tm-icon-hero mx-auto mb-4 text-gray-400" />
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
          <AlertCircle className="tm-icon-hero mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Found</h3>
          <p className="text-gray-600 mb-6">
            No tasks found for project "{getProjectName(selectedProjectId)}".
            Create your first task or try refreshing.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => openModal()}
              disabled={isProjectLocked}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isProjectLocked
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              {isProjectLocked ? <Icons.Lock className="w-5 h-5" /> : null}
              {isProjectLocked ? 'Project Locked' : 'Create First Task'}
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

      {/* RENDER THE SELECTED VIEW */}
      {selectedProjectId !== 'all' && !isFetching && tasks.length > 0 && renderView()}

      {/* DETAILS PANEL (modal popup) */}
      {selectedTaskDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeDetails}>
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="flex items-center justify-center p-6">
                <RefreshCw className="tm-icon mr-2 animate-spin text-blue-600" />
                <span className="text-blue-600 font-medium">Loading details...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header / Summary */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">Workflow Management</h2>
                    <div className="text-sm text-gray-500">
                      {selectedTaskDetails.title || selectedTaskDetails.name || 'Untitled Task'}
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs md:text-sm">
                      <div>
                        <div className="text-gray-500 uppercase tracking-wide mb-1">Department</div>
                        <div className="font-medium text-gray-900">
                          {selectedTaskDetails.department ||
                            selectedTaskDetails.summary?.department ||
                            selectedTaskDetails.client?.department ||
                            '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 uppercase tracking-wide mb-1">Project</div>
                        <div className="font-medium text-gray-900">{getProjectName(selectedProjectId)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 uppercase tracking-wide mb-1">Priority</div>
                        <div className="font-semibold">
                          <span
                            className={`px-3 py-1 rounded-full text-xs md:text-[11px] inline-flex items-center justify-center ${String(selectedTaskDetails.priority || '')
                              .toLowerCase() === 'high'
                              ? 'bg-red-50 text-red-600 border border-red-100'
                              : String(selectedTaskDetails.priority || '')
                                .toLowerCase() === 'medium'
                                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                : 'bg-gray-50 text-gray-700 border border-gray-200'
                              }`}
                          >
                            {(selectedTaskDetails.priority || '').toString().toUpperCase() || 'NA'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <button
                      onClick={closeDetails}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label="Close"
                    >
                      <X className="tm-icon w-4 h-4" />
                    </button>
                    <div className="flex flex-col items-end gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
                        <Clock4 className="tm-icon w-4 h-4 text-red-500" />
                        <span>
                          {selectedTaskDetails.summary?.sla ||
                            selectedTaskDetails.sla ||
                            selectedTaskDetails.summary?.remainingTime ||
                            '--:--'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 text-right">
                        <div>
                          Created {formatDate(selectedTaskDetails.createdAt || selectedTaskDetails.created_at)}
                        </div>
                        <div>
                          Due {formatDate(selectedTaskDetails.summary?.dueDate || selectedTaskDetails.taskDate || selectedTaskDetails.dueDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workflow summary */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 md:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <GitBranch className="tm-icon w-4 h-4 text-blue-500" />
                      Workflow
                    </h3>
                  </div>

                  {(() => {
                    const rawStatus =
                      selectedTaskDetails?.workflow_state ||
                      selectedTaskDetails?.status ||
                      selectedTaskDetails?.stage ||
                      'PENDING';
                    const normalized = String(rawStatus || '')
                      .replace(/\s+/g, '_')
                      .toUpperCase();
                    const order = ['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'];
                    const currentIndex = order.indexOf(normalized);
                    const nextStep =
                      currentIndex >= 0 && currentIndex < order.length - 1
                        ? order[currentIndex + 1]
                        : null;
                    const currentLabel = getStatusText(rawStatus);
                    const nextLabel = normalized === 'ON_HOLD'
                      ? 'On Hold'
                      : nextStep
                        ? getStatusText(nextStep)
                        : '—';

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div className="rounded-xl bg-white border border-gray-100 p-4">
                          <div className="text-xs text-gray-500 mb-1">Current status</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {currentLabel}
                          </div>
                        </div>
                        <div className="rounded-xl bg-white border border-gray-100 p-4">
                          <div className="text-xs text-gray-500 mb-1">Next step</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {nextLabel}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Main content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left column: Checklist & Attachments */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Checklist */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <CheckSquare className="tm-icon w-4 h-4 text-gray-500" />
                          Checklist
                          <span className="text-xs font-normal text-gray-500">
                            ({detailChecklistCompleted}/{detailChecklistItems.length})
                          </span>
                        </h4>
                      </div>

                      {detailChecklistItems.length ? (
                        <ul className="space-y-2 text-sm text-gray-700">
                          {detailChecklistItems.map((item, idx) => (
                            <li
                              key={item?.id || item?._id || idx}
                              className="flex items-start gap-3 rounded-lg px-2 py-1 hover:bg-gray-50"
                            >
                              <input
                                type="checkbox"
                                checked={!!item?.completed}
                                readOnly
                                className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600"
                              />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {item?.title || item?.name || item?.text || 'Checklist item'}
                                </div>
                                {item?.description && (
                                  <div className="text-xs text-gray-500">{item.description}</div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-gray-500">No checklist items</div>
                      )}
                    </div>

                    {/* Attachments */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <Folder className="tm-icon w-4 h-4 text-gray-500" />
                          Attachments
                        </h4>
                      </div>
                      {detailAttachments.length ? (
                        <div className="space-y-2 text-sm text-gray-700">
                          {detailAttachments.map((file, idx) => (
                            <div
                              key={file?.id || file?._id || file?.name || idx}
                              className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 bg-gray-50"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <ClipboardList className="tm-icon w-4 h-4 text-gray-400" />
                                <span className="truncate">
                                  {file?.name || file?.fileName || file?.title || 'Attachment'}
                                </span>
                              </div>
                              {file?.size && (
                                <span className="text-xs text-gray-400 whitespace-nowrap">{file.size}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No attachments</div>
                      )}
                    </div>
                  </div>

                  {/* Right column: details */}
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Details</h4>
                      <div className="space-y-2 text-xs md:text-sm text-gray-700">
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-500">Status</span>
                          <span className="font-medium">
                            {getStatusText(selectedTaskDetails.status || selectedTaskDetails.stage || '')}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-500">Client</span>
                          <span className="font-medium">
                            {selectedTaskDetails.client?.name || selectedTaskDetails.client || '-'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-500">Assigned</span>
                          <span className="font-medium text-right">
                            {(selectedTaskDetails.assignedUsers || selectedTaskDetails.assigned_users || [])
                              .map((u) => u.name)
                              .join(', ') || 'Unassigned'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-500">Estimated</span>
                          <span className="font-medium">
                            {selectedTaskDetails.estimatedHours ?? selectedTaskDetails.timeAlloted ?? 0} hrs
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-500">Total Hours</span>
                          <span className="font-medium">
                            {selectedTaskDetails.totalHours ?? selectedTaskDetails.total_hours ?? '--'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
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
                aria-label="Close"
              >
                <X className="tm-icon w-4 h-4" />
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
                    <div className="relative">
                      <select
                        value={formData.assigned_to[0] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          assigned_to: e.target.value ? [e.target.value] : []
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                      >
                        <option value="">Select a user</option>
                        {employeeUsers.map((user) => {
                          const uid = user.id || user._id || user.public_id;
                          return (
                            <option key={uid} value={uid}>
                              {user.name}
                            </option>
                          );
                        })}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Selected user preview */}
                    {formData.assigned_to[0] && (() => {
                      const user = employeeUsers.find(u => (u.id || u._id || u.public_id) === formData.assigned_to[0]);
                      return user ? (
                        <div className="mt-2 flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                            {(user.name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{user.name}</div>
                            {user.email && (
                              <div className="text-xs text-gray-500">{user.email}</div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, assigned_to: [] })}
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="Remove assignee"
                          >
                            <X className="tm-icon w-4 h-4" />
                          </button>
                        </div>
                      ) : null;
                    })()}
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