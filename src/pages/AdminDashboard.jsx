import React, { useState, useEffect } from 'react';
import * as Icons from '../icons';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line
} from 'recharts';
import clsx from 'clsx';

const STATIC_DATA = {
  dashboardMetrics: {
    totalClients: 3,
    totalTasks: 8,
    pendingTasks: 4,
    overdueTasks: 1,
    completedToday: 0,
    activeProjects: 2
  },
  taskDistribution: [
    { name: 'Completed', value: 38, color: '#059669' },
    { name: 'In Progress', value: 25, color: '#1D4ED8' },
    { name: 'Not Started', value: 25, color: '#B45309' },
    { name: 'Overdue', value: 13, color: '#DC2626' }
  ],
  weeklyTrends: [
    { day: 'Mon', tasks: 12 },
    { day: 'Tue', tasks: 14 },
    { day: 'Wed', tasks: 18 },
    { day: 'Thu', tasks: 16 },
    { day: 'Fri', tasks: 20 },
    { day: 'Sat', tasks: 10 }
  ],
  topEmployees: [
    { name: 'Emma', completed: 1.8, inProgress: 0.8 },
    { name: 'Mike', completed: 1.5, inProgress: 1.2 },
    { name: 'Sarah', completed: 1.2, inProgress: 0.9 },
    { name: 'David', completed: 0.9, inProgress: 1.5 }
  ],
  clientWorkload: [
    { client: 'TechStart Inc.', workload: 0.75 },
    { client: 'Global Solutions Ltd.', workload: 0.6 },
    { client: 'Innovate Corp', workload: 0.45 },
    { client: 'Digital Ventures', workload: 0.3 }
  ],
  recentActivities: [
    { 
      id: 1, 
      title: 'Implement user authentication module', 
      status: 'In Progress', 
      priority: 'Critical',
      dueDate: '25/01/2026'
    },
    { 
      id: 2, 
      title: 'Build shopping cart functionality', 
      status: 'In Progress', 
      priority: 'High',
      dueDate: '28/01/2026'
    },
    { 
      id: 3, 
      title: 'Test payment gateway integration', 
      status: 'Not Started', 
      priority: 'Critical',
      dueDate: '30/01/2026'
    }
  ],
  activeProjects: [
    {
      id: 1,
      name: 'E-Commerce Platform Development',
      progress: 65,
      budget: '$87,500 / $150,000',
      client: 'TechStart Inc.',
      members: 3
    },
    {
      id: 2,
      name: 'Mobile App Redesign',
      progress: 40,
      budget: '$32,000 / $80,000',
      client: 'Global Solutions Ltd.',
      members: 2
    }
  ]
};

import { httpGetService } from '../App/httpHandler';
import GridCard from "../components/ui/GridCard";
import ListItem from "../components/ui/ListItem";

const Dashboard = () => {
  React.useEffect(() => {
    console.log('admin icons:', {
      Search: Icons.Search,
      Bell: Icons.Bell,
      Settings: Icons.Settings,
      Users: Icons.Users,
      ClipboardList: Icons.ClipboardList,
      Clock: Icons.Clock,
      AlertCircle: Icons.AlertCircle,
      CheckCircle: Icons.CheckCircle,
      Briefcase: Icons.Briefcase,
      MoreVertical: Icons.MoreVertical,
      ChevronRight: Icons.ChevronRight,
    });
    // Diagnostics for undefined components/imports
    console.log('admin components:', { GridCard, ListItem });
    console.log('recharts types:', {
      PieChart: typeof PieChart,
      Pie: typeof Pie,
      BarChart: typeof BarChart,
      ResponsiveContainer: typeof ResponsiveContainer,
    });
  }, []);
  const [metrics, setMetrics] = useState(STATIC_DATA.dashboardMetrics);
  const [taskDistribution, setTaskDistribution] = useState(STATIC_DATA.taskDistribution);
  const [weeklyTrends, setWeeklyTrends] = useState(STATIC_DATA.weeklyTrends);
  const [topEmployees, setTopEmployees] = useState(STATIC_DATA.topEmployees);
  const [clientWorkload, setClientWorkload] = useState(STATIC_DATA.clientWorkload);
  const [recentActivities, setRecentActivities] = useState(STATIC_DATA.recentActivities);
  const [activeProjects, setActiveProjects] = useState(STATIC_DATA.activeProjects);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await httpGetService('/api/admin/dashboard');
        const payload = resp && resp.data ? resp.data : resp;

        // Map response fields with sensible fallbacks
        if (payload.dashboardMetrics) setMetrics(payload.dashboardMetrics);
        if (payload.taskDistribution) setTaskDistribution(payload.taskDistribution);
        if (payload.weeklyTrends) setWeeklyTrends(payload.weeklyTrends);
        if (payload.topEmployees) setTopEmployees(payload.topEmployees);
        if (payload.clientWorkload) setClientWorkload(payload.clientWorkload);
        if (payload.recentActivities) setRecentActivities(payload.recentActivities);
        if (payload.activeProjects) setActiveProjects(payload.activeProjects);
      } catch (err) {
        setError(err?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, John Admin! Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              {Icons.Search && <Icons.Search className="tm-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />}
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              {Icons.Bell && <Icons.Bell className="tm-icon text-gray-600" />}
            </button>
            <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              {Icons.Settings && <Icons.Settings className="tm-icon text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <GridCard
            title="Total Clients"
            value={metrics.totalClients}
            tone="primary"
            icon={Icons.Users ? <Icons.Users className="tm-icon text-blue-600" /> : null}
            footer={<span className="text-gray-500">All active client accounts</span>}
          />
          <GridCard
            title="Total Tasks"
            value={metrics.totalTasks}
            tone="primary"
            icon={Icons.ClipboardList ? <Icons.ClipboardList className="tm-icon text-purple-600" /> : null}
            footer={<span className="text-gray-500">Tasks across all projects</span>}
          />
          <GridCard
            title="Pending Tasks"
            value={metrics.pendingTasks}
            tone="warning"
            icon={Icons.Clock ? <Icons.Clock className="tm-icon text-amber-600" /> : null}
            footer={<span className="text-gray-500">Awaiting completion</span>}
          />
          <GridCard
            title="Overdue Tasks"
            value={metrics.overdueTasks}
            tone="danger"
            icon={Icons.AlertCircle ? <Icons.AlertCircle className="tm-icon text-red-600" /> : null}
            footer={<span className="text-gray-500">Past due date</span>}
          />
          <GridCard
            title="Completed Today"
            value={metrics.completedToday}
            tone="success"
            icon={Icons.CheckCircle ? <Icons.CheckCircle className="tm-icon text-emerald-600" /> : null}
            footer={<span className="text-gray-500">Finished in the last 24h</span>}
          />
          <GridCard
            title="Active Projects"
            value={metrics.activeProjects}
            tone="primary"
            icon={Icons.Briefcase ? <Icons.Briefcase className="tm-icon text-indigo-600" /> : null}
            footer={<span className="text-gray-500">Currently in progress</span>}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Task Distribution</h2>
              <button className="p-1 hover:bg-gray-100 rounded icon-center">
                {Icons.MoreVertical && <Icons.MoreVertical className="tm-icon text-gray-500" />}
              </button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                  >
                    {taskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {taskDistribution.map((item, idx) => (
                <div key={item.name + '-' + idx} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Task Trends */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Weekly Task Trends</h2>
              <button className="p-1 hover:bg-gray-100 rounded icon-center">
                {Icons.MoreVertical && <Icons.MoreVertical className="tm-icon text-gray-500" />}
              </button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} domain={[0, 'dataMax + 5']} />
                  <Tooltip wrapperStyle={{ borderRadius: 8 }} contentStyle={{ borderRadius: 8 }} />
                  <Bar dataKey="tasks" fill="#3B82F6" stroke="#1E40AF" barSize={28} radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Second Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Employees */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Top Performing Employees</h2>
              <button className="p-1 hover:bg-gray-100 rounded icon-center">
                {Icons.MoreVertical && <Icons.MoreVertical className="tm-icon text-gray-500" />}
              </button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topEmployees}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    domain={[0, 2]}
                    ticks={[0, 0.5, 1, 1.5, 2]}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="inProgress" fill="#3B82F6" name="In Progress" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Client-wise Workload */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Client-wise Workload</h2>
              <button className="p-1 hover:bg-gray-100 rounded icon-center">
                {Icons.MoreVertical && <Icons.MoreVertical className="tm-icon text-gray-500" />}
              </button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientWorkload}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="client" />
                  <YAxis 
                    domain={[0, 1]}
                    ticks={[0, 0.25, 0.5, 0.75, 1]}
                  />
                  <Tooltip />
                  <Bar dataKey="workload" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <button className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:text-blue-700">
                View all {Icons.ChevronRight && <Icons.ChevronRight className="tm-icon" />}
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {recentActivities.map((activity) => (
                <ListItem
                  key={activity.id}
                  title={activity.title}
                  subtitle={
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          activity.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800",
                        )}
                      >
                        {activity.status}
                      </span>
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          activity.priority === "Critical"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800",
                        )}
                      >
                        {activity.priority}
                      </span>
                    </div>
                  }
                  meta={
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Due</div>
                      <div className="text-sm font-medium">{activity.dueDate}</div>
                    </div>
                  }
                />
              ))}
            </div>
          </div>

          {/* Active Projects */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Active Projects</h2>
              <button className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:text-blue-700">
                View all {Icons.ChevronRight && <Icons.ChevronRight className="tm-icon" />}
              </button>
            </div>
            <div className="space-y-6">
              {activeProjects.map((project) => (
                <div key={project.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-medium text-gray-900">{project.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {Icons.Users && <Icons.Users className="tm-icon" />}
                      <span>{project.members} members</span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <div className="text-gray-600 mb-1">Budget</div>
                    <div className="font-medium">{project.budget}</div>
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-600">
                    {project.client}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;