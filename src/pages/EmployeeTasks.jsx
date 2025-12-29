import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';
import { selectUser } from '../redux/slices/authSlice';
import { AlertCircle, CheckCircle, XCircle, Play, Pause, RotateCcw, Check, Clock, Kanban, List } from 'lucide-react';
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

const normalizeId = (entity) =>
  entity?.id || entity?._id || entity?.public_id || entity?.task_id || '';

const EmployeeTasks = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const userRole = user?.role?.toLowerCase();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Only employees get Kanban view by default, others get list view
  const [view, setView] = useState(userRole === 'employee' ? 'kanban' : 'list');

  // Load assigned projects
  const loadProjects = async () => {
    try {
      const response = await fetchWithTenant('/api/projects');
      const data = response?.data || response || [];
      if (Array.isArray(data)) {
        setProjects(data);
        // Auto-select first project if available
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id || data[0]._id || data[0].public_id);
        }
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  // Load tasks for selected project
  const loadTasks = async (projectId) => {
    if (!projectId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithTenant(`/api/projects/${projectId}/tasks`);
      const data = response?.data || response || {};
      const taskList = data.tasks || data || [];
      if (Array.isArray(taskList)) {
        setTasks(taskList);
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

  // Initialize
  useEffect(() => {
    loadProjects();
  }, []);

  // Load tasks when project changes
  useEffect(() => {
    if (selectedProjectId) {
      loadTasks(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Task action handlers with updated workflow
  const handleStartTask = async (taskId) => {
    try {
      await fetchWithTenant(`/api/tasks/${taskId}/start`, {
        method: 'POST'
      });
      toast.success('Task started');
      loadTasks(selectedProjectId);
    } catch (error) {
      toast.error('Failed to start task');
    }
  };

  const handlePauseTask = async (taskId) => {
    try {
      await fetchWithTenant(`/api/tasks/${taskId}/pause`, {
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
      await fetchWithTenant(`/api/tasks/${taskId}/resume`, {
        method: 'POST'
      });
      toast.success('Task resumed');
      loadTasks(selectedProjectId);
    } catch (error) {
      toast.error('Failed to resume task');
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await fetchWithTenant(`/api/tasks/${taskId}/complete`, {
        method: 'POST'
      });
      toast.success('Task completed');
      loadTasks(selectedProjectId);
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  // Move to Review (In Progress → Review)
  const handleMoveToReview = async (taskId) => {
    try {
      await fetchWithTenant(`/api/tasks/${taskId}/status`, {
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

  // Move to To Do (PENDING → To Do)
  const handleMoveToTodo = async (taskId) => {
    try {
      await fetchWithTenant(`/api/tasks/${taskId}/status`, {
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

  // Kanban status update handler
  const handleUpdateTask = async (taskId, updates) => {
    try {
      await fetchWithTenant(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...updates,
          projectId: selectedProjectId,
          taskId: taskId
        })
      });
      toast.success('Task updated successfully');
      loadTasks(selectedProjectId);
    } catch (error) {
      toast.error('Failed to update task');
      throw error;
    }
  };

  // Get task statistics
  const stats = useMemo(() => {
    const statusCounts = {
      'PENDING': 0,
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

      // Check for overdue tasks
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

  // Get selected project
  const selectedProject = projects.find(p =>
    (p.id || p._id || p.public_id) === selectedProjectId
  );

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Project Selection */}
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

          {/* View Toggle - Only show Kanban for employees */}
          {userRole === 'employee' && (
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
          )}
        </div>

        <button
          onClick={() => loadTasks(selectedProjectId)}
          disabled={loading || !selectedProjectId}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      {selectedProjectId && (
        <div className="grid gap-4 sm:grid-cols-7">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Total</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Tasks</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-yellow-500">Pending</p>
            <p className="text-2xl font-semibold text-yellow-600">{stats.statusCounts['PENDING']}</p>
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

      {/* Task View - Kanban for employees, List for admins/managers */}
      {selectedProjectId ? (
        (view === 'kanban' && userRole === 'employee') ? (
          <KanbanBoard
            tasks={tasks}
            onUpdateTask={handleUpdateTask}
            onLoadTasks={() => loadTasks(selectedProjectId)}
            userRole="employee"
            projectId={selectedProjectId}
          />
        ) : (
          /* Task List View */
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
                  const status = task.status || 'To Do';

                  return (
                    <div
                      key={taskId}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-base font-semibold text-gray-900">
                            {task.title || task.name || 'Untitled task'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Due {formatDateString(task.due_date || task.dueDate)}
                          </p>
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
                        <span className={`rounded-full border px-3 py-0.5 ${
                          status === 'To Do' ? 'border-blue-200 text-blue-600' :
                          status === 'In Progress' ? 'border-yellow-200 text-yellow-600' :
                          status === 'On Hold' ? 'border-orange-200 text-orange-600' :
                          status === 'Review' ? 'border-purple-200 text-purple-600' :
                          'border-green-200 text-green-600'
                        }`}>
                          {status}
                        </span>

                        {/* Action Buttons */}
                        <div className="flex gap-1 ml-auto">
                          {status === 'To Do' && (
                            <button
                              onClick={() => handleStartTask(taskId)}
                              className="rounded-full border border-green-200 px-3 py-0.5 text-green-600 hover:bg-green-50 flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" />
                              Start
                            </button>
                          )}
                          {status === 'In Progress' && (
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
                          {status === 'On Hold' && (
                            <button
                              onClick={() => handleResumeTask(taskId)}
                              className="rounded-full border border-blue-200 px-3 py-0.5 text-blue-600 hover:bg-blue-50 flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Resume
                            </button>
                          )}
                        </div>
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
    </div>
  );
};

export default EmployeeTasks;