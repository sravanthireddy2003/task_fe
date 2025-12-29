import React, { useEffect, useMemo, useState } from 'react';
import { httpGetService } from '../App/httpHandler';
import { toast } from 'sonner';
import { 
  ArrowUpRight, 
  TrendingUp, 
  Users, 
  Briefcase, 
  CheckSquare, 
  Target,
  BarChart3,
  Calendar,
  Clock,
  ChevronRight
} from 'lucide-react';

const normalizeList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const ManagerDashboard = () => {
  const [metrics, setMetrics] = useState({ projectCount: 0, taskCount: 0, clientCount: 0 });
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dashboardResponse, clientsResponse, projectsResponse, employeesResponse, tasksResponse] = await Promise.all([
          httpGetService('api/manager/dashboard'),
          httpGetService('api/manager/clients'),
          httpGetService('api/manager/projects'),
          httpGetService('api/manager/employees/all'),
          httpGetService('api/manager/my-tasks'),
        ]);

        setMetrics(dashboardResponse?.data || dashboardResponse || {});
        setClients(normalizeList(clientsResponse));
        setProjects(normalizeList(projectsResponse));
        setEmployees(normalizeList(employeesResponse));
        setTasks(normalizeList(tasksResponse));
      } catch (err) {
        const message = err?.message || err?.data?.message || 'Unable to load manager dashboard';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const latestClients = useMemo(() => clients.slice(0, 5), [clients]);
  const latestProjects = useMemo(() => projects.slice(0, 5), [projects]);

  const getPriorityVariant = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'bg-gradient-to-r from-red-500 to-orange-500 text-white';
      case 'high':
        return 'bg-gradient-to-r from-orange-500 to-amber-500 text-white';
      case 'medium':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'low':
        return 'bg-gradient-to-r from-gray-500 to-gray-400 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-400 text-white';
    }
  };

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'development':
      case 'execution':
        return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white';
      case 'planning':
      case 'design':
        return 'bg-gradient-to-r from-purple-500 to-violet-500 text-white';
      case 'review':
        return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-400 text-white';
    }
  };

  // Calculate completion percentage for projects (example)
  const getProjectProgress = (project) => {
    // This is a placeholder - you might want to fetch actual progress data
    const randomProgress = Math.floor(Math.random() * 100);
    return {
      percentage: randomProgress,
      color: randomProgress > 70 ? 'bg-emerald-500' : randomProgress > 40 ? 'bg-blue-500' : 'bg-amber-500'
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Dashboard Overview
                <span className="block text-lg font-normal text-gray-600 mt-1">
                  Welcome back! Here's what's happening with your projects today.
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Updated just now</span>
                </div>
              </div>
              <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div>
                  <div className="font-semibold text-red-900">Error Loading Dashboard</div>
                  <div className="text-sm text-red-700 mt-1">{error}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Projects Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Projects</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-3xl font-bold text-gray-900">
                        {loading ? '...' : metrics.projectCount}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-600 px-2 py-1 rounded-full">
                        <TrendingUp className="h-3 w-3" />
                        +12%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Active projects under your management
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>

          {/* Tasks Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-green-200 rounded-xl flex items-center justify-center">
                    <CheckSquare className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Tasks</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-3xl font-bold text-gray-900">
                        {loading ? '...' : metrics.taskCount}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-600 px-2 py-1 rounded-full">
                        <TrendingUp className="h-3 w-3" />
                        +8%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Tasks assigned and in progress
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>

          {/* Clients Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-violet-200 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Clients</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-3xl font-bold text-gray-900">
                        {loading ? '...' : metrics.clientCount}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-600 px-2 py-1 rounded-full">
                        <TrendingUp className="h-3 w-3" />
                        +5%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Clients managed by your team
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects and Clients Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latest Projects */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-600" />
                    Latest Projects
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Recently updated initiatives</p>
                </div>
                <div className="text-sm font-medium text-indigo-600">
                  {projects.length} total
                </div>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 animate-pulse rounded-lg bg-gradient-to-r from-gray-100 to-gray-200"></div>
                    ))}
                  </div>
                ) : latestProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-gray-300 bg-gradient-to-b from-gray-50 to-white">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-4">
                      <Briefcase className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">No projects to display</div>
                      <div className="text-sm text-gray-500 mt-1">Projects will appear here once created</div>
                    </div>
                  </div>
                ) : (
                  latestProjects.map((project) => {
                    const progress = getProjectProgress(project);
                    return (
                      <div
                        key={project.id || project.public_id || project._id}
                        className="group bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-lg flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-indigo-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                  {project.name}
                                </h3>
                                {project.client?.name && (
                                  <p className="text-sm text-gray-600 mt-1">{project.client.name}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 mb-4">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusVariant(project.status || project.stage)}`}>
                                {project.status || project.stage || 'Active'}
                              </span>
                              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getPriorityVariant(project.priority)}`}>
                                {project.priority || 'Medium'} Priority
                              </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>Progress</span>
                                <span className="font-semibold">{progress.percentage}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${progress.color}`} style={{ width: `${progress.percentage}%` }}></div>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {!loading && projects.length > 5 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button className="w-full py-3 bg-gradient-to-r from-gray-50 to-white text-gray-700 rounded-xl font-medium hover:from-gray-100 hover:to-gray-50 transition-all duration-200 border border-gray-300 hover:border-gray-400 flex items-center justify-center gap-2">
                    View All Projects
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Clients */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Assigned Clients
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Your client portfolio</p>
                </div>
                <div className="text-sm font-medium text-purple-600">
                  {clients.length} total
                </div>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 animate-pulse rounded-lg bg-gradient-to-r from-gray-100 to-gray-200"></div>
                    ))}
                  </div>
                ) : latestClients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-gray-300 bg-gradient-to-b from-gray-50 to-white">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-4">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">No clients assigned</div>
                      <div className="text-sm text-gray-500 mt-1">Clients will appear here once assigned</div>
                    </div>
                  </div>
                ) : (
                  latestClients.map((client) => (
                    <div
                      key={client.id || client.public_id || client._id}
                      className="group bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl flex items-center justify-center">
                              <Users className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full border-2 border-white flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                              {client.name || client.company || 'Client'}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Since {new Date().getFullYear() - Math.floor(Math.random() * 3)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {client.company && client.name !== client.company ? client.company : 'No Company'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {!loading && clients.length > 5 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button className="w-full py-3 bg-gradient-to-r from-gray-50 to-white text-gray-700 rounded-xl font-medium hover:from-gray-100 hover:to-gray-50 transition-all duration-200 border border-gray-300 hover:border-gray-400 flex items-center justify-center gap-2">
                    View All Clients
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <div className="text-sm text-blue-700 font-medium">Avg. Project Completion</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">68%</div>
          </div>
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
            <div className="text-sm text-emerald-700 font-medium">Tasks Due This Week</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">24</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-200">
            <div className="text-sm text-purple-700 font-medium">Active Team Members</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{loading ? '...' : employees.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;