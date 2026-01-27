import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import TaskModal from './TaskModal';
import { toast } from 'sonner';

// Sample tasks data for workflow kanban
const sampleWorkflowTasks = [
  {
    id: 't1',
    title: 'Create wireframes',
    description: 'Design initial wireframes for the new dashboard',
    status: 'Wireframe',
    priority: 'high',
    assignedTo: 'John Doe',
    due_date: '2026-01-15',
    workflowId: 'wf1'
  },
  {
    id: 't2',
    title: 'Develop login component',
    description: 'Build the authentication component',
    status: 'Development',
    priority: 'medium',
    assignedTo: 'Jane Smith',
    due_date: '2026-01-20',
    workflowId: 'wf2'
  },
  {
    id: 't3',
    title: 'Test user flows',
    description: 'QA testing for user registration flow',
    status: 'Testing',
    priority: 'high',
    assignedTo: 'Mike Johnson',
    due_date: '2026-01-18',
    workflowId: 'wf2'
  },
  {
    id: 't4',
    title: 'Deploy to staging',
    description: 'Deploy the latest build to staging environment',
    status: 'Deployment',
    priority: 'medium',
    assignedTo: 'Sarah Wilson',
    due_date: '2026-01-22',
    workflowId: 'wf2'
  }
];

const WorkflowKanban = ({ selectedWorkflow, onBack }) => {
  const [tasks, setTasks] = useState(sampleWorkflowTasks.filter(task => task.workflowId === selectedWorkflow?.id));
  const [activeTask, setActiveTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create columns based on workflow steps
  const columns = useMemo(() => {
    if (!selectedWorkflow?.steps) return {};

    const workflowColumns = {};

    // Initialize columns for each workflow step
    selectedWorkflow.steps.forEach(step => {
      workflowColumns[step.name] = tasks.filter(task => task.status === step.name);
    });

    return workflowColumns;
  }, [selectedWorkflow, tasks]);

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id || t._id === active.id || t.public_id === active.id);
    if (!task) return;

    setActiveTask(task);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the task
    const task = tasks.find(t => t.id === activeId || t._id === activeId || t.public_id === activeId);
    if (!task) return;

    // Determine target column
    let targetColumn = null;

    // Check if dropped on a column
    if (Object.keys(columns).includes(overId)) {
      targetColumn = overId;
    } else {
      // Find which column the over item belongs to
      for (const [columnName, columnTasks] of Object.entries(columns)) {
        const foundIndex = columnTasks.findIndex(t =>
          t.id === overId || t._id === overId || t.public_id === overId
        );
        if (foundIndex !== -1) {
          targetColumn = columnName;
          break;
        }
      }
    }

    if (!targetColumn) return;

    // Update task status to match the workflow step
    const updatedTask = { ...task, status: targetColumn };
    setTasks(prevTasks =>
      prevTasks.map(t => t.id === task.id ? updatedTask : t)
    );

    toast.success(`Task moved to "${targetColumn}"`);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleAddTask = (columnTitle) => {
    const newTask = {
      id: `t${Date.now()}`,
      title: `New task in ${columnTitle}`,
      description: 'Task description',
      status: columnTitle,
      priority: 'medium',
      assignedTo: 'Unassigned',
      workflowId: selectedWorkflow.id
    };

    setTasks(prev => [...prev, newTask]);
    toast.success(`New task added to "${columnTitle}"`);
  };

  if (!selectedWorkflow) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-body text-slate-500">Select a workflow to view the kanban board</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-link flex items-center gap-2 mb-2"
          >
            ← Back to Workflows
          </button>
          <h2 className="text-h2 font-semibold text-slate-900">{selectedWorkflow.name} - Kanban Board</h2>
          <p className="text-caption text-slate-500">{selectedWorkflow.description}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg">
            <span className="text-caption font-medium">{tasks.length} tasks</span>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-6 min-h-[600px]">
          {(selectedWorkflow?.steps || []).map((step) => (
            <KanbanColumn
              key={step.name}
              id={step.name}
              title={step.name}
              tasks={columns[step.name] || []}
              onTaskClick={handleTaskClick}
              userRole="manager"
              onAddTask={handleAddTask}
            />
          ))}
        </div>

        {createPortal(
          <DragOverlay>
            {activeTask ? (
              <div className="rotate-3 opacity-90">
                <KanbanCard
                  task={activeTask}
                  onClick={() => {}}
                  userRole="manager"
                />
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {/* Task Modal */}
      {showTaskModal && selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          onUpdate={(updatedTask) => {
            setTasks(prev =>
              prev.map(t => t.id === updatedTask.id ? updatedTask : t)
            );
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

export default WorkflowKanban;