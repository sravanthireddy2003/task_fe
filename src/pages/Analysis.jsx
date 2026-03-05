import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const Analysis = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [timeFrame, setTimeFrame] = useState('monthly');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const fetchWithTenant = (await import('../utils/fetchWithTenant')).default;
        const response = await fetchWithTenant(`/api/tasks/gettasks`);
        if (!response.ok) throw new Error("Failed to fetch tasks");
        const data = await response.json();
        setTasks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const pieData = tasks.map(task => ({ name: task.title, value: task.assigned_users?.length || 0 }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const projectData = tasks.map((task) => {
    const createdAt = new Date(task.createdAt);
    const deadline = new Date(task.taskDate);
    const now = new Date();

    let completed = 0, inProgress = 0, onHold = 0;

    if (task.stage === "COMPLETED") completed = 100;
    else if (task.stage === "IN PROGRESS") {
      const totalDuration = deadline - createdAt;
      const elapsedTime = now - createdAt;
      completed = Math.min((elapsedTime / totalDuration) * 100, 100);
      inProgress = 100 - completed;
    } else if (task.stage === "TODO") onHold = 100;

    return {
      name: task.title.slice(0, 12),
      completed: completed.toFixed(2),
      inProgress: inProgress.toFixed(2),
      onHold: onHold.toFixed(2),
    };
  });

  const teamData = [
    { name: 'Team Alpha', productivity: 92, quality: 88, onTime: 95 },
    { name: 'Team Beta', productivity: 85, quality: 90, onTime: 82 },
    { name: 'Team Gamma', productivity: 78, quality: 95, onTime: 88 },
    { name: 'Team Delta', productivity: 90, quality: 82, onTime: 90 },
  ];

  const teamPerformanceTrend = [
    { month: 'Jan', Alpha: 78, Beta: 65, Gamma: 82, Delta: 70 },
    { month: 'Feb', Alpha: 82, Beta: 72, Gamma: 80, Delta: 75 },
    { month: 'Mar', Alpha: 85, Beta: 78, Gamma: 79, Delta: 82 },
    { month: 'Apr', Alpha: 87, Beta: 82, Gamma: 83, Delta: 85 },
    { month: 'May', Alpha: 92, Beta: 85, Gamma: 78, Delta: 90 },
  ];

  const data = [
    { name: "To Do", count: tasks.filter((task) => task.stage === "TODO").length, color: "#be185d" },
    { name: "In Progress", count: tasks.filter((task) => task.stage === "IN PROGRESS").length, color: "#f59e0b" },
    { name: "Completed", count: tasks.filter((task) => task.stage === "COMPLETED").length, color: "#0f766e" }
  ];

  if (loading) return <div className="p-6 text-center text-gray-500">Loading analytics...</div>;
  if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Performance Analytics Dashboard</h1>
        <select
          value={timeFrame}
          onChange={(e) => setTimeFrame(e.target.value)}
          className="px-4 py-2 border rounded-md bg-white shadow-sm focus:ring-1 focus:ring-blue-500"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex">
          <button
            className={`px-4 py-2 font-medium transition ${activeTab === 'projects' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
            onClick={() => setActiveTab('projects')}
          >
            Project Analysis
          </button>
          <button
            className={`px-4 py-2 font-medium transition ${activeTab === 'teams' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
            onClick={() => setActiveTab('teams')}
          >
            Team Analysis
          </button>
        </div>
      </div>

      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Project Status Overview */}
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Project Status Overview</h2>
            <p className="text-gray-500 mb-4">Status breakdown by project</p>
            <div className="overflow-y-auto max-h-96">
              <ResponsiveContainer width="100%" height={projectData.length * 50}>
                <BarChart data={projectData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" stackId="a" fill="#4CAF50" />
                  <Bar dataKey="inProgress" stackId="a" fill="#2196F3" />
                  <Bar dataKey="onHold" stackId="a" fill="#FFC107" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Task Status Overview */}
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Task Status Overview</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data} layout="vertical" margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count">
                  {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Resource Allocation */}
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition md:col-span-2">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Resource Allocation</h2>
            <p className="text-gray-500 mb-4">Distribution across projects</p>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}

      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Team Performance Metrics */}
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Team Performance Metrics</h2>
            <p className="text-gray-500 mb-4">Key performance indicators by team</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="productivity" fill="#8884d8" name="Productivity" />
                <Bar dataKey="quality" fill="#82ca9d" name="Quality" />
                <Bar dataKey="onTime" fill="#ffc658" name="On-Time Delivery" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Team Performance Trend */}
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Team Performance Trend</h2>
            <p className="text-gray-500 mb-4">Monthly performance comparison</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamPerformanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Alpha" fill="#8884d8" />
                <Bar dataKey="Beta" fill="#82ca9d" />
                <Bar dataKey="Gamma" fill="#ffc658" />
                <Bar dataKey="Delta" fill="#ff8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}

    </div>
  );
};

export default Analysis;
