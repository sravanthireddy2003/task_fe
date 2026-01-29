import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { httpGetService, httpPatchService, httpPostService } from '../App/httpHandler';
import * as Icons from '../icons';
import RefreshButton from '../components/RefreshButton';
import PageHeader from '../components/PageHeader';
import GridCard from "../components/ui/GridCard";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, XAxis, YAxis, CartesianGrid, Bar } from 'recharts';

const { ArrowUpRight, TrendingUp, Users, Briefcase, CheckSquare, Target, BarChart3, Calendar, Clock: ClockIcon, ChevronRight, AlertTriangle, MoreVertical, AlertCircle, List, Grid, CheckCircle } = Icons;

const normalizeList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const ManagerDashboard = () => {
  // States
  const [metrics, setMetrics] = useState({ projectCount: 0, taskCount: 0, clientCount: 0, activeTasks: 0 });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  // Load dashboard data from dynamic manager overview response
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboardResponse = await httpGetService('api/manager/overview');

      const root = dashboardResponse?.data || dashboardResponse || {};
      const metricsBlock = root.metrics || {};
      const tasksArray = normalizeList(root.tasks);

      // Derive task-based metrics dynamically from the tasks array
      const completedTasks = tasksArray.filter((task) => {
        const status = (task.status || task.stage || '').toString().toLowerCase();
        return status.includes('completed');
      }).length;

      const now = new Date();
      const overdueTasks = tasksArray.filter((task) => {
        const status = (task.status || task.stage || '').toString().toLowerCase();
        if (status.includes('completed')) return false;
        if (!task.taskDate) return false;
        const d = new Date(task.taskDate);
        if (Number.isNaN(d.getTime())) return false;
        return d < now;
      }).length;

      const activeTasks = Math.max(tasksArray.length - completedTasks, 0);

      setMetrics({
        projectCount: metricsBlock.projectCount ?? root.projectCount ?? 0,
        taskCount: metricsBlock.taskCount ?? root.taskCount ?? tasksArray.length,
        clientCount: metricsBlock.clientCount ?? root.clientCount ?? (Array.isArray(root.clients) ? root.clients.length : 0),
        activeTasks,
        completedTasks,
        overdueTasks,
      });

      setTasks(tasksArray);
    } catch (err) {
      const message = err?.message || err?.data?.message || 'Unable to load dashboard data';
      setError(message);
      toast.error(message);
      setMetrics({ projectCount: 0, taskCount: 0, clientCount: 0, activeTasks: 0, completedTasks: 0, overdueTasks: 0 });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Task status distribution for pie chart
  const taskStatusData = useMemo(() => {
    const statusCounts = {
      'Pending': 0,
      'In Progress': 0,
      'Completed': 0,
      'On Hold': 0,
      'Request Approved': 0
    };

    tasks.forEach(task => {
      const status = task.status || task.stage || 'Pending';
      const normalizedStatus = status.toUpperCase();
      
      if (normalizedStatus.includes('PENDING') || status === 'Pending') {
        statusCounts['Pending']++;
      } else if (normalizedStatus.includes('IN_PROGRESS') || normalizedStatus.includes('IN PROGRESS')) {
        statusCounts['In Progress']++;
      } else if (normalizedStatus.includes('COMPLETED')) {
        statusCounts['Completed']++;
      } else if (normalizedStatus.includes('ON_HOLD') || normalizedStatus.includes('ON HOLD')) {
        statusCounts['On Hold']++;
      } else if (normalizedStatus.includes('REQUEST') || normalizedStatus.includes('APPROVED')) {
        statusCounts['Request Approved']++;
      } else {
        statusCounts['Pending']++;
      }
    });

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  // Tasks per project for bar chart
  const tasksPerProjectData = useMemo(() => {
    const projectCounts = {};
    
    tasks.forEach(task => {
      const projectName = task.project?.name || task.project?.title || 'Unassigned';
      projectCounts[projectName] = (projectCounts[projectName] || 0) + 1;
    });

    return Object.entries(projectCounts)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Limit to top 8 projects
  }, [tasks]);

  // Priority distribution
  const priorityData = useMemo(() => {
    const priorityCounts = {
      'Critical': 0,
      'High': 0,
      'Medium': 0,
      'Low': 0
    };

    tasks.forEach(task => {
      const priority = task.priority?.toUpperCase() || 'MEDIUM';
      
      if (priority.includes('CRITICAL')) {
        priorityCounts['Critical']++;
      } else if (priority.includes('HIGH')) {
        priorityCounts['High']++;
      } else if (priority.includes('MEDIUM')) {
        priorityCounts['Medium']++;
      } else if (priority.includes('LOW')) {
        priorityCounts['Low']++;
      } else {
        priorityCounts['Medium']++;
      }
    });

    return Object.entries(priorityCounts).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  // Status colors
  const statusColors = {
    'Pending': '#F59E0B',
    'In Progress': '#3B82F6',
    'Completed': '#10B981',
    'On Hold': '#EF4444',
    'Request Approved': '#8B5CF6'
  };

  const priorityColors = {
    'Critical': '#EF4444',
    'High': '#F97316',
    'Medium': '#3B82F6',
    'Low': '#6B7280'
  };

  // Helper functions
  const getStatusVariant = (status) => {
    const statusUpper = (status || '').toUpperCase();
    
    if (statusUpper.includes('COMPLETED')) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (statusUpper.includes('IN_PROGRESS') || statusUpper.includes('IN PROGRESS')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (statusUpper.includes('PENDING')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else if (statusUpper.includes('ON_HOLD') || statusUpper.includes('ON HOLD')) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (statusUpper.includes('REQUEST') || statusUpper.includes('APPROVED')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityVariant = (priority) => {
    const priorityUpper = (priority || '').toUpperCase();
    
    if (priorityUpper.includes('CRITICAL')) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (priorityUpper.includes('HIGH')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    } else if (priorityUpper.includes('MEDIUM')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (priorityUpper.includes('LOW')) {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <PageHeader
            title="Dashboard Overview"
            subtitle="Welcome back! Here's what's happening with your projects today."
            onRefresh={fetchDashboard}
            refreshing={loading}
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-medium text-red-900">Error Loading Dashboard</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GridCard
            title="Total Projects"
            subtitle="Active projects under management"
            value={loading ? '...' : metrics.projectCount}
            tone="primary"
            icon={<Briefcase className="w-6 h-6 text-blue-600" />}
          />
          <GridCard
            title="Active Tasks"
            subtitle="Tasks in progress"
            value={loading ? '...' : (metrics.activeTasks || metrics.taskCount)}
            tone="success"
            icon={<CheckSquare className="w-6 h-6 text-green-600" />}
          />
          <GridCard
            title="Total Clients"
            subtitle="Clients managed by team"
            value={loading ? '...' : metrics.clientCount}
            tone="primary"
            icon={<Users className="w-6 h-6 text-purple-600" />}
          />
          <GridCard
            title="Overdue Tasks"
            subtitle="Tasks past due date"
            value={loading ? '...' : (metrics.overdueTasks || 0)}
            tone="danger"
            icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Task Status Distribution - Pie Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Task Status Distribution</h3>
                <p className="text-sm text-gray-600">Breakdown of tasks by status</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} tasks`, 'Count']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tasks Per Project - Bar Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tasks Per Project</h3>
                <p className="text-sm text-gray-600">Task count across projects</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksPerProjectData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Tasks', angle: -90, position: 'insideLeft', offset: -10 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} tasks`, 'Count']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Bar 
                    dataKey="total" 
                    name="Tasks" 
                    fill="#3B82F6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Priority Distribution - Smaller Chart */}
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Priority Distribution</h3>
                <p className="text-sm text-gray-600">Task breakdown by priority level</p>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} tasks`, 'Count']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Bar 
                    dataKey="value" 
                    name="Tasks" 
                    radius={[4, 4, 0, 0]}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={priorityColors[entry.name]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Tasks Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Tasks Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Task Overview</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {tasks.length} tasks total • {metrics.activeTasks || 0} active • {metrics.overdueTasks || 0} overdue
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <List className="w-4 h-4 inline mr-2" />
                    List
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <Grid className="w-4 h-4 inline mr-2" />
                    Grid
                  </button>
                </div>
                
                {/* Sort and Filter */}
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Sort by: Due Date</option>
                  <option>Sort by: Priority</option>
                  <option>Sort by: Status</option>
                  <option>Sort by: Project</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tasks Table (Default List View) */}
          {viewMode === 'list' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Task Title
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Assigned
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index}>
                        <td className="py-4 px-6">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                        </td>
                      </tr>
                    ))
                  ) : tasks.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <CheckSquare className="w-12 h-12 text-gray-400 mb-4" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h4>
                          <p className="text-gray-600">Tasks will appear here once created or assigned.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{task.title}</span>
                            {task.description && (
                              <span className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                                {task.description}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-700">
                              {task.project?.name || task.project?.title || 'No Project'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-gray-700">
                            {task.client?.name || 'No Client'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusVariant(task.status)}`}>
                            {task.status || task.stage || 'Pending'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPriorityVariant(task.priority)}`}>
                            {task.priority || 'Medium'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(task.taskDate)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">
                              {task.assignedUsers?.[0]?.name || 'Unassigned'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  // Loading skeleton for grid
                  Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-3 w-1/2"></div>
                      <div className="h-6 bg-gray-200 rounded mb-4 w-20"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2 w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))
                ) : tasks.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <Grid className="w-12 h-12 text-gray-400 mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h4>
                      <p className="text-gray-600">Tasks will appear here once created or assigned.</p>
                    </div>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                          )}
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusVariant(task.status)}`}>
                          {task.status || task.stage || 'Pending'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityVariant(task.priority)}`}>
                          {task.priority || 'Medium'}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Project:</span>
                          <span className="font-medium">{task.project?.name || 'No Project'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Client:</span>
                          <span className="font-medium">{task.client?.name || 'No Client'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Due Date:</span>
                          <span className="font-medium">{formatDate(task.taskDate)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Assigned:</span>
                          <span className="font-medium">{task.assignedUsers?.[0]?.name || 'Unassigned'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Pagination */}
          {tasks.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{Math.min(tasks.length, 10)}</span> of{' '}
                  <span className="font-medium">{tasks.length}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Previous
                  </button>
                  <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    1
                  </button>
                  <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                    2
                  </button>
                  <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                    3
                  </button>
                  <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats Footer */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-blue-700 font-medium">Completed Tasks</div>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : metrics.completedTasks || Math.floor(tasks.length * 0.6)}
                </div>
              </div>
            </div>
            <div className="text-xs text-blue-600">+12% from last month</div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-green-700 font-medium">Avg. Completion Time</div>
                <div className="text-2xl font-bold text-gray-900">3.2 days</div>
              </div>
            </div>
            <div className="text-xs text-green-600">-0.5 days from last month</div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-purple-700 font-medium">Team Productivity</div>
                <div className="text-2xl font-bold text-gray-900">87%</div>
              </div>
            </div>
            <div className="text-xs text-purple-600">+5% from last month</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;