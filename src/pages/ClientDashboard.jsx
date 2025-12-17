import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaNewspaper, FaUsers, FaFileAlt, FaChartLine } from "react-icons/fa";
import { FaArrowsToDot } from "react-icons/fa6";
import { MdAdminPanelSettings, MdEdit } from "react-icons/md";
import TaskCard from "../components/TaskCard";
import clsx from "clsx";
import { getClient } from "../redux/slices/clientSlice";
import ClientContacts from "../components/client/ClientContacts";
import ClientDocuments from "../components/client/ClientDocuments";
import ClientAnalytics from "../components/client/ClientAnalytics";

const TABS = {
  OVERVIEW: "overview",
  CONTACTS: "contacts",
  DOCUMENTS: "documents",
  ANALYTICS: "analytics",
};

const ClientDashboard = () => {
  const params = useParams();
  // support both route param names: :id and :clientId
  const clientIdParam = params.clientId || params.id || params.clientId;
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);

  const clientsState = useSelector((state) => state.clients);
  const { status: clientStatus, error: clientError, selectedClient, currentClient } = clientsState || {};

  // Priority: use selectedClient/currentClient (from getClient thunk), then search clients array
  const client = selectedClient || currentClient || (clientsState?.clients || []).find((c) => {
    const id = c?.id || c?._id || c?.public_id || c?.client_id;
    // allow numeric/string comparison
    return id == clientIdParam;
  });
  const { tasks } = useSelector((state) => state.tasks || {});

  useEffect(() => {
    if (clientIdParam) {
      dispatch(getClient(clientIdParam));
    }
  }, [clientIdParam, dispatch]);

  const clientTasks = tasks.filter((task) => {
    return (
      task?.clientId == clientIdParam ||
      task?.client_id == clientIdParam ||
      task?.client == clientIdParam ||
      task?.clientId == (client?.id ?? client?._id)
    );
  });

  const stats = [
    {
      _id: "1",
      label: "TOTAL TASK",
      total: clientTasks.length || 0,
      icon: <FaNewspaper />,
      bg: "bg-[#1d4ed8]",
      thought: "Assigned Overall",
    },
    {
      _id: "2",
      label: "COMPLETED TASK",
      total: clientTasks.filter((task) => task.stage === "COMPLETED").length,
      icon: <MdAdminPanelSettings />,
      bg: "bg-[#0f766e]",
      thought: "Well Done",
    },
    {
      _id: "3",
      label: "TASK IN PROGRESS",
      total: clientTasks.filter((task) => task.stage === "IN PROGRESS").length,
      icon: <MdEdit />,
      bg: "bg-[#f59e0b]",
      thought: "Progress",
    },
    {
      _id: "4",
      label: "TODOS",
      total: clientTasks.filter((task) => task.stage === "TODO").length,
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

  const renderContent = () => {
    switch (activeTab) {
      case TABS.OVERVIEW:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {stats.map(
                ({ icon, bg, label, total, thought }, index) => (
                  <Card
                    key={index}
                    icon={icon}
                    bg={bg}
                    label={label}
                    count={total}
                    thought={thought}
                  />
                )
              )}
            </div>
            <div className="w-full py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 2xl:gap-10">
              {clientTasks.map((task, index) => (
                <TaskCard task={task} key={index} />
              ))}
            </div>
          </>
        );
      case TABS.CONTACTS:
        return <ClientContacts client={client} />;
      case TABS.DOCUMENTS:
        return <ClientDocuments client={client} />;
      case TABS.ANALYTICS:
        return <ClientAnalytics client={client} tasks={tasks} />;
      default:
        return null;
    }
  };

  if (clientStatus === "loading") {
    return <div>Loading...</div>;
  }

  if (clientStatus === "failed") {
    return <div>Error: {clientError || "Failed to load dashboard"}</div>;
  }

  return (
    <div className="h-full py-4">
      <div className="w-full flex justify-between items-center py-4">
        <h1 className="text-2xl font-bold text-black">
          {`Client: ${client?.name || "..."}`}
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab(TABS.OVERVIEW)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-md",
              activeTab === TABS.OVERVIEW && "bg-blue-600 text-white"
            )}
          >
            <FaNewspaper />
            Overview
          </button>
          <button
            onClick={() => setActiveTab(TABS.CONTACTS)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-md",
              activeTab === TABS.CONTACTS && "bg-blue-600 text-white"
            )}
          >
            <FaUsers />
            Contacts
          </button>
          <button
            onClick={() => setActiveTab(TABS.DOCUMENTS)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-md",
              activeTab === TABS.DOCUMENTS && "bg-blue-600 text-white"
            )}
          >
            <FaFileAlt />
            Documents
          </button>
          <button
            onClick={() => setActiveTab(TABS.ANALYTICS)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-md",
              activeTab === TABS.ANALYTICS && "bg-blue-600 text-white"
            )}
          >
            <FaChartLine />
            Analytics
          </button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default ClientDashboard;


