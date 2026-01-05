// import React, { useState, useEffect } from 'react';
// import { X, Lock, Clock } from 'lucide-react';
// import { toast } from 'sonner';
// import fetchWithTenant from '../utils/fetchWithTenant';

// const ReassignTaskRequestModal = ({ selectedTask, onClose, onSuccess }) => {
//   const [reason, setReason] = useState('');
//   const [submitting, setSubmitting] = useState(false);
//   const [isLocked, setIsLocked] = useState(false);
//   const [loadingTaskStatus, setLoadingTaskStatus] = useState(true);

//   // ✅ Check task lock status on mount
//   useEffect(() => {
//     const checkTaskStatus = async () => {
//       if (!selectedTask?.public_id && !selectedTask?.id) return;
      
//       try {
//         const publicId = selectedTask.public_id || selectedTask.id;
//         const resp = await fetchWithTenant(`/api/tasks/${publicId}/reassign-requests`);
        
//         if (resp.success) {
//           const hasPending = resp.summary?.has_pending_requests;
//           const taskLocked = resp.summary?.task_is_locked;
          
//           setIsLocked(hasPending || taskLocked);
//         }
//       } catch (err) {
//         console.log('Status check failed:', err.message);
//       } finally {
//         setLoadingTaskStatus(false);
//       }
//     };

//     checkTaskStatus();
//   }, [selectedTask]);

//   if (!selectedTask || loadingTaskStatus) return null;

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!reason.trim()) {
//       toast.error('Please provide a reason for the reassignment request');
//       return;
//     }

//     // ✅ Early exit if locked
//     if (isLocked) {
//       toast.error('Task is ON HOLD - Awaiting manager response');
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const publicId = selectedTask.public_id || selectedTask.id || selectedTask._id;
      
//       const resp = await fetchWithTenant(`/api/tasks/${publicId}/request-reassignment`, {
//         method: 'POST',
//         body: JSON.stringify({ reason: reason.trim() }),
//       });

//       if (resp.success) {
//         toast.success(resp?.message || '✅ Task ON HOLD - Awaiting manager response');
        
//         // Update parent with full response (including lock status)
//         if (onSuccess && typeof onSuccess === 'function') {
//           onSuccess(resp);
//         }
        
//         setReason('');
//         onClose();
//       } else {
//         toast.error(resp?.error || 'Failed to submit request');
//       }
//     } catch (err) {
//       // ✅ Handle specific lock error
//       if (err?.error?.includes('ON HOLD') || err?.error?.includes('LOCKED')) {
//         setIsLocked(true);
//         toast.error('Task is ON HOLD - Cannot request reassignment');
//       } else {
//         toast.error(err?.message || 'Failed to submit reassignment request');
//       }
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
//       <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in duration-200">
//         {/* Close Button */}
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
//           disabled={submitting}
//         >
//           <X className="h-5 w-5" />
//         </button>

//         {/* Header */}
//         <div className="text-center mb-6">
//           <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-2 ${
//             isLocked 
//               ? 'bg-orange-100 text-orange-800 border border-orange-200' 
//               : 'bg-blue-100 text-blue-800 border border-blue-200'
//           }`}>
//             {isLocked ? <Lock className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
//             {isLocked ? 'Task ON HOLD' : 'Request Reassignment'}
//           </div>
//           <h3 className="text-xl font-bold text-gray-900 mb-2">
//             {isLocked ? 'Task Locked' : 'Request Task Reassignment'}
//           </h3>
//           <p className="text-sm text-gray-500">
//             {isLocked 
//               ? 'Awaiting manager response before reassignment' 
//               : 'Submit a request to your manager to reassign this task'
//             }
//           </p>
//         </div>

//         {/* Task Details Card */}
//         <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
//           <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
//             📋 Task Details
//           </h4>
//           <div className="space-y-1 text-sm">
//             <p className="text-gray-900 font-medium">"{selectedTask.title}"</p>
//             {selectedTask.status && (
//               <p className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
//                 selectedTask.status === 'On Hold' 
//                   ? 'bg-orange-100 text-orange-800' 
//                   : 'bg-gray-100 text-gray-700'
//               }`}>
//                 {selectedTask.status}
//               </p>
//             )}
//             {selectedTask.currentAssignee && (
//               <p className="text-xs text-gray-500">
//                 Assigned to: {selectedTask.currentAssignee}
//               </p>
//             )}
//           </div>
//         </div>

//         {/* Locked State */}
//         {isLocked && (
//           <div className="text-center py-8">
//             <Lock className="h-12 w-12 text-orange-400 mx-auto mb-4" />
//             <p className="text-gray-500 mb-4">
//               This task cannot be reassigned until your manager responds.
//             </p>
//             <button
//               onClick={onClose}
//               className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
//             >
//               Close
//             </button>
//           </div>
//         )}

//         {/* Form - Only show if not locked */}
//         {!isLocked && (
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Reason for Reassignment <span className="text-red-500">*</span>
//               </label>
//               <textarea
//                 value={reason}
//                 onChange={(e) => setReason(e.target.value)}
//                 className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical min-h-[100px] transition-all"
//                 placeholder="Explain why you need this task reassigned (workload, expertise, priority shift, etc.)"
//                 disabled={submitting}
//                 required
//                 maxLength={500}
//               />
//               <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
//                 <span>•</span> Your manager will review within 24 hours
//               </p>
//             </div>

//             <div className="pt-4 border-t border-gray-200">
//               <button
//                 type="submit"
//                 disabled={submitting || !reason.trim()}
//                 className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
//               >
//                 {submitting 
//                   ? (
//                     <>
//                       <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
//                       Submitting to manager...
//                     </>
//                   ) 
//                   : 'Send Reassignment Request'
//                 }
//               </button>
//             </div>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ReassignTaskRequestModal;


import React, { useState, useEffect } from 'react';
import { X, Lock, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';

const ReassignTaskRequestModal = ({ selectedTask, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [loadingTaskStatus, setLoadingTaskStatus] = useState(true);
  const [reassignmentRequest, setReassignmentRequest] = useState(null);
  const [canRequestAgain, setCanRequestAgain] = useState(false);

  // ✅ Check task reassignment request status on mount
  useEffect(() => {
    const checkTaskStatus = async () => {
      if (!selectedTask?.public_id && !selectedTask?.id) return;
      
      try {
        const publicId = selectedTask.public_id || selectedTask.id;
        const resp = await fetchWithTenant(`/api/tasks/${publicId}/reassign-requests`);
        
        console.log('Reassign request check:', resp);
        
        if (resp.success) {
          // Check if there's an existing request
          if (resp.request) {
            setReassignmentRequest(resp.request);
            
            // Set lock status based on request status
            if (resp.request.status === 'PENDING') {
              setIsLocked(true);
              setCanRequestAgain(false);
            } else if (resp.request.status === 'APPROVED') {
              setIsLocked(false); // Task is unlocked after approval
              setCanRequestAgain(false); // Cannot request again if approved
              toast.info('✅ Previous request was approved. Task can be reassigned.');
            } else if (resp.request.status === 'REJECTED') {
              setIsLocked(false); // Task is unlocked after rejection
              setCanRequestAgain(true); // Can request again if rejected
            }
          } else if (resp.task_is_locked) {
            // Task is locked for other reasons
            setIsLocked(true);
            setCanRequestAgain(false);
          } else {
            // No existing request, task is not locked
            setIsLocked(false);
            setCanRequestAgain(true);
          }
        }
      } catch (err) {
        console.log('Status check failed:', err.message);
        // Default to allowing request if API fails
        setIsLocked(false);
        setCanRequestAgain(true);
      } finally {
        setLoadingTaskStatus(false);
      }
    };

    checkTaskStatus();
  }, [selectedTask]);

  if (!selectedTask || loadingTaskStatus) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent submitting if already have a pending or approved request
    if (reassignmentRequest?.status === 'PENDING') {
      toast.error('You already have a pending reassignment request');
      return;
    }
    
    if (reassignmentRequest?.status === 'APPROVED') {
      toast.error('Your previous request was approved. Cannot submit new request.');
      return;
    }
    
    if (!reason.trim()) {
      toast.error('Please provide a reason for the reassignment request');
      return;
    }

    // ✅ Early exit if locked
    if (isLocked) {
      toast.error('Task is ON HOLD - Awaiting manager response');
      return;
    }

    // ✅ Prevent multiple submissions
    if (!canRequestAgain && reassignmentRequest) {
      toast.error('You can only submit one reassignment request per task');
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
        
        // Update local state
        setReassignmentRequest(resp.request);
        setIsLocked(true);
        setCanRequestAgain(false);
        
        // Update parent with full response
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
        setCanRequestAgain(false);
        toast.error('Task is ON HOLD - Cannot request reassignment');
      } else if (err?.error?.includes('already exists') || err?.error?.includes('already requested')) {
        setIsLocked(true);
        setCanRequestAgain(false);
        toast.error('You already have a pending reassignment request for this task');
      } else {
        toast.error(err?.message || 'Failed to submit reassignment request');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Get status badge based on request status
  const getStatusBadge = () => {
    if (!reassignmentRequest) return null;
    
    switch(reassignmentRequest.status) {
      case 'PENDING':
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-2 bg-orange-100 text-orange-800 border border-orange-200">
            <Clock className="h-4 w-4 animate-pulse" />
            Request Pending
          </div>
        );
      case 'APPROVED':
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-2 bg-green-100 text-green-800 border border-green-200">
            <CheckCircle className="h-4 w-4" />
            Request Approved
          </div>
        );
      case 'REJECTED':
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-2 bg-red-100 text-red-800 border border-red-200">
            <AlertCircle className="h-4 w-4" />
            Request Rejected
          </div>
        );
      default:
        return null;
    }
  };

  // Get message based on status
  const getStatusMessage = () => {
    if (!reassignmentRequest) {
      return 'Submit a request to your manager to reassign this task';
    }
    
    switch(reassignmentRequest.status) {
      case 'PENDING':
        return 'Awaiting manager response before reassignment';
      case 'APPROVED':
        return 'Your request was approved. Task can now be reassigned by your manager.';
      case 'REJECTED':
        return 'Your request was rejected. You can submit a new request.';
      default:
        return 'Submit a request to your manager to reassign this task';
    }
  };

  // Determine if we should show the form
  const shouldShowForm = () => {
    // Don't show form if task is locked for other reasons
    if (isLocked && !reassignmentRequest) return false;
    
    // Don't show form if there's a pending request
    if (reassignmentRequest?.status === 'PENDING') return false;
    
    // Don't show form if request was approved
    if (reassignmentRequest?.status === 'APPROVED') return false;
    
    // Show form if no request exists or if request was rejected
    return !reassignmentRequest || reassignmentRequest.status === 'REJECTED';
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
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
          {getStatusBadge() || (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-2 bg-blue-100 text-blue-800 border border-blue-200">
              <Clock className="h-4 w-4" />
              Request Reassignment
            </div>
          )}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {reassignmentRequest?.status === 'APPROVED' ? 'Request Approved' : 
             reassignmentRequest?.status === 'REJECTED' ? 'Request Rejected' :
             reassignmentRequest?.status === 'PENDING' ? 'Task Locked' : 
             'Request Task Reassignment'}
          </h3>
          <p className="text-sm text-gray-500">
            {getStatusMessage()}
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
            {selectedTask.assignedUsers && selectedTask.assignedUsers.length > 0 && (
              <p className="text-xs text-gray-500">
                Assigned to: {selectedTask.assignedUsers.map(u => u.name).join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Request Details (if exists) */}
        {reassignmentRequest && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Request Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  reassignmentRequest.status === 'PENDING' ? 'text-orange-600' :
                  reassignmentRequest.status === 'APPROVED' ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  {reassignmentRequest.status}
                </span>
              </div>
              {reassignmentRequest.requested_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Requested:</span>
                  <span className="text-gray-900">{formatDate(reassignmentRequest.requested_at)}</span>
                </div>
              )}
              {reassignmentRequest.responded_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Responded:</span>
                  <span className="text-gray-900">{formatDate(reassignmentRequest.responded_at)}</span>
                </div>
              )}
              {reassignmentRequest.reason && (
                <div>
                  <span className="text-gray-600">Reason:</span>
                  <p className="text-gray-900 mt-1 p-2 bg-white border rounded">{reassignmentRequest.reason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show appropriate content based on status */}
        {!shouldShowForm() && reassignmentRequest?.status === 'PENDING' && (
          <div className="text-center py-6">
            <Clock className="h-16 w-16 text-orange-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-700 mb-2 font-medium">Reassignment Request Pending</p>
            <p className="text-gray-500 text-sm mb-6">
              Your manager will review your request soon. The task is locked until they respond.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        )}

        {!shouldShowForm() && reassignmentRequest?.status === 'APPROVED' && (
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <p className="text-gray-700 mb-2 font-medium">Request Approved</p>
            <p className="text-gray-500 text-sm mb-6">
              Your reassignment request was approved. The task can now be reassigned by your manager.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium border border-green-200"
            >
              Close
            </button>
          </div>
        )}

        {/* Form - Only show if allowed */}
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
                placeholder="Explain why you need this task reassigned (workload, expertise, priority shift, etc.)"
                disabled={submitting}
                required
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <div className="flex items-center gap-1">
                  <span>•</span> Your manager will review within 24 hours
                </div>
                <div>
                  {reason.length}/500 characters
                </div>
              </div>
              
              {/* Warning for rejected requests */}
              {reassignmentRequest?.status === 'REJECTED' && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <p className="font-medium mb-1">⚠️ Previous Request Rejected</p>
                  <p className="text-xs">You can submit a new request with a different reason.</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting || !reason.trim()}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {submitting 
                  ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Submitting to manager...
                    </>
                  ) 
                  : reassignmentRequest?.status === 'REJECTED' 
                    ? 'Submit New Request' 
                    : 'Send Reassignment Request'
                }
              </button>
            </div>
          </form>
        )}

        {/* Note about single request */}
        {(shouldShowForm() || reassignmentRequest) && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
            <p className="flex items-center gap-1">
              <span>⚠️</span> 
              <span>Only one reassignment request is allowed per task. Once approved, you cannot request again.</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReassignTaskRequestModal;