import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import * as Icons from '../icons';
import ViewToggle from "../components/ViewToggle";

const { FolderKanban, List, Grid } = Icons;
import fetchWithTenant from '../utils/fetchWithTenant';
import { selectUser } from '../redux/slices/authSlice';

const ManagerProjects = () => {
  const user = useSelector(selectUser);
  const resources = user?.resources || {};
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState(null);
  const [projectStats, setProjectStats] = useState({});
  const [projectSummary, setProjectSummary] = useState({});
  const [clientOptions, setClientOptions] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [view, setView] = useState('list');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedSummaryProject, setSelectedSummaryProject] = useState(null);

  const statusOptions = ["Planning", "Active", "On Hold", "Completed", "Cancelled"];
  const statusColors = {
    "Planning": "bg-yellow-100 text-yellow-700",
    "Active": "bg-blue-100 text-blue-700",
    "Completed": "bg-green-100 text-green-700",
    "On Hold": "bg-red-100 text-red-700",
    "Cancelled": "bg-gray-100 text-gray-700",
  };

  const priorityOptions = ["Low", "Medium", "High"];

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

  const loadProjectStats = useCallback(async () => {
    try {
      const resp = await fetchWithTenant('api/projects/stats');
      setProjectStats(resp?.data || resp || {});
    } catch (err) {
      console.error('Failed to load project stats:', err);
    }
  }, []);

  const loadProjectSummary = useCallback(async (projectId) => {
    try {
      const resp = await fetchWithTenant(`api/projects/${projectId}/summary`);
      setProjectSummary(resp?.data || resp || {});
    } catch (err) {
      console.error('Failed to load project summary:', err);
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
    loadProjectStats();
  }, [loadProjects, loadClients, loadProjectStats]);

  // Helper function to format date from ISO string
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Helper function to get client name by ID
  const getClientName = (clientId) => {
    if (!clientId) return "-";
    // clientId may be a public_id or a client object
    if (typeof clientId === 'object') return clientId.name || '-';
    const client = clientOptions.find((c) => (c.public_id || c.id || c._id) === clientId) ||
      clientOptions.find((c) => c.name === clientId);
    return client?.name || "-";
  };

  const handleViewSummary = async (project) => {
    try {
      const projectId = project.public_id || project.id || project._id;
      await loadProjectSummary(projectId);
      setSelectedSummaryProject(project);
      setShowSummaryModal(true);
    } catch (err) {
      console.error('Summary error:', err);
      toast.error(err?.message || 'Failed to load project summary');
    }
  };

  // Filters
  const filteredProjects = projects.filter((project) => {
    const statusMatch = filterStatus === "all" || project.status === filterStatus;
    const priorityMatch = filterPriority === "all" || project.priority === filterPriority;
    const searchMatch = !searchTerm ||
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getClientName(project.client || project.client_id)?.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && priorityMatch && searchMatch;
  });

  return (
    <div className="w-full p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manager Projects</h1>
        <p className="mt-2 text-gray-600">
          Overview of projects assigned to your clients.
        </p>
      </div>

      {/* PROJECT STATS DASHBOARD */}
      {projectStats && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{projectStats.projects?.total || 0}</div>
              <div className="text-sm text-gray-600">Total Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{projectStats.tasks?.total || 0}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{projectStats.tasks?.totalHours || 0}h</div>
              <div className="text-sm text-gray-600">Total Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{projectStats.subtasks?.total || 0}</div>
              <div className="text-sm text-gray-600">Total Subtasks</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">{projectStats.projects?.byStatus?.Planning || 0}</div>
              <div className="text-sm text-gray-600">Planning</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">{projectStats.projects?.byStatus?.Active || 0}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
          </div>

          {/* Tasks by Stage Breakdown */}
          <div className="mt-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Tasks by Stage</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(projectStats.tasks?.byStage || {}).map(([stage, count]) => (
                <div key={stage} className="px-3 py-2 bg-gray-100 rounded-lg">
                  <div className="text-sm font-medium text-gray-900">{stage}: {count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Summary */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="px-4 py-2 rounded-lg bg-yellow-100 text-yellow-700 font-semibold shadow-sm">
          Planning: {projects.filter(p => p.status === "Planning").length}
        </div>

        <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold shadow-sm">
          Active: {projects.filter(p => p.status === "Active").length}
        </div>

        <div className="px-4 py-2 rounded-lg bg-green-100 text-green-700 font-semibold shadow-sm">
          Completed: {projects.filter(p => p.status === "Completed").length}
        </div>

        <div className="px-4 py-2 rounded-lg bg-red-100 text-red-700 font-semibold shadow-sm">
          On Hold: {projects.filter(p => p.status === "On Hold").length}
        </div>

        <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold shadow-sm">
          Cancelled: {projects.filter(p => p.status === "Cancelled").length}
        </div>
      </div>

      {/* VIEW TOGGLE AND FILTERS */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <ViewToggle
            mode={view === 'list' ? 'list' : 'grid'}
            onChange={(mode) => setView(mode === 'list' ? 'list' : 'card')}
          />
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-600 shadow-sm">
            Search
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Project or client"
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
              <option value="all">All Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
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
              <option value="all">All Priority</option>
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* LOADING STATE */}
      {projectsLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full" />
        </div>
      ) : projectsError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="text-red-600 font-semibold">Error Loading Projects</div>
          <div className="text-red-500 mt-2">{projectsError}</div>
        </div>
      ) : (
        <>
          {/* LIST VIEW */}
          {view === "list" && (
            <div className="tm-list-container">
              <table className="w-full table-auto">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-3 text-left">Project</th>
                    <th className="p-3 text-left">Client</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Priority</th>
                    <th className="p-3 text-left">Duration</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.id || project._id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{project.name}</td>
                      <td className="p-3 text-sm">{getClientName(project.client || project.client_id)}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[project.status] || 'bg-gray-100 text-gray-700'}`}>
                          {project.status || 'Planning'}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-600 uppercase tracking-wide">{project.priority || 'Medium'}</td>
                      <td className="p-3 text-sm text-gray-600">{formatDate(project.start_date)} → {formatDate(project.end_date)}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleViewSummary(project)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                          title="View Summary"
                        >
                          📊
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* CARD VIEW */}
          {view === "card" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div key={project.id || project._id} className="tm-card-shell">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FolderKanban className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-600">{getClientName(project.client || project.client_id)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[project.status] || 'bg-gray-100 text-gray-700'}`}>
                      {project.status || 'Planning'}
                    </span>
                  </div>

                  {project.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Priority: <span className="font-semibold">{project.priority || 'Medium'}</span></span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Budget: <span className="font-semibold">{project.budget ? `$${project.budget}` : 'N/A'}</span></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t">
                    <span>📅 {formatDate(project.start_date)}</span>
                    <span>→</span>
                    <span>{formatDate(project.end_date)}</span>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => handleViewSummary(project)}
                      className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                    >
                      View Summary
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredProjects.length === 0 && (
            <div className="bg-white border rounded-xl p-12 text-center">
              <FolderKanban className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Found</h3>
              <p className="text-gray-600">No projects match your current filters.</p>
            </div>
          )}
        </>
      )}

      {/* SUMMARY MODAL */}
      {showSummaryModal && selectedSummaryProject && projectSummary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Project Summary - {selectedSummaryProject.name}
              </h2>
              <button
                onClick={() => { setShowSummaryModal(false); setSelectedSummaryProject(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Project Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Project Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium ml-2">{projectSummary.project?.name || selectedSummaryProject.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ml-2 px-2 py-1 rounded-full text-xs ${
                    projectSummary.project?.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    projectSummary.project?.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {projectSummary.project?.status || selectedSummaryProject.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Description:</span>
                  <span className="font-medium ml-2">{projectSummary.project?.description || selectedSummaryProject.description}</span>
                </div>
              </div>
            </div>

            {/* Project Stats */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{projectSummary.tasks?.total || 0}</div>
                  <div className="text-sm text-gray-600">Total Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{projectSummary.tasks?.completed || 0}</div>
                  <div className="text-sm text-gray-600">Completed Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{projectSummary.tasks?.inProgress || 0}</div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{(projectSummary.tasks?.total || 0) - (projectSummary.tasks?.completed || 0) - (projectSummary.tasks?.inProgress || 0)}</div>
                  <div className="text-sm text-gray-600">Pending Tasks</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">{projectSummary.totalHours || 0}h</div>
                  <div className="text-sm text-gray-600">Total Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">{projectSummary.progressPercentage || 0}%</div>
                  <div className="text-sm text-gray-600">Progress</div>
                </div>
              </div>

              {/* Tasks by Stage */}
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Tasks by Stage</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(projectSummary.tasks?.byStage || {}).map(([stage, count]) => (
                    <div key={stage} className="px-3 py-2 bg-white rounded-lg border">
                      <div className="text-sm font-medium text-gray-900">{stage}: {count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Project Overview</h3>
              <div className="text-center py-4 text-gray-500">
                <p>Project summary loaded successfully</p>
                <p className="text-sm mt-2">Activity timeline and detailed logs can be added in future updates</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerProjects;
