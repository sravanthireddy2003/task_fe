import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';

const KanbanColumn = ({ id, title, tasks, onTaskClick, userRole }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const getColumnColor = (columnTitle) => {
    switch (columnTitle) {
      case 'PENDING':
        return 'border-yellow-300 bg-yellow-50';
      case 'To Do':
        return 'border-gray-300 bg-gray-50';
      case 'In Progress':
        return 'border-blue-300 bg-blue-50';
      case 'On Hold':
        return 'border-red-300 bg-red-50';
      case 'Review':
        return 'border-purple-300 bg-purple-50';
      case 'Completed':
        return 'border-green-300 bg-green-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getHeaderColor = (columnTitle) => {
    switch (columnTitle) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'To Do':
        return 'bg-gray-100 text-gray-700';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700';
      case 'On Hold':
        return 'bg-red-100 text-red-700';
      case 'Review':
        return 'bg-purple-100 text-purple-700';
      case 'Completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 border-2 rounded-lg transition-colors ${
        isOver ? 'border-blue-500 bg-blue-25' : getColumnColor(title)
      }`}
    >
      <div className={`p-4 border-b ${getHeaderColor(title)} rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm uppercase tracking-wide">
            {title}
          </h3>
          <span className="text-xs font-medium bg-white bg-opacity-50 px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="p-4 min-h-[400px]">
        <SortableContext
          items={tasks.map(task => task.id || task._id || task.public_id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {tasks.map((task) => (
              <KanbanCard
                key={task.id || task._id || task.public_id}
                task={task}
                onClick={() => onTaskClick(task)}
                userRole={userRole}
              />
            ))}
          </div>
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            No tasks in {title.toLowerCase()}
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;