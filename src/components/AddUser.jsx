
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import ModalWrapper from "./ModalWrapper";
import { Dialog } from "@headlessui/react";
import Textbox from "./Textbox";
import Loading from "./Loader";
import Button from "./Button";
import { useSelector, useDispatch } from "react-redux";
import { authRegister } from "../redux/slices/authSlice";
import { updateUser, createUser, fetchUsers } from "../redux/slices/userSlice";
import { fetchDepartments, selectDepartments } from "../redux/slices/departmentSlice";
import { toast } from 'sonner';

const AddUser = ({ open, setOpen, userData }) => {
  const dispatch = useDispatch();
  const { isLoading, isUpdating } = useSelector((state) => state.auth); // Adjust if your userSlice has isUpdating
  const departments = useSelector(selectDepartments) || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: userData ?? {
      name: "",
      email: "",
      title: "",
      password: "",
      role: "Employee",
      phone: '',
      departmentId: '',
      isGuest: false,
      isActive: true,
    },
  });

  useEffect(() => {
    // fetch departments for select list
    dispatch(fetchDepartments());
  }, [dispatch]);

  const handleOnSubmit = (data) => {
    if (userData && userData._id) {
      // Edit user
      dispatch(updateUser({ _id: userData._id, ...data }))
        .unwrap()
        .then(() => {
          setOpen(false);
          reset();
        })
        .catch((err) => {
          console.error("Update failed:", err);
        });
    } else {
      // Add new user via admin API
      dispatch(createUser(data))
        .unwrap()
        .then((resp) => {
          // resp expected to be { success, data }
          const created = resp?.data || resp;
          setOpen(false);
          reset();
          // refresh list
          dispatch(fetchUsers());
          // show useful info (tempPassword may be provided)
          const pw = created?.tempPassword;
          toast.success(created?.name ? `Created ${created.name}` : 'User created');
          if (pw) toast(`Temporary password: ${pw}`);
        })
        .catch((err) => {
          console.error("Create user failed:", err);
          toast.error(err?.message || 'Create user failed');
        });
    }
  };

  return (
    <ModalWrapper open={open} setOpen={setOpen}>
      <form onSubmit={handleSubmit(handleOnSubmit)}>
        <Dialog.Title
          as="h2"
          className="text-base font-bold leading-6 text-gray-900 mb-4"
        >
          {userData ? "EDIT USER" : "ADD NEW USER"}
        </Dialog.Title>

        <div className="mt-2 flex flex-col gap-6">
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
            placeholder="Title"
            type="text"
            name="title"
            label="Title"
            className="w-full rounded"
            register={register("title", { required: "Title is required!" })}
            error={errors.title?.message}
          />

          <Textbox
            placeholder="Email Address"
            type="email"
            name="email"
            label="Email Address"
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

          <div className="flex justify-around">
            <div className="flex items-center">
              <label htmlFor="role" className="text-sm font-medium mr-2">
                Role
              </label>
              <select
                id="role"
                {...register("role", { required: "Role is required!" })}
                className="p-2 border rounded-md"
              >
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Employee">Employee</option>
                <option value="Client">Client</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isGuest"
                {...register("isGuest")}
                className="mr-2"
              />
              <label htmlFor="isGuest" className="text-sm font-medium">
                Is Guest
              </label>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              {...register("isActive")}
              className="mr-2"
              defaultChecked
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Is Active
            </label>
          </div>

          {/* Department select populated from departments API */}
          <div className="mt-2">
            <label className="block text-sm mb-1">Department (optional)</label>
            <select
              {...register('departmentId')}
              className="w-full border px-3 py-2 rounded"
              defaultValue=""
            >
              <option value="">-- Select department --</option>
              {departments.map((dept) => (
                <option key={dept.public_id || dept.id} value={dept.public_id || dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading || isUpdating ? (
          <div className="py-5">
            <Loading />
          </div>
        ) : (
          <div className="py-3 mt-4 sm:flex sm:flex-row-reverse">
            <Button
              type="submit"
              className="bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
              label="Submit"
            />
            <Button
              type="button"
              className="bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto"
              onClick={() => setOpen(false)}
              label="Cancel"
            />
          </div>
        )}
      </form>
    </ModalWrapper>
  );
};

export default AddUser;
