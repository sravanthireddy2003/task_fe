import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';

const ReassignTaskRequestModal = ({ selectedTask, onClose }) => {
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [assigneeName, setAssigneeName] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!selectedTask) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assigneeEmail.trim()) {
      toast.error('Please enter assignee email');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        taskId: selectedTask.id || selectedTask._id || selectedTask.public_id,
        assigneeEmail: assigneeEmail.trim(),
        assigneeName: assigneeName.trim(),
        priority,
        dueDate: dueDate || null,
        reason: reason.trim() || null,
      };

      const resp = await fetchWithTenant('/api/employee/reassign-task', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success(resp?.message || 'Task reassignment requested');
      setAssigneeEmail('');
      setAssigneeName('');
      setPriority('Medium');
      setDueDate('');
      setReason('');
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to request reassignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative shadow-lg animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Task Reassignment</h3>
        <p className="text-sm text-gray-500 mb-6">
          Task: <span className="font-medium">{selectedTask.title}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Assignee Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignee Email
            </label>
            <input
              type="email"
              value={assigneeEmail}
              onChange={(e) => setAssigneeEmail(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="example@company.com"
              required
            />
          </div>

          {/* Assignee Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignee Name
            </label>
            <input
              type="text"
              value={assigneeName}
              onChange={(e) => setAssigneeName(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Full name of the assignee"
              required
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Reason for reassignment"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Requesting...' : 'Request Reassignment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReassignTaskRequestModal;
