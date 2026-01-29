import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchTasksbyId } from '../redux/slices/taskSlice';

const ApprovalCard = ({ item, onApprove, onReject, onEscalate }) => {
  const dispatch = useDispatch();
  const [taskDetails, setTaskDetails] = useState(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const id = item?.id || item?._id || item?.instanceId;
  const entityType = item?.entity_type || item?.entityType;
  const entityId = item?.entity_id || item?.entityId;
  const fromState = item?.from_state || item?.fromState;
  const toState = item?.to_state || item?.toState;
  const requestedBy = item?.requested_by || item?.requestedBy;
  const reason = item?.reason;
  const createdAt = item?.created_at || item?.createdAt;

  // Fetch task details if this is a TASK workflow request
  useEffect(() => {
    if (entityType === 'TASK' && entityId) {
      dispatch(fetchTasksbyId({ task_id: entityId }))
        .unwrap()
        .then((task) => setTaskDetails(task))
        .catch((err) => console.warn('Failed to fetch task details:', err));
    }
  }, [dispatch, entityType, entityId]);

  const title = taskDetails?.name || taskDetails?.title || `Task ${entityId}`;
  const priority = taskDetails?.priority;
  const projectName = taskDetails?.project?.name || taskDetails?.project_name;
  const statusRaw = (item?.status || item?.currentStatus || '').toString();
  const statusUpper = statusRaw.toUpperCase();
  const isPending = statusUpper.includes('PEND') || statusUpper.includes('REQUEST') || statusUpper === 'OPEN';
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-slate-500">
            {entityType} ID: {entityId} • Request ID: {id}
          </div>
        </div>
        <div className="text-xs text-slate-500">
          {requestedBy?.name || requestedBy || 'Unknown'}
        </div>
      </div>

      <div className="mt-2 text-xs text-slate-500 space-y-1">
        <div>Transition: <span className="font-medium">{fromState} → {toState}</span></div>
        {priority && <div>Priority: <span className="font-medium capitalize">{priority}</span></div>}
        {projectName && <div>Project: <span className="font-medium">{projectName}</span></div>}
        {createdAt && <div>Requested: <span className="font-mono text-[11px]">{new Date(createdAt).toLocaleString()}</span></div>}
      </div>

      {reason && (
        <div className="mt-3 text-sm text-slate-600">
          <strong>Reason:</strong> {reason}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {isPending ? (
          <>
            <button
              onClick={() => onApprove && onApprove(id)}
              title="Approve"
              className="px-2 py-2 rounded-lg bg-green-500 text-white text-sm hover:bg-green-600 flex items-center justify-center"
            >
              <span className="sr-only">Approve</span>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </button>
            <div className="relative">
              {!showRejectInput ? (
                <button
                  onClick={() => setShowRejectInput(true)}
                  title="Reject"
                  className="px-2 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 flex items-center justify-center"
                >
                  <span className="sr-only">Reject</span>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              ) : (
                <div className="absolute right-0 top-0 z-10 w-72 bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                  <div className="text-sm text-slate-700 mb-2">Reason for rejection</div>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    rows={3}
                    placeholder="Enter reason (optional)"
                  />
                  <div className="mt-2 flex gap-2 justify-end">
                    <button
                      onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
                      className="px-3 py-1 rounded-lg bg-gray-100 text-sm text-gray-700 hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (onReject) onReject(id, rejectReason || 'Rejected via UI');
                        setShowRejectInput(false);
                        setRejectReason('');
                      }}
                      className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>
            {onEscalate && (
              <button
                onClick={() => onEscalate(id)}
                className="px-3 py-1 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-600"
              >
                Escalate
              </button>
            )}
          </>
        ) : (
          <div className="px-3 py-1 rounded-lg bg-gray-100 text-sm text-gray-700">Status: {item?.status || item?.currentStatus || 'Unknown'}</div>
        )}
      </div>
    </div>
  );
};

export default ApprovalCard;
