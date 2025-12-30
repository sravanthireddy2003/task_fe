import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';
import { selectUser } from '../redux/slices/authSlice';
import { AlertCircle, CheckCircle, XCircle, Play, Pause, RotateCcw, Check, Clock, Kanban, List, CheckSquare, MessageSquare, Plus, Send } from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';

const formatDateString = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

const formatDuration = (seconds) => {
  if (!seconds) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const normalizeId = (task) => {
  return task._id || task.id || task.public_id;
};

const getStatusClasses = (status) => {
  switch (status) {
      case 'Pending':
      return 'border-gray-300 bg-gray-50 text-gray-700';
    case 'In Progress':
      return 'border-blue-300 bg-blue-50 text-blue-700';
    case 'On Hold':
      return 'border-orange-300 bg-orange-50 text-orange-700';
    case 'Review':
      return 'border-purple-300 bg-purple-50 text-purple-700';
    case 'Completed':
      return 'border-green-300 bg-green-50 text-green-700';
    default:
      return 'border-gray-300 bg-gray-50 text-gray-700';
  }
};

const getTaskCardClasses = (hasPendingReassignment) => {
  const baseClasses = 'w-full rounded-2xl border bg-white px-4 py-3 shadow-sm';
  const conditionalClasses = hasPendingReassignment 
    ? 'border-orange-300 bg-orange-50 opacity-75' 
    : 'border-gray-200';
  return baseClasses + ' ' + conditionalClasses;
};

const EmployeeTasks = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const userRole = user?.role?.toLowerCase();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState(userRole === 'employee' ? 'kanban' : 'list');
  const [selectedTaskForChecklist, setSelectedTaskForChecklist] = useState(null);
  const [selectedTaskForReassignment, setSelectedTaskForReassignment] = useState(null);
  const [checklists, setChecklists] = useState({});
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newChecklistItemDueDate, setNewChecklistItemDueDate] = useState('');
  const [reassignmentRequests, setReassignmentRequests] = useState({});
  const [taskTimelines, setTaskTimelines] = useState({});
  const [selectedTaskForTimeline, setSelectedTaskForTimeline] = useState(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);

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
      if (Array.isArray(taskList)) {
        setTasks(taskList);
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
      }
    } catch (err) {
      setError(err?.message || 'Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadReassignmentRequests = async (projectId) => {
    if (!projectId) return;

    try {
      const response = await fetchWithTenant(`/api/projects/${projectId}/reassignment-requests`);
      if (response?.success && response.requests) {
        const requestsMap = {};
        response.requests.forEach(request => {
          const taskId = request.task_id || request.task?.id || request.task?.public_id;
          if (taskId) {
            requestsMap[taskId] = request;
          }
        });
        setReassignmentRequests(requestsMap);
      }
    } catch (error) {
      console.error('Failed to load reassignment requests:', error);
    }
  };

  const loadTaskTimeline = async (taskId) => {
    try {
      const response = await fetchWithTenant('/api/tasks/' + taskId + '/timeline');
      if (response?.success && response.data) {
        setTaskTimelines(prev => ({
          ...prev,
          [taskId]: response.data
        }));
      }
    } catch (error) {
      console.error('Failed to load task timeline:', error);
    }
  };

  const loadChecklist = async (taskId) => {
    try {
      const response = await fetchWithTenant('/api/employee/tasks/' + taskId + '/checklist');
      if (response?.success && response.checklist) {
        setChecklists(prev => ({
          ...prev,
          [taskId]: response.checklist
        }));
      }
    } catch (error) {
      console.error('Failed to load checklist:', error);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (userRole === 'employee') {
      loadTasks();
    } else if (selectedProjectId) {
      loadTasks(selectedProjectId);
      loadReassignmentRequests(selectedProjectId);
    }
  }, [selectedProjectId, userRole]);

  const handleStartTask = async (taskId) => {
    try {
      await fetchWithTenant('/api/tasks/' + taskId + '/start', {
        method: 'POST'
      });
      toast.success('Task started');
      loadTasks(selectedProjectId);
    } catch (error) {
      toast.error(error?.message || 'Failed to start task');
    }
  };

  const handlePauseTask = async (taskId) => {
    try {
      await fetchWithTenant('/api/tasks/' + taskId + '/pause', {
        method: 'POST'
      });
      toast.success('Task paused');
      loadTasks(selectedProjectId);
    } catch (error) {
      toast.error('Failed to pause task');
    }
  };

  const handleResumeTask = async (taskId) => {
    try {
      await fetchWithTenant('/api/tasks/' + taskId + '/resume', {
        method: 'POST'
      });
      toast.success('Task resumed');
      loadTasks(selectedProjectId);
    } catch (error) {
      toast.error('Failed to resume task');
    }
  };
  // wasedrftgyhujikl;

  const handleCompleteTask = async (taskId) => {
    try {
      await fetchWithTenant('/api/tasks/' + taskId + '/complete', {
        method: 'POST'
      });
      toast.success('Task completed');
      loadTasks(selectedProjectId);
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

  const handleMoveToTodo = async (taskId) => {
    try {
      await fetchWithTenant('/api/tasks/' + taskId + '/status', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'To Do',
          projectId: selectedProjectId,
          taskId: taskId
        })
      });
      toast.success('Task moved to To Do');
      loadTasks(selectedProjectId);
    } catch (error) {
      toast.error('Failed to move task to To Do');
    }
  };

  const handleAddChecklistItem = async (taskId, title, dueDate) => {
    if (!title.trim()) return;

    try {
      const payload = { title: title.trim() };
      if (dueDate) {
        payload.due_date = dueDate;
      }

      const response = await fetchWithTenant('/api/employee/tasks/' + taskId + '/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response?.success) {
        toast.success('Checklist item added');
        setNewChecklistItem('');
        if (userRole === 'employee') {
          loadTasks();
        } else {
          loadChecklist(taskId);
        }
      }
    } catch (error) {
      toast.error('Failed to add checklist item');
    }
  };

  const handleToggleChecklistItem = async (taskId, itemId, completed) => {
    try {
      const response = await fetchWithTenant('/api/employee/checklist/' + itemId + '/complete', {
        method: 'PATCH'
      });

      if (response?.success) {
        if (userRole === 'employee') {
          loadTasks();
        } else {
          loadChecklist(taskId);
        }
      }
    } catch (error) {
      toast.error('Failed to update checklist item');
    }
  };

  const handleDeleteChecklistItem = async (taskId, itemId) => {
    try {
      const response = await fetchWithTenant('/api/employee/checklist/' + itemId, {
        method: 'DELETE'
      });

      if (response?.success) {
        toast.success('Checklist item deleted');
        if (userRole === 'employee') {
          loadTasks();
        } else {
          loadChecklist(taskId);
        }
      }
    } catch (error) {
      toast.error('Failed to delete checklist item');
    }
  };

  const handleOpenChecklist = (task) => {
    setSelectedTaskForChecklist(task);
    loadChecklist(normalizeId(task));
    setShowChecklistModal(true);
  };

  const handleOpenTimeline = (task) => {
    setSelectedTaskForTimeline(task);
    loadTaskTimeline(normalizeId(task));
    setShowTimelineModal(true);
  };

  const handleReassignTaskRequest = async (task, reason) => {
    try {
      const taskId = normalizeId(task);
      const response = await fetchWithTenant(`/api/tasks/${taskId}/request-reassignment`, {
        method: 'POST',
        body: JSON.stringify({
          reason: reason.trim(),
          projectId: selectedProjectId
        })
      });

      if (response?.success) {
        toast.success(response.message || 'Reassignment request sent successfully');

        setReassignmentRequests(prev => ({
          ...prev,
          [taskId]: {
            ...response.request,
            employee: response.employee,
            manager: response.manager,
            project: response.project,
            task: response.task
          }
        }));

        setSelectedTaskForReassignment(null);
        loadTasks(selectedProjectId);
      } else {
        toast.error(response?.message || 'Failed to send reassignment request');
      }
    } catch (error) {
      console.error('Error submitting reassignment request:', error);
      toast.error('Failed to send reassignment request');
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
        toast.success(`Task status updated to ${updates.status}`);
        loadTasks(selectedProjectId);
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

  const handleMoveToInProgress = async (taskId) => {
    await handleUpdateTask(taskId, { status: 'In Progress' });
  };

  const handleMoveToOnHold = async (taskId) => {
    await handleUpdateTask(taskId, { status: 'On Hold' });
  };

  const handleMoveToCompleted = async (taskId) => {
    await handleUpdateTask(taskId, { status: 'Completed' });
  };

  const stats = useMemo(() => {
    const statusCounts = {
      'Pending': 0,
      'To Do': 0,
      'In Progress': 0,
      'On Hold': 0,
      'Review': 0,
      'Completed': 0
    };

    const overdue = [];
    const now = Date.now();

    tasks.forEach((task) => {
      const status = task.status || 'To Do';
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }

      const dueDate = new Date(task.due_date || task.dueDate || task.taskDate);
      if (!Number.isNaN(dueDate.getTime()) && dueDate.getTime() < now && status !== 'Completed') {
        overdue.push(task);
      }
    });

    return {
      total: tasks.length,
      overdue: overdue.length,
      statusCounts,
    };
  }, [tasks]);

  const selectedProject = projects.find(p =>
    (p.id || p._id || p.public_id) === selectedProjectId
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">
          {userRole === 'employee' ? 'My Tasks - Kanban Board' : 'My Tasks'}
        </h1>
        <p className="text-sm text-gray-600">
          {userRole === 'employee' 
            ? 'Manage your assigned tasks with drag-and-drop Kanban workflow and time tracking.'
            : 'View and manage your assigned tasks.'
          }
        </p>
      </div>

      {userRole !== 'employee' && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a project...</option>
                {projects.map((project) => (
                  <option
                    key={project.id || project._id || project.public_id}
                    value={project.id || project._id || project.public_id}
                  >
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => loadTasks(selectedProjectId)}
            disabled={loading || !selectedProjectId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      )}

      {userRole === 'employee' && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('kanban')}
                className={`px-3 py-2 rounded-md border ${
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
                className={`px-3 py-2 rounded-md border ${
                  view === 'list'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4 mr-2 inline" />
                List
              </button>
            </div>
          </div>

          <button
            onClick={() => loadTasks()}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      )}

      {(selectedProjectId || userRole === 'employee') && tasks.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-7">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Total</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Tasks</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-yellow-500">Pending</p>
            <p className="text-2xl font-semibold text-yellow-600">{stats.statusCounts['Pending']}</p>
            <p className="text-xs text-gray-500">Not Started</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">To Do</p>
            <p className="text-2xl font-semibold text-gray-600">{stats.statusCounts['To Do']}</p>
            <p className="text-xs text-gray-500">Ready</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-blue-500">In Progress</p>
            <p className="text-2xl font-semibold text-blue-600">{stats.statusCounts['In Progress']}</p>
            <p className="text-xs text-gray-500">Working</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-orange-500">On Hold</p>
            <p className="text-2xl font-semibold text-orange-600">{stats.statusCounts['On Hold']}</p>
            <p className="text-xs text-gray-500">Paused</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-purple-500">Review</p>
            <p className="text-2xl font-semibold text-purple-600">{stats.statusCounts['Review']}</p>
            <p className="text-xs text-gray-500">Reviewing</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-green-500">Completed</p>
            <p className="text-2xl font-semibold text-green-600">{stats.statusCounts['Completed']}</p>
            <p className="text-xs text-gray-500">Done</p>
          </div>
        </div>
      )}

      {(selectedProjectId || userRole === 'employee') ? (
        (view === 'kanban' && userRole === 'employee') ? (
          <KanbanBoard
            tasks={tasks}
            onUpdateTask={handleUpdateTask}
            onLoadTasks={() => loadTasks(userRole === 'employee' ? undefined : selectedProjectId)}
            userRole="employee"
            projectId={selectedProjectId}
            reassignmentRequests={reassignmentRequests}
            taskTimelines={taskTimelines}
          />
        ) : (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Assigned tasks</h2>
                <p className="text-xs text-gray-500">
                  {loading ? 'Refreshing tasks…' : `${tasks.length} total tasks`}
                </p>
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
                {tasks.map((task) => {
                  const taskId = normalizeId(task);
                  const status = task.status || 'Pending';
                  const reassignmentRequest = reassignmentRequests[taskId];
                  const hasPendingReassignment = reassignmentRequest?.status === 'PENDING';

                  return (
                    <div
                      key={taskId}
                      className={getTaskCardClasses(hasPendingReassignment)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-base font-semibold text-gray-900">
                            {task.title || task.name || 'Untitled task'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Due {formatDateString(task.due_date || task.dueDate)}
                          </p>
                          {hasPendingReassignment && (
                            <div className="mt-2 rounded-lg bg-orange-100 p-2 text-xs">
                              <div className="flex items-center gap-1 font-medium text-orange-800">
                                <AlertCircle className="w-3 h-3" />
                                Reassignment Requested
                              </div>
                              <p className="text-orange-700 mt-1">
                                Requested on {formatDateString(reassignmentRequest.requested_at)}
                              </p>
                              <p className="text-orange-600">
                                Manager: {reassignmentRequest.manager?.name || 'Pending'}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p>Priority: {task.priority || 'Medium'}</p>
                          <p className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(task.total_duration)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase">
                        <span className={'rounded-full border px-3 py-0.5 ' + getStatusClasses(status)}>
                          {status}
                        </span>
                      </div>

                      {userRole === 'employee' && task.checklist && task.checklist.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Checklist:</p>
                          <div className="space-y-1">
                            {task.checklist.map((item) => (
                              <div key={item.id} className="flex items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  checked={item.status === 'Completed' || status === 'Completed'}
                                  readOnly
                                  className="w-3 h-3"
                                />
                                <span className={item.status === 'Completed' || status === 'Completed' ? 'line-through text-gray-500' : ''}>
                                  {item.title}
                                </span>
                                {(item.status === 'Completed' || status === 'Completed') && <span className="text-green-600">(completed)</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {status === 'Pending' && !hasPendingReassignment && (
                          <button
                            onClick={() => handleStartTask(taskId)}
                            className="rounded-full border border-green-200 px-3 py-0.5 text-green-600 hover:bg-green-50 flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            Start
                          </button>
                        )}
                        {status === 'In Progress' && !hasPendingReassignment && (
                          <>
                            <button
                              onClick={() => handlePauseTask(taskId)}
                              className="rounded-full border border-orange-200 px-3 py-0.5 text-orange-600 hover:bg-orange-50 flex items-center gap-1"
                            >
                              <Pause className="w-3 h-3" />
                              Pause
                            </button>
                            <button
                              onClick={() => handleCompleteTask(taskId)}
                              className="rounded-full border border-green-200 px-3 py-0.5 text-green-600 hover:bg-green-50 flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Complete
                            </button>
                          </>
                        )}
                        {status === 'On Hold' && !hasPendingReassignment && (
                          <button
                            onClick={() => handleResumeTask(taskId)}
                            className="rounded-full border border-blue-200 px-3 py-0.5 text-blue-600 hover:bg-blue-50 flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Resume
                          </button>
                        )}

                        {userRole === 'employee' && (
                          <>
                            <button
                              onClick={() => handleOpenChecklist(task)}
                              className="rounded-full border border-purple-200 px-3 py-0.5 text-purple-600 hover:bg-purple-50 flex items-center gap-1"
                            >
                              <CheckSquare className="w-3 h-3" />
                              Checklist
                            </button>
                            <button
                              onClick={() => handleOpenTimeline(task)}
                              className="rounded-full border border-indigo-200 px-3 py-0.5 text-indigo-600 hover:bg-indigo-50 flex items-center gap-1"
                            >
                              <Clock className="w-3 h-3" />
                              Timeline
                            </button>
                            {!hasPendingReassignment && (
                              <button
                                onClick={() => setSelectedTaskForReassignment(task)}
                                className="rounded-full border border-yellow-200 px-3 py-0.5 text-yellow-600 hover:bg-yellow-50 flex items-center gap-1"
                              >
                                <MessageSquare className="w-3 h-3" />
                                Reassign
                              </button>
                            )}
                          </>
                        )}
                        {hasPendingReassignment && (
                          <span className="rounded-full border border-orange-200 px-3 py-0.5 text-orange-600 bg-orange-50 text-xs font-medium">
                            Pending Approval
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <Kanban className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Project</h3>
          <p className="text-gray-600">Choose a project from the dropdown above to view your assigned tasks.</p>
        </div>
      )}

      <ChecklistModal
        task={selectedTaskForChecklist}
        checklist={checklists}
        isOpen={showChecklistModal}
        onClose={() => {
          setShowChecklistModal(false);
          setSelectedTaskForChecklist(null);
          setNewChecklistItem('');
          setNewItemDueDate('');
        }}
        onAddItem={handleAddChecklistItem}
        onToggleItem={handleToggleChecklistItem}
        onDeleteItem={handleDeleteChecklistItem}
        newItem={newChecklistItem}
        setNewItem={setNewChecklistItem}
      />

      <ReassignTaskRequestModal
        task={selectedTaskForReassignment}
        isOpen={!!selectedTaskForReassignment}
        onClose={() => setSelectedTaskForReassignment(null)}
        onSubmit={handleReassignTaskRequest}
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

const ChecklistModal = ({ task, checklist, isOpen, onClose, onAddItem, onToggleItem, onDeleteItem, newItem, setNewItem }) => {
  const [newItemDueDate, setNewItemDueDate] = useState('');

  if (!isOpen || !task) return null;

  const taskId = normalizeId(task);
  const checklistItems = task?.checklist || checklist?.[taskId] || [];

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    onAddItem(taskId, newItem.trim(), newItemDueDate);
    setNewItem('');
    setNewItemDueDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-lg max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <XCircle className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Task Checklist</h2>
          <p className="text-gray-600 text-sm">{task.title || task.name || 'Untitled task'}</p>
        </div>

        <div className="mb-4">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
              placeholder="Add checklist item..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={newItemDueDate}
              onChange={(e) => setNewItemDueDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddItem}
              disabled={!newItem.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {checklistItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No checklist items yet</p>
              <p className="text-sm">Add your first item above</p>
            </div>
          ) : (
            checklistItems.map((item) => {
              const itemClass = item.status === 'Completed' 
                ? 'flex-1 text-sm line-through text-gray-500' 
                : 'flex-1 text-sm text-gray-900';
              
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={item.status === 'Completed'}
                    onChange={() => onToggleItem(taskId, item.id, item.status === 'Completed')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className={itemClass}>
                      {item.title}
                    </span>
                    {item.due_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {formatDateString(item.due_date)}
                      </p>
                    )}
                  </div>
                  {item.status === 'Completed' && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Completed
                    </span>
                  )}
                  <button
                    onClick={() => onDeleteItem(taskId, item.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              );
            })
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

const ReassignTaskRequestModal = ({ task, isOpen, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setLoading(true);
    try {
      await onSubmit(task, reason);
      setReason('');
      onClose();
    } catch (error) {
      console.error('Error submitting reassignment request:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <XCircle className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Request Task Reassignment</h2>
          <p className="text-gray-600 text-sm">{task.title || task.name || 'Untitled task'}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for reassignment
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need this task reassigned..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
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