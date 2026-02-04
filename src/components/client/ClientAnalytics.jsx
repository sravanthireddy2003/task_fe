import React, { useMemo } from "react";
import * as Icons from "../../icons";
import clsx from "clsx";
import { Chart } from "../Chart";

const ClientAnalytics = ({ client, projects = [], dashboard = {} }) => {
  // Extract all tasks from nested client.projects[].tasks[] structure
  const allTasks = useMemo(() => {
    const tasks = [];
    if (Array.isArray(projects)) {
      projects.forEach((project) => {
        if (Array.isArray(project.tasks)) {
          project.tasks.forEach((task) => {
            tasks.push({ ...task, projectName: project.name, projectId: project.id });
          });
        }
      });
    }
    return tasks;
  }, [projects]);

  // Calculate metrics from nested data
  const metrics = useMemo(() => {
    const total = allTasks.length;
    const completed = allTasks.filter(t => 
      t.status?.toLowerCase() === 'completed' || t.stage?.toUpperCase() === 'COMPLETED'
    ).length;
    const pending = allTasks.filter(t => 
      t.status?.toLowerCase() === 'pending' || t.stage?.toUpperCase() === 'PENDING'
    ).length;
    const inProgress = allTasks.filter(t => 
      t.stage?.toUpperCase() === 'IN PROGRESS' || t.stage?.toUpperCase() === 'IN_PROGRESS'
    ).length;

    // Priority distribution
    const highPriority = allTasks.filter(t => t.priority?.toUpperCase() === 'HIGH').length;
    const mediumPriority = allTasks.filter(t => t.priority?.toUpperCase() === 'MEDIUM').length;
    const lowPriority = allTasks.filter(t => t.priority?.toUpperCase() === 'LOW').length;

    // Hours
    const totalHours = allTasks.reduce((sum, task) => sum + (task.time_alloted || task.estimated_hours || 0), 0);

    return {
      total,
      completed,
      pending,
      inProgress,
      highPriority,
      mediumPriority,
      lowPriority,
      totalHours
    };
  }, [allTasks]);

  // Project breakdown
  const projectBreakdown = useMemo(() => {
    return projects.map(project => {
      const tasks = Array.isArray(project.tasks) ? project.tasks : [];
      const completed = tasks.filter(t => 
        t.status?.toLowerCase() === 'completed' || t.stage?.toUpperCase() === 'COMPLETED'
      ).length;
      const pending = tasks.filter(t => 
        t.status?.toLowerCase() === 'pending' || t.stage?.toUpperCase() === 'PENDING'
      ).length;
      const inProgress = tasks.filter(t => 
        t.stage?.toUpperCase() === 'IN PROGRESS' || t.stage?.toUpperCase() === 'IN_PROGRESS'
      ).length;
      return {
        name: project.name,
        id: project.id,
        totalTasks: tasks.length,
        completed,
        pending,
        inProgress,
        progressPercentage: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
      };
    });
  }, [projects]);

  const hasTasks = metrics.total > 0;
  const hasProjects = projects.length > 0;

  const resolveTaskStatus = (task) => {
    const status = task.status?.toLowerCase();
    const stage = task.stage?.toUpperCase();

    if (status === "completed" || stage === "COMPLETED") return "COMPLETED";
    if (status === "pending" || stage === "PENDING" || stage === "TODO") return "PENDING";
    if (stage === "IN PROGRESS" || stage === "IN_PROGRESS") return "IN_PROGRESS";

    return "UNKNOWN";
  };

  // Prepare chart data for task status pie chart
  const statusChartData = useMemo(() => {
    const todo = allTasks.filter(t => resolveTaskStatus(t) === "PENDING").length;
    const inProgress = allTasks.filter(t => resolveTaskStatus(t) === "IN_PROGRESS").length;
    const completed = allTasks.filter(t => resolveTaskStatus(t) === "COMPLETED").length;
    
    return [
      { name: 'To Do', value: todo, color: '#F59E0B' },
      { name: 'In Progress', value: inProgress, color: '#38BDF8' },
      { name: 'Completed', value: completed, color: '#34D399' },
    ];
  }, [allTasks]);

  // Prepare chart data for priority bar chart
  const priorityChartData = useMemo(() => {
    return [
      { name: 'High', value: metrics.highPriority, color: '#FB7185' },
      { name: 'Medium', value: metrics.mediumPriority, color: '#A78BFA' },
      { name: 'Low', value: metrics.lowPriority, color: '#22C55E' },
    ];
  }, [metrics]);

  // Prepare chart data for project progress
  const projectChartData = useMemo(() => {
    return projectBreakdown.map(p => ({
      name: p.name.substring(0, 12),
      value: p.progressPercentage,
      color: '#8B5CF6'
    }));
  }, [projectBreakdown]);

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-600">Total Tasks</p>
            <div className="p-2 rounded-lg bg-sky-50">
              <Icons.ListChecks className="w-5 h-5 text-sky-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{metrics.total}</p>
          <p className="text-xs text-slate-500 mt-2">Across {projects.length} projects</p>
        </div>

        <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-600">Completed</p>
            <div className="p-2 rounded-lg bg-emerald-50">
              <Icons.CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{metrics.completed}</p>
          <div className="mt-3 bg-emerald-100 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full" 
              style={{ width: `${metrics.total > 0 ? (metrics.completed / metrics.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-600">In Progress</p>
            <div className="p-2 rounded-lg bg-violet-50">
              <Icons.Clock className="w-5 h-5 text-violet-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{metrics.inProgress}</p>
          <p className="text-xs text-slate-500 mt-2">{metrics.pending} pending</p>
        </div>

        <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-600">Total Hours</p>
            <div className="p-2 rounded-lg bg-amber-50">
              <Icons.Clock3 className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{metrics.totalHours}h</p>
          <p className="text-xs text-slate-500 mt-2">Allocated time</p>
        </div>
      </div>

      {/* Charts Section */}
      {hasTasks ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Status Pie Chart */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Icons.PieChart className="w-5 h-5 text-sky-600" />
              Task Status Distribution
            </h3>
            <div className="h-80 flex items-center justify-center">
              <Chart
                type="pie"
                data={statusChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { 
                        font: { size: 13 },
                        padding: 15,
                        usePointStyle: true
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Priority Bar Chart */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Icons.BarChart3 className="w-5 h-5 text-rose-500" />
              Priority Distribution
            </h3>
            <div className="h-80 flex items-center justify-center">
              <Chart
                type="bar"
                data={priorityChartData}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      ticks: { font: { size: 12 } }
                    },
                    y: {
                      ticks: { font: { size: 12 } }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Project Progress Chart */}
      {hasProjects && projectChartData.length > 0 && (
        <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Icons.TrendingUp className="w-5 h-5 text-violet-600" />
            Project Progress Overview
          </h3>
          <div className="h-96 flex items-center justify-center">
            <Chart
              type="bar"
              data={projectChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'x',
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                      callback: function(value) {
                        return value + '%';
                      },
                      font: { size: 11 }
                    }
                  },
                  x: {
                    ticks: { font: { size: 12 } }
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Completed', value: metrics.completed, icon: Icons.CheckCircle, bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' },
          { label: 'In Progress', value: metrics.inProgress, icon: Icons.Clock, bgColor: 'bg-sky-50', textColor: 'text-sky-700', borderColor: 'border-sky-200' },
          { label: 'Pending', value: metrics.pending, icon: Icons.AlertCircle, bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className={clsx('p-4 rounded-xl border shadow-sm', item.bgColor, item.borderColor)}>
              <div className="flex items-center justify-between mb-3">
                <span className={clsx('text-sm font-medium', item.textColor)}>{item.label}</span>
                <div className={clsx('p-2 rounded-lg bg-white/70')}>
                  <Icon className={clsx('w-4 h-4', item.textColor)} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* Manager Info & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manager Info */}
        {dashboard.assignedManager && (
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Icons.User className="w-5 h-5 text-violet-600" />
              Assigned Manager
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center flex-shrink-0 border border-violet-100">
                <Icons.User2 className="w-8 h-8 text-violet-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-lg">{dashboard.assignedManager.name}</p>
                <p className="text-sm text-slate-500">Project Manager</p>
              </div>
            </div>
          </div>
        )}

        {/* Projects Count */}
        <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Icons.FolderOpen className="w-5 h-5 text-emerald-600" />
            Projects Summary
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-sm font-medium text-slate-600">Total Projects</span>
              <span className="text-2xl font-bold text-slate-900">{projects.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-sm font-medium text-slate-600">Total Tasks</span>
              <span className="text-2xl font-bold text-slate-900">{metrics.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!hasTasks && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <Icons.BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data Available</h3>
          <p className="text-gray-600">Tasks and projects assigned to this client will appear here with detailed visualizations</p>
        </div>
      )}
    </div>
  );
};

export default ClientAnalytics;
