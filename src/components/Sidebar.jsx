// import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { Link, useLocation } from "react-router-dom";
// import clsx from "clsx";

// // Icons
// import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
// import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
// import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
// import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
// import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
// import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
// import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
// import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
// import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
// import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
// import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
// import ApprovalRoundedIcon from "@mui/icons-material/ApprovalRounded";
// import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
// import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

// import { setOpenSidebar, setSidebarCollapsed } from "../redux/slices/authSlice";

// // Default Links
// const defaultLinks = [
//   { label: "Dashboard", link: "dashboard", icon: <DashboardRoundedIcon /> },
//   { label: "Users & Teams", link: "team", icon: <GroupsRoundedIcon /> },
//   { label: "Clients", link: "client", icon: <BusinessCenterRoundedIcon /> },
//   { label: "Departments", link: "departments", icon: <ApartmentRoundedIcon /> },
//   { label: "Projects", link: "projects", icon: <WorkOutlineRoundedIcon /> },
//   { label: "Tasks", link: "tasks", icon: <ChecklistRoundedIcon /> },
//   { label: "Analytics", link: "report", icon: <InsightsRoundedIcon /> },
//   { label: "Documents", link: "documents", icon: <ChecklistRoundedIcon /> },
//   { label: "Settings", link: "settings", icon: <SettingsRoundedIcon /> },
//   { label: "Chat", link: "chat", icon: <ChatBubbleRoundedIcon /> },
//   { label: "Workflow", link: "workflow", icon: <AutoGraphRoundedIcon /> },
//   { label: "Notifications", link: "notifications", icon: <NotificationsRoundedIcon /> },
//   { label: "Approvals", link: "approvals", icon: <ApprovalRoundedIcon /> },
//   { label: "Trash", link: "trash", icon: <DeleteRoundedIcon /> },
// ];

// const Sidebar = () => {
//   const { user, isSidebarCollapsed } = useSelector((state) => state.auth);
//   const dispatch = useDispatch();
//   const location = useLocation();
//   const path = location.pathname.split("/")[1];

//   const [hovered, setHovered] = useState(false);

//   const sidebarLinks =
//     user?.modules?.length
//       ? user.modules.map((m) => defaultLinks.find((l) => l.label === m.name)).filter(Boolean)
//       : defaultLinks;

//   const closeSidebar = () => dispatch(setOpenSidebar(false));
//   const toggleCollapse = () => dispatch(setSidebarCollapsed(!isSidebarCollapsed));

//   return (
//     <div
//       className={clsx(
//         "h-screen flex flex-col backdrop-blur-xl bg-gradient-to-b from-blue-50/50 to-blue-100/20 border-r border-blue-200 text-gray-800 transition-all duration-300",
//         isSidebarCollapsed ? "w-16" : "w-64"
//       )}
//       onMouseEnter={() => setHovered(true)}
//       onMouseLeave={() => setHovered(false)}
//     >
//       {/* HEADER */}
//       <div className="flex items-center justify-between p-4 border-b border-blue-200/40">
//         <div className="flex items-center gap-2 flex-1 min-w-0">
//           <img src="/nmit.png" className="h-8 w-10" alt="Logo" />
//           {(!isSidebarCollapsed || hovered) && (
//             <span className="text-lg font-bold text-blue-700">Task Manager</span>
//           )}
//         </div>

//         <button
//           onClick={toggleCollapse}
//           className="ml-2 flex items-center justify-center h-10 w-10 rounded-xl bg-blue-100/30 hover:bg-blue-200/50 shadow-inner transition-all duration-300"
//         >
//           <MenuRoundedIcon className="text-blue-700 text-2xl" />
//         </button>
//       </div>

//       {/* NAVIGATION */}
//       <div className="flex flex-col gap-3 p-3 flex-1 overflow-y-auto">
//         {sidebarLinks.map((link) => {
//           const isActive = path === link.link.split("/")[0];
//           return (
//             <Link
//               key={link.label}
//               to={link.link.startsWith("/") ? link.link : `/${link.link}`}
//               onClick={closeSidebar}
//               className={clsx(
//                 "flex items-center gap-3 px-4 py-2 rounded-2xl transition-all duration-300 group",
//                 isActive
//                   ? "bg-blue-600/80 text-white shadow-lg shadow-blue-400/40"
//                   : "text-blue-600 hover:bg-blue-100/40 hover:text-blue-800 hover:shadow hover:shadow-blue-200/40"
//               )}
//             >
//               <span className="text-xl transition-transform duration-300 group-hover:scale-110">
//                 {link.icon}
//               </span>
//               {(!isSidebarCollapsed || hovered) && (
//                 <span className="text-sm font-medium truncate">{link.label}</span>
//               )}
//             </Link>
//           );
//         })}
//       </div>

//       {/* SUPPORT */}
//       <div className="p-3 border-t border-blue-200/40">
//         <a
//           href="https://wa.me/9560737311"
//           target="_blank"
//           rel="noreferrer"
//           className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-blue-100/40 hover:text-blue-700 transition-all duration-300"
//         >
//           <img alt="WhatsApp" src="/wp.png" className="h-7 w-7" />
//           {(!isSidebarCollapsed || hovered) && (
//             <span className="text-xs font-medium">Support</span>
//           )}
//         </a>
//       </div>
//     </div>
//   );
// };

// export default Sidebar;





import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import clsx from "clsx";
import { MODULE_MAP } from "../App/moduleMap.jsx";
import { setSidebarCollapsed } from "../redux/slices/authSlice";

const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const current = location.pathname.split("/")[1];

  const { user, isSidebarCollapsed } = useSelector((state) => state.auth);

  // ✅ PERFECT - Now works with JSX icons from moduleMap
  const sidebarLinks = user?.modules
    ?.map((mod) => MODULE_MAP[mod.name])
    .filter(Boolean) || [];

  return (
    <div
      className={clsx(
        "h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isSidebarCollapsed && (
          <h1 className="text-xl font-bold text-gray-800">Task Manager</h1>
        )}
        <button
          onClick={() => dispatch(setSidebarCollapsed(!isSidebarCollapsed))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={isSidebarCollapsed ? "Expand" : "Collapse"}
        >
          <span className="text-lg">≡</span>
        </button>
      </div>

      {/* Links */}
      <nav className="flex-1 mt-4 px-1">
        {sidebarLinks.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            Loading modules...
          </div>
        ) : (
          sidebarLinks.map((item, idx) => {
            const active = current === item.link.replace("/", "");

            return (
              <Link
                key={idx}
                to={item.link}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg mx-2 mb-1 transition-all group",
                  active
                    ? "bg-blue-500 text-white shadow-lg"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
                title={item.label}
              >
                {/* ✅ FIXED: Direct render - now JSX elements from moduleMap */}
                <span className="text-xl flex-shrink-0">
                  {item.icon}
                </span>
                
                {!isSidebarCollapsed && (
                  <span className="font-medium truncate">{item.label}</span>
                )}
              </Link>
            );
          })
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
