import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasksbyId } from '../redux/slices/taskSlice';
import { fetchHistoryByInstance, selectHistoryItems, selectHistoryLoading } from '../redux/slices/historySlice';
import ModalWrapper from './ModalWrapper';

const ApprovalCard = ({ item, onApprove, onReject, onEscalate }) => {
  const dispatch = useDispatch();
  const [taskDetails, setTaskDetails] = useState(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const id = item?.id || item?._id || item?.instanceId;
  const entityType = item?.entity_type || item?.entityType;
  const entityId = item?.entity_id || item?.entityId;
  const fromState = item?.from_state || item?.fromState;
  const toState = item?.to_state || item?.toState;
  const requestedBy =
    item?.requestedByName ||
    item?.requested_by_name ||
    (item?.requested_by && (item.requested_by.name || item.requested_by)) ||
    (item?.requestedBy && (item.requestedBy.name || item.requestedBy)) ||
    null;
  const historyItems = useSelector((state) => selectHistoryItems(state, entityType, entityId));
  const historyLoading = useSelector((state) => selectHistoryLoading(state, entityType, entityId));

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
        <button
          onClick={() => {
            setShowHistoryModal(true);
            dispatch(fetchHistoryByInstance({ entityType, entityId }));
          }}
          className="px-3 py-1 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600"
        >
          View History
        </button>
        {isPending ? (
          <>
            <button
              onClick={() => onApprove && onApprove(id)}
              className="px-3 py-1 rounded-lg bg-green-500 text-white text-sm hover:bg-green-600"
            >
              Approve
            </button>
            <div className="relative">
              {!showRejectInput ? (
                <button
                  onClick={() => setShowRejectInput(true)}
                  className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600"
                >
                  Reject
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

      {/* History Modal */}
      <ModalWrapper open={showHistoryModal} setOpen={setShowHistoryModal}>
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow History - {entityType} {entityId}</h3>
          <div className="max-h-96 overflow-y-auto">
            {historyLoading ? (
              <div className="text-center py-4">Loading history...</div>
            ) : historyItems && historyItems.length > 0 ? (
              <div className="space-y-3">
                {historyItems.map((hist, idx) => (
                  <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                    <div className="text-sm font-medium">{hist.action || hist.event || 'Event'}</div>
                    <div className="text-xs text-gray-600">
                      {hist.timestamp && new Date(hist.timestamp).toLocaleString()}
                    </div>
                    {hist.details && <div className="text-xs text-gray-700 mt-1">{JSON.stringify(hist.details)}</div>}
                    {hist.user && <div className="text-xs text-gray-500">By: {hist.user.name || hist.user}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No history available</div>
            )}
          </div>
        </div>
      </ModalWrapper>
    </div>
  );
};

export default ApprovalCard;
