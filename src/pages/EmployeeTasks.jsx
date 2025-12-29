// import React, { useEffect, useMemo, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { toast } from 'sonner';
// import fetchWithTenant from '../utils/fetchWithTenant';
// import ReassignTaskRequestModal from './ReassignTaskRequest';
// import { Clock, AlertCircle, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

// const formatDateString = (value) => {
//   if (!value) return '—';
//   const parsed = new Date(value);
//   if (Number.isNaN(parsed.getTime())) return value;
//   return parsed.toLocaleDateString();
// };

// const formatDateTime = (value) => {
//   if (!value) return '—';
//   const parsed = new Date(value);
//   if (Number.isNaN(parsed.getTime())) return value;
//   return parsed.toLocaleString('en-US', {
//     month: 'short',
//     day: 'numeric',
//     year: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit'
//   });
// };

// const formatForInput = (value) => {
//   if (!value) return '';
//   const parsed = new Date(value);
//   if (Number.isNaN(parsed.getTime())) return '';
//   return parsed.toISOString().split('T')[0];
// };

// const normalizeId = (entity) =>
//   entity?.id || entity?._id || entity?.public_id || entity?.task_id || '';

// const EmployeeTasks = () => {
//   const [tasks, setTasks] = useState([]);
//   const [selectedTaskId, setSelectedTaskId] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [checklistForm, setChecklistForm] = useState({ title: '', dueDate: '' });
//   const [editingChecklistId, setEditingChecklistId] = useState('');
//   const [editingChecklistValues, setEditingChecklistValues] = useState({ title: '', dueDate: '' });
//   const [actionRunning, setActionRunning] = useState(false);
//   const [reassignRequests, setReassignRequests] = useState({});
//   const [loadingReassignStatus, setLoadingReassignStatus] = useState({});
//   const [expandedRequests, setExpandedRequests] = useState({});

//   // Modal state
//   const [reassignModalOpen, setReassignModalOpen] = useState(false);
//   const [taskForReassign, setTaskForReassign] = useState(null);

//   // Load tasks
//   const loadTasks = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await fetchWithTenant('/api/employee/my-tasks');
//       const payload = response?.data || response || [];
//       if (!Array.isArray(payload)) {
//         throw new Error('Unexpected task data');
//       }
//       setTasks(payload);
//     } catch (err) {
//       setError(err?.message || 'Unable to load tasks');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Load reassignment requests for a specific task
//   const loadReassignmentRequests = async (taskId) => {
//     if (!taskId) return;
    
//     setLoadingReassignStatus(prev => ({ ...prev, [taskId]: true }));
//     try {
//       const response = await fetchWithTenant(`/api/tasks/${taskId}/reassign-requests`);
//       if (response?.success && response.requests) {
//         setReassignRequests(prev => ({
//           ...prev,
//           [taskId]: response.requests
//         }));
//       } else {
//         // Clear requests if none exist
//         setReassignRequests(prev => {
//           const newState = { ...prev };
//           delete newState[taskId];
//           return newState;
//         });
//       }
//     } catch (err) {
//       console.error('Failed to load reassignment requests:', err);
//     } finally {
//       setLoadingReassignStatus(prev => ({ ...prev, [taskId]: false }));
//     }
//   };

//   // Load reassignment requests for all tasks
//   const loadAllReassignmentRequests = async () => {
//     const taskIds = tasks.map(task => normalizeId(task));
//     for (const taskId of taskIds) {
//       if (taskId) {
//         await loadReassignmentRequests(taskId);
//       }
//     }
//   };

//   // Initialize
//   useEffect(() => {
//     loadTasks();
//   }, []);

//   // When tasks are loaded, fetch their reassignment requests
//   useEffect(() => {
//     if (tasks.length > 0) {
//       loadAllReassignmentRequests();
//     }
//   }, [tasks]);

//   // Set default selected task
//   useEffect(() => {
//     if (tasks.length && !selectedTaskId) {
//       setSelectedTaskId(normalizeId(tasks[0]));
//     }
//     if (!tasks.length) {
//       setSelectedTaskId('');
//     }
//   }, [tasks, selectedTaskId]);

//   const selectedTask = useMemo(() => {
//     if (!selectedTaskId) return null;
//     return tasks.find((task) => normalizeId(task) === selectedTaskId) || null;
//   }, [tasks, selectedTaskId]);

//   const checklistItems = useMemo(() => {
//     if (!selectedTask) return [];
//     return (
//       selectedTask.checklist ||
//       selectedTask.checkList ||
//       selectedTask.items ||
//       selectedTask.subtasks ||
//       []
//     );
//   }, [selectedTask]);

//   // Get latest reassignment request for a task
//   const getLatestReassignRequest = (taskId) => {
//     const requests = reassignRequests[taskId];
//     if (!requests || !Array.isArray(requests) || requests.length === 0) {
//       return null;
//     }
//     // Sort by requested_at descending and get the latest
//     const sortedRequests = [...requests].sort((a, b) => 
//       new Date(b.requested_at) - new Date(a.requested_at)
//     );
//     return sortedRequests[0];
//   };

//   // Get all reassignment requests for a task
//   const getAllReassignRequests = (taskId) => {
//     const requests = reassignRequests[taskId];
//     if (!requests || !Array.isArray(requests)) {
//       return [];
//     }
//     // Sort by requested_at descending
//     return [...requests].sort((a, b) => 
//       new Date(b.requested_at) - new Date(a.requested_at)
//     );
//   };

//   const stats = useMemo(() => {
//     const stageCounters = { pending: 0, in_progress: 0, completed: 0 };
//     const overdue = [];
//     const now = Date.now();
//     tasks.forEach((task) => {
//       const stage = (task.stage || task.status || 'pending').toString().toLowerCase();
//       if (stageCounters[stage] !== undefined) {
//         stageCounters[stage] += 1;
//       }
//       const dueDate = new Date(task.taskDate || task.dueDate || task.due_date || null);
//       if (!Number.isNaN(dueDate.getTime()) && dueDate.getTime() < now && stage !== 'completed') {
//         overdue.push(task);
//       }
//     });
//     return {
//       total: tasks.length,
//       overdue: overdue.length,
//       stageCounters,
//     };
//   }, [tasks]);

//   // Handle reassignment request response
//   const handleReassignResponse = async (response) => {
//     if (response?.success) {
//       const taskId = normalizeId(response.request.task_id);
      
//       // Reload the requests for this task
//       await loadReassignmentRequests(taskId);
      
//       toast.success(response.message || 'Reassignment request sent successfully');
      
//       // Refresh the task list
//       await loadTasks();
//     }
//   };

//   // Get status display info
//   const getStatusInfo = (status) => {
//     const statusUpper = status?.toUpperCase();
    
//     switch (statusUpper) {
//       case 'PENDING':
//         return {
//           bg: 'bg-yellow-50',
//           border: 'border-yellow-200',
//           text: 'text-yellow-800',
//           icon: <AlertCircle className="w-4 h-4 text-yellow-600" />,
//           label: 'Pending Review',
//           badgeClass: 'bg-yellow-100 text-yellow-800'
//         };
//       case 'APPROVED':
//         return {
//           bg: 'bg-green-50',
//           border: 'border-green-200',
//           text: 'text-green-800',
//           icon: <CheckCircle className="w-4 h-4 text-green-600" />,
//           label: 'Approved',
//           badgeClass: 'bg-green-100 text-green-800'
//         };
//       case 'REJECTED':
//         return {
//           bg: 'bg-red-50',
//           border: 'border-red-200',
//           text: 'text-red-800',
//           icon: <XCircle className="w-4 h-4 text-red-600" />,
//           label: 'Rejected',
//           badgeClass: 'bg-red-100 text-red-800'
//         };
//       default:
//         return {
//           bg: 'bg-gray-50',
//           border: 'border-gray-200',
//           text: 'text-gray-800',
//           icon: <AlertCircle className="w-4 h-4 text-gray-600" />,
//           label: status || 'Unknown',
//           badgeClass: 'bg-gray-100 text-gray-800'
//         };
//     }
//   };

//   // Toggle expanded view for requests
//   const toggleExpandedRequests = (taskId) => {
//     setExpandedRequests(prev => ({
//       ...prev,
//       [taskId]: !prev[taskId]
//     }));
//   };

//   // Handle checklist functions
//   const handleAddChecklist = async (event) => {
//     event.preventDefault();
//     if (!selectedTask) {
//       toast.error('Select a task before adding checklist items');
//       return;
//     }
//     if (!checklistForm.title.trim()) {
//       toast.error('Checklist title is required');
//       return;
//     }
//     setActionRunning(true);
//     try {
//       const payload = {
//         taskId: normalizeId(selectedTask),
//         title: checklistForm.title.trim(),
//         dueDate: checklistForm.dueDate || undefined,
//       };
//       const resp = await fetchWithTenant('/api/employee/subtask', {
//         method: 'POST',
//         body: JSON.stringify(payload),
//       });
//       toast.success(resp?.message || 'Checklist item added');
//       setChecklistForm({ title: '', dueDate: '' });
//       await loadTasks();
//     } catch (err) {
//       toast.error(err?.message || 'Unable to add checklist item');
//     } finally {
//       setActionRunning(false);
//     }
//   };

//   const startEditingChecklist = (item) => {
//     const itemId = normalizeId(item);
//     if (!itemId) return;
//     setEditingChecklistId(itemId);
//     setEditingChecklistValues({
//       title: item.title || item.name || '',
//       dueDate: formatForInput(item.dueDate || item.due_date || item.date),
//     });
//   };

//   const cancelEditing = () => {
//     setEditingChecklistId('');
//     setEditingChecklistValues({ title: '', dueDate: '' });
//   };

//   const handleUpdateChecklist = async () => {
//     if (!editingChecklistId || !selectedTask) return;
//     if (!editingChecklistValues.title.trim()) {
//       toast.error('Checklist title cannot be empty');
//       return;
//     }
//     setActionRunning(true);
//     try {
//       const payload = {
//         title: editingChecklistValues.title.trim(),
//         dueDate: editingChecklistValues.dueDate || undefined,
//         taskId: normalizeId(selectedTask),
//       };
//       const resp = await fetchWithTenant(`/api/employee/subtask/${encodeURIComponent(editingChecklistId)}`, {
//         method: 'PUT',
//         body: JSON.stringify(payload),
//       });
//       toast.success(resp?.message || 'Checklist item updated');
//       cancelEditing();
//       await loadTasks();
//     } catch (err) {
//       toast.error(err?.message || 'Unable to update checklist item');
//     } finally {
//       setActionRunning(false);
//     }
//   };

//   const handleDeleteChecklist = async (item) => {
//     const itemId = normalizeId(item);
//     if (!itemId) return;
//     if (!window.confirm('Remove this checklist item?')) return;
//     setActionRunning(true);
//     try {
//       const resp = await fetchWithTenant(`/api/employee/subtask/${encodeURIComponent(itemId)}`, {
//         method: 'DELETE',
//       });
//       toast.success(resp?.message || 'Checklist item removed');
//       await loadTasks();
//     } catch (err) {
//       toast.error(err?.message || 'Unable to delete checklist item');
//     } finally {
//       setActionRunning(false);
//     }
//   };

//   const handleCompleteChecklist = async (item) => {
//     const itemId = normalizeId(item);
//     if (!itemId) return;
//     setActionRunning(true);
//     try {
//       const resp = await fetchWithTenant(`/api/employee/subtask/${encodeURIComponent(itemId)}/complete`, {
//         method: 'POST',
//       });
//       toast.success(resp?.message || 'Checklist marked complete');
//       await loadTasks();
//     } catch (err) {
//       toast.error(err?.message || 'Unable to update checklist status');
//     } finally {
//       setActionRunning(false);
//     }
//   };

//   // Refresh reassignment requests
//   const refreshReassignmentRequests = (taskId) => {
//     loadReassignmentRequests(taskId);
//   };

//   // Check if task has pending requests
//   const hasPendingRequest = (taskId) => {
//     const requests = reassignRequests[taskId];
//     if (!requests || !Array.isArray(requests)) return false;
//     return requests.some(request => request.status === 'PENDING');
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="space-y-1">
//         <h1 className="text-2xl font-bold">My Tasks</h1>
//         <p className="text-sm text-gray-600">Track your assignments and keep checklists aligned with manager expectations.</p>
//       </div>

//       {/* Stats */}
//       <div className="grid gap-4 sm:grid-cols-3">
//         <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
//           <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Total</p>
//           <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
//           <p className="text-xs text-gray-500">Current assignments</p>
//         </div>
//         <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
//           <p className="text-[10px] uppercase tracking-[0.3em] text-amber-500">Overdue</p>
//           <p className="text-2xl font-semibold text-amber-500">{stats.overdue}</p>
//           <p className="text-xs text-gray-500">Need immediate attention</p>
//         </div>
//         <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
//           <p className="text-[10px] uppercase tracking-[0.3em] text-blue-500">In progress</p>
//           <p className="text-2xl font-semibold text-blue-500">{stats.stageCounters.in_progress}</p>
//           <p className="text-xs text-gray-500">Work you are handling</p>
//         </div>
//       </div>

//       <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1.2fr)]">
//         {/* Task List */}
//         <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
//           <div className="flex flex-wrap items-center justify-between gap-3">
//             <div>
//               <h2 className="text-lg font-semibold text-gray-900">Assigned tasks</h2>
//               <p className="text-xs text-gray-500">{loading ? 'Refreshing tasks…' : `${tasks.length} total tasks`}</p>
//             </div>
//             <div className="flex items-center gap-2 text-xs text-gray-500">
//               <button
//                 type="button"
//                 onClick={loadTasks}
//                 className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 hover:bg-gray-100"
//               >
//                 Refresh All
//               </button>
//               <Link to="/employee/tasks" className="text-blue-600 hover:underline">
//                 Full task view
//               </Link>
//             </div>
//           </div>

//           {loading ? (
//             <div className="mt-6 text-sm text-gray-500">Loading tasks…</div>
//           ) : error ? (
//             <div className="mt-6 text-sm text-red-500">Error: {error}</div>
//           ) : tasks.length === 0 ? (
//             <div className="mt-6 text-sm text-gray-500">No tasks assigned yet.</div>
//           ) : (
//             <div className="mt-4 space-y-3">
//               {tasks.map((task) => {
//                 const taskId = normalizeId(task);
//                 const isActive = taskId === selectedTaskId;
//                 const latestRequest = getLatestReassignRequest(taskId);
//                 const allRequests = getAllReassignRequests(taskId);
//                 const hasRequests = allRequests.length > 0;
//                 const isExpanded = expandedRequests[taskId];
//                 const statusInfo = latestRequest ? getStatusInfo(latestRequest.status) : null;
//                 const hasPending = hasPendingRequest(taskId);
                
//                 return (
//                   <button
//                     key={taskId || task.name || task.title}
//                     type="button"
//                     onClick={() => setSelectedTaskId(taskId)}
//                     className={`w-full rounded-2xl border px-4 py-3 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50 ${
//                       isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
//                     }`}
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <p className="text-base font-semibold text-gray-900">{task.name || task.title || 'Untitled task'}</p>
//                         {task.project?.name && (
//                           <p className="text-xs text-gray-500">Project: {task.project.name}</p>
//                         )}
//                       </div>
//                       <div className="text-right text-xs text-gray-500">
//                         <p>Due {formatDateString(task.due_date || task.dueDate || task.taskDate)}</p>
//                         <p>Priority: {task.priority || 'Medium'}</p>
//                       </div>
//                     </div>
                    
//                     {/* Reassignment status section */}
//                     {hasRequests && (
//                       <div className="mt-2 space-y-2">
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center gap-2">
//                             {statusInfo.icon}
//                             <span className={`text-xs font-medium ${statusInfo.text}`}>
//                               {hasPending ? 'Request Pending' : statusInfo.label}
//                             </span>
//                             <span className="text-xs text-gray-500">
//                               {allRequests.length} request{allRequests.length !== 1 ? 's' : ''}
//                             </span>
//                           </div>
//                           <div className="flex items-center gap-1">
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 refreshReassignmentRequests(taskId);
//                               }}
//                               disabled={loadingReassignStatus[taskId]}
//                               className="text-xs text-gray-400 hover:text-gray-600"
//                             >
//                               <RefreshCw className={`w-3 h-3 ${loadingReassignStatus[taskId] ? 'animate-spin' : ''}`} />
//                             </button>
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 toggleExpandedRequests(taskId);
//                               }}
//                               className="text-xs text-gray-400 hover:text-gray-600"
//                             >
//                               {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
//                             </button>
//                           </div>
//                         </div>
                        
//                         {/* Expanded requests view */}
//                         {isExpanded && allRequests.length > 0 && (
//                           <div className="mt-2 space-y-1">
//                             {allRequests.map((request) => {
//                               const reqStatusInfo = getStatusInfo(request.status);
//                               return (
//                                 <div key={request.id} className={`text-xs p-2 rounded border ${reqStatusInfo.bg} ${reqStatusInfo.border}`}>
//                                   <div className="flex justify-between items-center">
//                                     <span className={`font-medium ${reqStatusInfo.text}`}>
//                                       {reqStatusInfo.label}
//                                     </span>
//                                     <span className="text-gray-500">
//                                       {formatDateTime(request.requested_at)}
//                                     </span>
//                                   </div>
//                                   {request.reason && (
//                                     <p className="mt-1 text-gray-700 truncate" title={request.reason}>
//                                       {request.reason}
//                                     </p>
//                                   )}
//                                 </div>
//                               );
//                             })}
//                           </div>
//                         )}
//                       </div>
//                     )}
                    
//                     <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase">
//                       <span className="rounded-full border border-gray-200 px-3 py-0.5 text-gray-600">
//                         {task.status || task.stage || 'pending'}
//                       </span>
//                       <span className="rounded-full border border-gray-200 px-3 py-0.5 text-gray-600">
//                         {task.project?.name || 'Project not available'}
//                       </span>
//                     </div>
//                   </button>
//                 );
//               })}
//             </div>
//           )}
//         </section>

//         {/* Task Details & Checklist */}
//         <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
//           {!selectedTask ? (
//             <div className="space-y-2 text-sm text-gray-500">
//               <p>Select a task to see richer details and manage its checklist.</p>
//               <p>Checklist items live-update and sync with the employee APIs.</p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {/* Task header */}
//               <div className="flex items-center justify-between gap-3">
//                 <h2 className="text-xl font-semibold text-gray-900">{selectedTask.name || selectedTask.title}</h2>
//                 <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase text-gray-600">
//                   {selectedTask.status || selectedTask.stage || 'pending'}
//                 </span>
//               </div>
//               <p className="text-sm text-gray-500">{selectedTask.project?.name && `Project: ${selectedTask.project.name}`}</p>
//               <p className="text-xs text-gray-400">Due {formatDateString(selectedTask.due_date || selectedTask.dueDate || selectedTask.taskDate)}</p>

//               {/* Task metadata */}
//               <div className="grid grid-cols-2 gap-4 text-sm">
//                 {selectedTask.employee && (
//                   <div>
//                     <p className="text-xs uppercase text-gray-500">Assigned To</p>
//                     <p className="font-medium text-gray-900">{selectedTask.employee.name}</p>
//                   </div>
//                 )}
//                 {selectedTask.manager && (
//                   <div>
//                     <p className="text-xs uppercase text-gray-500">Manager</p>
//                     <p className="font-medium text-gray-900">{selectedTask.manager.name}</p>
//                   </div>
//                 )}
//               </div>

//               {/* Reassign Request Section */}
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <h3 className="text-sm font-semibold text-gray-900">Reassignment Requests</h3>
//                   {getAllReassignRequests(selectedTaskId).length > 0 && (
//                     <button
//                       onClick={() => refreshReassignmentRequests(selectedTaskId)}
//                       disabled={loadingReassignStatus[selectedTaskId]}
//                       className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
//                     >
//                       <RefreshCw className={`w-3 h-3 ${loadingReassignStatus[selectedTaskId] ? 'animate-spin' : ''}`} />
//                       Refresh
//                     </button>
//                   )}
//                 </div>
                
//                 {/* Reassign Request Button */}
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setTaskForReassign(selectedTask);
//                     setReassignModalOpen(true);
//                   }}
//                   disabled={hasPendingRequest(selectedTaskId)}
//                   className={`w-full rounded-full border px-4 py-2 text-sm font-medium ${
//                     hasPendingRequest(selectedTaskId)
//                       ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
//                       : 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
//                   }`}
//                 >
//                   {hasPendingRequest(selectedTaskId)
//                     ? 'Request Pending Review'
//                     : 'Request Reassignment'}
//                 </button>
                
//                 {/* Show reassignment requests if exist */}
//                 {getAllReassignRequests(selectedTaskId).length > 0 && (
//                   <div className="space-y-3">
//                     <div className="flex items-center justify-between">
//                       <p className="text-sm font-medium text-gray-700">
//                         {getAllReassignRequests(selectedTaskId).length} request{getAllReassignRequests(selectedTaskId).length !== 1 ? 's' : ''} submitted
//                       </p>
//                     </div>
                    
//                     {getAllReassignRequests(selectedTaskId).map((request) => {
//                       const statusInfo = getStatusInfo(request.status);
//                       return (
//                         <div key={request.id} className={`rounded-lg border p-4 ${statusInfo.bg} ${statusInfo.border}`}>
//                           <div className="flex items-start justify-between mb-2">
//                             <div className="flex items-center gap-2">
//                               {statusInfo.icon}
//                               <div>
//                                 <p className={`font-medium ${statusInfo.text}`}>
//                                   Request #{request.id} - {statusInfo.label}
//                                 </p>
//                                 <p className="text-xs text-gray-600 flex items-center gap-1">
//                                   <Clock className="w-3 h-3" />
//                                   Submitted: {formatDateTime(request.requested_at)}
//                                 </p>
//                                 {request.responded_at && (
//                                   <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
//                                     <Clock className="w-3 h-3" />
//                                     Responded: {formatDateTime(request.responded_at)}
//                                   </p>
//                                 )}
//                               </div>
//                             </div>
//                             <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.badgeClass}`}>
//                               {request.status}
//                             </span>
//                           </div>
                          
//                           {/* Request Details */}
//                           <div className="mt-3 space-y-2 text-sm">
//                             {request.reason && (
//                               <div>
//                                 <p className="text-gray-600 mb-1">Reason:</p>
//                                 <p className="p-2 bg-white/50 rounded text-gray-700">
//                                   {request.reason}
//                                 </p>
//                               </div>
//                             )}
                            
//                             {request.employee && (
//                               <div className="flex items-center justify-between">
//                                 <span className="text-gray-600">Submitted By:</span>
//                                 <span className="font-medium">{request.employee.name}</span>
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>

//               {/* Description */}
//               {selectedTask.description && (
//                 <div>
//                   <p className="text-xs uppercase text-gray-500">Description</p>
//                   <p className="mt-1 text-sm text-gray-700">{selectedTask.description}</p>
//                 </div>
//               )}

//               {/* Checklist */}
//               <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm">
//                 <p className="text-xs uppercase text-gray-500">Checklist</p>
//                 {checklistItems.length === 0 ? (
//                   <p className="mt-2 text-sm text-gray-500">No checklist items yet.</p>
//                 ) : (
//                   <ul className="mt-3 space-y-3">
//                     {checklistItems.map((item, index) => {
//                       const itemId = normalizeId(item) || `${index}`;
//                       const isEditing = editingChecklistId === itemId;
//                       const dueLabel = formatDateString(item.dueDate || item.due_date || item.date);

//                       if (isEditing) {
//                         return (
//                           <li key={itemId} className="rounded-2xl border border-gray-200 bg-white p-3">
//                             <div className="space-y-2 text-sm">
//                               <input
//                                 type="text"
//                                 placeholder="Checklist title"
//                                 value={editingChecklistValues.title}
//                                 onChange={(e) =>
//                                   setEditingChecklistValues((prev) => ({ ...prev, title: e.target.value }))
//                                 }
//                                 className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
//                               />
//                               <input
//                                 type="date"
//                                 value={editingChecklistValues.dueDate}
//                                 onChange={(e) =>
//                                   setEditingChecklistValues((prev) => ({ ...prev, dueDate: e.target.value }))
//                                 }
//                                 className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
//                               />
//                               <div className="flex items-center gap-2 text-xs">
//                                 <button
//                                   type="button"
//                                   onClick={handleUpdateChecklist}
//                                   disabled={actionRunning}
//                                   className="rounded-full bg-indigo-600 px-4 py-1.5 text-white disabled:opacity-60"
//                                 >
//                                   {actionRunning ? 'Saving…' : 'Save'}
//                                 </button>
//                                 <button
//                                   type="button"
//                                   onClick={cancelEditing}
//                                   className="rounded-full border border-gray-200 px-4 py-1.5 text-gray-600"
//                                 >
//                                   Cancel
//                                 </button>
//                               </div>
//                             </div>
//                           </li>
//                         );
//                       }

//                       return (
//                         <li key={itemId} className="rounded-2xl border border-gray-200 bg-white p-3">
//                           <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
//                             <div>
//                               <p
//                                 className={`font-medium ${
//                                   item.status?.toLowerCase?.() === 'completed'
//                                     ? 'text-gray-400 line-through'
//                                     : 'text-gray-900'
//                                 }`}
//                               >
//                                 {item.title || item.name || 'Untitled item'}
//                               </p>
//                               <p className="text-xs text-gray-500">Due {dueLabel}</p>
//                               {item.completedAt && (
//                                 <p className="text-[10px] text-emerald-600">
//                                   Completed {formatDateString(item.completedAt)}
//                                 </p>
//                               )}
//                             </div>
//                             {item.status?.toLowerCase?.() !== 'completed' && (
//                               <div className="flex items-center gap-2 text-xs uppercase text-gray-500">
//                                 <button
//                                   type="button"
//                                   onClick={() => startEditingChecklist(item)}
//                                   className="rounded-full border border-gray-200 px-3 py-1 hover:border-blue-300 hover:text-blue-600"
//                                 >
//                                   Edit
//                                 </button>
//                                 <button
//                                   type="button"
//                                   onClick={() => handleCompleteChecklist(item)}
//                                   disabled={actionRunning}
//                                   className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-600"
//                                 >
//                                   Mark complete
//                                 </button>
//                                 <button
//                                   type="button"
//                                   onClick={() => handleDeleteChecklist(item)}
//                                   className="rounded-full border border-rose-200 px-3 py-1 text-rose-600"
//                                 >
//                                   Delete
//                                 </button>
//                               </div>
//                             )}
//                           </div>
//                         </li>
//                       );
//                     })}
//                   </ul>
//                 )}

//                 {/* Add checklist item */}
//                 <form onSubmit={handleAddChecklist} className="mt-3 flex flex-col gap-2">
//                   <input
//                     type="text"
//                     value={checklistForm.title}
//                     onChange={(e) => setChecklistForm((prev) => ({ ...prev, title: e.target.value }))}
//                     placeholder="New checklist item"
//                     className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
//                   />
//                   <input
//                     type="date"
//                     value={checklistForm.dueDate}
//                     onChange={(e) => setChecklistForm((prev) => ({ ...prev, dueDate: e.target.value }))}
//                     className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
//                   />
//                   <button
//                     type="submit"
//                     disabled={actionRunning}
//                     className="rounded-full bg-indigo-600 px-4 py-2 text-white disabled:opacity-60"
//                   >
//                     {actionRunning ? 'Adding…' : 'Add checklist'}
//                   </button>
//                 </form>
//               </div>
//             </div>
//           )}
//         </section>
//       </div>

//       {/* Reassign Modal */}
//       {reassignModalOpen && (
//         <ReassignTaskRequestModal
//           selectedTask={taskForReassign}
//           onClose={() => setReassignModalOpen(false)}
//           onSuccess={handleReassignResponse}
//         />
//       )}
//     </div>
//   );
// };

// export default EmployeeTasks;


import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const formatDateString = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

const normalizeId = (entity) =>
  entity?.id || entity?._id || entity?.public_id || entity?.task_id || '';

const EmployeeTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load tasks
  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithTenant('/api/employee/my-tasks');
      const payload = response?.data || response || [];
      if (!Array.isArray(payload)) {
        throw new Error('Unexpected task data');
      }
      setTasks(payload);
    } catch (err) {
      setError(err?.message || 'Unable to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    loadTasks();
  }, []);

  const stats = useMemo(() => {
    const stageCounters = { pending: 0, in_progress: 0, completed: 0 };
    const overdue = [];
    const now = Date.now();
    tasks.forEach((task) => {
      const stage = (task.stage || task.status || 'pending').toString().toLowerCase();
      if (stageCounters[stage] !== undefined) {
        stageCounters[stage] += 1;
      }
      const dueDate = new Date(task.taskDate || task.dueDate || task.due_date || null);
      if (!Number.isNaN(dueDate.getTime()) && dueDate.getTime() < now && stage !== 'completed') {
        overdue.push(task);
      }
    });
    return {
      total: tasks.length,
      overdue: overdue.length,
      stageCounters,
    };
  }, [tasks]);

  // Get status icon for reassignment requests
  const getReassignStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return <AlertCircle className="w-3 h-3 text-yellow-600" />;
      case 'APPROVED':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-3 h-3 text-red-600" />;
      default:
        return null;
    }
  };

  // Navigate to task details page
  const navigateToTaskDetails = (taskId, task) => {
    navigate(`/employee/tasks/${taskId}`, { state: { task } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="text-sm text-gray-600">Track your assignments and keep checklists aligned with manager expectations.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Total</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Current assignments</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-500">Overdue</p>
          <p className="text-2xl font-semibold text-amber-500">{stats.overdue}</p>
          <p className="text-xs text-gray-500">Need immediate attention</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.3em] text-blue-500">In progress</p>
          <p className="text-2xl font-semibold text-blue-500">{stats.stageCounters.in_progress}</p>
          <p className="text-xs text-gray-500">Work you are handling</p>
        </div>
      </div>

      {/* Task List */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Assigned tasks</h2>
            <p className="text-xs text-gray-500">{loading ? 'Refreshing tasks…' : `${tasks.length} total tasks`}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <button
              type="button"
              onClick={loadTasks}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 hover:bg-gray-100"
            >
              Refresh All
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 text-sm text-gray-500">Loading tasks…</div>
        ) : error ? (
          <div className="mt-6 text-sm text-red-500">Error: {error}</div>
        ) : tasks.length === 0 ? (
          <div className="mt-6 text-sm text-gray-500">No tasks assigned yet.</div>
        ) : (
          <div className="mt-4 space-y-3">
            {tasks.map((task) => {
              const taskId = normalizeId(task);
              const hasReassignRequests = task.reassign_requests?.length > 0;
              const latestRequest = hasReassignRequests ? task.reassign_requests[0] : null;
              
              return (
                <div
                  key={taskId || task.name || task.title}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <button
                        onClick={() => navigateToTaskDetails(taskId, task)}
                        className="text-left w-full"
                      >
                        <p className="text-base font-semibold text-gray-900 hover:text-blue-600">
                          {task.name || task.title || 'Untitled task'}
                        </p>
                        {task.project?.name && (
                          <p className="text-xs text-gray-500">Project: {task.project.name}</p>
                        )}
                      </button>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>Due {formatDateString(task.due_date || task.dueDate || task.taskDate)}</p>
                      <p>Priority: {task.priority || 'Medium'}</p>
                    </div>
                  </div>
                  
                  {/* Reassignment status indicator */}
                  {hasReassignRequests && latestRequest && (
                    <div className="mt-2 flex items-center gap-2">
                      {getReassignStatusIcon(latestRequest.status)}
                      <span className={`text-xs font-medium ${
                        latestRequest.status === 'PENDING' ? 'text-yellow-600' :
                        latestRequest.status === 'APPROVED' ? 'text-green-600' :
                        latestRequest.status === 'REJECTED' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {latestRequest.status === 'PENDING' && 'Pending Reassignment'}
                        {latestRequest.status === 'APPROVED' && 'Reassignment Approved'}
                        {latestRequest.status === 'REJECTED' && 'Reassignment Rejected'}
                      </span>
                    </div>
                  )}
                  
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase">
                    <span className="rounded-full border border-gray-200 px-3 py-0.5 text-gray-600">
                      {task.status || task.stage || 'pending'}
                    </span>
                    <span className="rounded-full border border-gray-200 px-3 py-0.5 text-gray-600">
                      {task.project?.name || 'Project not available'}
                    </span>
                    <button
                      onClick={() => navigateToTaskDetails(taskId, task)}
                      className="rounded-full border border-blue-200 px-3 py-0.5 text-blue-600 hover:bg-blue-50"
                    >
                      View Details & Requests →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default EmployeeTasks;