import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { List, Grid, Filter } from 'lucide-react';
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
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [activeStatusEdit, setActiveStatusEdit] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);

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

  const handleStatusUpdate = async (project, newStatus) => {
    setStatusUpdating(project.id || project.public_id || project._id);
    try {
      const resp = await fetchWithTenant(`/api/manager/projects/${project.id || project.public_id || project._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(resp?.message || 'Status updated successfully');
      setActiveStatusEdit(null);
      loadProjects(); // Refresh projects list
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  const statusOptions = useMemo(() => {
    const map = new Map();
    projects.forEach((project) => {
      if (project.status) map.set(project.status, true);
    });
    const base = ['Planning', 'Active', 'Completed', 'On Hold', 'Cancelled'];
    const extras = Array.from(map.keys()).filter((item) => !base.includes(item));
    return [...base, ...extras];
  }, [projects]);

  const priorityOptions = useMemo(() => {
    const map = new Map();
    projects.forEach((project) => {
      if (project.priority) map.set(project.priority, true);
    });
    const base = ['High', 'Medium', 'Low'];
    const extras = Array.from(map.keys()).filter((item) => !base.includes(item));
    return [...base, ...extras];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (filterStatus !== 'all' && project.status?.toLowerCase() !== filterStatus.toLowerCase()) {
        return false;
      }
      if (filterPriority !== 'all' && project.priority?.toLowerCase() !== filterPriority.toLowerCase()) {
        return false;
      }
      if (searchTerm) {
        const needle = searchTerm.toLowerCase();
        return (
          project.name?.toLowerCase().includes(needle) ||
          project.client?.name?.toLowerCase().includes(needle) ||
          project.manager?.name?.toLowerCase().includes(needle)
        );
      }
      return true;
    });
  }, [projects, filterStatus, filterPriority, searchTerm]);

  const statusCounts = useMemo(() => {
    const counts = { Planning: 0, Active: 0, Completed: 0, 'On Hold': 0, Cancelled: 0 };
    projects.forEach((project) => {
      counts[project.status || 'Planning'] = (counts[project.status || 'Planning'] || 0) + 1;
    });
    return counts;
  }, [projects]);

  const statusColors = {
    Planning: 'bg-yellow-100 text-yellow-700',
    Active: 'bg-blue-100 text-blue-700',
    Completed: 'bg-green-100 text-green-700',
    'On Hold': 'bg-red-100 text-red-700',
    Cancelled: 'bg-gray-100 text-gray-700',
  };

  const getStatusColor = (status) => statusColors[status] || 'bg-gray-100 text-gray-700';

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString() : '-';
  };

  const projectKey = (project) => project.id || project.public_id || project._id;

  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Assigned Client Projects</h1>
          <p className="text-gray-600">View and manage your assigned client projects</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg border ${
              viewMode === 'list' ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-200'
            } hover:shadow-sm transition-all`}
          >
            <List className="w-5 h-5 text-blue-600" />
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`p-2 rounded-lg border ${
              viewMode === 'card' ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-200'
            } hover:shadow-sm transition-all`}
          >
            <Grid className="w-5 h-5 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="px-4 py-2 rounded-lg bg-yellow-100 text-yellow-700 font-semibold shadow-sm">
          Planning: {statusCounts.Planning}
        </div>
        <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold shadow-sm">
          Active: {statusCounts.Active}
        </div>
        <div className="px-4 py-2 rounded-lg bg-green-100 text-green-700 font-semibold shadow-sm">
          Completed: {statusCounts.Completed}
        </div>
        <div className="px-4 py-2 rounded-lg bg-red-100 text-red-700 font-semibold shadow-sm">
          On Hold: {statusCounts['On Hold']}
        </div>
        <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold shadow-sm">
          Cancelled: {statusCounts.Cancelled}
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="bg-white rounded-xl border p-4 mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700 font-medium">Filters:</span>
        </div>
        
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search projects, clients, managers..."
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Priority</option>
          {priorityOptions.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          {projectsLoading ? (
            <div className="p-12 text-center text-gray-500">Loading projects...</div>
          ) : projectsError ? (
            <div className="p-12 text-center text-red-500">{projectsError}</div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No projects match the current filters.</div>
          ) : (
            <table className="w-full table-auto">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Project</th>
                  <th className="px-4 py-4">Client</th>
                  <th className="px-4 py-4">Manager</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Priority</th>
                  <th className="px-4 py-4">Duration</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr
                    key={projectKey(project)}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td 
                      className="px-6 py-4 font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                      onClick={() => handleProjectClick(project)}
                    >
                      {project.name}
                    </td>
                    <td className="px-4 py-4 text-gray-700">{project.client?.name || '-'}</td>
                    <td className="px-4 py-4 text-gray-700">{project.manager?.name || '-'}</td>
                    <td className="px-4 py-4">
                      {activeStatusEdit === projectKey(project) ? (
                        <select
                          value={project.status || 'Planning'}
                          onChange={(e) => handleStatusUpdate(project, e.target.value)}
                          onBlur={() => setActiveStatusEdit(null)}
                          autoFocus
                          disabled={statusUpdating === projectKey(project)}
                          className="border border-blue-300 rounded-lg px-3 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          onClick={() => setActiveStatusEdit(projectKey(project))}
                          className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-all ${getStatusColor(project.status)}`}
                          title="Click to edit status"
                        >
                          {project.status || 'Planning'}
                          {statusUpdating === projectKey(project) && (
                            <span className="ml-1">⟳</span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.priority) || 'bg-gray-100 text-gray-700'}`}>
                        {project.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {formatDate(project.startDate)} → {formatDate(project.endDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CARD VIEW */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projectsLoading ? (
            <div className="col-span-full text-center py-12 text-gray-500">Loading projects...</div>
          ) : projectsError ? (
            <div className="col-span-full text-center py-12 text-red-500">{projectsError}</div>
          ) : filteredProjects.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No projects match the current filters.
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={projectKey(project)}
                className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 pr-4">
                    <h3 
                      className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer line-clamp-2"
                      onClick={() => handleProjectClick(project)}
                    >
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Client
                    </span>
                    <span className="text-sm font-medium text-gray-900">{project.client?.name || '-'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Manager
                    </span>
                    <span className="text-sm font-medium text-gray-900">{project.manager?.name || '-'}</span>
                  </div>

                  {project.budget && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Budget
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        ${Number(project.budget).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600 text-sm font-medium">Status</span>
                    {activeStatusEdit === projectKey(project) ? (
                      <select
                        value={project.status || 'Planning'}
                        onChange={(e) => handleStatusUpdate(project, e.target.value)}
                        onBlur={() => setActiveStatusEdit(null)}
                        autoFocus
                        disabled={statusUpdating === projectKey(project)}
                        className="border border-blue-300 rounded-lg px-3 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-all ${getStatusColor(project.status)}`}
                        onClick={() => setActiveStatusEdit(projectKey(project))}
                        title="Click to edit status"
                      >
                        {project.status || 'Planning'}
                        {statusUpdating === projectKey(project) && (
                          <span className="ml-1">⟳</span>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>📅 {formatDate(project.startDate)}</span>
                    <span>→</span>
                    <span>{formatDate(project.endDate)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-700 pt-2 border-t">
                    <span className="font-semibold">
                      Priority:{' '}
                      <span className="font-bold text-sm">{project.priority || 'Medium'}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Project Details Modal */}
      {showProjectDetails && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowProjectDetails(false)}>
          <div 
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h2>
              <button
                onClick={() => setShowProjectDetails(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">Client</h3>
                      <p className="text-gray-600">{selectedProject.client?.name || '-'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedProject.priority) || 'bg-gray-100 text-gray-700'}`}>
                      {selectedProject.priority || 'Medium'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Manager</h3>
                    <p className="text-gray-600">{selectedProject.manager?.name || '-'}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Status</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedProject.status)}`}>
                      {selectedProject.status || 'Planning'}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Timeline</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start Date</span>
                        <span>{formatDate(selectedProject.startDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">End Date</span>
                        <span>{formatDate(selectedProject.endDate)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Budget</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      ${selectedProject.budget ? Number(selectedProject.budget).toLocaleString() : '0'}
                    </p>
                  </div>
                </div>
              </div>
              {selectedProject.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedProject.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerProjects;
