import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import WorkflowCanvas from '../components/WorkflowCanvas';
import { fetchTemplates, createTemplate, addStep, reorderSteps, updateTemplateSteps } from '../redux/slices/workflowSlice';
import { toast } from 'sonner';

const WorkflowBuilder = () => {
  const dispatch = useDispatch();
  const { templates, loading } = useSelector((s) => s.workflow || { templates: [], loading: false });
  const [selected, setSelected] = useState(null);

  useEffect(() => { dispatch(fetchTemplates()); }, [dispatch]);

  const handleCreate = async () => {
    const payload = { tenant_id: localStorage.tenantId || 1, name: 'New Template', trigger_event: 'TASK_CREATED', active: true };
    await dispatch(createTemplate(payload));
    dispatch(fetchTemplates());
  };

  const handleAddStep = async () => {
    if (!selected) return;
    await dispatch(addStep({ template_id: selected.id || selected._id, step_order: (selected.steps?.length||0)+1, role: 'Manager', action: 'REVIEW' }));
    await dispatch(fetchTemplates());
    toast.success('Step added');
  };

  const handleSaveSteps = async (newSteps) => {
    if (!selected) return toast.error('No template selected');

    // Optimistic update: apply new order locally first
    dispatch(updateTemplateSteps({ template_id: selected.id || selected._id, steps: newSteps }));

    try {
      await dispatch(reorderSteps({ template_id: selected.id || selected._id, steps: newSteps })).unwrap();
      await dispatch(fetchTemplates());
      toast.success('Workflow order saved');
    } catch (err) {
      // Revert by reloading from server
      await dispatch(fetchTemplates());
      toast.error('Save failed on server; reverted to server state');
      console.warn('reorderSteps error:', err);
    }
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
