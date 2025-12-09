

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

const Clients = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  
  const clients = useSelector(selectClients);
  const status = useSelector(selectClientStatus);
  const error = useSelector(selectClientError);
  
  const [openUpdateClient, setOpenUpdateClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    dispatch(fetchClients());
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

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === 'failed') {
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
            clients={clients}
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