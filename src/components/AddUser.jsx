import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import Textbox from "../components/Textbox";
import Loading from "../components/Loader";
import Button from "../components/Button";
import { useSelector, useDispatch } from "react-redux";
import { updateUser, createUser, fetchUsers, selectUsers } from "../redux/slices/userSlice";
import {
  fetchDepartments,
  selectDepartments,
} from "../redux/slices/departmentSlice";
import { toast } from "sonner";
import clsx from "clsx";

const AddUser = ({ open, setOpen, userData }) => {
  const dispatch = useDispatch();
  const { isLoading: authLoading } = useSelector((state) => state.auth);
  const userStatus = useSelector((state) => state.user?.status);
  const departments = useSelector(selectDepartments) || [];
  const users = useSelector(selectUsers) || [];

  const isSubmitting = userStatus === "loading" || authLoading;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    title: "",
    phone: "",
    role: "Employee",
    departmentId: "",
    isGuest: false,
    isActive: true,
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    const nameStr = formData.name?.trim() || "";
    if (!nameStr) newErrors.name = "Full name is required!";
    else if (nameStr.length < 2) newErrors.name = "Name must be at least 2 characters";
    else if (nameStr.length > 100) newErrors.name = "Name too long (max 100 chars)";

    const emailStr = formData.email?.trim() || "";
    if (!emailStr) newErrors.email = "Email is required!";
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(emailStr)) {
      newErrors.email = "Invalid email format";
    }

    const titleStr = formData.title?.trim() || "";
    if (!titleStr) newErrors.title = "Title is required!";
    else if (titleStr.length > 100) newErrors.title = "Title too long";

    const phoneStr = formData.phone?.trim() || "";
    if (phoneStr) {
      const digitsOnly = phoneStr.replace(/\D/g, "");
      if (digitsOnly.length !== 10) {
        newErrors.phone = "Phone must be 10 digits";
      } else if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
        newErrors.phone = "Valid phone must start with 6-9";
      }
    } else {
      newErrors.phone = "Phone number is required!";
    }

    if (!formData.role) newErrors.role = "Role is required!";

    if (!formData.departmentId) newErrors.departmentId = "Department is required!";

    // Duplicate Validation
    const currentId = userData?._id || userData?.id || userData?.public_id;

    if (emailStr && !newErrors.email) {
      const isDuplicateEmail = users.some(u =>
        u.email?.toLowerCase() === emailStr.toLowerCase() &&
        (u._id || u.id || u.public_id) !== currentId
      );
      if (isDuplicateEmail) newErrors.email = "Email already exists!";
    }

    if (phoneStr && !newErrors.phone) {
      const isDuplicatePhone = users.some(u =>
        u.phone?.trim() === phoneStr &&
        (u._id || u.id || u.public_id) !== currentId
      );
      if (isDuplicatePhone) newErrors.phone = "Phone number already exists!";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;
    if (name === 'phone') {
      finalValue = finalValue.replace(/\D/g, '').slice(0, 10);
    }
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const setError = (field, err) => {
    setErrors(prev => ({ ...prev, [field]: err.message }));
  };

  const clearErrors = () => {
    setErrors({});
  };

  // Populate form for edit or reset for add
  useEffect(() => {
    if (!open) {
      setFormData({
        name: "", email: "", title: "", phone: "",
        role: "Employee", departmentId: "", isGuest: false, isActive: true
      });
      clearErrors();
      return;
    }

    if (userData) {
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        title: userData.title || "",
        phone: userData.phone || "",
        role: userData.role || "Employee",
        departmentId: userData.departmentPublicId || "",
        isGuest: userData.isGuest || false,
        isActive: userData.isActive ?? true,
      });
      clearErrors();
    } else {
      setFormData({
        name: "", email: "", title: "", phone: "",
        role: "Employee", departmentId: "", isGuest: false, isActive: true
      });
    }
  }, [open, userData]);

  // Load departments when modal opens
  useEffect(() => {
    if (open) {
      dispatch(fetchDepartments());
    }
  }, [dispatch, open]);

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    const currentErrors = validate();
    if (Object.keys(currentErrors).length > 0) {
      Object.values(currentErrors).forEach((errorMsg) => {
        if (errorMsg) {
          toast.error(errorMsg);
        }
      });
      return;
    }

    const data = formData;

    try {
      clearErrors();

      if (userData && (userData._id || userData.id || userData.public_id)) {
        // UPDATE
        const idToSend = userData._id || userData.id || userData.public_id;
        const resp = await dispatch(
          updateUser({ id: idToSend, ...data }),
        ).unwrap();
        toast.success(
          `Updated ${resp?.user?.name || resp?.name || "User"} successfully`,
        );
      } else {
        // CREATE
        const resp = await dispatch(createUser(data)).unwrap();
        const created = resp?.data || resp;
        toast.success(`Created ${created?.name || "User"} successfully`);
        if (created?.tempPassword) {
          toast.info(`Temporary password: ${created.tempPassword}`);
        }
      }

      setOpen(false);
      dispatch(fetchUsers());
    } catch (err) {
      if (err?.message) {
        toast.error(err.message);
      } else {
        toast.error("Operation failed. Please try again.");
      }

      if (err?.errors && typeof err.errors === "object") {
        Object.entries(err.errors).forEach(([field, message]) => {
          setError(field, {
            type: "server",
            message: Array.isArray(message) ? message[0] : message,
          });
        });
      } else if (err?.data?.message) {
        setError("root.serverError", {
          type: "server",
          message: err.data.message,
        });
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "", email: "", title: "", phone: "",
      role: "Employee", departmentId: "", isGuest: false, isActive: true
    });
    clearErrors();
    setOpen(false);
  };



  return (
    <Dialog open={open} onClose={handleCancel} className="relative z-50">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="relative bg-white w-full max-w-2xl rounded-xl shadow-xl">
            <form onSubmit={handleOnSubmit} className="space-y-6">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    {userData ? "Edit User" : "Add New User"}
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Scrollable form content */}
              <div className="px-6 pb-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      className={clsx(
                        "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-500 transition-colors",
                        errors.name
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300",
                      )}
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Job title/position"
                      className={clsx(
                        "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-500 transition-colors",
                        errors.title
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300",
                      )}
                    />
                    {errors.title && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="user@company.com"
                      className={clsx(
                        "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-500 transition-colors",
                        errors.email
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300",
                      )}
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                      className={clsx(
                        "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-500 transition-colors",
                        errors.phone
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300",
                      )}
                    />
                    {errors.phone && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={clsx(
                        "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-500 transition-colors bg-white",
                        errors.role
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300",
                      )}
                    >
                      <option value="">Select Role</option>
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Employee">Employee</option>
                    </select>
                    {errors.role && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.role}
                      </p>
                    )}
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleChange}
                      disabled={isSubmitting || departments.length === 0}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-500 transition-colors bg-white"
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((dept) => (
                        <option
                          key={dept.public_id || dept.id || dept._id}
                          value={dept.public_id || dept.id || dept._id}
                        >
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status Checkboxes */}
                <fieldset className="mt-6 pt-6 border-t border-gray-200">
                  <legend className="text-sm font-medium text-gray-700 px-1 mb-4">
                    Status Settings
                  </legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className={clsx(
                          "h-5 w-5 text-blue-600 focus:ring-blue-600 border-gray-300 rounded transition-colors",
                          isSubmitting && "cursor-not-allowed opacity-50",
                        )}
                        disabled={isSubmitting}
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                          Active User
                        </span>
                        <p className="text-xs text-gray-500">
                          User can login and access system
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                      <input
                        type="checkbox"
                        name="isGuest"
                        checked={formData.isGuest}
                        onChange={handleChange}
                        className={clsx(
                          "h-5 w-5 text-blue-600 focus:ring-blue-600 border-gray-300 rounded transition-colors",
                          isSubmitting && "cursor-not-allowed opacity-50",
                        )}
                        disabled={isSubmitting}
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                          Guest User
                        </span>
                        <p className="text-xs text-gray-500">
                          Limited access user
                        </p>
                      </div>
                    </label>
                  </div>
                </fieldset>

                {/* Server Error Display */}
                {errors["root.serverError"] && (
                  <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      {errors["root.serverError"]}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    label="Cancel"
                    className="px-6 py-2.5 !bg-white hover:!bg-gray-50 !text-gray-700 border border-gray-300 rounded-lg font-medium"
                  />
                  <Button
                    type="submit"
                    label={isSubmitting ? "Saving..." : "Save User"}
                    className={clsx(
                      "px-8 py-2.5 font-medium rounded-lg",
                      isSubmitting
                        ? "bg-gray-400 !text-gray-600 cursor-not-allowed"
                        : "!bg-blue-600 hover:!bg-blue-700 !text-white",
                    )}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </div>
                    ) : (
                      "Save User"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default AddUser;

