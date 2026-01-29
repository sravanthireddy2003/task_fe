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
import { httpPatchService, httpPostService } from '../App/httpHandler';

// Helper function to normalize ID
const normalizeId = (entity) => {
  if (!entity) return '';
  if (typeof entity === 'string' || typeof entity === 'number') {
    return String(entity);
  }
  const id = entity.id || entity.public_id || entity.internal_id || entity.internalId || entity._id;
  if (id !== undefined && id !== null) {
    return String(id);
  }
  return '';
};

// Helper to get task ID for API calls - ensure integer ID
const getTaskIdForApi = (task) => {
  const id = task?.id || task?.public_id || task?.internal_id;
  // Convert to integer if it's a string number
  if (typeof id === 'string' && /^\d+$/.test(id)) {
    return parseInt(id, 10);
  }
  return id;
};

// Helper to get project ID for API calls - ensure integer ID
const getProjectIdForApi = (projectId) => {
  if (typeof projectId === 'string' && /^\d+$/.test(projectId)) {
    return parseInt(projectId, 10);
  }
  return projectId;
};

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
  reassignmentRequests = {},
  isTaskReadOnly = () => false
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

    // Always organize tasks by their current status from the tasks array
    // This ensures immediate visual feedback when task status changes
    const organizedColumns = {
      'To Do': tasks.filter(task => {
        const s = (task.status || task.stage || '').toUpperCase();
        return s === 'PENDING' || s === 'TO_DO' || s === 'TODO';
      }),
      'In Progress': tasks.filter(task => {
        const s = (task.status || task.stage || '').toUpperCase();
        return s === 'IN_PROGRESS' || s === 'IN PROGRESS';
      }),
      'On Hold': tasks.filter(task => {
        const s = (task.status || task.stage || '').toUpperCase();
        return s === 'ON_HOLD' || s === 'ON HOLD';
      }),
      'Review': tasks.filter(task => {
        const s = (task.status || task.stage || '').toUpperCase();
        return s === 'REVIEW';
      }),
      'Completed': tasks.filter(task => {
        const s = (task.status || task.stage || '').toUpperCase();
        return s === 'COMPLETED' || s === 'COMPLETE';
      })
    };

    // If kanbanData is available, use it to add any additional metadata like counts
    if (kanbanData && Array.isArray(kanbanData) && kanbanData.length > 0) {
      kanbanData.forEach(group => {
        const normalizedStatus = (group.status || '').toUpperCase();
        let displayStatus = 'To Do';

        if (normalizedStatus === 'PENDING' || normalizedStatus === 'TO_DO') {
          displayStatus = 'To Do';
        } else if (normalizedStatus === 'IN_PROGRESS') {
          displayStatus = 'In Progress';
        } else if (normalizedStatus === 'ON_HOLD') {
          displayStatus = 'On Hold';
        } else if (normalizedStatus === 'REVIEW') {
          displayStatus = 'Review';
        } else if (normalizedStatus === 'COMPLETED') {
          displayStatus = 'Completed';
        }

        // Add any tasks from kanbanData that might be missing from tasks array
        if (group.tasks && Array.isArray(group.tasks)) {
          group.tasks.forEach(kanbanTask => {
            const existsInTasks = tasks.some(task =>
              task.id === kanbanTask.id ||
              task._id === kanbanTask._id ||
              task.public_id === kanbanTask.public_id
            );
            if (!existsInTasks) {
              organizedColumns[displayStatus] = [...organizedColumns[displayStatus], kanbanTask];
            }
          });
        }
      });
    }

    return organizedColumns;
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

    // Block if task is readonly
    if (isTaskReadOnly(task)) {
      toast.error('You have readonly access to this task and cannot move it.');
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
    const taskId = getTaskIdForApi(task);

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
      } else if (targetColumn === 'Review') {
        if (currentStatus === 'In Progress' || currentStatus === 'IN_PROGRESS') {
          await onCompleteTask(taskId);
        } else {
          toast.error(`Cannot move from ${currentStatus} to Review`);
        }
      } else if (targetColumn === 'To Do') {
        // Allow moving back to To Do from In Progress or On Hold
        if (currentStatus === 'In Progress' || currentStatus === 'IN_PROGRESS' || 
            currentStatus === 'On Hold' || currentStatus === 'ON_HOLD') {
          // This would require a custom API call or status update
          toast.error('Moving back to To Do is not currently supported');
        } else {
          toast.error(`Cannot move from ${currentStatus} to To Do`);
        }
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to update task status');
      console.error('Drag end error:', error);
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

  return (
    <div className="h-full w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full gap-6 overflow-x-auto pb-6">
          {Object.entries(columns).map(([columnName, columnTasks]) => (
            <KanbanColumn
              key={columnName}
              id={columnName}
              title={columnName}
              tasks={columnTasks}
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
                isDragging={true}
                userRole={userRole}
                reassignmentRequests={reassignmentRequests}
              />
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {/* Removed TaskModal opening on Kanban card click as requested */}
    </div>
  );
};

export default KanbanBoard;
