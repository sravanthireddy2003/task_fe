// import React, { useEffect, useState } from "react";
// import {
//   MdAdminPanelSettings,
//   MdKeyboardArrowDown,
//   MdKeyboardArrowUp,
//   MdKeyboardDoubleArrowUp,
// } from "react-icons/md";
// import { MdEdit } from "react-icons/md";
// import { FaNewspaper, FaUsers } from "react-icons/fa";
// import { FaArrowsToDot } from "react-icons/fa6";
// import moment from "moment";
// import clsx from "clsx";
// import { useSelector, useDispatch } from "react-redux";
// import {
//   selectUsers,
//   selectUserStatus,
//   selectUserError,
//   fetchUsers,
// } from "../redux/slices/userSlice";
// import {
//   selectTasks,
//   fetchTaskss,
// } from "../redux/slices/taskSlice";
// import { BGS, PRIOTITYSTYELS, TASK_TYPE } from "../utils";
// import UserInfo from "../components/UserInfo";

// // Updated getInitials utility function
// const getInitials = (name = "") => {
//   if (!name || typeof name !== "string") return "??";
//   return name
//     .split(" ")
//     .map(part => part[0]?.toUpperCase() || "")
//     .join("")
//     .slice(0, 2);
// };

// const TaskTable = ({ tasks = [] }) => {
//   const PRIORITY_ICONS = {
//     HIGH: <MdKeyboardDoubleArrowUp className="text-red-500" />,
//     MEDIUM: <MdKeyboardArrowUp className="text-yellow-500" />,
//     LOW: <MdKeyboardArrowDown className="text-green-500" />,
//   };

//   return (
//     <div className="w-full md:w-2/3 bg-white px-2 md:px-4 pt-4 pb-4 shadow-md rounded">
//       <table className="w-full">
//         <thead className="border-b border-gray-300">
//           <tr className="text-black text-left">
//             <th className="py-2">Task Title</th>
//             <th className="py-2">Priority</th>
//             <th className="py-2">Team</th>
//             <th className="py-2 hidden md:block">Created At</th>
//           </tr>
//         </thead>
//         <tbody>
//           {tasks.map((task, index) => (
//             <tr
//               key={task?._id || index}
//               className="border-b border-gray-300 text-gray-600 hover:bg-gray-300/10"
//             >
//               <td className="py-2">
//                 <div className="flex items-center gap-2">
//                   <div className={clsx("w-4 h-4 rounded-full", TASK_TYPE[task?.stage || "TODO"])} />
//                   <p className="text-base text-black">{task?.title || "Untitled Task"}</p>
//                 </div>
//               </td>
//               <td className="py-2">
//                 <div className="flex gap-1 items-center">
//                   <span className={clsx("text-lg", PRIOTITYSTYELS[task?.priority || "MEDIUM"])}>
//                     {PRIORITY_ICONS[task?.priority || "MEDIUM"]}
//                   </span>
//                   <span className="capitalize">{task?.priority || "Medium"}</span>
//                 </div>
//               </td>
//               <td className="py-2">
//                 <div className="flex">
//                   {(task?.assigned_users || []).map((user, i) => (
//                     <div
//                       key={user?._id || i}
//                       className={clsx(
//                         "w-7 h-7 rounded-full text-white flex items-center justify-center text-sm -mr-1",
//                         BGS[i % BGS.length]
//                       )}
//                     >
//                       <UserInfo user={user} />
//                     </div>
//                   ))}
//                 </div>
//               </td>
//               <td className="py-2 hidden md:block">
//                 <span className="text-base text-gray-600">
//                   {task?.createdAt ? moment(task.createdAt).fromNow() : "Recently"}
//                 </span>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// const UserTable = ({ users = [] }) => (
//   <div className="w-full md:w-1/3 bg-white h-fit px-2 md:px-6 py-4 shadow-md rounded">
//     <table className="w-full mb-5">
//       <thead className="border-b border-gray-300">
//         <tr className="text-black text-left">
//           <th className="py-2">Full Name</th>
//           <th className="py-2">Status</th>
//           <th className="py-2">Created At</th>
//         </tr>
//       </thead>
//       <tbody>
//         {users.map((user, index) => (
//           <tr
//             key={user?._id || index}
//             className="border-b border-gray-200 text-gray-600 hover:bg-gray-400/10"
//           >
//             <td className="py-2">
//               <div className="flex items-center gap-3">
//                 <div className="w-9 h-9 rounded-full text-white flex items-center justify-center text-sm bg-violet-700">
//                   <span>{getInitials(user?.name)}</span>
//                 </div>
//                 <div>
//                   <p>{user?.name || "Unknown User"}</p>
//                   <span className="text-xs text-black">{user?.role || "No role"}</span>
//                 </div>
//               </div>
//             </td>
//             <td>
//               <p
//                 className={clsx(
//                   "w-fit px-3 py-1 rounded-full text-sm",
//                   user?.isActive ? "bg-blue-200" : "bg-yellow-100"
//                 )}
//               >
//                 {user?.isActive ? "Active" : "Disabled"}
//               </p>
//             </td>
//             <td className="py-2 text-sm">
//               {user?.createdAt ? moment(user.createdAt).fromNow() : "N/A"}
//             </td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   </div>
// );

// const Card = ({ label, count, bg, icon, thought }) => (
//   <div className="w-full h-32 bg-white p-5 shadow-md rounded-md flex items-center justify-between">
//     <div className="h-full flex flex-1 flex-col justify-between">
//       <p className="text-base text-gray-600">{label}</p>
//       <span className="text-2xl font-semibold">{count}</span>
//       <span className="text-sm text-gray-400">{thought}</span>
//     </div>
//     <div
//       className={clsx(
//         "w-10 h-10 rounded-full flex items-center justify-center text-white",
//         bg
//       )}
//     >
//       {icon}
//     </div>
//   </div>
// );

// const Dashboard = () => {
//   const dispatch = useDispatch();
//   const users = useSelector(selectUsers) || [];
//   const tasks = useSelector(selectTasks) || [];
//   const userStatus = useSelector(selectUserStatus);
//   const userError = useSelector(selectUserError);
//   const [searchQuery, setSearchQuery] = useState("");

//   useEffect(() => {
//     dispatch(fetchUsers());
//     dispatch(fetchTaskss());
//   }, [dispatch]);

//   if (userStatus === "loading") {
//     return (
//       <div className="h-full flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//       </div>
//     );
//   }

//   if (userError) {
//     return (
//       <div className="h-full flex items-center justify-center text-red-500 p-4">
//         Error loading dashboard data: {userError.message || userError}
//       </div>
//     );
//   }

//   const filteredTasks = tasks.filter(task =>
//     task?.title?.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const stats = [
//     {
//       label: "TOTAL TASK",
//       total: tasks.length,
//       icon: <FaNewspaper />,
//       bg: "bg-[#1d4ed8]",
//       thought: "Assigned OverAll",
//     },
//     {
//       label: "COMPLETED TASK",
//       total: tasks.filter(task => task?.stage === "COMPLETED").length,
//       icon: <MdAdminPanelSettings />,
//       bg: "bg-[#0f766e]",
//       thought: "Well Done",
//     },
//     {
//       label: "TASK IN PROGRESS",
//       total: tasks.filter(task => task?.stage === "IN PROGRESS").length,
//       icon: <MdEdit />,
//       bg: "bg-[#f59e0b]",
//       thought: "Progressing",
//     },
//     {
//       label: "TODOS",
//       total: tasks.filter(task => task?.stage === "TODO").length,
//       icon: <FaArrowsToDot />,
//       bg: "bg-[#be185d]",
//       thought: "Remaining",
//     },
//   ];

//   return (
//     <div className="h-full py-4">
//       <div className="w-full flex py-4 text-black text-left font-bold">
//         Client Name
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
//         {stats.map((stat, index) => (
//           <Card
//             key={index}
//             label={stat.label}
//             count={stat.total}
//             bg={stat.bg}
//             icon={stat.icon}
//             thought={stat.thought}
//           />
//         ))}
//       </div>

//       <div className="w-full flex flex-col md:flex-row gap-4 2xl:gap-10 py-8">
//         <TaskTable tasks={filteredTasks} />
//         <UserTable users={users} />
//       </div>
//     </div>
//   );
// };

// export default Dashboard;


import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";
import clsx from "clsx";
import { FaTasks, FaCheckCircle, FaSpinner, FaClipboardList } from "react-icons/fa";
import { fetchUsers, selectUsers } from "../redux/slices/userSlice";
import { fetchTaskss, selectTasks } from "../redux/slices/taskSlice";

// Helper for initials
const getInitials = (name = "") =>
  name
    .split(" ")
    .map(n => n[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2);

// KPI Card
const KPIcard = ({ label, value, icon, colorClass }) => (
  <div className={`flex items-center justify-between p-4 rounded-xl shadow-sm bg-white border border-gray-200 w-64 h-28 hover:shadow-md transition-shadow`}>
    <div className="flex flex-col justify-center">
      <span className="text-xs font-semibold uppercase text-gray-500">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
    </div>
    <div className={`w-12 h-12 flex items-center justify-center rounded-full ${colorClass}`}>
      {icon}
    </div>
  </div>
);

// Task Card
const TaskCard = ({ task }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm mb-3 border border-gray-200 hover:shadow-md cursor-pointer transition-shadow duration-200">
    <div className="flex justify-between items-center mb-2">
      <p className="font-semibold text-gray-900 truncate max-w-[65%]">{task.title || "Untitled Task"}</p>
      <span
        className={clsx(
          "text-xs px-3 py-1 rounded-full font-semibold",
          task.priority === "HIGH"
            ? "bg-red-100 text-red-700"
            : task.priority === "MEDIUM"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"
        )}
      >
        {task.priority || "Medium"}
      </span>
    </div>
    <div className="flex -space-x-2 mb-2">
      {(task.assigned_users || []).map(user => (
        <div
          key={user._id}
          className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs border-2 border-white shadow"
          title={user.name}
        >
          {getInitials(user.name)}
        </div>
      ))}
    </div>
    <p className="text-xs text-gray-500 flex justify-between">
      <span>Created: {task.createdAt ? moment(task.createdAt).fromNow() : "N/A"}</span>
      {task.dueDate && (
        <span className="ml-2 text-red-600 font-semibold">Due: {moment(task.dueDate).format("MMM D, YYYY")}</span>
      )}
    </p>
  </div>
);

// Kanban Column
const KanbanColumn = ({ title, tasks }) => (
  <div className="flex-1 bg-white p-5 rounded-xl shadow-sm min-h-[520px] border border-gray-200 flex flex-col">
    <h3 className="font-semibold mb-5 text-gray-800 border-b border-gray-300 pb-2 sticky top-0 bg-white z-10">
      {title}
    </h3>
    <div className="flex-grow overflow-auto no-scrollbar">
      {tasks.length ? tasks.map(task => <TaskCard key={task._id} task={task} />) :
        <p className="text-gray-400 italic">No tasks</p>
      }
    </div>
  </div>
);

// User Sidebar
const UserSidebar = ({ users }) => (
  <div className="w-full md:w-1/4 bg-white rounded-xl p-5 shadow-sm sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto border border-gray-200">
    <h3 className="font-semibold mb-5 text-gray-800 border-b border-gray-300 pb-3">Team Members</h3>
    {users.length ? (
      users.map(user => (
        <div key={user._id} className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm select-none">
            {getInitials(user.name)}
          </div>
          <div>
            <p className="font-medium text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-600">{user.role}</p>
          </div>
          <span
            className={clsx(
              "ml-auto px-3 py-1 rounded-full text-xs font-semibold select-none whitespace-nowrap",
              user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            )}
          >
            {user.isActive ? "Active" : "Disabled"}
          </span>
        </div>
      ))
    ) : (
      <p className="text-gray-400 italic">No team members found.</p>
    )}
  </div>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const tasks = useSelector(selectTasks) || [];
  const users = useSelector(selectUsers) || [];
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchTaskss());
    dispatch(fetchUsers());
  }, [dispatch]);

  const filteredTasks = tasks.filter(task =>
    task.title?.toLowerCase().includes(search.toLowerCase())
  );

  const kanbanColumns = ["TODO", "IN PROGRESS", "COMPLETED"].map(stage => ({
    stage,
    tasks: filteredTasks.filter(t => t.stage === stage),
  }));

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Header + Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-semibold text-gray-900 select-none">Dashboard</h1>
        {/* <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-1/3 focus:outline-none focus:ring focus:ring-indigo-500 focus:border-indigo-500"
        /> */}
      </div>

      {/* KPI Cards: single row */}
      <div className="flex gap-6 flex-row flex-nowrap justify-start overflow-x-auto no-scrollbar">
        <KPIcard
          label="Total Tasks"
          value={tasks.length}
          icon={<FaTasks size={24} />}
          colorClass="bg-blue-100 text-blue-600"
        />
        <KPIcard
          label="Completed"
          value={tasks.filter(t => t.stage === "COMPLETED").length}
          icon={<FaCheckCircle size={24} />}
          colorClass="bg-green-100 text-green-600"
        />
        <KPIcard
          label="In Progress"
          value={tasks.filter(t => t.stage === "IN PROGRESS").length}
          icon={<FaSpinner size={24} />}
          colorClass="bg-yellow-100 text-yellow-600"
        />
        <KPIcard
          label="To Do"
          value={tasks.filter(t => t.stage === "TODO").length}
          icon={<FaClipboardList size={24} />}
          colorClass="bg-purple-100 text-purple-600"
        />
      </div>


      {/* Kanban Board + Sidebar */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex gap-6 overflow-x-auto no-scrollbar">
          {kanbanColumns.map(col => (
            <KanbanColumn key={col.stage} title={col.stage} tasks={col.tasks} />
          ))}
        </div>
        <UserSidebar users={users} />
      </div>
    </div>
  );
};

export default Dashboard;
