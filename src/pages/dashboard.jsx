 
import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";
import * as Icons from "../icons";
import { fetchUsers, selectUsers } from "../redux/slices/userSlice";
import { fetchTasks, selectTasks } from "../redux/slices/taskSlice";
 
// Helper for initials
const getInitials = (name = "") =>
  name
    .split(" ")
    .map(n => n[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2);
 
// **UNIFIED KPI CARD** - All cards match "Total Users" style
const KPI = ({ label, value, icon: Icon, trend, variant = "primary" }) => {
  const base =
    "group relative overflow-hidden rounded-2xl border bg-white " +
    "shadow-sm hover:shadow-md transition-all duration-200 " +
    "hover:-translate-y-0.5 p-5 flex flex-col gap-3 min-h-[120px]";
 
  const variants = {
    primary: "border-gray-200 hover:border-gray-300",
    success: "border-emerald-200 bg-emerald-50/60 hover:border-emerald-300",
    warning: "border-amber-200 bg-amber-50/60 hover:border-amber-300",
    critical: "border-red-200 bg-red-50/60 hover:border-red-300"
  };
 
  return (
    <div className={`${base} ${variants[variant]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="p-2.5 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-gray-700 flex-shrink-0" />
        </div>
 
        {trend !== undefined && (
          <span
            className={
              "px-2.5 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap flex-shrink-0 " +
              (trend >= 0
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200")
            }
          >
            {trend >= 0 ? `+${trend}%` : `${trend}%`}
          </span>
        )}
      </div>
 
      <div className="flex flex-col gap-1 flex-1 justify-end">
        <span className="text-2xl font-bold text-gray-900 leading-tight">
          {value}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </span>
      </div>
    </div>
  );
};
 
// Non-Sticky Header
const Header = ({ timeFilter, onFilterChange, onSearch, systemStatus }) => (
  <div className="bg-white/80 border-b border-gray-200 shadow-sm backdrop-blur-sm">
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg border border-white/50">
            <Icons.ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">System overview & management</p>
          </div>
        </div>
       
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold shadow-sm ${
            systemStatus === 'healthy'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className={`w-3 h-3 rounded-full shadow-sm ${systemStatus === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
            <span>{systemStatus === 'healthy' ? 'System Healthy' : 'System Alert'}</span>
          </div>
         
          <div className="relative flex-1 max-w-md">
            <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
            <input
              type="text"
              placeholder="Search users, tasks, reports..."
              className="pl-11 pr-4 py-2.5 w-full border border-gray-200 rounded-xl text-sm bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
              onChange={onSearch}
            />
          </div>
         
          <select
            className="border border-gray-200 text-sm px-4 py-2.5 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold min-w-[90px]"
            value={timeFilter}
            onChange={onFilterChange}
          >
            <option value="24h">24h</option>
            <option value="week">7 days</option>
            <option value="month">30 days</option>
          </select>
        </div>
      </div>
    </div>
  </div>
);
 
// **ALL KPI CARDS MATCH "Total Users" STYLE**
const MetricsGrid = ({ users, tasks }) => {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const pendingTasks = tasks.filter(t => t.stage !== 'COMPLETED').length;
  const overdueCount = tasks.filter(t => {
    if (!t.dueDate || t.stage === 'COMPLETED') return false;
    return moment(t.dueDate).isBefore(moment(), 'day');
  }).length;
 
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPI label="Total Users" value={totalUsers.toLocaleString()} icon={Icons.Users} trend={5} />
        <KPI label="Active Users" value={activeUsers.toLocaleString()} icon={Icons.UserCheck} variant="success" trend={8} />
        <KPI label="Pending Tasks" value={pendingTasks.toLocaleString()} icon={Icons.ListChecks} trend={-2} variant="warning" />
        <KPI label="Overdue Tasks" value={overdueCount.toLocaleString()} icon={Icons.AlertTriangle} variant="critical" trend={3} />
      </div>
    </div>
  );
};
 
// Professional ControlPanel Cards (Different style - Executive)
const ControlPanel = () => (
  <div className="max-w-7xl mx-auto px-6 py-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        {
          IconComponent: Icons.Database,
          label: 'Database Backup',
          desc: 'Create full system backup',
          color: 'bg-gradient-to-br from-emerald-500 to-emerald-600'
        },
        {
          IconComponent: Icons.Server,
          label: 'System Restart',
          desc: 'Restart all services safely',
          color: 'bg-gradient-to-br from-blue-500 to-blue-600'
        },
        {
          IconComponent: Icons.FileDown,
          label: 'Export Reports',
          desc: 'Generate CSV & PDF files',
          color: 'bg-gradient-to-br from-purple-500 to-purple-600'
        },
        {
          IconComponent: Icons.UserPlus,
          label: 'Bulk Import',
          desc: 'Import users & tasks data',
          color: 'bg-gradient-to-br from-indigo-500 to-indigo-600'
        }
      ].map(({ IconComponent, label, desc, color }, i) => (
        <div key={i} className="group relative overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 hover:-translate-y-2 h-[200px] flex flex-col">
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${color}`} />
          <div className="p-6 pt-8 border-b border-gray-50 relative z-10">
            <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mx-auto group-hover:scale-110 transition-all duration-300 mb-4`}>
              <IconComponent className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center leading-tight group-hover:text-gray-800 transition-colors">{label}</h3>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center relative z-10">
            <p className="text-gray-600 text-center font-medium leading-relaxed">{desc}</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
          <div className="absolute top-4 right-4 w-3 h-3 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md ring-2 ring-white/50" />
        </div>
      ))}
    </div>
  </div>
);
 
// Users Table
const UsersTable = ({ users }) => (
  <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden mb-8">
    <div className="border-b border-gray-200 px-8 py-8 bg-gray-50">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h2>
          <p className="text-gray-600 mt-2 text-sm font-medium">Manage system users, roles & permissions</p>
        </div>
        <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl hover:shadow-2xl transition-all whitespace-nowrap">
          + Add Admin User
        </button>
      </div>
    </div>
   
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-8 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">User</th>
            <th className="px-8 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
            <th className="px-8 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
            <th className="px-8 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Last Active</th>
            <th className="px-8 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {users.slice(0, 10).map((user, index) => (
            <tr key={user._id || index} className="hover:bg-gray-50/50 transition-all group">
              <td className="px-8 py-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shadow-md border-2 flex-shrink-0 ${
                    user.isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                    {getInitials(user.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-8 py-6">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm whitespace-nowrap ${
                  user.role?.toLowerCase() === 'admin'
                    ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border border-indigo-200'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}>
                  {user.role?.toUpperCase() || 'USER'}
                </span>
              </td>
              <td className="px-8 py-6">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm whitespace-nowrap ${
                  user.isActive
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-8 py-6">
                <span className="text-sm text-gray-700 font-medium">
                  {user.lastLogin ? moment(user.lastLogin).fromNow() : 'Never'}
                </span>
              </td>
              <td className="px-8 py-6">
                <div className="flex items-center space-x-2">
                  <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-all shadow-sm group-hover:shadow-md flex-shrink-0">
                    <Settings className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                  </button>
                  <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-all shadow-sm group-hover:shadow-md flex-shrink-0">
                    <MoreVertical className="w-4 h-4 text-gray-600 group-hover:text-gray-800" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
 
// **TASK ANALYTICS - ALL USE UNIFIED KPI**
const TaskAnalytics = ({ tasks }) => {
  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.stage === 'COMPLETED').length,
    overdue: tasks.filter(t => {
      if (!t.dueDate || t.stage === 'COMPLETED') return false;
      return moment(t.dueDate).isBefore(moment(), 'day');
    }).length,
    highPriority: tasks.filter(t => t.priority === 'HIGH').length
  }), [tasks]);
 
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 mb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Task Analytics</h2>
          <p className="text-sm text-gray-600 mt-1 font-medium">System-wide task performance</p>
        </div>
        <BarChart3 className="w-8 h-8 text-gray-400" />
      </div>
     
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KPI label="Total Tasks" value={stats.total.toLocaleString()} icon={ListChecks} />
        <KPI label="Completed" value={stats.completed.toLocaleString()} icon={ListChecks} variant="success" />
        <KPI label="Overdue" value={stats.overdue.toLocaleString()} icon={AlertTriangle} variant="critical" />
        <KPI label="High Priority" value={stats.highPriority.toLocaleString()} icon={ListChecks} variant="warning" />
      </div>
    </div>
  );
};
 
// Main Dashboard
const Dashboard = () => {
  const dispatch = useDispatch();
  const tasks = useSelector(selectTasks) || [];
  const users = useSelector(selectUsers) || [];
  const [timeFilter, setTimeFilter] = useState("week");
  const [searchTerm, setSearchTerm] = useState("");
  const [systemStatus, setSystemStatus] = useState('healthy');
 
  useEffect(() => {
    const loadData = async () => {
      try {
        await dispatch(fetchUsers());
        await dispatch(fetchTasks());
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setSystemStatus('alert');
      }
    };
    loadData();
  }, [dispatch]);
 
  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (e) => setTimeFilter(e.target.value);
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header
        timeFilter={timeFilter}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        systemStatus={systemStatus}
      />
     
      <main>
        <MetricsGrid users={users} tasks={tasks} />
        <ControlPanel />
       
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <TaskAnalytics tasks={tasks} />
            <UsersTable users={users} />
          </div>
        </div>
 
        <div className="border-t border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2.5 bg-emerald-50 px-4 py-2.5 rounded-xl border-2 border-emerald-200 shadow-sm">
                  <Crown className="w-4 h-4 text-yellow-600" />
                  <span className="font-bold text-emerald-800">Admin Session Active</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>{tasks.length.toLocaleString()} tasks • {users.length.toLocaleString()} users</span>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500 font-medium">
                <span>Server: {moment().format('HH:mm:ss')}</span>
                <div className="flex items-center gap-2 bg-emerald-50 px-5 py-2.5 rounded-xl border-2 border-emerald-200 shadow-sm">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-md animate-pulse ring-1 ring-emerald-300" />
                  <span className="font-bold text-emerald-800">Live Data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
 
export default Dashboard;
 