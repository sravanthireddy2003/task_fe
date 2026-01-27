import { useState, useEffect } from "react";
import * as Icons from "../icons";
import ViewToggle from "../components/ViewToggle";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectsStats,
  getProjectSummary,
  selectProjects,
  selectProjectStatus,
  selectProjectError,
  selectProjectStats,
  selectProjectSummary
} from "../redux/slices/projectSlice";
import { fetchDepartments, selectDepartments } from "../redux/slices/departmentSlice";
import { fetchClients, selectClients } from "../redux/slices/clientSlice";
import { fetchUsers, selectUsers } from "../redux/slices/userSlice";
import { toast } from "sonner";

const {
  Plus,
  Edit3,
  Edit2,
  Trash2,
  FolderKanban,
  Filter,
  List,
  Grid,
  X,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  PauseCircle,
  BarChart3,
  Activity,
  User,
  CalendarDays,
  FileText,
} = Icons;
export default function Projects() {
  const dispatch = useDispatch();

  // Redux state
  const projects = useSelector(selectProjects) || [];
  const status = useSelector(selectProjectStatus);
  const error = useSelector(selectProjectError);
  const projectStats = useSelector(selectProjectStats);
  const projectSummary = useSelector(selectProjectSummary);
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
  const [view, setView] = useState("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeStatusEdit, setActiveStatusEdit] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedSummaryProject, setSelectedSummaryProject] = useState(null);

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
    // clientId may be a public_id or a client object
    if (typeof clientId === 'object') return clientId.name || '-';
    const client = clients.find((c) => (c.public_id || c.id || c._id) === clientId) ||
      // also check project-level client objects
      clients.find((c) => c.name === clientId);
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
    const manager = users.find((u) => (u.public_id || u.id || u._id) === managerId);
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
    dispatch(getProjectsStats());
  }, [dispatch]);

  // Modal handlers
  const openModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name || "",
        description: project.description || "",
        clientId: project.client?.public_id || project.client_id || project.clientId || "",
        departmentIds: (project.departments && Array.isArray(project.departments))
          ? project.departments.map((d) => d.public_id || d.id || d._id)
          : project.departmentIds || [],
        status: project.status || "Planning",
        priority: project.priority || "High",
        start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : "",
        end_date: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : "",
        budget: project.budget || "",
        project_manager_id: project.project_manager?.public_id || project.project_manager_id || project.projectManagerId || "",
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

      // Map local form fields to API payload (Postman collection format)
      const payload = {
        projectName: formData.name,
        clientPublicId: formData.clientId,
        department_ids: formData.departmentIds,
        projectManagerPublicId: formData.project_manager_id || null,
        project_manager_id: formData.project_manager_id || null,
        startDate: formData.start_date,
        endDate: formData.end_date,
        priority: formData.priority,
        description: formData.description,
        budget: formData.budget || null,
      };

      // include manager name if we can resolve it (optional)
      if (formData.project_manager_id) {
        const selectedManager = managers.find((m) => (m.public_id || m.id) === formData.project_manager_id);
        if (selectedManager) payload.projectManagerName = selectedManager.name;
      }

      if (editingProject) {
        const projectId = editingProject.public_id || editingProject.id || editingProject._id;
        await dispatch(updateProject({ projectId, data: payload })).unwrap();
        toast.success("Project updated successfully");
      } else {
        await dispatch(createProject(payload)).unwrap();
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
      const projectId = project.public_id || project.id || project._id;
      await dispatch(deleteProject(projectId)).unwrap();
      toast.success("Project deleted");
      await dispatch(fetchProjects()).unwrap();
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  };

  const handleViewSummary = async (project) => {
    try {
      const projectId = project.public_id || project.id || project._id;
      await dispatch(getProjectSummary(projectId)).unwrap();
      setSelectedSummaryProject(project);
      setShowSummaryModal(true);
    } catch (err) {
      console.error('Summary error:', err);
      toast.error(err?.message || 'Failed to load project summary');
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
          <ViewToggle
            mode={view === "list" ? "list" : "grid"}
            onChange={(mode) => setView(mode === "list" ? "list" : "card")}
          />
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="tm-icon" />
            Add Project
          </button>
        </div>
      </div>

      {/* PROJECT STATS DASHBOARD */}
      {projectStats && (
        <div className="tm-card-shell mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{projectStats.projects?.total || 0}</div>
              <div className="text-sm text-gray-600">Total Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{projectStats.tasks?.total || 0}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{projectStats.tasks?.totalHours || 0}h</div>
              <div className="text-sm text-gray-600">Total Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{projectStats.subtasks?.total || 0}</div>
              <div className="text-sm text-gray-600">Total Subtasks</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">{projectStats.projects?.byStatus?.Planning || 0}</div>
              <div className="text-sm text-gray-600">Planning</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">{projectStats.projects?.byStatus?.Active || 0}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
          </div>

          {/* Tasks by Stage Breakdown */}
          <div className="mt-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Tasks by Stage</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(projectStats.tasks?.byStage || {}).map(([stage, count]) => (
                <div key={stage} className="px-3 py-2 bg-gray-100 rounded-lg">
                  <div className="text-sm font-medium text-gray-900">{stage}: {count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                  <td className="p-3 text-sm text-gray-600">{getClientName(project.client || project.client_id)}</td>
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
                        onClick={() => handleViewSummary(project)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                        title="View Summary"
                      >
                        📊
                      </button>
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
                        <Trash2 className="tm-icon" />
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
                      onClick={() => handleViewSummary(project)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="View Summary"
                    >
                      📊
                    </button>
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
                    <span className="text-sm font-medium text-gray-900">{getClientName(project.client || project.client_id)}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">Manager</span>
                    <span className="text-sm font-medium text-gray-900">{getManagerName(project.project_manager_id, project.project_manager)}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">Departments</span>
                    <div className="flex flex-wrap gap-1">
                      {project.departments && project.departments.length > 0 ? (
                        project.departments.map((d, index) => (
                          <span
                            key={d.public_id || d.id || d._id || index}
                            className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                          >
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
                      <option key={m.public_id || m.id || m._id} value={m.public_id || m.id || m._id}>
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

      {/* FULLY RESPONSIVE COMPACT PROJECT SUMMARY MODAL */}
      {showSummaryModal && selectedSummaryProject && projectSummary && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white shadow-xl rounded-lg max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-100">
            {/* RESPONSIVE HEADER */}
            <div className="bg-gray-800 px-3 sm:px-4 py-2.5 sm:py-3 text-white border-b border-gray-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-bold truncate">{selectedSummaryProject.name}</h2>
                    <p className="text-blue-50 text-xs hidden sm:block">{selectedSummaryProject.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowSummaryModal(false); setSelectedSummaryProject(null); }}
                  className="p-1 sm:p-1.5 hover:bg-white/20 rounded-md transition-all ml-2 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-90px)] p-3 sm:p-4">
              {/* RESPONSIVE PROJECT INFO */}
              <div className="bg-gray-25 border border-gray-100 rounded-md p-3 sm:p-4 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-gray-500 font-medium text-xs sm:text-sm">ASSIGNED</div>
                      <div className="font-semibold text-gray-800 truncate">John C.</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <div className="text-gray-500 font-medium text-xs sm:text-sm">STATUS</div>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold inline-flex items-center gap-1 ${projectSummary.project?.status === 'Completed' ? 'bg-green-50 text-green-700 border border-green-100' :
                          projectSummary.project?.status === 'Active' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            'bg-yellow-50 text-yellow-700 border border-yellow-100'
                        }`}>
                        {projectSummary.project?.status || selectedSummaryProject.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-xs sm:text-sm lg:col-span-1">
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 line-clamp-2 text-xs sm:text-sm">{projectSummary.project?.description || selectedSummaryProject.description}</span>
                  </div>
                </div>

                {/* RESPONSIVE PROGRESS BAR */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 sm:pt-3 border-t border-gray-100">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm text-gray-500 mb-1.5 sm:mb-2">
                      <span>Progress</span>
                      <span className="font-semibold text-gray-800">{projectSummary.progressPercentage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded h-1.5 sm:h-2">
                      <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-1.5 sm:h-2 rounded transition-all"
                        style={{ width: `${projectSummary.progressPercentage || 0}%` }} />
                    </div>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-indigo-500 whitespace-nowrap flex-shrink-0">
                    {projectSummary.totalHours || 0}h
                  </div>
                </div>
              </div>

              {/* RESPONSIVE KEY STATS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="bg-white border border-gray-100 rounded-md p-2 sm:p-3 text-center">
                  <div className="text-lg sm:text-xl font-bold text-gray-900">{projectSummary.tasks?.total || 0}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Total</div>
                </div>
                <div className="bg-white border border-gray-100 rounded-md p-2 sm:p-3 text-center">
                  <div className="text-lg sm:text-xl font-bold text-green-500">{projectSummary.tasks?.completed || 0}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Done</div>
                </div>
                <div className="bg-white border border-gray-100 rounded-md p-2 sm:p-3 text-center">
                  <div className="text-lg sm:text-xl font-bold text-orange-500">{projectSummary.tasks?.inProgress || 0}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Active</div>
                </div>
                <div className="bg-white border border-gray-100 rounded-md p-2 sm:p-3 text-center">
                  <div className="text-lg sm:text-xl font-bold text-red-500">
                    {(projectSummary.tasks?.total || 0) - (projectSummary.tasks?.completed || 0) - (projectSummary.tasks?.inProgress || 0)}
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Pending</div>
                </div>
              </div>

              {/* RESPONSIVE TASKS TABLE */}
              <div className="bg-white border border-gray-100 rounded-md overflow-hidden mb-4">
                <div className="bg-gray-50 px-3 sm:px-4 py-2 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    Tasks by Stage
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm min-w-[280px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
                        <th className="px-3 sm:px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Count</th>
                        <th className="px-3 sm:px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {Object.entries(projectSummary.tasks?.byStage || {}).map(([stage, count], index) => {
                        const total = projectSummary.tasks?.total || 0;
                        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <tr key={stage} className="hover:bg-gray-25 transition-colors">
                            <td className="px-3 sm:px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${stage.toLowerCase().includes('complete') ? 'bg-green-400' :
                                    stage.toLowerCase().includes('progress') ? 'bg-orange-400' :
                                      'bg-red-400'
                                  }`} />
                                <span className="font-medium text-gray-800 capitalize truncate max-w-[120px] sm:max-w-none">{stage}</span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 text-right hidden sm:table-cell">
                              <div className="text-sm font-bold text-gray-900">{count}</div>
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 text-right hidden sm:table-cell">
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded font-medium">{percentage}%</span>
                            </td>
                            {/* MOBILE COUNT DISPLAY */}
                            <td className="px-3 sm:px-4 py-2.5 text-right sm:hidden">
                              <div className="text-sm font-bold text-gray-900">{count}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RESPONSIVE ACTIVITY */}
              <div className="bg-gradient-to-r from-emerald-25 to-green-25 border border-emerald-100 rounded-md p-3 sm:p-4">
                <h4 className="text-xs sm:text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
                  Recent Activity
                </h4>
                <div className="bg-white border border-gray-100 rounded p-2 sm:p-2.5 text-xs">
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
                    <span className="truncate">Summary loaded successfully</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

