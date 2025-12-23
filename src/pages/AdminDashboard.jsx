import React, { useEffect, useState, useMemo } from 'react';
import { 
  Users, Folder, CheckCircle, TrendingUp, Activity, 
  ShieldCheck, Clock, BarChart3, Settings, Inbox, 
  Calendar, Target, AlertCircle, CheckSquare, PlayCircle,
  PieChart as PieChartIcon, RefreshCw, Cpu, Database,
  Bell, Mail, FileText, Filter, Eye, Download, 
  ChevronRight, AlertTriangle, BarChart2, Users as UsersIcon,
  Clock as ClockIcon, Activity as ActivityIcon, Layers,
  Zap, Shield, History, Timer, TrendingDown, BellRing,
  LineChart as LineChartIcon, ArrowUpRight, ArrowDownRight,
  Search, ChevronDown, MoreVertical, ExternalLink, Star
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  Tooltip, ResponsiveContainer, LineChart, Line, 
  CartesianGrid, AreaChart, Area, ComposedChart, Scatter,
  Legend, RadialBarChart, RadialBar
} from 'recharts';
import clsx from 'clsx';  

const STATIC_DATA = {
  metrics: {
    avgTurnaround: 4.2,
    efficiency: 87,
    compliance: 94,
    totalUsers: 128,
    activeProjects: 24,
    tasksCompleted: 389
  },
  notifications: [
    { id: 1, title: 'Rule Engine Updated', message: 'New workflow rules applied successfully', timestamp: '2025-12-23T14:30:00Z', type: 'success' },
    { id: 2, title: 'Critical Task Alert', message: '3 tasks unattended >48h', timestamp: '2025-12-23T13:45:00Z', type: 'alert' },
    { id: 3, title: 'Compliance Check Passed', message: '94% rule compliance achieved', timestamp: '2025-12-23T12:20:00Z', type: 'info' }
  ],
  unattendedTasks: [
    { id: 1, title: 'Fix login bug', description: 'User authentication failing for admin users', assignedTo: 'John Doe', superior: 'john.doe@company.com', createdAt: '2025-12-22T10:00:00Z', diffHours: 42, priority: 'high' },
    { id: 2, title: 'Update dashboard charts', description: 'Recharts library needs latest version', assignedTo: 'Sarah Wilson', superior: 'sarah.wilson@company.com', createdAt: '2025-12-21T15:30:00Z', diffHours: 68, priority: 'medium' },
    { id: 3, title: 'Database optimization', description: 'Query performance degradation detected', assignedTo: 'Mike Chen', superior: 'mike.chen@company.com', createdAt: '2025-12-20T09:15:00Z', diffHours: 96, priority: 'critical' }
  ],
  openTasks: [
    { id: 1, title: 'Review Q4 reports', department: 'Finance', progress: 75 },
    { id: 2, title: 'Update API docs', department: 'Engineering', progress: 40 },
    { id: 3, title: 'Test new feature', department: 'QA', progress: 90 }
  ],
  auditLogs: [
    { id: 1, timestamp: '2025-12-23T15:20:15Z', user: 'admin@company.com', action: 'RULE_UPDATE', module: 'Rules Engine', details: 'Updated turnaround time rules', status: 'success' },
    { id: 2, timestamp: '2025-12-23T14:45:22Z', user: 'john.doe@company.com', action: 'TASK_ESCALATE', module: 'Workflow', details: 'Escalated 3 critical tasks', status: 'warning' },
    { id: 3, timestamp: '2025-12-23T14:10:08Z', user: 'sarah@company.com', action: 'COMPLIANCE_CHECK', module: 'Audit', details: '94% compliance achieved', status: 'success' }
  ],
  turnaroundStats: [
    { day: 'Mon', actual: 3.2, target: 4, exceptions: 1 },
    { day: 'Tue', actual: 4.1, target: 4, exceptions: 2 },
    { day: 'Wed', actual: 2.8, target: 4, exceptions: 0 },
    { day: 'Thu', actual: 5.2, target: 4, exceptions: 3 },
    { day: 'Fri', actual: 3.5, target: 4, exceptions: 1 }
  ],
  dayWiseTaskData: [
    { day: 'Mon', engineering: 52, design: 28, qa: 22, operations: 35 },
    { day: 'Tue', engineering: 48, design: 35, qa: 25, operations: 28 },
    { day: 'Wed', engineering: 62, design: 32, qa: 18, operations: 42 },
    { day: 'Thu', engineering: 55, design: 30, qa: 24, operations: 38 },
    { day: 'Fri', engineering: 47, design: 26, qa: 20, operations: 29 }
  ]
};

const AdminDashboard = () => {
  const [metrics] = useState(STATIC_DATA.metrics);
  const [notifications] = useState(STATIC_DATA.notifications);
  const [unattendedTasks] = useState(STATIC_DATA.unattendedTasks);
  const [openTasks] = useState(STATIC_DATA.openTasks);
  const [auditLogs] = useState(STATIC_DATA.auditLogs);
  const [turnaroundStats] = useState(STATIC_DATA.turnaroundStats);
  const [dayWiseTaskData] = useState(STATIC_DATA.dayWiseTaskData);
  const [showMailPopup, setShowMailPopup] = useState(false);
  const [selectedSuperior, setSelectedSuperior] = useState(null);
  const [loading] = useState(false);

  const agingDistribution = useMemo(() => {
    const counts = unattendedTasks.reduce((acc, task) => {
      const category = task.diffHours > 72 ? '72h+' : 
                      task.diffHours > 48 ? '48-72h' : 
                      task.diffHours > 24 ? '24-48h' : '0-24h';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    return [
      { category: '0-24h', count: counts['0-24h'] || 0, color: '#10B981' },
      { category: '24-48h', count: counts['24-48h'] || 0, color: '#3B82F6' },
      { category: '48-72h', count: counts['48-72h'] || 0, color: '#F59E0B' },
      { category: '72h+', count: counts['72h+'] || 0, color: '#EF4444' }
    ];
  }, [unattendedTasks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-2xl mx-auto animate-spin" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Loading Dashboard</h2>
            <p className="text-slate-600">Preparing analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">Dashboard Overview</h1>
            <p className="text-slate-600 mt-2">Monitor performance metrics and workflow analytics</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <Settings size={18} />
              <span className="font-medium">Settings</span>
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Turnaround Time"
            value="4.2h"
            change="+12%"
            trend="up"
            icon={<Timer size={20} />}
            color="blue"
          />
          <MetricCard 
            title="Efficiency"
            value="87%"
            change="+3.2%"
            trend="up"
            icon={<ActivityIcon size={20} />}
            color="emerald"
          />
          <MetricCard 
            title="Compliance"
            value="94%"
            change="+8.1%"
            trend="up"
            icon={<Shield size={20} />}
            color="indigo"
          />
          <MetricCard 
            title="Unattended"
            value={unattendedTasks.length}
            change="Requires action"
            trend="alert"
            icon={<AlertTriangle size={20} />}
            color="red"
          />
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Turnaround Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Turnaround Analysis</h2>
                <p className="text-slate-600 text-sm">Actual vs target completion times</p>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                View details <ChevronRight size={14} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={turnaroundStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="actual" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Actual" />
                <Line type="monotone" dataKey="target" stroke="#EF4444" strokeWidth={2} name="Target" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Task Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Task Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Completed', value: 72, color: '#10B981' },
                    { name: 'In Progress', value: 18, color: '#3B82F6' },
                    { name: 'Pending', value: 10, color: '#F59E0B' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    { name: 'Completed', value: 72, color: '#10B981' },
                    { name: 'In Progress', value: 18, color: '#3B82F6' },
                    { name: 'Pending', value: 10, color: '#F59E0B' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              {['Completed', 'In Progress', 'Pending'].map((status, index) => (
                <div key={status} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ 
                      backgroundColor: status === 'Completed' ? '#10B981' : 
                                     status === 'In Progress' ? '#3B82F6' : '#F59E0B'
                    }} 
                  />
                  <span className="text-sm text-slate-600">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Second Row Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Tasks */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Tasks by Department</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dayWiseTaskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="engineering" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="design" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="qa" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Aging Analysis */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Task Aging Analysis</h2>
            <div className="space-y-6">
              {agingDistribution.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <div className="font-medium text-slate-900">{item.category}</div>
                      <div className="text-sm text-slate-500">{item.count} tasks</div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-slate-900">{item.count}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600">Average resolution time</div>
                  <div className="text-2xl font-bold text-slate-900">4.2 hours</div>
                </div>
                <div className="text-emerald-600 text-sm font-medium flex items-center gap-1">
                  <ArrowUpRight size={16} />
                  12% faster
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Unattended Tasks */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Unattended Tasks</h2>
              <button 
                onClick={() => setShowMailPopup(true)}
                className="flex items-center gap-2 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                <BellRing size={16} />
                Notify Superior
              </button>
            </div>
            <div className="space-y-4">
              {unattendedTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      task.priority === 'critical' ? "bg-red-100 text-red-600" :
                      task.priority === 'high' ? "bg-orange-100 text-orange-600" :
                      "bg-blue-100 text-blue-600"
                    )}>
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{task.title}</div>
                      <div className="text-sm text-slate-500">{task.assignedTo}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      task.diffHours > 72 ? "bg-red-100 text-red-800" :
                      "bg-amber-100 text-amber-800"
                    )}>
                      {task.diffHours}h
                    </span>
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                      Escalate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Notifications</h2>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl">
                  <div className={clsx(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    notification.type === 'success' ? "bg-emerald-100 text-emerald-600" :
                    notification.type === 'alert' ? "bg-amber-100 text-amber-600" :
                    "bg-blue-100 text-blue-600"
                  )}>
                    <Bell size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{notification.title}</div>
                    <div className="text-sm text-slate-500 mt-1">{notification.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1">
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 text-sm font-medium text-slate-600">Timestamp</th>
                  <th className="text-left py-3 text-sm font-medium text-slate-600">User</th>
                  <th className="text-left py-3 text-sm font-medium text-slate-600">Action</th>
                  <th className="text-left py-3 text-sm font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 text-sm">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 text-sm font-medium text-slate-900">{log.user.split('@')[0]}</td>
                    <td className="py-3 text-sm text-slate-600">{log.action}</td>
                    <td className="py-3">
                      <span className={clsx(
                        "px-2 py-1 rounded text-xs font-medium",
                        log.status === 'success' ? "bg-emerald-100 text-emerald-800" :
                        log.status === 'warning' ? "bg-amber-100 text-amber-800" :
                        "bg-red-100 text-red-800"
                      )}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Superior Mail Popup */}
        {showMailPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-900">Notify Superior</h3>
                  <button onClick={() => setShowMailPopup(false)} className="text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Superior</label>
                    <select 
                      className="w-full border border-slate-300 rounded-lg px-4 py-3"
                      value={selectedSuperior || ''}
                      onChange={(e) => setSelectedSuperior(e.target.value)}
                    >
                      <option value="">Choose...</option>
                      <option value="john.doe@company.com">John Doe (Director)</option>
                      <option value="sarah.wilson@company.com">Sarah Wilson (VP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                    <textarea 
                      className="w-full border border-slate-300 rounded-lg px-4 py-3 h-32"
                      defaultValue={`${unattendedTasks.length} tasks require immediate attention.`}
                    />
                  </div>
                  <div className="flex justify-end gap-4">
                    <button 
                      onClick={() => setShowMailPopup(false)}
                      className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button 
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      onClick={() => {
                        setShowMailPopup(false);
                      }}
                    >
                      Send Notification
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, change, trend, icon, color }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={clsx(
        "p-2.5 rounded-lg",
        color === 'blue' && "bg-blue-100 text-blue-600",
        color === 'emerald' && "bg-emerald-100 text-emerald-600",
        color === 'indigo' && "bg-indigo-100 text-indigo-600",
        color === 'red' && "bg-red-100 text-red-600"
      )}>
        {icon}
      </div>
      <div className={clsx(
        "text-sm font-medium flex items-center gap-1",
        trend === 'up' && "text-emerald-600",
        trend === 'down' && "text-red-600",
        trend === 'alert' && "text-amber-600"
      )}>
        {trend === 'up' && <ArrowUpRight size={14} />}
        {trend === 'down' && <ArrowDownRight size={14} />}
        {change}
      </div>
    </div>
    <div className="text-3xl font-bold text-slate-900 mb-2">{value}</div>
    <div className="text-sm text-slate-600">{title}</div>
  </div>
);

export default AdminDashboard;