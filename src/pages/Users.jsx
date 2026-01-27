import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "../components/Button";
import ViewToggle from "../components/ViewToggle";
import GridCard from "../components/ui/GridCard";
import ConfirmationDialog from "../components/Dialogs";
import AddUser from "../components/AddUser";
import { toast } from "sonner";
import {
  fetchUsers,
  deleteUser,
  selectUsers,
  selectUserStatus,
  selectUserError,
} from "../redux/slices/userSlice";
import * as Icons from '../icons';

// Simple Stats Cards (3 cards only)
const StatsCards = ({ users }) => {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = totalUsers - activeUsers;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <GridCard
        title="Total Members"
        value={totalUsers}
        tone="primary"
        icon={<Icons.Users className="tm-icon text-blue-600" />}
      />
      <GridCard
        title="Active Members"
        value={activeUsers}
        tone="success"
        icon={<Icons.CheckCircle className="tm-icon text-emerald-600" />}
      />
      <GridCard
        title="Inactive Members"
        value={inactiveUsers}
        tone="warning"
        icon={<Icons.Clock className="tm-icon text-amber-600" />}
      />
    </div>
  );
};

// Clean Avatar Component
const UserAvatar = ({ user, size = "md" }) => {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg"
  };

  const getInitials = (name = "") => {
    if (!name || typeof name !== "string") return "??";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative">
      <div
        className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-sm`}
      >
        {getInitials(user?.name)}
      </div>
      <div
        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
          user?.isActive ? "bg-green-500" : "bg-gray-400"
        }`}
      />
    </div>
  );
};

// Clean Card View (No overlapping data)
const UserCard = ({ user, onClick }) => {
  return (
    <div
      className="tm-card-shell cursor-pointer"
      onClick={() => onClick(user)}
    >
      <div className="flex items-start justify-between mb-4">
        <UserAvatar user={user} size="md" />
        <button className="p-1 hover:bg-gray-100 rounded icon-center">
          <Icons.MoreVertical className="tm-icon" />
        </button>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 text-lg mb-1">{user?.name}</h3>
        <p className="text-gray-600 text-sm mb-3">{user?.title || user?.role}</p>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Icons.Mail className="tm-icon text-gray-400 mr-2" />
            <span className="text-gray-700 truncate">{user?.email}</span>
          </div>
          {user?.phone && (
            <div className="flex items-center text-sm">
              <Icons.Smartphone className="tm-icon text-gray-400 mr-2" />
              <span className="text-gray-700">{user?.phone}</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              user?.role === "Admin"
                ? "bg-purple-100 text-purple-800"
                : user?.role === "Manager"
                ? "bg-orange-100 text-orange-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {user?.role}
          </span>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                user?.isActive ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            <span className="text-xs text-gray-600">
              {user?.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Clean List Row
const UserListRow = ({ user, onClick }) => {
  return (
    <tr
      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
      onClick={() => onClick(user)}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} size="sm" />
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {user?.name}
            </div>
            <div className="text-sm text-gray-500 truncate">{user?.title}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="text-sm text-gray-900 truncate max-w-[200px]">
          {user?.email}
        </div>
      </td>
      <td className="py-3 px-4">
        <span
          className={`text-xs font-medium px-2 py-1 rounded ${
            user?.role === "Admin"
              ? "bg-purple-100 text-purple-800"
              : user?.role === "Manager"
              ? "bg-orange-100 text-orange-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {user?.role}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="text-sm text-gray-600">
          {user?.departmentName || "-"}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              user?.isActive ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          <span className="text-sm">
            {user?.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </td>
      <td className="py-3 px-4 text-center align-middle">
        <span className="inline-flex items-center justify-center text-blue-600 cursor-pointer icon-center">
          <Icons.Eye className="tm-icon" />
        </span>
      </td>
    </tr>
  );
};

// Clean Modal (No emoji feeling)
const UserDetailsModal = ({ user, isOpen, onClose, onEdit, onDelete }) => {
  if (!isOpen || !user) return null;

  const stats = [
    { label: "Projects", value: user.projects?.length || 0, color: "blue" },
    { label: "Total Tasks", value: user.tasks?.length || 0, color: "green" },
    {
      label: "Completed Tasks",
      value: user.tasks?.filter((t) => t.stage === "COMPLETED").length || 0,
      color: "emerald",
    },
    {
      label: "In Progress",
      value:
        user.tasks?.filter(
          (t) => t.stage === "IN_PROGRESS" || t.stage === "PENDING",
        ).length || 0,
      color: "orange",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-4">
            <UserAvatar user={user} size="lg" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">{user.title || user.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Icons.X className="tm-icon" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <div className="space-y-6">
            {/* Contact Info */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Email</div>
                  <div className="font-medium text-gray-900">{user.email}</div>
                </div>
                {user.phone && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Phone</div>
                    <div className="font-medium text-gray-900">
                      {user.phone}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-500 mb-1">Role</div>
                  <span
                    className={`font-medium px-3 py-1 rounded-full text-sm ${
                      user.role === "Admin"
                        ? "bg-purple-100 text-purple-800"
                        : user.role === "Manager"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                {user.departmentName && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Department</div>
                    <div className="font-medium text-gray-900">
                      {user.departmentName}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                Activity Overview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          stat.color === "blue"
                            ? "bg-blue-500"
                            : stat.color === "green"
                            ? "bg-green-500"
                            : stat.color === "orange"
                            ? "bg-orange-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      <span className="text-xs text-gray-600">
                        {stat.label}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            {user.projects && user.projects.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  Projects ({user.projects.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.projects.map((project, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm"
                    >
                      {project.name || `Project ${project.internalId}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks */}
            {user.tasks && user.tasks.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  Tasks ({user.tasks.length})
                </h3>
                <div className="space-y-2">
                  {user.tasks.slice(0, 5).map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {task.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {task.project?.name ||
                            `Project ${task.project?.internalId}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            task.stage === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : task.stage === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/80">
          <div className="flex gap-3">
            <Button
              onClick={() => {
                onClose();
                onEdit(user);
              }}
              icon={Icons.Pencil}
              label="Edit User"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-transparent"
            />
            <Button
              onClick={() => {
                onClose();
                onDelete(user);
              }}
              icon={Icons.Trash2}
              label="Delete User"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const Users = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers) || [];
  const status = useSelector(selectUserStatus);
  const error = useSelector(selectUserError);
  const isLoading = status === "loading";

  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    role: "all",
    status: "all",
    department: "all",
  });

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const loadUsers = () => {
    dispatch(fetchUsers());
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchTerm === "" ||
        user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.role?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = filters.role === "all" || user?.role === filters.role;
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "active" && user?.isActive === true) ||
        (filters.status === "inactive" && user?.isActive === false);
      const matchesDepartment =
        filters.department === "all" ||
        user?.departmentName === filters.department;

      return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
    });
  }, [users, searchTerm, filters]);

  const getUniqueValues = (field) => {
    const values = new Set(users.map((u) => u[field]).filter(Boolean));
    return Array.from(values);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({ role: "all", status: "all", department: "all" });
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setOpenViewModal(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setOpenForm(true);
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setOpenDelete(true);
  };

  const deleteHandler = async () => {
    if (!selectedUser) return;
    try {
      await dispatch(deleteUser(selectedUser.id)).unwrap();
      toast.success("User deleted successfully");
      setOpenDelete(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  const hasActiveFilters = searchTerm || 
    filters.role !== "all" || 
    filters.status !== "all" || 
    filters.department !== "all";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading team members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icons.X className="tm-icon text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load users
          </h3>
          <p className="text-gray-600 mb-6">
            {error?.message || String(error)}
          </p>
          <Button
            label="Retry Loading"
            onClick={loadUsers}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)]">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
              <p className="text-gray-600 mt-1">
                Manage your team members and their permissions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={loadUsers}
                icon={Icons.RefreshCcw}
                label=""
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 h-10 px-4"
              />

              <ViewToggle mode={viewMode} onChange={setViewMode} />

              <Button
                onClick={() => {
                  setSelectedUser(null);
                  setOpenForm(true);
                }}
                icon={Icons.Plus}
                label="Add Member"
                className="bg-blue-600 hover:bg-blue-700 text-white border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6">
        {/* Stats Cards */}
        <StatsCards users={users} />

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Icons.Search
                  className="tm-icon absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search by name, email, or role..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 font-medium min-w-[140px]"
                value={filters.role}
                onChange={(e) =>
                  setFilters({ ...filters, role: e.target.value })
                }
              >
                <option value="all">All Roles</option>
                {getUniqueValues("role").map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <select
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 font-medium min-w-[140px]"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 font-medium min-w-[140px]"
                value={filters.department}
                onChange={(e) =>
                  setFilters({ ...filters, department: e.target.value })
                }
              >
                <option value="all">All Departments</option>
                {getUniqueValues("departmentName").map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  icon={Icons.X}
                  label="Clear Filters"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                />
              )}
            </div>
          </div>
        </div>

        {/* Users Grid/List */}
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icons.Users className="tm-icon text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No members found
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {hasActiveFilters
                ? "No members match your current filters. Try adjusting your search criteria."
                : "Get started by adding your first team member."}
            </p>
            {hasActiveFilters ? (
              <Button
                onClick={clearFilters}
                icon={Icons.X}
                label="Clear all filters"
                className="text-blue-600 hover:text-blue-700 bg-transparent border-transparent hover:bg-blue-50"
              />
            ) : (
              <Button
                onClick={() => {
                  setSelectedUser(null);
                  setOpenForm(true);
                }}
                icon={Icons.Plus}
                label="Add First Member"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              />
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} onClick={handleView} />
            ))}
          </div>
        ) : (
          <div className="tm-list-container">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="py-3.5 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="py-3.5 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="py-3.5 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="py-3.5 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-3.5 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <UserListRow
                      key={user.id}
                      user={user}
                      onClick={handleView}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={openViewModal}
        onClose={() => setOpenViewModal(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AddUser open={openForm} setOpen={setOpenForm} userData={selectedUser} />
      <ConfirmationDialog
        open={openDelete}
        setOpen={setOpenDelete}
        onClick={deleteHandler}
        title="Delete Member"
        message={`Are you sure you want to remove "${selectedUser?.name}" from the team? This action cannot be undone.`}
        confirmText="Delete Member"
        confirmClassName="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default Users;