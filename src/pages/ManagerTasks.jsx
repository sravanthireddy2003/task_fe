import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';
import { selectUser } from '../redux/slices/authSlice';

const ManagerTasks = () => {
  const user = useSelector(selectUser);
  const resources = user?.resources || {};
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
    assignedUsers: '',
    projectId: '',
    timeAlloted: 8,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [hasAutoSelectedProject, setHasAutoSelectedProject] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [reassigning, setReassigning] = useState(false);

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
      const resp = await fetchWithTenant('/api/manager/employees');
      const data = Array.isArray(resp?.data) ? resp.data : resp;
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      // ignore silently; employees not required to show tasks
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
      // silently ignore, projects optional for tasks
    } finally {
      setProjectsLoading(false);
    }
  }, []);

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
    if (!selectedProjectId && projects.length && !hasAutoSelectedProject) {
      const firstProject = projects[0];
      const firstId = firstProject?.public_id || firstProject?.id || firstProject?._id || firstProject?.internalId || '';
      if (firstId) {
        setSelectedProjectId(firstId);
        setHasAutoSelectedProject(true);
      }
    }
    if (!projects.length) {
      setHasAutoSelectedProject(false);
    }
  }, [projects, selectedProjectId, hasAutoSelectedProject]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const detailProject = selectedTask?.project || selectedTask?.meta?.project;
  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return (
      projects.find((project) => {
        const projectId = project.public_id || project.id || project._id || project.internalId;
        return projectId === selectedProjectId;
      }) || null
    );
  }, [projects, selectedProjectId]);
  const stages = useMemo(() => ['PENDING', 'IN_PROGRESS', 'COMPLETED'], []);
  const stageCounts = useMemo(() => {
    const counts = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 };
    tasks.forEach((task) => {
      const stage = (task.stage || task.status || '').toString().toUpperCase();
      if (stage && counts.hasOwnProperty(stage)) {
        counts[stage] += 1;
      }
    });
    return counts;
  }, [tasks]);
  const overdueTasksCount = useMemo(() => {
    const now = Date.now();
    return tasks.filter((task) => {
      const rawDate = task.taskDate || task.due_date;
      if (!rawDate) return false;
      const parsed = new Date(rawDate);
      if (Number.isNaN(parsed.getTime())) return false;
      return parsed.getTime() < now && (task.stage || task.status || '').toString().toUpperCase() !== 'COMPLETED';
    }).length;
  }, [tasks]);

  const assignedUsers = useMemo(() => {
    if (!selectedTask) return [];
    if (Array.isArray(selectedTask.assignedUsers) && selectedTask.assignedUsers.length) {
      return selectedTask.assignedUsers.map((user) => user.name);
    }
    if (Array.isArray(selectedTask.assigned_to) && selectedTask.assigned_to.length) {
      return selectedTask.assigned_to;
    }
    return [];
  }, [selectedTask]);

  useEffect(() => {
    if (!selectedTask || !employees.length) return;
    const primaryAssignee = selectedTask.assignedUsers?.[0] || selectedTask.assigned_to?.[0];
    if (primaryAssignee) {
      const match = employees.find((emp) =>
        String(emp.internalId || emp.id || emp._id || emp.public_id) === String(primaryAssignee.internalId || primaryAssignee.id || primaryAssignee._id || primaryAssignee)
      );
      setSelectedAssignee(match?.internalId || match?.id || match?._id || match?.public_id || primaryAssignee.internalId || primaryAssignee.id || primaryAssignee);
    }
  }, [selectedTask, employees]);

  const documents = useMemo(() => {
    if (!selectedTask) return [];
    return selectedTask.documents || selectedTask.files || [];
  }, [selectedTask]);

  const timeline = useMemo(() => {
    if (!selectedTask) return [];
    return selectedTask.activityTimeline || selectedTask.activities || [];
  }, [selectedTask]);

  const checklist = useMemo(() => {
    if (!selectedTask) return [];
    return selectedTask.checklist || [];
  }, [selectedTask]);

  const formattedDue = useMemo(() => {
    if (!selectedTask) return '—';
    const raw = selectedTask.taskDate || selectedTask.due_date;
    if (!raw) return '—';
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? raw : date.toLocaleDateString();
  }, [selectedTask]);

  const handleCreateTask = async (event) => {
    event.preventDefault();
    if (!formData.title || !formData.projectId) {
      toast.error('Title and project are required');
      return;
    }
    setActionLoading(true);
    try {
      const selectedProject = projects.find(
        (project) => project.public_id === formData.projectId || project.id === formData.projectId || project._id === formData.projectId,
      );
      const payload = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        stage: formData.stage,
        taskDate: formData.taskDate ? new Date(formData.taskDate).toISOString() : undefined,
        timeAlloted: Number(formData.timeAlloted) || 0,
        projectId: formData.projectId,
        client_id: selectedProject?.client?.public_id || selectedProject?.client?.id || selectedProject?.client_id,
        assigned_to: formData.assignedUsers
          .split(',')
          .map((name) => name.trim())
          .filter(Boolean),
      };
      const resp = await fetchWithTenant('/api/manager/task', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast.success(resp?.message || 'Task created');
      setFormData({ ...formData, title: '', description: '', assignedUsers: '' });
      const projectToReload = formData.projectId || selectedProjectId;
      if (projectToReload) {
        if (projectToReload === selectedProjectId) {
          loadTasks(projectToReload);
        } else {
          setSelectedProjectId(projectToReload);
        }
      }
    } catch (err) {
      toast.error(err?.message || 'Unable to create task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassignTask = async () => {
    if (!selectedTask) return;
    if (!selectedAssignee) {
      toast.error('Select an employee to reassign the task.');
      return;
    }
    setReassigning(true);
    try {
      const projectId =
        selectedTask.project_id || selectedTask.projectId || detailProject?.id || detailProject?.public_id || detailProject?._id;
      const taskId = selectedTask.id || selectedTask.public_id || selectedTask._id || selectedTask.internalId;
      const payload = {
        assigned_to: [selectedAssignee],
        projectId,
      };
      const resp = await fetchWithTenant(`/api/projects/tasks/${encodeURIComponent(taskId)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      toast.success(resp?.message || 'Task reassigned');
      const targetEmployee = employees.find((emp) =>
        String(emp.internalId || emp.id || emp._id || emp.public_id) === String(selectedAssignee)
      );
      setSelectedTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          assignedUsers: targetEmployee
            ? [
                {
                  id: targetEmployee.public_id || targetEmployee.id || targetEmployee._id,
                  name: targetEmployee.name || targetEmployee.title || 'Employee',
                  internalId: targetEmployee.internalId || targetEmployee.id || targetEmployee._id,
                },
              ]
            : prev.assignedUsers,
          assigned_to: targetEmployee
            ? [
                targetEmployee.internalId || targetEmployee.public_id || targetEmployee.id || targetEmployee._id,
              ]
            : prev.assigned_to,
        };
      });
      if (selectedProjectId) {
        loadTasks(selectedProjectId);
      }
    } catch (err) {
      toast.error(err?.message || 'Unable to reassign task');
    } finally {
      setReassigning(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Client Tasks</h1>
        <p className="text-sm text-gray-600">Tasks pulled from your manager feed.</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600">
            Filter by project
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={projectsLoading}
              className="bg-transparent text-xs text-gray-600 outline-none"
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option
                  key={project.public_id || project.id || project._id}
                  value={project.public_id || project.id || project._id}
                >
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <div className="text-xs text-gray-500">
            {projectsLoading
              ? 'Refreshing projects…'
              : selectedProject
                ? `Active: ${selectedProject.name}`
                : 'No project selected yet'}
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Tasks</p>
            <p className="text-2xl font-semibold text-gray-900">{tasks.length}</p>
            <p className="text-xs text-gray-500">Active this view</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Overdue</p>
            <p className="text-2xl font-semibold text-amber-500">{overdueTasksCount}</p>
            <p className="text-xs text-gray-500">Needs attention</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Completed</p>
            <p className="text-2xl font-semibold text-emerald-500">{stageCounts.COMPLETED}</p>
            <p className="text-xs text-gray-500">Done items</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.15fr)]">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          {!selectedProjectId ? (
            <div className="text-sm text-gray-500">Select a project to show its tasks.</div>
          ) : loading ? (
            <div className="text-sm text-gray-500">Loading tasks...</div>
          ) : error ? (
            <div className="text-sm text-red-500">Error: {error}</div>
          ) : tasks.length === 0 ? (
            <div className="text-sm text-gray-500">No tasks yet for this project.</div>
          ) : (
            <div className="grid gap-4">
              {tasks.map((task) => {
                const rowKey = task.id || task.public_id || task._id || task.internalId;
                const isActive = selectedTask?.id === task.id || selectedTask?.public_id === task.public_id;
                return (
                  <button
                    key={rowKey}
                    type="button"
                    onClick={() => setSelectedTask(task)}
                    className={`rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left transition hover:border-blue-300 hover:bg-white ${
                      isActive ? 'border-blue-500 bg-blue-50 shadow-sm' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          {task.client?.name || task.project?.client?.name || 'Unknown client'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase">
                        <span className="rounded-full border border-gray-200 px-3 py-0.5 text-gray-600">
                          {task.stage || task.status || 'pending'}
                        </span>
                        <span className="rounded-full border border-gray-200 px-3 py-0.5 text-gray-600">
                          {task.priority || 'medium'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
                      <span>
                        Due:{' '}
                        {task.taskDate
                          ? new Date(task.taskDate).toLocaleDateString()
                          : task.due_date || 'N/A'}
                      </span>
                      <span>
                        Time allotted: {task.timeAlloted ?? task.time_alloted ?? '—'} hrs
                      </span>
                      <span>
                        Assigned:{' '}
                        {Array.isArray(task.assignedUsers)
                          ? task.assignedUsers.map((user) => user.name).join(', ')
                          : (task.assigned_to || []).join(', ') || '-'}
                      </span>
                    </div>
                    {task.description && (
                      <p className="mt-3 text-sm text-gray-700">{task.description}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {!selectedTask ? (
            <div className="text-sm text-gray-500">Select a task to view full details.</div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedTask.title}</h2>
                  <p className="text-xs uppercase text-gray-500">
                    {selectedTask.client?.name || detailProject?.client?.name || 'Client not available'}
                  </p>
                </div>
                <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase text-gray-600">
                  {selectedTask.stage || selectedTask.status || 'pending'}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs uppercase text-gray-500">Project</p>
                  <p className="text-sm font-semibold text-gray-900">{detailProject?.name || 'Unknown project'}</p>
                  <p className="text-xs text-gray-500">{detailProject?.status || detailProject?.stage}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Priority</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedTask.priority || 'Medium'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Due date</p>
                  <p className="text-sm font-semibold text-gray-900">{formattedDue}</p>
                </div>
              </div>

              {selectedTask.description && (
                <div>
                  <p className="text-xs uppercase text-gray-500">Description</p>
                  <p className="mt-1 text-sm text-gray-700">{selectedTask.description}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-gray-500">Assigned users</p>
                  <p className="mt-1 text-sm text-gray-700">
                    {assignedUsers.length ? assignedUsers.join(', ') : 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Time allotted</p>
                  <p className="mt-1 text-sm text-gray-700">{selectedTask.timeAlloted ?? selectedTask.time_alloted ?? '—'} hrs</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase text-gray-500">Reassign task</p>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    disabled={employeesLoading}
                    className="h-10 min-w-[180px] rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm disabled:cursor-wait"
                  >
                    <option value="">Select employee</option>
                    {employees.map((employee) => {
                      const key = employee.internalId || employee.id || employee.public_id || employee._id;
                      return (
                        <option key={key} value={key}>
                          {employee.name || employee.email || 'Unnamed employee'}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="button"
                    onClick={handleReassignTask}
                    disabled={reassigning || !selectedAssignee || employeesLoading}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {reassigning ? 'Reassigning…' : 'Reassign'}
                  </button>
                </div>
                {employeesLoading && <p className="text-xs text-gray-400">Loading employees…</p>}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-gray-500">Checklist</p>
                  {checklist.length ? (
                    <ul className="mt-2 space-y-2 text-sm text-gray-700">
                      {checklist.map((item, index) => (
                        <li key={item.id || item.title || index} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          {item.title || 'Untitled item'}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">No checklist items.</p>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Activity timeline</p>
                  {timeline.length ? (
                    <ul className="mt-2 space-y-2 text-sm text-gray-700">
                      {timeline.map((activity, index) => (
                        <li key={activity.id || activity.title || index} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">{activity.time || activity.createdAt || '—'}</p>
                          <p>{activity.title || activity.description || 'Activity'}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">No activity logged yet.</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase text-gray-500">Documents & files</p>
                {documents.length ? (
                  <ul className="mt-2 space-y-2 text-sm text-gray-700">
                    {documents.map((file, index) => (
                      <li key={file.id || file.name || file.file_id || index}>
                        <a
                          href={file.url || file.file_url || file.path || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline"
                        >
                          {file.name || file.title || file.original_name || 'View file'}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">No documents uploaded.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>


      {resources.canCreateTasks && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Create Task</h2>
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleCreateTask}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Project</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-100"
                disabled={projectsLoading}
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.public_id || project.id || project._id} value={project.public_id || project.id || project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stage</label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-100"
              >
                {stages.map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-100"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                value={formData.taskDate}
                onChange={(e) => setFormData({ ...formData, taskDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Time (hours)</label>
              <input
                type="number"
                value={formData.timeAlloted}
                onChange={(e) => setFormData({ ...formData, timeAlloted: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Assigned Users (comma separated)</label>
              <input
                value={formData.assignedUsers}
                onChange={(e) => setFormData({ ...formData, assignedUsers: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-100"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Creating...' : 'Create task'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManagerTasks;
