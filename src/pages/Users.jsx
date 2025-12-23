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
  const stats = [
    { label: "Projects", value: Math.floor(Math.random() * 5) + 1, color: "blue", icon: <IoBriefcaseOutline size={14} /> },
    { label: "Tasks", value: Math.floor(Math.random() * 10) + 2, color: "green", icon: <IoCheckmarkCircleOutline size={14} /> },
    { label: "Issues", value: Math.floor(Math.random() * 3), color: "red", icon: <IoAlertCircleOutline size={14} /> },
  ];

  if (user?.name?.includes("Frank")) {
    return [{ label: "Projects & Tasks", value: "2 Projects & 6 Task active", color: "blue", icon: <IoBriefcaseOutline size={14} /> }];
  }
  if (user?.name?.includes("Willib")) {
    return [{ label: "Issues", value: "11 issues active", color: "red", icon: <IoAlertCircleOutline size={14} /> }];
  }
  if (user?.name?.includes("Elaine")) {
    return [{ label: "Projects & Tasks", value: "5 Project & 7 tasks active", color: "blue", icon: <IoBriefcaseOutline size={14} /> }];
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
      <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 p-6 h-full transition-all duration-300 hover:-translate-y-1">
        <div className="flex justify-between items-start mb-6 pb-1">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 text-lg truncate" title={user?.name}>{user?.name}</h3>
              <p className="text-sm text-gray-500 truncate" title={user?.title}>{user?.title || "Team Member"}</p>
            </div>
          </div>

          <div className="flex-shrink-0 ml-2">
            <div className="relative">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors group-hover:bg-gray-50">
                <IoEllipsisVertical size={20} className="text-gray-500" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button
                  className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3"
                  onClick={() => editClick(user)}
                >
                  <IoPencilOutline size={16} />
                  Edit Member
                </button>
                <button
                  className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-3"
                  onClick={() => deleteClick(user)}
                >
                  <IoTrashOutline size={16} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">Role</p>
            <span className={clsx(
              "inline-block px-3 py-1 rounded-full text-xs font-semibold",
              user?.role === "Admin" ? "bg-purple-100 text-purple-800" :
                user?.role === "Manager" ? "bg-orange-100 text-orange-800" :
                  "bg-emerald-100 text-emerald-800"
            )}>
              {user?.role || "Member"}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">Department</p>
            <p className="font-medium text-gray-900 text-sm truncate" title={user?.departmentName}>
              {user?.departmentName || "Not assigned"}
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={clsx(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  stat.color === "blue" ? "bg-blue-500" :
                    stat.color === "green" ? "bg-green-500" : "bg-red-500"
                )} />
                <span className="text-sm text-gray-600 truncate">{stat.label}</span>
              </div>
              <span className="font-semibold text-gray-900 text-sm min-w-[80px] text-right">
                {typeof stat.value === 'string' ? stat.value : `${stat.value} active`}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={clsx(
                "w-2 h-2 rounded-full",
                user?.isActive ? "bg-green-500" : "bg-amber-500"
              )} />
              <span className="text-sm text-gray-600 font-medium">Status</span>
            </div>
            <span className={clsx(
              "font-semibold text-sm px-2 py-1 rounded-full",
              user?.isActive ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
            )}>
              {user?.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="text-xs text-gray-500 truncate font-medium" title={user?.email}>
            {user?.email || "No email"}
          </div>
        </div>
      </div>
    );
  };

  const UserListRow = ({ user }) => {
    const stats = getProjectStats(user);

    return (
      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
        <td className="py-4 pl-6 pr-4 w-64">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 text-sm truncate" title={user?.name}>{user?.name}</div>
              <div className="text-xs text-gray-500 truncate" title={user?.email}>{user?.email}</div>
            </div>
          </div>
        </td>

        <td className="py-4 px-4 w-48">
          <div className="text-sm text-gray-700 font-medium truncate" title={user?.title}>{user?.title || "-"}</div>
        </td>

        <td className="py-4 px-4 w-32">
          <span className={clsx(
            "inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
            user?.role === "Admin" ? "bg-purple-100 text-purple-800" :
              user?.role === "Manager" ? "bg-orange-100 text-orange-800" :
                "bg-emerald-100 text-emerald-800"
          )}>
            {user?.role || "Member"}
          </span>
        </td>

        <td className="py-4 px-4 w-48">
          <div className="text-sm text-gray-700 truncate" title={user?.departmentName}>{user?.departmentName || "-"}</div>
        </td>

        <td className="py-4 px-4 w-60">
          <div className="space-y-1">
            {stats.map((stat, statIndex) => (
              <div key={statIndex} className="flex items-center  justify-around h-5">
                <div className="flex items-center gap-1 min-w-0">
                  <div className={clsx(
                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                    stat.color === "blue" ? "bg-blue-500" :
                      stat.color === "green" ? "bg-green-500" : "bg-red-500"
                  )} />
                  <span className="text-xs text-gray-600 font-medium truncate">
                    {stat.label}
                  </span>
                </div>

                <span className="text-xs font-semibold text-gray-900 whitespace-nowrap ml-1">
                  {typeof stat.value === 'string' ? stat.value : stat.value}
                </span>
              </div>
            ))}
          </div>
        </td>

        <td className="py-4 px-4 w-32">
          <div className="flex items-center gap-2">
            <div className={clsx(
              "w-2 h-2 rounded-full flex-shrink-0",
              user?.isActive ? "bg-green-500" : "bg-amber-500"
            )} />
            <span className={clsx(
              "text-sm font-medium whitespace-nowrap",
              user?.isActive ? "text-green-600" : "text-amber-600"
            )}>
              {user?.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </td>

        <td className="py-4 pr-6 pl-4 w-32 text-right">
          <div className="flex items-center justify-end gap-1">
            <button
              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-all duration-200"
              title="Edit User"
              onClick={() => editClick(user)}
            >
              <IoPencilOutline size={16} />
            </button>
            <button
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-all duration-200"
              title="Delete User"
              onClick={() => deleteClick(user)}
            >
              <IoTrashOutline size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const TableHeader = () => (
    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 sticky top-0 z-10">
      <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
        <th
          className="py-3.5 pl-6 pr-4 font-semibold cursor-pointer group w-64"
          onClick={() => handleSort('name')}
        >
          <div className="flex items-center gap-2 group-hover:text-gray-900">
            User
            {sortConfig.key === 'name' && (
              <IoChevronDownOutline
                size={14}
                className={clsx("transition-transform", sortConfig.direction === 'desc' && 'rotate-180')}
              />
            )}
          </div>
        </th>
        <th
          className="py-3.5 px-4 font-semibold cursor-pointer group w-48"
          onClick={() => handleSort('title')}
        >
          <div className="flex items-center gap-2 group-hover:text-gray-900">
            Title
            {sortConfig.key === 'title' && (
              <IoChevronDownOutline
                size={14}
                className={clsx("transition-transform", sortConfig.direction === 'desc' && 'rotate-180')}
              />
            )}
          </div>
        </th>
        <th className="py-3.5 px-4 font-semibold w-32">Role</th>
        <th
          className="py-3.5 px-4 font-semibold cursor-pointer group w-48"
          onClick={() => handleSort('departmentName')}
        >
          <div className="flex items-center gap-2 group-hover:text-gray-900">
            Department
            {sortConfig.key === 'departmentName' && (
              <IoChevronDownOutline
                size={14}
                className={clsx("transition-transform", sortConfig.direction === 'desc' && 'rotate-180')}
              />
            )}
          </div>
        </th>
        <th className="py-3.5 px-4 font-semibold w-72">Project Activity</th>
        <th
          className="py-3.5 px-4 font-semibold cursor-pointer group w-32"
          onClick={() => handleSort('isActive')}
        >
          <div className="flex items-center gap-2 group-hover:text-gray-900">
            Status
            {sortConfig.key === 'isActive' && (
              <IoChevronDownOutline
                size={14}
                className={clsx("transition-transform", sortConfig.direction === 'desc' && 'rotate-180')}
              />
            )}
          </div>
        </th>
        <th className="py-3.5 pr-6 text-right font-semibold w-32">Actions</th>
      </tr>
    </thead>
  );

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
      <div className="space-y-6 p-1">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <Title title="Team Members" />
            <p className="text-gray-600 mt-1">Manage your team members and their permissions ({users.length} total)</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-xl border">
              <button
                onClick={() => setViewMode("grid")}
                className={clsx(
                  "p-2.5 rounded-lg transition-all flex items-center justify-center text-sm font-medium",
                  viewMode === "grid"
                    ? "bg-white shadow-sm text-blue-600 border border-blue-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white"
                )}
                title="Grid View"
              >
                <IoGridOutline size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={clsx(
                  "p-2.5 rounded-lg transition-all flex items-center justify-center text-sm font-medium",
                  viewMode === "list"
                    ? "bg-white shadow-sm text-blue-600 border border-blue-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white"
                )}
                title="List View"
              >
                <IoListOutline size={18} />
              </button>
            </div>

            <Button
              label="Invite Members"
              icon={<IoMdAdd className="ml-2" size={18} />}
              onClick={addClick}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center">
            <div className="flex-1">
              <div className="relative">
                <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, email, title, role, or department..."
                  className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors"
                  >
                    <IoCloseOutline size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium"
              >
                <IoFilterOutline size={18} />
                <span>Filters</span>
                <IoCaretDownOutline
                  size={16}
                  className={clsx("transition-transform duration-200",
                    showFilters && "rotate-180"
                  )}
                />
              </button>

              {(searchTerm || Object.values(filters).some(f => f !== "all") || sortConfig.key) && (
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all border border-gray-200"
                >
                  Clear All ({filteredAndSortedUsers.length})
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Role</label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                    value={filters.role}
                    onChange={(e) => updateFilter("role", e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    {getFilterOptions("role").map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Status</label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                    value={filters.status}
                    onChange={(e) => updateFilter("status", e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Department</label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                    value={filters.department}
                    onChange={(e) => updateFilter("department", e.target.value)}
                  >
                    <option value="all">All Departments</option>
                    {getFilterOptions("departmentName").map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-2 xl:col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Title</label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                    value={filters.title}
                    onChange={(e) => updateFilter("title", e.target.value)}
                  >
                    <option value="all">All Titles</option>
                    {getFilterOptions("title").map((title) => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm">
          <div className="text-gray-700">
            Showing <span className="font-bold text-gray-900">{filteredAndSortedUsers.length}</span> of{' '}
            <span className="font-bold text-gray-900">{users.length}</span> members
            {sortConfig.key && (
              <span className="ml-4 text-xs text-gray-500">
                Sorted by <span className="font-medium">{sortConfig.key}</span> ({sortConfig.direction})
              </span>
            )}
          </div>
        </div>

        {filteredAndSortedUsers.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-3xl p-20 text-center">
            <IoPeopleOutline className="w-24 h-24 text-gray-300 mx-auto mb-8" />
            <h3 className="text-3xl font-bold text-gray-900 mb-4">No members match your criteria</h3>
            <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
              {searchTerm || Object.values(filters).some(f => f !== "all")
                ? "Try adjusting your search or filter options to find team members."
                : "Your team is looking empty. Add your first member to get started!"}
            </p>
            <Button
              label={searchTerm || Object.values(filters).some(f => f !== "all") ? "Clear All Filters" : "Add First Member"}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-12 py-4 rounded-2xl font-bold shadow-2xl hover:shadow-3xl text-lg transition-all duration-300"
              onClick={clearAllFilters}
            />
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredAndSortedUsers.map((user) => (
              <UserCard
                key={user?.public_id || user?._id || user?.id}
                user={user}
              />
            ))}

            <div
              className="group bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col items-center justify-center h-full hover:scale-[1.02]"
              onClick={addClick}
            >
              <div className="w-20 h-20 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-dashed border-blue-200 flex items-center justify-center mb-6 group-hover:bg-white group-hover:border-blue-300 transition-all">
                <IoMdAdd className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Add New Member</h3>
              <p className="text-gray-600 text-lg">Invite a new team member to collaborate</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <TableHeader />
                <tbody className="divide-y divide-gray-100">
                  {filteredAndSortedUsers.map((user) => (
                    <UserListRow
                      key={user?.public_id || user?._id || user?.id}
                      user={user}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className="border-t border-gray-100 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 hover:bg-blue-50 transition-all duration-300 cursor-pointer group"
              onClick={addClick}
            >
              <div className="flex items-center gap-4 max-w-md mx-auto">
                <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-white border-2 border-dashed border-blue-200 flex items-center justify-center group-hover:border-blue-400 transition-all shadow-sm">
                  <IoMdAdd className="w-7 h-7 text-blue-500 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Add New Member</h3>
                  <p className="text-gray-600 text-sm mt-1">Click to invite someone to your team</p>
                </div>
              </div>
            </div>
          </div>
        )}
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
