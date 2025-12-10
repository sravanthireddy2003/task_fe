// import React from "react";
// import {
//   MdDashboard,
//   MdHeight,
//   MdOutlineAddTask,
//   MdOutlinePendingActions,
//   MdSettings,
// } from "react-icons/md";
// import { TbReportSearch } from "react-icons/tb";
// import { BsFileEarmarkSpreadsheetFill } from "react-icons/bs";
// import { FaTasks, FaTrashAlt, FaUsers, FaGlobe } from "react-icons/fa";
// import { IoChatbubbles } from "react-icons/io5";
// import { RiNotification3Line } from "react-icons/ri";
// import { BiGitBranch } from "react-icons/bi";
// import { useDispatch, useSelector } from "react-redux";
// import { Link, useLocation } from "react-router-dom";
// import { setOpenSidebar } from "../redux/slices/authSlice";
// import clsx from "clsx";
// import { PiHeartLight } from "react-icons/pi";

// // Default sidebar entries — includes exact labels used in backend/user modules payload
// const linkData = [
//   { label: "Dashboard", link: "dashboard", icon: <MdDashboard /> },
//   { label: "User Management", link: "team", icon: <FaUsers /> },
//   { label: "Team & Employees", link: "team", icon: <FaUsers /> },
//   { label: "Clients", link: "client", icon: <FaGlobe /> },
//   { label: "Departments", link: "departments", icon: <MdHeight /> },
//   { label: "Projects", link: "projects", icon: <MdOutlineAddTask /> },
//   { label: "Tasks", link: "tasks", icon: <FaTasks /> },
//   { label: "Reports & Analytics", link: "report", icon: <TbReportSearch /> },
//   { label: "Document & File Management", link: "documents", icon: <BsFileEarmarkSpreadsheetFill /> },
//   { label: "Settings & Master Configuration", link: "settings", icon: <MdSettings /> },
//   { label: "Chat / Real-Time Collaboration", link: "chat", icon: <IoChatbubbles /> },
//   { label: "Workflow (Project & Task Flow)", link: "workflow", icon: <BiGitBranch /> },
//   { label: "Notifications", link: "notifications", icon: <RiNotification3Line /> },
//   { label: "Approval Workflows", link: "approvals", icon: <MdOutlinePendingActions /> },
//   { label: "Trash", link: "trash", icon: <FaTrashAlt /> },
// ];

// const Sidebar = () => {
//   const { user } = useSelector((state) => state.auth);

//   const dispatch = useDispatch();
//   const location = useLocation();

//   const path = location.pathname.split("/")[1];

//   // const sidebarLinks = user?.isAdmin ? linkData : linkData.slice(1, 4);
//   // Build sidebar links from user.modules if provided, otherwise fall back to default linkData
//   const sidebarLinks = (() => {
//     if (user?.modules && Array.isArray(user.modules) && user.modules.length > 0) {
//       // map module name to known route path (fallback to dashboard)
//       const moduleToRoute = (modName) => {
//         const map = {
//           'Dashboard': 'dashboard',
//           'User Management': 'team',
//           'Team & Employees': 'team',
//           'Clients': 'client',
//           'Departments': 'departments',
//           'Projects': 'projects',
//           'Tasks': 'tasks',
//           'Reports & Analytics': 'report',
//           'Document & File Management': 'documents',
//           'Settings & Master Configuration': 'settings',
//           'Chat / Real-Time Collaboration': 'chat',
//           'Workflow (Project & Task Flow)': 'workflow',
//           'Notifications': 'notifications',
//           'Approval Workflows': 'approvals',
//           'Trash': 'trash'
//         };
//         return map[modName] || 'dashboard';
//       };

//       return user.modules.map((m) => ({
//         label: m.name,
//         link: moduleToRoute(m.name),
//         access: m.access,
//         icon: linkData.find((l) => l.label === m.name)?.icon || <MdDashboard />,
//       }));
//     }

//     return linkData;
//   })();

//   const closeSidebar = () => {
//     dispatch(setOpenSidebar(false));
//   };

//   const NavLink = ({ el }) => {
//     const to = el.link && el.link.startsWith("/") ? el.link : `/${el.link}`;

//     return (
//       <Link
//         to={to}
//         onClick={closeSidebar}
//         className={clsx(
//           "w-full lg:w-3/4 flex gap-2 px-3 py-2 rounded-full items-center text-gray-800 text-base hover:bg-[#2564ed2d]",
//           path === el.link.split("/")[0] ? "bg-blue-700 text-neutral-100" : ""
//         )}
//       >
//         {el.icon}
//         <span className='hover:text-[#2564ed]'>{el.label}</span>
//       </Link>
//     );
//   };
//   return (
//     <div className='w-full  h-full flex flex-col gap-6 p-5'>
//       <h1 className='flex gap-1 items-center'>
//         <p>    
//           <img src="/nmit.png" alt="Description of the image" style={{height:'80px',width:'120px'}} />

//         </p>
//         <span className='text-2xl font-bold text-black'>Task Manager</span>
//       </h1>

//       <div className='flex-1 flex flex-col gap-y-5 py-8'>
//         {sidebarLinks.map((link) => (
//           <NavLink el={link} key={link.label} />
//         ))}
//       </div>

//       {/* <div className=''>
//         <button className='w-full flex gap-2 p-2 items-center text-lg text-gray-800'>
//           <MdSettings />
//           <MdHeight/>,
//   <MdOutlineAddTask/>,
//   <PiHeartLight/>
//           <span>Settings</span>
//         </button>
//       </div> */}
//       <div className=''>
//         <button className='items-right'>
//             <a href="https://wa.me/9560737311" target="blank">
//       <img alt="Chat on WhatsApp" src="/wp.png" style={{height:"54px",width:"54px" }}/>
//       </a >
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Sidebar;


import React, { useState } from "react";
import {
  MdDashboard,
  MdOutlineAddTask,
  MdOutlinePendingActions,
  MdSettings,
  MdPeople,
  MdMenu,
} from "react-icons/md";
import { TbReportAnalytics } from "react-icons/tb";
import { BsFileEarmarkSpreadsheetFill } from "react-icons/bs";
import { FaTasks, FaTrashAlt, FaGlobe } from "react-icons/fa";
import { IoChatbubbles } from "react-icons/io5";
import { RiNotification3Line } from "react-icons/ri";
import { BiGitBranch } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { setOpenSidebar, setSidebarCollapsed } from "../redux/slices/authSlice";

const defaultLinks = [
  { label: "Dashboard", link: "dashboard", icon: <MdDashboard /> },
  { label: "Users & Teams", link: "team", icon: <MdPeople /> },
  { label: "Clients", link: "client", icon: <FaGlobe /> },
  { label: "Departments", link: "departments", icon: <MdOutlineAddTask /> },
  { label: "Projects", link: "projects", icon: <MdOutlineAddTask /> },
  { label: "Tasks", link: "tasks", icon: <FaTasks /> },
  { label: "Analytics", link: "report", icon: <TbReportAnalytics /> },
  { label: "Documents", link: "documents", icon: <BsFileEarmarkSpreadsheetFill /> },
  { label: "Settings", link: "settings", icon: <MdSettings /> },
  { label: "Chat", link: "chat", icon: <IoChatbubbles /> },
  { label: "Workflow", link: "workflow", icon: <BiGitBranch /> },
  { label: "Notifications", link: "notifications", icon: <RiNotification3Line /> },
  { label: "Approvals", link: "approvals", icon: <MdOutlinePendingActions /> },
  { label: "Trash", link: "trash", icon: <FaTrashAlt /> },
];

const Sidebar = () => {
  const { user, isSidebarCollapsed } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const path = location.pathname.split("/")[1];

  // Only for hover-label behavior, not for layout width
  const [showLabels, setShowLabels] = useState(false);

  const sidebarLinks = (() => {
    if (user?.modules && Array.isArray(user.modules) && user.modules.length > 0) {
      const mapModule = {
        Dashboard: "dashboard",
        "User Management": "team",
        "Team & Employees": "team",
        Clients: "client",
        Departments: "departments",
        Projects: "projects",
        Tasks: "tasks",
        "Reports & Analytics": "report",
        "Document & File Management": "documents",
        Settings: "settings",
        Chat: "chat",
        Workflow: "workflow",
        Notifications: "notifications",
        Approvals: "approvals",
        Trash: "trash",
      };
      return user.modules.map((m) => ({
        label:
          defaultLinks.find((l) =>
            l.label.toLowerCase().includes(m.name.toLowerCase())
          )?.label || m.name,
        link: mapModule[m.name] || "dashboard",
        access: m.access,
        icon: defaultLinks.find((l) => l.label === m.name)?.icon || <MdDashboard />,
      }));
    }
    return defaultLinks;
  })();

  const closeSidebar = () => dispatch(setOpenSidebar(false));

  const toggleCollapse = () => {
    dispatch(setSidebarCollapsed(!isSidebarCollapsed));
  };

  const NavLink = ({ el }) => {
    const to = el.link.startsWith("/") ? el.link : `/${el.link}`;
    const isActive = path === el.link.split("/")[0];

    return (
      <Link
        to={to}
        onClick={closeSidebar}
        className={clsx(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 group",
          isActive
            ? "bg-blue-600 text-white shadow-sm"
            : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
        )}
      >
        <span className="text-xl flex-shrink-0">{el.icon}</span>
        {(!isSidebarCollapsed || showLabels) && (
          <span className="whitespace-nowrap text-sm font-medium">
            {el.label}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div
      className={clsx(
        "h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
        isSidebarCollapsed ? "w-16" : "w-64"
      )}
      onMouseEnter={() => setShowLabels(true)}
      onMouseLeave={() => setShowLabels(false)}
    >
      {/* Header with collapse button */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <img src="/nmit.png" alt="Logo" className="h-8 w-10 flex-shrink-0" />
          {(!isSidebarCollapsed || showLabels) && (
            <span className="text-lg font-semibold text-gray-900 truncate">
              Task Manager
            </span>
          )}
        </div>
<button
  onClick={toggleCollapse}
  className="
    ml-2 flex items-center justify-center h-10 w-10
    rounded-2xl bg-white/30 backdrop-blur-xl
    border border-white/40 shadow-md
    hover:bg-white/50 hover:shadow-xl
    transition-all duration-300
  "
>
  <span className="text-2xl text-gray-700">
    {isSidebarCollapsed ? <MdMenu /> : <MdMenu />}
  </span>
</button>
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
        {sidebarLinks.map((link) => (
          <NavLink key={link.label} el={link} />
        ))}
      </div>

      {/* Bottom support */}
      <div className="p-3 border-t border-gray-100">
        <a
          href="https://wa.me/9560737311"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg hover:bg-gray-50 px-2 py-2 group"
        >
          <img alt="WhatsApp" src="/wp.png" className="h-7 w-7" />
          {(!isSidebarCollapsed || showLabels) && (
            <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
              Support
            </span>
          )}
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
