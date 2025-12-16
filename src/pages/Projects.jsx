import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, FolderKanban, Filter, List, Grid } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { 
  fetchProjects, 
  createProject, 
  updateProject, 
  deleteProject,
  selectProjects,
  selectProjectStatus,
  selectProjectError
} from "../redux/slices/projectSlice";
import { fetchDepartments, selectDepartments } from "../redux/slices/departmentSlice";
import { fetchClients, selectClients } from "../redux/slices/clientSlice";
import { fetchUsers, selectUsers } from "../redux/slices/userSlice";
import { toast } from "sonner";

export default function Projects() {
  const dispatch = useDispatch();
  
  // Redux state
  const projects = useSelector(selectProjects) || [];
  const status = useSelector(selectProjectStatus);
  const error = useSelector(selectProjectError);
  const departments = useSelector(selectDepartments) || [];
  const clients = useSelector(selectClients) || [];
  const users = useSelector(selectUsers) || [];

  // Local state
  const isLoading = status === 'loading';

  const statusOptions = ["Planning", "Active", "On Hold", "Completed", "Cancelled"];
  const statusColors = {
    "Planning": "bg-yellow-100 text-yellow-700",
    "Active": "bg-blue-100 text-blue-700",
    "Completed": "bg-green-100 text-green-700",
    "On Hold": "bg-red-100 text-red-700",
    "Cancelled": "bg-gray-100 text-gray-700",
  };

  const priorityOptions = ["Low", "Medium", "High"];

  // View and modal state
  const [view, setView] = useState("card");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeStatusEdit, setActiveStatusEdit] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    clientId: "",
    departmentIds: [],
    status: "Planning",
    priority: "High",
    start_date: "",
    end_date: "",
    budget: "",
    project_manager_id: "",
  });

  // Helper function to calculate total duration in hours (8 hours per working day, excluding weekends)
  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let workingDays = 0;
    const current = new Date(start);
    
    // Iterate through each day and count working days (Mon-Fri)
    while (current <= end) {
      const dayOfWeek = current.getDay();
      // 0 = Sunday, 6 = Saturday, so exclude these
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return workingDays * 8; // 8 hours per working day
  };

  const totalDuration = calculateDuration(formData.start_date, formData.end_date);

  // Helper function to format date from ISO string
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Helper function to get client name by ID
  const getClientName = (clientId) => {
    if (!clientId) return "-";
    const client = clients.find((c) => c.id === clientId || c.public_id === clientId);
    return client?.name || "-";
  };

  // Helper function to get manager name by ID or from project_manager object
  const getManagerName = (managerId, projectManager) => {
    // Check if project_manager object exists with name
    if (projectManager?.name) {
      return projectManager.name;
    }
    // Fallback to lookup from users array
    if (!managerId) return "-";
    const manager = users.find((u) => u.id === managerId);
    return manager?.name || "-";
  };

  // Get managers array (filter users with Manager role)
  const managers = users.filter((u) => u.role === "Manager");

  // Fetch projects, departments, clients, and users on mount
  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchDepartments());
    dispatch(fetchClients());
    dispatch(fetchUsers());
  }, [dispatch]);

  // Modal handlers
  const openModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name || "",
        description: project.description || "",
        clientId: project.client_id || project.clientId || "",
        departmentIds: (project.departments && Array.isArray(project.departments)) 
          ? project.departments.map((d) => d.id || d.public_id || d._id) 
          : project.departmentIds || [],
        status: project.status || "Planning",
        priority: project.priority || "High",
        start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : "",
        end_date: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : "",
        budget: project.budget || "",
        project_manager_id: project.project_manager_id || project.projectManagerId || "",
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: "",
        description: "",
        clientId: "",
        departmentIds: [],
        status: "Planning",
        priority: "High",
        start_date: "",
        end_date: "",
        budget: "",
        project_manager_id: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    setActiveStatusEdit(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate clientId and departmentIds are selected
      if (!formData.clientId) {
        toast.error("Please select a client");
        return;
      }
      if (!formData.departmentIds || formData.departmentIds.length === 0) {
        toast.error("Please select at least one department");
        return;
      }
      if (!formData.start_date || !formData.end_date) {
        toast.error("Please select both start and end dates");
        return;
      }

      // Prepare data with manager name if manager is selected
      const projectData = { ...formData };
      if (formData.project_manager_id) {
        const selectedManager = managers.find((m) => m.id === formData.project_manager_id);
        if (selectedManager) {
          projectData.project_manager_name = selectedManager.name;
        }
      }

      if (editingProject) {
        const projectId = editingProject.id || editingProject._id;
        await dispatch(updateProject({ projectId, data: projectData })).unwrap();
        toast.success("Project updated successfully");
      } else {
        await dispatch(createProject(projectData)).unwrap();
        toast.success("Project created successfully");
      }
      closeModal();
      await dispatch(fetchProjects()).unwrap();
    } catch (err) {
      toast.error(err?.message || "Operation failed");
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      const projectId = project.id || project._id;
      await dispatch(deleteProject(projectId)).unwrap();
      toast.success("Project deleted");
      await dispatch(fetchProjects()).unwrap();
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  };

  const updateStatusInline = async (project, newStatus) => {
    if (!newStatus) return;
    try {
      const projectId = project.id || project._id;
      await dispatch(updateProject({ projectId, data: { status: newStatus } })).unwrap();
      setActiveStatusEdit(null);
      await dispatch(fetchProjects()).unwrap();
    } catch (err) {
      toast.error(err?.message || "Status update failed");
    }
  };

  // Filters
  const filteredProjects = projects.filter((project) => {
    // Get department IDs from either departments array or departmentIds field
    let projectDepts = [];
    if (project.departments && Array.isArray(project.departments)) {
      projectDepts = project.departments.map((d) => d.id || d.public_id || d._id);
    } else if (project.departmentIds) {
      projectDepts = project.departmentIds;
    }
    
    const deptMatch = filterDept === "all" || projectDepts.includes(filterDept);
    const statusMatch = filterStatus === "all" || project.status === filterStatus;
    return deptMatch && statusMatch;
  });

  // Helper to get department name from departments array
  const getDepartmentName = (departmentsArray) => {
    if (!departmentsArray || !Array.isArray(departmentsArray) || departmentsArray.length === 0) return "-";
    return departmentsArray.map((d) => d.name).join(", ");
  };

  // Loading and error states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold text-red-800 mb-2">Failed to load projects</h3>
        <p className="text-red-600 mb-6">{error}</p>
        <button
          onClick={() => dispatch(fetchProjects())}
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }
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
          Planning: {projects.filter(p => p.status === "Planning").length}
        </div>

        <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold shadow-sm">
          Active: {projects.filter(p => p.status === "Active").length}
        </div>

        <div className="px-4 py-2 rounded-lg bg-green-100 text-green-700 font-semibold shadow-sm">
          Completed: {projects.filter(p => p.status === "Completed").length}
        </div>

        <div className="px-4 py-2 rounded-lg bg-red-100 text-red-700 font-semibold shadow-sm">
          On Hold: {projects.filter(p => p.status === "On Hold").length}
        </div>

        <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold shadow-sm">
          Cancelled: {projects.filter(p => p.status === "Cancelled").length}
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
                <th className="p-3 text-left">Client</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Duration</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProjects.map((project) => (
                <tr key={project.id || project._id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{project.name}</td>
                  <td className="p-3 text-sm">{getDepartmentName(project.departments)}</td>
                  <td className="p-3 text-sm text-gray-600">{getClientName(project.client_id)}</td>
                  <td className="p-3">
                    {activeStatusEdit === (project.id || project._id) ? (
                      <select
                        value={project.status}
                        onChange={(e) => updateStatusInline(project, e.target.value)}
                        className="border rounded-lg px-2 py-1 text-sm"
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span
                        onClick={() => setActiveStatusEdit(project.id || project._id)}
                        className={`px-3 py-1 rounded-full cursor-pointer text-sm font-medium ${statusColors[project.status]}`}
                      >
                        {project.status}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-sm text-gray-600">{formatDate(project.start_date)} → {formatDate(project.end_date)}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openModal(project)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(project)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CARD VIEW */}
      {view === "card" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No projects found</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div key={project.id || project._id} className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description || "No description"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(project)}
                      className="p-2 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">Client</span>
                    <span className="text-sm font-medium text-gray-900">{getClientName(project.client_id)}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">Manager</span>
                    <span className="text-sm font-medium text-gray-900">{getManagerName(project.project_manager_id, project.project_manager)}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">Departments</span>
                    <div className="flex flex-wrap gap-1">
                      {project.departments && project.departments.length > 0 ? (
                        project.departments.map((d) => (
                          <span key={d.id || d._id} className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            {d.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">No departments</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">Budget</span>
                    <span className="text-sm font-medium text-gray-900">
                      {project.budget ? `$${parseFloat(project.budget).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600 text-sm font-medium">Status</span>
                    {activeStatusEdit === (project.id || project._id) ? (
                      <select
                        value={project.status}
                        onChange={(e) => updateStatusInline(project, e.target.value)}
                        className="border rounded-lg px-2 py-1 text-sm"
                      >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`ml-2 px-3 py-1 rounded-full cursor-pointer text-sm ${statusColors[project.status]}`}
                      onClick={() => setActiveStatusEdit(project.id || project._id)}
                    >
                      {project.status}
                    </span>
                  )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                    <span>📅 {formatDate(project.start_date)}</span>
                    <span>→</span>
                    <span>{formatDate(project.end_date)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-700 mt-2 pt-2 border-t">
                    <span className="font-semibold">Priority: <span className="font-bold text-sm">{project.priority || "-"}</span></span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {editingProject ? "Edit Project" : "Add Project"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Project Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select a Client --</option>
                    {clients.map((c) => (
                      <option key={c.public_id || c._id || c.id} value={c.public_id || c._id || c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Project Manager
                  </label>
                  <select
                    value={formData.project_manager_id}
                    onChange={(e) => setFormData({ ...formData, project_manager_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select a Manager --</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Optional field</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Departments <span className="text-red-500">*</span>
                    </label>
                    <select
                      multiple
                      required
                      value={formData.departmentIds || []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setFormData({ ...formData, departmentIds: selected });
                      }}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      size={Math.min(5, departments.length)}
                    >
                      {departments.map((d) => (
                        <option key={d.public_id || d._id || d.id} value={d.public_id || d._id || d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple departments</p>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Start Date</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">End Date</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Budget(optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Project budget"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Total Duration</label>
                    <div className="w-full px-4 py-2 border rounded-lg bg-gray-50 flex items-center">
                      <span className="text-gray-700 font-medium">{totalDuration} hours</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Auto-calculated from dates</p>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {priorityOptions.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
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
