import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as Icons from '../icons';

const KanbanCard = ({ task, onClick, isDragging = false, userRole, reassignmentRequests = {}, isReadOnly = false }) => {
  const [liveTime, setLiveTime] = useState(task.total_duration || 0);

  useEffect(() => {
    let interval;
    const status = task.status || task.stage;

    // Support multiple possible backend fields for running timer and durations.
    const isTimerRunning = Boolean(task.timer_running || (status === 'In Progress' && (task.started_at || task.timer_started_at)));
    const startAt = task.timer_started_at || task.started_at || null;
    const baseDuration = task.total_duration || task.total_time_seconds || task.timeSpent || 0;

    if (isTimerRunning && startAt) {
      const startTime = new Date(startAt).getTime();

      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setLiveTime((baseDuration || 0) + elapsed);
      }, 1000);
    } else {
      setLiveTime(baseDuration || 0);
    }

    return () => clearInterval(interval);
  }, [task.status, task.stage, task.total_duration, task.total_time_seconds, task.timeSpent, task.started_at, task.timer_started_at, task.timer_running]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id || task._id || task.public_id,
    disabled: isReadOnly, // Disable drag if read only
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getAssignedUsers = (task) => {
    const users = task.assignedUsers || task.assigned_users || [];
    return Array.isArray(users) ? users : [];
  };

  const assignedUsers = getAssignedUsers(task);
  const taskId = task.id || task._id || task.public_id;

  // Determine reassignment state from lock_info or task_status
  const lockInfo = task.lock_info || {};
  const taskStatus = task.task_status || {};
  // Prefer lock_info.request_status, fallback to task_status.request_status
  const reassignmentStatus = lockInfo.request_status || taskStatus.request_status || null;
  const hasPendingReassignment = reassignmentStatus === 'PENDING';
  const isReassignmentApproved = reassignmentStatus === 'APPROVE' || reassignmentStatus === 'APPROVED';
  const isReassignmentDenied = reassignmentStatus === 'DENY' || reassignmentStatus === 'DENIED' || reassignmentStatus === 'REJECTED';
  const isCompleted = (task.status || '').toLowerCase() === 'completed';

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(hasPendingReassignment || isCompleted || isReadOnly ? {} : { ...listeners })}
      className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative ${isDragging || isSortableDragging ? 'opacity-50' : ''
        } ${isCompleted ? 'border-green-300 bg-green-50 opacity-75 cursor-not-allowed' : ''
        } ${hasPendingReassignment ? 'border-orange-300 bg-orange-50 opacity-75 cursor-not-allowed' : ''
        } ${isReadOnly && !isCompleted && !hasPendingReassignment ? 'bg-gray-50 border-gray-200 opacity-90' : 'cursor-pointer'
        }`}
      onClick={hasPendingReassignment ? undefined : onClick}
    >
      {/* Read Only Indicator */}
      {isReadOnly && !isCompleted && !hasPendingReassignment && (
        <div className="absolute top-2 right-2 text-gray-400" title="Read Only Access">
          <Icons.Lock className="w-4 h-4" />
        </div>
      )}
      {/* Task Title */}
      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
        {task.title || task.name || 'Untitled Task'}
      </h4>

      {/* Task Description */}
      {task.description && (
        <p className="text-body-small text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Project Name */}
      {task.project && (
        <div className="text-meta mb-2">
          📁 {task.project.name || task.project.title || 'Project'}
        </div>
      )}

      {/* Priority */}
      {task.priority && (
        <div className="flex items-center gap-1 mb-2">
          <Icons.Flag className={`w-3 h-3 ${getPriorityColor(task.priority)}`} />
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>
      )}

      {/* Assigned Users */}
      {assignedUsers.length > 0 && (
        <div className="flex items-center gap-1 mb-2">
          <Icons.User className="w-3 h-3 text-gray-400" />
          <div className="flex -space-x-1">
            {assignedUsers.slice(0, 3).map((user, index) => (
              <div
                key={user.id || user._id || index}
                className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                title={user.name || user.email || 'User'}
              >
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            ))}
            {assignedUsers.length > 3 && (
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                +{assignedUsers.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Due Date */}
      {task.due_date && (
        <div className="flex items-center gap-1 mb-2">
          <Icons.CalendarDays className="w-3 h-3 text-gray-400" />
          <span className="text-caption">
            Due {formatDate(task.due_date)}
          </span>
        </div>
      )}

      {/* Timer/Time Tracking or Total Hours for Completed */}
      {isCompleted ? (
        <div className="flex items-center gap-2 mt-3 p-2 bg-green-100 rounded-lg">
          <Icons.CheckCircle2 className="w-4 h-4 text-green-600" />
          <div>
            <p className="text-caption font-semibold text-green-700">✓ Task Completed</p>
            <p className="text-caption text-green-600">
              Total: {task.total_time_hhmmss || formatDuration(task.total_time_seconds || 0)}
            </p>
          </div>
        </div>
      ) : (liveTime > 0 || (task.status || task.stage) === 'In Progress') && (
        <div className="flex items-center gap-1">
          <Icons.Clock className={`w-3 h-3 ${(task.status || task.stage) === 'In Progress' ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />
          <span className={`text-caption font-medium ${(task.status || task.stage) === 'In Progress' ? 'text-blue-600' : 'text-gray-600'}`}>
            {formatDuration(liveTime)}
          </span>
        </div>
      )}

      {/* Checklist Progress */}
      {task.checklist && task.checklist.length > 0 && (
        <div className="flex items-center gap-1 mt-2">
          <Icons.CheckSquare className="w-3 h-3 text-gray-400" />
          <span className="text-caption">
            {task.checklist.filter(i => i.status === 'Completed').length}/{task.checklist.length} items
          </span>
        </div>
      )}

      {/* Reassignment Status (Pending/Approved/Denied) */}
      {hasPendingReassignment && (
        <div className="mt-2 text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded">
          Reassignment Pending
        </div>
      )}
      {isReassignmentApproved && (
        <div className="mt-2 text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
          Reassignment Approved
        </div>
      )}
      {isReassignmentDenied && (
        <div className="mt-2 text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
          Reassignment Denied
        </div>
      )}

      {/* Completed Status Badge */}
      {isCompleted && (
        <div className="mt-2 text-xs text-green-700 bg-green-100 px-2 py-1 rounded font-semibold">
          ✓ Completed - No Further Changes
        </div>
      )}
    </div>
  );
};

export default KanbanCard;
