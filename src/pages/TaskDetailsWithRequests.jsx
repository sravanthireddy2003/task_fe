import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';
import ReassignTaskRequestModal from './ReassignTaskRequest';
import * as Icons from '../icons';

const { ArrowLeft, Clock, AlertCircle, CheckCircle, XCircle, RefreshCw, Calendar, User, FileText, ChevronRight, Folder, Flag, MessageSquare } = Icons;

const formatDateString = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const TaskDetailsWithRequests = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [task, setTask] = useState(location.state?.task || null);
  const [loading, setLoading] = useState(!location.state?.task);
  const [reassignRequests, setReassignRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);

  // Load task details if not passed in state
  const loadTaskDetails = async () => {
    if (!taskId) return;
    
    setLoading(true);
    try {
      const response = await fetchWithTenant(`/api/tasks/${taskId}`);
      if (response?.success) {
        setTask(response.data);
      } else {
        toast.error('Task not found');
        navigate('/employee/tasks');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to load task details');
      navigate('/employee/tasks');
    } finally {
      setLoading(false);
    }
  };

  // Load reassignment requests
  const loadReassignmentRequests = async () => {
    if (!taskId) return;
    
    setLoadingRequests(true);
    try {
      const response = await fetchWithTenant(`/api/tasks/${taskId}/reassign-requests`);
      if (response?.success && response.requests) {
        setReassignRequests(response.requests);
      } else {
        setReassignRequests([]);
      }
    } catch (err) {
      console.error('Failed to load reassignment requests:', err);
      setReassignRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (!location.state?.task) {
      loadTaskDetails();
    }
    loadReassignmentRequests();
  }, [taskId]);

  // Handle reassignment request response
  const handleReassignResponse = async (response) => {
    if (response?.success) {
      toast.success(response.message || 'Reassignment request sent successfully');
      setReassignModalOpen(false);
      await loadReassignmentRequests(); // Refresh the requests list
    }
  };

  // Get status display info
  const getStatusInfo = (status) => {
    const statusUpper = status?.toUpperCase();
    
    switch (statusUpper) {
      case 'PENDING':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
          label: 'Pending Review',
          badgeClass: 'bg-yellow-100 text-yellow-800'
        };
      case 'APPROVED':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          label: 'Approved',
          badgeClass: 'bg-green-100 text-green-800'
        };
      case 'REJECTED':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          label: 'Rejected',
          badgeClass: 'bg-red-100 text-red-800'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: <AlertCircle className="w-5 h-5 text-gray-600" />,
          label: status || 'Unknown',
          badgeClass: 'bg-gray-100 text-gray-800'
        };
    }
  };

  // Check if there's a pending request
  const hasPendingRequest = () => {
    return reassignRequests.some(request => request.status === 'PENDING');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/employee/tasks')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tasks
        </button>

        {/* Task Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {task?.name || task?.title || 'Task Details'}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {task?.project?.name && (
                  <span className="flex items-center gap-1">
                    <Folder className="w-4 h-4" />
                    {task.project.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Due: {formatDateString(task?.due_date || task?.dueDate || task?.taskDate)}
                </span>
                {task?.priority && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.priority === 'High' ? 'bg-red-100 text-red-800' :
                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    <Flag className="w-3 h-3 inline mr-1" />
                    {task.priority}
                  </span>
                )}
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              task?.status === 'completed' ? 'bg-green-100 text-green-800' :
              task?.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {task?.status?.toUpperCase() || 'PENDING'}
            </span>
          </div>

          {/* Task Description */}
          {task?.description && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-line">{task.description}</p>
            </div>
          )}

          {/* Task Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {task?.employee && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs uppercase text-gray-500 mb-1">Assigned To</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <p className="font-medium text-gray-900">{task.employee.name}</p>
                </div>
              </div>
            )}
            
            {task?.manager && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs uppercase text-gray-500 mb-1">Manager</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <p className="font-medium text-gray-900">{task.manager.name}</p>
                </div>
              </div>
            )}
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs uppercase text-gray-500 mb-1">Reassignment Requests</p>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <p className="font-medium text-gray-900">{reassignRequests.length} submitted</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Reassignment Requests */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Reassignment Requests
                  {reassignRequests.length > 0 && (
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {reassignRequests.length}
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={loadReassignmentRequests}
                    disabled={loadingRequests}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingRequests ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={() => setReassignModalOpen(true)}
                    disabled={hasPendingRequest()}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border ${
                      hasPendingRequest()
                        ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                    }`}
                  >
                    {hasPendingRequest() ? 'Request Pending' : '+ New Request'}
                  </button>
                </div>
              </div>

              {loadingRequests ? (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p>Loading reassignment requests...</p>
                </div>
              ) : reassignRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Reassignment Requests Yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    You haven't submitted any reassignment requests for this task. If you need this task reassigned, submit your first request.
                  </p>
                  <button
                    onClick={() => setReassignModalOpen(true)}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                  >
                    Submit First Request
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {reassignRequests.map((request) => {
                    const statusInfo = getStatusInfo(request.status);
                    return (
                      <div key={request.id} className={`rounded-xl border p-5 ${statusInfo.bg} ${statusInfo.border}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {statusInfo.icon}
                            <div>
                              <p className={`font-semibold text-lg ${statusInfo.text}`}>
                                Request #{request.id}
                              </p>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Submitted: {formatDateTime(request.requested_at)}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.badgeClass}`}>
                            {request.status}
                          </span>
                        </div>
                        
                        <div className="space-y-4">
                          {/* Reason */}
                          {request.reason && (
                            <div>
                              <p className="text-xs uppercase text-gray-500 mb-2">Reason for Reassignment</p>
                              <div className="p-3 bg-white/50 rounded-lg border border-gray-100">
                                <p className="text-gray-700">{request.reason}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Request Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="p-2 bg-white/50 rounded">
                              <p className="text-gray-600 mb-1">Request ID</p>
                              <p className="font-medium text-gray-900">#{request.id}</p>
                            </div>
                            <div className="p-2 bg-white/50 rounded">
                              <p className="text-gray-600 mb-1">Task ID</p>
                              <p className="font-medium text-gray-900">#{request.task_id}</p>
                            </div>
                            <div className="p-2 bg-white/50 rounded">
                              <p className="text-gray-600 mb-1">Status</p>
                              <p className="font-medium text-gray-900 capitalize">{request.status}</p>
                            </div>
                            <div className="p-2 bg-white/50 rounded">
                              <p className="text-gray-600 mb-1">Response</p>
                              <p className="font-medium text-gray-900">
                                {request.responded_at ? 'Responded' : 'Awaiting'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Timeline */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between text-sm">
                              <div className="text-center">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                                  <Clock className="w-4 h-4 text-blue-600" />
                                </div>
                                <p className="text-gray-600">Submitted</p>
                                <p className="font-medium text-gray-900">
                                  {formatDateTime(request.requested_at)}
                                </p>
                              </div>
                              
                              <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
                              
                              <div className="text-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                                  request.responded_at 
                                    ? 'bg-green-100' 
                                    : 'bg-gray-100'
                                }`}>
                                  {request.responded_at ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <p className="text-gray-600">Response</p>
                                <p className="font-medium text-gray-900">
                                  {request.responded_at 
                                    ? formatDateTime(request.responded_at)
                                    : 'Pending'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-6">
            {/* Task Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-gray-900 capitalize">{task?.status || 'Pending'}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-gray-600">Due Date</span>
                  <span className="font-medium text-gray-900">
                    {formatDateString(task?.due_date || task?.dueDate || task?.taskDate)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-gray-600">Priority</span>
                  <span className="font-medium text-gray-900">{task?.priority || 'Medium'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Requests</span>
                  <span className="font-medium text-gray-900">{reassignRequests.length}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setReassignModalOpen(true)}
                  disabled={hasPendingRequest()}
                  className={`w-full px-4 py-3 text-left rounded-lg border flex items-center justify-between ${
                    hasPendingRequest()
                      ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                      : 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Request Reassignment</p>
                      <p className="text-sm">Submit new request</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                <button
                  onClick={loadReassignmentRequests}
                  disabled={loadingRequests}
                  className="w-full px-4 py-3 text-left rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <RefreshCw className={`w-5 h-5 ${loadingRequests ? 'animate-spin' : ''}`} />
                    <div>
                      <p className="font-medium">Refresh Requests</p>
                      <p className="text-sm">Get latest updates</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => navigate('/employee/tasks')}
                  className="w-full px-4 py-3 text-left rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <ArrowLeft className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Back to Tasks</p>
                      <p className="text-sm">View all tasks</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reassign Modal */}
      {reassignModalOpen && (
        <ReassignTaskRequestModal
          selectedTask={task}
          onClose={() => setReassignModalOpen(false)}
          onSuccess={handleReassignResponse}
        />
      )}
    </div>
  );
};

export default TaskDetailsWithRequests;