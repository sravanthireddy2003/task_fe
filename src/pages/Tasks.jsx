import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, Filter, List, Grid } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';

import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  selectTasks,
  selectTaskStatus,
  selectTaskError,
} from '../redux/slices/taskSlice';
import { fetchProjects, selectProjects } from '../redux/slices/projectSlice';
import { selectDepartments } from '../redux/slices/departmentSlice';
import { fetchUsers, selectUsers } from '../redux/slices/userSlice';

export default function Tasks() {
  const dispatch = useDispatch();

  // Redux state
  const tasks = useSelector(selectTasks) || [];
  const status = useSelector(selectTaskStatus);
  const error = useSelector(selectTaskError);
  const projects = useSelector(selectProjects) || [];
  const departments = useSelector(selectDepartments) || [];
  const users = useSelector(selectUsers) || [];

  // Local UI state
  const [view, setView] = useState('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_id: '',
    assigned_to: '',
    estimated_hours: '',
    due_date: '',
    priority: 'medium',
    status: 'pending',
  });

  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeStatusEdit, setActiveStatusEdit] = useState(null);

  const statusOptions = ['pending', 'in_progress', 'completed', 'on_hold'];
  const priorityOptions = ['low', 'medium', 'high'];

  const isLoading = status === 'loading';

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchProjects());
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (error) toast.error(error?.message || String(error));
  }, [error]);

  const openModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        name: task.title || task.name || '',
        description: task.description || '',
        project_id: task.projectPublicId || task.project_public_id || task.project_id || '',
        assigned_to: task.assignedTo || task.assigned_to || '',
        estimated_hours: task.estimatedHours || task.estimated_hours || '',
        due_date: task.dueDate || task.due_date || '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
      });
    } else {
      setEditingTask(null);
      setFormData({
        name: '',
        description: '',
        project_id: '',
        assigned_to: '',
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
      const projectPublicId = formData.project_id || null;

      // Resolve selected project object from projects slice
      const selectedProject = projects.find(
        (p) => (p.public_id || p.id || p._id) === projectPublicId
      );

      // Derive department ids: prefer explicit form field, else use first department of selected project
      const departmentPublicId =
        formData.department_id ||
        selectedProject?.departments?.[0]?.public_id ||
        selectedProject?.departments?.[0]?.id ||
        null;

      // Also include backup numeric/internal ids where available to satisfy APIs that accept either
      const projectId = selectedProject?.id || selectedProject?._id || null;
      const departmentId =
        selectedProject?.departments?.[0]?.id || selectedProject?.departments?.[0]?._id || null;

      if (!formData.name || (!projectPublicId && !projectId)) {
        toast.error('Please provide a task name and select a project');
        return;
      }

      const payload = {
        projectPublicId: projectPublicId || undefined,
        projectId: projectId || undefined,
        departmentPublicId: departmentPublicId || undefined,
        departmentId: departmentId || undefined,
        title: formData.name,
        description: formData.description,
        assignedTo: formData.assigned_to || null,
        estimatedHours: formData.estimated_hours ? Number(formData.estimated_hours) : 0,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.due_date || null,
      };

      if (editingTask) {
        const taskId = editingTask.public_id || editingTask.id || editingTask._id;
        await dispatch(updateTask({ taskId, data: payload })).unwrap();
        toast.success('Task updated successfully');
      } else {
        await dispatch(createTask(payload)).unwrap();
        toast.success('Task created successfully');
      }

      closeModal();
      await dispatch(fetchTasks()).unwrap();
    } catch (err) {
      toast.error(err?.message || 'Operation failed');
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const taskId = task.public_id || task.id || task._id;
      await dispatch(deleteTask(taskId)).unwrap();
      toast.success('Task deleted');
      await dispatch(fetchTasks()).unwrap();
    } catch (err) {
      toast.error(err?.message || 'Delete failed');
    }
  };

  const updateStatusInline = async (task, newStatus) => {
    if (!newStatus) return;
    try {
      const taskId = task.public_id || task.id || task._id;
      await dispatch(updateTask({ taskId, data: { status: newStatus } })).unwrap();
      setActiveStatusEdit(null);
      await dispatch(fetchTasks()).unwrap();
    } catch (err) {
      toast.error(err?.message || 'Status update failed');
    }
  };

  // Filters
  const filteredTasks = tasks.filter((task) => {
    const projectMatch =
      filterProject === 'all' ||
      [
        task.project_id,
        task.projectId,
        task.project_public_id,
        task.projectPublicId,
        String(task.project_id),
        String(task.project_public_id),
      ].some((v) => v !== undefined && v !== null && String(v) === String(filterProject));
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    return projectMatch && statusMatch;
  });

  const getProjectName = (projectId) => {
    return projects.find((p) => (p.id || p._id || p.public_id) === projectId)?.name || '-';
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    on_hold: 'bg-red-100 text-red-700',
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tasks</h1>
          <p className="text-gray-600">Manage and track all your tasks</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-lg border ${view === 'list' ? 'bg-blue-100 border-blue-400' : 'bg-white'}`}
          >
            <List className="w-5 h-5 text-blue-600" />
          </button>

          <button
            onClick={() => setView('card')}
            className={`p-2 rounded-lg border ${view === 'card' ? 'bg-blue-100 border-blue-400' : 'bg-white'}`}
          >
            <Grid className="w-5 h-5 text-blue-600" />
          </button>

          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Task
          </button>
        </div>
      </div>

      {/* STATUS SUMMARY */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="px-4 py-2 rounded-lg bg-yellow-100 text-yellow-700 font-semibold shadow-sm">
          Pending : {tasks.filter((t) => t.status === 'pending').length}
        </div>
        <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold shadow-sm">
          In-Progress : {tasks.filter((t) => t.status === 'in_progress').length}
        </div>
        <div className="px-4 py-2 rounded-lg bg-green-100 text-green-700 font-semibold shadow-sm">
          Completed : {tasks.filter((t) => t.status === 'completed').length}
        </div>
        <div className="px-4 py-2 rounded-lg bg-red-100 text-red-700 font-semibold shadow-sm">
          On-Hold : {tasks.filter((t) => t.status === 'on_hold').length}
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl border p-4 mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">Filters:</span>
        </div>

        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.public_id || p.id || p._id} value={p.public_id || p.id || p._id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full table-auto">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3 text-left">Task</th>
                <th className="p-3 text-left">Project</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Priority</th>
                <th className="p-3 text-left">Due Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No tasks found
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.public_id || task.id || task._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium">{task.title || task.name}</div>
                      <div className="text-sm text-gray-500">{task.description}</div>
                    </td>

                    <td className="p-3">
                      <span className="px-3 py-1 rounded-full text-white text-sm bg-blue-600">
                        {getProjectName(task.projectPublicId || task.project_public_id || task.project_id)}
                      </span>
                    </td>

                    <td className="p-3">
                      {activeStatusEdit === (task.public_id || task.id || task._id) ? (
                        <select
                          value={task.status}
                          onChange={(e) => updateStatusInline(task, e.target.value)}
                          className="border rounded-lg px-2 py-1"
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {s.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          onClick={() => setActiveStatusEdit(task.public_id || task.id || task._id)}
                          className={`px-3 py-1 rounded-full cursor-pointer text-sm ${statusColors[task.status]}`}
                        >
                          {task.status?.replace('_', ' ') || '-'}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-sm ${priorityColors[task.priority]}`}>
                        {(task.priority || 'medium').toUpperCase()}
                      </span>
                    </td>

                    <td className="p-3 text-sm">{task.dueDate || task.due_date || '-'}</td>

                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openModal(task)}
                          className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
      {view === 'card' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTasks.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tasks found</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.public_id || task.id || task._id} className="bg-white border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{task.title || task.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(task)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(task)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {getProjectName(task.projectPublicId || task.project_public_id || task.project_id)}
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-gray-600 text-sm">Status: </span>
                  <span className={`ml-2 px-3 py-1 rounded-full text-sm ${statusColors[task.status]}`}>{task.status}</span>
                </div>

                <div className="mb-3">
                  <span className="text-gray-600 text-sm">Priority: </span>
                  <span className={`ml-2 px-3 py-1 rounded-full text-sm ${priorityColors[task.priority]}`}>
                    {(task.priority || 'medium').toUpperCase()}
                  </span>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-xs text-gray-500">Due: {task.dueDate || task.due_date || '-'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{editingTask ? 'Edit Task' : 'Add Task'}</h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Task Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Project <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={formData.project_id}
                      onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select project --</option>
                      {projects.map((p) => (
                        <option key={p.public_id || p.id || p._id} value={p.public_id || p.id || p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {priorityOptions.map((p) => (
                        <option key={p} value={p}>
                          {p.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Assign To</label>
                    <select
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select user (optional) --</option>
                      {users.map((u) => (
                        <option key={u.public_id || u.id || u._id} value={u.public_id || u.id || u._id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Estimated Hours</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.estimated_hours}
                      onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 16"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Due Date</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  {editingTask ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}