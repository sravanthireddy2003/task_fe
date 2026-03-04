import React, { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import * as Icons from "../../icons";
import { useDispatch, useSelector } from "react-redux";
import {
  createClient,
  updateClient,
  fetchClients,
  attachDocument,
  selectClients,
} from "../../redux/slices/clientSlice";
import { fetchUsers, selectUsers } from "../../redux/slices/userSlice";

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli",
  "Daman and Diu", "Lakshadweep", "Delhi", "Puducherry", "Ladakh", "Jammu & Kashmir",
];

const ClientForm = ({
  open = false,
  setOpen = null,
  client = null,
  onSuccess = null,
  isModal = false,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const clients = useSelector(selectClients) || [];
  const users = useSelector(selectUsers) || [];

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", company: "",
    address: "", district: "", state: "", pincode: "",
    taxId: "", industry: "", notes: "", status: "Active", managerId: ""
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!client;

  useEffect(() => {
    if (open) {
      if (!users || users.length === 0) dispatch(fetchUsers());
    }
  }, [dispatch, open, users?.length]);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        company: client.company || "",
        address: client.address || "",
        district: client.district || "",
        state: client.state || "",
        pincode: client.pincode || "",
        taxId: client.taxId || "",
        industry: client.industry || "",
        notes: client.notes || "",
        status: client.status || "Active",
        managerId: client.manager_public_id || client.managerId || ""
      });
    } else {
      setFormData({
        name: "", email: "", phone: "", company: "",
        address: "", district: "", state: "", pincode: "",
        taxId: "", industry: "", notes: "", status: "Active", managerId: ""
      });
      setErrors({});
    }
    setSubmitError(null);
    setSubmitSuccess(null);
  }, [client, open]);

  const isManager = (u) => {
    if (!u) return false;
    const role = (u.role || u.designation || u.title || u.roleName || "").toString().toLowerCase();
    if (role.includes("manager")) return true;
    if (Array.isArray(u.roles) && u.roles.some((r) => (r || "").toString().toLowerCase().includes("manager"))) return true;
    if ((u.roleId || u.role_id || u.roleName) && ("" + (u.roleId || u.role_id || u.roleName)).toLowerCase().includes("manager")) return true;
    return false;
  };

  const managers = Array.isArray(users) ? users.filter(isManager) : [];

  const validate = () => {
    const newErrors = {};
    const nameStr = formData.name?.trim() || "";
    if (!nameStr) newErrors.name = "Client name is required";

    const emailStr = formData.email?.trim() || "";
    if (!emailStr) {
      newErrors.email = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(emailStr)) {
      newErrors.email = "Invalid email format";
    }

    const phoneStr = formData.phone?.trim() || "";
    if (!phoneStr) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(phoneStr)) {
      newErrors.phone = "Phone must be exactly 10 digits";
    } else if (!/^[6-9]\d{9}$/.test(phoneStr)) {
      newErrors.phone = "Valid Indian phone must start with 6-9";
    }

    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be exactly 6 digits";
    }

    // Duplicate Validation
    const currentId = client?.id || client?._id || client?.public_id;

    if (emailStr && !newErrors.email) {
      const isDuplicateEmail = clients.some(c =>
        c.email?.toLowerCase() === emailStr.toLowerCase() &&
        (c.id || c._id || c.public_id) !== currentId
      );
      if (isDuplicateEmail) newErrors.email = "This email is already registered to another client!";
    }

    if (phoneStr && !newErrors.phone) {
      const isDuplicatePhone = clients.some(c =>
        c.phone?.trim() === phoneStr &&
        (c.id || c._id || c.public_id) !== currentId
      );
      if (isDuplicatePhone) newErrors.phone = "This phone number is already registered!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'phone') {
      finalValue = finalValue.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'pincode') {
      finalValue = finalValue.replace(/\D/g, '').slice(0, 6);
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const formatError = (err) => {
    if (!err) return null;
    if (typeof err === "string") return err;
    if (err.message) return err.message;
    if (err.error) return err.error;
    if (err.data) {
      if (typeof err.data === "string") return err.data;
      if (err.data.message) return err.data.message;
      if (err.data.error) return err.data.error;
    }
    try {
      return JSON.stringify(err);
    } catch (e) {
      return String(err);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);

      let result;
      if (isEditMode) {
        result = await dispatch(updateClient({ clientId: client.id, clientData: formData }));
      } else {
        result = await dispatch(createClient(formData));
      }

      if (isEditMode ? updateClient.fulfilled.match(result) : createClient.fulfilled.match(result)) {
        const payload = result.payload;
        if (payload && (payload.success === false || payload.error)) {
          setSubmitError(payload.error || payload.message || "Operation failed");
          setIsSubmitting(false);
          return;
        }

        const updated = payload?.data || payload;
        const successMsg = `Client "${updated?.name || updated?.company || "Updated"}" ${isEditMode ? "updated" : "added"} successfully.`;
        setSubmitSuccess(successMsg);
        dispatch(fetchClients());

        if (!isEditMode && files.length > 0) {
          try {
            const clientId = updated?.id || updated?._id || updated?.public_id;
            if (clientId) {
              for (const f of files) {
                const form = new FormData();
                form.append("file", f, f.name);
                form.append("file_name", f.name);
                const userJson = localStorage.getItem("userInfo") || localStorage.getItem("user");
                if (userJson) {
                  const u = JSON.parse(userJson);
                  if (u && (u.id || u._id || u.public_id)) form.append("uploaded_by", u.id || u._id || u.public_id);
                }
                const tenantId = localStorage.getItem("tenantId") || "";
                if (tenantId) form.append("tenantId", tenantId);

                const attachResult = await dispatch(attachDocument({ clientId, document: form }));
                if (!attachDocument.fulfilled.match(attachResult)) {
                  setSubmitError(formatError(attachResult.payload) || attachResult.error?.message || "Failed to upload document");
                  setIsSubmitting(false);
                  return;
                }
              }
            }
          } catch (err) {
            setSubmitError(err?.message || "Failed to attach documents");
            setIsSubmitting(false);
            return;
          }
        }

        setTimeout(() => {
          if (isModal) {
            setOpen?.(false);
            onSuccess?.();
          } else {
            navigate("/admin/clients", { state: { created: true, message: successMsg } });
          }
          setIsSubmitting(false);
        }, 800);
      } else {
        setSubmitError(formatError(result.payload) || result.error?.message || "Operation failed");
        setIsSubmitting(false);
      }
    } catch (error) {
      setSubmitError(error?.message || "Unexpected error. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isModal && setOpen) {
      setOpen(false);
    } else {
      navigate("/admin/clients");
    }
  };

  const inputClass = (fieldName) => `
    w-full px-4 py-3 border-2 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-4
    ${errors[fieldName]
      ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/20 placeholder-red-300'
      : 'border-gray-200 bg-white text-gray-900 focus:border-blue-600 focus:ring-blue-600/20 hover:border-gray-300'}
  `;

  const labelClass = "block text-sm font-bold text-gray-700 mb-1.5";

  const formContent = (
    <form onSubmit={onSubmit} className="flex flex-col h-full space-y-8">
      {/* Error Alert */}
      {submitError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-center">
            <Icons.AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm font-semibold text-red-800">{submitError}</p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {submitSuccess && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-center">
            <Icons.CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-sm font-semibold text-green-800">{submitSuccess}</p>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h4 className="text-section-title mb-5 flex items-center gap-2 pb-3 border-b border-gray-100">
          <Icons.User className="w-5 h-5 text-blue-600" />
          Basic Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
            <input name="name" value={formData.name} onChange={handleChange} className={inputClass('name')} placeholder="e.g. John Doe" />
            {errors.name && <p className="text-red-600 text-[13px] mt-1.5 font-semibold flex items-center gap-1"><Icons.AlertCircle className="w-3.5 h-3.5" />{errors.name}</p>}
          </div>

          <div>
            <label className={labelClass}>Email Address <span className="text-red-500">*</span></label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} className={inputClass('email')} placeholder="john@company.com" />
            {errors.email && <p className="text-red-600 text-[13px] mt-1.5 font-semibold flex items-center gap-1"><Icons.AlertCircle className="w-3.5 h-3.5" />{errors.email}</p>}
          </div>

          <div>
            <label className={labelClass}>Phone Number <span className="text-red-500">*</span></label>
            <input name="phone" value={formData.phone} onChange={handleChange} className={inputClass('phone')} placeholder="10-digit mobile number" />
            {errors.phone && <p className="text-red-600 text-[13px] mt-1.5 font-semibold flex items-center gap-1"><Icons.AlertCircle className="w-3.5 h-3.5" />{errors.phone}</p>}
          </div>

          <div>
            <label className={labelClass}>Company/Organization</label>
            <input name="company" value={formData.company} onChange={handleChange} className={inputClass('company')} placeholder="Tech Solutions Inc." />
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h4 className="text-section-title mb-5 flex items-center gap-2 pb-3 border-b border-gray-100">
          <Icons.MapPin className="w-5 h-5 text-blue-600" />
          Location
        </h4>
        <div className="space-y-5">
          <div>
            <label className={labelClass}>Street Address</label>
            <textarea name="address" value={formData.address} onChange={handleChange} className={inputClass('address')} placeholder="Full primary address" rows="2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            <div>
              <label className={labelClass}>District / City</label>
              <input name="district" value={formData.district} onChange={handleChange} className={inputClass('district')} placeholder="e.g. Mumbai" />
            </div>
            <div>
              <label className={labelClass}>State <span className="text-red-500">*</span></label>
              <select name="state" value={formData.state} onChange={handleChange} className={inputClass('state')}>
                <option value="">Select State</option>
                {indianStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Pincode</label>
              <input name="pincode" value={formData.pincode} onChange={handleChange} className={inputClass('pincode')} placeholder="6 digits" />
              {errors.pincode && <p className="text-red-600 text-[13px] mt-1.5 font-semibold flex items-center gap-1"><Icons.AlertCircle className="w-3.5 h-3.5" />{errors.pincode}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Business Details */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h4 className="text-section-title mb-5 flex items-center gap-2 pb-3 border-b border-gray-100">
          <Icons.Briefcase className="w-5 h-5 text-blue-600" />
          Business & Assignment
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <label className={labelClass}>GST / Tax ID</label>
            <input name="taxId" value={formData.taxId} onChange={handleChange} className={inputClass('taxId')} placeholder="Optional tax identifier" />
          </div>
          <div>
            <label className={labelClass}>Industry</label>
            <input name="industry" value={formData.industry} onChange={handleChange} className={inputClass('industry')} placeholder="e.g. Healthcare, Finance" />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className={inputClass('status')}>
              <option value="Active">🟢 Active</option>
              <option value="Lead">🟡 Lead / Prospect</option>
              <option value="Inactive">⚫ Inactive</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Assign Manager</label>
            <select name="managerId" value={formData.managerId} onChange={handleChange} className={inputClass('managerId')}>
              <option value="">-- Unassigned --</option>
              {managers.map((m) => (
                <option key={m.public_id || m._id || m.id} value={m.public_id || m._id || m.id}>
                  {m.name || m.firstName || m.email}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Internal Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} className={inputClass('notes')} placeholder="Add any private remarks..." rows="2" />
          </div>
        </div>
      </div>

      {/* Documents Upload */}
      {!isEditMode && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-100">
            <Icons.Paperclip className="w-5 h-5 text-blue-600" />
            Attachments
          </h4>
          <label className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-blue-600 hover:bg-orange-50 focus:outline-none">
            <span className="flex flex-col items-center justify-center space-y-2">
              <Icons.UploadCloud className="w-8 h-8 text-gray-400" />
              <span className="font-medium text-gray-600">
                Drop files to Attach, or <span className="text-blue-600 underline">browse</span>
              </span>
              <span className="text-xs text-gray-500">PDF, DOCX, Images (Max 10MB)</span>
            </span>
            <input type="file" name="file_upload" className="hidden" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          </label>
          {files.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                  <Icons.FileText className="w-3 h-3" />
                  {file.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </form>
  );

  // Modal Double-Pane View
  if (isModal) {
    return (
      <Transition.Root show={!!open} as={Fragment}>
        <Dialog as="div" className="relative z-[90]" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-hidden">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-gray-50 text-left shadow-2xl transition-all w-full max-w-5xl flex flex-col md:flex-row h-[90vh]">

                  {/* Left Blueprint Pane */}
                  <div className="hidden md:flex md:w-[35%] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-10 flex-col justify-between text-white border-r border-gray-800">
                    <div>
                      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/5">
                        <Icons.Briefcase className="w-8 h-8 text-blue-600" />
                      </div>
                      <Dialog.Title as="h2" className="text-page-title mb-4 leading-tight">
                        {isEditMode ? "Update\nClient" : "Register\nClient"}
                      </Dialog.Title>
                      <p className="text-body-text text-gray-400 leading-relaxed">
                        {isEditMode
                          ? "Modify contact details, industry mappings, and organization notes."
                          : "Add a new client identity to centralize projects, contacts, and task workflows."}
                      </p>
                    </div>

                    <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-md border border-white/10">
                      <div className="flex gap-4 items-start">
                        <Icons.ShieldCheck className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm text-gray-300 font-semibold mb-1">Secure Validation</p>
                          <p className="text-xs text-gray-500 leading-relaxed">Inputs are cross-verified instantly to prevent duplicate records and ensure data integrity.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Form Pane */}
                  <div className="md:w-[65%] flex flex-col h-full bg-gray-50/50">
                    {/* Header */}
                    <div className="flex-none flex items-center justify-between px-8 py-6 bg-white border-b border-gray-200">
                      <div className="md:hidden">
                        <h2 className="text-section-title text-gray-900">{isEditMode ? "Edit Client" : "Add Client"}</h2>
                      </div>
                      <div className="hidden md:flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Digital Onboarding</span>
                      </div>
                      <button
                        onClick={handleClose}
                        className="rounded-full p-2.5 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                      >
                        <Icons.X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Scrollable Form Area */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                      {formContent}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex-none bg-white p-6 border-t border-gray-200 flex justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="px-8 py-3.5 text-[15px] rounded-xl font-bold text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={onSubmit}
                        disabled={isSubmitting}
                        className="px-10 py-3.5 text-[15px] rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            {isEditMode ? "Save Changes" : "Create Client"}
                            <Icons.ArrowRight className="w-4 h-4 ml-1" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    );
  }

  // Backup Page Mode Fallback rendering (Used if isModal=false)
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[80rem] mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
        <div className="hidden md:flex md:w-1/3 bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-12 flex-col justify-between text-white border-r border-gray-800">
          <div>
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-500/30">
              <Icons.Briefcase className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-page-title mb-4 leading-tight">
              {isEditMode ? "Update Client" : "Register Client"}
            </h2>
          </div>
        </div>
        <div className="md:w-2/3 flex flex-col">
          <div className="p-8 md:p-12 flex-1">
            {formContent}
          </div>
          <div className="p-6 md:px-12 bg-gray-50 border-t border-gray-200 flex justify-end gap-4">
            <button onClick={handleClose} className="px-8 py-3.5 text-[15px] rounded-xl font-bold text-gray-700 bg-white border-2 border-gray-200">Cancel</button>
            <button onClick={onSubmit} className="px-10 py-3.5 text-[15px] rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700">
              {isEditMode ? "Save Changes" : "Create Client"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientForm;
