import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ApprovalCard from '../components/ApprovalCard';
import { fetchQueue, approveInstance, rejectInstance } from '../redux/slices/approvalSlice';
import WSClient from '../utils/wsClient';
import { toast } from 'sonner';

const ManagerApprovalQueue = () => {
  const dispatch = useDispatch();
  const { queue, loading } = useSelector((s) => s.approval || { queue: [], loading: false });

  const wsRef = useRef(null);

  useEffect(() => { dispatch(fetchQueue()); }, [dispatch]);

  useEffect(() => {
    console.debug('[ManagerApprovalQueue] mounted -> dispatching fetchQueue');
    dispatch(fetchQueue()).catch((e) => console.warn('[ManagerApprovalQueue] fetchQueue error', e));
  }, [dispatch]);

  useEffect(() => {
    // Connect to WS for real-time approval updates
    const server = import.meta.env.VITE_WS_URL || (import.meta.env.VITE_SERVERURL ? import.meta.env.VITE_SERVERURL.replace(/^http/, 'ws') : null);
    if (!server) return;

    const ws = new WSClient(server);
    wsRef.current = ws;
    ws.connect();

    const unsub = ws.onMessage((msg) => {
      // Expect messages like { type: 'workflow.queue.updated' } or { type: 'approval.created', data: {...} }
      try {
        if (!msg || !msg.type) return;
        if (msg.type.includes('approval') || msg.type.includes('workflow')) {
          // simple approach: refetch the queue to keep UI in sync
          dispatch(fetchQueue());
          toast.message('Approval updates received', { duration: 2000 });
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
    dispatch(approveInstance({ instanceId: id, body: { comment: 'Approved via UI' } }));
  };

  const handleReject = (id) => {
    dispatch(rejectInstance({ instanceId: id, body: { comment: 'Rejected via UI' } }));
  };

  return (
    <section className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Approval Queue</h1>
        <p className="text-sm text-slate-500">Approve or reject workflow instances assigned to you</p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {loading && <div className="text-sm text-slate-500">Loading…</div>}
        {!loading && queue.length === 0 && <div className="col-span-3 text-slate-500">No pending items</div>}
        {queue.map((item) => (
          <div key={item.id || item._id || item.instanceId} className="col-span-1">
            <ApprovalCard item={item} onApprove={handleApprove} onReject={handleReject} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ManagerApprovalQueue;
