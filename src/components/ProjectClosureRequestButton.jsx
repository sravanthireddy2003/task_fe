import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Lock, Loader2, AlertTriangle } from 'lucide-react';
import { requestProjectClosure } from '../redux/slices/workflowSlice';
import { selectUser } from '../redux/slices/authSlice';

/**
 * ProjectClosureRequestButton - Allows managers to request project closure
 * Only shows when:
 * - User is MANAGER
 * - Project status is ACTIVE
 * - ALL tasks in project are COMPLETED
 * Can accept either tasks array or task summary counts
 */
const ProjectClosureRequestButton = ({ project, tasks = [], taskSummary }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reason, setReason] = useState('');

  // Only show for managers
  const isManager = user?.role?.toLowerCase() === 'manager';

  // Check if project can be closed
  const canRequestClosure = useMemo(() => {
    if (!isManager) return false;
    if (!project) return false;

    // Project must be active
    const projectActive = project.status === 'ACTIVE' || project.status === 'active';

    // All tasks must be completed
    let allTasksCompleted = false;
    if (taskSummary) {
      // Use summary data
      const total = taskSummary.total || 0;
      const completed = taskSummary.completed || 0;
      const inProgress = taskSummary.inProgress || 0;
      allTasksCompleted = total > 0 && total === completed && inProgress === 0;
    } else {
      // Use tasks array
      allTasksCompleted = tasks.length > 0 &&
        tasks.every(task => task.status === 'COMPLETED' || task.status === 'completed');
    }

    return projectActive && allTasksCompleted;
  }, [isManager, project, tasks, taskSummary]);

  // Check if project closure is pending approval
  const isClosurePending = project?.status === 'PENDING_FINAL_APPROVAL' || project?.status === 'pending_final_approval';

  // Check if project is already closed
  const isProjectClosed = project?.status === 'CLOSED' || project?.status === 'closed';

  if (!isManager || isProjectClosed) return null;

  const handleRequestClosure = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for project closure');
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(requestProjectClosure({
        projectId: project.id || project._id,
        reason: reason.trim()
      })).unwrap();

      // Handle the response structure
      if (result && result.success) {
        toast.warning(result.message || 'Project closure requested successfully');

        // Update project status locally if provided in response
        if (result.data && result.data.projectStatus) {
          // Note: This assumes the parent component will handle refreshing project data
          // or we could emit an event to refresh the project list
        }

        setShowConfirmModal(false);
        setReason('');
      } else {
        throw new Error(result?.message || 'Failed to request project closure');
      }
    } catch (error) {
      toast.error(error?.message || error || 'Failed to request project closure');
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (isClosurePending) {
      return 'Closure Request Pending Admin Approval';
    }

    if (!canRequestClosure) {
      const incompleteTasks = tasks.filter(task =>
        task.status !== 'COMPLETED' && task.status !== 'completed'
      ).length;
      return `Complete ${incompleteTasks} task${incompleteTasks !== 1 ? 's' : ''} to close project`;
    }
    return 'Request Project Closure';
  };

  return (
    <>
      <button
        onClick={() => !isClosurePending && setShowConfirmModal(true)}
        disabled={!canRequestClosure || loading || isClosurePending}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          isClosurePending
            ? 'text-gray-500 bg-gray-200 cursor-not-allowed'
            : canRequestClosure
            ? 'text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400'
            : 'text-gray-500 bg-gray-200 cursor-not-allowed'
        }`}
        title={
          isClosurePending
            ? 'Project closure request is pending admin approval. You cannot send another request at this time.'
            : !canRequestClosure
            ? 'All tasks must be completed before closing the project'
            : ''
        }
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isClosurePending ? (
          <Lock className="w-4 h-4" />
        ) : (
          <Lock className="w-4 h-4" />
        )}
        {getButtonText()}
      </button>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-semibold">Request Project Closure</h3>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                This will request administrative approval to close the project "{project.name || project.title}".
              </p>
              <p className="text-sm text-gray-600">
                Please provide a reason for closing this project:
              </p>
            </div>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this project should be closed..."
              className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={4}
              maxLength={500}
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestClosure}
                disabled={loading || !reason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 rounded-md"
              >
                {loading ? 'Submitting...' : 'Request Closure'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectClosureRequestButton;