import React from "react";
import * as Icons from "../../icons";
import { Chart } from "../Chart";
import { useNavigate } from "react-router-dom";
import fetchWithTenant from "../../utils/fetchWithTenant";

const ClientAnalytics = ({ client, tasks = [], dashboard = {} }) => {
  const navigate = useNavigate();
  const [detailTasks, setDetailTasks] = React.useState([]);
  const [detailStatus, setDetailStatus] = React.useState("idle");

  React.useEffect(() => {
    const taskIds = tasks
      .map((task) => task?.id || task?._id || task?.public_id || task?.task_id)
      .filter(Boolean);

    if (taskIds.length === 0) {
      setDetailTasks([]);
      setDetailStatus("idle");
      return;
    }

    let isActive = true;
    const loadDetails = async () => {
      try {
        setDetailStatus("loading");
        const resp = await fetchWithTenant("/api/tasks/selected-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskIds }),
        });

        if (!isActive) return;

        if (resp && (resp.error || resp.success === false)) {
          throw new Error(resp.error || resp.message || "Failed to fetch task details");
        }

        const payload = resp?.data ?? resp;
        const list = Array.isArray(payload) ? payload : payload?.data;
        setDetailTasks(Array.isArray(list) ? list : []);
        setDetailStatus("succeeded");
      } catch (err) {
        if (!isActive) return;
        console.error("Failed to fetch task details:", err);
        setDetailTasks([]);
        setDetailStatus("failed");
      }
    };

    loadDetails();

    return () => {
      isActive = false;
    };
  }, [tasks]);

  const effectiveTasks = detailTasks.length > 0 ? detailTasks : tasks;

  // Filter tasks for this client using multiple ID fields
  const clientTasks = effectiveTasks.filter((task) => {
    const clientId = client?.id || client?._id;
    return task.clientId === clientId || 
           task.client_id === clientId || 
           task.client === clientId ||
           task.clientId == clientId ||
           task?.client?.id == clientId;
  });

  // Use dashboard data if available, otherwise calculate from tasks
  const totalTaskCount = dashboard.taskCount ?? clientTasks.length;
  const projectCount = dashboard.projectCount ?? 0;
  const completedTasksCount = dashboard.completedTasks ?? clientTasks.filter(t => t.status === "done" || t.stage === "COMPLETED").length;
  const pendingTasksCount = dashboard.pendingTasks ?? clientTasks.filter(t => t.status !== "done" && t.stage !== "COMPLETED").length;

  const taskStatusData = React.useMemo(() => [
    { name: "To Do", value: clientTasks.filter(t => t.status === "todo" || t.status === "To Do" || t.stage === "TODO").length, color: "#fbbf24" },
    { name: "In Progress", value: clientTasks.filter(t => t.status === "in_progress" || t.status === "In Progress" || t.stage === "IN PROGRESS").length, color: "#3b82f6" },
    { name: "Review", value: clientTasks.filter(t => t.status === "review" || t.status === "Review" || t.stage === "REVIEW").length, color: "#8b5cf6" },
    { name: "Done", value: completedTasksCount, color: "#10b981" },
  ], [clientTasks, completedTasksCount]);

  const projects = React.useMemo(() => [...new Set(clientTasks.map(task => task.projectName || task.project).filter(Boolean))], [clientTasks]);
  const totalHours = React.useMemo(() => {
    const hours = dashboard.billableHours ?? clientTasks.reduce((sum, task) => sum + (task.hoursLogged || 0), 0);
    return hours || 0;
  }, [clientTasks, dashboard.billableHours]);
  const upcomingDeadlines = React.useMemo(() => clientTasks.filter(task => task.dueDate && new Date(task.dueDate) > new Date()).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5), [clientTasks]);

  const isLoadingDetails = detailStatus === "loading";
  const hasTasks = totalTaskCount > 0;
  const hasProjects = projectCount > 0 || projects.length > 0;
  const showLoadingState = isLoadingDetails && !hasTasks;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            <Icons.ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
            {client?.name || "Client"} Analytics
          </h1>
          <p className="text-sm text-gray-600">Performance overview and key metrics</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { title: "Total Tasks", value: totalTaskCount.toString(), icon: <Icons.ListChecks className="w-5 h-5 text-blue-600" /> },
            { title: "Projects", value: (projectCount || projects.length).toString(), icon: <Icons.Projector className="w-5 h-5 text-emerald-600" /> },
            { title: "Hours", value: `${totalHours}h`, icon: <Icons.Clock3 className="w-5 h-5 text-purple-600" /> },
            { title: "Deadlines", value: upcomingDeadlines.length.toString(), icon: <Icons.CalendarDays className="w-5 h-5 text-orange-600" /> },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
          {/* Charts & Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
            {/* Pie Chart Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Icons.ListChecks className="w-5 h-5 text-gray-600" />
                  Task Status
                </h2>
              </div>
              <div className="flex items-center justify-center h-[22rem] w-full bg-gray-50 rounded-lg border border-gray-200">
                {showLoadingState ? (
                  <div className="text-center p-12">
                    <Icons.RefreshCw className="w-10 h-10 text-gray-400 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-500">Loading task details...</p>
                  </div>
                ) : hasTasks ? (
                  <div className="w-80 h-80 flex items-center justify-center mx-auto">
                    <Chart
                      type="pie"
                      data={taskStatusData}
                      height={300}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: { padding: 20 }
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center p-12">
                    <Icons.ListChecks className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-500 mb-2">No Tasks Yet</h3>
                    <p className="text-gray-400">Tasks will appear here once assigned to this client</p>
                  </div>
                )}
              </div>
            </div>

            {/* Projects Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 lg:h-[22rem]">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Icons.Projector className="w-5 h-5 text-gray-600" />
                  Projects
                </h2>
              </div>
              {hasProjects ? (
                <div className="h-[18rem] overflow-y-auto pr-2 space-y-3">
                  {projects.slice(0, 6).map((project, i) => {
                    const projectTasks = clientTasks.filter(t => (t.projectName || t.project) === project);
                    return (
                      <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icons.Projector className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 line-clamp-1">{project}</p>
                          <p className="text-sm text-gray-500">{projectTasks.length} tasks</p>
                        </div>
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                          {projectTasks.filter(t => t.status === 'done').length} done
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[18rem] flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <div className="text-center">
                    <Icons.Projector className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-gray-600 mb-1">No Projects</h3>
                    <p className="text-sm text-gray-500">Assign projects to see them here</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Deadlines & Hours */}
          <div className="grid grid-cols-1 gap-8">
            {/* Deadlines Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 lg:h-[22rem]">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Icons.CalendarDays className="w-5 h-5 text-gray-600" />
                  Upcoming Deadlines
                </h2>
              </div>
              {upcomingDeadlines.length ? (
                <div className="h-[18rem] overflow-y-auto pr-2 space-y-3">
                  {upcomingDeadlines.map((task, i) => {
                    const days = Math.ceil((new Date(task.dueDate) - new Date()) / (86400000));
                    return (
                      <div key={i} className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-gray-900 line-clamp-2 mb-2">{task.title || task.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                <Icons.Clock3 className="w-3 h-3" />
                                {days}d
                              </span>
                              <span className="text-xs">{new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            {task.status || 'To Do'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[18rem] flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <div className="text-center">
                    <Icons.CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-gray-600 mb-1">All Clear</h3>
                    <p className="text-sm text-gray-500">No upcoming deadlines</p>
                  </div>
                </div>
              )}
            </div>

            {/* Hours Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Icons.Clock3 className="w-5 h-5 text-gray-600" />
                  Hours Summary
                </h2>
              </div>
              <div className="text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-3 p-6 bg-gray-50 rounded-lg border border-gray-200 mx-auto mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {totalHours}
                    </span>
                    <span className="text-lg font-medium text-gray-600">hours</span>
                  </div>
                  <p className="text-sm text-gray-600">Across {totalTaskCount} tasks</p>
                </div>
                {hasTasks && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {[
                      { count: clientTasks.filter(t => t.status === 'todo').length, label: 'To Do', color: 'text-amber-600' },
                      { count: clientTasks.filter(t => t.status === 'in_progress').length, label: 'In Progress', color: 'text-blue-600' },
                      { count: clientTasks.filter(t => t.status === 'review').length, label: 'Review', color: 'text-purple-600' },
                      { count: clientTasks.filter(t => t.status === 'done').length, label: 'Done', color: 'text-emerald-600' }
                    ].map((item, i) => (
                      <div key={i} className="text-center p-4 rounded-lg bg-white border border-gray-200">
                        <div className={`text-2xl font-semibold ${item.color} mb-1`}>
                          {item.count}
                        </div>
                        <div className="text-sm font-medium text-gray-600">{item.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default ClientAnalytics;
