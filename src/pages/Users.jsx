import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Title from "../components/Title";
import Button from "../components/Button";
import { IoMdAdd } from "react-icons/io";
import clsx from "clsx";
import ConfirmatioDialog, { UserAction } from "../components/Dialogs";
import AddUser from "../components/AddUser";
import {
  fetchUsers,
  deleteUser,
  selectUsers,
  selectUserStatus,
  selectUserError,
} from "../redux/slices/userSlice";

// Safe getInitials function with null checks
const getInitials = (name = "") => {
  if (!name || typeof name !== "string") return "??";
  return name
    .split(" ")
    .map(part => part[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2);
};

const Users = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers) || [];
  const isLoading = useSelector(selectUserStatus) === "loading";
  const error = useSelector(selectUserError);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const [openDialog, setOpenDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const [openAction, setOpenAction] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // 🔥 FIXED: Renamed for clarity

  const userActionHandler = () => {};
  
  const deleteHandler = () => {
    if (selectedUser) {
      dispatch(deleteUser(selectedUser))
        .unwrap()
        .catch((err) => console.error('Delete failed', err));
      setSelectedUser(null);
      setOpenDialog(false);
    }
  };

  const deleteClick = (user) => {
    const id = user?.public_id || user?.publicId || user?._id || user?.id || null;
    setSelectedUser(id);
    setOpenDialog(true);
  };

  // 🔥 FIXED: Separate states for add/edit + explicit null for add
  const addClick = () => {
    setSelectedUser(null); // Clear any previous selection
    setOpen(true);
  };

  const editClick = (user) => {
    setSelectedUser(user); // Pass full user object
    setOpen(true);
  };

  const TableHeader = () => (
    <thead className="border-b border-gray-300">
      <tr className="text-black text-left">
        <th className="py-2">Full Name</th>
        <th className="py-2">Title</th>
        <th className="py-2">Email</th>
        <th className="py-2">Role</th>
        <th className="py-2">Active</th>
        <th className="py-2">Actions</th>
      </tr>
    </thead>
  );

  const TableRow = ({ user = {} }) => (
    <tr className="border-b border-gray-200 text-gray-600 hover:bg-gray-400/10">
      <td className="p-2">
        <div className="flex items-center gap-3">
         <div className="w-9 h-9 rounded-full text-white flex items-center justify-center text-sm bg-blue-700">
            <span className="text-xs md:text-sm text-center">
              {getInitials(user?.name)}
            </span>
          </div>
          {user?.name || "Unknown User"}
        </div>
      </td>
      <td className="p-2">{user?.title || "No title"}</td>
      <td className="p-2">{user?.email || "No email"}</td>
      <td className="p-2">{user?.role || "No role"}</td>
      <td>
        <button
          className={clsx(
            "w-fit px-4 py-1 rounded-full",
            user?.isActive ? "bg-blue-200" : "bg-yellow-100"
          )}
        >
          {user?.isActive ? "Active" : "Disabled"}
        </button>
      </td>
      <td className="p-2 flex gap-4 justify-end">
        <Button
          className="text-blue-600 hover:text-blue-500 font-semibold sm:px-0"
          label="Edit"
          type="button"
          onClick={() => editClick(user)}
        />
        <Button
          className="text-red-700 hover:text-red-500 font-semibold sm:px-0"
          label="Delete"
          type="button"
          onClick={() => deleteClick(user)}
        />
      </td>
    </tr>
  );

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 text-red-500">
        Error loading users: {error.message || error}
      </div>
    );
  }

  return (
    <>
      <div className="w-full md:px-1 px-0 mb-6">
        <div className="flex items-center justify-between mb-8">
          <Title title="Team Members" />
          <Button
            label="Add New User"
            icon={<IoMdAdd className="text-lg" />}
            className="flex flex-row-reverse gap-1 items-center bg-blue-600 text-white rounded-md 2xl:py-2.5"
            onClick={addClick} // 🔥 FIXED: Use dedicated add handler
          />
        </div>
        <div className="bg-white px-2 md:px-4 py-4 shadow-md rounded">
          <div className="overflow-x-auto">
            <table className="w-full mb-5">
              <TableHeader />
              <tbody>
                {users.map((user, index) => (
                  <TableRow key={user?._id || user?.public_id || index} user={user} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* 🔥 FIXED: Pass full user object or null explicitly */}
      <AddUser
        open={open}
        setOpen={setOpen}
        userData={selectedUser} 
      />
      
      <ConfirmatioDialog
        open={openDialog}
        setOpen={setOpenDialog}
        onClick={deleteHandler}
      />
      
      <UserAction
        open={openAction}
        setOpen={setOpenAction}
        onClick={userActionHandler}
      />
    </>
  );
};

export default Users;
