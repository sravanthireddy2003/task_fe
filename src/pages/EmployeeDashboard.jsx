import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import fetchWithTenant from '../utils/fetchWithTenant';
import { selectUser } from '../redux/slices/authSlice';
import { MODULE_MAP } from '../App/moduleMap.jsx';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import GridCard from "../components/ui/GridCard";

// Bar Chart Component
const BarChart = ({ title, data, colors = [], showValues = true, horizontal = false }) => {
  const maxValue = Math.max(...data.map(item => item.value), 1);
  
  if (horizontal) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No data available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item, index) => {
              const percentage = (item.value / maxValue) * 100;
              const color = colors[index] || 'bg-blue-500';
              
              return (
                <div key={item.label} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {item.label}
                    </span>
                    {showValues && (
                      <span className="text-sm font-semibold text-gray-900">
                        {item.value}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div 
                      className={`h-8 rounded-lg transition-all duration-300 ${color} hover:opacity-90`}
                      style={{ width: `${percentage}%` }}
                    >
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs font-semibold text-white">
                        {item.value}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Vertical bar chart
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {data.length > 0 && (
          <span className="text-xs font-medium text-gray-500">
            Total: {data.reduce((sum, item) => sum + item.value, 0)}
          </span>
        )}
      </div>
      
      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No data available</p>
        </div>
      ) : (
        <div className="flex items-end h-48 space-x-2">
          {data.map((item, index) => {
            const percentage = (item.value / maxValue) * 100;
            const color = colors[index] || 'bg-blue-500';
            const height = `${percentage}%`;
            
            return (
              <div key={item.label} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full flex justify-center">
                  <div 
                    className={`w-3/4 rounded-t-lg transition-all duration-300 hover:opacity-90 ${color}`}
                    style={{ height }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.label}: {item.value}
                    </div>
                  </div>
                </div>
                <span className="mt-2 text-xs font-medium text-gray-600 text-center">
                  {item.label}
                </span>
                {showValues && (
                  <span className="text-xs text-gray-500 mt-1">
                    {item.value}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Donut Chart Component
const DonutChart = ({ title, data, size = 140 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let startAngle = 0;
  const radius = size / 2 - 10;
  const center = size / 2;

  const colors = [
    '#3b82f6', // blue-500
    '#10b981', // green-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="flex items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size}>
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              const angle = (percentage / 100) * 360;
              const endAngle = startAngle + angle;
              
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              
              const x1 = center + radius * Math.cos(startRad);
              const y1 = center + radius * Math.sin(startRad);
              const x2 = center + radius * Math.cos(endRad);
              const y2 = center + radius * Math.sin(endRad);
              
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              const pathData = [
                `M ${center} ${center}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');
              
              const segment = (
                <path
                  key={item.label}
                  d={pathData}
                  fill={colors[index % colors.length]}
                  className="transition-all duration-300 hover:opacity-80"
                />
              );
              
              startAngle = endAngle;
              return segment;
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
        <div className="ml-6 flex-1">
          <div className="space-y-2">
            {data.map((item, index) => {
              const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-sm mr-2" 
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {item.value} ({percentage}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Stacked Bar Chart
const StackedBarChart = ({ title, data, colors = [] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const color = colors[index] || 'bg-blue-500';

          return (
            <div key={item.label} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    {item.label}
                    {item.badge && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded flex items-center gap-1">
                        {item.badge.icon && <Icon name={item.badge.icon} className="w-3 h-3" />}
                        <span>{item.badge.text}</span>
                      </span>
                    )}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {item.value} ({Math.round(percentage)}%)
                </span>
              </div>
              <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${color} rounded-full transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                >
                  <div className="px-3 text-xs font-semibold text-white flex items-center h-full">
                    {item.value}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Mini Stats Card using shared GridCard
const StatsCard = ({ title, subtitle, value, icon, color, trend }) => {
  const toneByColor = {
    blue: 'primary',
    green: 'success',
    amber: 'warning',
    red: 'danger',
    purple: 'primary',
    gray: 'default',
  };

  const tone = toneByColor[color] || 'default';
  const trendNode =
    trend && (
      <span className={`font-medium ${trend.value > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {trend.value > 0 ? '↗' : '↘'} {Math.abs(trend.value)}% {trend.label}
      </span>
    );

  const resolvedIcon =
    typeof icon === 'string' ? <Icon name={icon} className="w-6 h-6" /> : icon;

  return (
    <GridCard
      title={title}
      subtitle={subtitle}
      value={value}
      icon={resolvedIcon}
      tone={tone}
      footer={trendNode}
      className="p-4"
    />
  );
};

// Progress Chart with Multiple Bars
const ProgressChart = ({ title, data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
          const colors = [
            'bg-gradient-to-r from-blue-500 to-blue-600',
            'bg-gradient-to-r from-green-500 to-green-600',
            'bg-gradient-to-r from-amber-500 to-amber-600',
            'bg-gradient-to-r from-red-500 to-red-600',
            'bg-gradient-to-r from-purple-500 to-purple-600'
          ];
          
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {item.value} ({percentage}%)
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-700`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const EmployeeDashboard = () => {
  const user = useSelector(selectUser);
  const modules = user?.modules || [];

  const [tasks, setTasks] = useState([]);
  const [kanban, setKanban] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksOverviewResponse, myTasksResponse] = await Promise.all([
        fetchWithTenant('/api/employee/tasks-overview'),
        fetchWithTenant('/api/employee/my-tasks'),
      ]);

      const overviewPayload = tasksOverviewResponse?.data || tasksOverviewResponse || {};
      const boardPayload = myTasksResponse || {};
      
      const boardTasks = Array.isArray(boardPayload.data)
        ? boardPayload.data
        : Array.isArray(boardPayload)
        ? boardPayload
        : [];
      
      const boardKanban = boardPayload.kanban || [];

      setTasks(Array.isArray(boardTasks) ? boardTasks : []);
      setKanban(Array.isArray(boardKanban) ? boardKanban : []);
    } catch (err) {
      const message = err?.message || err?.data?.message || 'Unable to load dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Calculate all metrics and chart data
  const metrics = useMemo(() => {
    // Task Status Distribution
    const statusData = kanban.length > 0 
      ? kanban.map(col => ({
          label: col.status || 'Unknown',
          value: col.count || 0
        }))
      : [];

    // Priority Distribution
    const priorityCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    tasks.forEach(task => {
      if (task.priority) {
        const priority = task.priority.toUpperCase();
        if (priorityCounts.hasOwnProperty(priority)) {
          priorityCounts[priority] += 1;
        }
      }
    });
    const priorityData = Object.entries(priorityCounts)
      .filter(([_, value]) => value > 0)
      .map(([label, value]) => ({ label, value }));

    // Completion Status
    const completedTasks = tasks.filter(t => 
      t.status?.toLowerCase().includes('complete') || t.status === 'DONE'
    ).length;
    const inProgressTasks = tasks.filter(t => 
      t.status?.toLowerCase().includes('progress')
    ).length;
    const pendingTasks = tasks.filter(t => 
      !t.status?.toLowerCase().includes('complete') && 
      !t.status?.toLowerCase().includes('progress') &&
      t.status !== 'DONE'
    ).length;

    // Overdue Analysis
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < new Date() && 
             !task.status?.toLowerCase().includes('complete') &&
             task.status !== 'DONE';
    }).length;

    const onTimeTasks = tasks.filter(task => {
      const isIncomplete = !task.status?.toLowerCase().includes('complete') && 
                          task.status !== 'DONE';
      if (!isIncomplete) return false;
      
      if (!task.dueDate) return true;
      return new Date(task.dueDate) >= new Date();
    }).length;

    // Reassignment Analysis
    const reassignmentData = [
      { label: 'Pending', value: tasks.filter(t => t.lock_info?.request_status === 'PENDING').length },
      { label: 'Approved', value: tasks.filter(t => t.lock_info?.request_status === 'APPROVED').length },
      { label: 'Rejected', value: tasks.filter(t => t.lock_info?.request_status === 'REJECTED').length }
    ];

    // Locked vs Active
    const lockedTasks = tasks.filter(t => t.is_locked).length;
    const activeTasks = tasks.length - lockedTasks;

    // Task Age Analysis
    const today = new Date();
    const incompleteTasks = tasks.filter(t => 
      !t.status?.toLowerCase().includes('complete') && t.status !== 'DONE'
    );
    
    const ageBuckets = {
      'Today': 0,
      '1-3 days': 0,
      '3-7 days': 0,
      '> 1 week': 0
    };

    incompleteTasks.forEach(task => {
      const rawDate = task.createdAt || task.updatedAt || task.dueDate;
      if (!rawDate) {
        ageBuckets['Today'] += 1;
        return;
      }

      const created = new Date(rawDate);
      const diffMs = today - created;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays < 1) {
        ageBuckets['Today'] += 1;
      } else if (diffDays < 3) {
        ageBuckets['1-3 days'] += 1;
      } else if (diffDays < 7) {
        ageBuckets['3-7 days'] += 1;
      } else {
        ageBuckets['> 1 week'] += 1;
      }
    });

    const ageData = Object.entries(ageBuckets)
      .map(([label, value]) => ({ label, value }));

    return {
      status: statusData,
      priority: priorityData,
      completion: {
        completed: completedTasks,
        inProgress: inProgressTasks,
        pending: pendingTasks,
        total: tasks.length
      },
      overdue: {
        overdue: overdueTasks,
        onTime: onTimeTasks,
        noDueDate: tasks.length - overdueTasks - onTimeTasks
      },
      reassignment: reassignmentData,
      lockedVsActive: [
        { label: 'Active', value: activeTasks },
        { label: 'Locked', value: lockedTasks }
      ],
      age: ageData,
      totalTasks: tasks.length,
      highPriority: priorityCounts.HIGH,
      pendingReassign: tasks.filter(t => t.lock_info?.request_status === 'PENDING').length,
      onHold: tasks.filter(t => t.status?.toLowerCase().includes('hold')).length
    };
  }, [tasks, kanban]);

  // Stats cards
  const statsCards = useMemo(() => [
    {
      key: 'total',
      title: 'Total Tasks',
      value: metrics.totalTasks,
      color: 'blue',
      icon: 'CheckSquare'
    },
    {
      key: 'completed',
      title: 'Completed',
      value: metrics.completion.completed,
      color: 'green',
      icon: 'CheckCircle'
    },
    {
      key: 'in_progress',
      title: 'In Progress',
      value: metrics.completion.inProgress,
      color: 'amber',
      icon: 'Clock'
    },
    {
      key: 'high_priority',
      title: 'High Priority',
      value: metrics.highPriority,
      color: 'red',
      icon: 'AlertTriangle'
    },
    {
      key: 'overdue',
      title: 'Overdue',
      value: metrics.overdue.overdue,
      color: 'red',
      icon: 'AlertCircle'
    },
    {
      key: 'blocked',
      title: 'Blocked',
      subtitle: `Locked: ${metrics.lockedVsActive?.[1]?.value || 0} • Pending: ${metrics.pendingReassign || 0}`,
      value: (metrics.lockedVsActive?.[1]?.value || 0) + (metrics.pendingReassign || 0),
      color: 'purple',
      icon: 'Lock'
    },
    {
      key: 'on_hold',
      title: 'On Hold',
      value: metrics.onHold,
      color: 'gray',
      icon: 'Pause'
    }
  ], [metrics]);


  // Tasks needing attention
  const attentionTasks = useMemo(() => {
    return tasks.filter(task => {
      const isOverdue = task.dueDate && 
                       new Date(task.dueDate) < new Date() && 
                       !task.status?.toLowerCase().includes('complete') &&
                       task.status !== 'DONE';
      const isPendingReassign = task.lock_info?.request_status === 'PENDING';
      const isHighPriority = task.priority === 'HIGH' && 
                           !task.status?.toLowerCase().includes('complete') &&
                           task.status !== 'DONE';
      
      return isOverdue || isPendingReassign || isHighPriority;
    }).slice(0, 5);
  }, [tasks]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading your task dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Analytics Dashboard"
        subtitle="Comprehensive visual analysis of your tasks, progress, and performance"
        onRefresh={loadDashboard}
        refreshing={loading}
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {statsCards.map((card) => (
          <StatsCard
            key={card.key}
            title={card.title}
            subtitle={card.subtitle}
            value={card.value}
            icon={card.icon}
            color={card.color}
          />
        ))}
      </div>

      {/* Main Charts Grid - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution - Vertical Bar Chart */}
        <BarChart
          title="Task Status Distribution"
          data={metrics.status}
          colors={['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-red-500', 'bg-purple-500', 'bg-gray-500']}
          showValues={false}
          horizontal={false}
        />

        {/* Task Priority - Horizontal Bar Chart */}
        <BarChart
          title="Task Priority Levels"
          data={metrics.priority}
          colors={['bg-red-500', 'bg-yellow-500', 'bg-green-500']}
          horizontal={true}
        />

        {/* Overdue Analysis - Stacked Bar Chart */}
        <StackedBarChart
          title="Task Deadline Analysis"
          data={[
            { label: 'Overdue', value: metrics.overdue.overdue, badge: { icon: 'AlertCircle', text: 'Urgent' } },
            { label: 'On Time', value: metrics.overdue.onTime, badge: { icon: 'CheckCircle', text: 'Good' } },
            { label: 'No Due Date', value: metrics.overdue.noDueDate, badge: { icon: 'Calendar', text: 'Set Date' } }
          ]}
          colors={['bg-red-500', 'bg-green-500', 'bg-gray-400']}
        />

        {/* Reassignment Status - Donut Chart */}
        <DonutChart
          title="Reassignment Requests"
          data={metrics.reassignment}
        />
      </div>

      {/* Charts Grid - Row 2 (simplified) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Locked vs Active - Progress Chart */}
        <ProgressChart
          title="Locked vs Active Tasks"
          data={metrics.lockedVsActive}
        />

        {/* Task Age Analysis - Horizontal Bar Chart */}
        <BarChart
          title="Task Age Analysis (Incomplete Tasks)"
          data={metrics.age}
          colors={['bg-blue-400', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700']}
          horizontal={true}
        />

        {/* Completion Status - Donut Chart */}
        <DonutChart
          title="Completion Status"
          data={[
            { label: 'Completed', value: metrics.completion.completed },
            { label: 'In Progress', value: metrics.completion.inProgress },
            { label: 'Pending', value: metrics.completion.pending }
          ]}
        />
      </div>

      {/* Attention Needed Section */}
      {attentionTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-200">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Icon name="AlertTriangle" className="w-5 h-5 text-amber-500" />
              Attention Needed
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Tasks requiring immediate attention
            </p>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {attentionTasks.map(task => {
                const isOverdue = task.dueDate && 
                                 new Date(task.dueDate) < new Date() && 
                                 !task.status?.toLowerCase().includes('complete') &&
                                 task.status !== 'DONE';
                const isPendingReassign = task.lock_info?.request_status === 'PENDING';
                const isHighPriority = task.priority === 'HIGH' && 
                                     !task.status?.toLowerCase().includes('complete') &&
                                     task.status !== 'DONE';
                
                return (
                  <div key={task.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-12 rounded-lg ${
                        isOverdue ? 'bg-red-500' :
                        isPendingReassign ? 'bg-amber-500' :
                        isHighPriority ? 'bg-red-400' :
                        'bg-gray-300'
                      }`} />
                      <div>
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {isOverdue && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded inline-flex items-center gap-1">
                              <Icon name="AlertCircle" className="w-3 h-3" />
                              <span>Overdue</span>
                            </span>
                          )}
                          {isPendingReassign && (
                            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded inline-flex items-center gap-1">
                              <Icon name="RefreshCw" className="w-3 h-3" />
                              <span>Pending Reassign</span>
                            </span>
                          )}
                          {isHighPriority && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded inline-flex items-center gap-1">
                              <Icon name="Zap" className="w-3 h-3" />
                              <span>High Priority</span>
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-xs text-gray-500">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link 
                      to={`/employee/tasks/${task.id || task.public_id || task._id}`}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Task Summary and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Task Activity</h3>
            <Link to="/employee/tasks" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All Tasks →
            </Link>
          </div>
          <div className="space-y-3">
            {tasks.slice(0, 6).map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    task.status?.includes('COMPLETE') ? 'bg-green-500' :
                    task.status?.includes('PROGRESS') ? 'bg-blue-500' :
                    'bg-gray-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-500">
                      {task.status?.replace(/_/g, ' ') || 'Unknown'} • 
                      Updated {new Date(task.updatedAt || task.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                    task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority || 'Normal'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Efficiency Score and Quick Actions */}
        <div className="space-y-6">
          {/* Efficiency Score */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
            <h3 className="font-semibold mb-2">Efficiency Score</h3>
            <div className="text-4xl font-bold mb-2">
              {metrics.totalTasks > 0 ? Math.round((metrics.completion.completed / metrics.totalTasks) * 100) : 0}%
            </div>
            <p className="text-sm text-blue-100">
              Based on completion rate and timeliness
            </p>
            <div className="mt-4 h-2 bg-blue-400 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((metrics.completion.completed / metrics.totalTasks) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <div className="flex items-center">
                  <Icon name="BarChart3" className="w-5 h-5 mr-3 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Generate Report</p>
                    <p className="text-xs text-gray-500">Export all task analytics</p>
                  </div>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors">
                <div className="flex items-center">
                  <Icon name="Calendar" className="w-5 h-5 mr-3 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Set Deadlines</p>
                    <p className="text-xs text-gray-500">Update due dates</p>
                  </div>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors">
                <div className="flex items-center">
                  <Icon name="RefreshCw" className="w-5 h-5 mr-3 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Request Reassign</p>
                    <p className="text-xs text-gray-500">Transfer tasks to others</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;