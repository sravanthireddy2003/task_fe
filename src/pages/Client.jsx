import React, { useState, useEffect } from "react";
import { IoMdAdd } from "react-icons/io";
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

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-md">
        Error: {error || 'Failed to load clients'}
      </div>
    );
  }

  // If navigation provided a success message (after create), show a small banner
  const createdMsg = location?.state?.message;

  return (
    <div className="w-full p-4">
      <div className="flex items-center justify-between mb-6">
        <Title title="Clients" />
        <Link to="/add-client">
          <Button
            label="Add Client"
            icon={<IoMdAdd className="text-lg" />}
            className="flex flex-row-reverse gap-1 items-center bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 px-4 transition-colors"
          />
        </Link>
      </div>

      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Search by Name/Company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border rounded-md p-2 w-1/3"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md p-2"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="deleted">Deleted</option>
        </select>
        <select
          value={managerFilter}
          onChange={(e) => setManagerFilter(e.target.value)}
          className="border rounded-md p-2"
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
      </div>

      {createdMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded">
          {createdMsg}
        </div>
      )}

      {clients.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No clients found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
  );
};

export default Clients;