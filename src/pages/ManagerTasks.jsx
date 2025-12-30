import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, AlertCircle, Filter, List, Grid, 
  Calendar, Clock, User, RefreshCw, Eye, CheckCircle,
  ChevronRight, Search, Users, Target, CheckCircle2, X
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';
import { selectUser } from '../redux/slices/authSlice';

const ManagerTasks = () => {
  const user = useSelector(selectUser);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [view, setView] = useState('list');
  const [filterStatus, setFilterStatus] = useState('all');
  const [allUsers, setAllUsers] = useState([]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignTask, setReassignTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [reassignLoading, setReassignLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    assigned_to: [],
    estimated_hours: '',
    due_date: '',
    priority: 'medium',
    status: 'pending'
  });

  const statusOptions = ['pending', 'in_progress', 'completed', 'on_hold'];
  const priorityOptions = ['low', 'medium', 'high'];

  // ✅ Fetch all users for assignment
  const loadAllUsers = useCallback(async () => {
    try {
      const resp = await fetchWithTenant('/api/manager/employees/all');
      
      // Handle different response structures
      let usersData = [];
      if (resp && resp.success && Array.isArray(resp.data)) {
        usersData = resp.data;
      } else if (Array.isArray(resp)) {
        usersData = resp;
      }
      
      // Transform users to consistent format
      const transformedUsers = usersData.map(user => ({
        id: user.id || user._id || user.public_id,
        internalId: user.internalId,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email,
        title: user.title,
        department: user.departmentPublicId
      })).filter(user => user.id && user.name);
      
      setAllUsers(transformedUsers);
      return transformedUsers;
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Failed to load users');
      return [];
    }
  }, []);

  // ✅ Normalize tasks data
  const normalizedTasks = useMemo(() => {
    return tasks.map(task => ({
      ...task,
      id: task.id || task._id,
      projectId: task.project?.id || task.projectId || task.project_id,
      status: task.status || task.stage?.toLowerCase() || 'pending',
      dueDate: task.dueDate || task.taskDate,
      assignedTo: task.assignedUsers?.[0] || task.assignedTo || null,
      assignedUsers: task.assignedUsers || [],
      estimatedHours: task.estimatedHours || task.timeAlloted || 0,
      checklist: task.checklist || [],
      priority: (task.priority || 'medium').toLowerCase()
    }));
  }, [tasks]);

  // ✅ Filter tasks with search
  const filteredTasks = useMemo(() => {
    return normalizedTasks.filter((task) => {
      // Project filter
      if (selectedProjectId !== 'all' && task.projectId !== selectedProjectId) {
        return false;
      }
      
      // Status filter
      if (filterStatus !== 'all' && task.status !== filterStatus) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(query);
        const matchesDescription = task.description?.toLowerCase().includes(query);
        const matchesAssignee = task.assignedTo?.name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription && !matchesAssignee) return false;
      }
      
      return true;
    });
  }, [normalizedTasks, selectedProjectId, filterStatus, searchQuery]);

  // ✅ Load projects
  const loadProjects = useCallback(async () => {
    try {
      const resp = await fetchWithTenant('/api/manager/projects');
      const data = Array.isArray(resp?.data) ? resp.data : resp;
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }, []);

  // ✅ Load tasks
  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = '/api/manager/tasks';
      const params = new URLSearchParams();
      
      if (selectedProjectId !== 'all') {
        params.append('projectId', selectedProjectId);
      }
      
      const queryString = params.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
      
      const resp = await fetchWithTenant(endpoint);
      const data = Array.isArray(resp?.data) ? resp.data : resp;
      setTasks(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load tasks');
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  // ✅ Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadTasks(), loadProjects(), loadAllUsers()]);
    setRefreshing(false);
    toast.success('Tasks refreshed');
  };

  // ✅ Initialize data
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([loadProjects(), loadAllUsers()]);
      await loadTasks();
    };
    initializeData();
  }, []);

  // ✅ Delete task
  const handleDeleteTask = async (task) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const taskId = task.id || task._id;
      await fetchWithTenant(`/api/tasks/${taskId}`, { method: 'DELETE' });
      toast.success('Task deleted successfully');
      loadTasks();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  // ✅ Open create/edit modal
  const openModal = async (task = null) => {
    await loadAllUsers(); // Ensure users are loaded
    
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title || task.name || '',
        description: task.description || '',
        project_id: task.projectId || task.project?.id || selectedProjectId,
        assigned_to: (task.assignedUsers || []).map(u => u.id || u._id),
        estimated_hours: task.estimatedHours || task.timeAlloted || '',
        due_date: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        priority: (task.priority || 'medium').toLowerCase(),
        status: (task.status || task.stage || 'pending').toLowerCase(),
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
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

  // ✅ Close create/edit modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  // ✅ Submit create/edit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        projectId: formData.project_id,
        assigned_to: formData.assigned_to,
        estimatedHours: formData.estimated_hours ? Number(formData.estimated_hours) : 0,
        dueDate: formData.due_date,
        priority: formData.priority.toUpperCase(),
        status: formData.status.toUpperCase(),
      };

      if (editingTask) {
        const taskId = editingTask.id || editingTask._id;
        await fetchWithTenant(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        toast.success('Task updated successfully');
      } else {
        await fetchWithTenant('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        toast.success('Task created successfully');
      }

      closeModal();
      loadTasks();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  // ✅ Open reassign modal
  const openReassignModal = async (task) => {
    setReassignTask(task);
    // Get user IDs from assigned users
    const userIds = (task.assignedUsers || []).map(u => u.id || u._id);
    setFormData(prev => ({ ...prev, assigned_to: userIds }));
    await loadAllUsers(); // Ensure users are loaded
    setShowReassignModal(true);
  };

  // ✅ Close reassign modal
  const closeReassignModal = () => {
    setShowReassignModal(false);
    setReassignTask(null);
  };

  // ✅ Submit reassign form
  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!reassignTask) return;
    
    setReassignLoading(true);
    try {
      const taskId = reassignTask.id || reassignTask._id;
      await fetchWithTenant(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assigned_to: formData.assigned_to,
          title: reassignTask.title || reassignTask.name,
          description: reassignTask.description,
          projectId: reassignTask.projectId,
          estimatedHours: reassignTask.estimatedHours,
          dueDate: reassignTask.dueDate,
          priority: reassignTask.priority,
          status: reassignTask.status
        })
      });
      toast.success('Task reassigned successfully');
      closeReassignModal();
      loadTasks();
    } catch (err) {
      toast.error('Failed to reassign task');
    } finally {
      setReassignLoading(false);
    }
  };

  // ✅ View task details
  const handleViewDetails = (task) => {
    setSelectedTaskDetails(task);
  };

  // ✅ Close details
  const closeDetails = () => {
    setSelectedTaskDetails(null);
  };

  // ✅ Complete task
  const handleCompleteTask = async (task) => {
    try {
      const taskId = task.id || task._id;
      await fetchWithTenant(`/api/tasks/${taskId}/complete`, { method: 'POST' });
      toast.success('Task completed');
      loadTasks();
    } catch (err) {
      toast.error('Failed to complete task');
    }
  };

  // ✅ Utility functions
  const getStatusText = (status) => {
    if (!status) return 'Pending';
    return status.replace('_', ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200';
      case 'in_progress': case 'in progress': return 'bg-blue-100 text-blue-700 border-2 border-blue-200';
      case 'on_hold': return 'bg-red-100 text-red-700 border-2 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-2 border-amber-200';
    }
  };

  const getPriorityColor = (priority) => {
    const priorityLower = (priority || '').toLowerCase();
    switch (priorityLower) {
      case 'high': return 'bg-red-100 text-red-700 border-2 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-2 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-2 border-slate-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  // ✅ Loading state
  if (loading && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-2xl mx-auto animate-spin" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Loading Tasks</h2>
            <p className="text-slate-600">Preparing your task dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Reusable Modal Components
  const TaskModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Task Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter task name"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                placeholder="Enter task description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all"
                >
                  {statusOptions.map(s => (
                    <option key={s} value={s}>{getStatusText(s)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all"
                >
                  {priorityOptions.map(p => (
                    <option key={p} value={p}>{p.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimated_hours}
                  onChange={e => setFormData({ ...formData, estimated_hours: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="e.g., 8"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Assign Users <span className="text-red-500">*</span>
              </label>
              <select
                multiple
                required
                value={formData.assigned_to}
                onChange={e => {
                  const options = Array.from(e.target.selectedOptions, opt => opt.value);
                  setFormData({ ...formData, assigned_to: options });
                }}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32 transition-all"
              >
                {allUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} {user.email ? `(${user.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-2xl hover:bg-slate-50 font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:shadow-xl font-semibold transition-all"
            >
              {editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const ReassignModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Reassign Task
          </h2>
          <button
            onClick={closeReassignModal}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleReassignSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Assign Users <span className="text-red-500">*</span>
              </label>
              <select
                multiple
                required
                value={formData.assigned_to}
                onChange={e => {
                  const options = Array.from(e.target.selectedOptions, opt => opt.value);
                  setFormData({ ...formData, assigned_to: options });
                }}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32 transition-all"
              >
                {allUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} {user.email ? `(${user.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={closeReassignModal}
              className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-2xl hover:bg-slate-50 font-semibold transition-all"
              disabled={reassignLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl hover:shadow-xl font-semibold transition-all"
              disabled={reassignLoading}
            >
              {reassignLoading ? 'Reassigning...' : 'Reassign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const DetailsModal = () => {
    const task = selectedTaskDetails;
    if (!task) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Task Details</h2>
            <button onClick={closeDetails} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {task.title || task.name}
                </h3>
                {task.description && (
                  <p className="text-slate-600 mb-5">{task.description}</p>
                )}
                <div className="flex items-center gap-3 mb-5">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(task.status)}`}>
                    {getStatusText(task.status)}
                  </span>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${getPriorityColor(task.priority)}`}>
                    {(task.priority || 'medium').toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-right bg-slate-50 rounded-2xl p-4">
                <div className="text-sm text-slate-600 mb-2">
                  Project: <span className="font-bold text-slate-900">
                    {projects.find(p => (p.id || p._id) === task.projectId)?.name || task.project?.name || 'N/A'}
                  </span>
                </div>
                <div className="text-sm text-slate-600">
                  Due: <span className="font-bold text-slate-900">
                    {formatDate(task.dueDate)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-blue-600" />
                <h4 className="font-bold text-slate-900">Assigned Users</h4>
              </div>
              <div className="flex flex-wrap gap-3">
                {task.assignedUsers?.length > 0 ? (
                  task.assignedUsers.map((user, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border-2 border-blue-200">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="font-semibold text-slate-900">{user.name || 'Unknown'}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm italic">Unassigned</span>
                )}
              </div>
            </div>

            {task.checklist?.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <h4 className="font-bold text-slate-900">
                    Checklist ({task.checklist.length} items)
                  </h4>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {task.checklist.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-emerald-100">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        item.status === 'Completed' 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {item.status === 'Completed' ? '✓' : '○'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        {item.dueDate && (
                          <p className="text-xs text-slate-500 mt-1">
                            Due: {formatDate(item.dueDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {task.activityTimeline?.length > 0 && (
              <div className="border-2 border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-white" />
                    <h4 className="font-bold text-white">Activity Timeline</h4>
                  </div>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {task.activityTimeline.map((activity, idx) => (
                    <div key={idx} className="p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900">{activity.action || 'Activity'}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {activity.user?.name ? `${activity.user.name} • ` : ''}
                            {formatDate(activity.createdAt || activity.timestamp)}
                          </p>
                          {activity.description && (
                            <p className="text-sm text-slate-600 mt-2">{activity.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-6 border-t-2 border-slate-200">
              <button
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-semibold transition-all"
                onClick={closeDetails}
              >
                Close
              </button>
              <button
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:shadow-lg text-white rounded-2xl font-semibold transition-all flex items-center gap-2"
                onClick={() => { 
                  openReassignModal(task);
                  closeDetails();
                }}
              >
                <Users size={18} />
                Reassign
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-4xl font-bold">Task Management</h1>
            <p className="text-slate-600 mt-2">Manage and track tasks across your projects</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 shadow-sm hover:shadow-md transition-all"
              />
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200 px-5 py-3 rounded-2xl hover:bg-white hover:shadow-md transition-all font-medium text-slate-700 hover:text-blue-600"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200/50 p-6 hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
                <Target size={22} />
              </div>
              <div className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                +12%
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{tasks.length}</div>
            <div className="text-sm text-slate-600 font-medium">Total Tasks</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200/50 p-6 hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
                <CheckCircle size={22} />
              </div>
              <div className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                +8%
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {tasks.filter(t => (t.status || '').toLowerCase() === 'completed').length}
            </div>
            <div className="text-sm text-slate-600 font-medium">Completed</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200/50 p-6 hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/50 transition-shadow">
                <Clock size={22} />
              </div>
              <div className="text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                Active
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {tasks.filter(t => (t.status || '').toLowerCase() === 'in_progress').length}
            </div>
            <div className="text-sm text-slate-600 font-medium">In Progress</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200/50 p-6 hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-shadow">
                <AlertCircle size={22} />
              </div>
              <div className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                Urgent
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {tasks.filter(t => (t.status || '').toLowerCase() === 'pending').length}
            </div>
            <div className="text-sm text-slate-600 font-medium">Pending Review</div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200/50 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Project Selector */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Project
              </label>
              <div className="relative">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer hover:bg-slate-100 transition-colors font-medium"
                >
                  <option value="all">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id || project._id} value={project.id || project._id}>
                      {project.name || project.title}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 transform -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={18} />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Filter by Status
              </label>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer hover:bg-slate-100 transition-colors font-medium"
                >
                  <option value="all">All Status</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {getStatusText(status)}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              </div>
            </div>

            {/* View Toggle */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                View Mode
              </label>
              <div className="flex border-2 border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                <button
                  onClick={() => setView('list')}
                  className={`px-5 py-2.5 font-medium transition-all ${view === 'list' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'bg-transparent text-slate-600 hover:bg-slate-100'}`}
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => setView('card')}
                  className={`px-5 py-2.5 font-medium transition-all ${view === 'card' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'bg-transparent text-slate-600 hover:bg-slate-100'}`}
                >
                  <Grid size={18} />
                </button>
              </div>
            </div>

            {/* Add Task Button */}
            <div className="flex items-end">
              <button
                onClick={() => openModal()}
                disabled={selectedProjectId === 'all'}
                className={`px-6 py-3 rounded-2xl font-semibold transition-all flex items-center gap-2 shadow-lg ${
                  selectedProjectId === 'all'
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:scale-105'
                }`}
              >
                <Plus size={20} />
                Add Task
              </button>
            </div>
          </div>
        </div>

        {/* No Project Selected State */}
        {selectedProjectId === 'all' && !error && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-300 p-12 text-center shadow-lg">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-6">
              <Target className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Select a Project</h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Please select a project from the dropdown above to view and manage tasks.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {projects.slice(0, 5).map((project) => (
                <button
                  key={project.id || project._id}
                  onClick={() => setSelectedProjectId(project.id || project._id)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-2xl hover:from-blue-100 hover:to-indigo-100 transition-all border-2 border-blue-200 font-semibold hover:shadow-lg"
                >
                  {project.name || project.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Tasks State */}
        {selectedProjectId !== 'all' && filteredTasks.length === 0 && !loading && !error && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-300 p-12 text-center shadow-lg">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 mb-6">
              <AlertCircle className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No Tasks Found</h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              No tasks found for the selected project and filters.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => openModal()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:shadow-xl transition-all font-semibold"
              >
                Create First Task
              </button>
              <button
                onClick={handleRefresh}
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all border-2 border-slate-300 font-semibold"
              >
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* LIST VIEW */}
        {selectedProjectId !== 'all' && filteredTasks.length > 0 && view === 'list' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                    <th className="p-5 text-left font-bold text-slate-700">Task</th>
                    <th className="p-5 text-left font-bold text-slate-700">Assigned To</th>
                    <th className="p-5 text-left font-bold text-slate-700">Status</th>
                    <th className="p-5 text-left font-bold text-slate-700">Priority</th>
                    <th className="p-5 text-left font-bold text-slate-700">Due Date</th>
                    <th className="p-5 text-left font-bold text-slate-700">Hours</th>
                    <th className="p-5 text-right font-bold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-slate-100 hover:bg-blue-50/50 transition-all cursor-pointer group"
                      onClick={() => handleViewDetails(task)}
                    >
                      <td className="p-5">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {task.title || task.name}
                        </div>
                        {task.description && (
                          <div className="text-sm text-slate-500 mt-1 line-clamp-2">
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                            {(task.assignedTo?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-slate-700 font-medium">
                            {task.assignedTo?.name || 'Unassigned'}
                          </span>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(task.status)}`}>
                          {getStatusText(task.status)}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getPriorityColor(task.priority)}`}>
                          {(task.priority || 'medium').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium">
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium">
                            {task.estimatedHours || 0}h
                          </span>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); openModal(task); }}
                            className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                            title="Edit task"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openReassignModal(task); }}
                            className="p-2.5 text-amber-600 hover:bg-amber-100 rounded-xl transition-all"
                            title="Reassign task"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                          {task.status === 'in_progress' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCompleteTask(task); }}
                              className="p-2.5 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all"
                              title="Complete task"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task); }}
                            className="p-2.5 text-red-600 hover:bg-red-100 rounded-xl transition-all"
                            title="Delete task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CARD VIEW */}
        {selectedProjectId !== 'all' && filteredTasks.length > 0 && view === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200/50 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group"
                onClick={() => handleViewDetails(task)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {task.title || task.name}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-5">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(task.status)}`}>
                    {getStatusText(task.status)}
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getPriorityColor(task.priority)}`}>
                    {(task.priority || 'medium').toUpperCase()}
                  </span>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                      {(task.assignedTo?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{task.assignedTo?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <div className="p-1.5 rounded-lg bg-slate-100">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{formatDate(task.dueDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <div className="p-1.5 rounded-lg bg-slate-100">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{task.estimatedHours || 0} hours</span>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-slate-100">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-slate-500 font-medium">
                      {projects.find(p => (p.id || p._id) === task.projectId)?.name || 'Selected Project'}
                    </div>
                    <div className="flex gap-1">
                      {task.status === 'in_progress' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCompleteTask(task); }}
                          className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all"
                          title="Complete task"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); openModal(task); }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                        title="Edit task"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openReassignModal(task); }}
                        className="p-2 text-amber-600 hover:bg-amber-100 rounded-xl transition-all"
                        title="Reassign task"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(task); }}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-all"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Render Modals */}
        {isModalOpen && <TaskModal />}
        {showReassignModal && <ReassignModal />}
        {selectedTaskDetails && <DetailsModal />}
      </div>
    </div>
  );
};

export default ManagerTasks;