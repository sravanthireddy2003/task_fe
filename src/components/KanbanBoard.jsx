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
  kanbanData,
  onUpdateTask,
  onStartTask,
  onPauseTask,
  onResumeTask,
  onCompleteTask,
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
  const columns = useMemo(() => {
    console.log('KanbanBoard columns useMemo:', { kanbanData, tasks });
    
    // Define the standard columns from the guide
    const standardColumns = {
      'To Do': [],
      'In Progress': [],
      'On Hold': [],
      'Completed': []
    };

    if (kanbanData && Array.isArray(kanbanData) && kanbanData.length > 0) {
      return kanbanData.reduce((acc, group) => {
        // Map uppercase status values to display names
        let displayStatus = 'To Do';
        const normalizedStatus = (group.status || '').toUpperCase();
        
        if (normalizedStatus === 'PENDING' || normalizedStatus === 'TO_DO') {
          displayStatus = 'To Do';
        } else if (normalizedStatus === 'IN_PROGRESS') {
          displayStatus = 'In Progress';
        } else if (normalizedStatus === 'ON_HOLD') {
          displayStatus = 'On Hold';
        } else if (normalizedStatus === 'COMPLETED') {
          displayStatus = 'Completed';
        }
        
        if (acc[displayStatus]) {
          acc[displayStatus] = [...acc[displayStatus], ...(group.tasks || [])];
        } else {
          acc[displayStatus] = group.tasks || [];
        }
        return acc;
      }, standardColumns);
    } else {
      return ({
        'To Do': tasks.filter(task => {
          const s = (task.status || task.stage || '').toUpperCase();
          return s === 'PENDING' || s === 'TO_DO';
        }),
        'In Progress': tasks.filter(task => {
          const s = (task.status || task.stage || '').toUpperCase();
          return s === 'IN_PROGRESS';
        }),
        'On Hold': tasks.filter(task => {
          const s = (task.status || task.stage || '').toUpperCase();
          return s === 'ON_HOLD';
        }),
        'Completed': tasks.filter(task => {
          const s = (task.status || task.stage || '').toUpperCase();
          return s === 'COMPLETED';
        })
      });
    }
  }, [tasks, kanbanData]);

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id || t._id === active.id || t.public_id === active.id);
    if (!task) return;

    // Block if task is locked
    if (task.is_locked === true) {
      toast.error('This task is locked and cannot be moved until your manager responds.');
      return;
    }

    // Block if completed
    if (task.status === 'Completed') {
      toast.error('Completed tasks cannot be moved. Task is locked.');
      return;
    }

    // Block if pending reassignment request
    const taskId = task.id || task._id || task.public_id;
    const reassignmentRequest = reassignmentRequests[taskId];
    if (reassignmentRequest?.status === 'PENDING') {
      toast.error('You have submitted a reassignment request. Task is locked until manager responds.');
      return;
    }

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

    // Block if task is locked
    if (task.is_locked === true) {
      toast.error('This task is locked and cannot be moved until your manager responds.');
      return;
    }

    // Block if completed
    if (task.status === 'Completed') {
      toast.error('Completed tasks cannot be moved. Task is locked.');
      return;
    }

    // Block if pending reassignment request
    const taskId = task.id || task._id || task.public_id;
    const reassignmentRequest = reassignmentRequests[taskId];
    if (reassignmentRequest?.status === 'PENDING') {
      toast.error('You have submitted a reassignment request. Task is locked until manager responds.');
      return;
    }

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

    const currentStatus = task.status || task.stage;

    // Strict Kanban Workflow Transitions
    try {
      if (targetColumn === 'In Progress') {
        if (currentStatus === 'PENDING' || currentStatus === 'Pending' || currentStatus === 'To Do' || 
            currentStatus === 'PENDING' || currentStatus === 'TO_DO' || currentStatus === 'TO DO') {
          await onStartTask(taskId);
        } else if (currentStatus === 'On Hold' || currentStatus === 'ON_HOLD') {
          await onResumeTask(taskId);
        } else {
          toast.error(`Cannot move from ${currentStatus} to In Progress`);
        }
      } else if (targetColumn === 'On Hold') {
        if (currentStatus === 'In Progress' || currentStatus === 'IN_PROGRESS') {
          await onPauseTask(taskId);
        } else {
          toast.error(`Cannot move from ${currentStatus} to On Hold`);
        }
      } else if (targetColumn === 'Completed') {
        if (currentStatus === 'In Progress' || currentStatus === 'IN_PROGRESS') {
          await onCompleteTask(taskId);
        } else {
          toast.error(`Cannot move from ${currentStatus} to Completed`);
        }
      } else if (targetColumn === 'To Do') {
        toast.error(`Cannot move back to To Do`);
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

  const columnOrder = ['To Do', 'In Progress', 'On Hold', 'Completed'];

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