import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Check, Eye, Loader2, RefreshCw, Lock, X, Clock, User, FileText, CheckCircle, AlertCircle, Calendar, BarChart3, Paperclip, MessageSquare } from 'lucide-react';
import { fetchPendingApprovals, approveWorkflow } from '../redux/slices/workflowSlice';
import { selectUser } from '../redux/slices/authSlice';

/**
 * AdminApprovalPanel - Shows pending project closure requests for admins
 * Lists PROJECT requests that need approval
 * Auto-refreshes after actions
 */

// Helper functions for request status checking
const isProjectClosed = (request) => {
  // Check project_status_info flags
  if (request.project_status_info) {
    // If pending closure, it's not closed yet
    if (request.project_status_info.is_pending_closure === true) {
      return false;
    }
    // Only consider closed if not pending closure and actually closed
    if (request.project_status_info.is_closed === true) {
      return true;
    }
  }
  // Fallback to project_status
  return request.project_status === 'CLOSED';
};

const isPendingFinalApproval = (request) => {
  // Check project_status_info flags
  if (request.project_status_info) {
    return request.project_status_info.is_pending_closure === true;
  }
  // Fallback to project_status
  return request.project_status === 'PENDING_FINAL_APPROVAL';
};

const isRequestApproved = (request, approvedRequests) => {
  if (approvedRequests.has(request.id)) {
    return true;
  }
  if (request.status === 'APPROVED') {
    return true;
  }
  return false;
};

const getRequestStatus = (request, approvedRequests) => {
  if (isProjectClosed(request)) {
    return 'CLOSED';
  }
  if (isRequestApproved(request, approvedRequests)) {
    return 'APPROVED';
  }
  return request.status || 'PENDING';
};

const getStatusBadgeClass = (request, approvedRequests) => {
  const status = getRequestStatus(request, approvedRequests);
  switch (status) {
    case 'CLOSED':
      return 'bg-blue-100 text-blue-800';
    case 'APPROVED':
      return 'bg-green-100 text-green-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-orange-100 text-orange-800';
  }
};

const AdminApprovalPanel = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { readyToApprove, alreadyApproved, loading, error } = useSelector(state => state.workflow);
  const [processingId, setProcessingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approvedRequests, setApprovedRequests] = useState(new Set());
  const [closedProjects, setClosedProjects] = useState(new Set());

  // Only show for admins
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchPendingApprovals('ADMIN'));
      // Clear approved requests and closed projects when fetching new data
      setApprovedRequests(new Set());
      setClosedProjects(new Set());
    }
  }, [dispatch, isAdmin]);

  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    try {
      const result = await dispatch(approveWorkflow({
        requestId,
        action: 'APPROVE'
      })).unwrap();

      // Handle the response
      if (result && result.success) {
        // Show success message from response
        toast.success(result.message || 'Project closure approved successfully');

        // Immediately refresh to get updated data from server
        dispatch(fetchPendingApprovals('ADMIN'));
      } else {
        throw new Error(result?.message || 'Failed to approve project closure');
      }
    } catch (error) {
      toast.error(error?.message || error || 'Failed to approve project closure');
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
    try {
      await dispatch(approveWorkflow({
        requestId: selectedRequest.id,
        action: 'REJECT',
        reason: rejectReason.trim()
      })).unwrap();

      toast.success('Project closure rejected');
      dispatch(fetchPendingApprovals('ADMIN'));
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectReason('');
    } catch (error) {
      toast.error(error || 'Failed to reject project closure');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (request) => {
    // Don't open reject modal if project is closed or not pending approval
    if (isProjectClosed(request) || !isPendingFinalApproval(request)) {
      return;
    }
    setSelectedRequest(request);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const refreshApprovals = () => {
    dispatch(fetchPendingApprovals('ADMIN'));
    // Clear approved requests and closed projects when refreshing
    setApprovedRequests(new Set());
    setClosedProjects(new Set());
  };

  if (!isAdmin) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Project Closure Approvals</h2>
          <button
            onClick={refreshApprovals}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading && readyToApprove.length === 0 && alreadyApproved.length === 0 ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Loading approvals...</p>
          </div>
        ) : readyToApprove.length === 0 && alreadyApproved.length === 0 ? (
          <div className="text-center py-8">
            <Check className="w-8 h-8 mx-auto text-green-400" />
            <p className="mt-2 text-sm text-gray-500">No pending project closures</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Ready to Approve Section */}
            {readyToApprove.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Pending Approvals ({readyToApprove.length})
                </h3>
                <div className="space-y-6">
                  {readyToApprove.map((request) => (
                    <ApprovalRequestCard
                      key={request.id}
                      request={request}
                      isReadyToApprove={true}
                      processingId={processingId}
                      onApprove={handleApprove}
                      onReject={openRejectModal}
                      approvedRequests={approvedRequests}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Already Approved Section */}
            {alreadyApproved.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Already Approved ({alreadyApproved.length})
                </h3>
                <div className="space-y-6">
                  {alreadyApproved.map((request) => (
                    <ApprovalRequestCard
                      key={request.id}
                      request={request}
                      isReadyToApprove={false}
                      processingId={processingId}
                      onApprove={handleApprove}
                      onReject={openRejectModal}
                      approvedRequests={approvedRequests}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && !isProjectClosed(selectedRequest) && isPendingFinalApproval(selectedRequest) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reject Project Closure</h3>
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
                  placeholder="Please provide a reason for rejecting this closure request..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || processingId === selectedRequest.id}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
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

export default AdminApprovalPanel;

// ApprovalRequestCard component for rendering individual approval requests
const ApprovalRequestCard = ({ request, isReadyToApprove, processingId, onApprove, onReject, approvedRequests }) => {
  const isClosed = isProjectClosed(request);
  const isPendingApproval = isPendingFinalApproval(request);
  const isApproved = isRequestApproved(request, approvedRequests);
  const status = getRequestStatus(request, approvedRequests);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header Section */}
      <div className={`p-6 border-b ${isClosed ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200' : 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {isClosed ? (
                <CheckCircle className="w-6 h-6 text-blue-600" />
              ) : (
                <Lock className="w-6 h-6 text-orange-600" />
              )}
              <h3 className="text-xl font-bold text-gray-900">
                {isClosed ? 'Project Closed' : isReadyToApprove ? 'Project Closure Request' : 'Approved Request'}
              </h3>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeClass(request, approvedRequests)}`}>
                {status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="bg-white/60 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Project</span>
                </div>
                <p className="text-sm text-gray-900 font-semibold">{request.project_name || `Project ${request.entity_id}`}</p>
                <p className="text-xs text-gray-500">ID: {request.project_public_id || request.entity_id}</p>
              </div>

              <div className="bg-white/60 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Client</span>
                </div>
                <p className="text-sm text-gray-900 font-semibold">{request.client_name || 'N/A'}</p>
                <p className="text-xs text-gray-500">{request.client_email || ''}</p>
              </div>

              <div className="bg-white/60 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Productivity</span>
                </div>
                <p className="text-sm text-gray-900 font-semibold">{request.productivity_score || 'N/A'}</p>
                <p className="text-xs text-gray-500">Total Hours: {request.total_project_hours || '0'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>Requested by: <span className="font-medium">
                  {request.requested_by_name || request.requestedByName || (typeof request.requested_by === 'object' ? request.requested_by?.name : request.requested_by)}
                </span></span>
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

          <div className="flex gap-3 ml-6">
            {isReadyToApprove ? (
              <>
                <button
                  onClick={() => onApprove(request.id)}
                  disabled={processingId === request.id}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors bg-green-600 hover:bg-green-700 disabled:bg-green-400"
                  title="Approve project closure"
                >
                  {processingId === request.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Approve Closure
                </button>

                <button
                  onClick={() => onReject(request)}
                  disabled={processingId === request.id}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                  title="Reject project closure"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                <CheckCircle className="w-4 h-4" />
                Already Approved
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Reason */}
      {request.reason && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Closure Reason</h4>
          <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border">{request.reason}</p>
        </div>
      )}

      {/* Project Already Closed - Show when CLOSED */}
      {isClosed && (
        <div className="p-6 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-blue-600" />
            <h4 className="text-lg font-semibold text-blue-900">Project Already Closed</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/60 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Project Status</span>
              </div>
              <p className="text-sm text-blue-800 font-semibold">Closed</p>
              <p className="text-xs text-gray-600">This project has already been closed</p>
            </div>
            <div className="bg-white/60 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Access Status</span>
              </div>
              <p className="text-sm text-gray-800 font-semibold">Read Only</p>
              <p className="text-xs text-gray-600">No further modifications allowed</p>
            </div>
          </div>
        </div>
      )}

      {/* Approval Details - Show for already approved requests */}
      {!isReadyToApprove && !isClosed && (
        <div className="p-6 bg-green-50 border-b border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h4 className="text-lg font-semibold text-green-900">Approval Details</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/60 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Approved By</span>
              </div>
              <p className="text-sm text-green-800 font-semibold">
                {request.approved_by_name || (typeof request.approved_by === 'object' ? request.approved_by?.name : request.approved_by) || 'System'}
              </p>
              <p className="text-xs text-gray-600">
                {request.approved_by_email || (typeof request.approved_by === 'object' ? request.approved_by?.email : '') || ''}
              </p>
            </div>
            <div className="bg-white/60 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Approved At</span>
              </div>
              <p className="text-sm text-green-800 font-semibold">
                {request.approved_at ? new Date(request.approved_at).toLocaleString() : 'N/A'}
              </p>
              <p className="text-xs text-gray-600">Approval timestamp</p>
            </div>
          </div>
          {request.approval_reason && (
            <div className="mt-4 bg-white/60 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Approval Notes</span>
              </div>
              <p className="text-sm text-green-800">{request.approval_reason}</p>
            </div>
          )}
        </div>
      )}

      {/* Tasks Section */}
      {request.tasks && request.tasks.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Project Tasks ({request.tasks.length})
          </h4>

          <div className="space-y-4">
            {request.tasks.map((task, index) => (
              <div key={task.id || task.public_id || index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-medium text-gray-900">{task.title}</h5>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {task.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{task.total_duration ? `${Math.round(task.total_duration / 3600 * 100) / 100}h` : '0h'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{task.assignees?.length || 0} assignee{task.assignees?.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Assignees */}
                    {task.assignees && task.assignees.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Assigned to:</p>
                        <div className="flex flex-wrap gap-2">
                          {task.assignees.map((assignee, idx) => (
                            <div key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                              <User className="w-3 h-3" />
                              {assignee.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Checklists */}
                    {task.checklists && task.checklists.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">Checklists:</p>
                        <div className="space-y-1">
                          {task.checklists.map((item, idx) => (
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
              </div>
            ))}
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
};