import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog } from "@headlessui/react";
import Textbox from "../components/Textbox";
import Loading from "../components/Loader";
import Button from "../components/Button";
import { useSelector, useDispatch } from "react-redux";
import { updateUser, createUser, fetchUsers } from "../redux/slices/userSlice";
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

  const isSubmitting = userStatus === "loading" || authLoading;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    clearErrors,
    watch,
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      title: "",
      phone: "",
      role: "Employee",
      departmentId: "",
      isGuest: false,
      isActive: true,
    },
  });

  // ✅ Native RHF validation rules
  const nameValidation = {
    required: "Full name is required!",
    minLength: { value: 2, message: "Name must be at least 2 characters" },
    maxLength: { value: 100, message: "Name too long (max 100 chars)" },
  };

  const emailValidation = {
    required: "Email is required!",
    pattern: {
      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: "Invalid email format",
    },
  };

  const phoneValidation = {
    maxLength: { value: 20, message: "Phone too long (max 20 chars)" },
  };

  // Populate form for edit or reset for add
  useEffect(() => {
    if (!open) {
      reset();
      clearErrors();
      return;
    }

    if (userData) {
      reset({
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
      reset();
    }
  }, [open, userData, reset, clearErrors]);

  // Load departments when modal opens
  useEffect(() => {
    if (open) {
      dispatch(fetchDepartments());
    }
  }, [dispatch, open]);

  const handleOnSubmit = async (data) => {
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
      console.error("Submit error:", err);

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
    reset();
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
            <form onSubmit={handleSubmit(handleOnSubmit)} className="space-y-6">
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
                      placeholder="Enter full name"
                      {...register("name", nameValidation)}
                      className={clsx(
                        "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors",
                        errors.name
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300",
                      )}
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      placeholder="Job title/position"
                      {...register("title", {
                        maxLength: { value: 100, message: "Title too long" },
                      })}
                      className={clsx(
                        "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors",
                        errors.title
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300",
                      )}
                    />
                    {errors.title && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.title.message}
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
                      placeholder="user@company.com"
                      {...register("email", emailValidation)}
                      className={clsx(
                        "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors",
                        errors.email
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300",
                      )}
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.email.message}
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
                      placeholder="+1 (555) 123-4567"
                      {...register("phone", phoneValidation)}
                      className={clsx(
                        "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors",
                        errors.phone
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300",
                      )}
                    />
                    {errors.phone && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      {...register("role", {
                        required: "Role is required!",
                      })}
                      disabled={isSubmitting}
                      className={clsx(
                        "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white",
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
                        {errors.role.message}
                      </p>
                    )}
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <select
                      {...register("departmentId")}
                      disabled={isSubmitting || departments.length === 0}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
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
                        {...register("isActive")}
                        className={clsx(
                          "h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors",
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
                        {...register("isGuest")}
                        className={clsx(
                          "h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors",
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
                {errors.root?.serverError && (
                  <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      {errors.root.serverError.message}
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
                    className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium"
                  />
                  <Button
                    type="submit"
                    label={isSubmitting ? "Saving..." : "Save User"}
                    className={clsx(
                      "px-8 py-2.5 font-medium rounded-lg",
                      isSubmitting
                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-200 text-black-700",
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
