// import React, { useState, useEffect } from "react";
// import { FaList } from "react-icons/fa";
// import { MdGridView } from "react-icons/md";
// import { useParams } from "react-router-dom";
// import Loading from "../components/Loader";
// import Title from "../components/Title";
// import Button from "../components/Button";
// import { IoMdAdd } from "react-icons/io";
// import Tabs from "../components/Tabs";
// import TaskTitle from "../components/TaskTitle";
// import BoardView from "../components/BoardView";
// import Table from "../components/task/Table";
// import AddTask from "../components/task/AddTask";
// import UpdateTask from "../components/task/UpdateTask";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchTaskss, selectTasks } from "../redux/slices/taskSlice";

// const TABS = [
//   { title: "Board View", icon: <MdGridView /> },
//   { title: "List View", icon: <FaList /> },
// ];

// const TASK_TYPE = {
//   todo: "bg-blue-600",
//   "in progress": "bg-yellow-600",
//   completed: "bg-green-600",
// };

// const Tasks = () => {
//   const params = useParams();
//   const dispatch = useDispatch();

//   useEffect(() => {
//     dispatch(fetchTaskss());
//   }, [dispatch]);

//   const tasks = useSelector(selectTasks);
//   const [selected, setSelected] = useState(0);
//   const [open, setOpen] = useState(false);
//   const [updateOpen, setUpdateOpen] = useState(false);
//   const [selectedTask, setSelectedTask] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [isAdmin, setIsAdmin] = useState(false);
//   const status = params?.status || "";

//   useEffect(() => {
//     const userInfo = localStorage.getItem("userInfo");
//     if (userInfo) {
//       const parsedUserInfo = JSON.parse(userInfo);
//       setIsAdmin(parsedUserInfo.isAdmin === 1);
//     }
//   }, []);

//   return loading ? (
//     <div className="py-10">
//       <Loading />
//     </div>
//   ) : (
//     <div className="w-full">
//       <div className="flex items-center justify-between mb-4">
//         <Title title={status ? `${status} Tasks` : "Tasks"} />

//         {!status && isAdmin && (
//           <Button
//             onClick={() => setOpen(true)}
//             label="Create Task"
//             icon={<IoMdAdd className="text-lg" />}
//             className="flex flex-row-reverse gap-1 items-center bg-blue-600 text-white rounded-md py-2 2xl:py-2.5"
//           />
//         )}
//       </div>

//       <Tabs tabs={TABS} setSelected={setSelected}>
//         {!status && (
//           <div className="w-full flex justify-between gap-4 md:gap-x-12 py-4">
//             <TaskTitle label="To Do" className={TASK_TYPE.todo} />
//             <TaskTitle label="In Progress" className={TASK_TYPE["in progress"]} />
//             <TaskTitle label="Completed" className={TASK_TYPE.completed} />
//           </div>
//         )}

//         {selected !== 1 ? (
//           <BoardView
//             tasks={tasks}
//             setUpdateOpen={setUpdateOpen}
//             setSelectedTask={setSelectedTask}
//           />
//         ) : (
//           <div className="w-full">
//             <Table
//               tasks={tasks}
//               setUpdateOpen={setUpdateOpen}
//               setSelectedTask={setSelectedTask}
//             />
//           </div>
//         )}
//       </Tabs>

//       <AddTask open={open} setOpen={setOpen} />

//       {selectedTask && (
//         <UpdateTask
//           open={updateOpen}
//           setOpen={setUpdateOpen}
//           task={selectedTask}
//         />
//       )}
//     </div>
//   );
// };

// export default Tasks;











import React, { useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, Filter, List, Grid, Clock, Calendar, User } from 'lucide-react';

export default function Tasks() {
  // --- STATIC DATA ---
  const [tasks, setTasks] = useState([
    {
      id: "t1",
      name: "Design Homepage",
      description: "Create responsive homepage wireframes with modern UI/UX patterns",
      projectId: "p1",
      status: "in-progress",
      priority: "high",
      startDate: "2025-01-01",
      dueDate: "2025-02-15",
      progress: 40,
    },
    {
      id: "t2",
      name: "Mobile App Launch",
      description: "Build new mobile app for internal workflow",
      projectId: "p2",
      status: "planning",
      priority: "medium",
      startDate: "2025-02-01",
      dueDate: "2025-04-10",
      progress: 10,
    },
    {
      id: "t3",
      name: "Cloud Migration",
      description: "Shift backend infrastructure to cloud services",
      projectId: "p3",
      status: "on-hold",
      priority: "low",
      startDate: "2024-11-10",
      dueDate: "2025-03-01",
      progress: 20,
    },
  ]);

  const projects = [
    { id: "p1", name: "Website Redesign", color: "#6366F1" },
    { id: "p2", name: "Mobile App", color: "#10B981" },
    { id: "p3", name: "Cloud Migration", color: "#F59E0B" },
  ];

  // VIEW STATE → card or list
  const [view, setView] = useState("card");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterProject, setFilterProject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const statusOptions = ["planning", "in-progress", "completed", "on-hold"];
  const priorityOptions = ["low", "medium", "high"];

  const [activeStatusEdit, setActiveStatusEdit] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    projectId: "",
    status: "planning",
    priority: "medium",
    startDate: "",
    dueDate: "",
    progress: 0,
  });

  // --------------------------- MODAL LOGIC ---------------------------
  const openModal = (task) => {
    if (task) {
      setEditingTask(task);
      setFormData({ ...task });
    } else {
      setEditingTask(null);
      setFormData({
        name: "",
        description: "",
        projectId: projects[0].id,
        status: "planning",
        priority: "medium",
        startDate: "",
        dueDate: "",
        progress: 0,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingTask) {
      setTasks(
        tasks.map((t) =>
          t.id === editingTask.id ? { ...t, ...formData } : t
        )
      );
    } else {
      setTasks([...tasks, { id: Date.now().toString(), ...formData }]);
    }

    closeModal();
  };

  const handleDelete = (id) => {
    if (confirm("Delete this task?")) {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  };

  // --------------------------- FILTERS ---------------------------
  const filteredTasks = tasks.filter((task) => {
    const projectMatch =
      filterProject === "all" || task.projectId === filterProject;
    const statusMatch =
      filterStatus === "all" || task.status === filterStatus;
    return projectMatch && statusMatch;
  });

  const statusColors = {
    planning: "bg-yellow-100 text-yellow-700",
    "in-progress": "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    "on-hold": "bg-red-100 text-red-700",
  };

  const priorityColors = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700",
  };

  const updateStatusInline = (id, newStatus) => {
    setTasks(
      tasks.map((t) =>
        t.id === id ? { ...t, status: newStatus } : t
      )
    );
    setActiveStatusEdit(null);
  };

  // ----------------------------------------------------------------

  return (
    <div className="p-8">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-gray-900 mb-2">Tasks</h1>
          <p className="text-gray-600">Manage and track all your tasks</p>
        </div>


        <div className="flex items-center gap-3">
          {/* VIEW TOGGLE */}
          <button
            onClick={() => setView("list")}
            className={`p-2 rounded-lg border ${view === "list" ? "bg-blue-100 border-blue-400" : "bg-white"
              }`}
          >
            <List className="w-5 h-5 text-blue-600" />
          </button>

          <button
            onClick={() => setView("card")}
            className={`p-2 rounded-lg border ${view === "card" ? "bg-blue-100 border-blue-400" : "bg-white"
              }`}
          >
            <Grid className="w-5 h-5 text-blue-600" />
          </button>

          {/* ADD TASK BUTTON */}
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Task
          </button>
        </div>
      </div>
      {/* STATUS SUMMARY */}
      <div className="flex flex-wrap gap-3 mb-6">

        <div className="px-4 py-2 rounded-lg bg-yellow-100 text-yellow-700 font-semibold shadow-sm">
          Planning : {tasks.filter(t => t.status === "planning").length}
        </div>

        <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold shadow-sm">
          In-Progress : {tasks.filter(t => t.status === "in-progress").length}
        </div>

        <div className="px-4 py-2 rounded-lg bg-green-100 text-green-700 font-semibold shadow-sm">
          Completed : {tasks.filter(t => t.status === "completed").length}
        </div>

        <div className="px-4 py-2 rounded-lg bg-red-100 text-red-700 font-semibold shadow-sm">
          On-Hold : {tasks.filter(t => t.status === "on-hold").length}
        </div>

      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl border p-4 mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">Filters:</span>
        </div>

        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* --------------------------- LIST VIEW --------------------------- */}
      {view === "list" && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full table-auto">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3 text-left">Task</th>
                <th className="p-3 text-left">Project</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Priority</th>
                <th className="p-3 text-left">Duration</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTasks.map((task) => {
                const proj = projects.find((p) => p.id === task.projectId);

                return (
                  <tr key={task.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium">{task.name}</div>
                      <div className="text-sm text-gray-500">{task.description}</div>
                    </td>

                    <td className="p-3">
                      <span
                        className="px-3 py-1 rounded-full text-white text-sm"
                        style={{ background: proj.color }}
                      >
                        {proj.name}
                      </span>
                    </td>

                    <td className="p-3">
                      {activeStatusEdit === task.id ? (
                        <select
                          value={task.status}
                          onChange={(e) =>
                            updateStatusInline(task.id, e.target.value)
                          }
                          className="border rounded-lg px-2 py-1"
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          onClick={() => setActiveStatusEdit(task.id)}
                          className={`px-3 py-1 rounded-full cursor-pointer text-sm ${statusColors[task.status]}`}
                        >
                          {task.status}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-sm ${priorityColors[task.priority]}`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </td>

                    <td className="p-3">
                      {task.startDate} → {task.dueDate}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openModal(task)}
                          className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* --------------------------- CARD VIEW --------------------------- */}
      {view === "card" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTasks.map((task) => {
            const proj = projects.find((p) => p.id === task.projectId);

            return (
              <div key={task.id} className="bg-white border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg" style={{ background: `${proj.color}20` }}>
                      <AlertCircle className="w-5 h-5" style={{ color: proj.color }} />
                    </div>

                    <div>
                      <h3 className="text-gray-900 font-medium">{task.name}</h3>
                      <p className="text-gray-600 text-sm">{task.description}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => openModal(task)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button onClick={() => handleDelete(task.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Project Pill */}
                <span
                  className="inline-block px-3 py-1 rounded-full text-white mb-3 text-sm"
                  style={{ background: proj.color }}
                >
                  {proj.name}
                </span>

                {/* Inline Status Update */}
                <div className="mb-4">
                  <span className="text-gray-600 text-sm">Status: </span>
                  {activeStatusEdit === task.id ? (
                    <select
                      value={task.status}
                      onChange={(e) =>
                        updateStatusInline(task.id, e.target.value)
                      }
                      className="border rounded-lg px-2 py-1 ml-2"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`ml-2 px-3 py-1 rounded-full cursor-pointer text-sm ${statusColors[task.status]}`}
                      onClick={() => setActiveStatusEdit(task.id)}
                    >
                      {task.status}
                    </span>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-gray-600 mb-1 text-sm">
                    <span>Progress</span>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="bg-gray-200 h-2 rounded-full">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="text-xs text-gray-500 mb-3">
                  {task.startDate} → {task.dueDate}
                </div>

                {/* Priority */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-xs">Priority:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${priorityColors[task.priority]}`}>
                    {task.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --------------------------- MODAL (same as Projects) --------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-gray-900 mb-4 font-semibold">
              {editingTask ? "Edit Task" : "Add Task"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Task Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Project</label>
                    <select
                      value={formData.projectId}
                      onChange={(e) =>
                        setFormData({ ...formData, projectId: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {priorityOptions.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 font-medium">
                    Progress ({formData.progress}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        progress: parseInt(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg slider"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingTask ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
