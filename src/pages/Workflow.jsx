import React, { useEffect, useState } from "react";
import * as Icons from "../icons";
import WorkflowKanban from "../components/WorkflowKanban";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { fetchDepartments, selectDepartments } from '../redux/slices/departmentSlice';
import { fetchProjects, selectProjects, selectCurrentProject } from '../redux/slices/projectSlice';
import PageHeader from "../components/PageHeader";

export default function Workflow() {
  const dispatch = useDispatch();
  const authUser = useSelector((s) => s.auth?.user);
  const departments = useSelector(selectDepartments);
  const projects = useSelector(selectProjects);
  const currentProject = useSelector(selectCurrentProject);
  const [flows, setFlows] = useState([]);

  // UI states
  const [viewMode, setViewMode] = useState("table");
  const [showModal, setShowModal] = useState(false);
  const [editingFlow, setEditingFlow] = useState(null);
  const [previewFlow, setPreviewFlow] = useState(null);
  const [selectedWorkflowForKanban, setSelectedWorkflowForKanban] = useState(null);
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    scope: "all",
    status: "all",
    department: "all"
  });

  const role = authUser?.role;
  const isAdmin = role === 'Admin';
  const isManager = role === 'Manager';
  const isEmployee = role === 'Employee';

  // Modal states
  const emptyForm = {
    name: "",
    description: "",
    scope: 'GLOBAL',
    triggerEvent: 'TASK_REVIEW',
    active: true,
    departmentId: "",
    projectId: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [newStepName, setNewStepName] = useState("");

  // NOTE: Previous admin workflow-templates API has been removed.
  // This page now works purely with local state for admin-designed flows.

  // Load supporting data for admin (departments, projects)
  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchDepartments()).catch((e) => console.warn('[Workflow page] fetchDepartments error', e));
      dispatch(fetchProjects()).catch((e) => console.warn('[Workflow page] fetchProjects error', e));
    }
  }, [dispatch, isAdmin]);

  // -------- Modal & CRUD Handlers --------

  const closeModal = () => {
    setShowModal(false);
    setEditingFlow(null);
    setForm(emptyForm);
  };

  const openCreate = () => {
    setEditingFlow(null);
    setForm({
      ...emptyForm,
      scope: 'GLOBAL',
      triggerEvent: 'TASK_REVIEW',
      active: true,
      departmentId: '',
      projectId: '',
    });
    setShowModal(true);
  };

  const openEdit = (flow) => {
    if (!flow) return;
    setEditingFlow(flow);
    setForm({
      name: flow.name || '',
      description: flow.description || '',
      scope: (flow.scope || 'GLOBAL').toUpperCase(),
      triggerEvent: flow.trigger_event || flow.triggerEvent || 'TASK_REVIEW',
      active: flow.active !== false,
      departmentId: (flow.department_id || flow.departmentId || '').toString(),
      projectId: (flow.project_id || flow.projectId || '').toString(),
    });
    setShowModal(true);
  };

  const handleDelete = (flow) => {
    if (!flow) return;
    setFlows((prev) => prev.filter((f) => f.id !== flow.id));
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!form.name.trim()) return;

    // Local edit only (no template API)
    if (editingFlow) {
      setFlows((prev) =>
        prev.map((f) =>
          f.id === editingFlow.id
            ? {
                ...f,
                name: form.name.trim(),
                description: form.description,
                scope: form.scope,
                trigger_event: form.triggerEvent,
                active: form.active,
                department_id: form.departmentId || null,
                project_id: form.projectId || null,
              }
            : f
        )
      );
      closeModal();
      return;
    }

    const dept = departments.find(
      (d) => String(d._id || d.id || d.public_id) === String(form.departmentId || '')
    );
    const allProjects = [currentProject, ...(projects || [])].filter(Boolean);
    const proj = allProjects.find(
      (p) => String(p._id || p.id || p.public_id) === String(form.projectId || '')
    );

    const payload = {
      name: form.name.trim(),
      trigger_event: form.triggerEvent,
      scope: form.scope,
      active: form.active,
      department_id: form.departmentId || null,
      department_name: dept ? dept.name || dept.department_name : null,
      project_id: form.projectId || null,
      project_name: proj ? proj.name || proj.project_name : null,
      tenant_id:
        authUser?.tenant_id ||
        authUser?.tenantId ||
        authUser?.tenant ||
        authUser?.company_id ||
        null,
      created_by:
        authUser?._id || authUser?.id || authUser?.public_id || authUser?.email || null,
    };
    // For now just append locally; backend template API was removed
    setFlows((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...payload,
        active: payload.active !== false,
        steps: [],
      },
    ]);
    closeModal();
  };

  // Filter workflows based on search and active filters
  const filtered = flows.filter((flow) => {
    const matchesSearch = flow.name.toLowerCase().includes(query.toLowerCase()) || 
                         (flow.description || "").toLowerCase().includes(query.toLowerCase());
    
    const matchesScope = activeFilters.scope === "all" || 
                        flow.scope?.toLowerCase() === activeFilters.scope.toLowerCase();
    
    const matchesStatus = activeFilters.status === "all" || 
                         (activeFilters.status === "active" ? flow.active !== false : flow.active === false);
    
    const matchesDepartment = activeFilters.department === "all" || 
                             (flow.department_id || flow.departmentId)?.toString() === activeFilters.department;
    
    return matchesSearch && matchesScope && matchesStatus && matchesDepartment;
  });

  // Toggle filter function
  const toggleFilter = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? "all" : value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters({
      scope: "all",
      status: "all",
      department: "all"
    });
    setQuery("");
  };

  // Get scope badge styling
  const getScopeBadgeStyle = (scope) => {
    switch(scope?.toUpperCase()) {
      case 'PROJECT': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DEPARTMENT': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'GLOBAL': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get status badge styling
  const getStatusBadgeStyle = (active) => {
    return active !== false 
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-gray-50 text-gray-600 border-gray-200';
  };

  // Count statistics
  const stats = {
    total: flows.length,
    active: flows.filter(f => f.active !== false).length,
    project: flows.filter(f => f.scope?.toUpperCase() === 'PROJECT').length,
    department: flows.filter(f => f.scope?.toUpperCase() === 'DEPARTMENT').length,
    global: flows.filter(f => f.scope?.toUpperCase() === 'GLOBAL' || !f.scope).length,
  };

  // Admin View - Redesigned Dashboard
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header Section */}
        <div className="mb-8">
          <PageHeader
            title="Workflow Management"
            subtitle="Design, automate, and monitor approval workflows across your organization"
            onRefresh={() => {
              dispatch(fetchDepartments()).catch((e) => console.warn('[Workflow page] fetchDepartments error', e));
              dispatch(fetchProjects()).catch((e) => console.warn('[Workflow page] fetchProjects error', e));
            }}
          >
            <button
              onClick={openCreate}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Icons.Plus className="w-5 h-5" />
              Create Workflow
            </button>
          </PageHeader>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Workflows</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Icons.Layers className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <Icons.CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Project Scope</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.project}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Icons.Briefcase className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Global Scope</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.global}</p>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                <Icons.Globe className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Toolbar */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              {/* Search */}
              <div className="relative w-full lg:w-96">
                <Icons.Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search workflows by name or description..."
                />
              </div>

              {/* View Toggle and Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* View Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${viewMode === "table" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <Icons.Table className="inline w-4 h-4 mr-2" />
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode("cards")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${viewMode === "cards" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <Icons.Grid className="inline w-4 h-4 mr-2" />
                    Cards
                  </button>
                </div>

                {/* Filter Chips */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleFilter('scope', 'project')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${activeFilters.scope === 'project' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                  >
                    Project Scope
                  </button>
                  <button
                    onClick={() => toggleFilter('scope', 'department')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${activeFilters.scope === 'department' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                  >
                    Department Scope
                  </button>
                  <button
                    onClick={() => toggleFilter('status', 'active')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${activeFilters.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                  >
                    Active Only
                  </button>
                  
                  {activeFilters.scope !== 'all' || activeFilters.status !== 'all' || activeFilters.department !== 'all' ? (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
                    >
                      <Icons.X className="w-4 h-4" />
                      Clear Filters
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Workflows Content */}
          <div className="p-6">
            {viewMode === "table" ? (
              /* Table View */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Workflow</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Scope</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Project / Department</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Status</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Last Updated</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center">
                          <Icons.Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No workflows found. Try adjusting your filters.</p>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((flow) => (
                        <tr key={flow.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-semibold text-gray-900">{flow.name}</div>
                              <div className="text-sm text-gray-500 mt-1 line-clamp-1">{flow.description || "No description"}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getScopeBadgeStyle(flow.scope)}`}>
                              {flow.scope || 'GLOBAL'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Icons.Building className="w-4 h-4 text-gray-600" />
                              </div>
                              <span className="text-sm text-gray-700">
                                {flow.scope?.toUpperCase() === 'PROJECT'
                                  ? flow.project_name || 'Project-specific'
                                  : flow.scope?.toUpperCase() === 'DEPARTMENT'
                                  ? flow.department_name || 'Department-specific'
                                  : 'Global'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeStyle(flow.active)}`}>
                              {flow.active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-gray-500">
                              {flow.created_at
                                ? new Date(flow.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : '—'}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setPreviewFlow(flow)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Icons.Eye className="w-5 h-5 text-gray-600" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedWorkflowForKanban(flow);
                                  setViewMode("kanban");
                                }}
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Kanban"
                              >
                                <Icons.KanbanSquare className="w-5 h-5 text-blue-600" />
                              </button>
                              <button
                                onClick={() => openEdit(flow)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Icons.Edit2 className="w-5 h-5 text-gray-600" />
                              </button>
                              <button
                                onClick={() => handleDelete(flow)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Icons.Trash2 className="w-5 h-5 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Card View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.length === 0 ? (
                  <div className="col-span-3 py-12 text-center">
                    <Icons.Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No workflows match your filters</p>
                    <button
                      onClick={clearFilters}
                      className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  filtered.map((flow) => (
                    <div key={flow.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{flow.name}</h3>
                          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{flow.description || "No description provided"}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getScopeBadgeStyle(flow.scope)}`}>
                            {flow.scope || 'GLOBAL'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Icons.Building className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="text-sm text-gray-700">
                            {flow.scope?.toUpperCase() === 'PROJECT'
                              ? flow.project_name || 'Project-specific'
                              : flow.scope?.toUpperCase() === 'DEPARTMENT'
                              ? flow.department_name || 'Department-specific'
                              : 'Global'}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeStyle(flow.active)}`}>
                          {flow.active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Steps Preview */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500">STEPS ({flow.steps?.length || 0})</span>
                          <span className="text-xs text-gray-400">{flow.trigger_event || 'Manual'}</span>
                        </div>
                        <div className="space-y-2">
                          {(flow.steps || []).slice(0, 3).map((step, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">{index + 1}</span>
                              </div>
                              <span className="text-sm text-gray-700">{step.name}</span>
                            </div>
                          ))}
                          {(flow.steps || []).length > 3 && (
                            <div className="text-center pt-2">
                              <span className="text-xs text-gray-400">+{(flow.steps || []).length - 3} more steps</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <button
                          onClick={() => setPreviewFlow(flow)}
                          className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
                        >
                          <Icons.Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedWorkflowForKanban(flow);
                              setViewMode("kanban");
                            }}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-1"
                          >
                            <Icons.KanbanSquare className="w-4 h-4" />
                            Kanban
                          </button>
                          <button
                            onClick={() => openEdit(flow)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Pagination (Optional) */}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium">{filtered.length}</span> of <span className="font-medium">{flows.length}</span> workflows
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="px-3 py-2 rounded-lg bg-blue-600 text-white">
                    1
                  </button>
                  <button className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
                    2
                  </button>
                  <button className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create / Edit Workflow Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <form
              onSubmit={handleSave}
              className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md space-y-4"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {editingFlow ? "Edit Workflow" : "Create Workflow"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure scope, trigger, and ownership for this workflow
                  </p>
                </div>
                <button onClick={closeModal} type="button" className="text-gray-400 hover:text-gray-600">
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Workflow Name *</label>
                <input
                  className="w-full border border-gray-200 rounded-lg p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., HR Payroll Approval"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Scope *</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.scope}
                    onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
                  >
                    <option value="GLOBAL">Global</option>
                    <option value="DEPARTMENT">Department</option>
                    <option value="PROJECT">Project</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Trigger Event *</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.triggerEvent}
                    onChange={(e) => setForm((f) => ({ ...f, triggerEvent: e.target.value }))}
                  >
                    <option value="TASK_CREATED">Task Created</option>
                    <option value="TASK_REVIEW">Task Review</option>
                    <option value="TASK_COMPLETED">Task Completed</option>
                  </select>
                </div>
              </div>

              {(form.scope === 'DEPARTMENT' || form.scope === 'PROJECT') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Department</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={form.departmentId}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          departmentId: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => {
                        const id = String(d._id || d.id || d.public_id);
                        const name = d.name || d.department_name || 'Unnamed Department';
                        return (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {form.scope === 'PROJECT' && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Project</label>
                      <select
                        className="w-full border border-gray-200 rounded-lg p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.projectId}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            projectId: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select Project</option>
                        {[currentProject, ...(projects || [])]
                          .filter(Boolean)
                          .map((p) => {
                            const id = String(p._id || p.id || p.public_id);
                            const name = p.name || p.project_name || 'Unnamed Project';
                            return (
                              <option key={id} value={id}>
                                {name}
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="wf-active"
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="wf-active" className="text-sm text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                >
                  {editingFlow ? 'Save Changes' : 'Create Workflow'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Manager: redirect to dedicated approval queue page that
  // uses manager workflow APIs (queue/approve/reject/escalate)
  if (isManager) {
    return <Navigate to="/manager/workflows/queue" replace />;
  }

  // Other non-admin roles: simple access restricted message
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="text-center py-12">
        <Icons.Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-600">You don't have permission to access workflow management.</p>
      </div>
    </div>
  );
}