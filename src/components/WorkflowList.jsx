import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TaskWorkflowCard from './TaskWorkflowCard';
import { fetchTasks } from '../redux/slices/taskSlice';
import { triggerWorkflow } from '../redux/slices/workflowSlice';

// High-level task list + workflow view, aligned with Figma layout
// - Employee: shows own tasks with workflow status, "Send to Review" actions
// - Manager: can still reuse this list in read-only mode if needed

const WorkflowList = () => {
  const dispatch = useDispatch();
  const { tasks, status, error } = useSelector((s) => s.tasks || { tasks: [], status: 'idle', error: null });
  const user = useSelector((s) => s.auth?.user);
  const role = (user?.role || '').toLowerCase();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      dispatch(fetchTasks({}));
    }
  }, [dispatch]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (tasks || []).filter((t) => {
      const title = (t.title || t.name || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      const matchesSearch = !q || title.includes(q) || desc.includes(q);
      const status = (t.status || t.task_status || '').toString().toLowerCase();
      const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [tasks, search, statusFilter]);

  const handleSendToReview = async (task) => {
    if (!task) return;
    const taskId = task.id || task._id || task.public_id;
    if (!taskId) return;
    try {
      // NOTE: Adjust payload to match your backend contract
      await dispatch(triggerWorkflow({ task_id: taskId })).unwrap();
    } catch (err) {
      // Silently fail for now; surrounding page can show toasts
      console.error('triggerWorkflow failed', err);
    }
  };

  const isEmployee = role === 'employee';

  return (
    <section className="flex flex-col gap-4">
      {/* Toolbar: search + filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title or description"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="review">In Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* States */}
      {status === 'loading' && (
        <div className="text-sm text-gray-500">Loading tasks…</div>
      )}
      {status === 'failed' && (
        <div className="text-sm text-red-600">{error || 'Failed to load tasks'}</div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTasks.map((task) => (
          <TaskWorkflowCard
            key={task.id || task._id || task.public_id}
            task={task}
            userRole={role}
            onSendToReview={isEmployee ? () => handleSendToReview(task) : undefined}
          />
        ))}
        {filteredTasks.length === 0 && status !== 'loading' && (
          <div className="text-sm text-gray-500 col-span-full">No tasks match the current filters.</div>
        )}
      </div>
    </section>
  );
};

export default WorkflowList;
