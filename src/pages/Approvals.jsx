// import React, { useState, useEffect, useMemo } from 'react';
// import { Eye, Check, X, List, Grid, Plus, RefreshCw, AlertCircle, User, Clock } from 'lucide-react';
// import { toast } from 'sonner';
// import fetchWithTenant from '../utils/fetchWithTenant';
// import { useSelector } from 'react-redux';
// import { selectUser } from '../redux/slices/authSlice';

// const Approvals = () => {
//   const user = useSelector(selectUser);
//   const [view, setView] = useState('card'); // card | list
//   const [loading, setLoading] = useState(true);
//   const [employees, setEmployees] = useState([]);
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [showReassignModal, setShowReassignModal] = useState(false);
//   const [selectedAssignee, setSelectedAssignee] = useState('');
//   const [rawRequests, setRawRequests] = useState([]);
//   const [reassigning, setReassigning] = useState(false);
//   const [approvingRequestId, setApprovingRequestId] = useState(null);
//   const [rejectingRequestId, setRejectingRequestId] = useState(null);
//   const [pendingApprovalRequestId, setPendingApprovalRequestId] = useState(null);

//   // Load task reassignment requests
//   const loadReassignmentRequests = async () => {
//     try {
//       setLoading(true);
//       const resp = await fetchWithTenant('/api/tasks/reassign-requests');
      
//       if (resp && resp.success && Array.isArray(resp.requests)) {
//         // Group requests by id to handle multiple assignees for approved requests
//         const groupedRequests = resp.requests.reduce((acc, request) => {
//           const key = request.id;
//           if (!acc[key]) {
//             acc[key] = {
//               ...request,
//               assignees: []
//             };
//           }
//           if (request.current_assignee_name) {
//             acc[key].assignees.push({
//               name: request.current_assignee_name,
//               department: request.current_assignee_department_name || 'Unknown Department'
//             });
//           }
//           return acc;
//         }, {});

//         setRawRequests(Object.values(groupedRequests));
//       } else {
//         setRawRequests([]);
//       }
//     } catch (err) {
//       console.error('Error loading reassignment requests:', err);
//       toast.error('Failed to load reassignment requests');
//       setRawRequests([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Load employees for reassignment
//   const loadEmployees = async () => {
//     try {
//       const resp = await fetchWithTenant('/api/manager/employees/all');
//       if (resp && resp.success && Array.isArray(resp.data)) {
//         setEmployees(resp.data);
//       }
//     } catch (err) {
//       console.error('Error loading employees:', err);
//     }
//   };

//   // Initiate approve flow: open modal to select new assignee before calling approve API
//   const handleApproveRequest = (requestId, requestData) => {
//     if (!requestId) return;
//     setSelectedRequest({ ...requestData, id: requestId });
//     setPendingApprovalRequestId(requestId);
//     setShowReassignModal(true);
//   };

//   // Handle reject reassignment request
//   const handleRejectRequest = async (requestId, requestData) => {
//     if (!requestId || rejectingRequestId) return;
//     setRejectingRequestId(requestId);
    
//     try {
//       const taskId = requestData.task_id || requestData.task_public_id;
//       const resp = await fetchWithTenant(`/api/tasks/${taskId}/reassign-requests/${requestId}/reject`, {
//         method: 'POST',
//       });

//       if (resp && resp.error) {
//         throw new Error(resp.error);
//       }

//       toast.success(resp?.message || 'Request rejected. Task unlocked.');
      
//       // Update the request status
//       setRawRequests(prev => prev.map(req => 
//         req.id === requestId 
//           ? { ...req, status: 'REJECTED', requestData: { ...req.requestData, status: 'REJECTED' } }
//           : req
//       ));
      
//       // Reload requests
//       loadReassignmentRequests();
//     } catch (err) {
//       toast.error(err?.message || 'Failed to reject request');
//     } finally {
//       setRejectingRequestId(null);
//     }
//   };

//   // Handle task reassignment after approval
//   const handleReassignTask = async () => {
//     if (!selectedRequest || !selectedAssignee) {
//       toast.error('Select an employee to reassign the task to');
//       return;
//     }
//     // If this modal was opened as part of an approval flow, call the approve endpoint
//     if (pendingApprovalRequestId) {
//       setReassigning(true);
//       setApprovingRequestId(pendingApprovalRequestId);
//       try {
//         const taskId = selectedRequest.task_id || selectedRequest.task_public_id;
//         const resp = await fetchWithTenant(
//           `/api/tasks/${encodeURIComponent(taskId)}/reassign-requests/${pendingApprovalRequestId}/approve`,
//           {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               'Accept': 'application/json'
//             },
//             body: JSON.stringify({ new_assignee_id: selectedAssignee })
//           }
//         );

//         if (resp && resp.error) {
//           throw new Error(resp.error || 'Approve + reassign failed');
//         }

//         toast.success(resp?.message || 'Reassignment approved and applied');
//         setShowReassignModal(false);
//         setSelectedAssignee('');
//         setSelectedRequest(null);
//         setPendingApprovalRequestId(null);
//         loadReassignmentRequests();
//       } catch (err) {
//         console.error('Error approving & reassigning task:', err);
//         toast.error(err?.message || 'Failed to approve and reassign');
//       } finally {
//         setReassigning(false);
//         setApprovingRequestId(null);
//       }
//       return;
//     }

//     // Otherwise perform the legacy PUT-based reassignment
//     setReassigning(true);
//     try {
//       const taskId = selectedRequest.task_id || selectedRequest.task_public_id;
//       const projectId = selectedRequest.project_public_id;

//       const payload = {
//         assigned_to: selectedAssignee,
//         projectId: projectId,
//         status: 'IN_PROGRESS',
//         handleResignationRequestId: selectedRequest.id,
//         stage: 'IN_PROGRESS',
//         task_status: {
//           current_status: 'IN_PROGRESS'
//         },
//         project_id: projectId
//       };

//       const resp = await fetchWithTenant(`/api/projects/tasks/${encodeURIComponent(taskId)}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           'Accept': 'application/json'
//         },
//         body: JSON.stringify(payload)
//       });

//       if (resp && resp.error) {
//         throw new Error(resp.error || 'Reassignment failed');
//       }

//       toast.success('Task reassigned successfully!');
//       setShowReassignModal(false);
//       setSelectedAssignee('');
//       setSelectedRequest(null);
//       loadReassignmentRequests();
//     } catch (err) {
//       console.error('Error reassigning task:', err);
//       toast.error(err?.message || 'Reassignment failed');
//     } finally {
//       setReassigning(false);
//     }
//   };

//   // Format requests with project and department names
//   const approvals = useMemo(() => {
//     return rawRequests.map(request => ({
//       id: request.id,
//       type: 'task_reassignment',
//       department: request.project_department_names || `Project ${request.project_id || 'Unknown'}`,
//       project: request.project_name || `Project ${request.project_id || 'Unknown'}`,
//       title: `Task Reassignment: ${request.task_title || 'Unknown Task'}`,
//       requester: request.requester_name || 'Unknown',
//       assignedTo: request.assignees && request.assignees.length > 0 
//         ? request.assignees.map(a => `${a.name} (${a.department})`).join(', ')
//         : 'Unassigned',
//       date: request.requested_at,
//       status: request.status === 'PENDING' ? 'Pending' : 
//               request.status === 'APPROVE' ? 'Approved' : 
//               request.status === 'REJECT' ? 'Rejected' : request.status,
//       requestData: request,
//       reason: request.reason,
//       task: {
//         id: request.task_id,
//         public_id: request.task_public_id,
//         title: request.task_title,
//         status: request.task_status,
//         taskDate: request.taskDate,
//         priority: request.priority,
//         project_id: request.project_id
//       }
//     }));
//   }, [rawRequests]);

//   // Legacy handlers for backward compatibility (can be removed if not needed)
//   const handleApprove = (id) => {
//     const request = rawRequests.find(a => a.id === id);
//     if (request && request.task_id) {
//       handleApproveRequest(id, request);
//     } else {
//       setRawRequests((prev) =>
//         prev.map((a) => (a.id === id ? { ...a, status: 'APPROVED' } : a))
//       );
//     }
//   };

//   const handleReject = (id) => {
//     const request = rawRequests.find(a => a.id === id);
//     if (request && request.task_id) {
//       handleRejectRequest(id, request);
//     } else {
//       setRawRequests((prev) =>
//         prev.map((a) => (a.id === id ? { ...a, status: 'REJECTED' } : a))
//       );
//     }
//   };

//   // Load data on component mount
//   useEffect(() => {
//     loadReassignmentRequests();
//     loadEmployees();
//   }, []);

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
//         <div>
//           <h2 className="text-3xl font-bold text-gray-800">Approval Workflows</h2>
//           <p className="text-gray-600">Manage task reassignment requests and other approvals</p>
//         </div>
//         <div className="flex gap-2">
//           <button
//             onClick={loadReassignmentRequests}
//             disabled={loading}
//             className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
//             title="Refresh"
//           >
//             <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
//             <span className="hidden sm:inline">Refresh</span>
//           </button>
//           <button
//             className={`p-2 rounded-lg ${view === 'card' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border hover:bg-gray-100'}`}
//             onClick={() => setView('card')}
//             title="Card View"
//           >
//             <Grid size={18} />
//           </button>
//           <button
//             className={`p-2 rounded-lg ${view === 'list' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border hover:bg-gray-100'}`}
//             onClick={() => setView('list')}
//             title="List View"
//           >
//             <List size={18} />
//           </button>
//         </div>
//       </div>

//       {/* ---------------- CARD VIEW ---------------- */}
//       {view === 'card' && (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//           {loading ? (
//             <div className="col-span-full flex justify-center items-center py-12">
//               <RefreshCw size={24} className="animate-spin text-blue-500" />
//               <span className="ml-2 text-gray-600">Loading requests...</span>
//             </div>
//           ) : approvals.length === 0 ? (
//             <div className="col-span-full text-center py-12">
//               <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
//               <h3 className="text-lg font-semibold text-gray-600 mb-2">No Pending Approvals</h3>
//               <p className="text-gray-500">All requests have been processed.</p>
//             </div>
//           ) : (
//             approvals.map((a) => (
//               <div
//                 key={a.id}
//                 className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-5 flex flex-col justify-between"
//               >
//                 <div>
//                   <div className="flex items-start justify-between mb-3">
//                     <h3 className="text-lg font-semibold mb-3 text-gray-800 flex-1">{a.title}</h3>
//                     {a.type === 'task_reassignment' && (
//                       <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full ml-2 flex-shrink-0">
//                         Task Reassignment
//                       </span>
//                     )}
//                   </div>
                  
//                   <div className="text-gray-600 text-sm mb-1">
//                     <span className="font-medium">Dept:</span> {a.department}
//                   </div>
//                   <div className="text-gray-600 text-sm mb-1">
//                     <span className="font-medium">Project:</span> {a.project}
//                   </div>
//                   <div className="text-gray-600 text-sm mb-1">
//                     <span className="font-medium">Requester:</span> {a.requester}
//                   </div>
//                   <div className="text-gray-600 text-sm mb-2">
//                     <span className="font-medium">Current Assignee:</span> {a.assignedTo}
//                   </div>
                  
//                   {a.reason && (
//                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
//                       <div className="flex items-start gap-2">
//                         <AlertCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
//                         <div>
//                           <p className="text-sm font-medium text-blue-800 mb-1">Reason for Reassignment:</p>
//                           <p className="text-sm text-blue-700">{a.reason}</p>
//                         </div>
//                       </div>
//                     </div>
//                   )}
                  
//                   <div className="text-gray-600 text-sm mb-3">
//                     <span className="font-medium">Date:</span> {a.date ? new Date(a.date).toLocaleDateString() : 'N/A'}
//                   </div>
                  
//                   <span
//                     className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                       a.status === 'Approved'
//                         ? 'bg-green-500 text-white'
//                         : a.status === 'Rejected'
//                         ? 'bg-red-500 text-white'
//                         : 'bg-yellow-500 text-white'
//                     }`}
//                   >
//                     {a.status}
//                   </span>
//                 </div>

//                 {/* Actions */}
//                 <div className="mt-4 flex gap-2">
//                   <button
//                     onClick={() => alert(`Viewing details for: ${a.title}`)}
//                     className="flex-1 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex justify-center items-center gap-1"
//                   >
//                     <Eye size={16} /> View
//                   </button>
//                   {a.status === 'Pending' && (
//                     <>
//                       <button
//                         onClick={() => handleApprove(a.id)}
//                         disabled={approvingRequestId === a.id}
//                         className="flex-1 p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex justify-center items-center gap-1"
//                       >
//                         {approvingRequestId === a.id ? (
//                           <RefreshCw size={16} className="animate-spin" />
//                         ) : (
//                           <Check size={16} />
//                         )}
//                         Approve
//                       </button>
//                       <button
//                         onClick={() => handleReject(a.id)}
//                         disabled={rejectingRequestId === a.id}
//                         className="flex-1 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex justify-center items-center gap-1"
//                       >
//                         {rejectingRequestId === a.id ? (
//                           <RefreshCw size={16} className="animate-spin" />
//                         ) : (
//                           <X size={16} />
//                         )}
//                         Reject
//                       </button>
//                     </>
//                   )}
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       )}

//       {/* ---------------- LIST VIEW ---------------- */}
//       {view === 'list' && (
//         <div className="overflow-auto rounded-xl border bg-white shadow-md">
//           <table className="min-w-full text-left">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="px-4 py-3 text-gray-700">Type</th>
//                 <th className="px-4 py-3 text-gray-700">Dept</th>
//                 <th className="px-4 py-3 text-gray-700">Project</th>
//                 <th className="px-4 py-3 text-gray-700">Title</th>
//                 <th className="px-4 py-3 text-gray-700">Requester</th>
//                 <th className="px-4 py-3 text-gray-700">Current Assignee</th>
//                 <th className="px-4 py-3 text-gray-700">Date</th>
//                 <th className="px-4 py-3 text-gray-700">Status</th>
//                 <th className="px-4 py-3 text-gray-700">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan="9" className="px-4 py-8 text-center">
//                     <RefreshCw size={20} className="animate-spin text-blue-500 mx-auto mb-2" />
//                     <span className="text-gray-600">Loading requests...</span>
//                   </td>
//                 </tr>
//               ) : approvals.length === 0 ? (
//                 <tr>
//                   <td colSpan="9" className="px-4 py-8 text-center">
//                     <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
//                     <div className="text-gray-600 font-medium">No Pending Approvals</div>
//                     <div className="text-gray-500 text-sm">All requests have been processed.</div>
//                   </td>
//                 </tr>
//               ) : (
//                 approvals.map((a) => (
//                   <tr key={a.id} className="border-b hover:bg-gray-50 transition-colors">
//                     <td className="px-4 py-3">
//                       {a.type === 'task_reassignment' ? (
//                         <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
//                           Task Reassignment
//                         </span>
//                       ) : (
//                         <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
//                           General
//                         </span>
//                       )}
//                     </td>
//                     <td className="px-4 py-3">{a.department}</td>
//                     <td className="px-4 py-3">{a.project}</td>
//                     <td className="px-4 py-3">
//                       <div>
//                         <div className="font-medium">{a.title}</div>
//                         {a.reason && (
//                           <div className="text-xs text-blue-600 mt-1 max-w-xs truncate" title={a.reason}>
//                             Reason: {a.reason}
//                           </div>
//                         )}
//                       </div>
//                     </td>
//                     <td className="px-4 py-3">{a.requester}</td>
//                     <td className="px-4 py-3">{a.assignedTo}</td>
//                     <td className="px-4 py-3">{a.date ? new Date(a.date).toLocaleDateString() : 'N/A'}</td>
//                     <td className="px-4 py-3">
//                       <span
//                         className={`px-2 py-1 rounded-full text-xs font-semibold ${
//                           a.status === 'Approved'
//                             ? 'bg-green-500 text-white'
//                             : a.status === 'Rejected'
//                             ? 'bg-red-500 text-white'
//                             : 'bg-yellow-500 text-white'
//                         }`}
//                       >
//                         {a.status}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3 flex gap-2">
//                       <button
//                         onClick={() => alert(`Viewing ${a.title}`)}
//                         className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
//                       >
//                         <Eye size={16} />
//                       </button>
//                       {a.status === 'Pending' && (
//                         <>
//                           <button
//                             onClick={() => handleApprove(a.id)}
//                             disabled={approvingRequestId === a.id}
//                             className="p-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 flex items-center justify-center"
//                           >
//                             {approvingRequestId === a.id ? (
//                               <RefreshCw size={16} className="animate-spin" />
//                             ) : (
//                               <Check size={16} />
//                             )}
//                           </button>
//                           <button
//                             onClick={() => handleReject(a.id)}
//                             disabled={rejectingRequestId === a.id}
//                             className="p-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 flex items-center justify-center"
//                           >
//                             {rejectingRequestId === a.id ? (
//                               <RefreshCw size={16} className="animate-spin" />
//                             ) : (
//                               <X size={16} />
//                             )}
//                           </button>
//                         </>
//                       )}
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Reassignment Modal */}
//       {showReassignModal && selectedRequest && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
//           <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in duration-200">
//             <button
//               onClick={() => {
//                 setShowReassignModal(false);
//                 setSelectedAssignee('');
//                 setSelectedRequest(null);
//               }}
//               className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
//             >
//               <X size={20} />
//             </button>

//             <div className="text-center mb-6">
//               <User size={48} className="mx-auto text-blue-600 mb-4" />
//               <h3 className="text-xl font-bold text-gray-900 mb-2">Reassign Task</h3>
//               <p className="text-sm text-gray-500">
//                 Select a new employee to assign this task to
//               </p>
//             </div>

//             <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
//               <h4 className="font-semibold text-gray-900 mb-2">Task Details</h4>
//               <p className="text-sm text-gray-700 mb-1">"{selectedRequest.task_title || 'Unknown Task'}"</p>
//               <p className="text-xs text-gray-500">From: {selectedRequest.requester_name || 'Unknown'}</p>
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Assign to Employee <span className="text-red-500">*</span>
//                 </label>
//                 <select
//                   value={selectedAssignee}
//                   onChange={(e) => setSelectedAssignee(e.target.value)}
//                   className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
//                   disabled={reassigning}
//                 >
//                   <option value="">Select an employee...</option>
//                   {employees.map((employee) => (
//                     <option key={employee.id || employee._id} value={employee.id || employee._id}>
//                       {employee.name || employee.full_name || `${employee.first_name} ${employee.last_name}`}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div className="pt-4 border-t border-gray-200">
//                 <button
//                   onClick={handleReassignTask}
//                   disabled={reassigning || !selectedAssignee}
//                   className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
//                 >
//                   {reassigning ? (
//                     <>
//                       <RefreshCw size={18} className="animate-spin inline-block mr-2" />
//                       Reassigning...
//                     </>
//                   ) : (
//                     'Reassign Task'
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Approvals;


import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from '../icons';
import ViewToggle from "../components/ViewToggle";

const { Eye, Check, X, List, Grid, Plus, RefreshCw, AlertCircle, User, Clock, ChevronRight, Rows4, LayoutGrid } = Icons;
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/slices/authSlice';

const Approvals = () => {
  const user = useSelector(selectUser);
  const [view, setView] = useState('list'); // card | list
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [rawRequests, setRawRequests] = useState([]);
  const [reassigning, setReassigning] = useState(false);
  const [approvingRequestId, setApprovingRequestId] = useState(null);
  const [rejectingRequestId, setRejectingRequestId] = useState(null);
  const [pendingApprovalRequestId, setPendingApprovalRequestId] = useState(null);

  // Load task reassignment requests
  const loadReassignmentRequests = async () => {
    try {
      setLoading(true);
      const resp = await fetchWithTenant('/api/tasks/reassign-requests');
      
      if (resp && resp.success && Array.isArray(resp.requests)) {
        const groupedRequests = resp.requests.reduce((acc, request) => {
          const key = request.id;
          if (!acc[key]) {
            acc[key] = {
              ...request,
              assignees: []
            };
          }
          if (request.current_assignee_name) {
            acc[key].assignees.push({
              name: request.current_assignee_name,
              department: request.current_assignee_department_name || 'Unknown Department'
            });
          }
          return acc;
        }, {});

        setRawRequests(Object.values(groupedRequests));
      } else {
        setRawRequests([]);
      }
    } catch (err) {
      console.error('Error loading reassignment requests:', err);
      toast.error('Failed to load reassignment requests');
      setRawRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Load employees for reassignment
  const loadEmployees = async () => {
    try {
      const resp = await fetchWithTenant('/api/manager/employees/all');
      if (resp && resp.success && Array.isArray(resp.data)) {
        setEmployees(resp.data);
      }
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  // Handle approve request flow
  const handleApproveRequest = (requestId, requestData) => {
    if (!requestId) return;
    setSelectedRequest({ ...requestData, id: requestId });
    setPendingApprovalRequestId(requestId);
    setShowReassignModal(true);
  };

  // Handle reject reassignment request
  const handleRejectRequest = async (requestId, requestData) => {
    if (!requestId || rejectingRequestId) return;
    setRejectingRequestId(requestId);
    
    try {
      const taskId = requestData.task_id || requestData.task_public_id;
      const resp = await fetchWithTenant(`/api/tasks/${taskId}/reassign-requests/${requestId}/reject`, {
        method: 'POST',
      });

      if (resp && resp.error) {
        throw new Error(resp.error);
      }

      toast.success(resp?.message || 'Request rejected. Task unlocked.');
      
      setRawRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'REJECTED' }
          : req
      ));
      
      loadReassignmentRequests();
    } catch (err) {
      toast.error(err?.message || 'Failed to reject request');
    } finally {
      setRejectingRequestId(null);
    }
  };

  // Handle task reassignment after approval
  const handleReassignTask = async () => {
    if (!selectedRequest || !selectedAssignee) {
      toast.error('Select an employee to reassign the task to');
      return;
    }
    
    if (pendingApprovalRequestId) {
      setReassigning(true);
      setApprovingRequestId(pendingApprovalRequestId);
      try {
        const taskId = selectedRequest.task_id || selectedRequest.task_public_id;
        const resp = await fetchWithTenant(
          `/api/tasks/${encodeURIComponent(taskId)}/reassign-requests/${pendingApprovalRequestId}/approve`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ new_assignee_id: selectedAssignee })
          }
        );

        if (resp && resp.error) {
          throw new Error(resp.error || 'Approve + reassign failed');
        }

        toast.success(resp?.message || 'Reassignment approved and applied');
        setShowReassignModal(false);
        setSelectedAssignee('');
        setSelectedRequest(null);
        setPendingApprovalRequestId(null);
        loadReassignmentRequests();
      } catch (err) {
        console.error('Error approving & reassigning task:', err);
        toast.error(err?.message || 'Failed to approve and reassign');
      } finally {
        setReassigning(false);
        setApprovingRequestId(null);
      }
      return;
    }

    setReassigning(true);
    try {
      const taskId = selectedRequest.task_id || selectedRequest.task_public_id;
      const projectId = selectedRequest.project_public_id;

      const payload = {
        assigned_to: selectedAssignee,
        projectId: projectId,
        status: 'IN_PROGRESS',
        handleResignationRequestId: selectedRequest.id,
        stage: 'IN_PROGRESS',
        task_status: {
          current_status: 'IN_PROGRESS'
        },
        project_id: projectId
      };

      const resp = await fetchWithTenant(`/api/projects/tasks/${encodeURIComponent(taskId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (resp && resp.error) {
        throw new Error(resp.error || 'Reassignment failed');
      }

      toast.success('Task reassigned successfully!');
      setShowReassignModal(false);
      setSelectedAssignee('');
      setSelectedRequest(null);
      loadReassignmentRequests();
    } catch (err) {
      console.error('Error reassigning task:', err);
      toast.error(err?.message || 'Reassignment failed');
    } finally {
      setReassigning(false);
    }
  };

  // Format requests
  const approvals = useMemo(() => {
    return rawRequests.map(request => ({
      id: request.id,
      type: 'task_reassignment',
      department: request.project_department_names || `Project ${request.project_id || 'Unknown'}`,
      project: request.project_name || `Project ${request.project_id || 'Unknown'}`,
      title: `Task Reassignment: ${request.task_title || 'Unknown Task'}`,
      requester: request.requester_name || 'Unknown',
      assignedTo: (
        request.new_assignee_name ? request.new_assignee_name : (
          request.assignees && request.assignees.length > 0
            ? request.assignees.map(a => `${a.name} (${a.department})`).join(', ')
            : 'Unassigned'
        )
      ),
      date: request.requested_at ? new Date(request.requested_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : 'N/A',
      time: request.requested_at ? new Date(request.requested_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }) : '',
      status: request.status === 'PENDING' ? 'Pending' : 
              request.status === 'APPROVE' ? 'Approved' : 
              request.status === 'REJECT' ? 'Rejected' : request.status,
      requestData: request,
      reason: request.reason,
      task: {
        id: request.task_id,
        public_id: request.task_public_id,
        title: request.task_title,
        status: request.task_status,
        taskDate: request.taskDate,
        priority: request.priority,
        project_id: request.project_id
      }
    }));
  }, [rawRequests]);

  // Legacy handlers
  const handleApprove = (id) => {
    const request = rawRequests.find(a => a.id === id);
    if (request) {
      handleApproveRequest(id, request);
    }
  };

  const handleReject = (id) => {
    const request = rawRequests.find(a => a.id === id);
    if (request) {
      handleRejectRequest(id, request);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadReassignmentRequests();
    loadEmployees();
  }, []);

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="w-full">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Approval Workflows</h2>
          <p className="text-gray-600 text-sm md:text-base">Manage task reassignment requests and other approvals</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={loadReassignmentRequests}
            disabled={loading}
            className="flex-1 md:flex-none p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={loading ? 'tm-icon animate-spin' : 'tm-icon'} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <ViewToggle
            mode={view === 'list' ? 'list' : 'grid'}
            onChange={(mode) => setView(mode === 'list' ? 'list' : 'card')}
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Requests</p>
              <p className="text-2xl font-bold text-gray-800">{approvals.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="tm-icon text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {approvals.filter(a => a.status === 'Pending').length}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="tm-icon text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Processed</p>
              <p className="text-2xl font-bold text-green-600">
                {approvals.filter(a => a.status !== 'Pending').length}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="tm-icon text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- CARD VIEW ---------------- */}
      {view === 'card' && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">
              Reassignment Requests ({approvals.filter(a => a.status === 'Pending').length} pending)
            </h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <RefreshCw className="tm-icon-hero animate-spin text-blue-500 mb-4" />
                <p className="text-gray-600">Loading requests...</p>
              </div>
            ) : approvals.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="max-w-md mx-auto">
                  <AlertCircle className="tm-icon-hero mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Approval Requests</h3>
                  <p className="text-gray-500 mb-4">All reassignment requests have been processed.</p>
                </div>
              </div>
            ) : (
              approvals.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-800 truncate mb-1" title={a.title}>
                          {a.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                            Task Reassignment
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              a.status === 'Approved'
                                ? 'bg-green-100 text-green-800'
                                : a.status === 'Rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {a.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Department</p>
                        <p className="text-sm font-medium text-gray-800 truncate" title={a.department}>
                          {a.department}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Project</p>
                        <p className="text-sm font-medium text-gray-800 truncate" title={a.project}>
                          {a.project}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Requester</p>
                        <p className="text-sm font-medium text-gray-800 truncate" title={a.requester}>
                          {a.requester}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date</p>
                        <p className="text-sm font-medium text-gray-800">{a.date}</p>
                      </div>
                    </div>

                    {/* Assignee Info */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Current Assignee(s)</p>
                      <p className="text-sm text-gray-800 line-clamp-2" title={a.assignedTo}>
                        {a.assignedTo}
                      </p>
                    </div>

                    {/* Reason */}
                    {a.reason && (
                      <div className="mb-4">
                        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <AlertCircle className="tm-icon text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-blue-800 mb-1">Reason for Reassignment:</p>
                            <p className="text-sm text-blue-700 line-clamp-3" title={a.reason}>
                              {a.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex gap-2">
                        <button
                          onClick={() => console.log('View details:', a.id)}
                          className="flex-1 p-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1 transition-colors"
                        >
                          <Eye className="tm-icon" /> Details
                        </button>
                        {a.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(a.id)}
                              disabled={approvingRequestId === a.id}
                              className="flex-1 p-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-1 transition-colors"
                            >
                              {approvingRequestId === a.id ? (
                                <RefreshCw className="tm-icon animate-spin" />
                              ) : (
                                <Check className="tm-icon" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(a.id)}
                              disabled={rejectingRequestId === a.id}
                              className="flex-1 p-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1 transition-colors"
                            >
                              {rejectingRequestId === a.id ? (
                                <RefreshCw className="tm-icon animate-spin" />
                              ) : (
                                <X className="tm-icon" />
                              )}
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ---------------- LIST VIEW ---------------- */}
      {view === 'list' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requester
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Assignee
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="tm-icon-xl animate-spin text-blue-500 mb-2" />
                        <p className="text-gray-600">Loading requests...</p>
                      </div>
                    </td>
                  </tr>
                ) : approvals.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="tm-icon-xl text-gray-400 mb-2" />
                        <p className="text-gray-600 font-medium">No Approval Requests</p>
                        <p className="text-gray-500 text-sm">All requests have been processed.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  approvals.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                          Task Reassignment
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0 max-w-xs">
                          <p className="text-sm font-medium text-gray-900 truncate" title={a.title}>
                            {a.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 truncate" title={a.project}>
                              {a.project}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-500 truncate" title={a.department}>
                              {a.department}
                            </span>
                          </div>
                          {a.reason && (
                            <p className="text-xs text-blue-600 truncate mt-1" title={a.reason}>
                              {a.reason}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                            <User className="tm-icon text-gray-500" />
                          </div>
                          <span className="text-sm text-gray-900 truncate" title={a.requester}>
                            {a.requester}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700 line-clamp-2 max-w-xs" title={a.assignedTo}>
                          {a.assignedTo}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{a.date}</div>
                        <div className="text-xs text-gray-500">{a.time}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            a.status === 'Approved'
                              ? 'bg-green-100 text-green-800'
                              : a.status === 'Rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => console.log('View details:', a.id)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="tm-icon" />
                          </button>
                          {a.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(a.id)}
                                disabled={approvingRequestId === a.id}
                                className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded disabled:opacity-50 transition-colors"
                                title="Approve"
                              >
                                {approvingRequestId === a.id ? (
                                  <RefreshCw className="tm-icon animate-spin" />
                                ) : (
                                  <Check className="tm-icon" />
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(a.id)}
                                disabled={rejectingRequestId === a.id}
                                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50 transition-colors"
                                title="Reject"
                              >
                                {rejectingRequestId === a.id ? (
                                  <RefreshCw className="tm-icon animate-spin" />
                                ) : (
                                  <X className="tm-icon" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reassignment Modal */}
      {showReassignModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in duration-200">
            <button
              onClick={() => {
                setShowReassignModal(false);
                setSelectedAssignee('');
                setSelectedRequest(null);
                setPendingApprovalRequestId(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="tm-icon" />
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <User className="tm-icon-xl text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Reassign Task</h3>
              <p className="text-sm text-gray-500">
                Select a new employee to assign this task to
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Task Details</h4>
              <p className="text-sm text-gray-700 mb-1">
                "{selectedRequest.task_title || 'Unknown Task'}"
              </p>
              <p className="text-xs text-gray-500">
                From: {selectedRequest.requester_name || 'Unknown'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Assign to Employee <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  disabled={reassigning}
                >
                  <option value="">Select an employee...</option>
                  {employees.map((employee) => (
                    <option key={employee.id || employee._id} value={employee.id || employee._id}>
                      {employee.name || employee.full_name || `${employee.first_name} ${employee.last_name}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleReassignTask}
                  disabled={reassigning || !selectedAssignee}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {reassigning ? (
                    <>
                      <RefreshCw className="tm-icon animate-spin" />
                      Processing...
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

export default Approvals;