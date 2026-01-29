import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Check, X, Eye, Loader2, RefreshCw } from 'lucide-react';
import { fetchPendingApprovals, approveWorkflow } from '../redux/slices/workflowSlice';
import { selectUser } from '../redux/slices/authSlice';

/**
 * ManagerApprovalPanel - Shows pending task approval requests for managers
 * Lists TASK requests that need approval/rejection
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

  // Only show for managers
  const isManager = user?.role?.toLowerCase() === 'manager';

  useEffect(() => {
    if (isManager) {
      dispatch(fetchPendingApprovals('MANAGER'));
    }
  }, [dispatch, isManager]);

  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    try {
      await dispatch(approveWorkflow({
        requestId,
        action: 'APPROVE'
      })).unwrap();

      toast.success('Task approved successfully');
      // Auto-refresh the list
      dispatch(fetchPendingApprovals('MANAGER'));
    } catch (error) {
      toast.error(error || 'Failed to approve task');
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

      toast.success('Task rejected');
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectReason('');
      // Auto-refresh the list
      dispatch(fetchPendingApprovals('MANAGER'));
    } catch (error) {
      toast.error(error || 'Failed to reject task');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const refreshApprovals = () => {
    dispatch(fetchPendingApprovals('MANAGER'));
  };

  if (!isManager) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Approvals</h2>
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
          <div className="space-y-4">
            {pendingApprovals.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
         
                    <p className="text-sm text-gray-600 mt-1">
                      Task: {request.task_name || `Task ${request.entity_id}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      Project: {request.project_name || 'N/A'}
                    </p>
                    {request.reason && (
                      <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                        {request.reason}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Requested by: {request.requested_by_name || request.requestedByName || request.requested_by}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                      {request.status === 'REJECTED' && request.rejection_reason && (
                        <p className="text-xs text-red-600">
                          Reason: {request.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {request.status === 'PENDING' ? (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={processingId === request.id}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded"
                      >
                        {processingId === request.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        Approve
                      </button>

                      <button
                        onClick={() => openRejectModal(request)}
                        disabled={processingId === request.id}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded"
                      >
                        <X className="w-3 h-3" />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="ml-4">
                      <Eye className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Task Completion</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this task completion request:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this task cannot be completed..."
              className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-end gap-3 mt-4">
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
      )}
    </div>
  );
};

export default ManagerApprovalPanel;