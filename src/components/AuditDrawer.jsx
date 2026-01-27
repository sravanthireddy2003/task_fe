import React from 'react';

const AuditDrawer = ({ open, onClose, items = [] }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="w-96 bg-white border-l shadow-xl p-4 overflow-auto">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Audit Log</h3>
          <button onClick={onClose} className="text-slate-500">Close</button>
        </div>
        <div className="mt-4 space-y-3">
          {items.length === 0 && <div className="text-sm text-slate-500">No history found</div>}
          {items.map((it, i) => (
            <div key={i} className="p-3 border rounded-lg">
              <div className="text-sm font-medium">{it.action}</div>
              <div className="text-xs text-slate-500">{it.by} • {new Date(it.at).toLocaleString()}</div>
              <div className="text-sm mt-2">{it.note}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1" onClick={onClose}></div>
    </div>
  );
};

export default AuditDrawer;
