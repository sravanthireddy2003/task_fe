import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';
import { requestTaskCompletion } from '../redux/slices/workflowSlice';
import { selectUser } from '../redux/slices/authSlice';

/**
 * TaskRequestButton - Allows employees to request task completion approval
 * Only shows when task.status = IN_PROGRESS and user is EMPLOYEE
 * Calls POST /api/workflow/request with entityType: 'TASK'
 */
const TaskRequestButton = ({ task, projectId, onSuccess }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reason, setReason] = useState('');

  // Only show for employees and tasks in progress
  const isEmployee = user?.role?.toLowerCase() === 'employee';
  const taskStatus = (task?.status || (task?.stage || '')).toString().toUpperCase();
  const isInProgress = taskStatus === 'IN_PROGRESS' || taskStatus === 'IN PROGRESS' || taskStatus === 'INPROGRESS';

  // Determine if current user has readOnly assignment on this task
  const isUserReadOnly = (() => {
    if (!task || !user) return false;
    const assigned = task.assignedUsers || task.assigned_users || task.assigned_to || [];
    if (Array.isArray(assigned)) {
      const found = assigned.find(a =>
        String(a.id || a._id || a.internalId || a.public_id) === String(user.id || user._id || user.internal_id || user.public_id)
      );
      return found?.readOnly === true;
    }
    return false;
  })();

  const canRequest = isEmployee && isInProgress && !isUserReadOnly;

  if (!isEmployee || !isInProgress) return null;

  const handleRequest = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for completion request');
      return;
    }

    if (isUserReadOnly) {
      toast.error('You have read-only access to this task and cannot request completion');
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(requestTaskCompletion({
        taskId: task.id || task._id,
        projectId,
        reason: reason.trim()
      })).unwrap();

      toast.success('Task completion requested successfully');
      setShowReasonModal(false);
      setReason('');

      // Optimistically update task status to show "Waiting for approval"
      if (onSuccess) {
        onSuccess({ ...task, status: 'REVIEW' });
      }
    } catch (error) {
      toast.error(error || 'Failed to request task completion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => { if (!isUserReadOnly) setShowReasonModal(true); }}
        disabled={loading || isUserReadOnly}
        title={isUserReadOnly ? 'You have read-only access to this task' : ''}
        className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white ${isUserReadOnly ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} disabled:bg-blue-400 rounded-md transition-colors`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        Request Completion
      </button>

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Request Task Completion</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for requesting completion approval:
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this task is ready for completion..."
              className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowReasonModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleRequest}
                disabled={loading || !reason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskRequestButton;