import React, { useState, useEffect } from 'react';
import { X, Lock, Clock } from 'lucide-react';
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';

const ReassignTaskRequestModal = ({ selectedTask, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [loadingTaskStatus, setLoadingTaskStatus] = useState(true);

  // ✅ Check task lock status on mount
  useEffect(() => {
    const checkTaskStatus = async () => {
      if (!selectedTask?.public_id && !selectedTask?.id) return;
      
      try {
        const publicId = selectedTask.public_id || selectedTask.id;
        const resp = await fetchWithTenant(`/api/tasks/${publicId}/reassign-requests`);
        
        if (resp.success) {
          const hasPending = resp.summary?.has_pending_requests;
          const taskLocked = resp.summary?.task_is_locked;
          
          setIsLocked(hasPending || taskLocked);
        }
      } catch (err) {
        console.log('Status check failed:', err.message);
      } finally {
        setLoadingTaskStatus(false);
      }
    };

    checkTaskStatus();
  }, [selectedTask]);

  if (!selectedTask || loadingTaskStatus) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please provide a reason for the reassignment request');
      return;
    }

    // ✅ Early exit if locked
    if (isLocked) {
      toast.error('Task is ON HOLD - Awaiting manager response');
      return;
    }

    setSubmitting(true);
    try {
      const publicId = selectedTask.public_id || selectedTask.id || selectedTask._id;
      
      const resp = await fetchWithTenant(`/api/tasks/${publicId}/request-reassignment`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason.trim() }),
      });

      if (resp.success) {
        toast.success(resp?.message || '✅ Task ON HOLD - Awaiting manager response');
        
        // Update parent with full response (including lock status)
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(resp);
        }
        
        setReason('');
        onClose();
      } else {
        toast.error(resp?.error || 'Failed to submit request');
      }
    } catch (err) {
      // ✅ Handle specific lock error
      if (err?.error?.includes('ON HOLD') || err?.error?.includes('LOCKED')) {
        setIsLocked(true);
        toast.error('Task is ON HOLD - Cannot request reassignment');
      } else {
        toast.error(err?.message || 'Failed to submit reassignment request');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          disabled={submitting}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-2 ${
            isLocked 
              ? 'bg-orange-100 text-orange-800 border border-orange-200' 
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            {isLocked ? <Lock className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            {isLocked ? 'Task ON HOLD' : 'Request Reassignment'}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {isLocked ? 'Task Locked' : 'Request Task Reassignment'}
          </h3>
          <p className="text-sm text-gray-500">
            {isLocked 
              ? 'Awaiting manager response before reassignment' 
              : 'Submit a request to your manager to reassign this task'
            }
          </p>
        </div>

        {/* Task Details Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            📋 Task Details
          </h4>
          <div className="space-y-1 text-sm">
            <p className="text-gray-900 font-medium">"{selectedTask.title}"</p>
            {selectedTask.status && (
              <p className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                selectedTask.status === 'On Hold' 
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {selectedTask.status}
              </p>
            )}
            {selectedTask.currentAssignee && (
              <p className="text-xs text-gray-500">
                Assigned to: {selectedTask.currentAssignee}
              </p>
            )}
          </div>
        </div>

        {/* Locked State */}
        {isLocked && (
          <div className="text-center py-8">
            <Lock className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              This task cannot be reassigned until your manager responds.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* Form - Only show if not locked */}
        {!isLocked && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Reassignment <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical min-h-[100px] transition-all"
                placeholder="Explain why you need this task reassigned (workload, expertise, priority shift, etc.)"
                disabled={submitting}
                required
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span>•</span> Your manager will review within 24 hours
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting || !reason.trim()}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                {submitting 
                  ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Submitting to manager...
                    </>
                  ) 
                  : 'Send Reassignment Request'
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReassignTaskRequestModal;
