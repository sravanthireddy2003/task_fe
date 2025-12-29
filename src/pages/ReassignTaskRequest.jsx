import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';

const ReassignTaskRequestModal = ({ selectedTask, onClose }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!selectedTask) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please provide a reason for the reassignment request');
      return;
    }

    setSubmitting(true);
    try {
      const taskId = selectedTask.id || selectedTask._id || selectedTask.public_id;
const resp = await fetchWithTenant(`/api/tasks/${taskId}/request-reassignment`, {
  method: 'POST',
  body: JSON.stringify({
    reason: reason.trim(),
  }),
      });

      toast.success(resp?.message || 'Task reassignment request submitted to manager');
      setReason('');
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to submit reassignment request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-lg animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Request Task Reassignment</h3>
          <p className="text-sm text-gray-500">
            Submit a request to your manager to reassign this task
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
            📋 Task Details
          </h4>
          <p className="text-sm text-gray-700">
            <span className="font-medium">"{selectedTask.title}"</span>
          </p>
          {selectedTask.currentAssignee && (
            <p className="text-xs text-gray-500 mt-1">
              Currently assigned to: {selectedTask.currentAssignee}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for Reassignment <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-vertical min-h-[100px]"
              placeholder="Please explain why you need this task reassigned (e.g., workload, expertise, priority shift, etc.)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Your manager will review this request and decide on reassignment
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting request to manager...' : 'Send Reassignment Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReassignTaskRequestModal;
