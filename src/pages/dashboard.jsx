
// import React, { useEffect, useState } from "react";
// import { useSelector, useDispatch } from "react-redux";
// import moment from "moment";
// import clsx from "clsx";
// import { FaTasks, FaCheckCircle, FaSpinner, FaClipboardList } from "react-icons/fa";
// import { fetchUsers, selectUsers } from "../redux/slices/userSlice";
// import { fetchTaskss, selectTasks } from "../redux/slices/taskSlice";

// // Helper for initials
// const getInitials = (name = "") =>
//   name
//     .split(" ")
//     .map(n => n[0]?.toUpperCase() || "")
//     .join("")
//     .slice(0, 2);

// // KPI Card
// const KPIcard = ({ label, value, icon, colorClass }) => (
//   <div className={`flex items-center justify-between p-4 rounded-xl shadow-sm bg-white border border-gray-200 w-64 h-28 hover:shadow-md transition-shadow`}>
//     <div className="flex flex-col justify-center">
//       <span className="text-xs font-semibold uppercase text-gray-500">{label}</span>
//       <span className="text-2xl font-bold text-gray-900">{value}</span>
//     </div>
//     <div className={`w-12 h-12 flex items-center justify-center rounded-full ${colorClass}`}>
//       {icon}
//     </div>
//   </div>
// );

// // Task Card
// const TaskCard = ({ task }) => (
//   <div className="bg-white p-4 rounded-lg shadow-sm mb-3 border border-gray-200 hover:shadow-md cursor-pointer transition-shadow duration-200">
//     <div className="flex justify-between items-center mb-2">
//       <p className="font-semibold text-gray-900 truncate max-w-[65%]">{task.title || "Untitled Task"}</p>
//       <span
//         className={clsx(
//           "text-xs px-3 py-1 rounded-full font-semibold",
//           task.priority === "HIGH"
//             ? "bg-red-100 text-red-700"
//             : task.priority === "MEDIUM"
//               ? "bg-yellow-100 text-yellow-700"
//               : "bg-green-100 text-green-700"
//         )}
//       >
//         {task.priority || "Medium"}
//       </span>
//     </div>
//     <div className="flex -space-x-2 mb-2">
//       {(task.assigned_users || []).map(user => (
//         <div
//           key={user._id}
//           className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs border-2 border-white shadow"
//           title={user.name}
//         >
//           {getInitials(user.name)}
//         </div>
//       ))}
//     </div>
//     <p className="text-xs text-gray-500 flex justify-between">
//       <span>Created: {task.createdAt ? moment(task.createdAt).fromNow() : "N/A"}</span>
//       {task.dueDate && (
//         <span className="ml-2 text-red-600 font-semibold">Due: {moment(task.dueDate).format("MMM D, YYYY")}</span>
//       )}
//     </p>
//   </div>
// );

// // Kanban Column
// const KanbanColumn = ({ title, tasks }) => (
//   <div className="flex-1 bg-white p-5 rounded-xl shadow-sm min-h-[520px] border border-gray-200 flex flex-col">
//     <h3 className="font-semibold mb-5 text-gray-800 border-b border-gray-300 pb-2 sticky top-0 bg-white z-10">
//       {title}
//     </h3>
//     <div className="flex-grow overflow-auto no-scrollbar">
//       {tasks.length ? tasks.map(task => <TaskCard key={task._id} task={task} />) :
//         <p className="text-gray-400 italic">No tasks</p>
//       }
//     </div>
//   </div>
// );

// // User Sidebar
// const UserSidebar = ({ users }) => (
//   <div className="w-full md:w-1/4 bg-white rounded-xl p-5 shadow-sm sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto border border-gray-200">
//     <h3 className="font-semibold mb-5 text-gray-800 border-b border-gray-300 pb-3">Team Members</h3>
//     {users.length ? (
//       users.map(user => (
//         <div key={user._id} className="flex items-center gap-3 mb-4">
//           <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm select-none">
//             {getInitials(user.name)}
//           </div>
//           <div>
//             <p className="font-medium text-gray-800">{user.name}</p>
//             <p className="text-xs text-gray-600">{user.role}</p>
//           </div>
//           <span
//             className={clsx(
//               "ml-auto px-3 py-1 rounded-full text-xs font-semibold select-none whitespace-nowrap",
//               user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
//             )}
//           >
//             {user.isActive ? "Active" : "Disabled"}
//           </span>
//         </div>
//       ))
//     ) : (
//       <p className="text-gray-400 italic">No team members found.</p>
//     )}
//   </div>
// );

// const Dashboard = () => {
//   const dispatch = useDispatch();
//   const tasks = useSelector(selectTasks) || [];
//   const users = useSelector(selectUsers) || [];
//   const [search, setSearch] = useState("");

//   useEffect(() => {
//     // Avoid fetching all tasks without project context. Tasks should be fetched
//     // with a specific `project_id` where needed.
//     dispatch(fetchUsers());
//   }, [dispatch]);

//   const filteredTasks = tasks.filter(task =>
//     task.title?.toLowerCase().includes(search.toLowerCase())
//   );

//   const kanbanColumns = ["TODO", "IN PROGRESS", "COMPLETED"].map(stage => ({
//     stage,
//     tasks: filteredTasks.filter(t => t.stage === stage),
//   }));

//   return (
//     <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
//       {/* Header + Search */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <h1 className="text-3xl font-semibold text-gray-900 select-none">Dashboard</h1>
//         {/* <input
//           type="text"
//           placeholder="Search tasks..."
//           value={search}
//           onChange={e => setSearch(e.target.value)}
//           className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-1/3 focus:outline-none focus:ring focus:ring-indigo-500 focus:border-indigo-500"
//         /> */}
//       </div>

//       {/* KPI Cards: single row */}
//       <div className="flex gap-6 flex-row flex-nowrap justify-start overflow-x-auto no-scrollbar">
//         <KPIcard
//           label="Total Tasks"
//           value={tasks.length}
//           icon={<FaTasks size={24} />}
//           colorClass="bg-blue-100 text-blue-600"
//         />
//         <KPIcard
//           label="Completed"
//           value={tasks.filter(t => t.stage === "COMPLETED").length}
//           icon={<FaCheckCircle size={24} />}
//           colorClass="bg-green-100 text-green-600"
//         />
//         <KPIcard
//           label="In Progress"
//           value={tasks.filter(t => t.stage === "IN PROGRESS").length}
//           icon={<FaSpinner size={24} />}
//           colorClass="bg-yellow-100 text-yellow-600"
//         />
//         <KPIcard
//           label="To Do"
//           value={tasks.filter(t => t.stage === "TODO").length}
//           icon={<FaClipboardList size={24} />}
//           colorClass="bg-purple-100 text-purple-600"
//         />
//       </div>


//       {/* Kanban Board + Sidebar */}
//       <div className="flex flex-col md:flex-row gap-6">
//         <div className="flex-1 flex gap-6 overflow-x-auto no-scrollbar">
//           {kanbanColumns.map(col => (
//             <KanbanColumn key={col.stage} title={col.stage} tasks={col.tasks} />
//           ))}
//         </div>
//         <UserSidebar users={users} />
//       </div>
//     </div>
//   );
// };

// export default Dashboard;



import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";
import {
  FaTasks,
  FaCheckCircle,
  FaSpinner,
  FaClipboardList,
  FaCalendarAlt,
  FaUserFriends,
  FaExclamationTriangle,
  FaChartLine,
  FaFilter,
  FaSearch,
  FaUserPlus,
  FaUserCheck,
  FaUserTimes,
  FaCrown,
  FaUser,
  FaBars,
  FaEllipsisV,
  FaPlus,
  FaProjectDiagram,
  FaClock,
  FaStopwatch,
  FaShieldAlt,
  FaDatabase,
  FaServer,
  FaCog,
  FaUsersCog,
  FaChartBar,
  FaFileExport
} from "react-icons/fa";
import { fetchUsers, selectUsers } from "../redux/slices/userSlice";
import { fetchTasks, selectTasks } from "../redux/slices/taskSlice";

// Helper for initials
const getInitials = (name = "") =>
  name
    .split(" ")
    .map(n => n[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2);

// Optimized Admin KPI Cards - Smaller fonts
const AdminKPI = ({ label, value, icon: Icon, variant = "default", trend }) => {
  const variants = {
    default: "bg-white border-gray-200 shadow-sm text-gray-900",
    critical: "bg-red-50 border-red-200 shadow-md text-red-900",
    warning: "bg-amber-50 border-amber-200 shadow-md text-amber-900",
    success: "bg-emerald-50 border-emerald-200 shadow-md text-emerald-900"
  };

  const trendColor = trend > 0 ? 'text-emerald-600' : 'text-red-600';

  return (
    <div className={`border rounded-xl p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden ${variants[variant]}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 -z-10" />
      <div className="relative z-10 flex items-start justify-between mb-3">
        <div className={`p-2.5 ${variant === 'success' ? 'bg-emerald-100' : variant === 'critical' ? 'bg-red-100' : 'bg-blue-100'} rounded-lg group-hover:scale-105 transition-all shadow-sm`}>
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        {trend !== undefined && (
          <div className={`text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/80 shadow-sm border ${trend > 0 ? 'border-emerald-200 text-emerald-800' : 'border-red-200 text-red-800'}`}>
            {trend > 0 ? `+${trend}%` : `${trend}%`}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-black leading-tight">{value}</p>
        <p className="text-xs uppercase tracking-wide font-bold text-gray-600">{label}</p>
      </div>
    </div>
  );
};

// Compact Admin Header
const AdminHeader = ({ timeFilter, onFilterChange, onSearch, systemStatus }) => (
  <div className="bg-gradient-to-r from-white via-blue-50 to-indigo-50 border-b border-gray-200 shadow-sm px-6 py-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-xl border-2 border-white/50">
          <FaShieldAlt className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">ADMIN DASHBOARD</h1>
          <p className="text-sm text-gray-600 font-medium mt-1">System control center</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm ${systemStatus === 'healthy' ? 'ring-2 ring-emerald-100' : 'ring-2 ring-red-100'}`}>
          <div className={`w-3 h-3 rounded-full shadow-sm ${systemStatus === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse ring-1 ring-white`} />
          <span className={`font-semibold text-xs ${systemStatus === 'healthy' ? 'text-emerald-800' : 'text-red-800'}`}>
            {systemStatus === 'healthy' ? 'HEALTHY' : 'ALERT'}
          </span>
        </div>
        
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Global search..."
            className="pl-11 pr-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 w-72 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 shadow-sm"
            onChange={onSearch}
          />
        </div>
        
        <select 
          className="bg-white border border-gray-200 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm font-medium"
          value={timeFilter} 
          onChange={onFilterChange}
        >
          <option value="24h">24h</option>
          <option value="week">7d</option>
          <option value="month">30d</option>
        </select>
      </div>
    </div>
  </div>
);

// System Metrics Grid
const SystemMetrics = ({ users, tasks }) => {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const pendingTasks = tasks.filter(t => t.stage !== 'COMPLETED').length;
  const overdueCount = tasks.filter(t => {
    if (!t.dueDate || t.stage === 'COMPLETED') return false;
    return moment(t.dueDate).isBefore(moment(), 'day');
  }).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
      <AdminKPI label="USERS" value={totalUsers} icon={FaUsersCog} trend={12} />
      <AdminKPI label="ACTIVE" value={activeUsers} icon={FaUserCheck} variant="success" trend={8} />
      <AdminKPI label="PENDING" value={pendingTasks} icon={FaTasks} trend={-5} />
      <AdminKPI label="OVERDUE" value={overdueCount} icon={FaExclamationTriangle} variant="critical" trend={3} />
    </div>
  );
};

// Compact Admin Control Panel
const AdminControls = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
    {[
      { icon: FaUserPlus, label: 'Bulk Import', color: 'from-blue-500 to-blue-600', hover: 'hover:from-blue-600 hover:to-blue-700' },
      { icon: FaDatabase, label: 'Backup DB', color: 'from-emerald-500 to-emerald-600', hover: 'hover:from-emerald-600 hover:to-emerald-700' },
      { icon: FaServer, label: 'Restart', color: 'from-orange-500 to-orange-600', hover: 'hover:from-orange-600 hover:to-orange-700' },
      { icon: FaFileExport, label: 'Export Data', color: 'from-purple-500 to-purple-600', hover: 'hover:from-purple-600 hover:to-purple-700' }
    ].map(({ icon: Icon, label, color, hover }, i) => (
      <div key={i} className={`group cursor-pointer p-8 rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all bg-gradient-to-br ${color} text-white flex flex-col items-center justify-center text-center shadow-xl ${hover}`}>
        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all backdrop-blur-sm shadow-md">
          <Icon className="w-7 h-7" />
        </div>
        <h3 className="font-black text-lg mb-2 group-hover:scale-105 transition-transform tracking-tight">{label}</h3>
        <p className="text-white/90 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all">Execute</p>
      </div>
    ))}
  </div>
);

// Compact User Management Table
const AdminUsersTable = ({ users }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl mb-10">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1 tracking-tight">USER MANAGEMENT</h2>
        <p className="text-base text-gray-600 font-medium">System user control</p>
      </div>
      <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl hover:shadow-2xl transition-all">
        + ADD ADMIN
      </button>
    </div>
    
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-4 text-sm font-black uppercase tracking-wider text-gray-700">User</th>
            <th className="text-left py-4 text-sm font-black uppercase tracking-wider text-gray-700">Role</th>
            <th className="text-left py-4 text-sm font-black uppercase tracking-wider text-gray-700">Status</th>
            <th className="text-left py-4 text-sm font-black uppercase tracking-wider text-gray-700">Last Seen</th>
            <th className="text-left py-4 text-sm font-black uppercase tracking-wider text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.slice(0, 10).map((user) => (
            <tr key={user._id} className="hover:bg-gray-50 transition-colors group">
              <td className="py-5 pr-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-lg border-2 ${
                    user.isActive 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-200' 
                      : 'bg-gray-200 text-gray-600 border-gray-300'
                  }`}>
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-5 pr-4">
                <span className={`px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm ${
                  user.role?.toLowerCase() === 'admin' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}>
                  {user.role?.toUpperCase() || 'USER'}
                </span>
              </td>
              <td className="py-5 pr-4">
                <span className={`px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm ${
                  user.isActive ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </td>
              <td className="py-5 pr-4 text-sm text-gray-600 font-medium">
                {user.lastLogin ? moment(user.lastLogin).fromNow() : 'Never'}
              </td>
              <td className="py-5">
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-blue-50 rounded-xl transition-all shadow-sm group-hover:shadow-md">
                    <FaCog className="w-4 h-4 text-blue-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-50 rounded-xl transition-all shadow-sm group-hover:shadow-md">
                    <FaEllipsisV className="w-4 h-4 text-gray-600" />
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

// FIXED Task Analytics - Split complex filter
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
    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">TASK ANALYTICS</h2>
        <FaChartBar className="w-8 h-8 text-gray-400" />
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Object.entries(stats).map(([key, value]) => {
          const label = key.toUpperCase();
          const variant = key === 'completed' ? 'success' : key === 'overdue' ? 'critical' : 'default';
          
          return (
            <AdminKPI 
              key={key}
              label={label} 
              value={value} 
              icon={key === 'completed' ? FaCheckCircle : key === 'overdue' ? FaExclamationTriangle : FaTasks}
              variant={variant}
            />
          );
        })}
      </div>
    </div>
  );
};

// Main Compact Admin Dashboard
const Dashboard = () => {
  const dispatch = useDispatch();
  const tasks = useSelector(selectTasks) || [];
  const users = useSelector(selectUsers) || [];
  const [timeFilter, setTimeFilter] = useState("week");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState('healthy');

  useEffect(() => {
    const loadData = async () => {
      setIsUsersLoading(true);
      try {
        await dispatch(fetchUsers());
        await dispatch(fetchTasks());
      } finally {
        setIsUsersLoading(false);
      }
    };
    loadData();
  }, [dispatch]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setTimeFilter(e.target.value);
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Compact Admin Header */}
      <AdminHeader 
        timeFilter={timeFilter}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        systemStatus={systemStatus}
      />

      <div className="px-8 pb-12 space-y-12">
        {/* System Metrics */}
        <SystemMetrics users={users} tasks={tasks} />
        
        {/* Admin Controls */}
        <AdminControls />
        
        {/* Task Analytics & User Management */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          <TaskAnalytics tasks={tasks} />
          <AdminUsersTable users={users} />
        </div>

        {/* Compact System Status Footer */}
        <div className="bg-white/80 border border-gray-200 rounded-2xl p-8 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex items-center gap-6 text-sm font-semibold">
              <div className="flex items-center gap-2 bg-emerald-100 px-4 py-2 rounded-xl border-2 border-emerald-200">
                <FaCrown className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-emerald-800">ADMIN ACTIVE</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <FaDatabase className="w-5 h-5 text-blue-600" />
                <span>{tasks.length} tasks • {users.length} users</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Server: {moment().format('HH:mm')}</span>
              <div className="flex items-center gap-2 bg-emerald-100 px-4 py-2 rounded-xl border-2 border-emerald-200">
                <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-md animate-pulse ring-1 ring-emerald-300" />
                <span className="font-bold text-emerald-800">LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;