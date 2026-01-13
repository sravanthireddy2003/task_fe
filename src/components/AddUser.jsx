import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import ModalWrapper from "../components/ModalWrapper";
import { Dialog } from "@headlessui/react";
import Textbox from "../components/Textbox";
import Loading from "../components/Loader";
import Button from "../components/Button";
import { useSelector, useDispatch } from "react-redux";
import { updateUser, createUser, fetchUsers } from "../redux/slices/userSlice";
import { fetchDepartments, selectDepartments } from "../redux/slices/departmentSlice";
import { toast } from 'sonner';
import clsx from "clsx";

const AddUser = ({ open, setOpen, userData }) => {
  const dispatch = useDispatch();
  const { isLoading: authLoading } = useSelector((state) => state.auth);
  const userStatus = useSelector((state) => state.user?.status); // User slice loading
  const departments = useSelector(selectDepartments) || [];
  
  const isSubmitting = userStatus === 'loading' || authLoading;

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset, 
    setError,
    clearErrors,
    watch 
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

  // ✅ Native RHF validation rules (NO ZOD)
  const nameValidation = {
    required: "Full name is required!",
    minLength: { value: 2, message: "Name must be at least 2 characters" },
    maxLength: { value: 100, message: "Name too long (max 100 chars)" }
  };

  const emailValidation = {
    required: "Email is required!",
    pattern: {
      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: "Invalid email format"
    }
  };

  const phoneValidation = {
    maxLength: { value: 20, message: "Phone too long (max 20 chars)" }
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
      clearErrors(); // Clear any previous errors
      
      if (userData && (userData._id || userData.id || userData.public_id)) {
        // UPDATE
        const idToSend = userData._id || userData.id || userData.public_id;
        const resp = await dispatch(updateUser({ id: idToSend, ...data })).unwrap();
        toast.success(`Updated ${resp?.user?.name || resp?.name || 'User'} successfully`);
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
      console.error('Submit error:', err);
      
      // ✅ Handle backend validation errors
      if (err?.message) {
        toast.error(err.message);
      } else {
        toast.error('Operation failed. Please try again.');
      }
      
      // Set field-specific errors from backend response
      if (err?.errors && typeof err.errors === 'object') {
        Object.entries(err.errors).forEach(([field, message]) => {
          setError(field, { 
            type: 'server', 
            message: Array.isArray(message) ? message[0] : message 
          });
        });
      } else if (err?.data?.message) {
        // Single error message
        setError('root.serverError', { 
          type: 'server', 
          message: err.data.message 
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
    <ModalWrapper open={open} setOpen={setOpen}>
      <form onSubmit={handleSubmit(handleOnSubmit)} className="space-y-8">
        <Dialog.Title as="h2" className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-4">
          {userData ? "Edit User" : "Add New User"}
        </Dialog.Title>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <Textbox
            placeholder="Enter full name (e.g. John Doe)"
            type="text"
            label="Full Name *"
            register={register("name", nameValidation)}
            error={errors.name?.message}
          />

          {/* Title */}
          <Textbox
            placeholder="Job title/position"
            type="text"
            label="Title"
            register={register("title", {
              maxLength: { value: 100, message: "Title too long" }
            })}
            error={errors.title?.message}
          />

          {/* Email */}
          <Textbox
            placeholder="user@company.com"
            type="email"
            label="Email Address *"
            register={register("email", emailValidation)}
            error={errors.email?.message}
          />

          {/* Phone */}
          <Textbox
            placeholder="+1 (555) 123-4567"
            type="tel"
            label="Phone Number"
            register={register("phone", phoneValidation)}
            error={errors.phone?.message}
          />

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
            <select
              {...register("role", {
                required: "Role is required!"
              })}
              disabled={isSubmitting}
              className={clsx(
                "w-full px-3 py-2.5 border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm bg-white",
                errors.role ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
              )}
            >
              <option value="">Select Role</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Employee">Employee</option>
              <option value="Client">Client</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              {...register("departmentId")}
              disabled={isSubmitting || departments.length === 0}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm bg-white hover:border-gray-400"
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
        <fieldset className="border-t border-gray-200 pt-6">
          <legend className="text-sm font-medium text-gray-700 px-1">Status Settings</legend>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group">
              <input
                type="checkbox"
                {...register("isActive", {
                  required: userData ? false : "Active status required"
                })}
                className={clsx(
                  "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200",
                  isSubmitting && "cursor-not-allowed opacity-50"
                )}
                disabled={isSubmitting}
              />
              <div>
                <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">Active User</span>
                <p className="text-xs text-gray-500">User can login and access system</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group">
              <input
                type="checkbox"
                {...register("isGuest")}
                className={clsx(
                  "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200",
                  isSubmitting && "cursor-not-allowed opacity-50"
                )}
                disabled={isSubmitting}
              />
              <div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Guest User</span>
                <p className="text-xs text-gray-500">Limited access user</p>
              </div>
            </label>
          </div>
          {errors.isActive && (
            <p className="mt-2 text-sm text-red-600 ml-1">{errors.isActive.message}</p>
          )}
        </fieldset>

        {/* Server Error Display */}
        {errors.root?.serverError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{errors.root.serverError.message}</p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            className="px-6 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors duration-200 shadow-sm"
            onClick={handleCancel}
            disabled={isSubmitting}
            label="Cancel"
          />
          <Button
            type="submit"
            className={clsx(
              "px-8 py-2 font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 min-w-[120px] justify-center",
              isSubmitting
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save User"
            )}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default AddUser;

