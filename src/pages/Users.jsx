import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Title from "../components/Title";
import Button from "../components/Button";
import clsx from "clsx";
import ConfirmatioDialog from "../components/Dialogs";
import AddUser from "../components/AddUser";

import {
  fetchUsers,
  deleteUser,
  selectUsers,
  selectUserStatus,
  selectUserError,
} from "../redux/slices/userSlice";

// ✅ Correct icon imports
import { IoMdAdd } from "react-icons/io";
import {
  IoEyeOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoCloseOutline,
} from "react-icons/io5";

/* -------------------- Helpers -------------------- */
const getInitials = (name = "") => {
  if (!name || typeof name !== "string") return "??";
  return name
    .split(" ")
    .map((p) => p[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
};

/* -------------------- Component -------------------- */
const Users = () => {
  const dispatch = useDispatch();

  const users = useSelector(selectUsers) || [];
  const status = useSelector(selectUserStatus);
  const error = useSelector(selectUserError);

  const isLoading = status === "loading";

  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // ✅ Full user OR ID

  /* -------------------- Effects -------------------- */
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  /* -------------------- Handlers -------------------- */
  const addClick = () => {
    setSelectedUser(null);
    setOpenForm(true);
  };

  const editClick = (user) => {
    setSelectedUser(user); // ✅ Pass FULL user object
    setOpenForm(true);
  };

  // ✅ FIXED: Pass full user object to deleteUser
  const deleteClick = (user) => {
    setSelectedUser(user); // ✅ Full user object
    setOpenDelete(true);
  };

  const deleteHandler = async () => {
    if (!selectedUser) return;

    try {
      // ✅ Extract correct ID for backend
      const userId = selectedUser.public_id || selectedUser._id || selectedUser.id;
      
      await dispatch(deleteUser(userId)).unwrap();
      toast.success("User deleted successfully");
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error(err?.message || 'Delete failed');
    } finally {
      setOpenDelete(false);
      setSelectedUser(null);
    }
  };

  /* -------------------- Table -------------------- */
  const TableHeader = () => (
    <thead className="border-b border-gray-200">
      <tr className="text-left text-gray-700 font-semibold">
        <th className="py-4 pl-6 pr-4">User</th>
        <th className="py-4 px-4">Title</th>
        <th className="py-4 px-4">Role</th>
        <th className="py-4 px-4">Department</th>
        <th className="py-4 px-4">Status</th>
        <th className="py-4 pr-6 text-right">Actions</th>
      </tr>
    </thead>
  );

  const TableRow = ({ user }) => (
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td className="py-4 pl-6 pr-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center font-semibold shadow-sm">
            {getInitials(user?.name)}
          </div>
          <div>
            <div className="font-medium text-gray-900 text-sm">{user?.name}</div>
            <div className="text-xs text-gray-500 truncate max-w-[200px]">
              {user?.email}
            </div>
          </div>
        </div>
      </td>

      <td className="py-4 px-4 font-medium text-sm">{user?.title || "-"}</td>

      <td className="py-4 px-4">
        <span
          className={clsx(
            "px-3 py-1 rounded-full text-xs font-semibold shadow-sm",
            user?.role === "Admin"
              ? "bg-purple-100 text-purple-800 border border-purple-200"
              : user?.role === "Manager"
              ? "bg-orange-100 text-orange-800 border border-orange-200"
              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
          )}
        >
          {user?.role || "No role"}
        </span>
      </td>

      <td className="py-4 px-4 text-sm text-gray-600">
        {user?.departmentName || "-"}
      </td>

      <td className="py-4 px-4">
        <span
          className={clsx(
            "px-3 py-1 rounded-full text-xs font-semibold shadow-sm",
            user?.isActive
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : "bg-amber-100 text-amber-800 border border-amber-200"
          )}
        >
          {user?.isActive ? "Active" : "Inactive"}
        </span>
      </td>

      <td className="py-4 pr-6">
        <div className="flex items-center justify-end gap-2">
          {/* View */}
          <button
            className="p-2.5 rounded-xl hover:bg-blue-50 text-gray-500 hover:text-blue-600 hover:shadow-md transition-all duration-200 group"
            title="View Details"
            onClick={() => console.log("View user:", user)}
          >
            <IoEyeOutline size={18} className="group-hover:scale-110 transition-transform" />
          </button>

          {/* Edit */}
          <button
            className="p-2.5 rounded-xl hover:bg-blue-50 text-gray-500 hover:text-blue-600 hover:shadow-md transition-all duration-200 group"
            title="Edit User"
            onClick={() => editClick(user)}
          >
            <IoPencilOutline size={18} className="group-hover:scale-110 transition-transform" />
          </button>

          {/* Delete */}
          <button
            className="p-2.5 rounded-xl hover:bg-red-50 text-gray-500 hover:text-red-600 hover:shadow-md transition-all duration-200 group"
            title="Delete User"
            onClick={() => deleteClick(user)}
          >
            <IoTrashOutline size={18} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </td>
    </tr>
  );

  /* -------------------- UI States -------------------- */
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="animate-spin h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-2xl mx-auto">
        <IoCloseOutline className="mx-auto mb-4 text-red-400" size={48} />
        <h3 className="text-xl font-bold text-red-800 mb-2">
          Failed to load users
        </h3>
        <p className="text-red-600 mb-6">
          {error?.message || String(error)}
        </p>
        <Button
          label="Retry Loading"
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          onClick={() => dispatch(fetchUsers())}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Title title="Team Members" />
          <Button
            label="Add New User"
            icon={<IoMdAdd className="ml-2" />}
            onClick={addClick}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          />
        </div>
{/* database */}
        {/* Table */}
        {users.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-3xl p-16 text-center">
            <IoMdAdd className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No team members yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Your team is looking a bit empty. Add your first member to get started.
            </p>
            <Button
              label="Add First Member"
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-2xl font-semibold shadow-xl hover:shadow-2xl text-lg"
              onClick={addClick}
            />
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <TableHeader />
                <tbody>
                  {users.map((user) => (
                    <TableRow
                      key={user?.public_id || user?._id || user?.id}
                      user={user}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddUser
        open={openForm}
        setOpen={setOpenForm}
        userData={selectedUser && typeof selectedUser === "object" ? selectedUser : null}
      />

      <ConfirmatioDialog
        open={openDelete}
        setOpen={setOpenDelete}
        onClick={deleteHandler}
        title="Delete User?"
        message={`Are you sure you want to delete "${selectedUser?.name || 'this user'}"? This action cannot be undone.`}
        confirmText="Delete User"
        confirmClassName="bg-red-600 hover:bg-red-700 text-white"
      />
    </>
  );
};

export default Users;
