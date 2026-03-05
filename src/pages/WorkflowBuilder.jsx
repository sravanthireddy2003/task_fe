import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import WorkflowCanvas from '../components/WorkflowCanvas';
import { toast } from 'sonner';

const WorkflowBuilder = () => {
  const [templates, setTemplates] = useState([]);
  const [loading] = useState(false);
  const authUser = useSelector((s) => s.auth?.user);
  const projectsState = useSelector((s) => s.projects || {});
  const departmentsState = useSelector((s) => s.departments || {});
  const [selected, setSelected] = useState(null);

  const handleCreate = async () => {
    const tenantId = Number(localStorage.getItem('tenantId') || import.meta.env.VITE_TENANT_ID || 1);
    const createdBy = authUser?.id || authUser?._id || 1;

    const projectFromState = projectsState.currentProject || (projectsState.projects && projectsState.projects[0]);
    const deptFromState = (departmentsState.departments && departmentsState.departments[0]) || null;

    const department_id = deptFromState?._id || deptFromState?.id || null;
    const department_name = deptFromState?.name || null;
    const project_id = projectFromState?._id || projectFromState?.id || null;
    const project_name = projectFromState?.name || projectFromState?.project_name || null;

    const payload = {
      tenant_id: tenantId,
      name: 'HR Payroll Task Approval',
      trigger_event: 'TASK_REVIEW',
      department_id,
      department_name,
      project_id,
      project_name,
      active: true,
      created_by: createdBy,
    };
    const newTemplate = {
      id: Date.now(),
      ...payload,
      steps: [],
    };
    setTemplates((prev) => [...prev, newTemplate]);
    setSelected(newTemplate);
    toast.success('Template created (local only)');
  };

  const handleAddStep = async () => {
    if (!selected) return;
    const nextStep = {
      id: Date.now(),
      step_order: (selected.steps?.length || 0) + 1,
      role: 'MANAGER',
      action: 'REVIEW',
      rule_id: 5,
      sla_hours: 4,
      notify: ['MANAGER'],
    };

    const updatedTemplate = {
      ...selected,
      steps: [...(selected.steps || []), nextStep],
    };

    setTemplates((prev) =>
      prev.map((t) =>
        (t.id || t._id) === (selected.id || selected._id) ? updatedTemplate : t
      )
    );
    setSelected(updatedTemplate);
    toast.success('Step added (local only)');
  };

  const handleSaveSteps = async (newSteps) => {
    if (!selected) return toast.error('No template selected');

    const updatedTemplate = { ...selected, steps: newSteps };
    setTemplates((prev) =>
      prev.map((t) =>
        (t.id || t._id) === (selected.id || selected._id) ? updatedTemplate : t
      )
    );
    setSelected(updatedTemplate);
    toast.success('Workflow order updated (local only)');
  };

  return (
    <section className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Workflow Builder</h1>
          <p className="text-sm text-slate-500">Create and manage approval/workflow templates</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCreate} className="btn-primary">Create Template</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-white border rounded-lg p-4">
          <h3 className="font-medium">Templates</h3>
          <div className="mt-3 space-y-2">
            {loading && <div className="text-sm text-slate-500">Loading…</div>}
            {templates.map((t) => (
              <div key={t.id || t._id} onClick={() => setSelected(t)} className={`p-2 rounded-lg cursor-pointer ${selected === t ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-slate-500">{t.trigger_event}</div>
              </div>
            ))}
          </div>
        </div>

          <div className="col-span-2 bg-slate-50 p-6 rounded-lg">
          {selected ? (
            <WorkflowCanvas template={selected} onAddStep={handleAddStep} onSave={handleSaveSteps} />
          ) : (
            <div className="text-slate-500">Select a template to view or edit</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default WorkflowBuilder;
