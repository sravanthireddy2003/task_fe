import React, { useEffect, useState, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog, Transition } from '@headlessui/react';
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
import * as Icons from '../icons';
import Button from '../components/Button';
import ViewToggle from "../components/ViewToggle";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import clsx from 'clsx';

/* ─── Redesigned Department Modal ─── */
function DepartmentsModal({ show, onClose, form, setForm, onSubmit, editing, managers = [], departments = [], editDept = null }) {
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  // Reset errors when modal opens/closes
  useEffect(() => {
    setErrors({});
    setSubmitError(null);
  }, [show]);

  const validate = () => {
    const newErrors = {};
    const nameStr = form.name?.trim() || '';

    if (!nameStr) {
      newErrors.name = 'Department name is required';
    } else if (nameStr.length < 2) {
      newErrors.name = 'Must be at least 2 characters';
    } else if (nameStr.length > 50) {
      newErrors.name = 'Must be 50 characters or less';
    } else if (!/^[a-zA-Z\s\-&]+$/.test(nameStr)) {
      newErrors.name = 'Only letters, spaces, hyphens (-) and ampersand (&) allowed';
    } else {
      const currentId = editDept?.actualId || editDept?.id || editDept?._id;
      const isDuplicate = departments.some(d =>
        d.name?.toLowerCase() === nameStr.toLowerCase() &&
        (d.actualId || d.id || d._id) !== currentId
      );
      if (isDuplicate) newErrors.name = 'This department already exists!';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!validate()) return;

    setSubmitError(null);
    try {
      await onSubmit(e);
    } catch (err) {
      const msg = typeof err === 'string' ? err : (err?.message || 'Operation failed');
      setSubmitError(msg);
    }
  };

  const inputClass = (field) => clsx(
    "w-full px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-4 bg-white",
    errors[field]
      ? "border-red-300 bg-red-50/50 text-red-900 focus:border-red-500 focus:ring-red-500/20 placeholder-red-300"
      : "border-gray-200 text-gray-900 focus:border-blue-600 focus:ring-blue-600/20 hover:border-gray-300"
  );

  return (
    <Transition.Root show={!!show} as={Fragment}>
      <Dialog as="div" className="relative z-[90]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-lg">
                <form onSubmit={handleFormSubmit}>
                  {/* Header */}
                  <div className="px-8 pt-8 pb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                          <Icons.Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <Dialog.Title as="h2" className="text-page-title text-gray-900">
                            {editing ? 'Edit Department' : 'Add Department'}
                          </Dialog.Title>
                          <p className="text-small-text text-gray-500 mt-0.5">
                            {editing ? 'Update department details below' : 'Fill in the details to create a new department'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
                      >
                        <Icons.X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Errors Banner */}
                  {submitError && (
                    <div className="mx-8 mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                      <div className="flex items-center gap-2">
                        <Icons.AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <p className="text-sm font-semibold text-red-800">{submitError}</p>
                      </div>
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="px-8 pb-2 space-y-6">
                    {/* Department Name */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Department Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={form.name}
                        onChange={(e) => {
                          setForm({ ...form, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: '' });
                        }}
                        className={inputClass('name')}
                        placeholder="e.g. Engineering, Human Resources"
                        maxLength={50}
                        autoFocus
                      />
                      {errors.name && (
                        <p className="text-red-600 text-[13px] mt-1.5 font-semibold flex items-center gap-1.5">
                          <Icons.AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          {errors.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1.5">{(form.name || '').length}/50 characters</p>
                    </div>

                    {/* Manager */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Manager <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <select
                          value={form.managerId || ''}
                          onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                          className={clsx(inputClass(''), "input !w-auto appearance-none pr-10")}
                        >
                          <option value="">-- No manager assigned --</option>
                          {managers.map((m) => (
                            <option key={m.public_id || m._id || m.id} value={m.public_id || m._id || m.id}>
                              {m.name} {m.role ? `(${m.role})` : ''}
                            </option>
                          ))}
                        </select>
                        <Icons.ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Head Department ID */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Head Department ID <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        value={form.headId}
                        onChange={(e) => setForm({ ...form, headId: e.target.value })}
                        className={inputClass('')}
                        placeholder="Enter parent department ID if applicable"
                      />
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="px-8 py-6 mt-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-3 text-sm rounded-xl font-bold text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                    >
                      {editing ? 'Update Department' : 'Create Department'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

const Departments = () => {
  const dispatch = useDispatch();
  const departments = useSelector(selectDepartments);
  const status = useSelector(selectDepartmentStatus);
  const error = useSelector(selectDepartmentError);
  const allUsers = useSelector(selectUsers) || [];

  const managers = React.useMemo(() =>
    allUsers.filter((u) => (u?.role || '').toLowerCase() === 'manager'),
    [allUsers]
  );

  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [form, setForm] = useState({ name: '', managerId: '', headId: '' });
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Track whether initial fetch has succeeded at least once
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    dispatch(fetchDepartments()).then((res) => {
      if (fetchDepartments.fulfilled.match(res)) setInitialLoaded(true);
    });
    dispatch(fetchUsers());
  }, [dispatch]);

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

    const rawDate = dept.createdAt || dept.created_at;
    const formattedDate = rawDate
      ? new Date(rawDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
      : 'N/A';

    return {
      ...dept,
      displayId: index + 1,
      actualId: dept.public_id || dept._id || dept.id,
      managerName,
      createdAt: formattedDate,
      name: dept.name || 'Unnamed Department',
      color: ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]
    };
  });

  const filteredDepartments = processedDepartments.filter((dept) =>
    dept.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.managerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      if (editDept) {
        await dispatch(updateDepartment({
          departmentId: editDept.actualId,
          data: form
        })).unwrap();
        toast.success('✅ Department updated');
      } else {
        await dispatch(createDepartment(form)).unwrap();
        toast.success('✅ Department created');
        setForm({ name: '', managerId: '', headId: '' });
      }
      setShowModal(false);
      // Re-fetch to refresh the list without triggering page-level error
      dispatch(fetchDepartments());
    } catch (err) {
      // Re-throw so the modal catches and displays it inline
      const msg = typeof err === 'string' ? err : (err?.message || '❌ Operation failed');
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await dispatch(deleteDepartment(id)).unwrap();
      toast.success('Department deleted successfully');
      dispatch(fetchDepartments());
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
    setForm({
      name: d.name || '',
      managerId: d.managerId || d.manager_id || '',
      headId: d.headId || ''
    });
    setShowModal(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await dispatch(fetchDepartments());
      if (fetchDepartments.fulfilled.match(res)) setInitialLoaded(true);
      dispatch(fetchUsers());
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Loading state – only show on initial load, not on create/update/delete
  if (status === 'loading' && !initialLoaded && !isRefreshing) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="animate-spin h-12 w-12 border-4 border-orange-200 border-t-blue-600 rounded-full"></div>
      </div>
    );
  }

  // Error state – only show if the INITIAL fetch never succeeded
  if (status === 'failed' && !initialLoaded) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icons.AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-section-title text-red-800 mb-2">Failed to load departments</h3>
          <p className="text-red-600 mb-6">{error || 'An error occurred'}</p>
          <button
            onClick={handleRefresh}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <Icons.RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Department Management"
          subtitle="Organize and manage your company departments"
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
        >
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500 mr-2">Managers found: {managers.length}</p>
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <button
              onClick={handleCreate}
              className="btn btn-primary flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
            >
              <Icons.Plus className="w-4 h-4" />
              Add Department
            </button>
          </div>
        </PageHeader>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Total Departments</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{processedDepartments.length}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 text-blue-600 rounded-lg flex items-center justify-center">
                <Icons.Building2 className="w-5 h-5" />
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
                <Icons.User2 className="w-5 h-5" />
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
                <Icons.Filter className="w-5 h-5" />
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
                <Icons.User2 className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search departments by name or manager..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 text-sm"
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
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        {filteredDepartments.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <Icons.Building2 className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-section-title text-gray-900 mb-3">No departments found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-small-text">
              {searchQuery
                ? "No departments match your search. Try different keywords."
                : "Your department list is empty. Create your first department to get started."}
            </p>
            <button
              onClick={handleCreate}
              className="btn btn-primary shadow-lg shadow-blue-500/25"
            >
              Create First Department
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepartments.map((d) => (
              <Card key={d.actualId}>
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
                  <span
                    className={clsx(
                      "px-3 py-1 rounded-full text-xs font-semibold",
                      d.managerName === 'Unassigned'
                        ? "bg-gray-100 text-gray-800"
                        : "bg-emerald-100 text-emerald-800"
                    )}
                  >
                    {d.managerName === 'Unassigned' ? 'No Manager' : 'Has Manager'}
                  </span>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Icons.User2 className="w-4 h-4 text-gray-400" />
                    <span>Manager: {d.managerName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">Created: {d.createdAt}</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(d)}
                      className="p-2 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 hover:shadow-md transition-all duration-200"
                      title="Edit Department"
                    >
                      <Icons.Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(d.actualId)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 hover:shadow-md transition-all duration-200"
                      title="Delete Department"
                    >
                      <Icons.Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}

            <div
              onClick={handleCreate}
              className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-600 hover:bg-orange-50 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[280px]"
            >
              <div className="w-12 h-12 rounded-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center mb-4 shadow-sm">
                <Icons.Plus className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-card-title mb-2">Add New Department</h3>
              <p className="text-gray-600 text-sm">Create a new department</p>
            </div>
          </div>
        ) : (
          <div className="tm-list-container">
            <div className="overflow-x-auto">
              <table className="tm-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Manager</th>
                    <th>Created</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.map((d) => (
                    <tr
                      key={d.actualId}
                      className="cursor-pointer"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
                            style={{ backgroundColor: d.color }}
                          >
                            {d.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{d.name}</div>
                            <div className="text-xs text-gray-500">ID: {d.displayId}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-[14px] text-gray-700">{d.managerName}</span>
                        </div>
                      </td>

                      <td>
                        <div className="text-[14px] text-gray-600">{d.createdAt}</div>
                      </td>

                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(d)}
                            className="p-2.5 rounded-xl hover:bg-blue-50 text-gray-500 hover:text-blue-600 hover:shadow-md transition-all duration-200 icon-center"
                            title="Edit Department"
                          >
                            <Icons.Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(d.actualId)}
                            className="p-2.5 rounded-xl hover:bg-red-50 text-gray-500 hover:text-red-600 hover:shadow-md transition-all duration-200 icon-center"
                            title="Delete Department"
                          >
                            <Icons.Trash2 className="w-4 h-4" />
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
                  <Icons.Plus className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-card-title">Add New Department</h3>
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
          departments={departments}
          editDept={editDept}
        />
      </div>
    </div>
  );
};

export default Departments;
