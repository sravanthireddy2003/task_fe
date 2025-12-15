import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import ModalWrapper from "./ModalWrapper";
import { Dialog } from "@headlessui/react";
import Textbox from "./Textbox";
import Loading from "./Loader";
import Button from "./Button";
import { useSelector, useDispatch } from "react-redux";
import { updateUser, createUser, fetchUsers } from "../redux/slices/userSlice";
import { fetchDepartments, selectDepartments } from "../redux/slices/departmentSlice";
import { toast } from 'sonner';

const AddUser = ({ open, setOpen, userData }) => {
  const dispatch = useDispatch();
  const { isLoading, isUpdating } = useSelector((state) => state.auth);
  const departments = useSelector(selectDepartments) || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      title: "",
      password: "",
      role: "Employee",
      phone: "",
      departmentId: "",
      isGuest: false,
      isActive: true,
    },
  });

  /** 🔥 FIXED: Reset form when modal opens - clean slate first, then populate if editing */
  useEffect(() => {
    if (open) {
      if (userData && (userData._id || userData.id || userData.public_id)) {
        // EDIT MODE - populate form with user data
        reset({
          name: userData.name || "",
          email: userData.email || "",
          title: userData.title || "",
          phone: userData.phone || "",
          role: userData.role || "Employee",
          departmentId:
            userData.departmentId || userData.department_id || userData.department || userData.dept_id || userData.departmentId || userData.departmentId || (userData.department && (userData.department.public_id || userData.department.id)) || "",
          isGuest: userData.isGuest || false,
          isActive: userData.isActive ?? true,
        });
      } else {
        // ADD MODE - clean form
        reset({
          name: "",
          email: "",
          title: "",
          password: "",
          role: "Employee",
          phone: "",
          departmentId: "",
          isGuest: false,
          isActive: true,
        });
      }
    }
  }, [open, userData, reset]);

  /** Load departments once */
  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  const handleOnSubmit = (data) => {
    if (userData && (userData._id || userData.id || userData.public_id)) {
      // UPDATE
      const idToSend = userData._id || userData.id || userData.public_id;
      dispatch(updateUser({ _id: idToSend, ...data }))
        .unwrap()
        .then((resp) => {
          toast.success(`Updated ${resp?.name || 'User'}`);
          setOpen(false);
          dispatch(fetchUsers());
        })
        .catch((err) => {
          console.error("Update failed:", err);
          toast.error(err?.message || 'Update user failed');
        });
    } else {
      // CREATE
      dispatch(createUser(data))
        .unwrap()
        .then((resp) => {
          const created = resp?.data || resp;
          setOpen(false);
          dispatch(fetchUsers());
          toast.success(`Created ${created?.name || "User"}`);
          if (created?.tempPassword) toast(`Temporary password: ${created.tempPassword}`);
        })
        .catch((err) => toast.error(err?.message || 'Create user failed'));
    }
  };

  /** Handle cancel - reset form and close */
  const handleCancel = () => {
    reset();
    setOpen(false);
  };

  return (
    <ModalWrapper open={open} setOpen={setOpen}>
      <form onSubmit={handleSubmit(handleOnSubmit)}>
        <Dialog.Title
          as="h2"
          className="text-xl font-bold text-gray-900 mb-6"
        >
          {userData ? "EDIT USER" : "ADD NEW USER"}
        </Dialog.Title>

        {/* FORM GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Textbox
            placeholder="Full name"
            type="text"
            name="name"
            label="Full Name"
            className="w-full rounded"
            register={register("name", { required: "Full name is required!" })}
            error={errors.name?.message}
          />

          <Textbox
            placeholder="Job title"
            type="text"
            name="title"
            label="Title"
            className="w-full rounded"
            register={register("title", { required: "Title is required!" })}
            error={errors.title?.message}
          />

          <Textbox
            placeholder="Email address"
            type="email"
            name="email"
            label="Email"
            className="w-full rounded"
            register={register("email", { required: "Email is required!" })}
            error={errors.email?.message}
          />

          <Textbox
            placeholder="Phone number"
            type="text"
            name="phone"
            label="Phone"
            className="w-full rounded"
            register={register("phone")}
            error={errors.phone?.message}
          />

          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              {...register("role", { required: "Role is required!" })}
              className="w-full border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Employee">Employee</option>
              <option value="Client">Client</option>
            </select>
          </div>

          {/* Department - UNCOMMENT IF NEEDED */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department (optional)</label>
            <select
              {...register("departmentId")}
              className="w-full border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select department --</option>
              {departments.map((dept) => (
                <option key={dept.public_id || dept.id || dept._id} value={dept.public_id || dept.id || dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SWITCHES */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register("isGuest")} className="h-4 w-4" />
            <span className="text-sm">Is Guest User</span>
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" {...register("isActive")} className="h-4 w-4" />
            <span className="text-sm">Active Status</span>
          </label>
        </div>

        {/* BUTTONS */}
        {isLoading || isUpdating ? (
          <div className="py-5"><Loading /></div>
        ) : (
          <div className="flex justify-end gap-4 mt-8 border-t pt-4">
            <Button
              type="button"
              className="bg-gray-200 px-6 text-sm font-semibold text-gray-900 rounded-md"
              onClick={handleCancel}
              label="Cancel"
            />
            <Button
              type="submit"
              className="bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700 rounded-md"
              label="Submit"
            />
          </div>
        )}
      </form>
    </ModalWrapper>
  );
};

export default AddUser;
