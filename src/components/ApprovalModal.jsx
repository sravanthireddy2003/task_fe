import React, { useState, useEffect } from 'react';

// Generic modal for manager approvals: approve / reject / escalate with comment input

const MODE_CONFIG = {
  approve: {
    title: 'Approve Request',
    description: 'Confirm approval and optionally add a comment for the requester.',
    primaryLabel: 'Approve',
    primaryClass: 'bg-green-600 hover:bg-green-700',
  },
  reject: {
    title: 'Reject Request',
    description: 'Provide a brief reason for rejection. This will be visible to the requester.',
    primaryLabel: 'Reject',
    primaryClass: 'bg-red-600 hover:bg-red-700',
  },
  escalate: {
    title: 'Escalate Request',
    description: 'Add context for escalation so the next approver understands the situation.',
    primaryLabel: 'Escalate',
    primaryClass: 'bg-amber-600 hover:bg-amber-700',
  },
};

const ApprovalModal = ({
  open,
  mode = 'approve',
  loading = false,
  onCancel,
  onSubmit,
}) => {
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (open) setComment('');
  }, [open, mode]);

  if (!open) return null;

  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.approve;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit({ comment: comment.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
      >
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">{cfg.title}</h2>
          <p className="text-sm text-gray-500">{cfg.description}</p>
        </header>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Comment</label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add a short note for the requester"
          />
        </div>

        <footer className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${cfg.primaryClass} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {loading ? 'Submitting…' : cfg.primaryLabel}
          </button>
        </footer>
      </form>
    </div>
  );
};

export default ApprovalModal;
