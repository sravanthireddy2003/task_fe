import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';
import { httpGetService } from '../App/httpHandler';
import { getStatusText, isTaskLocked, isTaskInReview } from '../utils/taskHelpers';
import { selectUser } from '../redux/slices/authSlice';
import { 
  fetchTasks,
  startTask, 
  pauseTask, 
  resumeTask, 
  requestTaskCompletion,
  logWorkingHours,
  getTaskTimeline,
  updateTaskStatus,
  requestTaskReassignment
} from '../redux/slices/taskSlice';
import * as Icons from '../icons';

const { AlertCircle, CheckCircle, XCircle, Play, Pause, RotateCcw, Check, Clock, Kanban, List, CheckSquare, MessageSquare, Plus, Send, User, Calendar, RefreshCw, Eye, Filter, ChevronDown } = Icons;
import KanbanBoard from '../components/KanbanBoard';
import ReassignTaskRequestModal from './ReassignTaskRequest';
import TaskRequestButton from '../components/TaskRequestButton';

// Updated normalizeId to handle your API response
const normalizeId = (entity) => {
  if (!entity) return '';
  if (typeof entity === 'string' || typeof entity === 'number') {
    return String(entity);
  }
  // Try multiple ID fields in order of preference
  const id = entity.id || entity.public_id || entity.internal_id || entity.internalId || entity._id;
  if (id !== undefined && id !== null) {
    return String(id);
  }
  return '';
};

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

// Updated getTaskId for API calls - ensure integer ID
const getTaskIdForApi = (task) => {
  const id = task?.id || task?.public_id || task?.internal_id;
  // Convert to integer if it's a string number
  if (typeof id === 'string' && /^\d+$/.test(id)) {
    return parseInt(id, 10);
  }
  return id;
};

// Helper to get project ID for API calls - ensure integer ID
const getProjectIdForApi = (projectId) => {
  if (typeof projectId === 'string' && /^\d+$/.test(projectId)) {
    return parseInt(projectId, 10);
  }
  return projectId;
};

// Get status color classes - updated to match workflow specification
const getStatusClasses = (status) => {
  if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';
  
  const normalizedStatus = status.toUpperCase();
  
  switch (normalizedStatus) {
    case 'TODO':
    case 'TO DO':
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'IN_PROGRESS':
    case 'IN PROGRESS':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'REVIEW':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'ON_HOLD':
    case 'ON HOLD':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Get display text for status
const getStatusDisplayText = (status) => {
  if (!status) return 'Unknown';
  const normalizedStatus = status.toUpperCase();
  switch (normalizedStatus) {
    case 'TODO':
    case 'TO DO':
    case 'PENDING':
      return 'To Do';
    case 'IN_PROGRESS':
    case 'IN PROGRESS':
      return 'In Progress';
    case 'REVIEW':
      return 'In Review';
    case 'COMPLETED':
      return 'Completed';
    case 'ON_HOLD':
    case 'ON HOLD':
      return 'On Hold';
    default:
      return status;
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

// Task should be read-only when in review, locked, or user has readonly access
const EmployeeTasks = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const userRole = user?.role?.toLowerCase();
  const [projects, setProjects] = useState([]);

  // Task should be read-only when in review, locked, or user has readonly access
  const isTaskReadOnly = useCallback((task) => {
    if (!task) return false;

    // Check if task is marked as readonly directly
    if (task.readOnly === true) {
      return true;
    }

    // Check if current user has readonly access
    if (task.assignedUsers && Array.isArray(task.assignedUsers)) {
      const currentUserAssignment = task.assignedUsers.find(assignedUser =>
        assignedUser.id === user?.id ||
        assignedUser._id === user?._id ||
        assignedUser.public_id === user?.public_id ||
        assignedUser.internalId === user?.internal_id
      );
      if (currentUserAssignment?.readOnly === true) {
        return true;
      }
    }

    return isTaskInReview(task) || isTaskLocked(task) || getReassignmentState(task) === 'pending';
  }, [user]);

  // Re-fetch latest task and ensure it's writable before performing mutations
  const ensureTaskWritable = useCallback(async (taskOrId) => {
    const taskId = typeof taskOrId === 'object' ? getTaskIdForApi(taskOrId) : taskOrId;
    if (!taskId) {
      toast.error('Task not found');
      return { ok: false };
    }

    try {
      const resp = await fetchWithTenant(`/api/tasks/${taskId}`);
      const latestTask = resp?.data || resp;
      if (isTaskReadOnly(latestTask)) {
        toast.error('Task is under review. No actions are allowed.');
        return { ok: false, latestTask };
      }
      return { ok: true, latestTask };
    } catch (err) {
      toast.error('Failed to validate task state');
      console.error('ensureTaskWritable error:', err);
      return { ok: false };
    }
  }, [isTaskReadOnly]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [kanbanData, setKanbanData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('list');
  
  // New checklist functionality states
  const [checklistForm, setChecklistForm] = useState({ title: '', dueDate: '' });
  const [editingChecklistId, setEditingChecklistId] = useState('');
  const [editingChecklistValues, setEditingChecklistValues] = useState({ title: '', dueDate: '' });
  const [actionRunning, setActionRunning] = useState(false);
  
  // Existing states
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTaskForReassignment, setSelectedTaskForReassignment] = useState(null);
  const [checklists, setChecklists] = useState({});
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [reassignmentRequests, setReassignmentRequests] = useState({});
  const [taskTimelines, setTaskTimelines] = useState({});
  const [selectedTaskForTimeline, setSelectedTaskForTimeline] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [forceRefresh, setForceRefresh] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitReason, setSubmitReason] = useState('');
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  // Time tracking states
  const [activeTimers, setActiveTimers] = useState({});
  const [liveTimers, setLiveTimers] = useState({});

  // Status options for filter - updated based on API
  const statusOptions = ['all', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'TO DO', 'REVIEW'];

  // Live timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTimers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(taskId => {
          if (updated[taskId]) {
            updated[taskId] = updated[taskId] + 1;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Helper function to format time display
  const formatTimeDisplay = (totalSeconds, liveSeconds = 0) => {
    const total = totalSeconds + liveSeconds;
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Helper function to get total tracked time
  const getTotalTrackedTime = (task) => {
    const totalHours = task?.total_time_hours || 0;
    const totalHHMMSS = task?.total_time_hhmmss || '00:00:00';
    
    // Convert HH:MM:SS to seconds
    const [hours, minutes, seconds] = totalHHMMSS.split(':').map(Number);
    return (hours * 3600) + (minutes * 60) + seconds + (totalHours * 3600);
  };

  // Validate status transitions for employees
  const validateStatusTransition = (currentStatus, newStatus, task) => {
    if (!task) return { valid: false, error: 'Task not found' };

    const normalizedCurrent = (currentStatus || '').toUpperCase();
    const normalizedNew = newStatus.toUpperCase();

    // Check if user is assigned to task
    const isAssigned = task.assignedUsers?.some(assignedUser => 
      assignedUser.id === user?.id || 
      assignedUser._id === user?._id || 
      assignedUser.public_id === user?.public_id ||
      assignedUser.internalId === user?.internal_id
    );
    if (!isAssigned && userRole === 'employee') {
      return { valid: false, error: 'You are not assigned to this task' };
    }

    // Check if task is read-only
    if (task.readOnly || task.is_locked) {
      return { valid: false, error: 'Task is locked and cannot be modified' };
    }

    // Allowed transitions for employees
    const allowedTransitions = {
      'PENDING': ['TO DO', 'IN PROGRESS'],
      'TO DO': ['IN PROGRESS'],
      'IN PROGRESS': ['ON HOLD', 'REVIEW'],
      'ON HOLD': ['IN PROGRESS'],
      'REVIEW': userRole === 'manager' || userRole === 'admin' ? ['COMPLETED'] : [] // Only manager can complete from review
    };

    const currentAllowed = allowedTransitions[normalizedCurrent] || [];
    if (!currentAllowed.includes(normalizedNew)) {
      return { 
        valid: false, 
        error: `Cannot change status from ${normalizedCurrent} to ${normalizedNew}` 
      };
    }

    return { valid: true };
  };

  // Handle status change with validation
  const handleStatusChange = async (task, newStatus) => {
    // Re-fetch latest task from server to re-evaluate permissions and status
    const taskId = getTaskIdForApi(task);
    let latestTask = task;
    try {
      const latestResp = await fetchWithTenant(`/api/tasks/${encodeURIComponent(taskId)}`);
      latestTask = latestResp?.data || latestResp || task;
    } catch (e) {
      console.warn('Failed to fetch latest task for status change validation', e);
    }

    const validation = validateStatusTransition(latestTask.status || latestTask.stage, newStatus, latestTask);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // Prevent status change if user has read-only access on latest task
    if (isTaskReadOnly(latestTask)) {
      toast.error('You have read-only access to this task and cannot change status');
      return;
    }

    try {
      const result = await dispatch(updateTaskStatus({ 
        taskId, 
        status: newStatus, 
        projectId: getProjectIdForApi(selectedProjectId) 
      })).unwrap();

      toast.success(`Task status updated to ${newStatus}`);

      // Update local state
      updateLocalTaskState(normalizeId(task), { status: newStatus });

      // Refresh tasks
      setTimeout(() => refreshAllTasks(), 500);
    } catch (error) {
      toast.error(error?.message || 'Failed to update task status');
      console.error('Status change error:', error);
    }
  };

  // Handle task reassignment request
  const handleRequestReassignment = async (task, reason) => {
    if (!reason || reason.trim() === '') {
      toast.error('Please provide a reason for reassignment');
      return;
    }

    // Re-fetch latest task from server to re-evaluate permissions
    const taskId = getTaskIdForApi(task);
    let latestTask = task;
    try {
      const latestResp = await fetchWithTenant(`/api/tasks/${encodeURIComponent(taskId)}`);
      latestTask = latestResp?.data || latestResp || task;
    } catch (e) {
      console.warn('Could not fetch latest task for reassignment check', e);
    }

    // Prevent duplicate or forbidden reassignment requests
    if (isTaskReadOnly(latestTask)) {
      toast.error('Task is under review or you have read-only access. No actions are allowed.');
      return;
    }
    if (getReassignmentState(task) === 'pending') {
      toast.error('A reassignment request is already pending for this task');
      return;
    }

    try {
      const taskId = getTaskIdForApi(task);
      const result = await dispatch(requestTaskReassignment({ 
        taskId, 
        reason: reason.trim() 
      })).unwrap();

      toast.success('Reassignment request submitted. Task is now on hold.');

      // Update local state - task should be locked/on hold
      updateLocalTaskState(normalizeId(task), { 
        status: 'ON_HOLD', 
        is_locked: true 
      });

      // Refresh tasks
      setTimeout(() => refreshAllTasks(), 500);
    } catch (error) {
      toast.error(error?.message || 'Failed to request reassignment');
      console.error('Reassignment request error:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetchWithTenant('/api/projects?dropdown=1');
      const data = response?.data || response || [];
      if (Array.isArray(data)) {
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          const firstProjectId = data[0].projectId || data[0].id || data[0]._id || data[0].public_id;
          setSelectedProjectId(firstProjectId);
        }
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const loadTasks = async (projectId) => {
    if (!projectId) {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await dispatch(fetchTasks({ project_id: projectId })).unwrap();
      
      // Handle the response structure
      const data = Array.isArray(result) ? result : result?.data || [];
      const kanbanList = result?.kanban || [];
      
      if (Array.isArray(data)) {
        setTasks(data);
        setKanbanData(kanbanList);
        
        // Initialize checklists
        const checklistsMap = {};
        data.forEach(task => {
          const taskId = normalizeId(task);
          if (taskId && task.checklist && task.checklist.length > 0) {
            checklistsMap[taskId] = task.checklist;
          }
        });
        setChecklists(checklistsMap);
        
        // Initialize reassignment requests
        const requestsMap = {};
        data.forEach(task => {
          const taskId = normalizeId(task);
          if (taskId && task.lock_info && task.lock_info.is_locked) {
            requestsMap[taskId] = {
              id: task.lock_info.request_id,
              taskId: task.id || task.internal_id,
              status: task.lock_info.request_status || 'PENDING',
              requested_at: task.lock_info.requested_at,
              responded_at: task.lock_info.responded_at,
              requester_name: task.lock_info.requester_name,
            };
          }
        });
        setReassignmentRequests(requestsMap);
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
      // Fetch reassignment requests for each task using GET /api/tasks/:id/reassign-requests
      for (const task of tasks) {
        try {
          const taskId = getTaskIdForApi(task);
          if (!taskId) continue;
          const response = await httpGetService(`/api/tasks/${taskId}/reassign-requests`);
          if (response?.success && response.data) {
            // If response.data is array, map first request; else use summary
            const req = Array.isArray(response.data) ? response.data[0] : response.data;
            if (req) {
              requestsMap[taskId] = {
                id: req.id,
                taskId: req.task_id,
                status: req.status,
                requested_at: req.requested_at,
                responded_at: req.responded_at,
              };
            }
          }
        } catch (error) {
          continue;
        }
      }
      setReassignmentRequests(requestsMap);
    } catch (error) {
      console.error('Failed to load reassignment requests:', error);
    }
  };

  const loadTaskTimeline = async (task) => {
    try {
      const taskId = getTaskIdForApi(task);
      if (!taskId) {
        console.warn('Invalid task ID for timeline:', task);
        return;
      }
      
      const result = await dispatch(getTaskTimeline(taskId)).unwrap();
      if (result) {
        const normalizedId = normalizeId(task);
        setTaskTimelines(prev => ({
          ...prev,
          [normalizedId]: result
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

  // Fetch employee-specific tasks
  const fetchEmployeeTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchWithTenant('/api/employee/my-tasks');
      const respBody = resp || {};

      // `data` may be at resp.data (common) or resp itself may be the array
      const data = Array.isArray(respBody.data)
        ? respBody.data
        : Array.isArray(respBody)
        ? respBody
        : [];

      // kanban comes from the top-level response in this API
      const kanbanList = Array.isArray(respBody.kanban) ? respBody.kanban : [];

      if (Array.isArray(data)) {
        setTasks(data);
        setKanbanData(kanbanList);

        const checklistsMap = {};
        data.forEach((task) => {
          const taskId = normalizeId(task);
          if (taskId && Array.isArray(task.checklist) && task.checklist.length > 0) {
            checklistsMap[taskId] = task.checklist;
          }
        });
        setChecklists(checklistsMap);

        const requestsMap = {};
        data.forEach((task) => {
          const taskId = normalizeId(task);
          const lock = task.lock_info || task.task_status || {};
          if (taskId && (lock.is_locked || task.is_locked)) {
            requestsMap[taskId] = {
              id: lock.request_id || lock.requestId || null,
              taskId: task.id || task.internal_id || task.public_id || task._id || task.internalId,
              status: lock.request_status || lock.status || 'PENDING',
              requested_at: lock.requested_at || lock.requestedAt || null,
              responded_at: lock.responded_at || lock.respondedAt || null,
              requester_name: lock.requester_name || lock.requesterName || null,
            };
          }
        });
        setReassignmentRequests(requestsMap);
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

  useEffect(() => {
    loadProjects();
    if (userRole !== 'employee') {
      loadEmployees();
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userRole === 'employee') {
        fetchEmployeeTasks();
        return;
      }

      if (selectedProjectId) {
        loadTasks(getProjectIdForApi(selectedProjectId));
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedProjectId, userRole, forceRefresh]);

  // Filter tasks based on status - updated to handle both status and stage fields
  const filteredTasks = useMemo(() => {
    if (filterStatus === 'all') return tasks;
    
    return tasks.filter(task => {
      // Use status field first, fall back to stage
      const taskStatus = (task.status || task.stage || '').toUpperCase();
      const filterStatusUpper = filterStatus.toUpperCase();
      
      if (filterStatusUpper === 'TO DO') {
        return taskStatus === 'TO DO' || taskStatus === 'PENDING' || taskStatus === 'TODO';
      }
      
      if (filterStatusUpper === 'IN_PROGRESS' || filterStatusUpper === 'IN PROGRESS') {
        return taskStatus === 'IN_PROGRESS' || taskStatus === 'IN PROGRESS';
      }
      
      if (filterStatusUpper === 'ON_HOLD' || filterStatusUpper === 'ON HOLD') {
        return taskStatus === 'ON_HOLD' || taskStatus === 'ON HOLD' || taskStatus === 'On Hold';
      }
      
      return taskStatus === filterStatusUpper;
    });
  }, [tasks, filterStatus]);

  // Get status counts - updated based on API
  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      on_hold: 0,
      review: 0,
      to_do: 0
    };
    
    tasks.forEach(task => {
      const status = (task.status || '').toLowerCase();
      
      // Map statuses from your API
      if (status === 'pending' || status === 'to do') {
        counts.pending++;
      } else if (status === 'in progress' || status === 'in_progress') {
        counts.in_progress++;
      } else if (status === 'completed') {
        counts.completed++;
      } else if (status === 'on hold' || status === 'on_hold') {
        counts.on_hold++;
      } else if (status === 'review') {
        counts.review++;
      } else {
        // Default based on stage if status is not set
        const stage = (task.stage || '').toLowerCase();
        if (stage === 'pending') {
          counts.pending++;
        } else {
          counts.pending++; // Default to pending
        }
      }
    });
    
    return counts;
  };

  // Stats for dashboard
  const stats = useMemo(() => {
    const counts = getStatusCounts();
    const overdue = [];
    const now = Date.now();
    
    tasks.forEach((task) => {
      const dueDate = new Date(task.taskDate || task.dueDate || task.due_date || null);
      const status = (task.status || '').toLowerCase();
      const isCompleted = status === 'completed';
      const isOverdue = !Number.isNaN(dueDate.getTime()) && dueDate.getTime() < now && !isCompleted;
      
      if (isOverdue) {
        overdue.push(task);
      }
    });
    
    return {
      total: tasks.length,
      overdue: overdue.length,
      stageCounters: counts,
    };
  }, [tasks]);

  // Helper to update task state locally after an action
  const updateLocalTaskState = (taskId, updates) => {
    // Update main tasks array
    setTasks(prev => {
      const taskIndex = prev.findIndex(t => {
        const id = normalizeId(t);
        return id === taskId;
      });

      if (taskIndex === -1) {
        return prev;
      }

      const oldTask = prev[taskIndex];
      const updatedTask = {
        ...oldTask,
        ...updates,
        status: updates.status || oldTask.status || oldTask.stage,
        stage: updates.stage || oldTask.stage || oldTask.status
      };

      const newTasks = [...prev];
      newTasks[taskIndex] = updatedTask;

      return newTasks;
    });

    // Update selectedTask if it matches
    if (selectedTask && normalizeId(selectedTask) === taskId) {
      setSelectedTask(prev => ({ ...prev, ...updates }));
    }
  };
  const refreshAllTasks = () => {
    setForceRefresh(prev => prev + 1);
  };

  // Task action functions - updated for your API
  const handleStartTask = async (taskOrId) => {
    try {
      const writable = await ensureTaskWritable(taskOrId);
      if (!writable.ok) return;
      // Handle both task objects and task IDs
      const taskId = typeof taskOrId === 'object' ? getTaskIdForApi(taskOrId) : taskOrId;
      const task = typeof taskOrId === 'object' ? taskOrId : tasks.find(t => getTaskIdForApi(t) === taskOrId);

      if (!taskId) {
        toast.error('Task not found');
        return;
      }

      const result = await dispatch(startTask(taskId)).unwrap();

      toast.success('Task started');

      // Update status to In Progress and start live timer
      const updateData = {
        status: 'IN_PROGRESS',
        started_at: result?.started_at || new Date().toISOString(),
        is_locked: false
      };

      // Start live timer for this task
      setActiveTimers(prev => ({ ...prev, [taskId]: true }));
      setLiveTimers(prev => ({ ...prev, [taskId]: 0 }));

      // Update local state immediately
      updateLocalTaskState(normalizeId(task), updateData);

      // Load timeline
      if (task) loadTaskTimeline(task);

      // Refresh to get latest data
      setTimeout(() => refreshAllTasks(), 500);
    } catch (error) {
      toast.error(error?.message || 'Failed to start task');
      console.error('Start task error:', error);
    }
  };

  const handlePauseTask = async (taskOrId) => {
    try {
      const writable = await ensureTaskWritable(taskOrId);
      if (!writable.ok) return;
      // Handle both task objects and task IDs
      const taskId = typeof taskOrId === 'object' ? getTaskIdForApi(taskOrId) : taskOrId;
      const task = typeof taskOrId === 'object' ? taskOrId : tasks.find(t => getTaskIdForApi(t) === taskOrId);

      if (!taskId) {
        toast.error('Task not found');
        return;
      }

      const result = await dispatch(pauseTask(taskId)).unwrap();

      toast.success('Task paused');

      // Stop timer and accumulate time
      setActiveTimers(prev => ({ ...prev, [taskId]: false }));
      setLiveTimers(prev => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });

      const updateData = {
        status: 'ON_HOLD',
        is_locked: false
      };

      // Update local state immediately
      updateLocalTaskState(normalizeId(task), updateData);

      // Load timeline
      if (task) loadTaskTimeline(task);

      // Refresh to get latest data
      setTimeout(() => refreshAllTasks(), 500);
    } catch (error) {
      toast.error(error?.message || 'Failed to pause task');
      console.error('Pause task error:', error);
    }
  };

  const handleResumeTask = async (taskOrId) => {
    try {
      const writable = await ensureTaskWritable(taskOrId);
      if (!writable.ok) return;
      // Handle both task objects and task IDs
      const taskId = typeof taskOrId === 'object' ? getTaskIdForApi(taskOrId) : taskOrId;
      const task = typeof taskOrId === 'object' ? taskOrId : tasks.find(t => getTaskIdForApi(t) === taskOrId);

      if (!taskId) {
        toast.error('Task not found');
        return;
      }

      const result = await dispatch(resumeTask(taskId)).unwrap();

      toast.success('Task resumed');

      // Restart live timer
      setActiveTimers(prev => ({ ...prev, [taskId]: true }));
      setLiveTimers(prev => ({ ...prev, [taskId]: 0 }));

      const updateData = {
        status: 'IN_PROGRESS',
        is_locked: false
      };

      // Update local state immediately
      updateLocalTaskState(normalizeId(task), updateData);

      // Load timeline
      if (task) loadTaskTimeline(task);

      // Refresh to get latest data
      setTimeout(() => refreshAllTasks(), 500);
    } catch (error) {
      toast.error(error?.message || 'Failed to resume task');
      console.error('Resume task error:', error);
    }
  };

  const handleCompleteTask = async (taskOrId) => {
    // Handle both task objects and task IDs
    const task = typeof taskOrId === 'object' ? taskOrId : tasks.find(t => getTaskIdForApi(t) === taskOrId);

    // Revalidate latest state and block if read-only
    const writable = await ensureTaskWritable(taskOrId);
    if (!writable.ok) return;

    try {
      // Prevent completing a task that is already in review
      const currentStatus = (task?.status || task?.stage || '').toString().toUpperCase();
      if (currentStatus === 'REVIEW') {
        toast.error('Task is in review and cannot be completed directly');
        return;
      }

      const taskId = typeof taskOrId === 'object' ? getTaskIdForApi(taskOrId) : taskOrId;
      if (!taskId) {
        toast.error('Task not found');
        return;
      }

      // Get the project ID for the request
      const projectId = getProjectIdForApi(task?.projectId || task?.project_id || selectedProjectId);

      const result = await dispatch(requestTaskCompletion({ taskId, projectId })).unwrap();

      toast.success('Review requested — sent for manager approval');

      const updateData = {
        status: 'REVIEW',
        // Do not mark the task as fully locked here; managers will control locking.
        is_locked: false,
        lock_info: {
          is_locked: false,
          request_status: 'PENDING'
        }
      };

      // Update local state immediately
      updateLocalTaskState(normalizeId(task), updateData);

      // Also update selectedTask if it's the same task
      if (selectedTask && normalizeId(selectedTask) === normalizeId(task)) {
        setSelectedTask(prev => ({
          ...prev,
          ...updateData
        }));
      }
      
      // Load timeline
      loadTaskTimeline(task);
      
      // Refresh to get latest data
      setTimeout(() => refreshAllTasks(), 500);
    } catch (error) {
      toast.error(error?.message || 'Failed to request task completion');
      console.error('Request task completion error:', error);
    }
  };

  const handleMoveToReview = async (reason = '') => {
    if (!selectedTask) return;
    // Block moving if task is read-only
    if (isTaskReadOnly(selectedTask)) {
      toast.error('Task is under review. No actions are allowed.');
      return;
    }

    try {
      const taskId = getTaskIdForApi(selectedTask);
      if (!taskId) {
        toast.error('Task not found');
        return;
      }
      
      const projectId = getProjectIdForApi(selectedTask.projectId || selectedTask.project_id || selectedProjectId);
      const payload = {
        taskId,
        projectId,
        meta: { reason: reason || 'Task completed, ready for review' }
      };
      const result = await dispatch(requestTaskCompletion(payload)).unwrap();

      if (result) {
        toast.success('Task submitted for review');
        const lockUpdate = { 
          status: 'REVIEW', 
          is_locked: false, 
          lock_info: { is_locked: false, request_status: 'PENDING' } 
        };
        updateLocalTaskState(normalizeId(selectedTask), lockUpdate);
        if (selectedTask && normalizeId(selectedTask) === normalizeId(selectedTask)) {
          setSelectedTask(prev => ({ ...prev, ...lockUpdate }));
        }
        setShowSubmitModal(false);
        setSubmitReason('');
        setTimeout(() => refreshAllTasks(), 500);
      } else {
        toast.error('Failed to submit task for review');
      }
    } catch (error) {
      toast.error('Failed to submit task for review');
      console.error('Submit for review error:', error);
    }
  };

  const handleUpdateTask = async (task, updates) => {
    // If this is a status update, use the validated status change function
    if (updates.status) {
      await handleStatusChange(task, updates.status);
      return;
    }

    // For other updates (admin/manager only)
    try {
      const taskId = getTaskIdForApi(task);
      if (!taskId) {
        toast.error('Task not found');
        return;
      }

      // Note: updateTask action is not imported, so we'll use fetchWithTenant directly
      const resp = await fetchWithTenant(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      updateLocalTaskState(normalizeId(task), updates);
      toast.success('Task updated successfully');
      loadTaskTimeline(task);
      setTimeout(() => refreshAllTasks(), 500);
    } catch (error) {
      toast.error(error?.message || 'Failed to update task');
      console.error('Update task error:', error);
    }
  };

  // NEW CHECKLIST FUNCTIONS - updated for your API
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
      const writable = await ensureTaskWritable(selectedTask);
      if (!writable.ok) return;
      const taskId = getTaskIdForApi(selectedTask);
      const payload = {
        taskId: taskId,
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

      // Update selectedTask
      if (selectedTask) {
        setSelectedTask(prev => ({
          ...prev,
          checklist: [...(prev.checklist || []), newChecklistItem]
        }));
      }
    } catch (err) {
      toast.error(err?.message || 'Unable to add checklist item');
    } finally {
      setActionRunning(false);
    }
  };

  const startEditingChecklist = (item) => {
    const itemId = item?.id || item?.public_id;
    if (!itemId) return;
    setEditingChecklistId(itemId);
    setEditingChecklistValues({
      title: item.title || '',
      dueDate: formatForInput(item.dueDate),
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
      const writable = await ensureTaskWritable(selectedTask);
      if (!writable.ok) return;
      const taskId = getTaskIdForApi(selectedTask);
      const payload = {
        title: editingChecklistValues.title.trim(),
        dueDate: editingChecklistValues.dueDate || undefined,
        taskId: taskId,
      };
      
      const resp = await fetchWithTenant(`/api/employee/subtask/${editingChecklistId}`, {
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
                (item.id || item.public_id) === editingChecklistId ? updatedChecklistItem : item
              )
            }
          : task
      ));
      
      // Update selectedTask
      if (selectedTask) {
        setSelectedTask(prev => ({
          ...prev,
          checklist: (prev.checklist || []).map(item =>
            (item.id || item.public_id) === editingChecklistId ? updatedChecklistItem : item
          )
        }));
      }
    } catch (err) {
      toast.error(err?.message || 'Unable to update checklist item');
    } finally {
      setActionRunning(false);
    }
  };

  const handleDeleteChecklist = async (item) => {
    const itemId = item?.id || item?.public_id;
    if (!itemId || !selectedTask) return;
    if (!window.confirm('Remove this checklist item?')) return;
    setActionRunning(true);
    try {
      const writable = await ensureTaskWritable(selectedTask);
      if (!writable.ok) return;
      const resp = await fetchWithTenant(`/api/employee/subtask/${itemId}`, {
        method: 'DELETE',
      });
      toast.success(resp?.message || 'Checklist item removed');

      // Update tasks state locally
      const selectedTaskId = normalizeId(selectedTask);
      setTasks(prevTasks => prevTasks.map(task =>
        normalizeId(task) === selectedTaskId
          ? {
              ...task,
              checklist: (task.checklist || []).filter(item => (item.id || item.public_id) !== itemId)
            }
          : task
      ));
      
      // Update selectedTask
      if (selectedTask) {
        setSelectedTask(prev => ({
          ...prev,
          checklist: (prev.checklist || []).filter(item => (item.id || item.public_id) !== itemId)
        }));
      }
    } catch (err) {
      toast.error(err?.message || 'Unable to delete checklist item');
    } finally {
      setActionRunning(false);
    }
  };

  const handleCompleteChecklist = async (item) => {
    const itemId = item?.id || item?.public_id;
    if (!itemId || !selectedTask) return;
    
    setActionRunning(true);
    try {
      const resp = await fetchWithTenant(`/api/employee/subtask/${itemId}/complete`, {
        method: 'POST',
      });
      
      const updatedChecklistItem = resp.data;
      toast.success(resp?.message || 'Checklist marked complete');

      // Get the current task ID
      const selectedTaskId = normalizeId(selectedTask);

      // Update the main tasks array to reflect the checklist change
      setTasks(prevTasks => 
        prevTasks.map(task => {
          if (normalizeId(task) === selectedTaskId) {
            const updatedChecklist = (task.checklist || []).map(checkItem =>
              (checkItem.id || checkItem.public_id) === itemId ? updatedChecklistItem : checkItem
            );
            
            return {
              ...task,
              checklist: updatedChecklist,
            };
          }
          return task;
        })
      );
      
      // Update selectedTask
      if (selectedTask) {
        setSelectedTask(prev => ({
          ...prev,
          checklist: (prev.checklist || []).map(checkItem =>
            (checkItem.id || checkItem.public_id) === itemId ? updatedChecklistItem : checkItem
          )
        }));
      }

    } catch (err) {
      toast.error(err?.message || 'Unable to update checklist status');
    } finally {
      setActionRunning(false);
    }
  };

  // Existing functions
  const handleOpenTimeline = (task) => {
    setSelectedTaskForTimeline(task);
    loadTaskTimeline(task);
    setShowTimelineModal(true);
  };

  const handleReassignTask = async () => {
    // API: POST /api/tasks/:id/request-reassignment
    if (!selectedTaskForReassignment) return;
    if (isTaskReadOnly(selectedTaskForReassignment)) {
      toast.error('Task is under review. No actions are allowed.');
      return;
    }
    setReassigning(true);
    try {
      const taskId = getTaskIdForApi(selectedTaskForReassignment);
      const resp = await fetchWithTenant(`/api/tasks/${taskId}/request-reassignment`, {
        method: 'POST',
        body: JSON.stringify({
          reason: selectedTaskForReassignment.reassignReason || 'Requesting reassignment',
        }),
      });
      if (resp.success) {
        toast.success(resp.message || 'Reassignment request sent');
        setForceRefresh(f => f + 1);
        setSelectedTaskForReassignment(null);
      } else {
        const errorMessage = resp?.error || resp?.message || 'Failed to request reassignment';
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || err?.data?.message || 'Failed to request reassignment';
      toast.error(errorMessage);
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
    return selectedTask.checklist || [];
  }, [selectedTask]);

  // Get selected task details
  const detailProject = selectedTask?.project || selectedTask?.meta?.project;
  const formattedDue = useMemo(() => {
    if (!selectedTask) return '—';
    const raw = selectedTask.taskDate || selectedTask.dueDate;
    if (!raw) return '—';
    return formatDateString(raw);
  }, [selectedTask]);

  // Get counts for status summary
  const statusCounts = useMemo(() => getStatusCounts(), [tasks]);

  // Check if task has pending reassignment

  // Show reassignment state (pending/approved/denied) for employee
  const getReassignmentState = (task) => {
    if (!task) return null;
    const lockInfo = task.lock_info || {};
    const taskStatus = task.task_status || {};
    const status = lockInfo.request_status || taskStatus.request_status || reassignmentRequests[normalizeId(task)]?.status || null;
    if (status === 'PENDING') return 'pending';
    if (status === 'APPROVE' || status === 'APPROVED') return 'approved';
    if (status === 'DENY' || status === 'DENIED' || status === 'REJECTED') return 'denied';
    return null;
  };

  // Check if task is completed
  const isTaskCompleted = (task) => {
    const status = (task.status || '').toLowerCase();
    return status === 'completed';
  };

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
                  const projectId = project.public_id || project.id || project._id;
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
                onClick={() => setView('list')}
                className={`px-3 py-2 rounded-lg border ${
                  view === 'list'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <List className="tm-icon mr-2 inline" />
                List
              </button>
              <button
                onClick={() => setView('kanban')}
                className={`px-3 py-2 rounded-lg border ${
                  view === 'kanban'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Kanban className="tm-icon mr-2 inline" />
                Kanban
              </button>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={refreshAllTasks}
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

      {/* STATS SECTION */}
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
            <p className="text-2xl font-semibold text-blue-500">{statusCounts.in_progress}</p>
            <p className="text-xs text-gray-500">Work you are handling</p>
          </div>
        </div>
      )}

      {/* STATUS SUMMARY */}
      {((userRole === 'employee' && tasks.length > 0) || (selectedProjectId && tasks.length > 0)) && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="px-4 py-2 rounded-lg bg-yellow-100 text-yellow-800 font-semibold shadow-sm border border-yellow-200">
            Pending: {statusCounts.pending}
          </div>
          <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-semibold shadow-sm border border-blue-200">
            In Progress: {statusCounts.in_progress}
          </div>
          <div className="px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold shadow-sm border border-green-200">
            Completed: {statusCounts.completed}
          </div>
          <div className="px-4 py-2 rounded-lg bg-red-100 text-red-800 font-semibold shadow-sm border border-red-200">
            On Hold: {statusCounts.on_hold}
          </div>
          {statusCounts.review > 0 && (
            <div className="px-4 py-2 rounded-lg bg-purple-100 text-purple-800 font-semibold shadow-sm border border-purple-200">
              Review: {statusCounts.review}
            </div>
          )}
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

          {/* View Toggle */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-gray-700 font-medium text-sm">View:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  view === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4 inline mr-1" />
                List
              </button>
              <button
                onClick={() => setView('kanban')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  view === 'kanban'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Kanban className="w-4 h-4 inline mr-1" />
                Kanban
              </button>
            </div>
          </div>
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
          tasks={filteredTasks}
          kanbanData={kanbanData}
          onStartTask={handleStartTask}
          onPauseTask={handlePauseTask}
          onResumeTask={handleResumeTask}
          onCompleteTask={handleCompleteTask}
          onLoadTasks={refreshAllTasks}
          userRole={userRole}
          projectId={selectedProjectId}
          reassignmentRequests={reassignmentRequests}
          isTaskReadOnly={isTaskReadOnly}
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
                  onClick={refreshAllTasks}
                  disabled={loading || (userRole !== 'employee' && !selectedProjectId)}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 hover:bg-gray-100 disabled:opacity-50 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
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
                  const reassignmentState = getReassignmentState(task);
                  const hasPending = reassignmentState === 'pending';
                  const isApproved = reassignmentState === 'approved';
                  const isDenied = reassignmentState === 'denied';
                  const isCompleted = isTaskCompleted(task);
                  const completedChecklistCount = task.checklist ? task.checklist.filter(item => item.status === 'Completed').length : 0;
                  const totalChecklistCount = task.checklist ? task.checklist.length : 0;
                  
                  return (
                    <button
                      key={taskId || task.title}
                      type="button"
                      disabled={hasPending || isCompleted || isTaskLocked(task) || isTaskReadOnly(task)}
                      onClick={() => setSelectedTask(task)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left shadow-sm transition ${
                        isCompleted
                          ? 'border-green-300 bg-green-50 opacity-75 cursor-not-allowed'
                          : hasPending 
                          ? 'border-orange-300 bg-orange-50 opacity-75 cursor-not-allowed' 
                          : `hover:border-blue-300 hover:bg-blue-50 ${
                              isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                            }`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-gray-900 truncate">{task.title || 'Untitled task'}</p>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <span>Priority: <span className={`font-medium ${getPriorityClasses(task.priority)}`}>{task.priority || 'Medium'}</span></span>
                            <span>•</span>
                            <span>Status: <span className={`font-medium ${getStatusClasses(task.status || task.stage)}`}>{getStatusText(task.status || task.stage)}</span></span>
                          </div>
                          {task.taskDate && (
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDateString(task.taskDate)} ({task.dayName || 'Unknown day'})</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-500 flex flex-col gap-1">
                          {task.assignedUsers && task.assignedUsers.length > 0 && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{task.assignedUsers.map(u => u.name || u.email).join(', ')}</span>
                            </div>
                          )}
                          {task.client && (
                            <div className="flex items-center gap-1">
                              <span>Client: {task.client.name || task.client.company}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Est: {task.timeAlloted || task.estimatedHours || 0}h</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Actual: {formatTimeDisplay(getTotalTrackedTime(task), liveTimers[taskId] || 0)}</span>
                          </div>
                          {task.summary?.dueStatus && (
                            <div className={`text-xs font-medium ${task.summary.dueStatus === 'overdue' ? 'text-red-600' : 'text-orange-600'}`}>
                              {task.summary.dueStatus === 'overdue' ? 'Overdue' : 'Due Soon'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className={`rounded-full border px-3 py-0.5 ${getStatusClasses(task.status || task.stage)}`}>
                          {getStatusText(task.status || task.stage)}
                        </span>
                        <span className="rounded-full border border-gray-200 px-3 py-0.5 text-gray-600">
                          {task.client?.name || 'Client not available'}
                        </span>
                        {totalChecklistCount > 0 && (
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-blue-600 flex items-center gap-1">
                            <CheckSquare className="w-3 h-3" />
                            {completedChecklistCount}/{totalChecklistCount}
                          </span>
                        )}
                        {isCompleted && (
                          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-0.5 text-green-600 font-medium">
                            ✓ No Further Changes
                          </span>
                        )}
                        {hasPending && (
                          <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-0.5 text-orange-600 font-medium">
                            🔒 Reassignment Pending
                          </span>
                        )}
                        {isApproved && (
                          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-0.5 text-green-600 font-medium">
                            ✅ Reassignment Approved
                          </span>
                        )}
                        {isDenied && (
                          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-0.5 text-red-600 font-medium">
                            ❌ Reassignment Denied
                          </span>
                        )}
                        {isTaskInReview(task) && (
                          <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-0.5 text-purple-600 font-medium">
                            👁️ Under Review - Readonly
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
                
                {/* Completion Alert */}
                {isTaskCompleted(selectedTask) && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    <p className="font-semibold">✓ Task Completed</p>
                    <p className="text-xs mt-1">Total working hours: <span className="font-bold">{selectedTask.total_time_hhmmss || '0h 0m'}</span></p>
                    <p className="text-xs mt-1">This task is locked and cannot be modified further.</p>
                  </div>
                )}
                
                <p className="text-xs text-gray-400">Due {formatDateString(selectedTask.taskDate || selectedTask.dueDate)}</p>

                {/* Reassignment State Alert */}
                {(() => {
                  const state = getReassignmentState(selectedTask);
                  if (state === 'pending') {
                    return (
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
                        <p className="font-semibold">🔒 Reassignment Request Pending</p>
                        <p className="text-xs">Your manager is reviewing your reassignment request. Task is locked until they respond.</p>
                      </div>
                    );
                  }
                  if (state === 'approved') {
                    return (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                        <p className="font-semibold">✅ Reassignment Approved</p>
                        <p className="text-xs">Your manager has approved your reassignment request.</p>
                      </div>
                    );
                  }
                  if (state === 'denied') {
                    return (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <p className="font-semibold">❌ Reassignment Denied</p>
                        <p className="text-xs">Your manager has denied your reassignment request.</p>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Review helper: when a task is in review show strict read-only notice */}
                {isTaskInReview(selectedTask) && (
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-700 mt-3">
                    <p className="font-semibold">🔎 Task Under Review</p>
                    <p className="text-xs">Task is under review. No actions are allowed.</p>
                  </div>
                )}

                {/* Refresh task button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={refreshAllTasks}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Tasks
                  </button>
                </div>

                {/* Employee Actions */}
                {userRole === 'employee' && (
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.status === 'Pending' || selectedTask.status === 'To Do' || selectedTask.stage === 'PENDING' ? (
                      <button
                        onClick={() => handleStartTask(selectedTask)}
                        disabled={isTaskReadOnly(selectedTask) || getReassignmentState(selectedTask) === 'pending' || isTaskCompleted(selectedTask) || isTaskLocked(selectedTask)}
                        className="rounded-full border border-green-200 px-3 py-1 text-green-600 hover:bg-green-50 flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Play className="w-3 h-3" />
                        Start Task
                      </button>
                    ) : null}
                    
                    {selectedTask.status === 'IN_PROGRESS' || selectedTask.status === 'In Progress' ? (
                      <>
                        <button
                          onClick={() => handlePauseTask(selectedTask)}
                          disabled={isTaskReadOnly(selectedTask) || getReassignmentState(selectedTask) === 'pending' || isTaskCompleted(selectedTask) || isTaskLocked(selectedTask)}
                          className="rounded-full border border-orange-200 px-3 py-1 text-orange-600 hover:bg-orange-50 flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Pause className="w-3 h-3" />
                          Pause
                        </button>
                        <TaskRequestButton
                          task={selectedTask}
                          projectId={selectedProjectId}
                          onSuccess={(updatedTask) => {
                            // Update the task in the local state
                            setTasks(prev => prev.map(t =>
                              (t.id || t._id) === (updatedTask.id || updatedTask._id) ? updatedTask : t
                            ));
                          }}
                        />
                      </>
                    ) : null}

                    {selectedTask.status === 'ON_HOLD' || selectedTask.status === 'On Hold' ? (
                      <button
                        onClick={() => handleResumeTask(selectedTask)}
                        disabled={isTaskReadOnly(selectedTask) || getReassignmentState(selectedTask) === 'pending' || isTaskCompleted(selectedTask) || isTaskLocked(selectedTask)}
                        className="rounded-full border border-blue-200 px-3 py-1 text-blue-600 hover:bg-blue-50 flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Resume
                      </button>
                    ) : null}

                    <button
                      onClick={() => handleOpenTimeline(selectedTask)}
                      disabled={isTaskReadOnly(selectedTask) || getReassignmentState(selectedTask) === 'pending' || isTaskCompleted(selectedTask)}
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
                        disabled={employees.length === 0 || isTaskReadOnly(selectedTask)}
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
                        disabled={reassigning || !selectedAssignee || employees.length === 0 || isTaskReadOnly(selectedTask)}
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
                    disabled={isTaskReadOnly(selectedTask) || getReassignmentState(selectedTask) === 'pending' || isTaskCompleted(selectedTask)}
                    className="mt-2 rounded-full border border-yellow-300 px-3 py-1 text-yellow-600 hover:bg-yellow-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Request Reassignment
                  </button>
                )}

                {/* CHECKLIST SECTION */}
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs uppercase text-gray-500">Checklist</p>
                    <span className="text-xs text-gray-500">
                      {selectedTaskChecklist.filter(item => item.status === 'Completed').length} / {selectedTaskChecklist.length} completed
                    </span>
                  </div>
                  {isTaskCompleted(selectedTask) && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 mb-3 text-sm text-green-700">
                      <p className="font-semibold">✓ Task Completed</p>
                      <p className="text-xs mt-1">Checklist is locked. No new items can be added to a completed task.</p>
                    </div>
                  )}
                  {selectedTaskChecklist.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">No checklist items yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {selectedTaskChecklist.map((item, index) => {
                        const itemId = item.id || item.public_id || `${index}`;
                        const isEditing = editingChecklistId === itemId;
                        const dueLabel = formatDateString(item.dueDate);
                        const isItemCompleted = item.status === 'Completed';

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
                                  disabled={isTaskCompleted(selectedTask)}
                                />
                                <input
                                  type="date"
                                  value={editingChecklistValues.dueDate}
                                  onChange={(e) =>
                                    setEditingChecklistValues((prev) => ({ ...prev, dueDate: e.target.value }))
                                  }
                                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                                  disabled={isTaskCompleted(selectedTask)}
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
                                {isItemCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" />
                                )}
                                <div>
                                  <p
                                    className={`font-medium ${
                                      isItemCompleted
                                        ? 'text-gray-400 line-through'
                                        : 'text-gray-900'
                                    }`}
                                  >
                                    {item.title || 'Untitled item'}
                                  </p>
                                  <p className="text-xs text-gray-500">Due {dueLabel}</p>
                                  {item.completedAt && (
                                    <p className="text-[10px] text-emerald-600">
                                      Completed {formatDateString(item.completedAt)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {!isItemCompleted && !isTaskCompleted(selectedTask) && (
                                <div className="flex items-center gap-2 text-xs uppercase text-gray-500">
                                  <button
                                    type="button"
                                    onClick={() => startEditingChecklist(item)}
                                    disabled={isTaskReadOnly(selectedTask) || getReassignmentState(selectedTask) === 'pending'}
                                    className="rounded-full border border-gray-200 px-3 py-1 hover:border-blue-300 hover:text-blue-600 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCompleteChecklist(item)}
                                    disabled={isTaskReadOnly(selectedTask) || actionRunning || getReassignmentState(selectedTask) === 'pending'}
                                    className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-600 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Mark complete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteChecklist(item)}
                                    disabled={isTaskReadOnly(selectedTask) || getReassignmentState(selectedTask) === 'pending'}
                                    className="rounded-full border border-rose-200 px-3 py-1 text-rose-600 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
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
                      disabled={isTaskCompleted(selectedTask) || isTaskReadOnly(selectedTask) || getReassignmentState(selectedTask) === 'pending'}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <input
                      type="date"
                      value={checklistForm.dueDate}
                      onChange={(e) => setChecklistForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                      disabled={isTaskCompleted(selectedTask) || isTaskReadOnly(selectedTask) || getReassignmentState(selectedTask) === 'pending'}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <button
                      type="submit"
                      disabled={actionRunning || isTaskCompleted(selectedTask) || isTaskReadOnly(selectedTask) || getReassignmentState(selectedTask) === 'pending'}
                      className="rounded-full bg-indigo-600 px-4 py-2 text-white disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                    >
                      {actionRunning ? 'Adding…' : isTaskCompleted(selectedTask) ? 'Task Completed - Cannot Add Items' : 'Add checklist'}
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
            // Extract task ID
            const taskId = normalizeId(resp.task);
            
            // Update reassignment requests state with the new request
            setReassignmentRequests(prev => ({
              ...prev,
              [taskId]: {
                id: resp.request.id,
                taskId: resp.request.task_id,
                status: resp.request.status,
                requested_at: resp.request.requested_at,
                responded_at: resp.request.responded_at,
              }
            }));
            
            // Update task status to On Hold and lock it
            updateLocalTaskState(taskId, {
              status: resp.task.status || 'On Hold',
              is_locked: true,
              lock_info: {
                is_locked: true,
                request_status: 'PENDING',
                request_id: resp.request.id
              }
            });
            
            // Show success message from API
            toast.success(resp?.message || 'Reassignment request submitted successfully');
          }
          // Reload tasks and reassignment requests to refresh UI
          refreshAllTasks();
        }}
      />
    </div>
  );
};

export default EmployeeTasks;