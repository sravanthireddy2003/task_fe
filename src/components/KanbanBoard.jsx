import React, { useState, useEffect, useMemo } from 'react';
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

const KanbanBoard = ({
  tasks = [],
  onUpdateTask,
  onLoadTasks,
  userRole = 'employee',
  projectId = null,
  reassignmentRequests = {}
}) => {
  const [activeTask, setActiveTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Organize tasks into columns based on status
  const columns = useMemo(() => ({
    'PENDING': tasks.filter(task => task.status === 'PENDING'),
    'To Do': tasks.filter(task => task.status === 'To Do'),
    'In Progress': tasks.filter(task => task.status === 'In Progress'),
    'On Hold': tasks.filter(task => task.status === 'On Hold'),
    'Review': tasks.filter(task => task.status === 'Review'),
    'Completed': tasks.filter(task => task.status === 'Completed')
  }), [tasks]);

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id || t._id === active.id || t.public_id === active.id);
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

    // Map column names to status values
    const statusMap = {
      'PENDING': 'PENDING',
      'To Do': 'To Do',
      'In Progress': 'In Progress',
      'On Hold': 'On Hold',
      'Review': 'Review',
      'Completed': 'Completed'
    };

    const newStatus = statusMap[targetColumn];
    if (!newStatus) return;

    // Update task status
    try {
      const taskId = task.id || task._id || task.public_id;
      await onUpdateTask(taskId, { status: newStatus });
      // Reload tasks
      if (onLoadTasks) {
        onLoadTasks();
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleCloseModal = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
  };

  const columnOrder = ['PENDING', 'To Do', 'In Progress', 'On Hold', 'Review', 'Completed'];

  return (
    <div className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-6">
          {columnOrder.map((columnName) => (
            <KanbanColumn
              key={columnName}
              id={columnName}
              title={columnName}
              tasks={columns[columnName] || []}
              onTaskClick={handleTaskClick}
              userRole={userRole}
              reassignmentRequests={reassignmentRequests}
            />
          ))}
        </div>

        {createPortal(
          <DragOverlay>
            {activeTask ? (
              <KanbanCard
                task={activeTask}
                isDragging
                onClick={() => {}}
                userRole={userRole}
              />
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {showTaskModal && selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={handleCloseModal}
          onUpdate={onUpdateTask}
          userRole={userRole}
          projectId={projectId}
        />
      )}
    </div>
  );
};

export default KanbanBoard;