import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';

const formatDateString = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

const formatForInput = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
};

const normalizeId = (entity) =>
  entity?.id || entity?._id || entity?.public_id || entity?.task_id || '';

const EmployeeTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checklistForm, setChecklistForm] = useState({ title: '', dueDate: '' });
  const [editingChecklistId, setEditingChecklistId] = useState('');
  const [editingChecklistValues, setEditingChecklistValues] = useState({ title: '', dueDate: '' });
  const [actionRunning, setActionRunning] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithTenant('/api/employee/my-tasks');
      const payload = response?.data || response || [];
      if (!Array.isArray(payload)) {
        throw new Error('Unexpected task data');
      }
      setTasks(payload);
    } catch (err) {
      setError(err?.message || 'Unable to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (tasks.length && !selectedTaskId) {
      setSelectedTaskId(normalizeId(tasks[0]));
    }
    if (!tasks.length) {
      setSelectedTaskId('');
    }
  }, [tasks, selectedTaskId]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find((task) => normalizeId(task) === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  const checklistItems = useMemo(() => {
    if (!selectedTask) return [];
    return (
      selectedTask.checklist ||
      selectedTask.checkList ||
      selectedTask.items ||
      selectedTask.subtasks ||
      []
    );
  }, [selectedTask]);

  const stats = useMemo(() => {
    const stageCounters = { pending: 0, in_progress: 0, completed: 0 };
    const overdue = [];
    const now = Date.now();
    tasks.forEach((task) => {
      const stage = (task.stage || task.status || 'pending').toString().toLowerCase();
      if (stageCounters[stage] !== undefined) {
        stageCounters[stage] += 1;
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
      toast.success(resp?.message || 'Checklist item added');
      setChecklistForm({ title: '', dueDate: '' });
      await loadTasks();
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
      toast.success(resp?.message || 'Checklist item updated');
      cancelEditing();
      await loadTasks();
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
      await loadTasks();
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
      toast.success(resp?.message || 'Checklist marked complete');
      await loadTasks();
    } catch (err) {
      toast.error(err?.message || 'Unable to update checklist status');
    } finally {
      setActionRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="text-sm text-gray-600">Track your assignments and keep checklists aligned with manager expectations.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1.2fr)]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Assigned tasks</h2>
              <p className="text-xs text-gray-500">{loading ? 'Refreshing tasks…' : `${tasks.length} total tasks`}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <button
                type="button"
                onClick={loadTasks}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 hover:bg-gray-100"
              >
                Refresh
              </button>
              <Link to="/employee/tasks" className="text-blue-600 hover:underline">
                Full task view
              </Link>
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
                const isActive = taskId === selectedTaskId;
                return (
                  <button
                    key={taskId || task.title}
                    type="button"
                    onClick={() => setSelectedTaskId(taskId)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50 ${
                      isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
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
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase">
                      <span className="rounded-full border border-gray-200 px-3 py-0.5 text-gray-600">
                        {task.stage || task.status || 'pending'}
                      </span>
                      <span className="rounded-full border border-gray-200 px-3 py-0.5 text-gray-600">
                        {task.client?.name || 'Client not available'}
                      </span>
                    </div>
                    {task.description && (
                      <p className="mt-3 text-sm text-gray-600 line-clamp-2">{task.description}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {!selectedTask ? (
            <div className="space-y-2 text-sm text-gray-500">
              <p>Select a task to see richer details and manage its checklist.</p>
              <p>Checklist items live-update and sync with the employee APIs.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">{selectedTask.title}</h2>
                  <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase text-gray-600">
                    {selectedTask.stage || selectedTask.status || 'pending'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {selectedTask.project?.name && `Project: ${selectedTask.project.name}`}
                </p>
                <p className="text-xs text-gray-400">Due {formatDateString(selectedTask.taskDate || selectedTask.dueDate || selectedTask.due_date)}</p>
              </div>
              {selectedTask.description && (
                <div>
                  <p className="text-xs uppercase text-gray-500">Description</p>
                  <p className="mt-1 text-sm text-gray-700">{selectedTask.description}</p>
                </div>
              )}

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm">
                <p className="text-xs uppercase text-gray-500">Checklist</p>
                {checklistItems.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">No checklist items yet.</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {checklistItems.map((item, index) => {
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
                                  className="rounded-full bg-indigo-600 px-4 py-1.5 text-white disabled:opacity-60"
                                >
                                  {actionRunning ? 'Saving…' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditing}
                                  className="rounded-full border border-gray-200 px-4 py-1.5 text-gray-600"
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
                            {item.status?.toLowerCase?.() !== 'completed' ? (
                              <div className="flex items-center gap-2 text-xs uppercase text-gray-500">
                                <button
                                  type="button"
                                  onClick={() => startEditingChecklist(item)}
                                  className="rounded-full border border-gray-200 px-3 py-1 hover:border-blue-300 hover:text-blue-600"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCompleteChecklist(item)}
                                  disabled={actionRunning}
                                  className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-600"
                                >
                                  Mark complete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteChecklist(item)}
                                  className="rounded-full border border-rose-200 px-3 py-1 text-rose-600"
                                >
                                  Delete
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                                Completed
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <form onSubmit={handleAddChecklist} className="mt-4 space-y-2 text-sm">
                  <div>
                    <label className="text-xs uppercase text-gray-500">Add checklist item</label>
                    <input
                      type="text"
                      placeholder="Title"
                      value={checklistForm.title}
                      onChange={(e) => setChecklistForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase text-gray-500">Due date</label>
                    <input
                      type="date"
                      value={checklistForm.dueDate}
                      onChange={(e) => setChecklistForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={actionRunning}
                    className="w-full rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {actionRunning ? 'Adding…' : 'Add checklist item'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default EmployeeTasks;