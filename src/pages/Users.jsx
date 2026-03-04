import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "../components/Button";
import ViewToggle from "../components/ViewToggle";
import GridCard from "../components/ui/GridCard";
import ConfirmationDialog from "../components/Dialogs";
import AddUser from "../components/AddUser";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import { toast } from "sonner";
import {
  fetchUsers,
  deleteUser,
  selectUsers,
  selectUserStatus,
  selectUserError,
} from "../redux/slices/userSlice";
import * as Icons from '../icons';

// Clean SaaS Stats Cards
const StatsCards = ({ users }) => {
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const inactiveUsers = totalUsers - activeUsers;

  const stats = [
    { label: "Total Members", value: totalUsers, icon: Icons.Users, trend: "+12%", color: "text-emerald-500" },
    { label: "Active Members", value: activeUsers, icon: Icons.Users, trend: "+8%", color: "text-emerald-500" },
    { label: "Inactive Members", value: inactiveUsers, icon: Icons.Users, trend: "", color: "" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between min-h-[140px] shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-[#fff3ec] rounded-xl flex items-center justify-center">
                <Icon className="w-6 h-6 text-[#ef5a15]" strokeWidth={1.5} />
              </div>
              {stat.trend && <span className={`text-sm font-semibold ${stat.color}`}>{stat.trend}</span>}
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Clean SaaS Avatar
const UserAvatar = ({ user, size = "md" }) => {
  const sizes = { sm: "w-10 h-10 text-sm", md: "w-12 h-12 text-base", lg: "w-16 h-16 text-xl" };

  const getInitials = (n = "") => n ? n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";

  const getStyle = (name) => {
    if (!name) return "bg-indigo-100 text-indigo-600";
    const i = name.charAt(0).toUpperCase();
    if (['A', 'F', 'K', 'P', 'U', 'Z'].includes(i)) return "bg-purple-100 text-purple-600";
    if (['B', 'G', 'L', 'Q', 'V'].includes(i)) return "bg-emerald-100 text-emerald-600";
    if (['C', 'H', 'M', 'R', 'W'].includes(i)) return "bg-blue-100 text-blue-600";
    if (['D', 'I', 'N', 'S', 'X'].includes(i)) return "bg-pink-100 text-pink-600";
    if (['E', 'J', 'O', 'T', 'Y'].includes(i)) return "bg-orange-100 text-orange-600";
    return "bg-indigo-100 text-indigo-600";
  };

  return (
    <div className="relative inline-block">
      <div className={`${sizes[size]} rounded-full ${getStyle(user?.name)} flex items-center justify-center font-medium`}>
        {getInitials(user?.name)}
      </div>
      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${user?.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
    </div>
  );
};

// Clean SaaS Grid Card
const UserCard = ({ user, onClick }) => {
  return (
    <div
      className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
      onClick={() => onClick(user)}
    >
      <div className="flex items-start justify-between mb-4">
        <UserAvatar user={user} size="lg" />
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wider ${user?.role === "Admin" ? "bg-purple-50 text-purple-600" :
            user?.role === "Manager" ? "bg-blue-50 text-blue-600" :
              "bg-gray-100 text-gray-600"
            }`}
        >
          {user?.role}
        </span>
      </div>
      <div className="flex-1">
        <h3 className="text-card-title mb-1">{user?.name}</h3>
        <p className="text-gray-500 font-medium text-small-text mb-5">{user?.title || user?.role}</p>

        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm">
            <Icons.Mail className="w-4 h-4 mr-3 text-gray-400" />
            <span className="text-gray-600 truncate">{user?.email}</span>
          </div>
          {user?.phone && (
            <div className="flex items-center text-sm">
              <Icons.Smartphone className="w-4 h-4 mr-3 text-gray-400" />
              <span className="text-gray-600">{user?.phone}</span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-5 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${user?.isActive ? "bg-emerald-500" : "bg-gray-400"}`}></div>
          <span className={`text-sm font-bold ${user?.isActive ? "text-emerald-600" : "text-gray-500"}`}>
            {user?.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <button className="text-gray-400 hover:text-blue-600 transition-colors">
          <Icons.Eye className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// Clean SaaS List Row
const UserListRow = ({ user, onClick }) => {
  return (
    <tr onClick={() => onClick(user)} className="cursor-pointer">
      <td>
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size="md" />
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 truncate">{user?.name}</div>
            <div className="text-gray-500 truncate mt-0.5">{user?.title || user?.role}</div>
          </div>
        </div>
      </td>
      <td>
        <span className="truncate max-w-[220px] block">{user?.email}</span>
      </td>
      <td>
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wider ${user?.role === "Admin" ? "bg-purple-50 text-purple-600" :
            user?.role === "Manager" ? "bg-blue-50 text-blue-600" :
              "bg-gray-100 text-gray-600"
            }`}
        >
          {user?.role}
        </span>
      </td>
      <td>{user?.departmentName || "-"}</td>
      <td>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${user?.isActive ? "bg-emerald-500" : "bg-gray-400"}`}></div>
          <span className={`font-semibold ${user?.isActive ? "text-emerald-600" : "text-gray-500"}`}>
            {user?.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </td>
      <td className="text-right">
        <button className="text-gray-400 hover:text-blue-600 transition-colors inline-block align-middle">
          <Icons.Eye className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
};

// Clean SaaS Modal
const UserDetailsModal = ({ user, isOpen, onClose, onEdit, onDelete }) => {
  if (!isOpen || !user) return null;

  const stats = [
    { label: "Projects", value: user.projects?.length || 0 },
    { label: "Total Tasks", value: user.tasks?.length || 0 },
    { label: "Completed", value: user.tasks?.filter(t => t.stage === "COMPLETED").length || 0 },
    { label: "In Progress", value: user.tasks?.filter(t => t.stage === "IN_PROGRESS" || t.stage === "PENDING").length || 0 },
  ];

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 transition-opacity">
      <div className="bg-white rounded-2xl w-full max-w-[500px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-none flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-4">
            <UserAvatar user={user} size="lg" />
            <div>
              <h2 className="text-section-title">{user.name}</h2>
              <p className="text-sm font-medium text-gray-500">{user.title || user.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-white custom-scrollbar border-b border-gray-100 relative min-h-0">
          <div className="space-y-6">
            <div>
              <h3 className="text-[14px] font-bold text-gray-900 mb-3">Contact Information</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-3.5 flex items-center gap-4 border border-gray-100">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Icons.Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-gray-500 mb-0.5">Email Address</p>
                    <p className="text-[13px] font-bold text-gray-900 truncate">{user.email}</p>
                  </div>
                </div>
                {user.phone && (
                  <div className="bg-gray-50 rounded-xl p-3.5 flex items-center gap-4 border border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Icons.Smartphone className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-gray-500 mb-0.5">Phone Number</p>
                      <p className="text-[13px] font-bold text-gray-900 truncate">{user.phone}</p>
                    </div>
                  </div>
                )}
                {user.departmentName && (
                  <div className="bg-gray-50 rounded-xl p-3.5 flex items-center gap-4 border border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Icons.Briefcase className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-gray-500 mb-0.5">Department</p>
                      <p className="text-[13px] font-bold text-gray-900 truncate">{user.departmentName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-gray-900 mb-3">Activity Overview</h3>
              <div className="grid grid-cols-2 gap-3">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                    <p className="text-[12px] font-medium text-gray-500 mb-2">{stat.label}</p>
                    <p className="text-card-title">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
            {user.projects && user.projects.length > 0 && (
              <div>
                <h3 className="text-[14px] font-bold text-gray-900 mb-3">Projects ({user.projects.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {user.projects.map((project, index) => (
                    <span key={index} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[13px] font-semibold">
                      {project.name || `Project ${project.internalId}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer Actions */}
        <div className="flex-none p-5 bg-white flex gap-3 border-t border-gray-100">
          <Button onClick={() => { onClose(); onEdit(user); }} label="Edit Profile" className="btn btn-primary flex-1" />
          <Button onClick={() => { onClose(); onDelete(user); }} label="Remove User" className="btn btn-secondary flex-1" />
        </div>
      </div>
    </div>
  );
};

// Main Component (unchanged logic, only JSX styling updated)
const Users = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers) || [];
  const status = useSelector(selectUserStatus);
  const error = useSelector(selectUserError);
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

  const isInitialLoading = status === "loading" && users.length === 0;

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const loadUsers = async () => {
    try {
      await dispatch(fetchUsers()).unwrap();
      toast.success("Users list refreshed successfully");
    } catch (err) {
      toast.error("Failed to refresh users");
    }
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
      const idToSend = selectedUser._id || selectedUser.id || selectedUser.public_id;
      await dispatch(deleteUser(idToSend)).unwrap();
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

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading team members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Icons.X className="text-red-600" />
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
    <div className="space-y-6">
      <PageHeader
        title="Team Members"
        subtitle="Manage your team members and their account permissions"
        onRefresh={loadUsers}
        refreshing={status === 'loading'}
      >
        <Button
          onClick={() => {
            setSelectedUser(null);
            setOpenForm(true);
          }}
          icon={Icons.UserPlus}
          label="Add Member"
          className="btn btn-primary"
        />
      </PageHeader>

      <StatsCards users={users} />

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full lg:max-w-md pl-2">
          <Icons.Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search members..."
            className="w-full pl-12 pr-4 py-2 bg-transparent focus:outline-none text-sm text-gray-700 placeholder-gray-400 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pr-2 pb-2 lg:pb-0">
          <select
            className="input !w-auto h-10 py-0"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="all">All Roles</option>
            {getUniqueValues("role").map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          <select
            className="input !w-auto h-10 py-0"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            className="input !w-auto h-10 py-0"
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          >
            <option value="all">All Departments</option>
            {getUniqueValues("departmentName").map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Clear Filters"
            >
              <Icons.X className="w-4 h-4" />
            </button>
          )}

          <div className="h-6 w-px bg-gray-200 mx-1 hidden lg:block"></div>

          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icons.Users className="text-blue-600 w-8 h-8" />
          </div>
          <h3 className="text-section-title mb-2">No members found</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {hasActiveFilters
              ? "No members match your current filters. Try adjusting your search criteria."
              : "Get started by adding your first team member."}
          </p>
          {hasActiveFilters ? (
            <Button
              onClick={clearFilters}
              icon={Icons.X}
              label="Clear all filters"
              className="btn btn-secondary"
            />
          ) : (
            <Button
              onClick={() => {
                setSelectedUser(null);
                setOpenForm(true);
              }}
              icon={Icons.UserPlus}
              label="Add First Member"
              className="btn btn-primary"
            />
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((user) => (
            <UserCard key={user.id || user._id} user={user} onClick={handleView} />
          ))}
        </div>
      ) : (
        <div className="tm-list-container overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tm-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <UserListRow key={user.id || user._id} user={user} onClick={handleView} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
        msg={`Are you sure you want to remove "${selectedUser?.name}" from the team?`}
      />
    </div>
  );

};

export default Users;
