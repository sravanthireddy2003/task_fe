import React, { useState, useEffect } from "react";
import { IoMdAdd } from "react-icons/io";
import { IoSearch, IoFilter, IoEye, IoPencil, IoTrash, IoBusiness, IoPerson, IoMail, IoCall, IoLocation } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import Title from "../components/Title";
import Button from "../components/Button";
import Table from "../components/client/EditInClient";
import UpdateClient from "../components/client/UpdateClient";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  fetchClients,
  deleteClient,
  updateClient,
  selectClients,
  selectClientStatus,
  selectClientError
} from "../redux/slices/clientSlice";
import { fetchUsers, selectUsers } from "../redux/slices/userSlice";
import clsx from "clsx";

const Clients = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  
  const clients = useSelector(selectClients);
  const status = useSelector(selectClientStatus);
  const error = useSelector(selectClientError);
  const users = useSelector(selectUsers);

  const [openUpdateClient, setOpenUpdateClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  useEffect(() => {
    dispatch(fetchClients());
    dispatch(fetchUsers({ role: "Manager" }));
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

  const handleUpdateClient = async (updatedClient) => {
    try {
      await dispatch(updateClient({
        clientId: updatedClient.id,
        clientData: updatedClient
      })).unwrap();
      setOpenUpdateClient(false);
    } catch (error) {
      console.error("Failed to update client:", error);
    }
  };

  const managers = users.filter((u) =>
    (u.role || "").toLowerCase().includes("manager")
  );

  const filteredClients = clients.filter((client) => {
    const searchMatch =
      !searchQuery ||
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "active" && !client.isDeleted) ||
      (statusFilter === "deleted" && client.isDeleted);

    const managerMatch =
      managerFilter === "all" ||
      (client.manager_public_id || client.managerId) === managerFilter;

    return searchMatch && statusMatch && managerMatch;
  });

  const ClientCard = ({ client }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">
            {client.name?.charAt(0) || 'C'}
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">{client.name}</div>
            <div className="text-xs text-gray-500">{client.company}</div>
          </div>
        </div>
        <span className={clsx(
          "px-3 py-1 rounded-full text-xs font-semibold",
          client.isDeleted ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
        )}>
          {client.isDeleted ? "Deleted" : "Active"}
        </span>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <IoMail className="text-gray-400" size={14} />
          <span className="truncate">{client.email || "No email"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <IoCall className="text-gray-400" size={14} />
          <span>{client.phone || "No phone"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <IoLocation className="text-gray-400" size={14} />
          <span className="truncate">{client.address || "No address"}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-sm text-gray-500">
          Manager: <span className="font-medium text-gray-900">{client.managerName || "Unassigned"}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/client-dashboard/${client.id}`)}
            className="p-2 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-all duration-200 group-hover:scale-110"
            title="View Dashboard"
          >
            <IoEye size={16} />
          </button>
          <button
            onClick={() => {
              setSelectedClient(client);
              setOpenUpdateClient(true);
            }}
            className="p-2 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-all duration-200 group-hover:scale-110"
            title="Edit Client"
          >
            <IoPencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(client.id)}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-all duration-200 group-hover:scale-110"
            title="Delete Client"
          >
            <IoTrash size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  if (status === "loading") {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="animate-spin h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <IoTrash size={24} />
        </div>
        <h3 className="text-lg font-bold text-red-800 mb-2">Failed to load clients</h3>
        <p className="text-red-600 mb-6">{error || 'An error occurred'}</p>
        <Button
          label="Try Again"
          onClick={() => dispatch(fetchClients())}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-semibold"
        />
      </div>
    );
  }

  const createdMsg = location?.state?.message;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header matching Users page */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Title title="Client Management" />
            <p className="text-gray-600 text-sm mt-1">Manage all your clients and their information</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("grid")}
                className={clsx(
                  "p-2.5 rounded-lg transition-all flex items-center justify-center",
                  viewMode === "grid" 
                    ? "bg-white shadow-md text-blue-600" 
                    : "text-gray-600 hover:text-gray-900"
                )}
                title="Grid View"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <rect x="2" y="2" width="6" height="6" rx="1"/>
                  <rect x="12" y="2" width="6" height="6" rx="1"/>
                  <rect x="2" y="12" width="6" height="6" rx="1"/>
                  <rect x="12" y="12" width="6" height="6" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={clsx(
                  "p-2.5 rounded-lg transition-all flex items-center justify-center",
                  viewMode === "list" 
                    ? "bg-white shadow-md text-blue-600" 
                    : "text-gray-600 hover:text-gray-900"
                )}
                title="List View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            <Link to="/add-client">
              <Button
                label="Add New Client"
                icon={<IoMdAdd className="ml-2" />}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold text-sm"
              />
            </Link>
          </div>
        </div>

        {/* Search and Filters matching Users page */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search clients by name, company, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="deleted">Deleted</option>
                </select>
                <IoFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>

              <div className="relative">
                <select
                  value={managerFilter}
                  onChange={(e) => setManagerFilter(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                <IoPerson className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Results count matching Users page */}
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            Showing <span className="font-semibold text-gray-900">{filteredClients.length}</span> of{" "}
            <span className="font-semibold text-gray-900">{clients.length}</span> clients
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

        {/* Success message */}
        {createdMsg && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <IoMdAdd size={16} />
              </div>
              <div>
                <p className="font-bold text-green-800 text-sm">Success!</p>
                <p className="text-green-700 text-sm">{createdMsg}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        {filteredClients.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <IoBusiness className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-lg font-bold text-gray-900 mb-3">No clients found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-sm">
              {searchQuery || statusFilter !== "all" || managerFilter !== "all"
                ? "Try adjusting your filters or search term"
                : "Your client list is looking empty. Add your first client to get started."}
            </p>
            <Link to="/add-client">
              <Button
                label="Add First Client"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl text-sm"
              />
            </Link>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
            
            <Link to="/add-client" className="block">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[280px]">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center mb-4">
                  <IoMdAdd className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Add New Client</h3>
                <p className="text-gray-600 text-sm">Add a new client to your portfolio</p>
              </div>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <Table
                clients={filteredClients}
                onEdit={(client) => {
                  setSelectedClient(client);
                  setOpenUpdateClient(true);
                }}
                onRowClick={(client) => navigate(`/client-dashboard/${client.id}`)}
                onDelete={handleDelete}
              />
            </div>
            
            <Link to="/add-client" className="block">
              <div className="border-t border-gray-100 p-6 text-center hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <IoMdAdd className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900">Add New Client</h3>
                    <p className="text-sm text-gray-500">Click to add a new client</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {selectedClient && (
          <UpdateClient
            open={openUpdateClient}
            setOpen={setOpenUpdateClient}
            client={selectedClient}
            onUpdate={handleUpdateClient}
          />
        )}
      </div>
    </div>
  );
};

export default Clients;