import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import { Plus, MoreHorizontal } from 'lucide-react';

const KanbanColumn = ({ id, title, tasks, onTaskClick, userRole, reassignmentRequests = {}, onAddTask }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const getColumnStyle = (columnTitle) => {
    switch (columnTitle) {
      case 'PENDING':
      case 'To Do':
        return {
          borderColor: 'border-amber-200',
          bgColor: 'bg-amber-50/30',
          headerBg: 'bg-gradient-to-r from-amber-500 to-amber-600',
          headerText: 'text-white',
          accentColor: 'text-amber-600'
        };
      case 'In Progress':
        return {
          borderColor: 'border-blue-200',
          bgColor: 'bg-blue-50/30',
          headerBg: 'bg-gradient-to-r from-blue-500 to-blue-600',
          headerText: 'text-white',
          accentColor: 'text-blue-600'
        };
      case 'On Hold':
        return {
          borderColor: 'border-orange-200',
          bgColor: 'bg-orange-50/30',
          headerBg: 'bg-gradient-to-r from-orange-500 to-orange-600',
          headerText: 'text-white',
          accentColor: 'text-orange-600'
        };
      case 'Review':
        return {
          borderColor: 'border-purple-200',
          bgColor: 'bg-purple-50/30',
          headerBg: 'bg-gradient-to-r from-purple-500 to-purple-600',
          headerText: 'text-white',
          accentColor: 'text-purple-600'
        };
      case 'Completed':
        return {
          borderColor: 'border-emerald-200',
          bgColor: 'bg-emerald-50/30',
          headerBg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
          headerText: 'text-white',
          accentColor: 'text-emerald-600'
        };
      default:
        return {
          borderColor: 'border-slate-200',
          bgColor: 'bg-slate-50/30',
          headerBg: 'bg-gradient-to-r from-slate-500 to-slate-600',
          headerText: 'text-white',
          accentColor: 'text-slate-600'
        };
    }
  };

  const columnStyle = getColumnStyle(title);

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 rounded-xl border-2 transition-all duration-200 shadow-sm hover:shadow-md ${
        isOver
          ? 'border-blue-400 bg-blue-50/50 shadow-lg scale-[1.02]'
          : `${columnStyle.borderColor} ${columnStyle.bgColor}`
      }`}
    >
      {/* Column Header */}
      <div className={`${columnStyle.headerBg} ${columnStyle.headerText} p-4 rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-h4 font-semibold tracking-tight">
              {title}
            </h3>
            <div className={`px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm`}>
              <span className="text-caption font-medium">
                {tasks.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onAddTask && (
              <button
                onClick={() => onAddTask(title)}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors group"
                title="Add task"
              >
                <Plus size={16} className="text-white group-hover:scale-110 transition-transform" />
              </button>
            )}
            <button className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
              <MoreHorizontal size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Column Stats */}
        <div className="mt-3 flex items-center gap-4 text-white/80">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-white/60"></div>
            <span className="text-caption">
              {tasks.filter(task => task.priority === 'high').length} high priority
            </span>
          </div>
          {tasks.some(task => task.due_date) && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-white/60"></div>
              <span className="text-caption">
                {tasks.filter(task => {
                  if (!task.due_date) return false;
                  const dueDate = new Date(task.due_date);
                  const today = new Date();
                  const diffTime = dueDate - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays <= 3 && diffDays >= 0;
                }).length} due soon
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Column Content */}
      <div className="p-4 min-h-[500px] space-y-3">
        <SortableContext
          items={tasks.map(task => task.id || task._id || task.public_id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard
              key={task.id || task._id || task.public_id}
              task={task}
              onClick={() => onTaskClick(task)}
              userRole={userRole}
              reassignmentRequests={reassignmentRequests}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Plus size={20} className="text-slate-400" />
            </div>
            <p className="text-caption text-slate-500 mb-1">No tasks yet</p>
            <p className="text-meta text-slate-400">Drop tasks here or create new ones</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;