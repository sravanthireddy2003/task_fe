// import React, { useState, useEffect, useMemo } from 'react';
// import {
//   DndContext,
//   DragOverlay,
//   closestCenter,
//   KeyboardSensor,
//   PointerSensor,
//   useSensor,
//   useSensors,
// } from '@dnd-kit/core';
// import {
//   arrayMove,
//   SortableContext,
//   sortableKeyboardCoordinates,
//   verticalListSortingStrategy,
// } from '@dnd-kit/sortable';
// import { createPortal } from 'react-dom';
// import KanbanColumn from './KanbanColumn';
// import KanbanCard from './KanbanCard';
// import TaskModal from './TaskModal';
// import { toast } from 'sonner';

// const KanbanBoard = ({
//   tasks = [],
//   kanbanData,
//   onUpdateTask,
//   onStartTask,
//   onPauseTask,
//   onResumeTask,
//   onCompleteTask,
//   onLoadTasks,
//   userRole = 'employee',
//   projectId = null,
//   reassignmentRequests = {}
// }) => {
//   const [activeTask, setActiveTask] = useState(null);
//   const [selectedTask, setSelectedTask] = useState(null);
//   const [showTaskModal, setShowTaskModal] = useState(false);

//   const sensors = useSensors(
//     useSensor(PointerSensor),
//     useSensor(KeyboardSensor, {
//       coordinateGetter: sortableKeyboardCoordinates,
//     })
//   );

//   // Organize tasks into columns based on status
//   const columns = useMemo(() => {
//     console.log('KanbanBoard columns useMemo:', { kanbanData, tasks });
    
//     // Define the standard columns from the guide
//     const standardColumns = {
//       'To Do': [],
//       'In Progress': [],
//       'On Hold': [],
//       'Completed': []
//     };

//     if (kanbanData && Array.isArray(kanbanData) && kanbanData.length > 0) {
//       return kanbanData.reduce((acc, group) => {
//         // Map uppercase status values to display names
//         let displayStatus = 'To Do';
//         const normalizedStatus = (group.status || '').toUpperCase();
        
//         if (normalizedStatus === 'PENDING' || normalizedStatus === 'TO_DO') {
//           displayStatus = 'To Do';
//         } else if (normalizedStatus === 'IN_PROGRESS') {
//           displayStatus = 'In Progress';
//         } else if (normalizedStatus === 'ON_HOLD') {
//           displayStatus = 'On Hold';
//         } else if (normalizedStatus === 'COMPLETED') {
//           displayStatus = 'Completed';
//         }
        
//         if (acc[displayStatus]) {
//           acc[displayStatus] = [...acc[displayStatus], ...(group.tasks || [])];
//         } else {
//           acc[displayStatus] = group.tasks || [];
//         }
//         return acc;
//       }, standardColumns);
//     } else {
//       return ({
//         'To Do': tasks.filter(task => {
//           const s = (task.status || task.stage || '').toUpperCase();
//           return s === 'PENDING' || s === 'TO_DO';
//         }),
//         'In Progress': tasks.filter(task => {
//           const s = (task.status || task.stage || '').toUpperCase();
//           return s === 'IN_PROGRESS';
//         }),
//         'On Hold': tasks.filter(task => {
//           const s = (task.status || task.stage || '').toUpperCase();
//           return s === 'ON_HOLD';
//         }),
//         'Completed': tasks.filter(task => {
//           const s = (task.status || task.stage || '').toUpperCase();
//           return s === 'COMPLETED';
//         })
//       });
//     }
//   }, [tasks, kanbanData]);

//   const handleDragStart = (event) => {
//     const { active } = event;
//     const task = tasks.find(t => t.id === active.id || t._id === active.id || t.public_id === active.id);
//     if (!task) return;

//     // Block if task is locked
//     if (task.is_locked === true) {
//       toast.error('This task is locked and cannot be moved until your manager responds.');
//       return;
//     }

//     // Block if completed
//     if (task.status === 'Completed') {
//       toast.error('Completed tasks cannot be moved. Task is locked.');
//       return;
//     }

//     // Block if pending reassignment request
//     const taskId = task.id || task._id || task.public_id;
//     const reassignmentRequest = reassignmentRequests[taskId];
//     if (reassignmentRequest?.status === 'PENDING') {
//       toast.error('You have submitted a reassignment request. Task is locked until manager responds.');
//       return;
//     }

//     setActiveTask(task);
//   };

//   const handleDragEnd = async (event) => {
//     const { active, over } = event;
//     setActiveTask(null);

//     if (!over) return;

//     const activeId = active.id;
//     const overId = over.id;

//     // Find the task
//     const task = tasks.find(t => t.id === activeId || t._id === activeId || t.public_id === activeId);
//     if (!task) return;

//     // Block if task is locked
//     if (task.is_locked === true) {
//       toast.error('This task is locked and cannot be moved until your manager responds.');
//       return;
//     }

//     // Block if completed
//     if (task.status === 'Completed') {
//       toast.error('Completed tasks cannot be moved. Task is locked.');
//       return;
//     }

//     // Block if pending reassignment request
//     const taskId = task.id || task._id || task.public_id;
//     const reassignmentRequest = reassignmentRequests[taskId];
//     if (reassignmentRequest?.status === 'PENDING') {
//       toast.error('You have submitted a reassignment request. Task is locked until manager responds.');
//       return;
//     }

//     // Determine target column
//     let targetColumn = null;

//     // Check if dropped on a column
//     if (Object.keys(columns).includes(overId)) {
//       targetColumn = overId;
//     } else {
//       // Find which column the over item belongs to
//       for (const [columnName, columnTasks] of Object.entries(columns)) {
//         const foundIndex = columnTasks.findIndex(t =>
//           t.id === overId || t._id === overId || t.public_id === overId
//         );
//         if (foundIndex !== -1) {
//           targetColumn = columnName;
//           break;
//         }
//       }
//     }

//     if (!targetColumn) return;

//     const currentStatus = task.status || task.stage;

//     // Strict Kanban Workflow Transitions
//     try {
//       if (targetColumn === 'In Progress') {
//         if (currentStatus === 'PENDING' || currentStatus === 'Pending' || currentStatus === 'To Do' || 
//             currentStatus === 'PENDING' || currentStatus === 'TO_DO' || currentStatus === 'TO DO') {
//           await onStartTask(taskId);
//         } else if (currentStatus === 'On Hold' || currentStatus === 'ON_HOLD') {
//           await onResumeTask(taskId);
//         } else {
//           toast.error(`Cannot move from ${currentStatus} to In Progress`);
//         }
//       } else if (targetColumn === 'On Hold') {
//         if (currentStatus === 'In Progress' || currentStatus === 'IN_PROGRESS') {
//           await onPauseTask(taskId);
//         } else {
//           toast.error(`Cannot move from ${currentStatus} to On Hold`);
//         }
//       } else if (targetColumn === 'Completed') {
//         if (currentStatus === 'In Progress' || currentStatus === 'IN_PROGRESS') {
//           await onCompleteTask(taskId);
//         } else {
//           toast.error(`Cannot move from ${currentStatus} to Completed`);
//         }
//       } else if (targetColumn === 'To Do') {
//         toast.error(`Cannot move back to To Do`);
//       }
//     } catch (error) {
//       console.error('Failed to update task status:', error);
//     }
//   };

//   const handleTaskClick = (task) => {
//     setSelectedTask(task);
//     setShowTaskModal(true);
//   };

//   const handleCloseModal = () => {
//     setShowTaskModal(false);
//     setSelectedTask(null);
//   };

//   const columnOrder = ['To Do', 'In Progress', 'On Hold', 'Completed'];

//   return (
//     <div className="w-full">
//       <DndContext
//         sensors={sensors}
//         collisionDetection={closestCenter}
//         onDragStart={handleDragStart}
//         onDragEnd={handleDragEnd}
//       >
//         <div className="flex gap-6 overflow-x-auto pb-6">
//           {columnOrder.map((columnName) => (
//             <KanbanColumn
//               key={columnName}
//               id={columnName}
//               title={columnName}
//               tasks={columns[columnName] || []}
//               onTaskClick={handleTaskClick}
//               userRole={userRole}
//               reassignmentRequests={reassignmentRequests}
//             />
//           ))}
//         </div>

//         {createPortal(
//           <DragOverlay>
//             {activeTask ? (
//               <KanbanCard
//                 task={activeTask}
//                 isDragging
//                 onClick={() => {}}
//                 userRole={userRole}
//               />
//             ) : null}
//           </DragOverlay>,
//           document.body
//         )}
//       </DndContext>

//       {showTaskModal && selectedTask && (
//         <TaskModal
//           task={selectedTask}
//           onClose={handleCloseModal}
//           onUpdate={onUpdateTask}
//           userRole={userRole}
//           projectId={projectId}
//         />
//       )}
//     </div>
//   );
// };

// export default KanbanBoard;


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
  reassignmentRequests = {}
}) => {
  const [activeTask, setActiveTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Check if task is locked
  const isTaskLocked = (task) => {
    return task?.is_locked || task?.lock_info?.is_locked || false;
  };

  // Check if task is in review
  const isTaskInReview = (task) => {
    if (!task) return false;
    const s = (task.status || task.stage || task.task_status?.current_status || '').toString().toLowerCase();
    return s === 'review' || s === 'in_review' || s.includes('review');
  };

  // Check if task has pending reassignment
  const hasPendingReassignment = (task) => {
    const taskId = normalizeId(task);
    return reassignmentRequests[taskId]?.status === 'PENDING' || isTaskLocked(task);
  };

  // Check if task is completed
  const isTaskCompleted = (task) => {
    const status = (task.status || '').toLowerCase();
    return status === 'completed';
  };

  // Organize tasks into columns based on status
  const columns = useMemo(() => {
    console.log('KanbanBoard columns useMemo:', { kanbanData, tasks });
    
    // Define the standard columns from the guide - including Review
    const standardColumns = {
      'To Do': [],
      'In Progress': [],
      'Review': [],
      'On Hold': [],
      'Completed': []
    };

    // If we have kanban data from API, use it
    if (kanbanData && Array.isArray(kanbanData) && kanbanData.length > 0) {
      const columnsMap = { ...standardColumns };
      
      kanbanData.forEach((group) => {
        // Map group status to column name
        let columnName = 'To Do';
        const normalizedStatus = (group.status || '').toUpperCase();
        
        switch(normalizedStatus) {
          case 'PENDING':
          case 'TO DO':
          case 'TO_DO':
            columnName = 'To Do';
            break;
          case 'IN PROGRESS':
          case 'IN_PROGRESS':
            columnName = 'In Progress';
            break;
          case 'REVIEW':
            columnName = 'Review';
            break;
          case 'ON HOLD':
          case 'ON_HOLD':
            columnName = 'On Hold';
            break;
          case 'COMPLETED':
            columnName = 'Completed';
            break;
          default:
            columnName = 'To Do';
        }
        
        if (group.tasks && Array.isArray(group.tasks)) {
          if (columnsMap[columnName]) {
            columnsMap[columnName] = [...columnsMap[columnName], ...group.tasks];
          } else {
            columnsMap[columnName] = group.tasks;
          }
        }
      });
      
      return columnsMap;
    } else {
      // Fallback: organize tasks manually
      return {
        'To Do': tasks.filter(task => {
          const s = (task.status || task.stage || '').toUpperCase();
          return s === 'PENDING' || s === 'TO_DO' || s === 'TO DO' || s === 'TODO';
        }),
        'In Progress': tasks.filter(task => {
          const s = (task.status || task.stage || '').toUpperCase();
          return s === 'IN_PROGRESS' || s === 'IN PROGRESS';
        }),
        'Review': tasks.filter(task => {
          const s = (task.status || task.stage || '').toUpperCase();
          return s === 'REVIEW';
        }),
        'On Hold': tasks.filter(task => {
          const s = (task.status || task.stage || '').toUpperCase();
          return s === 'ON_HOLD' || s === 'ON HOLD' || s === 'On Hold';
        }),
        'Completed': tasks.filter(task => {
          const s = (task.status || task.stage || '').toUpperCase();
          return s === 'COMPLETED';
        })
      };
    }
  }, [tasks, kanbanData]);

  const handleDragStart = (event) => {
    const { active } = event;
    console.log('Drag start:', active);
    
    // Find the task being dragged
    const task = tasks.find(t => 
      normalizeId(t) === active.id || 
      t.id === active.id || 
      t.public_id === active.id
    );
    
    if (!task) {
      console.log('Task not found for drag start');
      return;
    }

    // Block if task is locked
    if (isTaskLocked(task)) {
      toast.error('This task is locked and cannot be moved until your manager responds.');
      event.preventDefault();
      return;
    }

    // Block dragging review tasks for regular employees to avoid accidental moves to Completed
    if (isTaskInReview(task) && userRole === 'employee') {
      toast.error('Tasks in review cannot be moved. Wait for manager response.');
      event.preventDefault();
      return;
    }

    // Block if completed
    if (isTaskCompleted(task)) {
      toast.error('Completed tasks cannot be moved. Task is locked.');
      event.preventDefault();
      return;
    }

    // Block if pending reassignment request
    if (hasPendingReassignment(task)) {
      toast.error('You have submitted a reassignment request. Task is locked until manager responds.');
      event.preventDefault();
      return;
    }

    setActiveTask(task);
    setIsDragging(true);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    console.log('Drag end:', { active, over });
    
    setActiveTask(null);
    setIsDragging(false);

    if (!over) {
      console.log('No drop target');
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    // Find the task
    const task = tasks.find(t => 
      normalizeId(t) === activeId || 
      t.id === activeId || 
      t.public_id === activeId
    );
    
    if (!task) {
      console.log('Task not found for drag end');
      toast.error('Task not found');
      return;
    }

    // Block if task is locked
    if (isTaskLocked(task)) {
      toast.error('This task is locked and cannot be moved until your manager responds.');
      return;
    }

    // Block if completed
    if (isTaskCompleted(task)) {
      toast.error('Completed tasks cannot be moved. Task is locked.');
      return;
    }

    // Block if pending reassignment request
    if (hasPendingReassignment(task)) {
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
        const foundTask = columnTasks.find(t => 
          normalizeId(t) === overId || 
          t.id === overId || 
          t.public_id === overId
        );
        if (foundTask) {
          targetColumn = columnName;
          break;
        }
      }
    }

    if (!targetColumn) {
      console.log('Target column not found');
      return;
    }

    const taskId = getTaskIdForApi(task);
    const currentStatus = (task.status || task.stage || '').toLowerCase();
    
    console.log('Drag operation:', {
      taskId,
      task,
      currentStatus,
      targetColumn,
      taskTitle: task.title
    });

    // Strict Kanban Workflow Transitions
    try {
      if (targetColumn === 'In Progress') {
        if (currentStatus === 'pending' || currentStatus === 'to do') {
          // Start task
          if (onStartTask) {
            await onStartTask(task);
          } else {
            // Fallback: direct API call
            await updateTaskStatus(taskId, 'IN_PROGRESS');
          }
          toast.success('Task started successfully');
        } else if (currentStatus === 'on hold' || currentStatus === 'on_hold') {
          // Resume task
          if (onResumeTask) {
            await onResumeTask(task);
          } else {
            await updateTaskStatus(taskId, 'IN_PROGRESS');
          }
          toast.success('Task resumed successfully');
        } else {
          toast.error(`Cannot move from ${currentStatus} to In Progress`);
          return;
        }
      } else if (targetColumn === 'On Hold') {
        if (currentStatus === 'in_progress' || currentStatus === 'in progress') {
          // Pause task
          if (onPauseTask) {
            await onPauseTask(task);
          } else {
            await updateTaskStatus(taskId, 'ON_HOLD');
          }
          toast.success('Task paused successfully');
        } else {
          toast.error(`Cannot move from ${currentStatus} to On Hold`);
          return;
        }
      } else if (targetColumn === 'Review') {
        if (currentStatus === 'in_progress' || currentStatus === 'in progress') {
          // Move to Review - use status update API as per Postman collection
          await updateTaskStatus(taskId, 'Review');
          toast.success('Review requested — sent for manager approval');
        } else {
          toast.error(`Cannot move from ${currentStatus} to Review`);
          return;
        }
      } else if (targetColumn === 'Completed') {
        if (currentStatus === 'in_progress' || currentStatus === 'in progress' ||
            (currentStatus === 'review' && (userRole === 'manager' || userRole === 'admin'))) {
          // Complete task
          if (onCompleteTask) {
            await onCompleteTask(task);
          } else {
            await updateTaskStatus(taskId, 'COMPLETED');
          }
          toast.success('Task completed successfully');
        } else {
          toast.error(`Cannot move from ${currentStatus} to Completed`);
          return;
        }
      } else if (targetColumn === 'To Do') {
        if (currentStatus === 'on hold' || currentStatus === 'on_hold') {
          // Move back to To Do (only from On Hold)
          if (onUpdateTask) {
            await onUpdateTask(task, { status: 'PENDING' });
          } else {
            await updateTaskStatus(taskId, 'PENDING');
          }
          toast.success('Task moved back to To Do');
        } else {
          toast.error(`Cannot move from ${currentStatus} to To Do`);
          return;
        }
      }

      // Refresh tasks after successful update
      if (onLoadTasks) {
        setTimeout(() => {
          onLoadTasks();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error(error.message || 'Failed to update task status');
    }
  };

  // Fallback function for updating task status
  const updateTaskStatus = async (taskId, status) => {
    try {
      console.log('updateTaskStatus called with:', { taskId, status, projectId });
      
      const res = await httpPatchService(`api/tasks/${taskId}/status`, {
        taskId: taskId,  // Include taskId in body as well
        status: status,
        projectId: getProjectIdForApi(projectId)
      });
      
      if (res?.success === false) {
        throw new Error(res.error || 'Failed to update task status');
      }
      
      return res;
    } catch (error) {
      console.error('updateTaskStatus error:', error);
      throw error;
    }
  };

  // Remove TaskModal opening on Kanban card click
  const handleTaskClick = () => {};

  const handleCloseModal = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    setIsDragging(false);
  };

  const columnOrder = ['To Do', 'In Progress', 'Review', 'On Hold', 'Completed'];

  // Get all task IDs for SortableContext
  const allTaskIds = useMemo(() => {
    const ids = [];
    columnOrder.forEach(columnName => {
      columns[columnName]?.forEach(task => {
        const id = normalizeId(task);
        if (id) ids.push(id);
      });
    });
    return ids;
  }, [columns]);

  return (
    <div className="w-full overflow-x-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
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
                isTaskLocked={isTaskLocked}
                isTaskCompleted={isTaskCompleted}
                // Pass lock_info/task_status for each task (KanbanCard reads from task)
              />
          ))}
        </div>

        {createPortal(
          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <KanbanCard
                task={activeTask}
                isDragging
                onClick={() => {}}
                userRole={userRole}
                reassignmentRequests={reassignmentRequests}
                isLocked={isTaskLocked(activeTask)}
                isCompleted={isTaskCompleted(activeTask)}
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