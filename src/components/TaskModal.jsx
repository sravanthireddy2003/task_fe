import React, { useState, useEffect } from 'react';
import * as Icons from '../icons';
import { toast } from 'sonner';
import TimeTracker from './TimeTracker';

const TaskModal = ({ task, onClose, onUpdate, userRole, projectId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({ ...task });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEditedTask({ ...task });
    // Load comments if needed
    loadComments();
  }, [task]);

  const loadComments = async () => {
    // TODO: Implement comment loading
    setComments([]);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const taskId = task.id || task._id || task.public_id;
      await onUpdate(taskId, editedTask);
      toast.success('Task updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update task');
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const taskId = task.id || task._id || task.public_id;
      await onUpdate(taskId, { status: newStatus });
      toast.success(`Task marked as ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      // TODO: Implement comment adding
      const comment = {
        id: Date.now(),
        text: newComment,
        author: 'Current User', // TODO: Get from auth
        createdAt: new Date().toISOString()
      };
      setComments([...comments, comment]);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'To Do':
        return 'bg-gray-100 text-gray-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'On Hold':
        return 'bg-red-100 text-red-800';
      case 'Review':
        return 'bg-purple-100 text-purple-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canEdit = userRole === 'admin' || userRole === 'manager';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              task.status === 'Completed' ? 'bg-green-500' :
              task.status === 'In Progress' ? 'bg-blue-500' :
              task.status === 'On Hold' ? 'bg-red-500' : 'bg-gray-500'
            }`} />
            <h2 className="text-xl font-semibold text-gray-900">
              {task.title || task.name || 'Untitled Task'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)]">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Task Details */}
            <div className="space-y-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    value={editedTask.description || ''}
                    onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {task.description || 'No description provided'}
                  </p>
                )}
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  {isEditing ? (
                    <select
                      value={editedTask.status || 'PENDING'}
                      onChange={(e) => setEditedTask({...editedTask, status: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Review">Review</option>
                      <option value="Completed">Completed</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                      {task.status || 'To Do'}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  {isEditing ? (
                    <select
                      value={editedTask.priority || 'Medium'}
                      onChange={(e) => setEditedTask({...editedTask, priority: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority || 'Medium'}
                    </span>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedTask.start_date ? new Date(editedTask.start_date).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditedTask({...editedTask, start_date: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-600">{formatDate(task.start_date)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedTask.due_date ? new Date(editedTask.due_date).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditedTask({...editedTask, due_date: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-600">{formatDate(task.due_date)}</p>
                  )}
                </div>
              </div>

              {/* Assigned Users */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Users
                </label>
                <div className="flex flex-wrap gap-2">
                  {(task.assignedUsers || task.assigned_users || []).map((user, index) => (
                    <div key={user.id || user._id || index} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{user.name || user.email || 'User'}</span>
                    </div>
                  ))}
                  {(task.assignedUsers || task.assigned_users || []).length === 0 && (
                    <p className="text-gray-500 text-sm">No users assigned</p>
                  )}
                </div>
              </div>

              {/* Time Tracking */}
              <TimeTracker
                task={task}
                onUpdate={onUpdate}
                userRole={userRole}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-gray-50 p-6">
            {/* Action Buttons - Updated Workflow */}
            <div className="space-y-3 mb-6">
              {/* PENDING status actions */}
              {task.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleStatusChange('To Do')}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    <Square className="w-4 h-4" />
                    Move to To Do
                  </button>
                  <button
                    onClick={() => handleStatusChange('In Progress')}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Play className="w-4 h-4" />
                    Start Work
                  </button>
                </>
              )}

              {/* To Do status actions */}
              {task.status === 'To Do' && (
                <button
                  onClick={() => handleStatusChange('In Progress')}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Play className="w-4 h-4" />
                  Start Progress
                </button>
              )}

              {/* In Progress status actions */}
              {task.status === 'In Progress' && (
                <>
                  <button
                    onClick={() => handleStatusChange('On Hold')}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Pause className="w-4 h-4" />
                    Put on Hold
                  </button>
                  <button
                    onClick={() => handleStatusChange('Review')}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <Square className="w-4 h-4" />
                    Move to Review
                  </button>
                  <button
                    onClick={() => handleStatusChange('Completed')}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Square className="w-4 h-4" />
                    Mark Complete
                  </button>
                </>
              )}

              {/* On Hold status actions */}
              {task.status === 'On Hold' && (
                <button
                  onClick={() => handleStatusChange('In Progress')}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Play className="w-4 h-4" />
                  Resume Work
                </button>
              )}

              {/* Review status actions */}
              {task.status === 'Review' && (
                <button
                  onClick={() => handleStatusChange('Completed')}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Square className="w-4 h-4" />
                  Mark Complete
                </button>
              )}

              {/* Completed status - no actions */}
            </div>

            {/* Comments Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Comments</h3>
              <div className="space-y-3 mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                      <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {canEdit && (
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Task
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskModal;