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
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [hasRejectedRequest, setHasRejectedRequest] = useState(false);
  const [hasApprovedRequest, setHasApprovedRequest] = useState(false);

  // Check task reassignment status
  useEffect(() => {
    const checkTaskStatus = async () => {
      if (!selectedTask?.public_id && !selectedTask?.id) return;
      
      try {
        const publicId = selectedTask.public_id || selectedTask.id;
        const resp = await fetchWithTenant(`/api/tasks/${publicId}/reassign-requests`);
        
        if (resp.success) {
          const requests = Array.isArray(resp.data) ? resp.data : [];
          
          // Find the latest request
          const latestRequest = requests[0];
          setReassignmentRequest(latestRequest);
          
          // Check request status
          if (latestRequest) {
            switch (latestRequest.status) {
              case 'PENDING':
                setHasPendingRequest(true);
                setHasRejectedRequest(false);
                setHasApprovedRequest(false);
                setTaskIsLocked(true);
                break;
              case 'APPROVED':
                setHasPendingRequest(false);
                setHasRejectedRequest(false);
                setHasApprovedRequest(true);
                setTaskIsLocked(false);
                break;
              case 'REJECTED':
                setHasPendingRequest(false);
                setHasRejectedRequest(true);
                setHasApprovedRequest(false);
                setTaskIsLocked(false);
                break;
              default:
                setHasPendingRequest(false);
                setHasRejectedRequest(false);
                setHasApprovedRequest(false);
                setTaskIsLocked(false);
            }
          } else {
            // No previous requests
            setHasPendingRequest(false);
            setHasRejectedRequest(false);
            setHasApprovedRequest(false);
            setTaskIsLocked(false);
          }
          
          // Also check if task is locked from backend summary
          if (resp.summary?.task_is_locked) {
            setTaskIsLocked(true);
          }
        }
      } catch (err) {
        console.error('Status check failed:', err);
        toast.error('Failed to load task status');
      } finally {
        setLoadingTaskStatus(false);
      }
    };

    checkTaskStatus();
  }, [selectedTask]);

  if (!selectedTask || loadingTaskStatus) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (hasPendingRequest) {
      toast.error('You already have a pending reassignment request for this task');
      return;
    }
    
    // Check if task is locked for other reasons
    if (taskIsLocked && !hasRejectedRequest) {
      toast.error('Task is locked and cannot be reassigned at this time');
      return;
    }
    
    // Check if request was previously approved
    if (hasApprovedRequest) {
      toast.error('This task has already been reassigned. Please create a new request if needed.');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for the reassignment request');
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
        toast.success(resp?.message || 'Task reassignment request submitted');
        
        // Update local state
        setReassignmentRequest({ 
          status: 'PENDING', 
          reason: reason.trim(),
          requested_at: new Date().toISOString()
        });
        setHasPendingRequest(true);
        setTaskIsLocked(true);
        
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(resp);
        }
        setReason('');
        onClose();
      } else {
        toast.error(resp?.error || 'Failed to submit request');
        
        // Handle specific backend errors
        if (resp.error?.includes('pending') || resp.error?.includes('already exists')) {
          setHasPendingRequest(true);
          setTaskIsLocked(true);
        }
      }
    } catch (err) {
      const errorMsg = err?.message || err?.error || 'Failed to submit reassignment request';
      toast.error(errorMsg);
      
      if (errorMsg.includes('pending') || errorMsg.includes('already exists')) {
        setHasPendingRequest(true);
        setTaskIsLocked(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Status badge based on current state
  const getStatusBadge = () => {
    if (hasPendingRequest) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200">
          <Clock className="h-4 w-4 animate-pulse" />
          Request Pending
        </div>
      );
    } else if (hasRejectedRequest) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
          <AlertCircle className="h-4 w-4" />
          Request Rejected
        </div>
      );
    } else if (hasApprovedRequest) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircle className="h-4 w-4" />
          Request Approved
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
          <Clock className="h-4 w-4" />
          Request Reassignment
        </div>
      );
    }
  };

  // Determine what to show based on request status
  const renderContent = () => {
    // Pending Request - Show only status message
    if (hasPendingRequest) {
      return (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-orange-400 mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-semibold text-gray-900 mb-2">Request Already Submitted</p>
          <p className="text-gray-500 mb-6">
            You have a pending reassignment request for this task. Please wait for manager response.
          </p>
          {reassignmentRequest?.reason && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
              <p className="text-sm font-medium text-gray-700 mb-1">Your reason:</p>
              <p className="text-sm text-gray-600">{reassignmentRequest.reason}</p>
            </div>
          )}
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      );
    }
    
    // Approved Request - Task already reassigned
    if (hasApprovedRequest) {
      return (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900 mb-2">Task Already Reassigned</p>
          <p className="text-gray-500 mb-6">
            This task has already been reassigned. You cannot submit another request for the same task.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      );
    }
    
    // Rejected Request - Can submit new request
    if (hasRejectedRequest) {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">Previous request was rejected</p>
                <p className="text-sm text-red-600">
                  You can submit a new request with updated reasoning.
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              New Reason for Reassignment <span className="text-red-500">*</span>
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
            <div className="text-xs text-gray-500 mt-1 text-right">
              {reason.length}/500 characters
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
                'Submit New Request'
              )}
            </button>
          </div>
        </form>
      );
    }
    
    // Task is locked for other reasons
    if (taskIsLocked) {
      return (
        <div className="text-center py-8">
          <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900 mb-2">Task Locked</p>
          <p className="text-gray-500 mb-6">
            This task is currently locked and cannot be reassigned at this time.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      );
    }
    
    // No previous requests - Show regular form
    return (
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
    );
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
          <h3 className="text-xl font-bold text-gray-900 mb-2 mt-3">
            {hasPendingRequest ? 'Request Already Submitted' : 
             hasApprovedRequest ? 'Task Reassigned' : 
             hasRejectedRequest ? 'New Reassignment Request' : 
             'Request Task Reassignment'}
          </h3>
          <p className="text-sm text-gray-500">
            {hasPendingRequest ? 'Awaiting manager response' : 
             hasApprovedRequest ? 'This task has already been reassigned' : 
             hasRejectedRequest ? 'Submit a new request with updated reasoning' : 
             'Submit a request to your manager to reassign this task'}
          </p>
        </div>

        {/* Task Details */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="font-medium">Task Details</span>
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

        {/* Content based on status */}
        {renderContent()}

        {/* Policy note */}
        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
          <p>Only one active reassignment request allowed per task</p>
          {reassignmentRequest?.requested_at && (
            <p className="mt-1">Last request: {formatDate(reassignmentRequest.requested_at)}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReassignTaskRequestModal;