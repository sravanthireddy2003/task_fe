import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';
import { selectUser } from '../redux/slices/authSlice';
import { AlertCircle, CheckCircle, XCircle, Play, Pause, RotateCcw, Check, Clock, Kanban, List, CheckSquare, MessageSquare, Plus, Send, User, Calendar, RefreshCw, Eye, Filter, ChevronDown } from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';
import ReassignTaskRequestModal from './ReassignTaskRequest';

const formatDateString = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatForInput = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
};

const formatDuration = (seconds) => {
  if (!seconds) return '0h';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const normalizeId = (entity) =>
  entity?.id || entity?._id || entity?.public_id || entity?.task_id || '';

// Status text mapping
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
    'To Do': 'To Do',
    'In Progress': 'In Progress',
    'Review': 'Review',
    'Completed': 'Completed',
    'On Hold': 'On Hold'
  };
  return statusMap[status] || status || 'Pending';
};

// Get status color classes
const getStatusClasses = (status) => {
  const normalizedStatus = (status || '').toUpperCase();
  switch (normalizedStatus) {
    case 'PENDING':
    case 'TO DO':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'ON_HOLD':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'REVIEW':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Get priority color classes
const getPriorityClasses = (priority) => {
  const normalizedPriority = (priority || 'MEDIUM').toUpperCase();
  switch (normalizedPriority) {
    case 'HIGH':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'MEDIUM':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'LOW':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-amber-100 text-amber-800 border-amber-200';
  }
};

const EmployeeTasks = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const userRole = user?.role?.toLowerCase();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [kanbanData, setKanbanData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState(userRole === 'employee' ? 'kanban' : 'list');
  
  // New checklist functionality states
  const [checklistForm, setChecklistForm] = useState({ title: '', dueDate: '' });
  const [editingChecklistId, setEditingChecklistId] = useState('');
  const [editingChecklistValues, setEditingChecklistValues] = useState({ title: '', dueDate: '' });
  const [actionRunning, setActionRunning] = useState(false);
  
  // Existing states
  const [selectedTaskForReassignment, setSelectedTaskForReassignment] = useState(null);
  const [checklists, setChecklists] = useState({});
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [reassignmentRequests, setReassignmentRequests] = useState({});
  const [taskTimelines, setTaskTimelines] = useState({});
  const [selectedTaskForTimeline, setSelectedTaskForTimeline] = useState(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Status options for filter
  const statusOptions = ['all', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'TO DO'];

  const loadProjects = async () => {
    try {
      const response = await fetchWithTenant('/api/projects');
      const data = response?.data || response || [];
      if (Array.isArray(data)) {
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id || data[0]._id || data[0].public_id);
        }
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const loadTasks = async (projectId) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (userRole === 'employee') {
        response = await fetchWithTenant('/api/employee/my-tasks');
      } else {
        if (!projectId) return;
        response = await fetchWithTenant('/api/projects/' + projectId + '/tasks');
      }
      
      const data = response?.data || response || [];
      const taskList = Array.isArray(data) ? data : (data.tasks || []);
      
      // Process kanban data and normalize uppercase status values
      let kanbanList = response?.kanban || data?.kanban || [];
      if (Array.isArray(kanbanList)) {
        kanbanList = kanbanList.map(group => ({
          ...group,
          status: group.status.toLowerCase().replace(/\s+/g, '_').toUpperCase()
        }));
      }
      
      if (Array.isArray(taskList)) {
        setTasks(taskList);
        setKanbanData(kanbanList);
        console.log('Kanban Data Set:', kanbanList);
        if (userRole !== 'employee') {
          taskList.forEach(task => {
            const taskId = normalizeId(task);
            if (taskId && task.checklist && task.checklist.length > 0) {
              setChecklists(prev => ({
                ...prev,
                [taskId]: task.checklist
              }));
            }
          });
        }
      } else {
        setTasks([]);
        setKanbanData([]);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadReassignmentRequests = async (projectId) => {
    if (!projectId || tasks.length === 0) return;

    try {
      const requestsMap = {};
      
      // Fetch reassignment requests for each task
      for (const task of tasks) {
        try {
          const taskId = task.id || task._id || task.public_id;
          if (!taskId) continue;
          
          const response = await fetchWithTenant(`/api/tasks/${taskId}/reassign-requests`);
          if (response?.success && response.request) {
            requestsMap[taskId] = {
              id: response.request.id,
              taskId: response.request.task_id,
              status: response.request.status,
              requested_at: response.request.requested_at,
              responded_at: response.request.responded_at,
            };
          }
        } catch (error) {
          // Continue if individual task request fails
          continue;
        }
      }
      
      setReassignmentRequests(requestsMap);
    } catch (error) {
      console.error('Failed to load reassignment requests:', error);
    }
  };

  const loadTaskTimeline = async (taskId) => {
    try {
      // Ensure taskId is an integer, no public_id fallback
      const taskIdInt = parseInt(taskId, 10);
      if (isNaN(taskIdInt)) {
        console.warn('Invalid task ID for timeline:', taskId);
        return;
      }
      const response = await fetchWithTenant(`/api/tasks/${taskIdInt}/timeline`);
      if (response?.success && response.data) {
        setTaskTimelines(prev => ({
          ...prev,
          [taskIdInt]: response.data
        }));
      }
    } catch (error) {
      console.error('Failed to load task timeline:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const resp = await fetchWithTenant('/api/manager/employees/all');
      const data = Array.isArray(resp?.data) ? resp.data : resp;
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  useEffect(() => {
    loadProjects();
    if (userRole !== 'employee') {
      loadEmployees();
    }
  }, []);

  useEffect(() => {
    if (userRole === 'employee') {
      loadTasks();
    } else if (selectedProjectId) {
      loadTasks(selectedProjectId);
      loadReassignmentRequests(selectedProjectId);
    }
  }, [selectedProjectId, userRole]);

  // Filter tasks based on status
  const filteredTasks = useMemo(() => {
    if (filterStatus === 'all') return tasks;
    return tasks.filter(task => {
      const taskStatus = (task.status || task.stage || '').toUpperCase();
      const filterStatusUpper = filterStatus.toUpperCase();
      if (filterStatusUpper === 'TO DO') {
        return taskStatus === 'TO DO' || taskStatus === 'PENDING';
      }
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
      'review': 0,
      'to_do': 0
    };
   
    tasks.forEach(task => {
      const status = (task.status || task.stage || 'pending').toLowerCase();
      if (status === 'to do') {
        counts['to_do']++;
      } else if (counts.hasOwnProperty(status)) {
        counts[status]++;
      } else if (status === 'pending') {
        counts['pending']++;
      }
    });
   
    return counts;
  };

  // Helper to update task state locally after an action
  const updateLocalTaskState = (taskId, updates) => {
    setTasks(prev => {
      const taskIndex = prev.findIndex(t => normalizeId(t) === taskId);
      if (taskIndex === -1) return prev;
      
      const oldTask = prev[taskIndex];
      const updatedTask = { ...oldTask, ...updates };
      const newTasks = [...prev];
      newTasks[taskIndex] = updatedTask;

      // Update kanbanData
      setKanbanData(prevKanban => {
        if (!prevKanban || !Array.isArray(prevKanban)) return prevKanban;
        const oldStatus = oldTask.status || oldTask.stage;
        const newStatus = updates.status || updates.stage || oldStatus;
        
        return prevKanban.map(group => {
          // Remove from old group if status changed
          if (group.status === oldStatus && oldStatus !== newStatus) {
            return {
              ...group,
              tasks: group.tasks.filter(t => normalizeId(t) !== taskId),
              count: Math.max(0, (group.count || 0) - 1)
            };
          }
          // Add to new group if status changed
          if (group.status === newStatus && oldStatus !== newStatus) {
            return {
              ...group,
              tasks: [...(group.tasks || []), updatedTask],
              count: (group.count || 0) + 1
            };
          }
          // Update within same group if status didn't change
          if (group.status === oldStatus && oldStatus === newStatus) {
            return {
              ...group,
              tasks: group.tasks.map(t => normalizeId(t) === taskId ? updatedTask : t)
            };
          }
          return group;
        });
      });

      // Update selectedTask if it's the one being updated
      if (selectedTask && normalizeId(selectedTask) === taskId) {
        setSelectedTask(updatedTask);
      }

      return newTasks;
    });
  };

  // Task action functions
  const handleStartTask = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId || t._id === taskId || t.public_id === taskId);
      const publicId = task?.public_id || taskId;
      const resp = await fetchWithTenant(`/api/tasks/${publicId}/start`, {
        method: 'POST'
      });
      toast.success(resp?.message || 'Task started');
      if (resp?.data) {
        const updateData = {
          status: resp.data.status || 'In Progress',
          started_at: resp.data.started_at
        };
        updateLocalTaskState(taskId, updateData);
      } else {
        updateLocalTaskState(taskId, { status: 'In Progress' });
      }
      if (task?.id) {
        loadTaskTimeline(task.id);
      }
      // Reload tasks and kanban board
      await loadTasks(selectedProjectId);
    } catch (error) {
      toast.error(error?.message || 'Failed to start task');
    }
  };

  const handlePauseTask = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId || t._id === taskId || t.public_id === taskId);
      const publicId = task?.public_id || taskId;
      const resp = await fetchWithTenant(`/api/tasks/${publicId}/pause`, {
        method: 'POST'
      });
      toast.success(resp?.message || 'Task paused');
      if (resp?.data) {
        const updateData = {
          status: resp.data.status || 'On Hold',
          total_duration: resp.data.total_time_seconds || resp.data.total_duration
        };
        updateLocalTaskState(taskId, updateData);
      } else {
        updateLocalTaskState(taskId, { status: 'On Hold' });
      }
      if (task?.id) {
        loadTaskTimeline(task.id);
      }
      // Reload tasks and kanban board
      await loadTasks(selectedProjectId);
    } catch (error) {
      toast.error('Failed to pause task');
    }
  };

  const handleResumeTask = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId || t._id === taskId || t.public_id === taskId);
      const publicId = task?.public_id || taskId;
      const resp = await fetchWithTenant(`/api/tasks/${publicId}/resume`, {
        method: 'POST'
      });
      toast.success(resp?.message || 'Task resumed');
      if (resp?.data) {
        const updateData = {
          status: resp.data.status || 'In Progress',
          started_at: resp.data.started_at
        };
        updateLocalTaskState(taskId, updateData);
      } else {
        updateLocalTaskState(taskId, { status: 'In Progress' });
      }
      if (task?.id) {
        loadTaskTimeline(task.id);
      }
      // Reload tasks and kanban board
      await loadTasks(selectedProjectId);
    } catch (error) {
      toast.error('Failed to resume task');
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId || t._id === taskId || t.public_id === taskId);
      const publicId = task?.public_id || taskId;
      const resp = await fetchWithTenant(`/api/tasks/${publicId}/complete`, {
        method: 'POST'
      });
      toast.success(resp?.message || 'Task completed');
      if (resp?.data) {
        const updateData = {
          status: resp.data.status || 'Completed',
          total_duration: resp.data.total_time_seconds || resp.data.total_duration
        };
        updateLocalTaskState(taskId, updateData);
      } else {
        updateLocalTaskState(taskId, { status: 'Completed' });
      }
      if (task?.id) {
        loadTaskTimeline(task.id);
      }
      // Reload tasks and kanban board
      await loadTasks(selectedProjectId);
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  const handleMoveToReview = async (taskId) => {
    try {
      await fetchWithTenant('/api/tasks/' + taskId + '/status', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Review',
          projectId: selectedProjectId,
          taskId: taskId
        })
      });
      toast.success('Task moved to review');
      loadTasks(selectedProjectId);
    } catch (error) {
      toast.error('Failed to move task to review');
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const response = await fetchWithTenant(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...updates,
          projectId: selectedProjectId,
          taskId: taskId
        })
      });

      if (response?.success) {
        const task = tasks.find(t => (t.id || t._id || t.public_id) === taskId);
        if (task) {
          const updatedTask = { ...task, ...updates };
          setTasks(prev => prev.map(t => (t.id || t._id || t.public_id) === taskId ? updatedTask : t));
          
          // Update kanbanData
          setKanbanData(prev => {
            if (!prev || !Array.isArray(prev)) return prev;
            const oldStatus = task.status || task.stage;
            const newStatus = updates.status || updates.stage;
            return prev.map(group => {
              if (group.status === oldStatus) {
                return {
                  ...group,
                  tasks: group.tasks.filter(t => (t.id || t._id || t.public_id) !== taskId),
                  count: Math.max(0, (group.count || 0) - 1)
                };
              }
              if (group.status === newStatus) {
                return {
                  ...group,
                  tasks: [...(group.tasks || []), updatedTask],
                  count: (group.count || 0) + 1
                };
              }
              return group;
            });
          });
        }
        toast.success(`Task status updated to ${updates.status}`);
        loadTaskTimeline(taskId);
      } else {
        toast.error(response?.message || 'Failed to update task status');
        throw new Error(response?.message || 'Failed to update task');
      }
    } catch (error) {
      toast.error('Failed to update task status');
      throw error;
    }
  };

  // NEW CHECKLIST FUNCTIONS
  const handleAddChecklist = async (event) => {
    event.preventDefault();
    if (!selectedTask) {
      toast.error('Select a task before adding checklist items');
      return;
    }
    if (!checklistForm.title.trim()) {
      toast.error('Checklist title is required');
      return;
    }
    setActionRunning(true);
    try {
      const payload = {
        taskId: normalizeId(selectedTask),
        title: checklistForm.title.trim(),
        dueDate: checklistForm.dueDate || undefined,
      };
      const resp = await fetchWithTenant('/api/employee/subtask', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const newChecklistItem = resp.data;
      toast.success(resp?.message || 'Checklist item added');
      setChecklistForm({ title: '', dueDate: '' });

      // Update tasks state locally
      const selectedTaskId = normalizeId(selectedTask);
      setTasks(prevTasks => prevTasks.map(task =>
        normalizeId(task) === selectedTaskId
          ? { ...task, checklist: [...(task.checklist || []), newChecklistItem] }
          : task
      ));

      // Update kanbanData
      setKanbanData(prev => {
        if (!prev || !Array.isArray(prev)) return prev;
        return prev.map(group => {
          const taskIndex = group.tasks.findIndex(t => normalizeId(t) === selectedTaskId);
          if (taskIndex !== -1) {
            const updatedTask = { ...group.tasks[taskIndex], checklist: [...(group.tasks[taskIndex].checklist || []), newChecklistItem] };
            const newTasks = [...group.tasks];
            newTasks[taskIndex] = updatedTask;
            return { ...group, tasks: newTasks };
          }
          return group;
        });
      });

      // Update checklists state
      setChecklists(prev => ({
        ...prev,
        [selectedTaskId]: [...(prev[selectedTaskId] || []), newChecklistItem]
      }));
    } catch (err) {
      toast.error(err?.message || 'Unable to add checklist item');
    } finally {
      setActionRunning(false);
    }
  };

  const startEditingChecklist = (item) => {
    const itemId = normalizeId(item);
    if (!itemId) return;
    setEditingChecklistId(itemId);
    setEditingChecklistValues({
      title: item.title || item.name || '',
      dueDate: formatForInput(item.dueDate || item.due_date || item.date),
    });
  };

  const cancelEditing = () => {
    setEditingChecklistId('');
    setEditingChecklistValues({ title: '', dueDate: '' });
  };

  const handleUpdateChecklist = async () => {
    if (!editingChecklistId || !selectedTask) return;
    if (!editingChecklistValues.title.trim()) {
      toast.error('Checklist title cannot be empty');
      return;
    }
    setActionRunning(true);
    try {
      const payload = {
        title: editingChecklistValues.title.trim(),
        dueDate: editingChecklistValues.dueDate || undefined,
        taskId: normalizeId(selectedTask),
      };
      const resp = await fetchWithTenant(`/api/employee/subtask/${encodeURIComponent(editingChecklistId)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const updatedChecklistItem = resp.data;
      toast.success(resp?.message || 'Checklist item updated');
      cancelEditing();

      // Update tasks state locally
      const selectedTaskId = normalizeId(selectedTask);
      setTasks(prevTasks => prevTasks.map(task =>
        normalizeId(task) === selectedTaskId
          ? {
              ...task,
              checklist: (task.checklist || []).map(item =>
                normalizeId(item) === editingChecklistId ? updatedChecklistItem : item
              )
            }
          : task
      ));

      // Update kanbanData
      setKanbanData(prev => {
        if (!prev || !Array.isArray(prev)) return prev;
        return prev.map(group => {
          const taskIndex = group.tasks.findIndex(t => normalizeId(t) === selectedTaskId);
          if (taskIndex !== -1) {
            const updatedTask = { ...group.tasks[taskIndex], checklist: (group.tasks[taskIndex].checklist || []).map(item => normalizeId(item) === editingChecklistId ? updatedChecklistItem : item) };
            const newTasks = [...group.tasks];
            newTasks[taskIndex] = updatedTask;
            return { ...group, tasks: newTasks };
          }
          return group;
        });
      });

      // Update checklists state
      setChecklists(prev => ({
        ...prev,
        [selectedTaskId]: (prev[selectedTaskId] || []).map(item =>
          normalizeId(item) === editingChecklistId ? updatedChecklistItem : item
        )
      }));
    } catch (err) {
      toast.error(err?.message || 'Unable to update checklist item');
    } finally {
      setActionRunning(false);
    }
  };

  const handleDeleteChecklist = async (item) => {
    const itemId = normalizeId(item);
    if (!itemId) return;
    if (!window.confirm('Remove this checklist item?')) return;
    setActionRunning(true);
    try {
      const resp = await fetchWithTenant(`/api/employee/subtask/${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
      });
      toast.success(resp?.message || 'Checklist item removed');

      // Update tasks state locally
      const selectedTaskId = normalizeId(selectedTask);
      setTasks(prevTasks => prevTasks.map(task =>
        normalizeId(task) === selectedTaskId
          ? {
              ...task,
              checklist: (task.checklist || []).filter(item => normalizeId(item) !== itemId)
            }
          : task
      ));

      // Update kanbanData
      setKanbanData(prev => {
        if (!prev || !Array.isArray(prev)) return prev;
        return prev.map(group => {
          const taskIndex = group.tasks.findIndex(t => normalizeId(t) === selectedTaskId);
          if (taskIndex !== -1) {
            const updatedTask = { ...group.tasks[taskIndex], checklist: (group.tasks[taskIndex].checklist || []).filter(item => normalizeId(item) !== itemId) };
            const newTasks = [...group.tasks];
            newTasks[taskIndex] = updatedTask;
            return { ...group, tasks: newTasks };
          }
          return group;
        });
      });

      // Update checklists state
      setChecklists(prev => ({
        ...prev,
        [selectedTaskId]: (prev[selectedTaskId] || []).filter(item => normalizeId(item) !== itemId)
      }));
    } catch (err) {
      toast.error(err?.message || 'Unable to delete checklist item');
    } finally {
      setActionRunning(false);
    }
  };

  const handleCompleteChecklist = async (item) => {
    const itemId = normalizeId(item);
    if (!itemId) return;
    setActionRunning(true);
    try {
      const resp = await fetchWithTenant(`/api/employee/subtask/${encodeURIComponent(itemId)}/complete`, {
        method: 'POST',
      });
      const updatedChecklistItem = resp.data;
      toast.success(resp?.message || 'Checklist marked complete');

      // Update tasks state locally
      const selectedTaskId = normalizeId(selectedTask);
      setTasks(prevTasks => prevTasks.map(task =>
        normalizeId(task) === selectedTaskId
          ? {
              ...task,
              checklist: (task.checklist || []).map(item =>
                normalizeId(item) === itemId ? updatedChecklistItem : item
              )
            }
          : task
      ));

      // Update kanbanData
      setKanbanData(prev => {
        if (!prev || !Array.isArray(prev)) return prev;
        return prev.map(group => {
          const taskIndex = group.tasks.findIndex(t => normalizeId(t) === selectedTaskId);
          if (taskIndex !== -1) {
            const updatedTask = { ...group.tasks[taskIndex], checklist: (group.tasks[taskIndex].checklist || []).map(item => normalizeId(item) === itemId ? updatedChecklistItem : item) };
            const newTasks = [...group.tasks];
            newTasks[taskIndex] = updatedTask;
            return { ...group, tasks: newTasks };
          }
          return group;
        });
      });

      // Update checklists state
      setChecklists(prev => ({
        ...prev,
        [selectedTaskId]: (prev[selectedTaskId] || []).map(item =>
          normalizeId(item) === itemId ? updatedChecklistItem : item
        )
      }));
    } catch (err) {
      toast.error(err?.message || 'Unable to update checklist status');
    } finally {
      setActionRunning(false);
    }
  };

  // Existing functions
  const handleOpenTimeline = (task) => {
    setSelectedTaskForTimeline(task);
    loadTaskTimeline(normalizeId(task));
    setShowTimelineModal(true);
  };

  const handleReassignTask = async () => {
    if (!selectedTask || !selectedAssignee) {
      toast.error('Select an employee to reassign the task.');
      return;
    }
    setReassigning(true);
    try {
      const taskId = normalizeId(selectedTask);
      const payload = {
        assigned_to: [selectedAssignee],
        projectId: selectedProjectId,
      };
      const resp = await fetchWithTenant(`/api/projects/tasks/${encodeURIComponent(taskId)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      toast.success(resp?.message || 'Task reassigned successfully');
     
      // Update local task state
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
      }));
     
      loadTasks(selectedProjectId);
    } catch (err) {
      toast.error(err?.message || 'Unable to reassign task');
    } finally {
      setReassigning(false);
    }
  };

  // Get assigned users string
  const getAssignedUsers = (task) => {
    if (Array.isArray(task.assignedUsers) && task.assignedUsers.length) {
      return task.assignedUsers.map(u => u.name).join(', ');
    }
    if (Array.isArray(task.assigned_to) && task.assigned_to.length) {
      const assignedNames = task.assigned_to.map(id => {
        const employee = employees.find(emp => 
          String(emp.internalId || emp.id || emp._id || emp.public_id) === String(id)
        );
        return employee?.name || employee?.email || 'Unassigned';
      });
      return assignedNames.join(', ');
    }
    return 'Unassigned';
  };

  const selectedProject = projects.find(p =>
    (p.id || p._id || p.public_id) === selectedProjectId
  );

  // Get selected task checklist
  const selectedTaskChecklist = useMemo(() => {
    if (!selectedTask) return [];
    return (
      selectedTask.checklist ||
      selectedTask.checkList ||
      selectedTask.items ||
      selectedTask.subtasks ||
      []
    );
  }, [selectedTask]);

  // Get selected task details
  const detailProject = selectedTask?.project || selectedTask?.meta?.project;
  const formattedDue = useMemo(() => {
    if (!selectedTask) return '—';
    const raw = selectedTask.taskDate || selectedTask.due_date || selectedTask.dueDate;
    if (!raw) return '—';
    return formatDateString(raw);
  }, [selectedTask]);

  // Stats for dashboard
  const stats = useMemo(() => {
    const stageCounters = { pending: 0, in_progress: 0, completed: 0, review: 0, on_hold: 0, to_do: 0 };
    const overdue = [];
    const now = Date.now();
    tasks.forEach((task) => {
      const stage = (task.stage || task.status || 'pending').toString().toLowerCase();
      if (stageCounters[stage] !== undefined) {
        stageCounters[stage] += 1;
      } else if (stage === 'to do') {
        stageCounters['to_do'] += 1;
      } else if (stage === 'review') {
        stageCounters['review'] += 1;
      }
      const dueDate = new Date(task.taskDate || task.dueDate || task.due_date || null);
      if (!Number.isNaN(dueDate.getTime()) && dueDate.getTime() < now && stage !== 'completed') {
        overdue.push(task);
      }
    });
    return {
      total: tasks.length,
      overdue: overdue.length,
      stageCounters,
    };
  }, [tasks]);

  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {userRole === 'employee' ? 'My Tasks' : 'Tasks'}
          </h1>
          <p className="text-gray-600">
            {userRole === 'employee' 
              ? 'Track your assignments and keep checklists aligned with manager expectations.'
              : 'Manage and track all tasks across projects.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Project Selector (only for non-employee) */}
          {userRole !== 'employee' && (
            <div className="relative">
              <select
                value={selectedProjectId || ""}
                onChange={(e) => setSelectedProjectId(e.target.value)}
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
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* View Toggle (only for employee) */}
          {userRole === 'employee' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('kanban')}
                className={`px-3 py-2 rounded-lg border ${
                  view === 'kanban'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Kanban className="w-4 h-4 mr-2 inline" />
                Kanban
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-2 rounded-lg border ${
                  view === 'list'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4 mr-2 inline" />
                List
              </button>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => userRole === 'employee' ? loadTasks() : loadTasks(selectedProjectId)}
            disabled={loading || (userRole !== 'employee' && !selectedProjectId)}
            className={`p-2 rounded-lg border ${
              loading || (userRole !== 'employee' && !selectedProjectId)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-600 hover:bg-blue-50 border-blue-200'
            }`}
            title="Refresh tasks"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* STATS SECTION - Updated with new stats */}
      {((userRole === 'employee') || (selectedProjectId && tasks.length > 0)) && (
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Total</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Current assignments</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-500">Overdue</p>
            <p className="text-2xl font-semibold text-amber-500">{stats.overdue}</p>
            <p className="text-xs text-gray-500">Need immediate attention</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-blue-500">In progress</p>
            <p className="text-2xl font-semibold text-blue-500">{stats.stageCounters.in_progress}</p>
            <p className="text-xs text-gray-500">Work you are handling</p>
          </div>
        </div>
      )}

      {/* STATUS SUMMARY */}
      {((userRole === 'employee' && tasks.length > 0) || (selectedProjectId && tasks.length > 0)) && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="px-4 py-2 rounded-lg bg-yellow-100 text-yellow-800 font-semibold shadow-sm border border-yellow-200">
            Pending: {stats.stageCounters.pending + stats.stageCounters.to_do}
          </div>
          <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-semibold shadow-sm border border-blue-200">
            In Progress: {stats.stageCounters.in_progress}
          </div>
          <div className="px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold shadow-sm border border-green-200">
            Completed: {stats.stageCounters.completed}
          </div>
          <div className="px-4 py-2 rounded-lg bg-red-100 text-red-800 font-semibold shadow-sm border border-red-200">
            On Hold: {stats.stageCounters.on_hold}
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
      {((userRole === 'employee' && tasks.length > 0) || (selectedProjectId && tasks.length > 0)) && (
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
            {statusOptions.filter(s => s !== 'all').map((s) => (
              <option key={s} value={s}>
                {getStatusText(s)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* NO PROJECT SELECTED STATE (for non-employee) */}
      {userRole !== 'employee' && !selectedProjectId && !loading && (
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
      {view === 'kanban' ? (
        <KanbanBoard
          tasks={tasks}
          kanbanData={kanbanData}
          onUpdateTask={handleUpdateTask}
          onStartTask={handleStartTask}
          onPauseTask={handlePauseTask}
          onResumeTask={handleResumeTask}
          onCompleteTask={handleCompleteTask}
          onLoadTasks={() => userRole === 'employee' ? loadTasks() : loadTasks(selectedProjectId)}
          userRole={userRole}
          reassignmentRequests={reassignmentRequests}
          taskTimelines={taskTimelines}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1.2fr)]">
          {/* TASKS LIST - Left Column */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Assigned tasks</h2>
                <p className="text-xs text-gray-500">{loading ? 'Refreshing tasks…' : `${tasks.length} total tasks`}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <button
                  type="button"
                  onClick={() => userRole === 'employee' ? loadTasks() : loadTasks(selectedProjectId)}
                  disabled={loading || (userRole !== 'employee' && !selectedProjectId)}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                >
                  Refresh
                </button>
                {userRole === 'employee' && (
                  <Link to="/employee/tasks" className="text-blue-600 hover:underline">
                    Full task view
                  </Link>
                )}
              </div>
            </div>

            {loading ? (
              <div className="mt-6 text-sm text-gray-500">Loading tasks…</div>
            ) : error ? (
              <div className="mt-6 text-sm text-red-500">Error: {error}</div>
            ) : tasks.length === 0 ? (
              <div className="mt-6 text-sm text-gray-500">No tasks assigned yet.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {filteredTasks.map((task) => {
                  const taskId = normalizeId(task);
                  const isActive = taskId === normalizeId(selectedTask);
                  const hasPendingReassignment = reassignmentRequests[taskId]?.status === 'PENDING';
                  const isCompleted = (task.status || '').toLowerCase() === 'completed';
                  return (
                    <button
                      key={taskId || task.title}
                      type="button"
                      disabled={hasPendingReassignment || isCompleted}
                      onClick={() => setSelectedTask(task)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left shadow-sm transition ${
                        isCompleted 
                          ? 'border-green-300 bg-green-50 opacity-75 cursor-not-allowed' 
                          : hasPendingReassignment 
                          ? 'border-orange-300 bg-orange-50 opacity-75 cursor-not-allowed' 
                          : `hover:border-blue-300 hover:bg-blue-50 ${
                              isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                            }`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-gray-900">{task.title || 'Untitled task'}</p>
                          {task.project?.name && (
                            <p className="text-xs text-gray-500">Project: {task.project.name}</p>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p>Due {formatDateString(task.taskDate || task.dueDate || task.due_date)}</p>
                          <p>Priority: {task.priority || 'Medium'}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className={`rounded-full border px-3 py-0.5 ${getStatusClasses(task.status || task.stage)}`}>
                          {getStatusText(task.status || task.stage)}
                        </span>
                        <span className="rounded-full border border-gray-200 px-3 py-0.5 text-gray-600">
                          {task.client?.name || 'Client not available'}
                        </span>
                        {task.checklist && task.checklist.length > 0 && (
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-blue-600 flex items-center gap-1">
                            <CheckSquare className="w-3 h-3" />
                            {task.checklist.filter(i => i.status === 'Completed').length}/{task.checklist.length}
                          </span>
                        )}
                        {isCompleted && task.total_time_hours && (
                          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-0.5 text-green-600 font-medium">
                            ✓ {task.total_time_hours.toFixed(2)}h
                          </span>
                        )}
                        {hasPendingReassignment && (
                          <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-0.5 text-orange-600 font-medium">
                            🔒 Reassignment Pending
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* TASK DETAILS & CHECKLIST - Right Column */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            {!selectedTask ? (
              <div className="space-y-2 text-sm text-gray-500">
                <p>Select a task to see richer details and manage its checklist.</p>
                <p>Checklist items live-update and sync with the employee APIs.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Task header */}
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">{selectedTask.title}</h2>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(selectedTask.status || selectedTask.stage)}`}>
                    {getStatusText(selectedTask.status || selectedTask.stage)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{selectedTask.project?.name && `Project: ${selectedTask.project.name}`}</p>
                <p className="text-xs text-gray-400">Due {formatDateString(selectedTask.taskDate || selectedTask.dueDate || selectedTask.due_date)}</p>

                {/* Reassignment Pending Alert */}
                {reassignmentRequests[normalizeId(selectedTask)]?.status === 'PENDING' && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
                    <p className="font-semibold">🔒 Reassignment Request Pending</p>
                    <p className="text-xs">Your manager is reviewing your reassignment request. Task is locked until they respond.</p>
                  </div>
                )}

                {/* Completed Task Alert */}
                {(selectedTask.status || '').toLowerCase() === 'completed' && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    <p className="font-semibold">✓ Task Completed</p>
                    <p className="text-xs">This task has been completed. No further actions are allowed.</p>
                    {selectedTask.total_time_hours && (
                      <p className="text-xs font-medium mt-2">Total Working Hours: <span className="font-bold">{selectedTask.total_time_hours.toFixed(2)}h</span></p>
                    )}
                  </div>
                )}

                {/* Employee Actions */}
                {userRole === 'employee' && (
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.status === 'Pending' || selectedTask.status === 'To Do' ? (
                      <button
                        onClick={() => handleStartTask(normalizeId(selectedTask))}
                        disabled={reassignmentRequests[normalizeId(selectedTask)]?.status === 'PENDING' || (selectedTask.status || '').toLowerCase() === 'completed'}
                        className="rounded-full border border-green-200 px-3 py-1 text-green-600 hover:bg-green-50 flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Play className="w-3 h-3" />
                        Start Task
                      </button>
                    ) : null}
                    
                    {selectedTask.status === 'In Progress' ? (
                      <>
                        <button
                          onClick={() => handlePauseTask(normalizeId(selectedTask))}
                          disabled={reassignmentRequests[normalizeId(selectedTask)]?.status === 'PENDING' || (selectedTask.status || '').toLowerCase() === 'completed'}
                          className="rounded-full border border-orange-200 px-3 py-1 text-orange-600 hover:bg-orange-50 flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Pause className="w-3 h-3" />
                          Pause
                        </button>
                        <button
                          onClick={() => handleMoveToReview(normalizeId(selectedTask))}
                          disabled={(selectedTask.status || '').toLowerCase() === 'completed'}
                          className="rounded-full border border-purple-200 px-3 py-1 text-purple-600 hover:bg-purple-50 flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Check className="w-3 h-3" />
                          Move to Review
                        </button>
                      </>
                    ) : null}

                    {selectedTask.status === 'On Hold' ? (
                      <button
                        onClick={() => handleResumeTask(normalizeId(selectedTask))}
                        disabled={reassignmentRequests[normalizeId(selectedTask)]?.status === 'PENDING' || (selectedTask.status || '').toLowerCase() === 'completed'}
                        className="rounded-full border border-blue-200 px-3 py-1 text-blue-600 hover:bg-blue-50 flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Resume
                      </button>
                    ) : null}

                    <button
                      onClick={() => handleOpenTimeline(selectedTask)}
                      disabled={reassignmentRequests[normalizeId(selectedTask)]?.status === 'PENDING' || (selectedTask.status || '').toLowerCase() === 'completed'}
                      className="rounded-full border border-indigo-200 px-3 py-1 text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Clock className="w-3 h-3" />
                      Timeline
                    </button>
                  </div>
                )}

                {/* Description */}
                {selectedTask.description && (
                  <div>
                    <p className="text-xs uppercase text-gray-500">Description</p>
                    <p className="mt-1 text-sm text-gray-700">{selectedTask.description}</p>
                  </div>
                )}

                {/* Reassign Section (for managers) */}
                {userRole !== 'employee' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <RefreshCw className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Reassign Task</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      <select
                        value={selectedAssignee}
                        onChange={(e) => setSelectedAssignee(e.target.value)}
                        disabled={employees.length === 0}
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
                        disabled={reassigning || !selectedAssignee || employees.length === 0}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm ${
                          reassigning || !selectedAssignee || employees.length === 0
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
                )}

                {/* Employee Reassign Request */}
                {userRole === 'employee' && (
                  <button
                    type="button"
                    onClick={() => setSelectedTaskForReassignment(selectedTask)}
                    className="mt-2 rounded-full border border-yellow-300 px-3 py-1 text-yellow-600 hover:bg-yellow-50 text-sm"
                  >
                    Request Reassignment
                  </button>
                )}

                {/* CHECKLIST SECTION - NEW FUNCTIONALITY */}
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm">
                  <p className="text-xs uppercase text-gray-500 mb-3">Checklist</p>
                  {selectedTaskChecklist.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">No checklist items yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {selectedTaskChecklist.map((item, index) => {
                        const itemId = normalizeId(item) || `${index}`;
                        const isEditing = editingChecklistId === itemId;
                        const dueLabel = formatDateString(item.dueDate || item.due_date || item.date);

                        if (isEditing) {
                          return (
                            <li key={itemId} className="rounded-2xl border border-gray-200 bg-white p-3">
                              <div className="space-y-2 text-sm">
                                <input
                                  type="text"
                                  placeholder="Checklist title"
                                  value={editingChecklistValues.title}
                                  onChange={(e) =>
                                    setEditingChecklistValues((prev) => ({ ...prev, title: e.target.value }))
                                  }
                                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                                />
                                <input
                                  type="date"
                                  value={editingChecklistValues.dueDate}
                                  onChange={(e) =>
                                    setEditingChecklistValues((prev) => ({ ...prev, dueDate: e.target.value }))
                                  }
                                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                                />
                                <div className="flex items-center gap-2 text-xs">
                                  <button
                                    type="button"
                                    onClick={handleUpdateChecklist}
                                    disabled={actionRunning}
                                    className="rounded-full bg-indigo-600 px-4 py-1.5 text-white disabled:opacity-60 text-sm"
                                  >
                                    {actionRunning ? 'Saving…' : 'Save'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditing}
                                    className="rounded-full border border-gray-200 px-4 py-1.5 text-gray-600 text-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </li>
                          );
                        }

                        return (
                          <li key={itemId} className="rounded-2xl border border-gray-200 bg-white p-3">
                            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                {item.status?.toLowerCase?.() === 'completed' && (
                                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                )}
                                <div>
                                  <p
                                    className={`font-medium ${
                                      item.status?.toLowerCase?.() === 'completed'
                                        ? 'text-gray-400 line-through'
                                        : 'text-gray-900'
                                    }`}
                                  >
                                    {item.title || item.name || 'Untitled item'}
                                  </p>
                                  <p className="text-xs text-gray-500">Due {dueLabel}</p>
                                  {item.completedAt && (
                                    <p className="text-[10px] text-emerald-600">
                                      Completed {formatDateString(item.completedAt)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {item.status?.toLowerCase?.() !== 'completed' && (
                                <div className="flex items-center gap-2 text-xs uppercase text-gray-500">
                                  <button
                                    type="button"
                                    onClick={() => startEditingChecklist(item)}
                                    className="rounded-full border border-gray-200 px-3 py-1 hover:border-blue-300 hover:text-blue-600 text-xs"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCompleteChecklist(item)}
                                    disabled={actionRunning}
                                    className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-600 text-xs"
                                  >
                                    Mark complete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteChecklist(item)}
                                    className="rounded-full border border-rose-200 px-3 py-1 text-rose-600 text-xs"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Add checklist item form */}
                  <form onSubmit={handleAddChecklist} className="mt-4 flex flex-col gap-2">
                    <input
                      type="text"
                      value={checklistForm.title}
                      onChange={(e) => setChecklistForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="New checklist item"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <input
                      type="date"
                      value={checklistForm.dueDate}
                      onChange={(e) => setChecklistForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={actionRunning}
                      className="rounded-full bg-indigo-600 px-4 py-2 text-white disabled:opacity-60 text-sm"
                    >
                      {actionRunning ? 'Adding…' : 'Add checklist'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* MODALS */}
      <ReassignTaskRequestModal
        selectedTask={selectedTaskForReassignment}
        onClose={() => setSelectedTaskForReassignment(null)}
        onSuccess={(resp) => {
          if (resp?.request && resp?.task) {
            // Extract task ID (could be id or task_id from request)
            const taskIntId = resp.task.id || resp.request.task_id;
            
            // Update reassignment requests state with the new request
            setReassignmentRequests(prev => ({
              ...prev,
              [taskIntId]: {
                id: resp.request.id,
                taskId: resp.request.task_id,
                status: resp.request.status,
                requested_at: resp.request.requested_at,
                responded_at: resp.request.responded_at,
              }
            }));
            
            // Update task status to On Hold and lock it
            updateLocalTaskState(taskIntId, {
              status: resp.task.status || 'On Hold',
              total_duration: resp.task.total_duration || 0
            });
            
            // Show success message from API
            toast.success(resp?.message || 'Reassignment request submitted successfully');
          }
          // Reload tasks and reassignment requests to refresh UI
          loadTasks(userRole === 'employee' ? undefined : selectedProjectId);
          loadReassignmentRequests(selectedProjectId);
        }}
      />

      <TimelineModal
        task={selectedTaskForTimeline}
        timeline={taskTimelines}
        isOpen={showTimelineModal}
        onClose={() => {
          setShowTimelineModal(false);
          setSelectedTaskForTimeline(null);
        }}
      />
    </div>
  );
};

const TimelineModal = ({ task, timeline, isOpen, onClose }) => {
  if (!isOpen || !task) return null;

  const taskId = normalizeId(task);
  const timelineData = timeline?.[taskId] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 relative shadow-lg max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <XCircle className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Task Timeline</h2>
          <p className="text-gray-600 text-sm">{task.title || task.name || 'Untitled task'}</p>
        </div>

        <div className="space-y-4">
          {timelineData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No timeline events yet</p>
              <p className="text-sm">Timeline will show when you start working on this task</p>
            </div>
          ) : (
            <div className="space-y-4">
              {timelineData.map((event, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      event.action === 'start' ? 'bg-green-100 text-green-600' :
                      event.action === 'pause' ? 'bg-orange-100 text-orange-600' :
                      event.action === 'resume' ? 'bg-blue-100 text-blue-600' :
                      event.action === 'complete' ? 'bg-purple-100 text-purple-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {event.action === 'start' && <Play className="w-4 h-4" />}
                      {event.action === 'pause' && <Pause className="w-4 h-4" />}
                      {event.action === 'resume' && <RotateCcw className="w-4 h-4" />}
                      {event.action === 'complete' && <Check className="w-4 h-4" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {event.action}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateString(event.timestamp)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      by {event.user_name || 'Unknown user'}
                    </p>
                    {event.duration && (
                      <p className="text-xs text-gray-500 mt-1">
                        Duration: {formatDuration(event.duration)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeTasks;