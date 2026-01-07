import React, { useEffect, useState } from 'react'; // REMOVED useCallback/useMemo causing issues
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDepartments,
  selectDepartments,
  selectDepartmentStatus,
  selectDepartmentError,
  deleteDepartment,
  createDepartment,
  updateDepartment,
} from '../redux/slices/departmentSlice';
import { fetchUsers, selectUsers } from '../redux/slices/userSlice';
import { toast } from 'sonner';
import { IoMdAdd } from 'react-icons/io';
import { IoSearch, IoFilter, IoPencil, IoTrash, IoBusiness, IoPerson, IoGridOutline, IoListOutline } from 'react-icons/io5';
import Title from '../components/Title';
import Button from '../components/Button';
import clsx from 'clsx';

function DepartmentsModal({ show, onClose, form, setForm, onSubmit, editing, managers = [] }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0" onClick={onClose}></div>
      <form onSubmit={onSubmit} className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-gray-900 text-xl font-bold">{editing ? 'Edit Department' : 'Add Department'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter department name"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm">Manager (optional)</label>
            <select
              value={form.managerId || ''}
              onChange={(e) => setForm({ ...form, managerId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">-- Select manager --</option>
              {managers.map((m) => (
                <option key={m.public_id || m._id || m.id} value={m.public_id || m._id || m.id}>
                  {m.name} {m.role ? `(${m.role})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm">Head Department ID (optional)</label>
            <input
              value={form.headId}
              onChange={(e) => setForm({ ...form, headId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter parent department ID"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium shadow-lg hover:shadow-xl transition-all"
          >
            {editing ? 'Update Department' : 'Create Department'}
          </button>
        </div>
      </form>
    </div>
  );
}

const Departments = () => {
  const dispatch = useDispatch();
  const departments = useSelector(selectDepartments);
  const status = useSelector(selectDepartmentStatus);
  const error = useSelector(selectDepartmentError);
  const allUsers = useSelector(selectUsers) || [];
  
  // FIXED: Direct filtering without complex logic
  const managers = React.useMemo(() => 
    allUsers.filter((u) => (u?.role || '').toLowerCase() === 'manager'), 
  [allUsers]
  );

  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [form, setForm] = useState({ name: '', managerId: '', headId: '' });
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchUsers());
  }, [dispatch]);

  // SIMPLIFIED data processing - no refreshKey causing loops
  const processedDepartments = departments.map((dept, index) => {
    const mgrId = dept.manager_id || dept.managerId || dept.manager || dept.managerId;
    let managerDetails = null;
    if (mgrId) {
      managerDetails = allUsers.find((u) =>
        u.public_id === mgrId || u._id === mgrId || u.id === mgrId ||
        u.email === mgrId || u.name === mgrId
      );
    }

    const managerName = managerDetails?.name || dept.manager_name || dept.managerName || dept.manager || 'Unassigned';
    
    return {
      ...dept,
      displayId: index + 1,
      actualId: dept.public_id || dept._id || dept.id,
      managerName,
      createdAt: dept.createdAt || dept.created_at || 'N/A',
      name: dept.name || 'Unnamed Department',
      color: ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]
    };
  });

  const filteredDepartments = processedDepartments.filter((dept) =>
    dept.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.managerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await dispatch(deleteDepartment(id)).unwrap();
      toast.success('Department deleted successfully');
    } catch (e) {
      toast.error(e?.message || 'Delete failed');
    }
  };

  const handleCreate = () => {
    setEditDept(null);
    setForm({ name: '', managerId: '', headId: '' });
    setShowModal(true);
  };

  const openEdit = (d) => {
    setEditDept(d);
    setForm({ name: d.name || '', managerId: d.managerId || '', headId: d.headId || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (editDept) {
        const departmentId = editDept.actualId;
        await dispatch(updateDepartment({ departmentId, data: form })).unwrap();
        toast.success('Department updated successfully');
      } else {
        await dispatch(createDepartment(form)).unwrap();
        toast.success('Department created successfully');
        setForm({ name: '', managerId: '', headId: '' });
      }
      setShowModal(false);
      // Redux will automatically update the list
    } catch (err) {
      toast.error(err?.message || 'Save failed');
    }
  };

  // Loading and error states
  if (status === 'loading') {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="animate-spin h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <IoTrash size={24} />
        </div>
        <h3 className="text-lg font-bold text-red-800 mb-2">Failed to load departments</h3>
        <p className="text-red-600 mb-6">{error || 'An error occurred'}</p>
        <Button
          label="Try Again"
          onClick={() => dispatch(fetchDepartments())}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-semibold"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Title title="Department Management" />
            <p className="text-gray-600 text-sm mt-1">Organize and manage your company departments</p>
            {/* Debug info */}
            <p className="text-xs text-gray-500 mt-1">Managers found: {managers.length}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                dispatch(fetchDepartments());
                dispatch(fetchUsers());
              }}
              className="p-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-semibold text-sm"
              title="Refresh departments"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  "p-2.5 rounded-lg transition-all flex items-center justify-center",
                  viewMode === 'grid' 
                    ? "bg-white shadow-md text-blue-600" 
                    : "text-gray-600 hover:text-gray-900"
                )}
                title="Grid View"
              >
                <IoGridOutline size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={clsx(
                  "p-2.5 rounded-lg transition-all flex items-center justify-center",
                  viewMode === 'list' 
                    ? "bg-white shadow-md text-blue-600" 
                    : "text-gray-600 hover:text-gray-900"
                )}
                title="List View"
              >
                <IoListOutline size={18} />
              </button>
            </div>
            
            <Button
              label="Add Department"
              icon={<IoMdAdd className="ml-2" />}
              onClick={handleCreate}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold text-sm"
            />
          </div>
        </div>

        {/* Stats - SIMPLIFIED */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Total Departments</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{processedDepartments.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <IoBusiness size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">With Managers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {processedDepartments.filter(d => d.managerName !== 'Unassigned').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                <IoPerson size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Filtered</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{filteredDepartments.length}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                <IoFilter size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Total Managers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{managers.length}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                <IoPerson size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search departments by name or manager..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredDepartments.length}</span> of{" "}
              <span className="font-semibold text-gray-900">{processedDepartments.length}</span> departments
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        </div>

        {/* Main Content - SAME AS BEFORE */}
        {filteredDepartments.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <IoBusiness className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-lg font-bold text-gray-900 mb-3">No departments found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-sm">
              {searchQuery 
                ? "No departments match your search. Try different keywords."
                : "Your department list is empty. Create your first department to get started."}
            </p>
            <Button
              label="Create First Department"
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl text-sm"
            />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepartments.map((d) => (
              <div key={d.actualId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
                      style={{ backgroundColor: d.color }}
                    >
                      {d.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{d.name}</div>
                      <div className="text-xs text-gray-500">ID: {d.displayId}</div>
                    </div>
                  </div>
                  <span className={clsx(
                    "px-3 py-1 rounded-full text-xs font-semibold",
                    d.managerName === 'Unassigned' 
                      ? "bg-gray-100 text-gray-800" 
                      : "bg-emerald-100 text-emerald-800"
                  )}>
                    {d.managerName === 'Unassigned' ? 'No Manager' : 'Has Manager'}
                  </span>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <IoPerson className="text-gray-400" size={14} />
                    <span>Manager: {d.managerName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Created: {d.createdAt}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(d)}
                      className="p-2 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 hover:shadow-md transition-all duration-200"
                      title="Edit Department"
                    >
                      <IoPencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(d.actualId)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 hover:shadow-md transition-all duration-200"
                      title="Delete Department"
                    >
                      <IoTrash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <div 
              onClick={handleCreate}
              className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[280px]"
            >
              <div className="w-12 h-12 rounded-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center mb-4 shadow-sm">
                <IoMdAdd className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Add New Department</h3>
              <p className="text-gray-600 text-sm">Create a new department</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr className="text-left text-gray-700 font-semibold text-sm">
                    <th className="py-4 pl-6 pr-4">Department</th>
                    <th className="py-4 px-4">Manager</th>
                    <th className="py-4 px-4">Created</th>
                    <th className="py-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.map((d) => (
                    <tr key={d.actualId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
                            style={{ backgroundColor: d.color }}
                          >
                            {d.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{d.name}</div>
                            <div className="text-xs text-gray-500">ID: {d.displayId}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-sm text-gray-700">{d.managerName}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-600">{d.createdAt}</div>
                      </td>

                      <td className="py-4 pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(d)}
                            className="p-2.5 rounded-xl hover:bg-blue-50 text-gray-500 hover:text-blue-600 hover:shadow-md transition-all duration-200"
                            title="Edit Department"
                          >
                            <IoPencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(d.actualId)}
                            className="p-2.5 rounded-xl hover:bg-red-50 text-gray-500 hover:text-red-600 hover:shadow-md transition-all duration-200"
                            title="Delete Department"
                          >
                            <IoTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div 
              onClick={handleCreate}
              className="border-t border-gray-100 p-6 text-center hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <IoMdAdd className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900">Add New Department</h3>
                  <p className="text-sm text-gray-500">Click to add a new department</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DepartmentsModal
          show={showModal}
          onClose={() => setShowModal(false)}
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          editing={!!editDept}
          managers={managers}
        />
      </div>
    </div>
  );
};

export default Departments;
