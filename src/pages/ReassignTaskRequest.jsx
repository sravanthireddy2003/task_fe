import React, { useState } from 'react';
import { 
  User, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Check, 
  X, 
  RefreshCw, 
  MessageSquare,
  ChevronRight,
  Shield,
  Mail,
  Phone
} from 'lucide-react';

const ReassignTaskRequest = () => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [reassigning, setReassigning] = useState(false);

  // Mock data for pending reassign requests
  const reassignRequests = [
    {
      id: 'REQ-001',
      task: {
        id: 'TASK-789',
        title: 'Implement User Authentication',
        description: 'Create secure login system with JWT tokens and role-based access control',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: '2024-12-20',
        estimatedHours: 40,
        project: 'E-commerce Platform',
        client: 'Retail Corp'
      },
      requester: {
        id: 'EMP-123',
        name: 'Alex Johnson',
        role: 'Senior Developer',
        email: 'alex.johnson@company.com',
        phone: '+1 (555) 123-4567',
        avatar: 'AJ'
      },
      reason: 'Currently overloaded with critical bug fixes for production deployment. Need to focus on urgent client issues.',
      urgency: 'HIGH',
      requestedDate: '2024-12-15',
      status: 'PENDING'
    },
    {
      id: 'REQ-002',
      task: {
        id: 'TASK-456',
        title: 'Design Mobile App Prototype',
        description: 'Create high-fidelity prototypes for the new mobile banking app',
        priority: 'MEDIUM',
        status: 'PLANNING',
        dueDate: '2024-12-25',
        estimatedHours: 24,
        project: 'Mobile Banking',
        client: 'Global Bank'
      },
      requester: {
        id: 'EMP-456',
        name: 'Sarah Chen',
        role: 'UI/UX Designer',
        email: 'sarah.chen@company.com',
        phone: '+1 (555) 987-6543',
        avatar: 'SC'
      },
      reason: 'Unexpected family emergency requiring time off. Need someone to take over this time-sensitive design work.',
      urgency: 'MEDIUM',
      requestedDate: '2024-12-14',
      status: 'PENDING'
    },
    {
      id: 'REQ-003',
      task: {
        id: 'TASK-123',
        title: 'Database Migration Script',
        description: 'Migrate legacy data to new cloud database with minimal downtime',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: '2024-12-18',
        estimatedHours: 60,
        project: 'Infrastructure Upgrade',
        client: 'Tech Solutions Inc.'
      },
      requester: {
        id: 'EMP-789',
        name: 'Michael Rodriguez',
        role: 'DevOps Engineer',
        email: 'michael.r@company.com',
        phone: '+1 (555) 456-7890',
        avatar: 'MR'
      },
      reason: 'Lack of expertise in the specific database technology used. Need someone with PostgreSQL experience.',
      urgency: 'HIGH',
      requestedDate: '2024-12-13',
      status: 'PENDING'
    }
  ];

  // Mock data for available employees
  const availableEmployees = [
    { id: 'EMP-001', name: 'James Wilson', role: 'Lead Developer', currentWorkload: 'Moderate', avatar: 'JW' },
    { id: 'EMP-002', name: 'Emma Thompson', role: 'Full Stack Developer', currentWorkload: 'Light', avatar: 'ET' },
    { id: 'EMP-003', name: 'David Kim', role: 'Backend Developer', currentWorkload: 'Moderate', avatar: 'DK' },
    { id: 'EMP-004', name: 'Lisa Anderson', role: 'Senior Developer', currentWorkload: 'Heavy', avatar: 'LA' },
    { id: 'EMP-005', name: 'Robert Garcia', role: 'DevOps Specialist', currentWorkload: 'Light', avatar: 'RG' },
    { id: 'EMP-006', name: 'Maya Patel', role: 'Database Expert', currentWorkload: 'Moderate', avatar: 'MP' }
  ];

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'HIGH':
        return 'bg-gradient-to-r from-red-500 to-orange-500';
      case 'MEDIUM':
        return 'bg-gradient-to-r from-amber-500 to-yellow-500';
      case 'LOW':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-400';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800';
      case 'REJECTED':
        return 'bg-gradient-to-r from-red-100 to-orange-100 text-red-800';
      case 'COMPLETED':
        return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-gradient-to-r from-red-100 to-orange-100 text-red-800';
      case 'MEDIUM':
        return 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800';
      case 'LOW':
        return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800';
    }
  };

  const handleApproveRequest = (requestId) => {
    // In a real app, this would make an API call
    alert(`Request ${requestId} approved! Now select a new assignee.`);
    setShowReassignModal(true);
  };

  const handleRejectRequest = (requestId) => {
    if (window.confirm('Are you sure you want to reject this reassignment request?')) {
      // In a real app, this would make an API call
      alert(`Request ${requestId} rejected!`);
    }
  };

  const handleReassign = () => {
    setReassigning(true);
    // Simulate API call
    setTimeout(() => {
      setReassigning(false);
      setShowReassignModal(false);
      alert('Task successfully reassigned!');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <RefreshCw className="h-8 w-8 text-indigo-600" />
                Task Reassignment Requests
              </h1>
              <p className="text-gray-600">
                Review and manage employee requests to reassign tasks. Approve requests and assign to suitable team members.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">
                    {reassignRequests.length} Pending Requests
                  </span>
                </div>
              </div>
              <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                <RefreshCw className="h-4 w-4 inline mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pending Review</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">3</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Approved This Week</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">5</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-100 to-green-100 rounded-xl flex items-center justify-center">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Avg. Response Time</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">4.2h</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Request List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Pending Requests</h2>
                <p className="text-sm text-gray-600 mt-1">Requests awaiting your decision</p>
              </div>

              <div className="divide-y divide-gray-200">
                {reassignRequests.map((request) => (
                  <div 
                    key={request.id}
                    className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${selectedRequest?.id === request.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Requester Info */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {request.requester.avatar}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{request.requester.name}</div>
                            <div className="text-sm text-gray-600">{request.requester.role}</div>
                          </div>
                        </div>

                        {/* Task Info */}
                        <div className="mb-4">
                          <div className="font-medium text-gray-900 mb-2">{request.task.title}</div>
                          <div className="text-sm text-gray-600 line-clamp-2">{request.task.description}</div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 mb-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getUrgencyColor(request.urgency)} text-white`}>
                            {request.urgency} URGENCY
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(request.task.priority)}`}>
                            {request.task.priority} PRIORITY
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>

                        {/* Reason */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Reason for Reassignment:</span>
                          </div>
                          <p className="text-sm text-gray-600">{request.reason}</p>
                        </div>

                        {/* Timeline */}
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Requested: {request.requestedDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Due: {request.task.dueDate}</span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Request Details & Actions */}
          <div className="lg:col-span-1">
            {selectedRequest ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden sticky top-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
                  <p className="text-sm text-gray-600 mt-1">Review and take action</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Requester Details */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5">
                    <h3 className="font-semibold text-gray-900 mb-3">Requester Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {selectedRequest.requester.avatar}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{selectedRequest.requester.name}</div>
                          <div className="text-sm text-gray-600">{selectedRequest.requester.role}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">{selectedRequest.requester.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">{selectedRequest.requester.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Task Details */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Task Details</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Project</div>
                        <div className="font-medium text-gray-900">{selectedRequest.task.project}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Client</div>
                        <div className="font-medium text-gray-900">{selectedRequest.task.client}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Estimated Hours</div>
                          <div className="font-medium text-gray-900">{selectedRequest.task.estimatedHours}h</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Status</div>
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold inline-block ${getStatusColor(selectedRequest.task.status)}`}>
                            {selectedRequest.task.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Urgency Alert */}
                  <div className={`${selectedRequest.urgency === 'HIGH' ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200' : 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200'} rounded-xl p-4`}>
                    <div className="flex items-center gap-3">
                      <AlertCircle className={`h-5 w-5 ${selectedRequest.urgency === 'HIGH' ? 'text-red-600' : 'text-amber-600'}`} />
                      <div>
                        <div className="font-semibold text-gray-900">
                          {selectedRequest.urgency} Priority Request
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {selectedRequest.urgency === 'HIGH' 
                            ? 'This requires immediate attention' 
                            : 'Review within 24 hours recommended'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleApproveRequest(selectedRequest.id)}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-green-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      <Check className="h-5 w-5" />
                      Approve & Reassign
                    </button>
                    <button
                      onClick={() => handleRejectRequest(selectedRequest.id)}
                      className="w-full py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl font-semibold hover:from-gray-300 hover:to-gray-400 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <X className="h-5 w-5" />
                      Reject Request
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Select a Request</h3>
                <p className="text-sm text-gray-600">
                  Click on any request from the list to view details and take action.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reassign Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Reassign Task</h2>
              <button
                onClick={() => setShowReassignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select New Assignee
                </label>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {availableEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedAssignee === employee.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedAssignee(employee.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {employee.avatar}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-600">{employee.role}</div>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          employee.currentWorkload === 'Light' ? 'bg-emerald-100 text-emerald-800' :
                          employee.currentWorkload === 'Moderate' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {employee.currentWorkload} Workload
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedAssignee && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Selected Assignee</div>
                      <div className="text-sm text-gray-600">
                        {availableEmployees.find(e => e.id === selectedAssignee)?.name}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowReassignModal(false)}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReassign}
                  disabled={!selectedAssignee || reassigning}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    !selectedAssignee || reassigning
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {reassigning ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Reassigning...
                    </>
                  ) : (
                    'Confirm Reassignment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReassignTaskRequest;