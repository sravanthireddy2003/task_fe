import React from "react";
import { FaTasks, FaProjectDiagram, FaClock, FaCalendarAlt, FaArrowLeft } from "react-icons/fa";
import { Chart } from "../Chart";
import { useNavigate } from "react-router-dom";

const ClientAnalytics = ({ client, tasks }) => {
  const navigate = useNavigate();
  const clientTasks = tasks.filter((task) => task.clientId === client?.id);

  const taskStatusData = React.useMemo(() => [
    { name: "To Do", value: clientTasks.filter(t => t.status === "todo" || t.status === "To Do").length, color: "#fbbf24" },
    { name: "In Progress", value: clientTasks.filter(t => t.status === "in_progress" || t.status === "In Progress").length, color: "#3b82f6" },
    { name: "Review", value: clientTasks.filter(t => t.status === "review" || t.status === "Review").length, color: "#8b5cf6" },
    { name: "Done", value: clientTasks.filter(t => t.status === "done" || t.status === "Done").length, color: "#10b981" },
  ], [clientTasks]);

  const projects = React.useMemo(() => [...new Set(clientTasks.map(task => task.projectName || task.project).filter(Boolean))], [clientTasks]);
  const totalHours = React.useMemo(() => clientTasks.reduce((sum, task) => sum + (task.hoursLogged || 0), 0), [clientTasks]);
  const upcomingDeadlines = React.useMemo(() => clientTasks.filter(task => task.dueDate && new Date(task.dueDate) > new Date()).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5), [clientTasks]);

  const hasTasks = clientTasks.length > 0;
  const hasProjects = projects.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-8 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 shadow-sm border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200 font-medium text-sm whitespace-nowrap"
          >
            <FaArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            {client?.name || "Client"} Analytics
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">Comprehensive performance overview and key metrics</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { title: "Total Tasks", value: clientTasks.length.toString(), icon: <FaTasks className="text-blue-500" />, color: "from-blue-500 to-blue-600" },
            { title: "Projects", value: projects.length.toString(), icon: <FaProjectDiagram className="text-emerald-500" />, color: "from-emerald-500 to-emerald-600" },
            { title: "Hours", value: `${totalHours}h`, icon: <FaClock className="text-purple-500" />, color: "from-purple-500 to-purple-600" },
            { title: "Deadlines", value: upcomingDeadlines.length.toString(), icon: <FaCalendarAlt className="text-orange-500" />, color: "from-orange-500 to-orange-600" },
          ].map((stat, i) => (
            <div key={i} className="group bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden h-full min-h-[140px] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-600 mb-2 line-clamp-2">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 line-clamp-1">{stat.value}</p>
                </div>
                <div className="p-3 bg-gradient-to-br bg-white/50 rounded-xl ml-3 flex-shrink-0 group-hover:scale-110 transition-all">
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
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 overflow-hidden">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  Task Status <FaTasks className="text-amber-500" />
                </h2>
              </div>
              <div className="flex items-center justify-center h-[22rem] w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden">
                {hasTasks ? (
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
                    <FaTasks className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-500 mb-2">No Tasks Yet</h3>
                    <p className="text-gray-400">Tasks will appear here once assigned to this client</p>
                  </div>
                )}
              </div>
            </div>

            {/* Projects Card */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 overflow-hidden lg:h-[22rem]">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  Projects <FaProjectDiagram className="text-emerald-500" />
                </h2>
              </div>
              {hasProjects ? (
                <div className="h-[18rem] overflow-y-auto custom-scrollbar pr-4 space-y-4">
                  {projects.slice(0, 6).map((project, i) => {
                    const projectTasks = clientTasks.filter(t => (t.projectName || t.project) === project);
                    return (
                      <div key={i} className="group flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 hover:shadow-lg transition-all cursor-pointer overflow-hidden">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <FaProjectDiagram className="text-white text-lg" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-lg text-gray-900 line-clamp-1 mb-1">{project}</p>
                          <p className="text-sm text-gray-600">{projectTasks.length} tasks</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-bold rounded-full flex-shrink-0">
                          {projectTasks.filter(t => t.status === 'done').length} done
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[18rem] flex items-center justify-center p-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <FaProjectDiagram className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-500 mb-2">No Projects</h3>
                    <p className="text-gray-400">Assign projects to see them here</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Deadlines & Hours */}
          <div className="grid grid-cols-1 gap-8">
            {/* Deadlines Card */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 overflow-hidden lg:h-[22rem]">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  Upcoming <FaCalendarAlt className="text-orange-500" />
                </h2>
              </div>
              {upcomingDeadlines.length ? (
                <div className="h-[18rem] overflow-y-auto custom-scrollbar pr-4 space-y-4">
                  {upcomingDeadlines.map((task, i) => {
                    const days = Math.ceil((new Date(task.dueDate) - new Date()) / (86400000));
                    return (
                      <div key={i} className="p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all overflow-hidden">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xl text-gray-900 line-clamp-2 mb-2">{task.title || task.name}</h4>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                                <FaClock className="w-3.5 h-3.5" />
                                {days}d
                              </span>
                              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <span className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-bold rounded-full whitespace-nowrap flex-shrink-0">
                            {task.status || 'To Do'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[18rem] flex items-center justify-center p-12 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border-2 border-dashed border-emerald-200">
                  <div className="text-center">
                    <FaCalendarAlt className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-emerald-700 mb-2">All Clear! 🎉</h3>
                    <p className="text-emerald-600 font-medium">No upcoming deadlines</p>
                  </div>
                </div>
              )}
            </div>

            {/* Hours Card */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl border border-purple-200/50 shadow-2xl p-8 overflow-hidden">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-purple-200/50">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  Hours Summary <FaClock className="text-purple-500" />
                </h2>
              </div>
              <div className="text-center">
                <div className="mb-12">
                  <div className="inline-flex items-center gap-4 p-8 bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 mx-auto mb-8">
                    <span className="text-6xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-xl">
                      {totalHours}
                    </span>
                    <span className="text-2xl font-bold text-gray-600 uppercase tracking-wider">hours</span>
                  </div>
                  <p className="text-xl text-gray-700 font-semibold">Across {clientTasks.length} tasks</p>
                </div>
                {hasTasks && (
                  <div className="grid grid-cols-2 gap-6 p-8 bg-white/80 backdrop-blur-sm rounded-3xl border border-white shadow-xl">
                    {[
                      { count: clientTasks.filter(t => t.status === 'todo').length, label: 'To Do', color: 'text-amber-600' },
                      { count: clientTasks.filter(t => t.status === 'in_progress').length, label: 'In Progress', color: 'text-blue-600' },
                      { count: clientTasks.filter(t => t.status === 'review').length, label: 'Review', color: 'text-purple-600' },
                      { count: clientTasks.filter(t => t.status === 'done').length, label: 'Done', color: 'text-emerald-600' }
                    ].map((item, i) => (
                      <div key={i} className="text-center p-6 rounded-2xl bg-gradient-to-b from-white/50 hover:from-white transition-all group">
                        <div className={`text-3xl font-black ${item.color} mb-3 group-hover:scale-110 transition-transform`}>
                          {item.count}
                        </div>
                        <div className="text-lg font-bold text-gray-700 uppercase tracking-wide">{item.label}</div>
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
