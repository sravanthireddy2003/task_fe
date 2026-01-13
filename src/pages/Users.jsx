import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Title from "../components/Title";
import Button from "../components/Button";
import clsx from "clsx";
import ConfirmatioDialog from "../components/Dialogs";
import AddUser from "../components/AddUser";
import { toast } from "sonner";

import {
  fetchUsers,
  deleteUser,
  selectUsers,
  selectUserStatus,
  selectUserError,
} from "../redux/slices/userSlice";

import { IoMdAdd } from "react-icons/io";
import {
  IoEyeOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoCloseOutline,
  IoEllipsisVertical,
  IoGridOutline,
  IoListOutline,
  IoBriefcaseOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoPeopleOutline,
  IoFilterOutline,
  IoSearchOutline,
  IoCaretDownOutline,
  IoChevronDownOutline,
  IoTimeOutline,
  IoCheckmarkDoneOutline,
} from "react-icons/io5";

const getInitials = (name = "") => {
  if (!name || typeof name !== "string") return "??";
  return name
    .split(" ")
    .map((p) => p[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
};

const getProjectStats = (user) => {
  const projects = user?.projects || [];
  const tasks = user?.tasks || [];

  // Count tasks by status/stage
  const taskStats = tasks.reduce((acc, task) => {
    const stage = task?.stage || 'UNKNOWN';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});

  const stats = [];

  // Projects stat
  if (projects.length > 0) {
    stats.push({
      label: "Projects",
      value: projects.length,
      color: "blue",
      icon: <IoBriefcaseOutline size={14} />
    });
  }

  // Tasks stat - show total tasks
  if (tasks.length > 0) {
    stats.push({
      label: "Tasks",
      value: tasks.length,
      color: "green",
      icon: <IoCheckmarkCircleOutline size={14} />
    });
  }

  // Active tasks (IN_PROGRESS, PENDING)
  const activeTasks = tasks.filter(task =>
    task?.stage === 'IN_PROGRESS' || task?.stage === 'PENDING'
  ).length;
  if (activeTasks > 0) {
    stats.push({
      label: "Active Tasks",
      value: activeTasks,
      color: "orange",
      icon: <IoTimeOutline size={14} />
    });
  }

  // Completed tasks
  const completedTasks = tasks.filter(task => task?.stage === 'COMPLETED').length;
  if (completedTasks > 0) {
    stats.push({
      label: "Completed",
      value: completedTasks,
      color: "emerald",
      icon: <IoCheckmarkDoneOutline size={14} />
    });
  }

  // If no projects or tasks, show default stats
  if (stats.length === 0) {
    return [
      { label: "Projects", value: 0, color: "blue", icon: <IoBriefcaseOutline size={14} /> },
      { label: "Tasks", value: 0, color: "green", icon: <IoCheckmarkCircleOutline size={14} /> },
    ];
  }

  return stats;
};

const Users = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers) || [];
  const status = useSelector(selectUserStatus);
  const error = useSelector(selectUserError);
  const isLoading = status === "loading";
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    role: "all",
    status: "all",
    department: "all",
    title: "all",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const filteredAndSortedUsers = useMemo(() => {
    let result = users.filter((user) => {
      const matchesSearch = searchTerm === "" ||
        user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.role?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = filters.role === "all" || user?.role === filters.role;
      const matchesStatus = filters.status === "all" ||
        (filters.status === "active" && user?.isActive === true) ||
        (filters.status === "inactive" && user?.isActive === false);
      const matchesDepartment = filters.department === "all" || user?.departmentName === filters.department;
      const matchesTitle = filters.title === "all" || user?.title === filters.title;

      return matchesSearch && matchesRole && matchesStatus && matchesDepartment && matchesTitle;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key] || "";
        let bValue = b[sortConfig.key] || "";

        if (sortConfig.key === "isActive") {
          aValue = a.isActive ? 1 : 0;
          bValue = b.isActive ? 1 : 0;
        }

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [users, searchTerm, filters, sortConfig]);

  const getFilterOptions = useCallback((field) => {
    const options = users.reduce((acc, user) => {
      const value = user[field];
      if (value && !acc.includes(value)) {
        acc.push(value);
      }
      return acc;
    }, ["all"]);
    return Array.from(new Set(options)).sort();
  }, [users]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilters({ role: "all", status: "all", department: "all", title: "all" });
    setSortConfig({ key: null, direction: "asc" });
  };

  const addClick = () => {
    setSelectedUser(null);
    setOpenForm(true);
  };

  const editClick = (user) => {
    setSelectedUser(user);
    setOpenForm(true);
  };

  const deleteClick = (user) => {
    setSelectedUser(user);
    setOpenDelete(true);
  };

  const deleteHandler = async () => {
    if (!selectedUser) return;
    try {
      const userId = selectedUser.public_id || selectedUser._id || selectedUser.id;
      await dispatch(deleteUser(userId)).unwrap();
      toast.success("User deleted successfully");
    } catch (err) {
      toast.error(err?.message || 'Delete failed');
    } finally {
      setOpenDelete(false);
      setSelectedUser(null);
    }
  };

  const UserCard = ({ user }) => {
    const stats = getProjectStats(user);

    return (
      <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 group">
        <div className="p-6">
          {/* Header with Avatar and Actions */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {getInitials(user?.name)}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  user?.isActive ? "bg-green-500" : "bg-gray-400"
                }`} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-lg truncate mb-1" title={user?.name}>
                  {user?.name}
                </h3>
                <p className="text-gray-600 text-sm truncate mb-2" title={user?.title}>
                  {user?.title || "Team Member"}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    user?.role === "Admin" ? "bg-purple-100 text-purple-800" :
                      user?.role === "Manager" ? "bg-orange-100 text-orange-800" :
                        "bg-blue-100 text-blue-800"
                  }`}>
                    {user?.role || "Member"}
                  </span>
                  {user?.departmentName && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {user?.departmentName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <IoEllipsisVertical size={18} className="text-gray-500" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button
                  className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 text-sm"
                  onClick={() => editClick(user)}
                >
                  <IoPencilOutline size={16} />
                  Edit Member
                </button>
                <button
                  className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 text-sm"
                  onClick={() => deleteClick(user)}
                >
                  <IoTrashOutline size={16} />
                  Remove Member
                </button>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 mb-6">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</div>
              <div className="text-sm text-gray-900 truncate" title={user?.email}>
                {user?.email || "No email"}
              </div>
            </div>
          </div>

          {/* Stats */}
          {stats.length > 0 && (
            <div className="space-y-3 mb-6">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Activity</div>
              <div className="grid grid-cols-2 gap-3">
                {stats.slice(0, 2).map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        stat.color === "blue" ? "bg-blue-500" :
                          stat.color === "green" ? "bg-green-500" :
                            stat.color === "orange" ? "bg-orange-500" :
                              stat.color === "emerald" ? "bg-emerald-500" : "bg-red-500"
                      }`} />
                      <span className="text-xs text-gray-600">{stat.label}</span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status and Last Activity */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className={`font-medium ${
                user?.isActive ? "text-green-700" : "text-gray-500"
              }`}>
                {user?.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            {user?.lastLogin && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-500">Last Login</span>
                <span className="text-gray-700">
                  {new Date(user.lastLogin).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const UserListRow = ({ user }) => {
    const stats = getProjectStats(user);

    return (
      <div className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {getInitials(user?.name)}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                  user?.isActive ? "bg-green-500" : "bg-gray-400"
                }`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900 truncate" title={user?.name}>
                    {user?.name}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user?.role === "Admin" ? "bg-purple-100 text-purple-800" :
                      user?.role === "Manager" ? "bg-orange-100 text-orange-800" :
                        "bg-blue-100 text-blue-800"
                  }`}>
                    {user?.role || "Member"}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-gray-600 truncate" title={user?.email}>
                    {user?.email || "No email"}
                  </span>
                  {user?.title && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-sm text-gray-600 truncate" title={user?.title}>
                        {user?.title}
                      </span>
                    </>
                  )}
                  {user?.departmentName && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-sm text-gray-600 truncate" title={user?.departmentName}>
                        {user?.departmentName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Stats */}
              {stats.length > 0 && (
                <div className="hidden md:flex items-center gap-6">
                  {stats.slice(0, 2).map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          stat.color === "blue" ? "bg-blue-500" :
                            stat.color === "green" ? "bg-green-500" :
                              stat.color === "orange" ? "bg-orange-500" :
                                stat.color === "emerald" ? "bg-emerald-500" : "bg-red-500"
                        }`} />
                        <span className="text-xs text-gray-500">{stat.label}</span>
                      </div>
                      <span className="font-semibold text-gray-900 text-sm">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Status */}
              <div className="text-right">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  user?.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {user?.isActive ? "Active" : "Inactive"}
                </span>
                {user?.lastLogin && (
                  <div className="text-xs text-gray-500 mt-1">
                    Last login: {new Date(user.lastLogin).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="relative">
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <IoEllipsisVertical size={16} className="text-gray-500" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20 opacity-0 invisible hover:opacity-100 hover:visible transition-all duration-200">
                  <button
                    className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 text-sm"
                    onClick={() => editClick(user)}
                  >
                    <IoPencilOutline size={16} />
                    Edit Member
                  </button>
                  <button
                    className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 text-sm"
                    onClick={() => deleteClick(user)}
                  >
                    <IoTrashOutline size={16} />
                    Remove Member
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading team members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-12 text-center max-w-2xl mx-auto">
        <IoCloseOutline className="mx-auto mb-6 text-red-400" size={56} />
        <h3 className="text-2xl font-bold text-red-800 mb-3">Failed to load users</h3>
        <p className="text-red-600 mb-8 text-lg">
          {error?.message || String(error)}
        </p>
        <Button
          label="Retry Loading"
          className="bg-red-600 hover:bg-red-700 text-white px-10 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          onClick={() => dispatch(fetchUsers())}
        />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section - Bitrix Style */}
        <div className="bg-white border-b border-gray-200 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Team Members</h1>
                <p className="text-lg text-gray-600">Manage your team members, roles, and permissions</p>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">{users.filter(u => u?.isActive).length} Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="font-medium">{users.filter(u => !u?.isActive).length} Inactive</span>
                  </div>
                  <div className="text-gray-300">•</div>
                  <span className="font-medium text-gray-700">{users.length} Total Members</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* View Toggle - Bitrix Style */}
                <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2.5 rounded-md transition-all duration-200 ${
                      viewMode === "grid"
                        ? "bg-white shadow-sm text-blue-600 border border-gray-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                    }`}
                    title="Grid View"
                  >
                    <IoGridOutline size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2.5 rounded-md transition-all duration-200 ${
                      viewMode === "list"
                        ? "bg-white shadow-sm text-blue-600 border border-gray-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                    }`}
                    title="List View"
                  >
                    <IoListOutline size={18} />
                  </button>
                </div>

                {/* Primary Action Button - Bitrix Style */}
                <button
                  onClick={addClick}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <IoMdAdd size={18} />
                  <span>Invite Member</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Search and Filters Section - Bitrix Style */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
              {/* Search Input - Bitrix Style */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <IoSearchOutline className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search members by name, email, role, or department..."
                    className="block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <IoCloseOutline size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Filters - Bitrix Style */}
              <div className="flex items-center gap-3">
                <select
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm bg-white min-w-[140px]"
                  value={filters.role}
                  onChange={(e) => updateFilter("role", e.target.value)}
                >
                  <option value="all">All Roles</option>
                  {getFilterOptions("role").filter(r => r !== "all").map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>

                <select
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm bg-white min-w-[120px]"
                  value={filters.status}
                  onChange={(e) => updateFilter("status", e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center gap-2 px-4 py-3 border rounded-lg transition-all duration-200 text-sm font-medium ${
                    showFilters
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <IoFilterOutline size={16} />
                  <span>More Filters</span>
                  <IoCaretDownOutline
                    size={14}
                    className={`transition-transform duration-200 ${
                      showFilters ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {(searchTerm || Object.values(filters).some(f => f !== "all") || sortConfig.key) && (
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-300"
                  >
                    <IoCloseOutline size={14} />
                    <span>Clear ({filteredAndSortedUsers.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Advanced Filters - Bitrix Style */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900">Department</label>
                    <select
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm bg-white"
                      value={filters.department}
                      onChange={(e) => updateFilter("department", e.target.value)}
                    >
                      <option value="all">All Departments</option>
                      {getFilterOptions("departmentName").filter(d => d !== "all").map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900">Job Title</label>
                    <select
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm bg-white"
                      value={filters.title}
                      onChange={(e) => updateFilter("title", e.target.value)}
                    >
                      <option value="all">All Titles</option>
                      {getFilterOptions("title").filter(t => t !== "all").map((title) => (
                        <option key={title} value={title}>{title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900">Sort By</label>
                    <select
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm bg-white"
                      value={sortConfig.key || ""}
                      onChange={(e) => {
                        const key = e.target.value;
                        if (key) {
                          setSortConfig({ key, direction: "asc" });
                        } else {
                          setSortConfig({ key: null, direction: "asc" });
                        }
                      }}
                    >
                      <option value="">Default</option>
                      <option value="name">Name</option>
                      <option value="title">Title</option>
                      <option value="role">Role</option>
                      <option value="departmentName">Department</option>
                      <option value="isActive">Status</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* View Toggle and Results */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredAndSortedUsers.length}</span> of{' '}
                <span className="font-semibold text-gray-900">{users.length}</span> team members
                {sortConfig.key && (
                  <span className="ml-3 text-gray-500">
                    • Sorted by <span className="font-medium capitalize">{sortConfig.key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="ml-1">({sortConfig.direction})</span>
                  </span>
                )}
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 mr-2">View:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      viewMode === "grid"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    title="Grid View"
                  >
                    <IoGridOutline size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      viewMode === "list"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    title="List View"
                  >
                    <IoListOutline size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Display */}
        {filteredAndSortedUsers.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <IoPeopleOutline className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || Object.values(filters).some(f => f !== "all")
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Get started by inviting your first team member."}
            </p>
            {(searchTerm || Object.values(filters).some(f => f !== "all")) && (
              <Button
                label="Clear Filters"
                onClick={clearAllFilters}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
              />
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedUsers.map((user) => (
              <UserCard key={user.public_id || user._id || user.id} user={user} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {filteredAndSortedUsers.map((user) => (
              <UserListRow key={user.public_id || user._id || user.id} user={user} />
            ))}
          </div>
        )}
      </div>
      </div>

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
        message={`Are you sure you want to remove "${selectedUser?.name || 'this user'}" from the team? This action cannot be undone.`}
        confirmText="Remove Member"
        confirmClassName="bg-red-600 hover:bg-red-700 text-white"
      />
    </>
  );
};

export default Users;
