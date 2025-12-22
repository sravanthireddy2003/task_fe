

import React, { useEffect, useState } from 'react';
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
import { Plus, Edit2, Trash2, Grid, List, TreeDeciduous } from 'lucide-react';

function DepartmentsModal({ show, onClose, form, setForm, onSubmit, editing, managers = [] }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0" onClick={onClose}></div>
      <form onSubmit={onSubmit} className="relative bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto z-10 shadow-lg">
        <h2 className="text-gray-900 text-lg font-semibold mb-4">{editing ? 'Edit Department' : 'Add Department'}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Manager (optional)</label>
            <select
              value={form.managerId || ''}
              onChange={(e) => setForm({ ...form, managerId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
            <label className="block text-gray-700 mb-1">Head Public ID (optional)</label>
            <input
              value={form.headId}
              onChange={(e) => setForm({ ...form, headId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6 justify-end">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editing ? 'Update' : 'Create'}</button>
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
  const managers = allUsers.filter((u) => (u?.role || '').toLowerCase() === 'manager');

  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [form, setForm] = useState({ name: '', managerId: '', headId: '' });
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchUsers());
  }, [dispatch]);

  const processedDepartments = departments.map((dept, index) => {
    // Normalize possible manager id fields from backend
    const mgrId = dept.manager_id || dept.managerId || dept.manager || dept.managerId;

    // Try to find matching user by multiple id fields
    let managerDetails = null;
    if (mgrId) {
      managerDetails = allUsers.find((u) =>
        u.public_id === mgrId || u._id === mgrId || u.id === mgrId ||
        // also allow match by email or name fallback (unlikely but safe)
        u.email === mgrId || u.name === mgrId
      );
    }

    // Determine manager display name and normalized managerId for forms
    const managerName = managerDetails?.name || dept.manager_name || dept.managerName || dept.manager || '-';
    const managerId = managerDetails?.public_id || managerDetails?._id || managerDetails?.id || mgrId || '';

    const headRef = dept.headId || dept.head_id || dept.parentDepartmentId || dept.parentId || '';
    return {
      ...dept,
      displayId: index + 1,
      actualId: dept.public_id || dept._id || dept.id,
      headRef,
      managerName,
      managerId,
      createdAt: dept.createdAt || dept.created_at || 'N/A',
      name: dept.name || 'Unnamed Department',
      color: ['#6366F1', '#10B981', '#F59E0B'][index % 3]
    };
  });

  const departmentMap = processedDepartments.reduce((acc, dept) => {
    if (!dept.actualId) return acc;
    acc[dept.actualId] = { ...dept, children: [] };
    return acc;
  }, {});

  processedDepartments.forEach((dept) => {
    if (!dept.actualId) return;
    const parentId = dept.headRef && departmentMap[dept.headRef] ? dept.headRef : null;
    if (parentId) {
      departmentMap[parentId].children.push(departmentMap[dept.actualId]);
    }
  });

  const rootDepartments = Object.values(departmentMap).filter((dept) => {
    return !dept.headRef || !departmentMap[dept.headRef];
  });

  const renderNode = (node, depth = 0) => (
    <div key={node.actualId} className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        {depth > 0 && <div className="h-px w-10 bg-gray-300" aria-hidden />}
        <div className="flex items-center justify-center rounded-full border border-gray-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 shadow-sm">
          {node.name}
        </div>
        {depth > 0 && <div className="h-px flex-1 bg-gray-300" aria-hidden />}
      </div>
      <p className="text-[11px] text-gray-500">Manager: {node.managerName}</p>
      <p className="text-[10px] text-gray-400">Created: {node.createdAt}</p>
      {node.children.length > 0 && (
        <div className="flex w-full items-start justify-center gap-6 pt-3">
          {node.children.map((child) => (
            <div key={child.actualId} className="flex flex-col items-center gap-2">
              <div className="h-6 w-px bg-gray-300" aria-hidden />
              <div className="w-px flex-1 bg-gray-300" aria-hidden />
              {renderNode(child, depth + 1)}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (status === 'loading') return <div className="p-4">Loading departments...</div>;
  if (status === 'failed') return <div className="p-4 text-red-600">Error: {error}</div>;

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      const resp = await dispatch(deleteDepartment(id)).unwrap();
      toast.success(resp?.message || 'Department deleted');
      // Refetch departments immediately after delete
      await dispatch(fetchDepartments()).unwrap();
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
    try {
      if (editDept) {
        const departmentId = editDept.actualId;
        await dispatch(updateDepartment({ departmentId, data: form })).unwrap();
        toast.success('Department updated');
        // Refetch departments immediately after update
        await dispatch(fetchDepartments()).unwrap();
        setShowModal(false);
        return;
      }

      await dispatch(createDepartment(form)).unwrap();
      // Refetch departments immediately after create
      await dispatch(fetchDepartments()).unwrap();
      toast.success('Department created');
      setForm({ name: '', managerId: '', headId: '' });
      setShowModal(false);
    } catch (err) {
      toast.error(err?.message || 'Save failed');
    }
  };

  return (
    <div className="p-6">
      {/* Header + View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Departments</h2>
          <p className="text-gray-600">Manage and track all departments</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setViewMode('card')} className={`p-2 rounded-lg ${viewMode === 'card' ? 'bg-blue-100' : 'bg-gray-100'}`} title="Card View">
            <Grid className="w-5 h-5" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100' : 'bg-gray-100'}`} title="List View">
            <List className="w-5 h-5" />
          </button>
          <button onClick={() => setViewMode('hierarchy')} className={`p-2 rounded-lg ${viewMode === 'hierarchy' ? 'bg-blue-100' : 'bg-gray-100'}`} title="Hierarchy View">
            <TreeDeciduous className="w-5 h-5" />
          </button>
          <button onClick={handleCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus className="w-5 h-5" /> Add Department
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
          <span className="uppercase tracking-wide">Hierarchy</span>
          <button
            type="button"
            onClick={() => setViewMode('hierarchy')}
            className="rounded-full border border-blue-200 px-3 py-0.5 text-blue-600 hover:bg-blue-50"
          >
            View structure
          </button>
          <span className="text-gray-400">(Head ID defines parent dept)</span>
        </div>
      </div>

      {/* Display */}
      {processedDepartments.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No departments found. Create your first department.</div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedDepartments.map((d) => (
            <div key={d.actualId} className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between mb-4">
                <div>
                  <h3 className="text-gray-900 text-lg font-semibold mb-1">{d.name}</h3>
                  <span className="inline-block px-3 py-1 rounded-full text-white" style={{ backgroundColor: d.color }}>
                    Manager: {d.managerName}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(d)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(d.actualId)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-gray-500 text-sm">Created At: {d.createdAt}</div>
            </div>
          ))}
        </div>
      ) : viewMode === 'hierarchy' ? (
        rootDepartments.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-6">No hierarchy data available.</div>
        ) : (
          <div className="flex flex-col items-center gap-8">
            {rootDepartments.map((dept) => renderNode(dept))}
          </div>
        )
      ) : (
        <div className="overflow-auto rounded-md border">
          <table className="min-w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Manager</th>
                <th className="px-4 py-2 font-medium">Created At</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedDepartments.map((d) => (
                <tr key={d.actualId} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{d.displayId}</td>
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3">{d.managerName}</td>
                  <td className="px-4 py-3">{d.createdAt}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(d)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(d.actualId)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
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
  );
};

export default Departments;