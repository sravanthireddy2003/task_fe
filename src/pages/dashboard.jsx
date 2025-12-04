import React, { useEffect, useState } from "react";
import {
  MdAdminPanelSettings,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdKeyboardDoubleArrowUp,
} from "react-icons/md";
import { MdEdit } from "react-icons/md";
import { FaNewspaper, FaUsers } from "react-icons/fa";
import { FaArrowsToDot } from "react-icons/fa6";
import moment from "moment";
import clsx from "clsx";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUsers,
  selectUserStatus,
  selectUserError,
  fetchUsers,
} from "../redux/slices/userSlice";
import {
  selectTasks,
  fetchTaskss,
} from "../redux/slices/taskSlice";
import { BGS, PRIOTITYSTYELS, TASK_TYPE } from "../utils";
import UserInfo from "../components/UserInfo";

// Updated getInitials utility function
const getInitials = (name = "") => {
  if (!name || typeof name !== "string") return "??";
  return name
    .split(" ")
    .map(part => part[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2);
};

const TaskTable = ({ tasks = [] }) => {
  const PRIORITY_ICONS = {
    HIGH: <MdKeyboardDoubleArrowUp className="text-red-500" />,
    MEDIUM: <MdKeyboardArrowUp className="text-yellow-500" />,
    LOW: <MdKeyboardArrowDown className="text-green-500" />,
  };

  return (
    <div className="w-full md:w-2/3 bg-white px-2 md:px-4 pt-4 pb-4 shadow-md rounded">
      <table className="w-full">
        <thead className="border-b border-gray-300">
          <tr className="text-black text-left">
            <th className="py-2">Task Title</th>
            <th className="py-2">Priority</th>
            <th className="py-2">Team</th>
            <th className="py-2 hidden md:block">Created At</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, index) => (
            <tr
              key={task?._id || index}
              className="border-b border-gray-300 text-gray-600 hover:bg-gray-300/10"
            >
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <div className={clsx("w-4 h-4 rounded-full", TASK_TYPE[task?.stage || "TODO"])} />
                  <p className="text-base text-black">{task?.title || "Untitled Task"}</p>
                </div>
              </td>
              <td className="py-2">
                <div className="flex gap-1 items-center">
                  <span className={clsx("text-lg", PRIOTITYSTYELS[task?.priority || "MEDIUM"])}>
                    {PRIORITY_ICONS[task?.priority || "MEDIUM"]}
                  </span>
                  <span className="capitalize">{task?.priority || "Medium"}</span>
                </div>
              </td>
              <td className="py-2">
                <div className="flex">
                  {(task?.assigned_users || []).map((user, i) => (
                    <div
                      key={user?._id || i}
                      className={clsx(
                        "w-7 h-7 rounded-full text-white flex items-center justify-center text-sm -mr-1",
                        BGS[i % BGS.length]
                      )}
                    >
                      <UserInfo user={user} />
                    </div>
                  ))}
                </div>
              </td>
              <td className="py-2 hidden md:block">
                <span className="text-base text-gray-600">
                  {task?.createdAt ? moment(task.createdAt).fromNow() : "Recently"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const UserTable = ({ users = [] }) => (
  <div className="w-full md:w-1/3 bg-white h-fit px-2 md:px-6 py-4 shadow-md rounded">
    <table className="w-full mb-5">
      <thead className="border-b border-gray-300">
        <tr className="text-black text-left">
          <th className="py-2">Full Name</th>
          <th className="py-2">Status</th>
          <th className="py-2">Created At</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user, index) => (
          <tr
            key={user?._id || index}
            className="border-b border-gray-200 text-gray-600 hover:bg-gray-400/10"
          >
            <td className="py-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full text-white flex items-center justify-center text-sm bg-violet-700">
                  <span>{getInitials(user?.name)}</span>
                </div>
                <div>
                  <p>{user?.name || "Unknown User"}</p>
                  <span className="text-xs text-black">{user?.role || "No role"}</span>
                </div>
              </div>
            </td>
            <td>
              <p
                className={clsx(
                  "w-fit px-3 py-1 rounded-full text-sm",
                  user?.isActive ? "bg-blue-200" : "bg-yellow-100"
                )}
              >
                {user?.isActive ? "Active" : "Disabled"}
              </p>
            </td>
            <td className="py-2 text-sm">
              {user?.createdAt ? moment(user.createdAt).fromNow() : "N/A"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Card = ({ label, count, bg, icon, thought }) => (
  <div className="w-full h-32 bg-white p-5 shadow-md rounded-md flex items-center justify-between">
    <div className="h-full flex flex-1 flex-col justify-between">
      <p className="text-base text-gray-600">{label}</p>
      <span className="text-2xl font-semibold">{count}</span>
      <span className="text-sm text-gray-400">{thought}</span>
    </div>
    <div
      className={clsx(
        "w-10 h-10 rounded-full flex items-center justify-center text-white",
        bg
      )}
    >
      {icon}
    </div>
  </div>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers) || [];
  const tasks = useSelector(selectTasks) || [];
  const userStatus = useSelector(selectUserStatus);
  const userError = useSelector(selectUserError);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchTaskss());
  }, [dispatch]);

  if (userStatus === "loading") {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="h-full flex items-center justify-center text-red-500 p-4">
        Error loading dashboard data: {userError.message || userError}
      </div>
    );
  }

  const filteredTasks = tasks.filter(task =>
    task?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    {
      label: "TOTAL TASK",
      total: tasks.length,
      icon: <FaNewspaper />,
      bg: "bg-[#1d4ed8]",
      thought: "Assigned OverAll",
    },
    {
      label: "COMPLETED TASK",
      total: tasks.filter(task => task?.stage === "COMPLETED").length,
      icon: <MdAdminPanelSettings />,
      bg: "bg-[#0f766e]",
      thought: "Well Done",
    },
    {
      label: "TASK IN PROGRESS",
      total: tasks.filter(task => task?.stage === "IN PROGRESS").length,
      icon: <MdEdit />,
      bg: "bg-[#f59e0b]",
      thought: "Progressing",
    },
    {
      label: "TODOS",
      total: tasks.filter(task => task?.stage === "TODO").length,
      icon: <FaArrowsToDot />,
      bg: "bg-[#be185d]",
      thought: "Remaining",
    },
  ];

  return (
    <div className="h-full py-4">
      <div className="w-full flex py-4 text-black text-left font-bold">
        Client Name
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <Card
            key={index}
            label={stat.label}
            count={stat.total}
            bg={stat.bg}
            icon={stat.icon}
            thought={stat.thought}
          />
        ))}
      </div>

      <div className="w-full flex flex-col md:flex-row gap-4 2xl:gap-10 py-8">
        <TaskTable tasks={filteredTasks} />
        <UserTable users={users} />
      </div>
    </div>
  );
};

export default Dashboard;