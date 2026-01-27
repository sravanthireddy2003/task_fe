import React, { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableItem = ({ id, step, onChange, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="p-3 bg-white border rounded-lg shadow-sm flex flex-col gap-2 min-w-[220px]">
      <div className="flex items-center justify-between gap-2">
        <input value={step.name || ''} onChange={(e) => onChange({ ...step, name: e.target.value })} className="w-full bg-transparent outline-none font-medium" />
        <div {...attributes} {...listeners} className="cursor-grab text-slate-400 ml-2">≡</div>
      </div>
      <input value={step.role || ''} onChange={(e) => onChange({ ...step, role: e.target.value })} className="text-xs bg-transparent outline-none text-slate-500" />
      <div className="flex justify-end">
        <button onClick={onRemove} className="text-xs text-red-500">Remove</button>
      </div>
    </div>
  );
};

const WorkflowCanvas = ({ template = {}, onAddStep, onSave }) => {
  const [steps, setSteps] = useState(template.steps ? [...template.steps] : []);

  useEffect(() => { setSteps(template.steps ? [...template.steps] : []); }, [template]);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = steps.findIndex((s) => s.id === active.id || s._id === active.id || s.tempId === active.id);
      const newIndex = steps.findIndex((s) => s.id === over.id || s._id === over.id || s.tempId === over.id);
      if (oldIndex >= 0 && newIndex >= 0) {
        const next = arrayMove(steps, oldIndex, newIndex);
        setSteps(next);
      }
    }
  };

  const handleChangeStep = (index, nextStep) => {
    const copy = [...steps];
    copy[index] = nextStep;
    setSteps(copy);
  };

  const handleRemove = (index) => {
    const copy = [...steps];
    copy.splice(index, 1);
    setSteps(copy);
  };

  const handleAdd = () => {
    const temp = { tempId: `t-${Date.now()}`, name: 'New Step', role: 'Manager' };
    setSteps((s) => [...s, temp]);
    if (onAddStep) onAddStep();
  };

  const handleSave = () => {
    if (onSave) onSave(steps);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{template.name || 'Untitled Workflow'}</h2>
          <p className="text-sm text-slate-500">{template.description || 'No description'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="btn-primary">Save</button>
          <button onClick={handleAdd} className="btn-secondary">Add Step</button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={steps.map((s) => s.id || s._id || s.tempId)} strategy={verticalListSortingStrategy}>
          <div className="flex gap-3 items-start overflow-auto py-4">
            {steps.length === 0 && (
              <div className="p-6 rounded-xl border border-dashed text-slate-500">No steps yet. Add one to begin.</div>
            )}

            {steps.map((s, i) => {
              const key = s.id || s._id || s.tempId || `${i}`;
              return (
                <SortableItem
                  key={key}
                  id={key}
                  step={s}
                  onChange={(next) => handleChangeStep(i, next)}
                  onRemove={() => handleRemove(i)}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default WorkflowCanvas;
