import React from 'react';

const ApprovalCard = ({ item, onApprove, onReject }) => {
  const title = item?.title || item?.entityName || `Instance ${item?.id || item?._id || ''}`;
  const id = item?.id || item?._id || item?.instanceId;

  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-slate-500">ID: {id}</div>
        </div>
        <div className="text-xs text-slate-500">{item?.createdByName || item?.created_by || ''}</div>
      </div>

      <div className="mt-3 text-sm text-slate-600">{item?.summary || item?.notes || ''}</div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onApprove && onApprove(id)}
          className="px-3 py-1 rounded-lg bg-green-500 text-white text-sm"
        >Approve</button>
        <button
          onClick={() => onReject && onReject(id)}
          className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm"
        >Reject</button>
      </div>
    </div>
  );
};

export default ApprovalCard;
