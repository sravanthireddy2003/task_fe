import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import * as Icons from "../icons";
import clsx from "clsx";
import { getClient } from "../redux/slices/clientSlice";
import ClientContacts from "../components/client/ClientContacts";
import ClientDocuments from "../components/client/ClientDocuments";
import ClientAnalytics from "../components/client/ClientAnalytics";
import PageHeader from "../components/PageHeader";

const TABS = {
  OVERVIEW: "overview",
  CONTACTS: "contacts",
  DOCUMENTS: "documents",
  ANALYTICS: "analytics",
};

const ClientDashboard = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    if (clientIdParam) {
      dispatch(getClient(clientIdParam));
    }
  }, [clientIdParam, dispatch]);

  // Use projects from client API response (tasks are nested within each project)
  const clientProjects = client?.projects || [];

  const derivedTaskStats = clientProjects.reduce((acc, project) => {
    const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
    acc.total += tasks.length;
    tasks.forEach((task) => {
      const stage = (task.stage || '').toString().toUpperCase();
      const status = (task.status || '').toString().toUpperCase();
      if (status === 'COMPLETED' || stage === 'COMPLETED') acc.completed += 1;
      if (status === 'PENDING' || stage === 'PENDING' || stage === 'TODO') acc.pending += 1;
      if (stage === 'IN PROGRESS' || stage === 'IN_PROGRESS') acc.inProgress += 1;
    });
    return acc;
  }, { total: 0, completed: 0, pending: 0, inProgress: 0 });
  
  // Use dashboard stats from API response
  const dashboard = client?.dashboard || {};
  const projectCount = dashboard.projectCount ?? clientProjects.length;
  const taskCount = dashboard.taskCount ?? derivedTaskStats.total;
  const completedTasks = dashboard.completedTasks ?? derivedTaskStats.completed;
  const pendingTasks = dashboard.pendingTasks ?? derivedTaskStats.pending;

  const stats = [
    {
      _id: "1",
      label: "TOTAL PROJECTS",
      total: projectCount,
      icon: <Icons.Briefcase />,
      bg: "bg-[#7c3aed]",
      thought: "Active Projects",
    },
    {
      _id: "2",
      label: "TOTAL TASKS",
      total: taskCount,
      icon: <Icons.Newspaper />,
      bg: "bg-[#1d4ed8]",
      thought: "Assigned Overall",
    },
    {
      _id: "3",
      label: "COMPLETED TASKS",
      total: completedTasks,
      icon: <Icons.ShieldCheck />,
      bg: "bg-[#0f766e]",
      thought: "Well Done",
    },
    {
      _id: "4",
      label: "PENDING TASKS",
      total: pendingTasks,
      icon: <Icons.Clock />,
      bg: "bg-[#f59e0b]",
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
          <div className="space-y-6">
            {/* Stats Cards */}
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

            {/* Manager Info */}
            {dashboard.assignedManager && (
              <div className="bg-white p-4 shadow-md rounded-md">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Assigned Manager</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Icons.User2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{dashboard.assignedManager.name}</p>
                    <p className="text-sm text-gray-500">Manager</p>
                  </div>
                </div>
              </div>
            )}

            {/* Client Info */}
            <div className="bg-white p-4 shadow-md rounded-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Icons.Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Company</p>
                    <p className="font-medium text-gray-900">{client?.company || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icons.Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{client?.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icons.Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{client?.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icons.MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">
                      {[client?.district, client?.state, client?.pincode].filter(Boolean).join(', ') || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects & Tasks Section */}
            <div className="bg-white p-4 shadow-md rounded-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Projects & Tasks</h3>
                <span className="text-sm text-gray-500">{projectCount} projects</span>
              </div>
              {clientProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Icons.Inbox className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No projects assigned yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientProjects.map((project, projectIndex) => {
                    const projectTasks = Array.isArray(project?.tasks) ? project.tasks : [];
                    return (
                      <div key={project.id || project.public_id || projectIndex} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div>
                            <h4 className="text-base font-semibold text-gray-900">{project.name || 'Untitled Project'}</h4>
                            <p className="text-xs text-gray-500">{project.status || 'Unknown Status'}</p>
                          </div>
                          <span className="text-xs text-gray-500">{projectTasks.length} tasks</span>
                        </div>
                        {projectTasks.length === 0 ? (
                          <p className="text-sm text-gray-500">No tasks for this project</p>
                        ) : (
                          <div className="space-y-3">
                            {projectTasks.map((task, taskIndex) => {
                              const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
                              return (
                                <div key={task.id || task.public_id || task._id || taskIndex} className="border border-gray-200 rounded-lg p-3">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <h5 className="font-medium text-gray-900">{task.title || task.name || 'Untitled Task'}</h5>
                                    <div className="flex gap-2">
                                      {task.priority && (
                                        <span className={clsx(
                                          "text-xs px-2 py-0.5 rounded",
                                          task.priority.toLowerCase() === 'high' && "bg-red-100 text-red-700",
                                          task.priority.toLowerCase() === 'medium' && "bg-yellow-100 text-yellow-700",
                                          task.priority.toLowerCase() === 'low' && "bg-green-100 text-green-700"
                                        )}>
                                          {task.priority}
                                        </span>
                                      )}
                                      {task.status && (
                                        <span className={clsx(
                                          "text-xs px-2 py-0.5 rounded",
                                          (task.status.toLowerCase() === 'completed' || task.stage?.toLowerCase() === 'completed') && "bg-green-100 text-green-700",
                                          (task.status.toLowerCase() === 'in progress' || task.stage?.toLowerCase() === 'in progress') && "bg-blue-100 text-blue-700",
                                          (task.status.toLowerCase() === 'pending' || task.stage?.toLowerCase() === 'pending') && "bg-gray-100 text-gray-700"
                                        )}>
                                          {task.status}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {task.description && (
                                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                                  )}
                                  <div className="text-xs text-gray-500">
                                    {subtasks.length > 0 ? (
                                      <span>{subtasks.length} subtask{subtasks.length !== 1 ? 's' : ''}</span>
                                    ) : (
                                      <span>No subtasks</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      case TABS.CONTACTS:
        return <ClientContacts client={client} contacts={client?.contacts || []} />;
      case TABS.DOCUMENTS:
        return <ClientDocuments client={client} documents={client?.documents || []} />;
      case TABS.ANALYTICS:
        return <ClientAnalytics client={client} tasks={client?.tasks || []} projects={clientProjects} dashboard={dashboard} />;
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

  const handleRefresh = () => {
    if (clientIdParam) {
      dispatch(getClient(clientIdParam));
    }
  };

  return (
    <div className="h-full py-4">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition mb-4"
          title="Go back to previous page"
        >
          <Icons.ChevronLeft className="tm-icon" />
          Back
        </button>
        <PageHeader
          title={`Client: ${client?.name || "..."}`}
          subtitle="Client workspace overview"
          onRefresh={handleRefresh}
          refreshing={clientStatus === "loading"}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab(TABS.OVERVIEW)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-md transition",
                activeTab === TABS.OVERVIEW ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <Icons.Newspaper className="tm-icon" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab(TABS.CONTACTS)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-md transition",
                activeTab === TABS.CONTACTS ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <Icons.Users className="tm-icon" />
              Contacts
            </button>
            <button
              onClick={() => setActiveTab(TABS.DOCUMENTS)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-md transition",
                activeTab === TABS.DOCUMENTS ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <Icons.FileText className="tm-icon" />
              Documents
            </button>
            <button
              onClick={() => setActiveTab(TABS.ANALYTICS)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-md transition",
                activeTab === TABS.ANALYTICS ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <Icons.LineChart className="tm-icon" />
              Analytics
            </button>
          </div>
        </PageHeader>
      </div>
      {renderContent()}
    </div>
  );
};

export default ClientDashboard;





