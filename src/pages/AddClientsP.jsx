import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { createClient, fetchClients, attachDocument } from '../redux/slices/clientSlice';
import { fetchUsers, selectUsers } from '../redux/slices/userSlice';

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli",
  "Daman and Diu", "Lakshadweep", "Delhi", "Puducherry", "Ladakh",
  "Jammu & Kashmir"
];

const AddClientsPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [submitError, setSubmitError] = useState(null);
  const dispatch = useDispatch();
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [files, setFiles] = useState([]);

  // load users so we can filter managers
  const users = useSelector(selectUsers) || [];
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const isManager = (u) => {
    if (!u) return false;
    const role = (u.role || u.designation || u.title || u.roleName || '').toString().toLowerCase();
    if (role.includes('manager')) return true;
    // also support roles array or permissions
    if (Array.isArray(u.roles) && u.roles.some(r => (r || '').toString().toLowerCase().includes('manager'))) return true;
    // fallback: try role id/name fields
    if ((u.roleId || u.role_id || u.roleName) && ('' + (u.roleId || u.role_id || u.roleName)).toLowerCase().includes('manager')) return true;
    return false;
  };

  const managers = Array.isArray(users) ? users.filter(isManager) : [];

  const onSubmit = async (data) => {
    try {
      const formatError = (err) => {
        if (!err) return null;
        if (typeof err === 'string') return err;
        if (err.message) return err.message;
        if (err.error) return err.error;
        if (err.data) {
          if (typeof err.data === 'string') return err.data;
          if (err.data.message) return err.data.message;
          if (err.data.error) return err.data.error;
        }
        try { return JSON.stringify(err); } catch (e) { return String(err); }
      };
      // Dispatch createClient thunk which updates the Redux store
      // ensure managerId is present if selected
      const payloadToSend = { ...data };
      if (data.managerId) payloadToSend.managerId = data.managerId;
      const result = await dispatch(createClient(payloadToSend));
      if (createClient.fulfilled.match(result)) {
        // Defensive: some backends return { success: false, error: '...' } but the thunk
        // may still resolve. Treat that as a rejection and show the server error.
        const payload = result.payload;
        if (payload && (payload.success === false || payload.error)) {
          const errMsg = payload.error || payload.message || (payload.data && payload.data.error) || 'Failed to create client';
          setSubmitError(errMsg);
          return;
        }

        // creation succeeded, show success message and refresh list
        const created = payload?.data || payload;
        setSubmitSuccess(`Client "${created?.name || created?.company || 'Created'}" added successfully.`);
        // refresh clients list in store so clients page shows latest
        dispatch(fetchClients());
        // attach any uploaded documents
        try {
          const clientId = created?.id || created?._id || created?.public_id;
          if (clientId && files && files.length) {
            for (const f of files) {
              const form = new FormData();
              // backend may expect 'file' or 'document' key; we'll send the file blob
              form.append('file', f, f.name);
              // include commonly-required metadata keys some backends expect
              form.append('file_name', f.name);
              // Do not append a blank file_url — backend requires real values; send actual file and name only
              // include uploader info when available
              try {
                const userJson = localStorage.getItem('userInfo') || localStorage.getItem('user');
                if (userJson) {
                  const u = JSON.parse(userJson);
                  if (u && (u.id || u._id || u.public_id)) form.append('uploaded_by', u.id || u._id || u.public_id);
                }
              } catch (e) {
                // ignore
              }

              // Append tenantId explicitly to FormData to help backends that don't read headers when multipart is used
              const tenantId = localStorage.getItem('tenantId') || '';
              if (tenantId) form.append('tenantId', tenantId);

              // log tenant/token state for easier debugging of server errors
              // eslint-disable-next-line no-console
              console.debug('upload: tenantId=', tenantId, 'accessToken=', !!localStorage.getItem('tm_access_token') || !!localStorage.getItem('accessToken'));

              // dispatch attachDocument thunk and check result so we surface server errors (e.g., missing tenant / invalid token)
              // eslint-disable-next-line no-await-in-loop
              const attachResult = await dispatch(attachDocument({ clientId, document: form }));
              if (attachDocument.fulfilled.match(attachResult)) {
                // success - continue
              } else {
                // surface the backend error and stop further processing
                const errMsg = formatError(attachResult.payload) || attachResult.error?.message || 'Failed to upload document';
                setSubmitError(errMsg);
                return;
              }
            }
          }
        } catch (err) {
          // surface as an error to the UI instead of silently continuing
          console.warn('Failed to attach documents:', err);
          setSubmitError(err?.message || 'Failed to attach documents');
          return;
        }
        navigate('/admin/clients', { state: { created: true, message: `Client "${created?.name || created?.company || 'Created'}" added successfully.` } });
      } else {
        // show error message returned from thunk (rejectWithValue or thrown errors)
        const err = formatError(result.payload) || result.error?.message || 'Failed to create client';
        setSubmitError(err);
      }
    } catch (error) {
      // handle unexpected errors
      console.error('Create client error:', error);
      setSubmitError(error?.message || 'Unexpected error. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate("/admin/clients");
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Add New Client</h2>
          
          {submitError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              {submitError}
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* <div>
                  <label className="block text-sm font-medium mb-1">Reference</label>
                  <input
                    {...register("ref", { required: "Reference is required" })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Reference"
                  />
                  {errors.ref && <p className="text-red-500 text-sm mt-1">{errors.ref.message}</p>}
                </div> */}

                <div>
                  <label className="block text-sm font-medium mb-1">Client Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-3 text-gray-400" />
                    <input
                      {...register("name", { required: "Name is required" })}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Client Name"
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-3 text-gray-400" />
                    <input
                      {...register("email", { 
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address"
                        }
                      })}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Email"
                      type="email"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-3 text-gray-400" />
                    <input
                      {...register("phone", { 
                        required: "Phone is required",
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: "Phone number must be 10 digits"
                        }
                      })}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Phone"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Company</label>
                  <input
                    {...register("company")}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Company"
                  />
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Street Address</label>
                  <textarea
                    {...register("address")}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Street Address"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">District</label>
                  <input
                    {...register("district")}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="District"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <select
                    {...register("state")}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select State</option>
                    {indianStates.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Pincode</label>
                  <input
                    {...register("pincode", {
                      pattern: {
                        value: /^[0-9]{6}$/,
                        message: "Pincode must be 6 digits"
                      }
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Pincode"
                  />
                  {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode.message}</p>}
                </div>
              </div>
            </div>

            {/* More Details Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">GST/Tax ID</label>
                  <input
                    {...register("taxId")}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="GST or Tax ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Industry</label>
                  <input
                    {...register("industry")}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Technology, Finance"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    {...register("notes")}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any additional notes about the client"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    {...register("status")}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {/* Manager Assignment & Documents */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Assignment & Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Assign Manager</label>
                  <select
                    {...register('managerId')}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Select Manager (optional) --</option>
                    {managers.length === 0 ? (
                      <option value="">No managers available</option>
                    ) : (
                      managers.map((m) => (
                        <option key={m.public_id || m._id || m.id} value={m.public_id || m._id || m.id}>
                          {m.name || m.firstName || m.email}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Attach Documents</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Accepted: PDF, DOCX, images. Max size enforced by backend.</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Submit
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddClientsPage;