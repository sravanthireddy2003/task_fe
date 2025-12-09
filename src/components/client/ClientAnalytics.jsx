import React from "react";
import { FaTasks, FaProjectDiagram, FaClock, FaCalendarAlt } from "react-icons/fa";
import { Chart } from "../Chart";

const ClientAnalytics = ({ client, tasks }) => {
  const clientTasks = tasks.filter((task) => task.clientId === client?.id);

  // Task Status Distribution
  const taskStatusData = [
    { name: "To Do", value: clientTasks.filter(t => t.status === "todo" || t.status === "To Do").length, color: "#fbbf24" },
    { name: "In Progress", value: clientTasks.filter(t => t.status === "in_progress" || t.status === "In Progress").length, color: "#3b82f6" },
    { name: "Review", value: clientTasks.filter(t => t.status === "review" || t.status === "Review").length, color: "#8b5cf6" },
    { name: "Done", value: clientTasks.filter(t => t.status === "done" || t.status === "Done").length, color: "#10b981" },
  ];

  // Projects associated with this client
  const projects = [...new Set(clientTasks.map(task => task.projectName || task.project).filter(Boolean))];

  // Hours logged (mock data - in real app, this would come from API)
  const totalHours = clientTasks.reduce((sum, task) => sum + (task.hoursLogged || Math.floor(Math.random() * 20)), 0);

  // Upcoming deadlines
  const upcomingDeadlines = clientTasks
    .filter(task => task.dueDate && new Date(task.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const stats = [
    {
      title: "Total Tasks",
      value: clientTasks.length,
      icon: <FaTasks className="text-blue-600" size={24} />,
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Projects",
      value: projects.length,
      icon: <FaProjectDiagram className="text-green-600" size={24} />,
      bgColor: "bg-green-100",
    },
    {
      title: "Hours Logged",
      value: `${totalHours}h`,
      icon: <FaClock className="text-purple-600" size={24} />,
      bgColor: "bg-purple-100",
    },
    {
      title: "Upcoming Deadlines",
      value: upcomingDeadlines.length,
      icon: <FaCalendarAlt className="text-red-600" size={24} />,
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="w-full space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Client Analytics</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} p-4 rounded-lg border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Task Status Distribution</h3>
          {taskStatusData.some(d => d.value > 0) ? (
            <Chart
              type="pie"
              data={taskStatusData}
              height={300}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <FaTasks size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No tasks to display</p>
              </div>
            </div>
          )}
        </div>

        {/* Project List */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Associated Projects</h3>
          {projects.length > 0 ? (
            <div className="space-y-3">
              {projects.map((project, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FaProjectDiagram className="text-green-600" size={16} />
                    <span className="font-medium text-gray-900">{project}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {clientTasks.filter(t => (t.projectName || t.project) === project).length} tasks
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <FaProjectDiagram size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No projects associated</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Deadlines</h3>
        {upcomingDeadlines.length > 0 ? (
          <div className="space-y-3">
            {upcomingDeadlines.map((task, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FaCalendarAlt className="text-red-500" size={16} />
                  <div>
                    <p className="font-medium text-gray-900">{task.title || task.name}</p>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  task.status === 'todo' || task.status === 'To Do' ? 'bg-yellow-100 text-yellow-800' :
                  task.status === 'in_progress' || task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                  task.status === 'review' || task.status === 'Review' ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {task.status || 'Unknown'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <FaCalendarAlt size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No upcoming deadlines</p>
            </div>
          </div>
        )}
      </div>

      {/* Hours Logged Chart (Mock) */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Hours Logged This Month</h3>
        <div className="text-center py-8">
          <FaClock size={48} className="mx-auto mb-4 text-purple-300" />
          <p className="text-3xl font-bold text-gray-900">{totalHours}h</p>
          <p className="text-gray-600">Total hours logged across all tasks</p>
        </div>
      </div>
    </div>
  );
};

export default ClientAnalytics;