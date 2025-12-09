import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, selectUsers } from '../../redux/slices/userSlice';

const emptyClient = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  state: "",
  district: "",
  pincode: "",
  ref: "",
  status: "",
  created_at: "",
  manager_public_id: "",
  manager_name: "",
  documents: [],
};

const normalizeClient = (c) => {
  if (!c) return { ...emptyClient };
  return {
    // map common client fields
    ref: c.ref || c.reference || "",
    name: c.name || c.fullName || "",
    email: c.email || "",
    phone: c.phone || c.mobile || "",
    company: c.company || c.org || "",
    // tolerate multiple possible keys for address/state/district/pincode
    address: c.address || c.addr || c.address_line1 || c.client_address || "",
    state: c.state || c.region || c.state_name || "",
    district: c.district || c.city || c.county || "",
    pincode: c.pincode || c.postal_code || c.zip || c.zipcode || "",
    status: c.status || "",
    created_at: c.created_at || c.createdAt || "",
    manager_public_id: c.manager_public_id || c.manager_publicId || c.managerId || c.manager_id || "",
    manager_name: c.manager_name || c.managerName || (c.manager && (c.manager.name || c.manager.fullName)) || "",
    documents: Array.isArray(c.documents) ? c.documents : (Array.isArray(c.docs) ? c.docs : []),
    id: c.id || c._id || c.public_id || null,
  };
};

const UpdateClient = ({ open, setOpen, client, onUpdate }) => {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers) || [];

  const [clientData, setClientData] = useState(() => normalizeClient(client));

  useEffect(() => {
    // fetch only manager users for manager dropdown (match Departments.jsx pattern)
    if (!users || users.length === 0) dispatch(fetchUsers({ role: 'Manager' }));
  }, [dispatch]);

  // When users load, if clientData has a manager_public_id but no manager_name,
  // try to find the user and set the manager_name so the dropdown shows correctly.
  useEffect(() => {
    if (!users || users.length === 0) return;
    const mpid = clientData?.manager_public_id;
    if (!mpid) return;
    const found = users.find(u => (u.public_id || u._id || u.id) == mpid || (u.email && u.email === clientData.manager_name));
    if (found && (!clientData.manager_name || clientData.manager_name === '')) {
      setClientData(prev => ({ ...prev, manager_name: found.name || found.firstName || found.fullName || '' }));
    }
  }, [users, clientData?.manager_public_id]);

  useEffect(() => {
    if (open) setClientData(normalizeClient(client));
  }, [client, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClientData((prev) => ({ ...prev, [name]: value }));
  };

  const isManager = (u) => {
    if (!u) return false;
    const role = (u.role || u.title || u.designation || u.user_role || "").toString().toLowerCase();
    if (role.includes('manager') || role.includes('lead') || role.includes('admin')) return true;
    return false;
  };

  const managerOptions = (users || []).filter(isManager);

  const handleManagerChange = (e) => {
    const val = e.target.value;
    // find user by public id or id
    const found = managerOptions.find(u => (u.public_id || u._id || u.id) == val);
    if (found) {
      setClientData(prev => ({ ...prev, manager_public_id: (found.public_id || found._id || found.id), manager_name: found.name || found.firstName || found.fullName || '' }));
    } else {
      // allow clearing selection
      setClientData(prev => ({ ...prev, manager_public_id: '', manager_name: '' }));
    }
  };

  const handleSubmit = () => {
    if (onUpdate) onUpdate(clientData);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-md w-full max-w-xl">
        <h2 className="text-xl mb-4">Update Client</h2>

        <div className="grid grid-cols-1 gap-3">
          <input
            name="name"
            value={clientData.name || ""}
            onChange={handleChange}
            placeholder="Client Name"
            className="border p-2 mb-2 w-full"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              name="email"
              value={clientData.email || ""}
              onChange={handleChange}
              placeholder="Client Email"
              className="border p-2 mb-2 w-full"
            />
            <input
              name="phone"
              value={clientData.phone || ""}
              onChange={handleChange}
              placeholder="Client Phone"
              className="border p-2 mb-2 w-full"
            />
          </div>

          <input
            name="company"
            value={clientData.company || ""}
            onChange={handleChange}
            placeholder="Client Company"
            className="border p-2 mb-2 w-full"
          />

          {/* Top row: ref (read-only), status, created_at */}
          <div className="grid grid-cols-3 gap-3">
            <input
              name="ref"
              value={clientData.ref || ""}
              readOnly
              placeholder="Ref"
              className="border p-2 mb-2 w-full bg-gray-100"
            />
            <input
              name="status"
              value={clientData.status || ""}
              onChange={handleChange}
              placeholder="Status"
              className="border p-2 mb-2 w-full"
            />
            <input
              name="created_at"
              value={clientData.created_at || ""}
              readOnly
              placeholder="Created At"
              className="border p-2 mb-2 w-full bg-gray-100"
            />
          </div>

          {/* Address block */}
          <textarea
            name="address"
            value={clientData.address || ""}
            onChange={handleChange}
            placeholder="Address"
            className="border p-2 mb-2 w-full"
          />

          <div className="grid grid-cols-3 gap-3">
            <input
              name="state"
              value={clientData.state || ""}
              onChange={handleChange}
              placeholder="State"
              className="border p-2 mb-2 w-full"
            />
            <input
              name="district"
              value={clientData.district || ""}
              onChange={handleChange}
              placeholder="District"
              className="border p-2 mb-2 w-full"
            />
            <input
              name="pincode"
              value={clientData.pincode || ""}
              onChange={handleChange}
              placeholder="Pincode"
              className="border p-2 mb-2 w-full"
            />
          </div>

          {/* Manager dropdown (show currently assigned manager) */}
          <div className="grid grid-cols-1 gap-2">
            <label className="text-sm">Assigned Manager</label>
            <select
              name="manager_public_id"
              value={clientData.manager_public_id || ""}
              onChange={handleManagerChange}
              className="border p-2 mb-2 w-full"
            >
              <option value="">-- No manager --</option>
              {/* If current assigned manager is not in managerOptions, show it first */}
              {clientData.manager_public_id && !managerOptions.find(m => (m.public_id || m._id || m.id) == clientData.manager_public_id) && (
                <option value={clientData.manager_public_id}>{clientData.manager_name || clientData.manager_public_id}</option>
              )}
              {managerOptions.map((m) => (
                <option key={m.public_id || m._id || m.id} value={m.public_id || m._id || m.id}>
                  {`${m.name || m.firstName || m.fullName || ''}${m.email ? ` (${m.email})` : ''}`}
                </option>
              ))}
            </select>
          </div>

          {/* Documents (read-only list, editable if needed) */}
          <div>
            <label className="block text-sm font-medium mb-1">Documents</label>
            <ul className="list-disc pl-5 max-h-32 overflow-auto border p-2">
              {(clientData.documents || []).length === 0 && <li className="text-sm text-gray-500">No documents</li>}
              {(clientData.documents || []).map((doc, idx) => (
                <li key={idx} className="text-sm">
                  {doc.file_name || doc.fileName || doc.name || doc.file_url || doc.fileUrl}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded-md">
            Update Client
          </button>
          <button onClick={() => setOpen(false)} className="ml-2 bg-gray-300 px-4 py-2 rounded-md">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateClient;
