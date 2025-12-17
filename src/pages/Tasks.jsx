// import { useState, useEffect } from 'react';
// import { Plus, Edit2, Trash2, AlertCircle, Filter, List, Grid } from 'lucide-react';
// import { useDispatch, useSelector } from 'react-redux';
// import { toast } from 'sonner';

// import {
//   fetchTasks,
//   createTask,
//   updateTask,
//   deleteTask,
//   clearTasks,
//   selectTasks,
//   selectTaskStatus,
//   selectTaskError,
// } from '../redux/slices/taskSlice';
// import { fetchProjects, selectProjects } from '../redux/slices/projectSlice';
// import { selectDepartments } from '../redux/slices/departmentSlice';
// import { fetchUsers, selectUsers } from '../redux/slices/userSlice';

// export default function Tasks() {
//   const dispatch = useDispatch();

//   // Redux state
//   const tasks = useSelector(selectTasks) || [];
//   const status = useSelector(selectTaskStatus);
//   const error = useSelector(selectTaskError);
//   const projects = useSelector(selectProjects) || [];
//   const departments = useSelector(selectDepartments) || [];
//   const users = useSelector(selectUsers) || [];

//   // Local UI state
//   const [view, setView] = useState('list');
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingTask, setEditingTask] = useState(null);
//   const [formData, setFormData] = useState({
//     name: '',
//     description: '',
//     project_id: '',
//     assigned_to: '',
//     estimated_hours: '',
//     due_date: '',
//     priority: 'medium',
//     status: 'pending',
//   });

//   const [filterProject, setFilterProject] = useState('all');
//   const [filterStatus, setFilterStatus] = useState('all');
//   const [activeStatusEdit, setActiveStatusEdit] = useState(null);

//   const statusOptions = ['pending', 'in_progress', 'completed', 'on_hold'];
//   const priorityOptions = ['low', 'medium', 'high'];

//   const isLoading = status === 'loading';

//   useEffect(() => {
//     // Only fetch tasks when a project context is available (avoid global tasks fetch)
//     dispatch(fetchProjects());
//     dispatch(fetchUsers());
//   }, [dispatch]);

//   const handleProjectChange = async (e) => {
//     const val = e.target.value;
//     setFilterProject(val);
//     if (!val || val === 'all') {
//       // clear tasks from the store when no project is selected
//       dispatch(clearTasks());
//       return;
//     }

//     // Request tasks for selected project id/public_id
//     try {
//       await dispatch(fetchTasks({ project_id: val }));
//     } catch (err) {
//       // swallow - fetchTasks thunk will update error state and toast in effect
//     }
//   };

//   useEffect(() => {
//     if (error) toast.error(error?.message || String(error));
//   }, [error]);

//   const openModal = (task = null) => {
//     if (task) {
//       setEditingTask(task);
//       setFormData({
//         name: task.title || task.name || '',
//         description: task.description || '',
//         project_id: task.projectPublicId || task.project_public_id || task.project_id || '',
//         assigned_to: task.assignedTo || task.assigned_to || '',
//         estimated_hours: task.estimatedHours || task.estimated_hours || '',
//         due_date: task.dueDate || task.due_date || '',
//         priority: task.priority || 'medium',
//         status: task.status || 'pending',
//       });
//     } else {
//       setEditingTask(null);
//       setFormData({
//         name: '',
//         description: '',
//         project_id: '',
//         assigned_to: '',
//         estimated_hours: '',
//         due_date: '',
//         priority: 'medium',
//         status: 'pending',
//       });
//     }
//     setIsModalOpen(true);
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setEditingTask(null);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const projectPublicId = formData.project_id || null;

//       // Resolve selected project object from projects slice
//       const selectedProject = projects.find(
//         (p) => (p.public_id || p.id || p._id) === projectPublicId
//       );

//       // Derive department ids: prefer explicit form field, else use first department of selected project
//       const departmentPublicId =
//         formData.department_id ||
//         selectedProject?.departments?.[0]?.public_id ||
//         selectedProject?.departments?.[0]?.id ||
//         null;

//       // Also include backup numeric/internal ids where available to satisfy APIs that accept either
//       const projectId = selectedProject?.id || selectedProject?._id || null;
//       const departmentId =
//         selectedProject?.departments?.[0]?.id || selectedProject?.departments?.[0]?._id || null;

//       if (!formData.name || (!projectPublicId && !projectId)) {
//         toast.error('Please provide a task name and select a project');
//         return;
//       }

//       const payload = {
//         projectPublicId: projectPublicId || undefined,
//         projectId: projectId || undefined,
//         departmentPublicId: departmentPublicId || undefined,
//         departmentId: departmentId || undefined,
//         title: formData.name,
//         description: formData.description,
//         assignedTo: formData.assigned_to || null,
//         estimatedHours: formData.estimated_hours ? Number(formData.estimated_hours) : 0,
//         status: formData.status,
//         priority: formData.priority,
//         dueDate: formData.due_date || null,
//       };

//       if (editingTask) {
//         const taskId = editingTask.public_id || editingTask.id || editingTask._id;
//         await dispatch(updateTask({ taskId, data: payload })).unwrap();
//         toast.success('Task updated successfully');
//       } else {
//         await dispatch(createTask(payload)).unwrap();
//         toast.success('Task created successfully');
//       }

//       closeModal();
//       // Refresh tasks only for the active project context
//       const projectToFetch = filterProject !== 'all' ? filterProject : (formData.project_id || null);
//       if (projectToFetch) await dispatch(fetchTasks({ project_id: projectToFetch })).unwrap();
//     } catch (err) {
//       toast.error(err?.message || 'Operation failed');
//     }
//   };

//   const handleDelete = async (task) => {
//     if (!window.confirm('Delete this task?')) return;
//     try {
//       const taskId = task.public_id || task.id || task._id;
//       await dispatch(deleteTask(taskId)).unwrap();
//       toast.success('Task deleted');
//       const projectToFetch = filterProject !== 'all' ? filterProject : (task.projectPublicId || task.project_public_id || task.project_id || null);
//       if (projectToFetch) await dispatch(fetchTasks({ project_id: projectToFetch })).unwrap();
//     } catch (err) {
//       toast.error(err?.message || 'Delete failed');
//     }
//   };

//   const updateStatusInline = async (task, newStatus) => {
//     if (!newStatus) return;
//     try {
//       const taskId = task.public_id || task.id || task._id;
//       await dispatch(updateTask({ taskId, data: { status: newStatus } })).unwrap();
//       setActiveStatusEdit(null);
//       const projectToFetch = filterProject !== 'all' ? filterProject : (task.projectPublicId || task.project_public_id || task.project_id || null);
//       if (projectToFetch) await dispatch(fetchTasks({ project_id: projectToFetch })).unwrap();
//     } catch (err) {
//       toast.error(err?.message || 'Status update failed');
//     }
//   };

//   // Filters
//   const filteredTasks = tasks.filter((task) => {
//     const projectMatch =
//       filterProject === 'all' ||
//       [
//         task.project_id,
//         task.projectId,
//         task.project_public_id,
//         task.projectPublicId,
//         String(task.project_id),
//         String(task.project_public_id),
//       ].some((v) => v !== undefined && v !== null && String(v) === String(filterProject));
//     const statusMatch = filterStatus === 'all' || task.status === filterStatus;
//     return projectMatch && statusMatch;
//   });

//   const getProjectName = (projectId) => {
//     return projects.find((p) => (p.id || p._id || p.public_id) === projectId)?.name || '-';
//   };

//   const statusColors = {
//     pending: 'bg-yellow-100 text-yellow-700',
//     in_progress: 'bg-blue-100 text-blue-700',
//     completed: 'bg-green-100 text-green-700',
//     on_hold: 'bg-red-100 text-red-700',
//   };

//   const priorityColors = {
//     low: 'bg-gray-100 text-gray-700',
//     medium: 'bg-amber-100 text-amber-700',
//     high: 'bg-red-100 text-red-700',
//   };

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <div className="animate-spin h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full" />
//       </div>
//     );
//   }

//   return (
//     <div className="p-8">
//       {/* HEADER */}
//       <div className="flex items-center justify-between mb-8">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 mb-2">Tasks</h1>
//           <p className="text-gray-600">Manage and track all your tasks</p>
//         </div>

//         <div className="flex items-center gap-3">
//           <select
//             value={filterProject}
//             onChange={handleProjectChange}
//             className="border rounded-md p-2 mr-2 bg-white"
//           >
//             <option value="all">All Projects</option>
//             {projects.map((p) => {
//               const id = p.id ?? p._id ?? p.public_id;
//               return (
//                 <option key={id} value={id}>
//                   {p.name || p.title || id}
//                 </option>
//               );
//             })}
//           </select>
//           <button
//             onClick={() => setView('list')}
//             className={`p-2 rounded-lg border ${view === 'list' ? 'bg-blue-100 border-blue-400' : 'bg-white'}`}
//           >
//             <List className="w-5 h-5 text-blue-600" />
//           </button>

//           <button
//             onClick={() => setView('card')}
//             className={`p-2 rounded-lg border ${view === 'card' ? 'bg-blue-100 border-blue-400' : 'bg-white'}`}
//           >
//             <Grid className="w-5 h-5 text-blue-600" />
//           </button>

//           <button
//             onClick={() => openModal()}
//             className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
//           >
//             <Plus className="w-5 h-5" />
//             Add Task
//           </button>
//         </div>
//       </div>

//       {/* STATUS SUMMARY */}
//       <div className="flex flex-wrap gap-3 mb-6">
//         <div className="px-4 py-2 rounded-lg bg-yellow-100 text-yellow-700 font-semibold shadow-sm">
//           Pending : {tasks.filter((t) => t.status === 'pending').length}
//         </div>
//         <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold shadow-sm">
//           In-Progress : {tasks.filter((t) => t.status === 'in_progress').length}
//         </div>
//         <div className="px-4 py-2 rounded-lg bg-green-100 text-green-700 font-semibold shadow-sm">
//           Completed : {tasks.filter((t) => t.status === 'completed').length}
//         </div>
//         <div className="px-4 py-2 rounded-lg bg-red-100 text-red-700 font-semibold shadow-sm">
//           On-Hold : {tasks.filter((t) => t.status === 'on_hold').length}
//         </div>
//       </div>

//       {/* FILTERS */}
//       <div className="bg-white rounded-xl border p-4 mb-6 flex items-center gap-4 flex-wrap">
//         <div className="flex items-center gap-2">
//           <Filter className="w-5 h-5 text-gray-600" />
//           <span className="text-gray-700">Filters:</span>
//         </div>

//         <select
//           value={filterProject}
//           onChange={(e) => {
//             // keep local filter state but also trigger project-specific fetch
//             const v = e.target.value;
//             setFilterProject(v);
//             if (!v || v === 'all') {
//               dispatch(clearTasks());
//             } else {
//               dispatch(fetchTasks({ project_id: v }));
//             }
//           }}
//           className="px-4 py-2 border rounded-lg"
//         >
//           <option value="all">All Projects</option>
//           {projects.map((p) => {
//             const id = p.id ?? p._id ?? p.public_id;
//             return (
//               <option key={id} value={id}>
//                 {p.name}
//               </option>
//             );
//           })}
//         </select>

//         <select
//           value={filterStatus}
//           onChange={(e) => setFilterStatus(e.target.value)}
//           className="px-4 py-2 border rounded-lg"
//         >
//           <option value="all">All Status</option>
//           {statusOptions.map((s) => (
//             <option key={s} value={s}>
//               {s.replace('_', ' ')}
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* LIST VIEW */}
//       {view === 'list' && (
//         <div className="bg-white border rounded-xl overflow-hidden">
//           <table className="w-full table-auto">
//             <thead className="bg-gray-100 text-gray-700">
//               <tr>
//                 <th className="p-3 text-left">Task</th>
//                 <th className="p-3 text-left">Project</th>
//                 <th className="p-3 text-left">Status</th>
//                 <th className="p-3 text-left">Priority</th>
//                 <th className="p-3 text-left">Due Date</th>
//                 <th className="p-3 text-right">Actions</th>
//               </tr>
//             </thead>

//             <tbody>
//               {filteredTasks.length === 0 ? (
//                 <tr>
//                   <td colSpan="6" className="p-8 text-center text-gray-500">
//                     No tasks found
//                   </td>
//                 </tr>
//               ) : (
//                 filteredTasks.map((task) => (
//                   <tr key={task.public_id || task.id || task._id} className="border-b hover:bg-gray-50">
//                     <td className="p-3">
//                       <div className="font-medium">{task.title || task.name}</div>
//                       <div className="text-sm text-gray-500">{task.description}</div>
//                     </td>

//                     <td className="p-3">
//                       <span className="px-3 py-1 rounded-full text-white text-sm bg-blue-600">
//                         {getProjectName(task.projectPublicId || task.project_public_id || task.project_id)}
//                       </span>
//                     </td>

//                     <td className="p-3">
//                       {activeStatusEdit === (task.public_id || task.id || task._id) ? (
//                         <select
//                           value={task.status}
//                           onChange={(e) => updateStatusInline(task, e.target.value)}
//                           className="border rounded-lg px-2 py-1"
//                         >
//                           {statusOptions.map((s) => (
//                             <option key={s} value={s}>
//                               {s.replace('_', ' ')}
//                             </option>
//                           ))}
//                         </select>
//                       ) : (
//                         <span
//                           onClick={() => setActiveStatusEdit(task.public_id || task.id || task._id)}
//                           className={`px-3 py-1 rounded-full cursor-pointer text-sm ${statusColors[task.status]}`}
//                         >
//                           {task.status?.replace('_', ' ') || '-'}
//                         </span>
//                       )}
//                     </td>

//                     <td className="p-3">
//                       <span className={`px-3 py-1 rounded-full text-sm ${priorityColors[task.priority]}`}>
//                         {(task.priority || 'medium').toUpperCase()}
//                       </span>
//                     </td>

//                     <td className="p-3 text-sm">{task.dueDate || task.due_date || '-'}</td>

//                     <td className="p-3 text-right">
//                       <div className="flex justify-end gap-2">
//                         <button
//                           onClick={() => openModal(task)}
//                           className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
//                         >
//                           <Edit2 className="w-4 h-4" />
//                         </button>
//                         <button
//                           onClick={() => handleDelete(task)}
//                           className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* CARD VIEW */}
//       {view === 'card' && (
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {filteredTasks.length === 0 ? (
//             <div className="col-span-full text-center py-12 text-gray-500">
//               <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
//               <p>No tasks found</p>
//             </div>
//           ) : (
//             filteredTasks.map((task) => (
//               <div key={task.public_id || task.id || task._id} className="bg-white border rounded-xl p-6">
//                 <div className="flex items-start justify-between mb-4">
//                   <div className="flex-1">
//                     <h3 className="text-lg font-semibold text-gray-900">{task.title || task.name}</h3>
//                     <p className="text-sm text-gray-600 mt-1">{task.description}</p>
//                   </div>
//                   <div className="flex gap-2">
//                     <button onClick={() => openModal(task)} className="p-2 hover:bg-gray-100 rounded-lg">
//                       <Edit2 className="w-4 h-4" />
//                     </button>
//                     <button onClick={() => handleDelete(task)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
//                       <Trash2 className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </div>

//                 <div className="mb-3">
//                   <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
//                     {getProjectName(task.projectPublicId || task.project_public_id || task.project_id)}
//                   </span>
//                 </div>

//                 <div className="mb-4">
//                   <span className="text-gray-600 text-sm">Status: </span>
//                   <span className={`ml-2 px-3 py-1 rounded-full text-sm ${statusColors[task.status]}`}>{task.status}</span>
//                 </div>

//                 <div className="mb-3">
//                   <span className="text-gray-600 text-sm">Priority: </span>
//                   <span className={`ml-2 px-3 py-1 rounded-full text-sm ${priorityColors[task.priority]}`}>
//                     {(task.priority || 'medium').toUpperCase()}
//                   </span>
//                 </div>

//                 <div className="pt-4 border-t">
//                   <div className="text-xs text-gray-500">Due: {task.dueDate || task.due_date || '-'}</div>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       )}

//       {/* MODAL */}
//       {isModalOpen && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
//             <h2 className="text-xl font-semibold text-gray-900 mb-6">{editingTask ? 'Edit Task' : 'Add Task'}</h2>

//             <form onSubmit={handleSubmit}>
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-gray-700 font-medium mb-2">Task Name</label>
//                   <input
//                     type="text"
//                     required
//                     value={formData.name}
//                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                     className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-gray-700 font-medium mb-2">Description</label>
//                   <textarea
//                     value={formData.description}
//                     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                     rows={3}
//                     className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-gray-700 font-medium mb-2">Project <span className="text-red-500">*</span></label>
//                     <select
//                       required
//                       value={formData.project_id}
//                       onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
//                       className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">-- Select project --</option>
//                       {projects.map((p) => (
//                         <option key={p.public_id || p.id || p._id} value={p.public_id || p.id || p._id}>
//                           {p.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-gray-700 font-medium mb-2">Priority</label>
//                     <select
//                       value={formData.priority}
//                       onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
//                       className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                     >
//                       {priorityOptions.map((p) => (
//                         <option key={p} value={p}>
//                           {p.toUpperCase()}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-gray-700 font-medium mb-2">Assign To</label>
//                     <select
//                       value={formData.assigned_to}
//                       onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
//                       className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">-- Select user (optional) --</option>
//                       {users.map((u) => (
//                         <option key={u.public_id || u.id || u._id} value={u.public_id || u.id || u._id}>
//                           {u.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-gray-700 font-medium mb-2">Estimated Hours</label>
//                     <input
//                       type="number"
//                       min="0"
//                       value={formData.estimated_hours}
//                       onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
//                       className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                       placeholder="e.g. 16"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-gray-700 font-medium mb-2">Due Date</label>
//                     <input
//                       type="date"
//                       value={formData.due_date}
//                       onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
//                       className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-gray-700 font-medium mb-2">Status</label>
//                   <select
//                     value={formData.status}
//                     onChange={(e) => setFormData({ ...formData, status: e.target.value })}
//                     className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//                   >
//                     {statusOptions.map((s) => (
//                       <option key={s} value={s}>
//                         {s.replace('_', ' ')}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               <div className="flex gap-3 mt-6">
//                 <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium">
//                   Cancel
//                 </button>
//                 <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
//                   {editingTask ? 'Update' : 'Create'}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }





import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, Filter, List, Grid, Calendar, Clock, User, RefreshCw } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';

import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  clearTasks,
  selectTasks,
  selectTaskStatus,
  selectTaskError,
} from '../redux/slices/taskSlice';
import { fetchProjects, selectProjects } from '../redux/slices/projectSlice';
import { fetchUsers, selectUsers } from '../redux/slices/userSlice';

export default function Tasks() {
  const dispatch = useDispatch();

  // Redux state
  const tasks = useSelector(selectTasks) || [];
  const status = useSelector(selectTaskStatus);
  const error = useSelector(selectTaskError);
  const projects = useSelector(selectProjects) || [];
  const users = useSelector(selectUsers) || [];

  // Local UI state
  const [view, setView] = useState('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_id: '',
    assigned_to: '',
    estimated_hours: '',
    due_date: '',
    priority: 'medium',
    status: 'pending',
  });

  const [filterStatus, setFilterStatus] = useState('all');
  const [activeStatusEdit, setActiveStatusEdit] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  const statusOptions = ['pending', 'in_progress', 'completed', 'on_hold'];
  const priorityOptions = ['low', 'medium', 'high'];

  const isLoading = status === 'loading';

  // Fetch projects and users on initial load
  useEffect(() => {
    console.log('Initial useEffect - fetching projects and users');
    dispatch(fetchProjects());
    dispatch(fetchUsers());
  }, [dispatch]);

  // Debug: Log when selectedProjectId changes
  useEffect(() => {
    console.log('selectedProjectId changed to:', selectedProjectId);
  }, [selectedProjectId]);

  // Debug: Log tasks and projects
  useEffect(() => {
    console.log('Tasks updated:', tasks.length);
    console.log('Projects available:', projects.length);
  }, [tasks, projects]);

  // Handle project selection change - FIXED VERSION
  const handleProjectChange = async (e) => {
    const projectId = e.target.value;
    console.log('handleProjectChange called with projectId:', projectId);
    setSelectedProjectId(projectId);
    
    if (projectId === 'all') {
      console.log('Clearing tasks for "All Projects"');
      dispatch(clearTasks());
      return;
    }

    // Validate project exists
    const selectedProject = projects.find(p => 
      p.id === projectId || p._id === projectId || p.public_id === projectId
    );
    
    if (!selectedProject) {
      console.error('Selected project not found in projects list');
      toast.error('Selected project not found');
      return;
    }

    console.log('Selected project found:', selectedProject.name);
    
    // Fetch tasks for the selected project
    setIsFetching(true);
    try {
      console.log('Dispatching fetchTasks with project_id:', projectId);
      
      // IMPORTANT: Make sure we're passing the correct parameter name
      // The fetchTasks thunk expects { project_id: value }
      const result = await dispatch(fetchTasks({ project_id: projectId }));
      console.log('fetchTasks result:', result);
      
      if (fetchTasks.fulfilled.match(result)) {
        console.log('Tasks fetched successfully:', result.payload?.length || 0, 'tasks');
        toast.success(`Loaded ${result.payload?.length || 0} tasks for ${selectedProject.name}`);
      } else if (fetchTasks.rejected.match(result)) {
        console.error('fetchTasks rejected:', result.payload || result.error);
        toast.error('Failed to fetch tasks: ' + (result.payload || result.error?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error in handleProjectChange:', err);
      toast.error('Failed to fetch tasks');
    } finally {
      setIsFetching(false);
    }
  };

  // Alternative: Fetch tasks when selectedProjectId changes (useEffect approach)
  useEffect(() => {
    const fetchTasksForProject = async () => {
      if (selectedProjectId && selectedProjectId !== 'all') {
        console.log('useEffect: Fetching tasks for project:', selectedProjectId);
        setIsFetching(true);
        try {
          await dispatch(fetchTasks({ project_id: selectedProjectId })).unwrap();
        } catch (err) {
          console.error('Failed to fetch tasks in useEffect:', err);
        } finally {
          setIsFetching(false);
        }
      }
    };

    fetchTasksForProject();
  }, [selectedProjectId, dispatch]);

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      console.error('Task error:', error);
      toast.error(error?.message || String(error));
    }
  }, [error]);

  // Manual refresh function
  const handleRefreshTasks = useCallback(async () => {
    if (selectedProjectId === 'all') {
      toast.info('Please select a project to refresh tasks');
      return;
    }

    console.log('Manual refresh for project:', selectedProjectId);
    setIsFetching(true);
    try {
      const result = await dispatch(fetchTasks({ project_id: selectedProjectId })).unwrap();
      console.log('Refresh successful, tasks:', result?.length || 0);
      toast.success(`Refreshed tasks (${result?.length || 0} found)`);
    } catch (err) {
      console.error('Refresh failed:', err);
      toast.error('Refresh failed: ' + (err?.message || String(err)));
    } finally {
      setIsFetching(false);
    }
  }, [selectedProjectId, dispatch]);

  const openModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        name: task.title || task.name || '',
        description: task.description || '',
        project_id: task.projectId || task.project_id || selectedProjectId,
        assigned_to: task.assignedUsers?.[0]?.id || '',
        estimated_hours: task.estimatedHours || task.timeAlloted || '',
        due_date: task.dueDate || task.taskDate ? task.taskDate.split('T')[0] : '',
        priority: (task.priority || 'MEDIUM').toLowerCase(),
        status: task.stage ? task.stage.toLowerCase() : 'pending',
      });
    } else {
      setEditingTask(null);
      setFormData({
        name: '',
        description: '',
        project_id: selectedProjectId !== 'all' ? selectedProjectId : '',
        assigned_to: '',
        estimated_hours: '',
        due_date: '',
        priority: 'medium',
        status: 'pending',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Get the project ID (numeric ID from backend)
      const selectedProject = projects.find(
        (p) => (p.id || p._id || p.public_id) === formData.project_id
      );
      
      if (!formData.name || !formData.project_id) {
        toast.error('Please provide a task name and select a project');
        return;
      }

      // Prepare payload according to backend API
      const projectId = selectedProject?.id ?? selectedProject?._id ?? null;
      const projectPublicId = selectedProject?.public_id ?? selectedProject?.project_public_id ?? null;
      const client_id = selectedProject?.client_id ?? selectedProject?.clientId ?? selectedProject?.client?.id ?? selectedProject?.client?._id ?? null;

      const payload = {
        project_id: projectId || formData.project_id,
        projectId: projectId || undefined,
        projectPublicId: projectPublicId || undefined,
        client_id: client_id || undefined,
        title: formData.name,
        description: formData.description || '',
        stage: (formData.status || 'pending').toUpperCase(),
        taskDate: formData.due_date ? new Date(formData.due_date).toISOString() : new Date().toISOString(),
        priority: (formData.priority || 'medium').toUpperCase(),
        estimatedHours: formData.estimated_hours ? Number(formData.estimated_hours) : 0,
        timeAlloted: formData.estimated_hours ? Number(formData.estimated_hours) : 0,
      };

      // Handle assigned user if selected: provide both assignedUsers objects and assigned_to id array
      if (formData.assigned_to) {
        const assignedUser = users.find(u => u.id === formData.assigned_to || u._id === formData.assigned_to || u.public_id === formData.assigned_to);
        if (assignedUser) {
          payload.assignedUsers = [{ 
            id: assignedUser.public_id || assignedUser.id || assignedUser._id,
            internalId: assignedUser.id || assignedUser._id,
            name: assignedUser.name || ''
          }];
          payload.assigned_to = [assignedUser.public_id || assignedUser.id || assignedUser._id];
        }
      }

      if (editingTask) {
        const taskId = editingTask.id || editingTask._id || editingTask.public_id;
        await dispatch(updateTask({ taskId, data: payload })).unwrap();
        toast.success('Task updated successfully');
      } else {
        await dispatch(createTask(payload)).unwrap();
        toast.success('Task created successfully');
      }

      closeModal();
      
      // Refresh tasks for the current project
      handleRefreshTasks();
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err?.message || 'Operation failed');
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const taskId = task.id || task._id || task.public_id;
      await dispatch(deleteTask(taskId)).unwrap();
      toast.success('Task deleted successfully');
      
      // Refresh tasks for the current project
      handleRefreshTasks();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err?.message || 'Delete failed');
    }
  };

  const updateStatusInline = async (task, newStatus) => {
    if (!newStatus) return;
    
    try {
      const taskId = task.id || task._id || task.public_id;
      await dispatch(updateTask({ 
        taskId, 
        data: { 
          stage: newStatus.toUpperCase(),
          // Keep other fields unchanged
          title: task.title || task.name,
          description: task.description,
          priority: task.priority,
          estimatedHours: task.estimatedHours,
          timeAlloted: task.timeAlloted
        } 
      })).unwrap();
      
      setActiveStatusEdit(null);
      toast.success('Status updated');
      
      // Refresh tasks for the current project
      handleRefreshTasks();
    } catch (err) {
      console.error('Status update error:', err);
      toast.error(err?.message || 'Status update failed');
    }
  };

  // Get status text for display
  const getStatusText = (status) => {
    if (!status) return 'Pending';
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Filter tasks based on selected status
  const filteredTasks = tasks.filter((task) => {
    if (filterStatus === 'all') return true;
    
    // Map backend stage to local status
    const taskStatus = task.stage ? task.stage.toLowerCase() : 'pending';
    return taskStatus === filterStatus;
  });

  // Get project name by ID
  const getProjectName = (projectId) => {
    const project = projects.find((p) => 
      p.id === projectId || p._id === projectId || p.public_id === projectId
    );
    return project?.name || project?.title || 'Unknown Project';
  };

  // Get assigned user names
  const getAssignedUsers = (task) => {
    if (!task.assignedUsers || !task.assignedUsers.length) return 'Unassigned';
    return task.assignedUsers.map(u => u.name).join(', ');
  };

  // Status colors
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    in_progress: 'bg-blue-100 text-blue-800 border border-blue-200',
    completed: 'bg-green-100 text-green-800 border border-green-200',
    on_hold: 'bg-red-100 text-red-800 border border-red-200',
  };

  // Priority colors
  const priorityColors = {
    low: 'bg-gray-100 text-gray-800 border border-gray-200',
    medium: 'bg-amber-100 text-amber-800 border border-amber-200',
    high: 'bg-red-100 text-red-800 border border-red-200',
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-8">
      {/* DEBUG INFO - Remove in production */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
        <div>Selected Project: {selectedProjectId}</div>
        <div>Tasks Count: {tasks.length}</div>
        <div>Projects Count: {projects.length}</div>
        <div>Status: {status}</div>
        <div>Fetching: {isFetching ? 'Yes' : 'No'}</div>
      </div>

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tasks</h1>
          <p className="text-gray-600">Manage and track all your tasks</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Project Selector */}
          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={handleProjectChange}
              className="border border-gray-300 rounded-lg px-4 py-2 pr-8 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none min-w-[200px]"
              disabled={isFetching}
            >
              <option value="all">All Projects</option>
              {projects.map((project) => {
                const projectId = project.id || project._id || project.public_id;
                return (
                  <option key={projectId} value={projectId}>
                    {project.name || project.title}
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
            onClick={handleRefreshTasks}
            disabled={selectedProjectId === 'all' || isFetching}
            className={`p-2 rounded-lg border ${
              selectedProjectId === 'all' || isFetching
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-600 hover:bg-blue-50 border-blue-200'
            }`}
            title="Refresh tasks"
          >
            <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('list')}
              disabled={isFetching}
              className={`px-3 py-2 ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} ${
                isFetching ? 'opacity-50' : ''
              }`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('card')}
              disabled={isFetching}
              className={`px-3 py-2 ${view === 'card' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} ${
                isFetching ? 'opacity-50' : ''
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>

          {/* Add Task Button */}
          <button
            onClick={() => openModal()}
            disabled={selectedProjectId === 'all' || isFetching}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedProjectId === 'all' || isFetching
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
      {isFetching && (
        <div className="flex items-center justify-center p-4 mb-6 bg-blue-50 rounded-lg">
          <RefreshCw className="w-5 h-5 mr-2 animate-spin text-blue-600" />
          <span className="text-blue-600 font-medium">Loading tasks...</span>
        </div>
      )}

      {/* STATUS SUMMARY - Only show when a project is selected */}
      {selectedProjectId !== 'all' && tasks.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="px-4 py-2 rounded-lg bg-yellow-100 text-yellow-800 font-semibold shadow-sm border border-yellow-200">
            Pending: {tasks.filter((t) => (t.stage || '').toLowerCase() === 'pending').length}
          </div>
          <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-semibold shadow-sm border border-blue-200">
            In Progress: {tasks.filter((t) => (t.stage || '').toLowerCase() === 'in_progress').length}
          </div>
          <div className="px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold shadow-sm border border-green-200">
            Completed: {tasks.filter((t) => (t.stage || '').toLowerCase() === 'completed').length}
          </div>
          <div className="px-4 py-2 rounded-lg bg-red-100 text-red-800 font-semibold shadow-sm border border-red-200">
            On Hold: {tasks.filter((t) => (t.stage || '').toLowerCase() === 'on_hold').length}
          </div>
        </div>
      )}

      {/* PROJECT INFO - Show selected project info */}
      {selectedProjectId !== 'all' && tasks.length > 0 && (
        <div className="bg-white rounded-xl border p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {getProjectName(selectedProjectId)} - Tasks ({tasks.length})
          </h2>
          <p className="text-gray-600">
            Showing tasks for selected project
          </p>
        </div>
      )}

      {/* FILTERS - Only show when a project is selected */}
      {selectedProjectId !== 'all' && tasks.length > 0 && (
        <div className="bg-white rounded-xl border p-4 mb-6 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700 font-medium">Filters:</span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isFetching}
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
      {selectedProjectId === 'all' && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Project</h3>
          <p className="text-gray-600 mb-6">
            Please select a project from the dropdown above to view and manage tasks.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {projects.slice(0, 5).map((project) => {
              const projectId = project.id || project._id || project.public_id;
              return (
                <button
                  key={projectId}
                  onClick={() => setSelectedProjectId(projectId)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  {project.name || project.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* NO TASKS STATE - When project selected but no tasks */}
      {selectedProjectId !== 'all' && !isFetching && tasks.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Found</h3>
          <p className="text-gray-600 mb-6">
            No tasks found for project "{getProjectName(selectedProjectId)}". 
            Create your first task or try refreshing.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Task
            </button>
            <button
              onClick={handleRefreshTasks}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {selectedProjectId !== 'all' && !isFetching && tasks.length > 0 && view === 'list' && (
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
                filteredTasks.map((task) => (
                  <tr 
                    key={task.id || task._id || task.public_id} 
                    className="border-b hover:bg-gray-50 transition-colors"
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
                      {activeStatusEdit === (task.id || task._id || task.public_id) ? (
                        <select
                          value={task.stage ? task.stage.toLowerCase() : 'pending'}
                          onChange={(e) => updateStatusInline(task, e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onBlur={() => setActiveStatusEdit(null)}
                          autoFocus
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {getStatusText(s)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          onClick={() => setActiveStatusEdit(task.id || task._id || task.public_id)}
                          className={`px-3 py-1 rounded-full cursor-pointer text-sm font-medium ${statusColors[task.stage?.toLowerCase() || 'pending']}`}
                        >
                          {getStatusText(task.stage || 'pending')}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[(task.priority || 'MEDIUM').toLowerCase()]}`}>
                        {(task.priority || 'MEDIUM').toUpperCase()}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{formatDate(task.taskDate || task.dueDate)}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{task.estimatedHours || task.timeAlloted || 0}h</span>
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openModal(task)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CARD VIEW */}
      {selectedProjectId !== 'all' && !isFetching && tasks.length > 0 && view === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl border p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-gray-500">No tasks found for the selected filters</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div 
                key={task.id || task._id || task.public_id} 
                className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title || task.name}</h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 line-clamp-3">{task.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => openModal(task)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(task)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Status and Priority */}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    onClick={() => setActiveStatusEdit(task.id || task._id || task.public_id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${statusColors[task.stage?.toLowerCase() || 'pending']}`}
                  >
                    {getStatusText(task.stage || 'pending')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[(task.priority || 'MEDIUM').toLowerCase()]}`}>
                    {(task.priority || 'MEDIUM').toUpperCase()}
                  </span>
                </div>

                {/* Task Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{getAssignedUsers(task)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(task.taskDate || task.dueDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{task.estimatedHours || task.timeAlloted || 0} hours estimated</span>
                  </div>
                </div>

                {/* Project Info */}
                <div className="pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    Project: <span className="font-medium text-gray-700">{getProjectName(selectedProjectId)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Task Name */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Task Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter task name"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Enter task description"
                  />
                </div>

                {/* Project and Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Project <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.project_id}
                      onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a project</option>
                      {projects.map((project) => (
                        <option 
                          key={project.id || project._id || project.public_id} 
                          value={project.id || project._id || project.public_id}
                        >
                          {project.name || project.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {getStatusText(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Priority and Assignee */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {priorityOptions.map((p) => (
                        <option key={p} value={p}>
                          {p.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Assign To
                    </label>
                    <select
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a user (optional)</option>
                      {users.map((user) => (
                        <option 
                          key={user.id || user._id || user.public_id} 
                          value={user.id || user._id || user.public_id}
                        >
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Estimated Hours and Due Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.estimated_hours}
                      onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 8"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}