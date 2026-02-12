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
        className={`relative group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 border ${isClosurePending
            ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
            : canRequestClosure
              ? 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300 hover:shadow-md'
              : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-75'
          }`}
        title={
          isClosurePending
            ? 'Request pending approval'
            : !canRequestClosure
              ? 'All tasks must be completed first'
              : 'Request to close this project'
        }
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <div className={`p-1 rounded-full ${canRequestClosure && !isClosurePending ? 'bg-orange-100' : 'bg-gray-200'}`}>
            <Lock className="w-3.5 h-3.5" />
          </div>
        )}
        <span>{getButtonText()}</span>

        {/* Tooltip for disabled state */}
        {!canRequestClosure && !isClosurePending && !loading && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center">
            Complete all active tasks to enable
          </div>
        )}
      </button>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100 transition-all">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-6 border-b border-orange-100 flex items-start gap-4">
              <div className="bg-white p-2 rounded-xl shadow-sm border border-orange-100">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Request Project Closure</h3>
                <p className="text-sm text-gray-600 mt-1">
                  You are about to request closure for <span className="font-semibold text-gray-900">"{project.name || project.title}"</span>.
                </p>
              </div>
            </div>

            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Closure <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide a detailed reason for closing this project..."
                  className="w-full p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm min-h-[120px]"
                  maxLength={500}
                  autoFocus
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400 pointer-events-none">
                  {reason.length}/500
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                This request will be sent to the Admin for final approval.
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setReason('');
                }}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestClosure}
                disabled={loading || !reason.trim()}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </span>
                ) : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectClosureRequestButton;