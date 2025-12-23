// import React, { useCallback, useEffect, useMemo, useState } from 'react';
// import { useSelector } from 'react-redux';
// import { toast } from 'sonner';
// import fetchWithTenant from '../utils/fetchWithTenant';
// import { selectUser } from '../redux/slices/authSlice';
// import { RefreshCw, AlertCircle, Calendar, Clock, User, Plus, CheckSquare, Check } from 'lucide-react';
// const ManagerTasks = () => {
//   const user = useSelector(selectUser);
//   const resources = user?.resources || {};
//   const [tasks, setTasks] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [projects, setProjects] = useState([]);
//   const [projectsLoading, setProjectsLoading] = useState(true);
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     priority: 'MEDIUM',
//     stage: 'PENDING',
//     taskDate: '',
//     assignedUsers: [], // now an array of employee IDs
//     projectId: '',
//     timeAlloted: 8,
//   });
//   const [actionLoading, setActionLoading] = useState(false);
//   const [selectedProjectId, setSelectedProjectId] = useState('');
//   const [selectedTask, setSelectedTask] = useState(null);
//   const [employees, setEmployees] = useState([]);
//   const [employeesLoading, setEmployeesLoading] = useState(true);
//   const [selectedAssignee, setSelectedAssignee] = useState('');
//   const [reassigning, setReassigning] = useState(false);
//   const [showCreateTaskModal, setShowCreateTaskModal] = useState(false); // NEW: Modal state

//   const loadTasks = useCallback(async (projectId = '') => {
//     if (!projectId) {
//       setTasks([]);
//       setError(null);
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     try {
//       const resp = await fetchWithTenant(`/api/manager/tasks?projectId=${encodeURIComponent(projectId)}`);
//       const data = Array.isArray(resp?.data) ? resp.data : resp;
//       setTasks(Array.isArray(data) ? data : []);
//       setError(null);
//     } catch (err) {
//       setError(err.message || 'Failed to load tasks for the project');
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const loadEmployees = useCallback(async () => {
//     setEmployeesLoading(true);
//     try {
//       const resp = await fetchWithTenant('/api/manager/employees');
//       const data = Array.isArray(resp?.data) ? resp.data : resp;
//       setEmployees(Array.isArray(data) ? data : []);
//     } catch (err) {
//       // ignore silently
//     } finally {
//       setEmployeesLoading(false);
//     }
//   }, []);

//   const loadProjects = useCallback(async () => {
//     setProjectsLoading(true);
//     try {
//       const resp = await fetchWithTenant('/api/manager/projects');
//       const data = Array.isArray(resp?.data) ? resp.data : resp;
//       setProjects(Array.isArray(data) ? data : []);
//     } catch (err) {
//       // silently ignore
//     } finally {
//       setProjectsLoading(false);
//     }
//   }, []);

//   // CRITICAL FIX: Auto-select first project when projects load (like reference file)
//   useEffect(() => {
//     if (projects.length > 0 && !selectedProjectId) {
//       const firstProject = projects[0];
//       const firstId = firstProject?.public_id || firstProject?.id || firstProject?._id || firstProject?.internalId;
//       if (firstId) {
//         setSelectedProjectId(firstId);
//       }
//     }
//   }, [projects]);

//   useEffect(() => {
//     loadProjects();
//   }, [loadProjects]);

//   useEffect(() => {
//     loadTasks(selectedProjectId);
//   }, [loadTasks, selectedProjectId]);

//   useEffect(() => {
//     setSelectedTask(null);
//   }, [selectedProjectId]);

//   useEffect(() => {
//     loadEmployees();
//   }, [loadEmployees]);

//   const detailProject = selectedTask?.project || selectedTask?.meta?.project;
//   const selectedProject = useMemo(() => {
//     if (!selectedProjectId) return null;
//     return projects.find((project) => {
//       const projectId = project.public_id || project.id || project._id || project.internalId;
//       return projectId === selectedProjectId;
//     }) || null;
//   }, [projects, selectedProjectId]);

//   const stages = useMemo(() => ['PENDING', 'IN_PROGRESS', 'COMPLETED'], []);
//   const stageCounts = useMemo(() => {
//     const counts = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 };
//     tasks.forEach((task) => {
//       const stage = (task.stage || task.status || '').toString().toUpperCase();
//       if (stage && counts.hasOwnProperty(stage)) {
//         counts[stage] += 1;
//       }
//     });
//     return counts;
//   }, [tasks]);

//   const overdueTasksCount = useMemo(() => {
//     const now = Date.now();
//     return tasks.filter((task) => {
//       const rawDate = task.taskDate || task.due_date;
//       if (!rawDate) return false;
//       const parsed = new Date(rawDate);
//       if (Number.isNaN(parsed.getTime())) return false;
//       return parsed.getTime() < now && (task.stage || task.status || '').toString().toUpperCase() !== 'COMPLETED';
//     }).length;
//   }, [tasks]);

//   const assignedUsers = useMemo(() => {
//     if (!selectedTask) return [];
//     if (Array.isArray(selectedTask.assignedUsers) && selectedTask.assignedUsers.length) {
//       return selectedTask.assignedUsers.map((user) => user.name);
//     }
//     if (Array.isArray(selectedTask.assigned_to) && selectedTask.assigned_to.length) {
//       return selectedTask.assigned_to;
//     }
//     return [];
//   }, [selectedTask]);

//   useEffect(() => {
//     if (!selectedTask || !employees.length) return;
//     const primaryAssignee = selectedTask.assignedUsers?.[0] || selectedTask.assigned_to?.[0];
//     if (primaryAssignee) {
//       const match = employees.find((emp) =>
//         String(emp.internalId || emp.id || emp._id || emp.public_id) === String(primaryAssignee.internalId || primaryAssignee.id || primaryAssignee._id || primaryAssignee)
//       );
//       setSelectedAssignee(match?.internalId || match?.id || match?._id || match?.public_id || primaryAssignee.internalId || primaryAssignee.id || primaryAssignee);
//     }
//   }, [selectedTask, employees]);

//   const documents = useMemo(() => {
//     if (!selectedTask) return [];
//     return selectedTask.documents || selectedTask.files || [];
//   }, [selectedTask]);

//   const timeline = useMemo(() => {
//     if (!selectedTask) return [];
//     return selectedTask.activityTimeline || selectedTask.activities || [];
//   }, [selectedTask]);

//   const checklist = useMemo(() => {
//     if (!selectedTask) return [];
//     return selectedTask.checklist || [];
//   }, [selectedTask]);

//   const formattedDue = useMemo(() => {
//     if (!selectedTask) return '—';
//     const raw = selectedTask.taskDate || selectedTask.due_date;
//     if (!raw) return '—';
//     const date = new Date(raw);
//     return Number.isNaN(date.getTime()) ? raw : date.toLocaleDateString();
//   }, [selectedTask]);

//   const handleCreateTask = async (event) => {
//     event.preventDefault();
//     if (!formData.title || !selectedProjectId) {
//       toast.error('Title and project are required');
//       return;
//     }
//     setActionLoading(true);
//     try {
//       const selectedProject = projects.find(
//         (project) => 
//           project.public_id === selectedProjectId || 
//           project.id === selectedProjectId || 
//           project._id === selectedProjectId
//       );
//       const payload = {
//         title: formData.title,
//         description: formData.description,
//         priority: formData.priority,
//         stage: formData.stage,
//         taskDate: formData.taskDate ? new Date(formData.taskDate).toISOString() : undefined,
//         timeAlloted: Number(formData.timeAlloted) || 0,
//         projectId: selectedProjectId,
//         client_id: selectedProject?.client?.public_id || selectedProject?.client?.id || selectedProject?.client_id,
//         assigned_to: formData.assignedUsers, // array of employee IDs
//       };
//       const resp = await fetchWithTenant('api/projects/tasks', {
//         method: 'POST',
//         body: JSON.stringify(payload),
//       });
//       toast.success(resp?.message || 'Task created successfully');
      
//       // Reset form and close modal
//       setFormData({ 
//         title: '', 
//         description: '', 
//         assignedUsers: [],
//         priority: 'MEDIUM',
//         stage: 'PENDING',
//         taskDate: '',
//         timeAlloted: 8,
//         projectId: selectedProjectId 
//       });
//       setShowCreateTaskModal(false);
      
//       // Refresh tasks for current project
//       loadTasks(selectedProjectId);
//     } catch (err) {
//       toast.error(err?.message || 'Unable to create task');
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   const handleReassignTask = async () => {
//     if (!selectedTask || !selectedAssignee) {
//       toast.error('Select an employee to reassign the task.');
//       return;
//     }
//     setReassigning(true);
//     try {
//       const projectId = selectedTask.project_id || selectedTask.projectId || detailProject?.id || detailProject?.public_id || detailProject?._id;
//       const taskId = selectedTask.id || selectedTask.public_id || selectedTask._id || selectedTask.internalId;
//       const payload = {
//         assigned_to: [selectedAssignee],
//         projectId,
//       };
//       const resp = await fetchWithTenant(`/api/projects/tasks/${encodeURIComponent(taskId)}`, {
//         method: 'PUT',
//         body: JSON.stringify(payload),
//       });
//       toast.success(resp?.message || 'Task reassigned successfully');
      
//       // Update local task state
//       const targetEmployee = employees.find((emp) =>
//         String(emp.internalId || emp.id || emp._id || emp.public_id) === String(selectedAssignee)
//       );
//       setSelectedTask((prev) => ({
//         ...prev,
//         assignedUsers: targetEmployee ? [{
//           id: targetEmployee.public_id || targetEmployee.id || targetEmployee._id,
//           name: targetEmployee.name || targetEmployee.title || 'Employee',
//           internalId: targetEmployee.internalId || targetEmployee.id || targetEmployee._id,
//         }] : prev.assignedUsers,
//         assigned_to: targetEmployee ? [targetEmployee.internalId || targetEmployee.public_id || targetEmployee.id || targetEmployee._id] : prev.assigned_to,
//       }));
      
//       loadTasks(selectedProjectId);
//     } catch (err) {
//       toast.error(err?.message || 'Unable to reassign task');
//     } finally {
//       setReassigning(false);
//     }
//   };

//   // Function to open create task modal
//   const openCreateTaskModal = () => {
//     if (!selectedProjectId) {
//       toast.error('Please select a project first');
//       return;
//     }
//     setShowCreateTaskModal(true);
//   };

// return (
//   <div className="p-8">
//     {/* DEBUG INFO - Remove in production */}
//     <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
//       <div>Selected Project: {selectedProjectId}</div>
//       <div>Projects Loading: {projectsLoading ? 'Yes' : 'No'}</div>
//       <div>Tasks Loading: {loading ? 'Yes' : 'No'}</div>
//       <div>Employees Loading: {employeesLoading ? 'Yes' : 'No'}</div>
//       <div>Action Loading: {actionLoading ? 'Yes' : 'No'}</div>
//     </div>

//     {/* HEADER */}
//     <div className="flex items-center justify-between mb-8">
//       <div>
//         <h1 className="text-2xl font-bold text-gray-900 mb-2">Client Tasks</h1>
//         <p className="text-gray-600">Tasks pulled from your manager feed.</p>
//       </div>

//       <div className="flex items-center gap-3">
//         {/* Project Selector */}
//         <div className="relative">
//           <select
//             value={selectedProjectId || ""}
//             onChange={(e) => setSelectedProjectId(e.target.value)}
//             disabled={projectsLoading}
//             className="border border-gray-300 rounded-lg px-4 py-2 pr-8 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none min-w-[200px]"
//           >
//             <option value="">Select a project</option>
//             {projects.map((project) => {
//               const projectId = project.public_id || project.id || project._id || project.internalId;
//               return (
//                 <option key={projectId} value={projectId}>
//                   {project.name}
//                 </option>
//               );
//             })}
//           </select>
//           <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
//             <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
//               <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
//             </svg>
//           </div>
//         </div>

//         {/* Refresh Button */}
//         <button
//           onClick={() => selectedProjectId && loadTasks(selectedProjectId)}
//           disabled={!selectedProjectId || loading}
//           className={`p-2 rounded-lg border ${
//             !selectedProjectId || loading
//               ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//               : 'bg-white text-blue-600 hover:bg-blue-50 border-blue-200'
//           }`}
//           title="Refresh tasks"
//         >
//           <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
//         </button>
//       </div>
//     </div>

//     {/* Loading Indicator */}
//     {loading && (
//       <div className="flex items-center justify-center p-4 mb-6 bg-blue-50 rounded-lg">
//         <RefreshCw className="w-5 h-5 mr-2 animate-spin text-blue-600" />
//         <span className="text-blue-600 font-medium">Loading tasks...</span>
//       </div>
//     )}

//     {/* STATS - Only show when a project is selected */}
//     {selectedProjectId && (
//       <div className="flex flex-wrap gap-3 mb-6">
//         <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-semibold shadow-sm border border-blue-200">
//           Total Tasks: {tasks.length}
//         </div>
//         <div className="px-4 py-2 rounded-lg bg-amber-100 text-amber-800 font-semibold shadow-sm border border-amber-200">
//           Overdue: {tasks.filter(t => {
//             const dueDate = t.taskDate || t.dueDate;
//             if (!dueDate) return false;
//             return new Date(dueDate) < new Date() && 
//                    (t.stage?.toLowerCase() !== 'completed' && t.status?.toLowerCase() !== 'completed');
//           }).length}
//         </div>
//         <div className="px-4 py-2 rounded-lg bg-emerald-100 text-emerald-800 font-semibold shadow-sm border border-emerald-200">
//           Completed: {tasks.filter(t => 
//             (t.stage?.toLowerCase() === 'completed' || t.status?.toLowerCase() === 'completed')
//           ).length}
//         </div>
//         <div className="px-4 py-2 rounded-lg bg-red-100 text-red-800 font-semibold shadow-sm border border-red-200">
//           In Progress: {tasks.filter(t => 
//             (t.stage?.toLowerCase() === 'in_progress' || t.status?.toLowerCase() === 'in_progress')
//           ).length}
//         </div>
//       </div>
//     )}

//     {/* PROJECT INFO - Show selected project info */}
//     {selectedProjectId && tasks.length > 0 && selectedProject && (
//       <div className="bg-white rounded-xl border p-4 mb-6">
//         <h2 className="text-lg font-semibold text-gray-900 mb-2">
//           {selectedProject.name} - Tasks ({tasks.length})
//         </h2>
//         <p className="text-gray-600">
//           Showing tasks for selected project
//         </p>
//       </div>
//     )}

//     {/* NO PROJECT SELECTED STATE */}
//     {!selectedProjectId && !projectsLoading && (
//       <div className="bg-white rounded-xl border p-12 text-center">
//         <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
//         <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Project</h3>
//         <p className="text-gray-600 mb-6">
//           Please select a project from the dropdown above to view and manage tasks.
//         </p>
//         <div className="flex flex-wrap gap-2 justify-center">
//           {projects.slice(0, 5).map((project) => {
//             const projectId = project.public_id || project.id || project._id;
//             return (
//               <button
//                 key={projectId}
//                 onClick={() => setSelectedProjectId(projectId)}
//                 className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
//               >
//                 {project.name}
//               </button>
//             );
//           })}
//         </div>
//       </div>
//     )}

//     {/* Projects Loading */}
//     {projectsLoading && (
//       <div className="bg-white rounded-xl border p-12 text-center">
//         <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
//         <p className="text-gray-600">Loading projects...</p>
//       </div>
//     )}

//     {/* MAIN CONTENT */}
//     <div className="flex flex-col lg:flex-row gap-6">
//       {/* TASKS LIST - Left Column */}
//       <div className="flex-1">
//         {/* NO TASKS STATE - When project selected but no tasks */}
//         {selectedProjectId && !loading && tasks.length === 0 && (
//           <div className="bg-white rounded-xl border p-12 text-center">
//             <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
//             <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Found</h3>
//             <p className="text-gray-600 mb-6">
//               This project has no tasks. Create your first task below!
//             </p>
//             <div className="flex gap-3 justify-center">
//               <button
//                 onClick={() => setShowCreateTaskModal(true)}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//               >
//                 Create First Task
//               </button>
//               <button
//                 onClick={() => loadTasks(selectedProjectId)}
//                 className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
//               >
//                 Refresh
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Error State */}
//         {error && (
//           <div className="bg-white rounded-xl border p-8 mb-6">
//             <div className="text-red-500 mb-4">Error loading tasks</div>
//             <button 
//               onClick={() => selectedProjectId && loadTasks(selectedProjectId)}
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//             >
//               Retry
//             </button>
//           </div>
//         )}

//         {/* ADD TASK BUTTON */}
//         {selectedProjectId && !loading && (
//           <div className="mb-6">
//             <button
//               onClick={() => setShowCreateTaskModal(true)}
//               disabled={loading}
//               className={`w-full h-16 bg-blue-600 text-white text-lg font-bold rounded-xl shadow hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 flex items-center justify-center gap-3 ${
//                 loading ? 'opacity-50 cursor-not-allowed' : ''
//               }`}
//             >
//               <Plus className="w-6 h-6" />
//               Create New Task
//             </button>
//           </div>
//         )}

//         {/* TASKS LIST */}
//         {selectedProjectId && !loading && tasks.length > 0 && (
//           <div className="bg-white border rounded-xl overflow-hidden">
//             <table className="w-full table-auto">
//               <thead className="bg-gray-50 text-gray-700">
//                 <tr>
//                   <th className="p-4 text-left">Task</th>
//                   <th className="p-4 text-left">Client</th>
//                   <th className="p-4 text-left">Status</th>
//                   <th className="p-4 text-left">Priority</th>
//                   <th className="p-4 text-left">Due Date</th>
//                   <th className="p-4 text-left">Estimated Hours</th>
//                   <th className="p-4 text-left">Assigned To</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {tasks.map((task) => {
//                   const isActive = selectedTask?.id === task.id || selectedTask?.public_id === task.public_id;
//                   return (
//                     <tr 
//                       key={task.id || task.public_id || task._id || task.internalId}
//                       onClick={() => setSelectedTask(task)}
//                       role="button"
//                       className={`border-b transition-colors cursor-pointer ${
//                         isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
//                       }`}
//                     >
//                       <td className="p-4">
//                         <div className="font-medium text-gray-900">{task.title}</div>
//                         {task.description && (
//                           <div className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</div>
//                         )}
//                       </td>

//                       <td className="p-4">
//                         <div className="text-sm text-gray-700">
//                           {task.client?.name || task.project?.client?.name || 'Unknown client'}
//                         </div>
//                       </td>

//                       <td className="p-4">
//                         <span className={`px-3 py-1 rounded-full text-sm font-medium ${
//                           task.stage?.toLowerCase() === 'completed' || task.status?.toLowerCase() === 'completed' 
//                             ? 'bg-emerald-100 text-emerald-800' :
//                           task.stage?.toLowerCase() === 'in_progress' || task.status?.toLowerCase() === 'in_progress'
//                             ? 'bg-blue-100 text-blue-800' :
//                             'bg-amber-100 text-amber-800'
//                         }`}>
//                           {task.stage || task.status || 'PENDING'}
//                         </span>
//                       </td>

//                       <td className="p-4">
//                         <span className={`px-3 py-1 rounded-full text-sm font-medium ${
//                           task.priority?.toLowerCase() === 'high' ? 'bg-red-100 text-red-800' :
//                           task.priority?.toLowerCase() === 'medium' ? 'bg-amber-100 text-amber-800' :
//                           'bg-gray-100 text-gray-800'
//                         }`}>
//                           {task.priority || 'MEDIUM'}
//                         </span>
//                       </td>

//                       <td className="p-4">
//                         <div className="flex items-center gap-2">
//                           <Calendar className="w-4 h-4 text-gray-400" />
//                           <span className="text-sm text-gray-700">
//                             {task.taskDate ? new Date(task.taskDate).toLocaleDateString() : 'N/A'}
//                           </span>
//                         </div>
//                       </td>

//                       <td className="p-4">
//                         <div className="flex items-center gap-2">
//                           <Clock className="w-4 h-4 text-gray-400" />
//                           <span className="text-sm text-gray-700">
//                             {task.timeAlloted ?? task.time_alloted ?? '—'}h
//                           </span>
//                         </div>
//                       </td>

//                       <td className="p-4">
//                         <div className="flex items-center gap-2">
//                           <User className="w-4 h-4 text-gray-400" />
//                           <span className="text-sm text-gray-700">
//                             {Array.isArray(task.assignedUsers) 
//                               ? task.assignedUsers.map(u => u.name).join(', ') 
//                               : task.assigned_to?.join(', ') || 'Unassigned'}
//                           </span>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* TASK DETAILS & REASSIGN - Right Column */}
//       <div className="lg:w-2/5">
//         <div className="bg-white border rounded-xl p-6">
//           {!selectedTask ? (
//             <div className="text-center py-12">
//               <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
//               <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Task</h3>
//               <p className="text-gray-600">Click on a task from the list to view details and reassign</p>
//             </div>
//           ) : (
//             <div className="space-y-6">
//               {/* Task Header */}
//               <div className="flex items-start justify-between pb-4 border-b">
//                 <div className="flex-1">
//                   <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTask.title}</h2>
//                   <p className="text-gray-600">
//                     {selectedTask.client?.name || detailProject?.client?.name || 'Client'}
//                   </p>
//                 </div>
//                 <span className="px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold">
//                   {selectedTask.stage || selectedTask.status || 'PENDING'}
//                 </span>
//               </div>

//               {/* Quick Info */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="bg-gray-50 p-3 rounded-lg">
//                   <div className="text-xs uppercase text-gray-500 font-medium mb-1">Project</div>
//                   <div className="font-semibold text-gray-900">{detailProject?.name || 'Unknown'}</div>
//                 </div>
//                 <div className="bg-gray-50 p-3 rounded-lg">
//                   <div className="text-xs uppercase text-gray-500 font-medium mb-1">Priority</div>
//                   <div className="font-semibold text-gray-900">{selectedTask.priority || 'MEDIUM'}</div>
//                 </div>
//                 <div className="bg-gray-50 p-3 rounded-lg">
//                   <div className="text-xs uppercase text-gray-500 font-medium mb-1">Due Date</div>
//                   <div className="font-semibold text-gray-900">{formattedDue}</div>
//                 </div>
//                 <div className="bg-gray-50 p-3 rounded-lg">
//                   <div className="text-xs uppercase text-gray-500 font-medium mb-1">Estimated Hours</div>
//                   <div className="font-semibold text-gray-900">{selectedTask.timeAlloted ?? selectedTask.time_alloted ?? '—'}h</div>
//                 </div>
//               </div>

//               {/* Description */}
//               {selectedTask.description && (
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="text-sm font-medium text-gray-700 mb-2">Description</div>
//                   <p className="text-gray-700">{selectedTask.description}</p>
//                 </div>
//               )}

//               {/* Reassign Section */}
//               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                 <div className="flex items-center gap-2 mb-3">
//                   <RefreshCw className="w-5 h-5 text-blue-600" />
//                   <span className="font-medium text-blue-800">Reassign Task</span>
//                 </div>
//                 <div className="flex flex-col gap-3">
//                   <select
//                     value={selectedAssignee}
//                     onChange={(e) => setSelectedAssignee(e.target.value)}
//                     disabled={employeesLoading}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
//                   >
//                     <option value="">Select employee</option>
//                     {employees.map((employee) => {
//                       const key = employee.internalId || employee.id || employee.public_id || employee._id;
//                       return (
//                         <option key={key} value={key}>
//                           {employee.name || employee.email || 'Unnamed'}
//                         </option>
//                       );
//                     })}
//                   </select>
//                   <button
//                     onClick={handleReassignTask}
//                     disabled={reassigning || !selectedAssignee || employeesLoading}
//                     className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
//                       reassigning || !selectedAssignee || employeesLoading
//                         ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                         : 'bg-blue-600 text-white hover:bg-blue-700'
//                     }`}
//                   >
//                     {reassigning ? (
//                       <>
//                         <RefreshCw className="w-4 h-4 animate-spin" />
//                         Reassigning...
//                       </>
//                     ) : (
//                       'Reassign Task'
//                     )}
//                   </button>
//                 </div>
//                 {employeesLoading && (
//                   <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
//                     <RefreshCw className="w-4 h-4 animate-spin" />
//                     Loading employees...
//                   </div>
//                 )}
//               </div>

//               {/* Checklist */}
//               {checklist.length > 0 && (
//                 <div className="border border-gray-200 rounded-lg p-4">
//                   <div className="flex items-center gap-2 mb-3">
//                     <CheckSquare className="w-5 h-5 text-gray-600" />
//                     <span className="font-medium text-gray-700">Checklist</span>
//                   </div>
//                   <div className="space-y-2 max-h-48 overflow-y-auto">
//                     {checklist.map((item, index) => (
//                       <div key={item.id || index} className="flex items-center gap-3 p-2 bg-white border rounded">
//                         <div className="w-5 h-5 bg-emerald-100 rounded flex items-center justify-center flex-shrink-0">
//                           <Check className="w-3 h-3 text-emerald-600" />
//                         </div>
//                         <span className="text-sm">{item.title}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>

//     {/* CREATE TASK MODAL */}
//     {showCreateTaskModal && (
//       <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//         <div className="bg-white rounded-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
//               <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-semibold">
//                 ➕
//               </div>
//               Create New Task
//             </h2>
//             <button
//               onClick={() => setShowCreateTaskModal(false)}
//               className="text-gray-400 hover:text-gray-600"
//             >
//               ✕
//             </button>
//           </div>

//           <form onSubmit={handleCreateTask} className="space-y-6">
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Task Title */}
//               <div>
//                 <label className="block text-gray-700 font-medium mb-2">
//                   Task Title <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   required
//                   value={formData.title}
//                   onChange={(e) => setFormData({ ...formData, title: e.target.value })}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
//                   placeholder="Enter task title"
//                 />
//               </div>

//               {/* Project */}
//               <div>
//                 <label className="block text-gray-700 font-medium mb-2">
//                   Project
//                 </label>
//                 <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-medium">
//                   {selectedProject?.name || 'Selected Project'} ✓
//                 </div>
//               </div>

//               {/* Priority */}
//               <div>
//                 <label className="block text-gray-700 font-medium mb-2">
//                   Priority
//                 </label>
//                 <select
//                   value={formData.priority}
//                   onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="LOW">Low Priority</option>
//                   <option value="MEDIUM">Medium Priority</option>
//                   <option value="HIGH">High Priority</option>
//                 </select>
//               </div>

//               {/* Stage */}
//               <div>
//                 <label className="block text-gray-700 font-medium mb-2">
//                   Stage
//                 </label>
//                 <select
//                   value={formData.stage}
//                   onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="PENDING">Pending</option>
//                   <option value="IN_PROGRESS">In Progress</option>
//                   <option value="COMPLETED">Completed</option>
//                 </select>
//               </div>

//               {/* Due Date */}
//               <div>
//                 <label className="block text-gray-700 font-medium mb-2">
//                   Due Date
//                 </label>
//                 <input
//                   type="date"
//                   value={formData.taskDate}
//                   onChange={(e) => setFormData({ ...formData, taskDate: e.target.value })}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               {/* Hours */}
//               <div>
//                 <label className="block text-gray-700 font-medium mb-2">
//                   Estimated Hours
//                 </label>
//                 <input
//                   type="number"
//                   min="0"
//                   step="0.5"
//                   value={formData.timeAlloted}
//                   onChange={(e) => setFormData({ ...formData, timeAlloted: e.target.value })}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   placeholder="8"
//                 />
//               </div>
//             </div>

//             {/* Assigned Users */}
//             <div>
//               <label className="block text-gray-700 font-medium mb-2">
//                 Assigned Users
//               </label>
//               <select
//                 multiple
//                 value={formData.assignedUsers}
//                 onChange={e => {
//                   const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
//                   setFormData({ ...formData, assignedUsers: selected });
//                 }}
//                 className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 {employees.filter(emp => (emp.role === 'Employee' || emp.role === 'employee')).map(emp => (
//                   <option key={emp.public_id || emp.id || emp._id} value={emp.public_id || emp.id || emp._id}>
//                     {emp.name || emp.email || 'Unnamed Employee'}
//                   </option>
//                 ))}
//               </select>
//               <div className="text-sm text-gray-500 mt-1">
//                 Hold Ctrl (Windows) or Cmd (Mac) to select multiple employees.
//               </div>
//             </div>

//             {/* Description */}
//             <div>
//               <label className="block text-gray-700 font-medium mb-2">
//                 Description
//               </label>
//               <textarea
//                 value={formData.description}
//                 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                 rows={4}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
//                 placeholder="Task description..."
//               />
//             </div>

//             {/* Form Actions */}
//             <div className="flex gap-3 mt-8">
//               <button
//                 type="button"
//                 onClick={() => setShowCreateTaskModal(false)}
//                 className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 disabled={actionLoading || !formData.title}
//                 className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//               >
//                 {actionLoading ? (
//                   <>
//                     <RefreshCw className="w-5 h-5 animate-spin" />
//                     Creating Task...
//                   </>
//                 ) : (
//                   'Create Task'
//                 )}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     )}
//   </div>
// );
// };

// export default ManagerTasks;


import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';
import { selectUser } from '../redux/slices/authSlice';
import { RefreshCw, AlertCircle, Calendar, Clock, User, Plus, CheckSquare, Check, Eye, Filter } from 'lucide-react';

const ManagerTasks = () => {
  const user = useSelector(selectUser);
  const resources = user?.resources || {};
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    stage: 'PENDING',
    taskDate: '',
    assignedUsers: [],
    projectId: '',
    timeAlloted: 8,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Status options
  const statusOptions = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'];

  // Get status text
  const getStatusText = (status) => {
    const statusMap = {
      'PENDING': 'Pending',
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed',
      'ON_HOLD': 'On Hold',
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'on_hold': 'On Hold'
    };
    return statusMap[status] || status || 'Pending';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get assigned users string
  const getAssignedUsers = (task) => {
    if (Array.isArray(task.assignedUsers) && task.assignedUsers.length) {
      return task.assignedUsers.map(u => u.name).join(', ');
    }
    if (Array.isArray(task.assigned_to) && task.assigned_to.length) {
      return task.assigned_to.join(', ');
    }
    return 'Unassigned';
  };

  // Get project name
  const getProjectName = (projectId) => {
    const project = projects.find(p => 
      p.id === projectId || 
      p._id === projectId || 
      p.public_id === projectId ||
      p.internalId === projectId
    );
    return project?.name || project?.title || 'Unknown Project';
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (filterStatus === 'all') return tasks;
    return tasks.filter(task => {
      const taskStatus = (task.stage || task.status || '').toUpperCase();
      const filterStatusUpper = filterStatus.toUpperCase();
      return taskStatus === filterStatusUpper;
    });
  }, [tasks, filterStatus]);

  // Get status counts
  const getStatusCounts = () => {
    const counts = {
      'pending': 0,
      'in_progress': 0,
      'completed': 0,
      'on_hold': 0
    };
    
    tasks.forEach(task => {
      const status = (task.stage || task.status || 'pending').toLowerCase();
      if (counts.hasOwnProperty(status)) {
        counts[status]++;
      }
    });
    
    return counts;
  };

  // Original functions from your code
  const loadTasks = useCallback(async (projectId = '') => {
    if (!projectId) {
      setTasks([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const resp = await fetchWithTenant(`/api/manager/tasks?projectId=${encodeURIComponent(projectId)}`);
      const data = Array.isArray(resp?.data) ? resp.data : resp;
      setTasks(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load tasks for the project');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    try {
      const resp = await fetchWithTenant('/api/manager/employees/all');
      const data = Array.isArray(resp?.data) ? resp.data : resp;
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      // ignore silently
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const resp = await fetchWithTenant('/api/manager/projects');
      const data = Array.isArray(resp?.data) ? resp.data : resp;
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      // silently ignore
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  // Auto-select first project when projects load
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      const firstProject = projects[0];
      const firstId = firstProject?.public_id || firstProject?.id || firstProject?._id || firstProject?.internalId;
      if (firstId) {
        setSelectedProjectId(firstId);
      }
    }
  }, [projects]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadTasks(selectedProjectId);
  }, [loadTasks, selectedProjectId]);

  useEffect(() => {
    setSelectedTask(null);
  }, [selectedProjectId]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Original computed values
  const detailProject = selectedTask?.project || selectedTask?.meta?.project;
  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find((project) => {
      const projectId = project.public_id || project.id || project._id || project.internalId;
      return projectId === selectedProjectId;
    }) || null;
  }, [projects, selectedProjectId]);

  const stages = useMemo(() => ['PENDING', 'IN_PROGRESS', 'COMPLETED'], []);
  const stageCounts = useMemo(() => {
    const counts = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 };
    tasks.forEach((task) => {
      const stage = (task.stage || task.status || '').toString().toUpperCase();
      if (stage && counts.hasOwnProperty(stage)) {
        counts[stage] += 1;
      }
    });
    return counts;
  }, [tasks]);

  const overdueTasksCount = useMemo(() => {
    const now = Date.now();
    return tasks.filter((task) => {
      const rawDate = task.taskDate || task.due_date;
      if (!rawDate) return false;
      const parsed = new Date(rawDate);
      if (Number.isNaN(parsed.getTime())) return false;
      return parsed.getTime() < now && (task.stage || task.status || '').toString().toUpperCase() !== 'COMPLETED';
    }).length;
  }, [tasks]);

  const assignedUsers = useMemo(() => {
    if (!selectedTask) return [];
    if (Array.isArray(selectedTask.assignedUsers) && selectedTask.assignedUsers.length) {
      return selectedTask.assignedUsers.map((user) => user.name);
    }
    if (Array.isArray(selectedTask.assigned_to) && selectedTask.assigned_to.length) {
      return selectedTask.assigned_to;
    }
    return [];
  }, [selectedTask]);

  useEffect(() => {
    if (!selectedTask || !employees.length) return;
    const primaryAssignee = selectedTask.assignedUsers?.[0] || selectedTask.assigned_to?.[0];
    if (primaryAssignee) {
      const match = employees.find((emp) =>
        String(emp.internalId || emp.id || emp._id || emp.public_id) === String(primaryAssignee.internalId || primaryAssignee.id || primaryAssignee._id || primaryAssignee)
      );
      setSelectedAssignee(match?.internalId || match?.id || match?._id || match?.public_id || primaryAssignee.internalId || primaryAssignee.id || primaryAssignee);
    }
  }, [selectedTask, employees]);

  const documents = useMemo(() => {
    if (!selectedTask) return [];
    return selectedTask.documents || selectedTask.files || [];
  }, [selectedTask]);

  const timeline = useMemo(() => {
    if (!selectedTask) return [];
    return selectedTask.activityTimeline || selectedTask.activities || [];
  }, [selectedTask]);

  const checklist = useMemo(() => {
    if (!selectedTask) return [];
    return selectedTask.checklist || [];
  }, [selectedTask]);

  const formattedDue = useMemo(() => {
    if (!selectedTask) return '—';
    const raw = selectedTask.taskDate || selectedTask.due_date;
    if (!raw) return '—';
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? raw : date.toLocaleDateString();
  }, [selectedTask]);

  // ORIGINAL handleCreateTask function
  const handleCreateTask = async (event) => {
    event.preventDefault();
    if (!formData.title || !selectedProjectId) {
      toast.error('Title and project are required');
      return;
    }
    setActionLoading(true);
    try {
      const selectedProject = projects.find(
        (project) => 
          project.public_id === selectedProjectId || 
          project.id === selectedProjectId || 
          project._id === selectedProjectId
      );
      const payload = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        stage: formData.stage,
        taskDate: formData.taskDate ? new Date(formData.taskDate).toISOString() : undefined,
        timeAlloted: Number(formData.timeAlloted) || 0,
        projectId: selectedProjectId,
        client_id: selectedProject?.client?.public_id || selectedProject?.client?.id || selectedProject?.client_id,
        assigned_to: formData.assignedUsers,
      };
      const resp = await fetchWithTenant('api/projects/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast.success(resp?.message || 'Task created successfully');
      
      // Reset form and close modal
      setFormData({ 
        title: '', 
        description: '', 
        assignedUsers: [],
        priority: 'MEDIUM',
        stage: 'PENDING',
        taskDate: '',
        timeAlloted: 8,
        projectId: selectedProjectId 
      });
      setShowCreateTaskModal(false);
      
      // Refresh tasks for current project
      loadTasks(selectedProjectId);
    } catch (err) {
      toast.error(err?.message || 'Unable to create task');
    } finally {
      setActionLoading(false);
    }
  };

  // ORIGINAL handleReassignTask function
  const handleReassignTask = async () => {
    if (!selectedTask || !selectedAssignee) {
      toast.error('Select an employee to reassign the task.');
      return;
    }
    setReassigning(true);
    try {
      const projectId = selectedTask.project_id || selectedTask.projectId || detailProject?.id || detailProject?.public_id || detailProject?._id;
      const taskId = selectedTask.id || selectedTask.public_id || selectedTask._id || selectedTask.internalId;
      const payload = {
        assigned_to: [selectedAssignee],
        projectId,
      };
      const resp = await fetchWithTenant(`/api/projects/tasks/${encodeURIComponent(taskId)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      toast.success(resp?.message || 'Task reassigned successfully');
      
      // Update local task state
      const targetEmployee = employees.find((emp) =>
        String(emp.internalId || emp.id || emp._id || emp.public_id) === String(selectedAssignee)
      );
      setSelectedTask((prev) => ({
        ...prev,
        assignedUsers: targetEmployee ? [{
          id: targetEmployee.public_id || targetEmployee.id || targetEmployee._id,
          name: targetEmployee.name || targetEmployee.title || 'Employee',
          internalId: targetEmployee.internalId || targetEmployee.id || targetEmployee._id,
        }] : prev.assignedUsers,
        assigned_to: targetEmployee ? [targetEmployee.internalId || targetEmployee.public_id || targetEmployee.id || targetEmployee._id] : prev.assigned_to,
      }));
      
      loadTasks(selectedProjectId);
    } catch (err) {
      toast.error(err?.message || 'Unable to reassign task');
    } finally {
      setReassigning(false);
    }
  };

  // Open create task modal
  const openCreateTaskModal = () => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }
    setShowCreateTaskModal(true);
  };

  return (
    <div className="p-8">
      {/* DEBUG INFO - Remove in production - EXACTLY AS IN IMAGE */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
        <div>Selected Project: {selectedProjectId}</div>
        <div>Tasks Count: {tasks.length}</div>
        <div>Projects Count: {projects.length}</div>
        <div>Status: {loading ? 'loading' : error ? 'error' : 'succeeded'}</div>
        <div>Fetching: {loading ? 'Yes' : 'No'}</div>
      </div>

      {/* HEADER - EXACTLY AS IN IMAGE */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tasks</h1>
          <p className="text-gray-600">Manage and track all your tasks</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Project Selector */}
          <div className="relative">
            <select
              value={selectedProjectId || ""}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={projectsLoading}
              className="border border-gray-300 rounded-lg px-4 py-2 pr-8 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none min-w-[200px]"
            >
              <option value="">Select a project</option>
              {projects.map((project) => {
                const projectId = project.public_id || project.id || project._id || project.internalId;
                return (
                  <option key={projectId} value={projectId}>
                    {project.name}
                  </option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => selectedProjectId && loadTasks(selectedProjectId)}
            disabled={!selectedProjectId || loading}
            className={`p-2 rounded-lg border ${
              !selectedProjectId || loading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-600 hover:bg-blue-50 border-blue-200'
            }`}
            title="Refresh tasks"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Add Task Button */}
          <button
            onClick={openCreateTaskModal}
            disabled={!selectedProjectId || loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              !selectedProjectId || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Plus className="w-5 h-5" />
            Add Task
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center p-4 mb-6 bg-blue-50 rounded-lg">
          <RefreshCw className="w-5 h-5 mr-2 animate-spin text-blue-600" />
          <span className="text-blue-600 font-medium">Loading tasks...</span>
        </div>
      )}

      {/* STATUS SUMMARY - EXACTLY AS IN IMAGE */}
      {selectedProjectId && tasks.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="px-4 py-2 rounded-lg bg-yellow-100 text-yellow-800 font-semibold shadow-sm border border-yellow-200">
            Pending: {getStatusCounts().pending}
          </div>
          <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-semibold shadow-sm border border-blue-200">
            In Progress: {getStatusCounts().in_progress}
          </div>
          <div className="px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold shadow-sm border border-green-200">
            Completed: {getStatusCounts().completed}
          </div>
          <div className="px-4 py-2 rounded-lg bg-red-100 text-red-800 font-semibold shadow-sm border border-red-200">
            On Hold: {getStatusCounts().on_hold}
          </div>
        </div>
      )}

      {/* PROJECT INFO - EXACTLY AS IN IMAGE */}
      {selectedProjectId && tasks.length > 0 && selectedProject && (
        <div className="bg-white rounded-xl border p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {selectedProject.name} - Tasks ({tasks.length})
          </h2>
          <p className="text-gray-600">
            Showing tasks for selected project
          </p>
        </div>
      )}

      {/* FILTERS - EXACTLY AS IN IMAGE */}
      {selectedProjectId && tasks.length > 0 && (
        <div className="bg-white rounded-xl border p-4 mb-6 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700 font-medium">Filters:</span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="all">All Status</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {getStatusText(s)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* NO PROJECT SELECTED STATE */}
      {!selectedProjectId && !projectsLoading && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Project</h3>
          <p className="text-gray-600 mb-6">
            Please select a project from the dropdown above to view and manage tasks.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {projects.slice(0, 5).map((project) => {
              const projectId = project.public_id || project.id || project._id;
              return (
                <button
                  key={projectId}
                  onClick={() => setSelectedProjectId(projectId)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  {project.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Projects Loading */}
      {projectsLoading && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* TASKS LIST - Left Column */}
        <div className={`${selectedTask ? 'lg:w-3/5' : 'flex-1'}`}>
          {/* NO TASKS STATE */}
          {selectedProjectId && !loading && tasks.length === 0 && (
            <div className="bg-white rounded-xl border p-12 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Found</h3>
              <p className="text-gray-600 mb-6">
                No tasks found for project "{getProjectName(selectedProjectId)}". 
                Create your first task or try refreshing.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={openCreateTaskModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create First Task
                </button>
                <button
                  onClick={() => loadTasks(selectedProjectId)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}

          {/* TASKS TABLE - EXACTLY AS IN IMAGE */}
          {selectedProjectId && !loading && tasks.length > 0 && (
            <div className="bg-white border rounded-xl overflow-hidden">
              <table className="w-full table-auto">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="p-4 text-left">Task</th>
                    <th className="p-4 text-left">Assigned To</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Priority</th>
                    <th className="p-4 text-left">Due Date</th>
                    <th className="p-4 text-left">Estimated Hours</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No tasks found for the selected filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const isActive = selectedTask?.id === task.id || selectedTask?.public_id === task.public_id;
                      return (
                        <tr 
                          key={task.id || task.public_id || task._id || task.internalId}
                          className={`border-b transition-colors ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                        >
                          <td className="p-4">
                            <div className="font-medium text-gray-900">{task.title || task.name}</div>
                            {task.description && (
                              <div className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</div>
                            )}
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{getAssignedUsers(task)}</span>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              (task.stage || task.status || 'PENDING').toUpperCase() === 'COMPLETED' 
                                ? 'bg-green-100 text-green-800' :
                              (task.stage || task.status || 'PENDING').toUpperCase() === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800' :
                              (task.stage || task.status || 'PENDING').toUpperCase() === 'ON_HOLD'
                                ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                              {getStatusText(task.stage || task.status || 'PENDING')}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              (task.priority || 'MEDIUM').toUpperCase() === 'HIGH' ? 'bg-red-100 text-red-800' :
                              (task.priority || 'MEDIUM').toUpperCase() === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {(task.priority || 'MEDIUM').toUpperCase()}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">
                                {formatDate(task.taskDate || task.dueDate)}
                              </span>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">
                                {task.estimatedHours || task.timeAlloted || 0}h
                              </span>
                            </div>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setSelectedTask(task)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* TASK DETAILS & REASSIGN - Right Column (ORIGINAL FUNCTIONALITY) */}
        {selectedTask && (
          <div className="lg:w-2/5">
            <div className="bg-white border rounded-xl p-6">
              <div className="space-y-6">
                {/* Task Header */}
                <div className="flex items-start justify-between pb-4 border-b">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTask.title}</h2>
                    <p className="text-gray-600">
                      {selectedTask.client?.name || detailProject?.client?.name || 'Client'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs uppercase text-gray-500 font-medium mb-1">Project</div>
                    <div className="font-semibold text-gray-900">{detailProject?.name || 'Unknown'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs uppercase text-gray-500 font-medium mb-1">Priority</div>
                    <div className="font-semibold text-gray-900">{selectedTask.priority || 'MEDIUM'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs uppercase text-gray-500 font-medium mb-1">Due Date</div>
                    <div className="font-semibold text-gray-900">{formattedDue}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs uppercase text-gray-500 font-medium mb-1">Estimated Hours</div>
                    <div className="font-semibold text-gray-900">{selectedTask.timeAlloted ?? selectedTask.time_alloted ?? '—'}h</div>
                  </div>
                </div>

                {/* Description */}
                {selectedTask.description && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-2">Description</div>
                    <p className="text-gray-700">{selectedTask.description}</p>
                  </div>
                )}

                {/* REASSIGN SECTION - ORIGINAL FUNCTIONALITY */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Reassign Task</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <select
                      value={selectedAssignee}
                      onChange={(e) => setSelectedAssignee(e.target.value)}
                      disabled={employeesLoading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select employee</option>
                      {employees.map((employee) => {
                        const key = employee.internalId || employee.id || employee.public_id || employee._id;
                        return (
                          <option key={key} value={key}>
                            {employee.name || employee.email || 'Unnamed'}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      onClick={handleReassignTask}
                      disabled={reassigning || !selectedAssignee || employeesLoading}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        reassigning || !selectedAssignee || employeesLoading
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {reassigning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Reassigning...
                        </>
                      ) : (
                        'Reassign Task'
                      )}
                    </button>
                  </div>
                  {employeesLoading && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading employees...
                    </div>
                  )}
                </div>

                {/* Checklist */}
                {checklist.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckSquare className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-700">Checklist</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {checklist.map((item, index) => (
                        <div key={item.id || index} className="flex items-center gap-3 p-2 bg-white border rounded">
                          <div className="w-5 h-5 bg-emerald-100 rounded flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-emerald-600" />
                          </div>
                          <span className="text-sm">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE TASK MODAL - ORIGINAL FUNCTIONALITY */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-semibold">
                  ➕
                </div>
                Create New Task
              </h2>
              <button
                onClick={() => setShowCreateTaskModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Task Title */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    placeholder="Enter task title"
                  />
                </div>

                {/* Project */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Project
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-medium">
                    {selectedProject?.name || 'Selected Project'} ✓
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                  </select>
                </div>

                {/* Stage */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Stage
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.taskDate}
                    onChange={(e) => setFormData({ ...formData, taskDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Hours */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.timeAlloted}
                    onChange={(e) => setFormData({ ...formData, timeAlloted: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="8"
                  />
                </div>
              </div>

              {/* Assigned Users */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Assigned Users
                </label>
                <select
                  multiple
                  value={formData.assignedUsers}
                  onChange={e => {
                    const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                    setFormData({ ...formData, assignedUsers: selected });
                  }}
                  className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {employees.filter(emp => (emp.role === 'Employee' || emp.role === 'employee')).map(emp => (
                    <option key={emp.public_id || emp.id || emp._id} value={emp.public_id || emp.id || emp._id}>
                      {emp.name || emp.email || 'Unnamed Employee'}
                    </option>
                  ))}
                </select>
                <div className="text-sm text-gray-500 mt-1">
                  Hold Ctrl (Windows) or Cmd (Mac) to select multiple employees.
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                  placeholder="Task description..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !formData.title}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Creating Task...
                    </>
                  ) : (
                    'Create Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerTasks;