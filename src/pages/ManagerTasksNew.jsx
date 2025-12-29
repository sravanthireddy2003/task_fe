import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { RefreshCw, Kanban, FolderKanban } from 'lucide-react';
import fetchWithTenant from '../utils/fetchWithTenant';
import { selectUser } from '../redux/slices/authSlice';
import KanbanBoard from '../components/KanbanBoard';

const ManagerTasks = () => {
  const user = useSelector(selectUser);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('kanban');
  const [selectedProjectId, setSelectedProjectId] = useState('all');

  const loadProjects = useCallback(async () => {
    try {
      const resp = await fetchWithTenant('/api/manager/projects');
      const data = Array.isArray(resp?.data) ? resp.data : resp;
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = '/api/manager/tasks';
      if (selectedProjectId !== 'all') {
        endpoint += `?projectId=${encodeURIComponent(selectedProjectId)}`;
      }
      const resp = await fetchWithTenant(endpoint);
      const data = Array.isArray(resp?.data) ? resp.data : resp;
      setTasks(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await fetchWithTenant(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      toast.success('Task updated successfully');
      loadTasks(); // Refresh tasks
    } catch (error) {
      toast.error('Failed to update task');
      throw error;
    }
  };

  const filteredTasks = selectedProjectId === 'all'
    ? tasks
    : tasks.filter(task => task.projectId === selectedProjectId || task.project_id === selectedProjectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <h3 className="text-xl font-bold text-red-800 mb-2">Failed to load tasks</h3>
        <p className="text-red-600 mb-6">{error}</p>
        <button
          onClick={loadTasks}
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manager Tasks</h1>
          <p className="mt-2 text-gray-600">
            Manage tasks across your projects with Kanban board
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadTasks}
            disabled={loading}
            className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            title="Refresh tasks"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`px-3 py-2 rounded-lg border ${view === 'kanban' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          >
            <Kanban className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Project Filter */}
      <div className="bg-white rounded-xl border p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Project
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Projects</option>
          {projects.map(project => (
            <option key={project.id || project._id} value={project.id || project._id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{filteredTasks.length}</div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-blue-600">
            {filteredTasks.filter(t => t.stage === 'IN_PROGRESS' || t.status === 'in_progress').length}
          </div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-yellow-600">
            {filteredTasks.filter(t => t.stage === 'PENDING' || t.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {filteredTasks.filter(t => t.stage === 'COMPLETED' || t.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        tasks={filteredTasks}
        onUpdateTask={handleUpdateTask}
        onLoadTasks={loadTasks}
        userRole="manager"
        projectId={selectedProjectId}
        showProjectSelector={selectedProjectId === 'all'}
        onProjectChange={setSelectedProjectId}
        projects={projects}
      />

      {filteredTasks.length === 0 && (
        <div className="bg-white border rounded-xl p-12 text-center">
          <FolderKanban className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Found</h3>
          <p className="text-gray-600">
            {selectedProjectId === 'all'
              ? 'No tasks found across your projects.'
              : 'No tasks found for the selected project.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ManagerTasks;