import React from "react";
import {
  MdDashboard,
  MdHeight,
  MdOutlineAddTask,
  MdOutlinePendingActions,
  MdSettings,
} from "react-icons/md";
import { TbReportSearch } from "react-icons/tb";
import { BsFileEarmarkSpreadsheetFill } from "react-icons/bs";
import { FaTasks, FaTrashAlt, FaUsers, FaGlobe } from "react-icons/fa";
import { IoChatbubbles } from "react-icons/io5";
import { RiNotification3Line } from "react-icons/ri";
import { BiGitBranch } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { setOpenSidebar } from "../redux/slices/authSlice";
import clsx from "clsx";
import { PiHeartLight } from "react-icons/pi";

// Default sidebar entries — includes exact labels used in backend/user modules payload
const linkData = [
  { label: "Dashboard", link: "dashboard", icon: <MdDashboard /> },
  { label: "User Management", link: "team", icon: <FaUsers /> },
  { label: "Team & Employees", link: "team", icon: <FaUsers /> },
  { label: "Clients", link: "client", icon: <FaGlobe /> },
  { label: "Departments", link: "departments", icon: <MdHeight /> },
  { label: "Projects", link: "projects", icon: <MdOutlineAddTask /> },
  { label: "Tasks", link: "tasks", icon: <FaTasks /> },
  { label: "Reports & Analytics", link: "report", icon: <TbReportSearch /> },
  { label: "Document & File Management", link: "documents", icon: <BsFileEarmarkSpreadsheetFill /> },
  { label: "Settings & Master Configuration", link: "settings", icon: <MdSettings /> },
  { label: "Chat / Real-Time Collaboration", link: "chat", icon: <IoChatbubbles /> },
  { label: "Workflow (Project & Task Flow)", link: "workflow", icon: <BiGitBranch /> },
  { label: "Notifications", link: "notifications", icon: <RiNotification3Line /> },
  { label: "Approval Workflows", link: "approvals", icon: <MdOutlinePendingActions /> },
  { label: "Trash", link: "trash", icon: <FaTrashAlt /> },
];

const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);

  const dispatch = useDispatch();
  const location = useLocation();

  const path = location.pathname.split("/")[1];

  // const sidebarLinks = user?.isAdmin ? linkData : linkData.slice(1, 4);
  // Build sidebar links from user.modules if provided, otherwise fall back to default linkData
  const sidebarLinks = (() => {
    if (user?.modules && Array.isArray(user.modules) && user.modules.length > 0) {
      // map module name to known route path (fallback to dashboard)
      const moduleToRoute = (modName) => {
        const map = {
          'Dashboard': 'dashboard',
          'User Management': 'team',
          'Team & Employees': 'team',
          'Clients': 'client',
          'Departments': 'departments',
          'Projects': 'projects',
          'Tasks': 'tasks',
          'Reports & Analytics': 'report',
          'Document & File Management': 'documents',
          'Settings & Master Configuration': 'settings',
          'Chat / Real-Time Collaboration': 'chat',
          'Workflow (Project & Task Flow)': 'workflow',
          'Notifications': 'notifications',
          'Approval Workflows': 'approvals',
          'Trash': 'trash'
        };
        return map[modName] || 'dashboard';
      };

      return user.modules.map((m) => ({
        label: m.name,
        link: moduleToRoute(m.name),
        access: m.access,
        icon: linkData.find((l) => l.label === m.name)?.icon || <MdDashboard />,
      }));
    }

    return linkData;
  })();

  const closeSidebar = () => {
    dispatch(setOpenSidebar(false));
  };

  const NavLink = ({ el }) => {
    const to = el.link && el.link.startsWith("/") ? el.link : `/${el.link}`;

    return (
      <Link
        to={to}
        onClick={closeSidebar}
        className={clsx(
          "w-full lg:w-3/4 flex gap-2 px-3 py-2 rounded-full items-center text-gray-800 text-base hover:bg-[#2564ed2d]",
          path === el.link.split("/")[0] ? "bg-blue-700 text-neutral-100" : ""
        )}
      >
        {el.icon}
        <span className='hover:text-[#2564ed]'>{el.label}</span>
      </Link>
    );
  };
  return (
    <div className='w-full  h-full flex flex-col gap-6 p-5'>
      <h1 className='flex gap-1 items-center'>
        <p>    
          <img src="/nmit.png" alt="Description of the image" style={{height:'80px',width:'120px'}} />

        </p>
        <span className='text-2xl font-bold text-black'>Task Manager</span>
      </h1>

      <div className='flex-1 flex flex-col gap-y-5 py-8'>
        {sidebarLinks.map((link) => (
          <NavLink el={link} key={link.label} />
        ))}
      </div>

      {/* <div className=''>
        <button className='w-full flex gap-2 p-2 items-center text-lg text-gray-800'>
          <MdSettings />
          <MdHeight/>,
  <MdOutlineAddTask/>,
  <PiHeartLight/>
          <span>Settings</span>
        </button>
      </div> */}
      <div className=''>
        <button className='items-right'>
            <a href="https://wa.me/9560737311" target="blank">
      <img alt="Chat on WhatsApp" src="/wp.png" style={{height:"54px",width:"54px" }}/>
      </a >
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
