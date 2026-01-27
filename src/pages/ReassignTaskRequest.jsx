  import React, { useState, useEffect } from 'react';
import * as Icons from '../icons';

const { X, Lock, Clock, CheckCircle, AlertCircle } = Icons;
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';

const ReassignTaskRequestModal = ({ selectedTask, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingTaskStatus, setLoadingTaskStatus] = useState(true);
  const [reassignmentRequest, setReassignmentRequest] = useState(null);
  const [taskIsLocked, setTaskIsLocked] = useState(false);

  // ✅ Fixed: Use fetchWithTenant consistently and handle response structure correctly
  useEffect(() => {
    const checkTaskStatus = async () => {
      if (!selectedTask?.public_id && !selectedTask?.id) return;
      
      try {
        const publicId = selectedTask.public_id || selectedTask.id;
        const resp = await fetchWithTenant(`/api/tasks/${publicId}/reassign-requests`);
        
        if (resp.success) {
          // Backend returns { data: array | summary }
          const requests = Array.isArray(resp.data) ? resp.data : [];
          const latestRequest = requests[0];
          
          setReassignmentRequest(latestRequest);
          
          if (latestRequest?.status === 'PENDING') {
            setTaskIsLocked(true);
          } else if (resp.summary?.task_is_locked) {
            setTaskIsLocked(true);
          } else {
            setTaskIsLocked(false);
          }
        }
      } catch (err) {
        console.error('Status check failed:', err);
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

    // Prevent if pending request exists
    if (reassignmentRequest?.status === 'PENDING') {
      toast.error('You already have a pending reassignment request');
      return;
    }

    if (taskIsLocked && !reassignmentRequest?.status === 'REJECTED') {
      toast.error('Task is ON HOLD - Awaiting manager response');
      return;
    }

    setSubmitting(true);
    try {
      const publicId = selectedTask.public_id || selectedTask.id || selectedTask._id;
      
      // ✅ Fixed: Use correct fetchWithTenant POST format
      const resp = await fetchWithTenant(`/api/tasks/${publicId}/request-reassignment`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason.trim() }),
      });

      if (resp.success) {
        toast.success(resp?.message || '✅ Task ON HOLD - Awaiting manager response');
        
        // Update local state immediately
        setReassignmentRequest({ 
          status: 'PENDING', 
          reason: reason.trim(),
          requested_at: new Date().toISOString()
        });
        setTaskIsLocked(true);
        
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(resp);
        }
        setReason('');
        onClose();
      } else {
        toast.error(resp?.error || 'Failed to submit request');
      }
    } catch (err) {
      const errorMsg = err?.message || err?.error || 'Failed to submit reassignment request';
      toast.error(errorMsg);
      
      // Handle specific backend errors
      if (errorMsg.includes('Pending request exists')) {
        setTaskIsLocked(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Simplified status helpers
  const getStatusBadge = () => {
    if (reassignmentRequest?.status === 'PENDING') {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200">
          <Clock className="h-4 w-4 animate-pulse" />
          Request Pending
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
        <Clock className="h-4 w-4" />
        Request Reassignment
      </div>
    );
  };

  const shouldShowForm = () => {
    return !taskIsLocked || reassignmentRequest?.status === 'REJECTED';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          {getStatusBadge()}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {reassignmentRequest?.status === 'PENDING' ? 'Task ON HOLD' : 'Request Task Reassignment'}
          </h3>
          <p className="text-sm text-gray-500">
            {reassignmentRequest?.status === 'PENDING' 
              ? 'Awaiting manager response before reassignment' 
              : 'Submit a request to your manager to reassign this task'
            }
          </p>
        </div>

        {/* Task Details */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            📋 Task Details
          </h4>
          <div className="space-y-1 text-sm">
            <p className="text-gray-900 font-medium">"{selectedTask.title}"</p>
            {selectedTask.status && (
              <p className={`px-2 py-1 rounded-full text-xs font-medium ${
                selectedTask.status === 'On Hold' 
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {selectedTask.status}
              </p>
            )}
            {selectedTask.assignedUsers?.length > 0 && (
              <p className="text-xs text-gray-500">
                Assigned to: {selectedTask.assignedUsers.map(u => u.name).join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Pending Request Info */}
        {reassignmentRequest?.status === 'PENDING' && (
          <div className="text-center py-8 mb-6">
            <Clock className="h-12 w-12 text-orange-400 mx-auto mb-4 animate-pulse" />
            <p className="text-lg font-semibold text-gray-900 mb-2">Request Pending</p>
            <p className="text-gray-500 mb-6">
              Your manager will review within 24 hours
            </p>
            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* Form - Only show if not pending */}
        {shouldShowForm() && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Reassignment <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical min-h-[100px] transition-all"
                placeholder="Explain why you need this task reassignment (workload, expertise, priority shift, etc.)"
                disabled={submitting}
                required
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <div className="flex items-center gap-1">
                  <span>•</span> Manager will review within 24 hours
                </div>
                <div>{reason.length}/500 characters</div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting || !reason.trim()}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Send Reassignment Request'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Policy note */}
        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
          <p>⚠️ Only one active reassignment request allowed per task</p>
        </div>
      </div>
    </div>
  );
};

export default ReassignTaskRequestModal;
