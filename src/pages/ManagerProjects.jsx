import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';
import { selectUser } from '../redux/slices/authSlice';

const ManagerProjects = () => {
  const user = useSelector(selectUser);
  const resources = user?.resources || {};
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState(null);
  const [clientOptions, setClientOptions] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState(null);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    client_id: '',
    priority: 'Medium',
    start_date: '',
    end_date: '',
    budget: '',
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const resp = await fetchWithTenant('/api/manager/projects');
      const data = Array.isArray(resp?.data) ? resp.data : resp;
      setProjects(Array.isArray(data) ? data : []);
      setProjectsError(null);
    } catch (err) {
      setProjectsError(err.message || 'Unable to load manager projects');
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  const loadClients = useCallback(async () => {
    setClientsLoading(true);
    try {
      const resp = await fetchWithTenant('/api/manager/clients');
      const data = Array.isArray(resp?.data) ? resp.data : resp;
      setClientOptions(Array.isArray(data) ? data : []);
      setClientsError(null);
    } catch (err) {
      setClientsError(err.message || 'Unable to load clients');
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
    loadClients();
  }, [loadProjects, loadClients]);

  const handleCreateProject = async (event) => {
    event.preventDefault();
    if (!projectForm.name || !projectForm.client_id) {
      toast.error('Project name and client are required');
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        name: projectForm.name,
        description: projectForm.description,
        client_id: projectForm.client_id,
        priority: projectForm.priority,
        startDate: projectForm.start_date ? new Date(projectForm.start_date).toISOString() : undefined,
        endDate: projectForm.end_date ? new Date(projectForm.end_date).toISOString() : undefined,
        budget: projectForm.budget ? Number(projectForm.budget) : undefined,
      };
      const resp = await fetchWithTenant('/api/manager/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast.success(resp?.message || 'Project created');
      setProjectForm({ name: '', description: '', client_id: '', priority: 'Medium', start_date: '', end_date: '', budget: '' });
      setShowCreateForm(false);
      loadProjects();
    } catch (err) {
      toast.error(err.message || 'Unable to create project');
    } finally {
      setActionLoading(false);
    }
  };

  const statusOptions = useMemo(() => {
    const map = new Map();
    projects.forEach((project) => {
      if (project.status) {
        map.set(project.status, true);
      }
    });
    const base = ['Planning', 'Active', 'Completed'];
    const extras = Array.from(map.keys()).filter((item) => !base.includes(item));
    return [...base, ...extras];
  }, [projects]);

  const priorityOptions = useMemo(() => {
    const map = new Map();
    projects.forEach((project) => {
      if (project.priority) {
        map.set(project.priority, true);
      }
    });
    const base = ['High', 'Medium', 'Low'];
    const extras = Array.from(map.keys()).filter((item) => !base.includes(item));
    return [...base, ...extras];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (filterStatus && project.status?.toLowerCase() !== filterStatus.toLowerCase()) {
        return false;
      }
      if (filterPriority && project.priority?.toLowerCase() !== filterPriority.toLowerCase()) {
        return false;
      }
      if (searchTerm) {
        const needle = searchTerm.toLowerCase();
        return (
          project.name?.toLowerCase().includes(needle) ||
          project.client?.name?.toLowerCase().includes(needle) ||
          project.project_manager?.name?.toLowerCase().includes(needle)
        );
      }
      return true;
    });
  }, [projects, filterStatus, filterPriority, searchTerm]);

  const canCreate = resources.canCreateClients || resources.canCreateProjects;

  return (
    <div className="w-full p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assigned Client Projects</h1>
        <p className="mt-1 text-sm text-gray-600">
          Only projects for your assigned clients are listed here.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-600 shadow-sm">
            Search
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Project, client, or manager"
              className="w-40 bg-transparent px-1 text-xs text-gray-600 outline-none"
            />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-600 shadow-sm">
            Status
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-xs text-gray-600 outline-none"
            >
              <option value="">All</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-600 shadow-sm">
            Priority
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-transparent text-xs text-gray-600 outline-none"
            >
              <option value="">All</option>
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateForm((visible) => !visible)}
            className="rounded-full border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50"
          >
            {showCreateForm ? 'Hide create form' : 'Create project'}
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {projectsLoading ? (
          <div className="p-6 text-center text-sm text-gray-500">Loading projects...</div>
        ) : projectsError ? (
          <div className="p-6 text-center text-sm text-red-500">{projectsError}</div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">No projects match the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Manager</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">End</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr key={project.id || project.public_id || project._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{project.name}</td>
                    <td className="px-4 py-3 text-gray-700">{project.client?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{project.project_manager?.name || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-700 uppercase tracking-wide">{project.status || 'planning'}</td>
                    <td className="px-4 py-3 text-xs text-gray-700 uppercase tracking-wide">{project.priority || 'medium'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {canCreate && showCreateForm && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Create Project</h2>
          <p className="text-sm text-gray-500">Use this form to launch a new project for an assigned client.</p>
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleCreateProject}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Project Name</label>
              <input
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Client</label>
              <select
                value={projectForm.client_id}
                onChange={(e) => setProjectForm({ ...projectForm, client_id: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-100"
                disabled={clientsLoading}
              >
                <option value="">Select client</option>
                {(clientOptions || []).map((client) => (
                  <option
                    key={client.public_id || client.id || client._id}
                    value={client.public_id || client.id || client._id}
                  >
                    {client.name}
                  </option>
                ))}
              </select>
              {clientsLoading && (
                <p className="mt-1 text-xs text-gray-500">Loading clients...</p>
              )}
              {clientsError && (
                <p className="mt-1 text-xs text-red-500">{clientsError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                value={projectForm.priority}
                onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-100"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={projectForm.start_date}
                onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={projectForm.end_date}
                onChange={(e) => setProjectForm({ ...projectForm, end_date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Budget</label>
              <input
                type="number"
                value={projectForm.budget}
                onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
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
                {actionLoading ? 'Creating...' : 'Create project'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManagerProjects;
