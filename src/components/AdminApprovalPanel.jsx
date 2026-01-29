import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Check, Eye, Loader2, RefreshCw, Lock, X } from 'lucide-react';
import { fetchPendingApprovals, approveWorkflow } from '../redux/slices/workflowSlice';
import { selectUser } from '../redux/slices/authSlice';

/**
 * AdminApprovalPanel - Shows pending project closure requests for admins
 * Lists PROJECT requests that need approval
 * Auto-refreshes after actions
 */
const AdminApprovalPanel = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { pendingApprovals, loading, error } = useSelector(state => state.workflow);
  const [processingId, setProcessingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Only show for admins
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchPendingApprovals('ADMIN'));
    }
  }, [dispatch, isAdmin]);

  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    try {
      await dispatch(approveWorkflow({
        requestId,
        action: 'APPROVE'
      })).unwrap();

      toast.success('Project closure approved successfully');
      // Auto-refresh the list
      dispatch(fetchPendingApprovals('ADMIN'));
    } catch (error) {
      toast.error(error || 'Failed to approve project closure');
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
    setSelectedRequest(request);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const refreshApprovals = () => {
    dispatch(fetchPendingApprovals('ADMIN'));
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

        {loading && pendingApprovals.length === 0 ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Loading approvals...</p>
          </div>
        ) : pendingApprovals.length === 0 ? (
          <div className="text-center py-8">
            <Check className="w-8 h-8 mx-auto text-green-400" />
            <p className="mt-2 text-sm text-gray-500">No pending project closures</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingApprovals.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-orange-500" />
                      <h3 className="font-medium text-gray-900">
                        Project Closure Request
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Project ID: {request.entity_id}
                    </p>
                    {request.reason && (
                      <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                        {request.reason}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Requested by: {request.requested_by_name || request.requested_by}
                    </p>
                    <p className="text-xs text-gray-500">
                      Requested on: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>

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
                      Approve Closure
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
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