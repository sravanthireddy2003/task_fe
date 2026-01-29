import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ApprovalCard from '../components/ApprovalCard';
import { fetchQueue, approveInstance, rejectInstance } from '../redux/slices/approvalSlice';
import WSClient from '../utils/wsClient';
import { toast } from 'sonner';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import ViewToggle from '../components/ViewToggle';

const ManagerApprovalQueue = () => {
  const dispatch = useDispatch();
  const { queue, loading } = useSelector((s) => s.approval || { queue: [], loading: false });
  const [viewMode, setViewMode] = React.useState('list');

  const wsRef = useRef(null);
  const lastFetchRef = useRef(0);

  useEffect(() => {
    console.debug('[ManagerApprovalQueue] mounted -> dispatching fetchQueue');
    // Initial load
    dispatch(fetchQueue()).catch((e) => console.warn('[ManagerApprovalQueue] fetchQueue error', e));
  }, [dispatch]);

  useEffect(() => {
    // Connect to WS for real-time approval updates (only if explicit WS URL is configured)
    const server = import.meta.env.VITE_WS_URL;
    if (!server) return;

    const ws = new WSClient(server);
    wsRef.current = ws;
    ws.connect();

    const unsub = ws.onMessage((msg) => {
      // Expect messages like { type: 'workflow.queue.updated' } or { type: 'approval.created', data: {...} }
      try {
        if (!msg || !msg.type) return;
        if (msg.type.includes('approval') || msg.type.includes('workflow')) {
          // Throttle automatic refreshes to avoid rapid repeated fetches
          const now = Date.now();
          if (now - lastFetchRef.current > 2000) {
            lastFetchRef.current = now;
            dispatch(fetchQueue());
            toast.message('Approval updates received', { duration: 2000 });
          }
        }
      } catch (e) {
        console.warn('WS msg handling error', e);
      }
    });

    return () => {
      try { unsub(); } catch (e) {}
      try { ws.disconnect(); } catch (e) {}
    };
  }, [dispatch]);

  const handleApprove = (id) => {
    dispatch(approveInstance({ requestId: id, reason: 'Approved via UI' }));
  };

  const handleReject = (id, reason) => {
    dispatch(rejectInstance({ requestId: id, reason: reason || 'Rejected via UI' }));
  };

  const handleRefresh = () => {
    dispatch(fetchQueue());
  };

  const totalItems = queue?.length || 0;

  return (
    <div className="w-full p-6 space-y-6">
      <PageHeader
        title="Approval Queue"
        subtitle="Approve or reject workflow instances assigned to you"
        onRefresh={handleRefresh}
        refreshing={loading}
      />

      <Card>
        <div className="flex flex-col gap-3 pb-4 mb-4 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Pending approvals</h2>
            <p className="mt-1 text-xs text-slate-500">
              Items in your workflow approval queue update in real time.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900">{totalItems}</span>
              <span className="text-xs text-slate-500">items</span>
            </div>
            <ViewToggle
              mode={viewMode}
              onChange={(mode) => setViewMode(mode)}
              className="mt-1 sm:mt-0"
            />
          </div>
        </div>

        {loading ? (
          <div className={viewMode === 'list' ? 'space-y-3' : 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={
                  viewMode === 'list'
                    ? 'h-20 rounded-xl border border-slate-200 bg-slate-50 animate-pulse'
                    : 'h-40 rounded-xl border border-slate-200 bg-slate-50 animate-pulse'
                }
              />
            ))}
          </div>
        ) : totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-500">
            <div className="mb-2 text-3xl">🎉</div>
            <p className="font-medium">You&apos;re all caught up.</p>
            <p className="mt-1 text-xs text-slate-400">No approval requests need your attention right now.</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="tm-list-container">
            <div className="tm-list-header grid grid-cols-[2fr,1fr,1fr] gap-4 text-xs font-medium text-slate-500">
              <div>Request</div>
              <div>Requested by</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="tm-list-body divide-y divide-slate-100">
              {queue.map((item) => {
                const id = item.id || item._id || item.instanceId;
                const requestedBy = item.requested_by || item.requestedBy;
                const entityType = item.entity_type || item.entityType;
                const entityId = item.entity_id || item.entityId;
                const createdAt = item.created_at || item.createdAt;
                const status = item.status || item.currentStatus;
                const statusRaw = (status || '').toString();
                const statusUpper = statusRaw.toUpperCase();
                const isPending =
                  statusUpper.includes('PEND') ||
                  statusUpper.includes('REQUEST') ||
                  statusUpper === 'OPEN';

                return (
                  <div
                    key={id}
                    className="grid grid-cols-[2fr,1fr,1fr] gap-4 py-3 text-sm text-slate-700"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">
                        {entityType} {entityId}
                      </div>
                      <div className="text-xs text-slate-500">
                        Request ID: {id}
                        {createdAt && (
                          <>
                            {' '}
                            • Requested{' '}
                            <span className="font-mono text-[11px]">
                              {new Date(createdAt).toLocaleString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-slate-600">
                      {requestedBy?.name || requestedBy || 'Unknown'}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => handleApprove(id)}
                            className="px-3 py-1 rounded-lg bg-green-500 text-white text-xs hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(id)}
                            className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs hover:bg-red-600"
                          >
                            Reject
                          </button>
                          {status && (
                            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-600">
                              {status}
                            </span>
                          )}
                        </>
                      ) : (
                        status && (
                          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-600">
                            {status}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {queue.map((item) => (
              <ApprovalCard
                key={item.id || item._id || item.instanceId}
                item={item}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ManagerApprovalQueue;
