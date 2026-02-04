// import React, { useEffect, useMemo } from "react";
// import { Link, useParams } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import TaskCard from "../components/TaskCard";
// import { getClient } from "../redux/slices/clientSlice";
// import { selectUser } from "../redux/slices/authSlice";

// const ClientDashboard = () => {
// 	const params = useParams();
// 	const clientIdParam = params.clientId || params.id || params.clientId;
// 	const dispatch = useDispatch();

// 	const user = useSelector(selectUser);
// 	const modules = user?.modules || [];
// 	const metrics = user?.metrics || {};
// 	const resources = user?.resources || {};
// 	const allowedEndpoints = Array.isArray(resources.allowedEndpoints) ? resources.allowedEndpoints : [];
// 	const features = Array.isArray(resources.features) ? resources.features : [];

// 	const clientsState = useSelector((state) => state.clients || {});
// 	const { status: clientStatus, error: clientError, selectedClient, currentClient } = clientsState;
// 	const { tasks = [] } = useSelector((state) => state.tasks || {});

// 	const client = selectedClient || currentClient || (clientsState.clients || []).find((c) => {
// 		const id = c?.id || c?._id || c?.public_id || c?.client_id;
// 		return id == clientIdParam;
// 	});

// 	useEffect(() => {
// 		if (clientIdParam) {
// 			dispatch(getClient(clientIdParam));
// 		}
// 	}, [clientIdParam, dispatch]);

// 	const clientTasks = tasks.filter((task) => {
// 		return (
// 			task?.clientId == clientIdParam ||
// 			task?.client_id == clientIdParam ||
// 			task?.client == clientIdParam ||
// 			task?.clientId == (client?.id ?? client?._id)
// 		);
// 	});

// 	const statTiles = useMemo(() => {
// 		const assignedTasks = metrics.assignedTasks ?? clientTasks.length;
// 		const mappedClient = resources.mappedClient ?? metrics.mappedClient ?? client?.id ?? client?.client_id ?? client?.public_id;
// 		const accessLevel = metrics.accessLevel || resources.accessLevel || "Limited read-only";
// 		const roleLabel = metrics.role || user?.role || "Client";

// 		return [
// 			{
// 				key: "tasks",
// 				label: "Assigned tasks",
// 				value: assignedTasks ?? 0,
// 				helper: "Visible assignments",
// 				Icon: FaNewspaper,
// 			},
// 			{
// 				key: "client",
// 				label: "Mapped client",
// 				value: mappedClient ? `#${mappedClient}` : "(not mapped)",
// 				helper: "Scope inherited from login",
// 				Icon: FaUsers,
// 			},
// 			{
// 				key: "access",
// 				label: "Access level",
// 				value: accessLevel,
// 				helper: roleLabel,
// 				Icon: FaChartLine,
// 			},
// 		];
// 	}, [clientTasks.length, metrics, resources, client?.id, client?.client_id, client?.public_id, user?.role]);

// 	if (clientStatus === "loading") {
// 		return <div>Loading...</div>;
// 	}

// 	if (clientStatus === "failed") {
// 		return <div>Error: {clientError || "Failed to load client"}</div>;
// 	}

// 	return (
// 		<div className="space-y-8">
// 			<header className="space-y-3">
// 				<p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Client experience</p>
// 				<h1 className="text-3xl font-semibold text-gray-900">
// 					{`Hello, ${user?.name || client?.name || "Client"}.`}
// 				</h1>
// 				<p className="text-sm text-gray-500 max-w-3xl">
// 					This view reflects the modules, endpoints, and limits that arrived with your most recent login response.
// 				</p>
// 				<div className="flex flex-wrap gap-3 text-xs text-gray-500">
// 					<span className="uppercase tracking-[0.25em]">Modules {modules.length}</span>
// 					<span className="uppercase tracking-[0.25em]">Endpoints {allowedEndpoints.length}</span>
// 					{resources.restrictions && (
// 						<span className="text-amber-600">{resources.restrictions}</span>
// 					)}
// 				</div>
// 			</header>

// 			<section className="grid gap-4 md:grid-cols-3">
// 				{statTiles.map((tile) => (
// 					<div key={tile.key} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
// 						<div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
// 							<tile.Icon className="h-5 w-5" />
// 						</div>
// 						<div>
// 							<p className="text-xs uppercase tracking-[0.3em] text-gray-400">{tile.label}</p>
// 							<p className="text-2xl font-semibold text-gray-900">{tile.value}</p>
// 							<p className="text-xs text-gray-500">{tile.helper}</p>
// 						</div>
// 					</div>
// 				))}
// 			</section>

// 			<section className="space-y-3">
// 				<div className="flex items-center justify-between">
// 					<div>
// 						<p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Modules</p>
// 						<h2 className="text-xl font-semibold text-gray-900">Enabled experiences</h2>
// 					</div>
// 					<Link to="/client/tasks" className="text-sm font-semibold text-blue-600">View tasks →</Link>
// 				</div>

// 				{modules.length === 0 ? (
// 					<div className="rounded-2xl border border-dashed border-gray-300 bg-white/50 p-6 text-sm text-gray-500">
// 						Your login did not expose any modules. Ask the admin to assign a profile with modules.
// 					</div>
// 				) : (
// 					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
// 						{modules.map((module) => (
// 							<div key={module.moduleId || module.name} className="flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4">
// 								<div>
// 									<p className="text-base font-semibold text-gray-900">{module.name}</p>
// 									<p className="text-xs text-gray-500">Access: {module.access || "read"}</p>
// 								</div>
// 								<div className="mt-4 flex items-center justify-between text-sm text-gray-500">
// 									{module.path ? (
// 										<Link to={module.path} className="font-semibold text-blue-600 hover:text-blue-700">
// 											Open module →
// 										</Link>
// 									) : (
// 										<span className="text-xs text-gray-400">Path not provided</span>
// 									)}
// 									<span className="text-xs">{module.path || "-"}</span>
// 								</div>
// 							</div>
// 						))}
// 					</div>
// 				)}
// 			</section>

// 			<section className="space-y-3">
// 				<div className="flex items-center justify-between">
// 					<div>
// 						<p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Endpoints</p>
// 						<h2 className="text-xl font-semibold text-gray-900">Allowed APIs</h2>
// 					</div>
// 					<span className="text-xs uppercase tracking-[0.3em] text-gray-400">from login response</span>
// 				</div>
// 				{allowedEndpoints.length === 0 ? (
// 					<div className="rounded-2xl border border-dashed border-gray-300 bg-white/50 p-4 text-sm text-gray-500">
// 						No endpoint whitelist provided. Your client view will rely on the defaults configured in the system.
// 					</div>
// 				) : (
// 					<ul className="grid gap-2 text-sm font-mono text-gray-700">
// 						{allowedEndpoints.map((endpoint, idx) => (
// 							<li key={`${endpoint}-${idx}`} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2">
// 								{endpoint}
// 							</li>
// 						))}
// 					</ul>
// 				)}
// 			</section>

// 			{features.length > 0 && (
// 				<section className="space-y-2">
// 					<div className="flex items-center justify-between">
// 						<div>
// 							<p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Features</p>
// 							<h2 className="text-xl font-semibold text-gray-900">What you can do</h2>
// 						</div>
// 						<span className="text-xs text-gray-400">Based on resources</span>
// 					</div>
// 					<div className="flex flex-wrap gap-2">
// 						{features.map((feature) => (
// 							<span key={feature} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
// 								{feature}
// 							</span>
// 						))}
// 					</div>
// 				</section>
// 			)}

// 			<section className="space-y-3">
// 				<div className="flex items-center justify-between">
// 					<div>
// 						<p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Tasks</p>
// 						<h2 className="text-xl font-semibold text-gray-900">Assigned tasks (preview)</h2>
// 					</div>
// 					<Link to="/client/tasks" className="text-sm font-semibold text-blue-600">View all tasks →</Link>
// 				</div>
// 				{clientTasks.length === 0 ? (
// 					<div className="rounded-2xl border border-dashed border-gray-300 bg-white/50 p-6 text-sm text-gray-500">
// 						No tasks are currently mapped to your client account.
// 					</div>
// 				) : (
// 					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
// 						{clientTasks.slice(0, 4).map((task, index) => (
// 							<TaskCard key={task.id || task._id || index} task={task} />
// 						))}
// 					</div>
// 				)}
// 			</section>
// 		</div>
// 	);
// };

// export default ClientDashboard;

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import * as Icons from "../icons";
import TaskCard from "../components/TaskCard";
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

  // Use dashboard stats from API if available, otherwise calculate from tasks
  const dashboard = client?.dashboard || {};
  const projectCount = dashboard.projectCount ?? 0;
  const taskCount = dashboard.taskCount ?? clientTasks.length;
  const completedTasks = dashboard.completedTasks ?? clientTasks.filter((task) => task.stage === "COMPLETED").length;
  const pendingTasks = dashboard.pendingTasks ?? clientTasks.filter((task) => task.stage !== "COMPLETED").length;
  const inProgressTasks = clientTasks.filter((task) => task.stage === "IN PROGRESS").length;

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

            {/* Tasks Section */}
            <div className="bg-white p-4 shadow-md rounded-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Recent Tasks</h3>
                <span className="text-sm text-gray-500">{clientTasks.length} total</span>
              </div>
              {clientTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Icons.Inbox className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No tasks assigned yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {clientTasks.slice(0, 6).map((task, index) => (
                    <TaskCard task={task} key={index} />
                  ))}
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
        return <ClientAnalytics client={client} tasks={clientTasks} dashboard={dashboard} />;
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
      <PageHeader
        title={`Client: ${client?.name || "..."}`}
        subtitle="Client workspace overview"
        onRefresh={handleRefresh}
        refreshing={clientStatus === "loading"}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab(TABS.OVERVIEW)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-md",
              activeTab === TABS.OVERVIEW && "bg-blue-600 text-white"
            )}
          >
            <Icons.Newspaper className="tm-icon" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab(TABS.CONTACTS)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-md",
              activeTab === TABS.CONTACTS && "bg-blue-600 text-white"
            )}
          >
            <Icons.Users className="tm-icon" />
            Contacts
          </button>
          <button
            onClick={() => setActiveTab(TABS.DOCUMENTS)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-md",
              activeTab === TABS.DOCUMENTS && "bg-blue-600 text-white"
            )}
          >
            <Icons.FileText className="tm-icon" />
            Documents
          </button>
          <button
            onClick={() => setActiveTab(TABS.ANALYTICS)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-md",
              activeTab === TABS.ANALYTICS && "bg-blue-600 text-white"
            )}
          >
            <Icons.LineChart className="tm-icon" />
            Analytics
          </button>
        </div>
      </PageHeader>
      {renderContent()}
    </div>
  );
};

export default ClientDashboard;





