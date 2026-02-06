
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Check, Eye, Loader2, RefreshCw, CheckCircle, X, Clock, User, FileText, AlertCircle, Calendar, BarChart3, Paperclip } from 'lucide-react';
import { fetchPendingApprovals, approveWorkflow } from '../redux/slices/workflowSlice';
import { selectUser } from '../redux/slices/authSlice';

/**
 * ManagerApprovalPanel - Shows pending task completion requests for managers
 * Lists TASK requests that need approval
 * Auto-refreshes after actions
 */
const ManagerApprovalPanel = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { pendingApprovals, loading, error } = useSelector(state => state.workflow);
  const [processingId, setProcessingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approvedRequests, setApprovedRequests] = useState(new Set());
  const [actionError, setActionError] = useState(null); // New state for action errors

  // Only show for managers
  const isManager = user?.role?.toLowerCase() === 'manager';

  useEffect(() => {
    if (isManager) {
      dispatch(fetchPendingApprovals('MANAGER'));
      // Clear approved requests when fetching new data
      setApprovedRequests(new Set());
      setActionError(null); // Clear any previous action errors
    }
  }, [dispatch, isManager]);

  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    setActionError(null); // Clear any previous errors
    
    try {
      const result = await dispatch(approveWorkflow({
        requestId,
        action: 'APPROVE'
      })).unwrap();

      // Handle the response - API returns { success: true, data: { message, newStatus } }
      // But workflowApi returns just the data object (resp.data), so result = { message, newStatus }
      const isSuccess = result?.success === true || 
                       result?.newStatus === 'APPROVED' || 
                       result?.newStatus === 'COMPLETED' || 
                       (result?.message && !result?.error);
      
      if (isSuccess) {
        // Mark this request as approved
        setApprovedRequests(prev => new Set([...prev, requestId]));

        // Show success message from response
        const successMessage = result?.message || result?.data?.message || 'Task completion approved successfully';
        toast.success(successMessage);

        // Refresh to get updated data from server
        setTimeout(() => {
          dispatch(fetchPendingApprovals('MANAGER'));
        }, 1000);
      } else {
        // Store the complete error object from backend
        setActionError(result || { success: false, error: 'Failed to approve task completion' });
        // Still show toast with the error message
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.error('Failed to approve task completion');
        }
      }
    } catch (error) {
      // Handle the specific error from your API
      if (error?.message?.includes('All tasks must be COMPLETED')) {
        setActionError({ success: false, error: error.message });
        toast.error(error.message);
      } else {
        // Store error as object
        setActionError({ 
          success: false, 
          error: error?.message || error || 'Failed to approve task completion' 
        });
        toast.error(error?.message || error || 'Failed to approve task completion');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessingId(selectedRequest.id);
    setActionError(null); // Clear any previous errors
    
    try {
      const result = await dispatch(approveWorkflow({
        requestId: selectedRequest.id,
        action: 'REJECT',
        reason: rejectReason.trim()
      })).unwrap();

      // Handle the response. Some backends return the data object directly
      // (e.g. { message, newStatus }) instead of { success: true, data: {...} }.
      const isSuccess = result?.success === true ||
                        result?.newStatus === 'APPROVED' ||
                        result?.newStatus === 'COMPLETED' ||
                        result?.newStatus === 'IN_PROGRESS' ||
                        (result?.message && !result?.error);

      if (isSuccess) {
        const successMessage = result?.message || result?.data?.message || 'Task rejected';
        toast.success(successMessage);
        setShowRejectModal(false);
        setSelectedRequest(null);
        setRejectReason('');
        // Auto-refresh the list
        dispatch(fetchPendingApprovals('MANAGER'));
      } else {
        // Store the complete error object from backend
        setActionError(result || { success: false, error: 'Failed to reject task' });
        // Still show toast with the error message
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.error('Failed to reject task');
        }
      }
    } catch (error) {
      // Handle the specific error from your API
      if (error?.message?.includes('All tasks must be COMPLETED')) {
        setActionError({ success: false, error: error.message });
        toast.error(error.message);
      } else {
        // Store error as object
        setActionError({ 
          success: false, 
          error: error?.message || error || 'Failed to reject task' 
        });
        toast.error(error?.message || error || 'Failed to reject task');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (request) => {
    // Don't open reject modal if request is already approved
    if (isRequestApproved(request)) {
      return;
    }
    setSelectedRequest(request);
    setShowRejectModal(true);
    setActionError(null); // Clear any previous errors
  };

  const refreshApprovals = () => {
    dispatch(fetchPendingApprovals('MANAGER'));
    setActionError(null); // Clear any previous errors
  };

  // Helper function to check if request is approved
  const isRequestApproved = (request) => {
    // Check if in approvedRequests Set
    if (approvedRequests.has(request.id)) {
      return true;
    }
    // Check if request status indicates it's approved
    if (request.status === 'APPROVED') {
      return true;
    }
    return false;
  };

  // Helper function to get request status display
  const getRequestStatus = (request) => {
    if (isRequestApproved(request)) {
      return 'APPROVED';
    }
    return request.status || 'PENDING';
  };

  // Helper function to get status badge class
  const getStatusBadgeClass = (request) => {
    const status = getRequestStatus(request);
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Function to format and display the error object
  const renderErrorObject = (errorObj) => {
    if (!errorObj) return null;
    
    // If it's already a string, just return it
    if (typeof errorObj === 'string') {
      return <p className="text-sm text-red-600">{errorObj}</p>;
    }
    
    // If it's an object, display it in a formatted way
    return (
      <div className="space-y-2">
        {/* Display the error message prominently */}
        {errorObj.error && (
          <p className="text-sm font-medium text-red-700">{errorObj.error}</p>
        )}
        
        {/* Display the full object in a code-like format */}
        <div className="bg-gray-900 text-gray-100 p-3 rounded-md font-mono text-xs overflow-x-auto">
          <div className="flex items-start">
            <span className="text-blue-300 mr-2">{"{"}</span>
            <div className="flex-1">
              {Object.entries(errorObj).map(([key, value], index, array) => (
                <div key={key} className="ml-4">
                  <span className="text-yellow-300">"{key}"</span>
                  <span className="text-gray-300">: </span>
                  {typeof value === 'string' ? (
                    <span className="text-green-300">"{value}"</span>
                  ) : typeof value === 'boolean' ? (
                    <span className="text-purple-300">{value.toString()}</span>
                  ) : (
                    <span className="text-green-300">{JSON.stringify(value)}</span>
                  )}
                  {index < array.length - 1 && <span className="text-gray-300">,</span>}
                </div>
              ))}
            </div>
            <span className="text-blue-300 ml-2">{"}"}</span>
          </div>
        </div>
        
        {/* Show raw JSON for debugging */}
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
            View raw response
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-gray-800 overflow-x-auto">
            {JSON.stringify(errorObj, null, 2)}
          </pre>
        </details>
      </div>
    );
  };

  if (!isManager) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-500">This panel is only available to managers.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Task Completion Approvals</h1>
              <p className="text-blue-100 text-sm">Review and approve task completion requests</p>
            </div>
          </div>
          <button
            onClick={refreshApprovals}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-white/20 hover:bg-white/30 disabled:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Show action-specific errors in formatted object display */}
        {actionError && (
          <div className="mb-6 p-5 bg-red-50 border border-red-200 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-red-800">Request Failed</h4>
                  <button
                    onClick={() => setActionError(null)}
                    className="text-sm text-red-700 hover:text-red-900 font-medium px-3 py-1 hover:bg-red-100 rounded transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
                
                {/* Display the formatted error object */}
                {renderErrorObject(actionError)}
                
                {/* Action suggestions based on error */}
                {actionError?.error?.includes('All tasks must be COMPLETED') && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm font-medium text-yellow-800 mb-1">Suggested Action:</p>
                    <p className="text-sm text-yellow-700">
                      Please ensure all tasks in the project are marked as COMPLETED before requesting approval.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Show general errors from Redux state */}
        {error && !actionError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">Error Loading Approvals</h4>
                {renderErrorObject(error)}
              </div>
            </div>
          </div>
        )}

        {loading && pendingApprovals.length === 0 ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Loading approvals...</p>
          </div>
        ) : pendingApprovals.length === 0 ? (
          <div className="text-center py-8">
            <Check className="w-8 h-8 mx-auto text-green-400" />
            <p className="mt-2 text-sm text-gray-500">No approvals found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingApprovals.map((request) => {
              const isApproved = isRequestApproved(request);
              const status = getRequestStatus(request);
              
              return (
                <div key={request.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  {/* Header Section */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <h3 className="text-xl font-bold text-gray-900">
                            Task Completion Request
                          </h3>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeClass(request)}`}>
                            {status}
                          </span>
                        </div>

                        {/* Show task completion status warning if applicable */}
                        {request.task_details && request.task_details.incomplete_tasks && request.task_details.incomplete_tasks > 0 && (
                          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-800">
                                {request.task_details.incomplete_tasks} task(s) still incomplete
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          <div className="bg-white/60 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium text-gray-700">Task</span>
                            </div>
                            <p className="text-sm text-gray-900 font-semibold">{request.task_name || `Task ${request.entity_id}`}</p>
                            <p className="text-xs text-gray-500">ID: {request.task_public_id || request.entity_id}</p>
                          </div>

                          <div className="bg-white/60 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium text-gray-700">Project</span>
                            </div>
                            <p className="text-sm text-gray-900 font-semibold">{request.project_name || 'N/A'}</p>
                            <p className="text-xs text-gray-500">ID: {request.project_public_id || request.entity_id}</p>
                          </div>

                          <div className="bg-white/60 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <BarChart3 className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium text-gray-700">Time Spent</span>
                            </div>
                            <p className="text-sm text-gray-900 font-semibold">{request.total_duration ? `${Math.round(request.total_duration / 3600 * 100) / 100}h` : '0h'}</p>
                            <p className="text-xs text-gray-500">Total logged time</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>Requested by: <span className="font-medium">{request.requested_by_name || request.requestedByName || request.requested_by}</span></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Requested: {new Date(request.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 ml-6">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={processingId === request.id || isApproved}
                          className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                            isApproved
                              ? 'bg-green-500 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                          }`}
                          title={isApproved ? "Task already approved" : "Approve task completion"}
                        >
                          {isApproved ? (
                            <>
                              <Check className="w-4 h-4" />
                              Approved
                            </>
                          ) : processingId === request.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          {isApproved ? '' : 'Approve Completion'}
                        </button>

                        <button
                          onClick={() => openRejectModal(request)}
                          disabled={processingId === request.id || isApproved}
                          className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                            isApproved
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                          }`}
                          title={isApproved ? "Task already approved" : "Reject task completion"}
                        >
                          <X className="w-4 h-4" />
                          {isApproved ? 'Rejected' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Request Reason */}
                  {request.reason && (
                    <div className="p-6 bg-gray-50 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Completion Reason</h4>
                      <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border">{request.reason}</p>
                    </div>
                  )}

                  {/* Task Details Section */}
                  {request.task_details && (
                    <div className="p-6 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Task Details
                      </h4>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              request.task_details.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              request.task_details.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {request.task_details.status}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Priority</p>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              request.task_details.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                              request.task_details.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {request.task_details.priority || 'LOW'}
                            </span>
                          </div>
                        </div>

                        {/* Task completion status */}
                        {request.task_details.total_tasks && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Task Completion Progress:</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {request.task_details.completed_tasks || 0} / {request.task_details.total_tasks} completed
                              </span>
                            </div>
                            {request.task_details.incomplete_tasks > 0 && (
                              <p className="text-xs text-red-600 mt-1">
                                {request.task_details.incomplete_tasks} tasks need to be completed first
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Total Time: {request.task_details.total_duration ? `${Math.round(request.task_details.total_duration / 3600 * 100) / 100}h` : '0h'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{request.task_details.assignees?.length || 0} assignee{request.task_details.assignees?.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {/* Assignees */}
                        {request.task_details.assignees && request.task_details.assignees.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Assigned to:</p>
                            <div className="flex flex-wrap gap-2">
                              {request.task_details.assignees.map((assignee, idx) => (
                                <div key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                                  <User className="w-3 h-3" />
                                  {assignee.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Checklists */}
                        {request.task_details.checklists && request.task_details.checklists.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Checklists:</p>
                            <div className="space-y-1">
                              {request.task_details.checklists.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                  <span>{item.title || 'Untitled'}</span>
                                  {item.due_date && (
                                    <span className="text-gray-500">
                                      (Due: {new Date(item.due_date).toLocaleDateString()})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Attachments Section */}
                  {request.attachments && request.attachments.length > 0 && (
                    <div className="p-6 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        Attachments ({request.attachments.length})
                      </h4>
                      <div className="space-y-2">
                        {request.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{attachment.name || `Attachment ${index + 1}`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer with timestamps */}
                  <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <span>Created: {new Date(request.created_at).toLocaleString()}</span>
                      {request.updated_at && (
                        <span>Updated: {new Date(request.updated_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Reason Modal - Don't show if selected request is approved */}
      {showRejectModal && selectedRequest && !isRequestApproved(selectedRequest) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reject Task Completion</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this task cannot be completed..."
                  className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{rejectReason.length}/500 characters</p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedRequest(null);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processingId === selectedRequest.id || !rejectReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-md"
                >
                  {processingId === selectedRequest.id ? 'Rejecting...' : 'Reject Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerApprovalPanel;