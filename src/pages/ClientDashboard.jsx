import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaNewspaper } from "react-icons/fa";
import { FaArrowsToDot } from "react-icons/fa6";
import { MdAdminPanelSettings } from "react-icons/md";
import { LuClipboardEdit } from "react-icons/lu";
import TaskCard from "../components/TaskCard";
import clsx from "clsx";

const ClientDashboard = () => {
  const { clientid } = useParams();

  const client = { id: clientid, name: "John Doe" };
  const tasks=[
    { id: 1, title: "Task 1", stage: "COMPLETED", priority: "HIGH" },
    { id: 2, title: "Task 2", stage: "IN PROGRESS", priority: "MEDIUM" },
    { id: 3, title: "Task 3", stage: "TODO", priority: "LOW" },
    { id: 4, title: "Task 4", stage: "COMPLETED", priority: "MEDIUM" },
    { id: 5, title: "Task 5", stage: "IN PROGRESS", priority: "HIGH" },
  ];

  const stats = [
    {
      _id: "1",
      label: "TOTAL TASK",
      total: tasks.length || 0,
      icon: <FaNewspaper />,
      bg: "bg-[#1d4ed8]",
      thought: "Assigned Overall",
    },
    {
      _id: "2",
      label: "COMPLETED TASK",
      total: tasks.filter((task) => task.stage === "COMPLETED").length,
      icon: <MdAdminPanelSettings />,
      bg: "bg-[#0f766e]",
      thought: "Well Done",
    },
    {
      _id: "3",
      label: "TASK IN PROGRESS",
      total: tasks.filter((task) => task.stage === "IN PROGRESS").length,
      icon: <LuClipboardEdit />,
      bg: "bg-[#f59e0b]",
      thought: "Progress",
    },
    {
      _id: "4",
      label: "TODOS",
      total: tasks.filter((task) => task.stage === "TODO").length,
      icon: <FaArrowsToDot />,
      bg: "bg-[#be185d]",
      thought: "Remaining",
    },
  ];

  const Card = ({ label, count, bg, icon, thought }) => (
    <div className="w-full h-32 bg-white p-5 shadow-md rounded-md flex items-center justify-between">
      <div className="h-full flex flex-1 flex-col justify-between">
        <p className="text-base text-gray-600">{label}</p>
        <span className="text-2xl font-semibold">{count}</span>
        <span className="text-sm text-gray-400">{thought}</span>
      </div>
      <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center text-white", bg)}>
        {icon}
      </div>
    </div>
  );

  return (
    <div className="h-full py-4">
      <div className="w-full flex py-4 text-black text-left font-bold">
        {`Client: ${client.name}`}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {stats.map(({ icon, bg, label, total, thought }, index) => (
          <Card key={index} icon={icon} bg={bg} label={label} count={total} thought={thought} />
        ))}
      </div>
      <div className="w-full py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 2xl:gap-10">
        {tasks.map((task, index) => (
          <TaskCard taskId={task.task_id || task._id} key={index} />
        ))}
      </div>
    </div>
  );
};

export default ClientDashboard;


