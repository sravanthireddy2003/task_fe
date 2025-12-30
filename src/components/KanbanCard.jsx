import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, User, Flag, Calendar } from 'lucide-react';

const KanbanCard = ({ task, onClick, isDragging = false, userRole, reassignmentRequests = {} }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id || task._id || task.public_id,
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
  const reassignmentRequest = reassignmentRequests[taskId];
  const hasPendingReassignment = reassignmentRequest?.status === 'PENDING';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(hasPendingReassignment ? {} : { ...listeners })}
      className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
        isDragging || isSortableDragging ? 'opacity-50' : ''
      } ${
        hasPendingReassignment ? 'border-orange-300 bg-orange-50 opacity-75 cursor-not-allowed' : 'cursor-pointer'
      }`}
      onClick={hasPendingReassignment ? undefined : onClick}
    >
      {/* Task Title */}
      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
        {task.title || task.name || 'Untitled Task'}
      </h4>

      {/* Task Description */}
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Project Name */}
      {task.project && (
        <div className="text-xs text-gray-500 mb-2">
          📁 {task.project.name || task.project.title || 'Project'}
        </div>
      )}

      {/* Priority */}
      {task.priority && (
        <div className="flex items-center gap-1 mb-2">
          <Flag className={`w-3 h-3 ${getPriorityColor(task.priority)}`} />
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>
      )}

      {/* Assigned Users */}
      {assignedUsers.length > 0 && (
        <div className="flex items-center gap-1 mb-2">
          <User className="w-3 h-3 text-gray-400" />
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
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-600">
            Due {formatDate(task.due_date)}
          </span>
        </div>
      )}

      {/* Timer/Time Tracking */}
      {task.total_duration && (
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-600">
            {Math.floor(task.total_duration / 3600)}h {Math.floor((task.total_duration % 3600) / 60)}m
          </span>
        </div>
      )}

      {/* Reassignment Status */}
      {hasPendingReassignment && (
        <div className="mt-2 text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded">
          Reassignment Pending
        </div>
      )}
    </div>
  );
};

export default KanbanCard;