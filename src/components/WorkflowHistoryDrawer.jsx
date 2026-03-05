import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchHistoryByInstance,
  selectHistoryItems,
  selectHistoryLoading,
  selectHistoryError,
} from '../redux/slices/historySlice';

// Drawer showing workflow history timeline for a single instance

const WorkflowHistoryDrawer = ({ instanceId, open, onClose }) => {
  const dispatch = useDispatch();
  const items = useSelector((s) => selectHistoryItems(s, instanceId));
  const loading = useSelector((s) => selectHistoryLoading(s, instanceId));
  const error = useSelector((s) => selectHistoryError(s, instanceId));

  useEffect(() => {
    if (open && instanceId) {
      dispatch(fetchHistoryByInstance(instanceId));
    }
  }, [open, instanceId, dispatch]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />

      {/* Drawer panel */}
      <aside className="w-full max-w-md bg-white shadow-xl border-l border-gray-200 flex flex-col">
        <header className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Workflow History</h2>
            <p className="text-xs text-gray-500">Instance ID: {instanceId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            Close
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading && <div className="text-sm text-gray-500">Loading history…</div>}
          {error && !loading && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          {!loading && !error && items.length === 0 && (
            <div className="text-sm text-gray-500">No history entries found.</div>
          )}

          {/* Simple vertical timeline */}
          <ol className="relative border-l border-gray-200">
            {items.map((it, idx) => {
              const at = it.at || it.timestamp || it.created_at || it.createdAt;
              const actor = it.by || it.actor || it.user || it.performed_by;
              const action = it.action || it.state || it.status;
              const note = it.note || it.comment || it.details;
              return (
                <li key={idx} className="mb-6 ml-4">
                  <div className="absolute w-2 h-2 bg-blue-500 rounded-full -left-[5px] mt-1.5" />
                  <time className="mb-1 text-xs font-medium text-gray-400 flex items-center gap-2">
                    <span>{at ? new Date(at).toLocaleString() : '—'}</span>
                    {actor && <span className="text-gray-500">• {actor}</span>}
                  </time>
                  <h3 className="text-sm font-semibold text-gray-900">{action || 'State change'}</h3>
                  {note && <p className="text-xs text-gray-600 mt-1">{note}</p>}
                </li>
              );
            })}
          </ol>
        </div>
      </aside>
    </div>
  );
};

export default WorkflowHistoryDrawer;
