import { useState } from "react";
import { Plus, Edit2, Trash2, FolderKanban, Filter, List, Grid } from "lucide-react";

export default function Projects() {
  // --- STATIC DATA ---
  const [projects, setProjects] = useState([
    {
      id: "1",
      name: "Website Redesign",
      description: "Improve UI/UX and modernize the design.",
      departmentId: "d1",
      status: "in-progress",
      startDate: "2025-01-01",
      endDate: "2025-02-15",
      progress: 40,
    },
    {
      id: "2",
      name: "Mobile App Launch",
      description: "Build new mobile app for internal workflow.",
      departmentId: "d2",
      status: "planning",
      startDate: "2025-02-01",
      endDate: "2025-04-10",
      progress: 10,
    },
    {
      id: "3",
      name: "Cloud Migration",
      description: "Shift backend infrastructure to cloud services.",
      departmentId: "d3",
      status: "on-hold",
      startDate: "2024-11-10",
      endDate: "2025-03-01",
      progress: 20,
    },
  ]);

  const departments = [
    { id: "d1", name: "Design", color: "#6366F1" },
    { id: "d2", name: "Development", color: "#10B981" },
    { id: "d3", name: "IT Operations", color: "#F59E0B" },
  ];

  const statusOptions = ["planning", "in-progress", "completed", "on-hold"];
  const statusColors = {
    planning: "bg-yellow-100 text-yellow-700",
    "in-progress": "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    "on-hold": "bg-red-100 text-red-700",
  };

  // VIEW STATE → card or list
  const [view, setView] = useState("card");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeStatusEdit, setActiveStatusEdit] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    departmentId: departments[0].id,
    status: "planning",
    startDate: "",
    endDate: "",
    progress: 0,
  });

  // --------------------------- MODAL LOGIC ---------------------------
  const openModal = (project) => {
    if (project) {
      setEditingProject(project);
      setFormData({ ...project });
    } else {
      setEditingProject(null);
      setFormData({
        name: "",
        description: "",
        departmentId: departments[0].id,
        status: "planning",
        startDate: "",
        endDate: "",
        progress: 0,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    setActiveStatusEdit(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProject) {
      setProjects(
        projects.map((p) =>
          p.id === editingProject.id ? { ...p, ...formData } : p
        )
      );
    } else {
      setProjects([...projects, { id: Date.now().toString(), ...formData }]);
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (confirm("Delete this project?")) {
      setProjects(projects.filter((p) => p.id !== id));
    }
  };

  const updateStatusInline = (id, newStatus) => {
    if (newStatus && newStatus !== "") {
      setProjects(
        projects.map((p) =>
          p.id === id ? { ...p, status: newStatus } : p
        )
      );
    }
    setActiveStatusEdit(null);
  };

  // --------------------------- FILTERS ---------------------------
  const filteredProjects = projects.filter((project) => {
    const deptMatch =
      filterDept === "all" || project.departmentId === filterDept;
    const statusMatch =
      filterStatus === "all" || project.status === filterStatus;
    return deptMatch && statusMatch;
  });

  // Count projects by status
  const statusCounts = statusOptions.reduce((acc, status) => {
    acc[status] = projects.filter((p) => p.status === status).length;
    return acc;
  }, {});

  // ----------------------------------------------------------------
  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-gray-900 mb-2">Projects</h1>
          <p className="text-gray-600">Manage and track all your projects</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("list")}
            className={`p-2 rounded-lg border ${view === "list" ? "bg-blue-100 border-blue-400" : "bg-white"}`}
          >
            <List className="w-5 h-5 text-blue-600" />
          </button>
          <button
            onClick={() => setView("card")}
            className={`p-2 rounded-lg border ${view === "card" ? "bg-blue-100 border-blue-400" : "bg-white"}`}
          >
            <Grid className="w-5 h-5 text-blue-600" />
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Project
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="flex flex-wrap gap-3 mb-6">

        <div className="px-4 py-2 rounded-lg bg-yellow-100 text-yellow-700 font-semibold shadow-sm">
          Planning : {projects.filter(p => p.status === "planning").length}
        </div>

        <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold shadow-sm">
          In-Progress : {projects.filter(p => p.status === "in-progress").length}
        </div>

        <div className="px-4 py-2 rounded-lg bg-green-100 text-green-700 font-semibold shadow-sm">
          Completed : {projects.filter(p => p.status === "completed").length}
        </div>

        <div className="px-4 py-2 rounded-lg bg-red-100 text-red-700 font-semibold shadow-sm">
          On-Hold : {projects.filter(p => p.status === "on-hold").length}
        </div>

      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl border p-4 mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">Filters:</span>
        </div>

        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
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
                <th className="p-3 text-left">Project</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Duration</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProjects.map((project) => {
                const dept = departments.find((d) => d.id === project.departmentId);
                return (
                  <tr key={project.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{project.name}</td>

                    <td className="p-3">
                      <span className="px-3 py-1 rounded-full text-white"
                        style={{ background: dept.color }}>
                        {dept.name}
                      </span>
                    </td>

                    <td className="p-3">
                      {activeStatusEdit === project.id ? (
                        <select
                          value={project.status}
                          onChange={(e) =>
                            updateStatusInline(project.id, e.target.value)
                          }
                          className="border rounded-lg px-2 py-1"
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          onClick={() => setActiveStatusEdit(project.id)}
                          className={`px-3 py-1 rounded-full cursor-pointer ${statusColors[project.status]}`}
                        >
                          {project.status}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      {project.startDate} → {project.endDate}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openModal(project)}
                          className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
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
          {filteredProjects.map((project) => {
            const dept = departments.find((d) => d.id === project.departmentId);

            return (
              <div key={project.id} className="bg-white border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg" style={{ background: `${dept.color}20` }}>
                      <FolderKanban className="w-5 h-5" style={{ color: dept.color }} />
                    </div>
                    <div>
                      <h3 className="text-gray-900">{project.name}</h3>
                      <p className="text-gray-600">{project.description}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => openModal(project)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button onClick={() => handleDelete(project.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <span className="inline-block px-3 py-1 rounded-full text-white mb-3"
                  style={{ background: dept.color }}>
                  {dept.name}
                </span>

                <div className="mb-4">
                  <span className="text-gray-600">Status: </span>
                  {activeStatusEdit === project.id ? (
                    <select
                      value={project.status}
                      onChange={(e) =>
                        updateStatusInline(project.id, e.target.value)
                      }
                      className="border rounded-lg px-2 py-1"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`ml-2 px-3 py-1 rounded-full cursor-pointer ${statusColors[project.status]}`}
                      onClick={() => setActiveStatusEdit(project.id)}
                    >
                      {project.status}
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="bg-gray-200 h-2 rounded-full">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --------------------------- MODAL --------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-gray-900 mb-4">
              {editingProject ? "Edit Project" : "Add Project"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg resize-none"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Department</label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) =>
                        setFormData({ ...formData, departmentId: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
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
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingProject ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
