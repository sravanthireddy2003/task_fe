import React from 'react';
import SlaBadge from './SlaBadge';

// Card representing a single task within the workflow context.
// Shows status, SLA, simple progress bar, and primary workflow actions.

const TaskWorkflowCard = ({ task, userRole, onSendToReview }) => {
  const title = task?.title || task?.name || 'Untitled Task';
  const description = task?.description || '';
  const status = task?.status || task?.task_status || 'PENDING';
  const workflowState = task?.workflow_state || task?.workflowStatus || status;
  const slaDueAt = task?.sla_deadline || task?.due_date || task?.dueDate;

  const normalizedStatus = (workflowState || '').toString().toUpperCase();
  const isInReview = normalizedStatus.includes('REVIEW');

  const statusClass = (() => {
    switch (normalizedStatus) {
      case 'COMPLETED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'IN_PROGRESS':
      case 'IN PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'REVIEW':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  })();

  // Basic progress estimation: if backend includes explicit values, use them, otherwise fall back
  const stepsTotal = task?.workflow_steps_total || task?.stepsTotal || 0;
  const stepsDone = task?.workflow_steps_completed || task?.stepsCompleted || 0;
  const percent = stepsTotal > 0 ? Math.round((stepsDone / stepsTotal) * 100) : 0;

  const canSendToReview = userRole === 'employee' && !isInReview;

  return (
    <article className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
          {description && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusClass}`}>
            {workflowState || 'Pending'}
          </span>
          <SlaBadge dueAt={slaDueAt} />
        </div>
      </header>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-gray-500">
          <span>Workflow Progress</span>
          {stepsTotal > 0 && (
            <span>
              {stepsDone}/{stepsTotal} steps • {percent}%
            </span>
          )}
        </div>
        <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        </div>
      </div>

      {/* Footer actions */}
      <footer className="flex items-center justify-between pt-2">
        <div className="text-[11px] text-gray-400">
          <span>Task ID: {task?.id || task?._id || task?.public_id || '—'}</span>
        </div>
        {canSendToReview && (
          <button
            type="button"
            onClick={onSendToReview}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
          >
            Send to Review
          </button>
        )}
      </footer>
    </article>
  );
};

export default TaskWorkflowCard;
