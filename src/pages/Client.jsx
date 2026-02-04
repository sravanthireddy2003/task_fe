import React, { useState, useEffect } from "react";
import * as Icons from "../icons";
import { useDispatch, useSelector } from "react-redux";
import Table from "../components/client/EditInClient";
import ClientForm from "../components/client/ClientForm";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import {
  fetchClients,
  deleteClient,
  selectClients,
  selectClientStatus,
  selectClientError
} from "../redux/slices/clientSlice";
import { fetchUsers, selectUsers } from "../redux/slices/userSlice";
import clsx from "clsx";
import ViewToggle from "../components/ViewToggle";

const Clients = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  
  const clients = useSelector(selectClients);
  const status = useSelector(selectClientStatus);
  const error = useSelector(selectClientError);
  const users = useSelector(selectUsers);

  const [openClientForm, setOpenClientForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchClients()),
        dispatch(fetchUsers({ role: "Manager" }))
      ]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const handleDelete = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await dispatch(deleteClient(clientId)).unwrap();
      } catch (error) {
        console.error("Failed to delete client:", error);
      }
    }
  };

  const managers = users.filter((u) =>
    (u.role || "").toLowerCase().includes("manager")
  );

  const filteredClients = clients.filter((client) => {
    const searchMatch =
      !searchQuery ||
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "active" && !client.isDeleted) ||
      (statusFilter === "deleted" && client.isDeleted);

    const managerMatch =
      managerFilter === "all" ||
      (client.manager_public_id || client.managerId) === managerFilter;

    return searchMatch && statusMatch && managerMatch;
  });

  const stats = {
    total: clients.length,
    active: clients.filter(c => !c.isDeleted).length,
    deleted: clients.filter(c => c.isDeleted).length
  };

  // Client Card Component for Grid View
  const ClientCard = ({ client }) => (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 font-bold text-base">
              {client.name?.charAt(0)?.toUpperCase() || 'C'}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{client.name}</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
              <Icons.Building2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{client.company || "No company"}</span>
            </p>
          </div>
        </div>
        <span className={clsx(
          "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
          client.isDeleted 
            ? "bg-red-50 text-red-700" 
            : "bg-green-50 text-green-700"
        )}>
          {client.isDeleted ? (
            <Icons.XCircle className="tm-icon" />
          ) : (
            <Icons.CheckCircle2 className="tm-icon" />
          )}
          <span className="hidden sm:inline">{client.isDeleted ? "Deleted" : "Active"}</span>
        </span>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Icons.Mail className="tm-icon text-gray-400" />
          <span className="truncate">{client.email || "No email"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Icons.Phone className="tm-icon text-gray-400" />
          <span>{client.phone || "No phone"}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between">
          <div className="text-xs">
            <p className="text-gray-500">Manager</p>
            <p className="font-medium text-gray-900 flex items-center gap-1">
              <Icons.User2 className="tm-icon text-gray-400" />
              {client.managerName?.split(" ")[0] || "Unassigned"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(`/client-dashboard/${client.id}`)}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition-colors icon-center"
              title="View"
            >
              <Icons.Eye className="tm-icon" />
            </button>
            <button
              onClick={() => {
                setSelectedClient(client);
                setOpenClientForm(true);
              }}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition-colors icon-center"
              title="Edit"
            >
              <Icons.Pencil className="tm-icon" />
            </button>
            <button
              onClick={() => handleDelete(client.id)}
              className="p-1.5 hover:bg-red-50 rounded text-gray-500 hover:text-red-600 transition-colors icon-center"
              title="Delete"
            >
              <Icons.Trash2 className="tm-icon" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );

  if (status === "loading" && !isRefreshing) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-40"></div>
              <div className="h-4 bg-gray-200 rounded w-56"></div>
            </div>
            <div className="h-9 bg-gray-200 rounded-lg w-28"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded-lg"></div>
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg border border-red-200 p-6 text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icons.Trash2 className="tm-icon" />
              </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">Failed to load clients</h3>
            <p className="text-sm text-gray-600 mb-4">{error || 'An error occurred'}</p>
            <button
              onClick={loadData}
              className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1.5"
            >
              <Icons.RefreshCcw className="tm-icon" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const createdMsg = location?.state?.message;

  return (
    <div className="p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <PageHeader
          title="Clients"
          subtitle="Manage your client portfolio"
          onRefresh={loadData}
          refreshing={isRefreshing}
        >
          <div className="flex items-center gap-2">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <button
              onClick={() => {
                setSelectedClient(null);
                setOpenClientForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1.5"
            >
              <Icons.Plus className="tm-icon" />
              Add Client
            </button>
          </div>
        </PageHeader>

        {/* Stats Grid - Consistent KPI Style */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 p-5 flex flex-col gap-3 min-h-[120px]">
            <div className="flex items-start justify-between gap-3">
              <div className="p-2.5 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icons.Building2 className="w-5 h-5 text-gray-700 flex-shrink-0" />
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-1 justify-end">
              <span className="text-2xl font-bold text-gray-900 leading-tight">
                {stats.total}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Total Clients
              </span>
            </div>
          </div>
          
          <div className="group relative overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 p-5 flex flex-col gap-3 min-h-[120px]">
            <div className="flex items-start justify-between gap-3">
              <div className="p-2.5 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icons.CheckCircle2 className="w-5 h-5 text-gray-700 flex-shrink-0" />
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-1 justify-end">
              <span className="text-2xl font-bold text-gray-900 leading-tight">
                {stats.active}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Active
              </span>
            </div>
          </div>
          
          <div className="group relative overflow-hidden rounded-2xl border border-red-200 bg-red-50/60 hover:border-red-300 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 p-5 flex flex-col gap-3 min-h-[120px]">
            <div className="flex items-start justify-between gap-3">
              <div className="p-2.5 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icons.Trash2 className="w-5 h-5 text-gray-700 flex-shrink-0" />
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-1 justify-end">
              <span className="text-2xl font-bold text-gray-900 leading-tight">
                {stats.deleted}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Deleted
              </span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Icons.Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, company, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-3 pr-9 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="deleted">Deleted</option>
                </select>
                <Icons.ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
              </div>

              <div className="relative">
                <select
                  value={managerFilter}
                  onChange={(e) => setManagerFilter(e.target.value)}
                  className="w-full pl-3 pr-9 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                >
                  <option value="all">All Managers</option>
                  {managers.map((manager, idx) => {
                    const mgrId = manager.public_id || manager._id || manager.id || manager.publicId || manager.email || `mgr-${idx}`;
                    return (
                      <option key={mgrId} value={mgrId}>
                        {manager.name}
                      </option>
                    );
                  })}
                </select>
                <Icons.ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{filteredClients.length}</span> of{" "}
            <span className="font-medium text-gray-900">{clients.length}</span> clients
          </div>
          
          {(searchQuery || statusFilter !== "all" || managerFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setManagerFilter("all");
              }}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Success Message */}
        {createdMsg && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Success</p>
                <p className="text-xs text-green-700">{createdMsg}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {filteredClients.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Icons.Building2 className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">
              {searchQuery || statusFilter !== "all" || managerFilter !== "all"
                ? "No clients found"
                : "No clients yet"}
            </h3>
            <p className="text-sm text-gray-600 mb-4 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "all" || managerFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Add your first client to get started"}
            </p>
            <Link to="/add-client">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1.5">
                <Icons.Plus className="tm-icon" />
                Add First Client
              </button>
            </Link>
          </div>
        ) : viewMode === "grid" ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredClients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
              
              {/* Add Client Card */}
              <div
                onClick={() => {
                  setSelectedClient(null);
                  setOpenClientForm(true);
                }}
                className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[280px]"
              >
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center mb-3 bg-white">
                  <Icons.Plus className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Add New Client</h3>
                <p className="text-xs text-gray-600">Click to create</p>
              </div>
            </div>
          </>
        ) : (
          <div className="tm-list-container">
            <div className="overflow-x-auto">
              <Table
                clients={filteredClients}
                onEdit={(client) => {
                  setSelectedClient(client);
                  setOpenClientForm(true);
                }}
                onRowClick={(client) => navigate(`/client-dashboard/${client.id}`)}
                onDelete={handleDelete}
              />
            </div>
            
            <div className="border-t border-gray-200 p-3">
              <button
                onClick={() => {
                  setSelectedClient(null);
                  setOpenClientForm(true);
                }}
                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Icons.Plus className="tm-icon" />
                Add New Client
              </button>
            </div>
          </div>
        )}

        {(openClientForm || selectedClient) && (
          <ClientForm
            open={openClientForm}
            setOpen={setOpenClientForm}
            client={selectedClient}
            onSuccess={() => {
              setSelectedClient(null);
              setOpenClientForm(false);
              dispatch(fetchClients());
            }}
            isModal={true}
          />
        )}
      </div>
    </div>
  );
};

export default Clients;