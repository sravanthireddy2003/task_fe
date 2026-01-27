import React, { useEffect, useState } from "react";
import * as Icons from "../icons";
import WorkflowKanban from "../components/WorkflowKanban";

// ---------------- STATIC SAMPLE DATA ---------------- //

const sampleDepartments = [
  { id: "d1", name: "Design", color: "#6366F1" },
  { id: "d2", name: "Development", color: "#10B981" },
  { id: "d3", name: "Operations", color: "#F59E0B" },
];

const sampleProjects = [
  { id: "p1", name: "Website Redesign" },
  { id: "p2", name: "Mobile App" },
  { id: "p3", name: "Cloud Migration" },
];

const sampleFlows = [
  {
    id: "wf1",
    name: "UI/UX Workflow",
    description: "Design → Review → Approval",
    departmentId: "d1",
    projectId: "p1",
    steps: [
      { name: "Wireframe" },
      { name: "Prototype" },
      { name: "Design Review" },
    ],
  },
  {
    id: "wf2",
    name: "Development Pipeline",
    description: "Dev → QA → Deploy",
    departmentId: "d2",
    projectId: "p2",
    steps: [
      { name: "Development" },
      { name: "Testing" },
      { name: "Deployment" },
    ],
  },
  {
    id: "wf3",
    name: "Ops Workflow",
    description: "Monitoring → Scaling",
    departmentId: "d3",
    projectId: "p3",
    steps: [{ name: "Monitoring" }, { name: "Scaling" }],
  },
];

export default function Workflow() {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI states
  const [viewMode, setViewMode] = useState("table"); // cards | table | kanban (list/table as default)
  const [showModal, setShowModal] = useState(false);
  const [editingFlow, setEditingFlow] = useState(null);
  const [previewFlow, setPreviewFlow] = useState(null); // drawer
  const [selectedWorkflowForKanban, setSelectedWorkflowForKanban] = useState(null);
  const [query, setQuery] = useState("");

  // modal states
  const emptyForm = {
    name: "",
    description: "",
    steps: [],
    departmentId: sampleDepartments[0].id,
    projectId: sampleProjects[0].id,
  };

  const [form, setForm] = useState(emptyForm);
  const [newStepName, setNewStepName] = useState("");

  // Load static data
  useEffect(() => {
    setTimeout(() => {
      setFlows(sampleFlows);
      setLoading(false);
    }, 300);
  }, []);

  // Search filter
  const matchesQuery = (flow) => {
    const q = query.toLowerCase();
    return (
      flow.name.toLowerCase().includes(q) ||
      flow.description.toLowerCase().includes(q)
    );
  };

  const filtered = flows.filter((f) => matchesQuery(f));

  const openCreate = () => {
    setEditingFlow(null);
    setForm(emptyForm);
    setNewStepName("");
    setShowModal(true);
  };

  const openEdit = (flow) => {
    setEditingFlow(flow);
    setForm({
      name: flow.name,
      description: flow.description,
      steps: [...flow.steps],
      departmentId: flow.departmentId,
      projectId: flow.projectId,
    });
    setNewStepName("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFlow(null);
    setForm(emptyForm);
    setNewStepName("");
  };

  const handleAddStep = () => {
    if (!newStepName.trim()) return;
    setForm((f) => ({
      ...f,
      steps: [...f.steps, { name: newStepName }],
    }));
    setNewStepName("");
  };

  const handleRemoveStep = (i) => {
    setForm((f) => ({
      ...f,
      steps: f.steps.filter((_, idx) => idx !== i),
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (editingFlow) {
      setFlows((prev) =>
        prev.map((f) =>
          f.id === editingFlow.id ? { ...editingFlow, ...form } : f
        )
      );
    } else {
      setFlows((prev) => [
        { id: "wf_" + Date.now(), ...form },
        ...prev,
      ]);
    }

    closeModal();
  };

  const handleDelete = (flow) => {
    if (window.confirm(`Delete workflow "${flow.name}"?`)) {
      setFlows((prev) => prev.filter((f) => f.id !== flow.id));
      if (previewFlow?.id === flow.id) setPreviewFlow(null);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Workflow Management</h2>
          <p className="text-gray-500">Create workflows, manage steps, and track progress with kanban boards</p>
        </div>

        <div className="flex gap-3">
          {/* VIEW MODE TOGGLE: List (table) default, then Grid (cards), then Kanban */}
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center justify-center p-2 rounded-lg border ${
              viewMode === "table" ? "bg-blue-600 text-white" : "bg-white"
            }`}
            title="List View"
          >
            <Icons.Rows4 className="tm-icon" />
          </button>

          <button
            onClick={() => setViewMode("cards")}
            className={`flex items-center justify-center p-2 rounded-lg border ${
              viewMode === "cards" ? "bg-blue-600 text-white" : "bg-white"
            }`}
            title="Grid View"
          >
            <Icons.LayoutGrid className="tm-icon" />
          </button>

          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center justify-center p-2 rounded-lg border ${
              viewMode === "kanban" ? "bg-blue-600 text-white" : "bg-white"
            }`}
            title="Kanban View"
          >
            <Icons.KanbanSquare className="tm-icon" />
          </button>

          <button
            onClick={openCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Icons.Plus className="tm-icon" /> Add Workflow
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative w-80">
            <Icons.Search className="tm-icon absolute left-3 top-3 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border rounded-lg pl-10 py-2"
          placeholder="Search workflows..."
        />
      </div>

      {/* ---- CARD VIEW ---- */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((flow) => {
            const dept = sampleDepartments.find(
              (d) => d.id === flow.departmentId
            );
            const proj = sampleProjects.find(
              (p) => p.id === flow.projectId
            );

            return (
              <div key={flow.id} className="tm-card-shell">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{flow.name}</h3>
                    <p className="text-gray-500">{flow.description}</p>
                    <div className="mt-3 flex gap-2">
                      <span
                        className="text-xs px-2 py-1 rounded-full text-white"
                        style={{ background: dept?.color }}
                      >
                        {dept?.name}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                        {proj?.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <button
                      className="p-2"
                      onClick={() => setPreviewFlow(flow)}
                      title="View Details"
                    >
                      <Icons.Eye className="tm-icon" />
                    </button>
                    <button
                      className="p-2 text-blue-500"
                      onClick={() => {
                        setSelectedWorkflowForKanban(flow);
                        setViewMode("kanban");
                      }}
                      title="View Kanban"
                    >
                      <Icons.KanbanSquare className="tm-icon" />
                    </button>
                    <button className="p-2" onClick={() => openEdit(flow)} title="Edit">
                      <Icons.Edit2 className="tm-icon" />
                    </button>
                    <button
                      className="p-2 text-red-500"
                      onClick={() => handleDelete(flow)}
                      title="Delete"
                    >
                      <Icons.Trash2 className="tm-icon" />
                    </button>
                  </div>
                </div>

                {/* Steps */}
                <div className="mt-4 flex gap-2 overflow-x-auto">
                  {flow.steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="border px-3 py-2 bg-gray-50 rounded-lg text-sm">
                        {s.name}
                      </div>
                      {i < flow.steps.length - 1 && (
                        <Icons.ArrowRight className="tm-icon text-gray-300" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---- KANBAN VIEW ---- */}
      {viewMode === "kanban" && (
        <div className="space-y-6">
          {selectedWorkflowForKanban ? (
            <WorkflowKanban
              selectedWorkflow={selectedWorkflowForKanban}
              onBack={() => setSelectedWorkflowForKanban(null)}
            />
          ) : (
            <div className="text-center py-12">
              <Icons.KanbanSquare className="tm-icon-hero mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Workflow for Kanban</h3>
              <p className="text-gray-500 mb-6">Choose a workflow from the cards below to view its kanban board</p>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {filtered.map((flow) => {
                  const dept = sampleDepartments.find(d => d.id === flow.departmentId);
                  return (
                    <div
                      key={flow.id}
                      className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedWorkflowForKanban(flow)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{flow.name}</h4>
                          <p className="text-sm text-gray-500">{flow.description}</p>
                        </div>
                        <Icons.KanbanSquare className="tm-icon text-blue-500" />
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="text-xs px-2 py-1 rounded-full text-white"
                          style={{ background: dept?.color }}
                        >
                          {dept?.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {flow.steps.length} steps
                        </span>
                      </div>

                      <div className="text-xs text-blue-600 font-medium">
                        Click to view kanban →
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      {viewMode === "table" && (
        <div className="bg-white border rounded-xl shadow-sm p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-3">Workflow</th>
                <th className="py-3">Department</th>
                <th className="py-3">Project</th>
                <th className="py-3">Steps</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((flow) => {
                const dept = sampleDepartments.find(
                  (d) => d.id === flow.departmentId
                );
                const proj = sampleProjects.find(
                  (p) => p.id === flow.projectId
                );

                return (
                  <tr
                    key={flow.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="py-3">
                      <div className="font-medium">{flow.name}</div>
                      <div className="text-gray-500">{flow.description}</div>
                    </td>

                    <td className="py-3">
                      <span
                        className="text-xs px-2 py-1 rounded-full text-white"
                        style={{ background: dept?.color }}
                      >
                        {dept?.name}
                      </span>
                    </td>

                    <td className="py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                        {proj?.name}
                      </span>
                    </td>

                    <td className="py-3">
                      <div className="flex gap-1 flex-wrap">
                        {flow.steps.map((s, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 text-xs bg-gray-100 rounded-lg"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 text-right">
                      <button
                        onClick={() => setPreviewFlow(flow)}
                        className="p-2"
                        title="View Details"
                      >
                        <Icons.Eye className="tm-icon" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedWorkflowForKanban(flow);
                          setViewMode("kanban");
                        }}
                        className="p-2 text-blue-500"
                        title="View Kanban"
                      >
                        <Icons.KanbanSquare className="tm-icon" />
                      </button>
                      <button
                        onClick={() => openEdit(flow)}
                        className="p-2"
                        title="Edit"
                      >
                        <Icons.Edit2 className="tm-icon" />
                      </button>
                      <button
                        onClick={() => handleDelete(flow)}
                        className="p-2 text-red-500"
                        title="Delete"
                      >
                        <Icons.Trash2 className="tm-icon" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* --------------------- RIGHT DRAWER (VIEW) --------------------- */}
      {previewFlow && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          <div
            className="bg-white h-full p-6 shadow-xl"
            style={{ width: "500px" }} // ✔ 500px drawer
          >
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{previewFlow.name}</h3>
              <button onClick={() => setPreviewFlow(null)}>
                <Icons.X className="tm-icon" />
              </button>
            </div>

            <p className="text-gray-600">{previewFlow.description}</p>

            {/* INFO */}
            <div className="mt-4 space-y-3">
              <div>
                <strong>Department:</strong>{" "}
                {
                  sampleDepartments.find(
                    (d) => d.id === previewFlow.departmentId
                  )?.name
                }
              </div>

              <div>
                <strong>Project:</strong>{" "}
                {
                  sampleProjects.find(
                    (p) => p.id === previewFlow.projectId
                  )?.name
                }
              </div>
            </div>

            {/* STEPS */}
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Steps</h4>
              <div className="space-y-2">
                {previewFlow.steps.map((s, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 border rounded-lg bg-gray-50 flex items-center gap-2"
                  >
                    {s.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CLICK OUTSIDE TO CLOSE */}
          <div
            className="flex-1"
            onClick={() => setPreviewFlow(null)}
          ></div>
        </div>
      )}

      {/* --------------------- ADD / EDIT MODAL --------------------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <form
            onSubmit={handleSave}
            className="bg-white p-6 rounded-xl shadow-xl w-[450px] space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                {editingFlow ? "Edit Workflow" : "Add Workflow"}
              </h3>
              <button onClick={closeModal} type="button">
                <Icons.X className="tm-icon" />
              </button>
            </div>

            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                className="w-full border rounded-lg p-2 mt-1"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full border rounded-lg p-2 mt-1"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
              />
            </div>

            {/* Selects */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium">Department</label>
                <select
                  className="w-full border rounded-lg p-2 mt-1"
                  value={form.departmentId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      departmentId: e.target.value,
                    }))
                  }
                >
                  {sampleDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium">Project</label>
                <select
                  className="w-full border rounded-lg p-2 mt-1"
                  value={form.projectId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      projectId: e.target.value,
                    }))
                  }
                >
                  {sampleProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Steps */}
            <div>
              <label className="text-sm font-medium">Steps</label>

              <div className="flex gap-2 mt-2">
                <input
                  className="border rounded-lg p-2 flex-1"
                  placeholder="Step name"
                  value={newStepName}
                  onChange={(e) => setNewStepName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="bg-gray-800 text-white px-4 rounded-lg"
                >
                  Add
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {form.steps.map((s, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-gray-50 border rounded-lg p-2"
                  >
                    {s.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(i)}
                      className="text-red-500"
                    >
                      <Icons.X className="tm-icon" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white w-full py-2 rounded-lg mt-4"
            >
              {editingFlow ? "Save Changes" : "Create Workflow"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
