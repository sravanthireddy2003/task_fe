import React, { useState, useEffect } from "react";
import { IoMdAdd } from "react-icons/io";
import Title from "../components/Title";
import Button from "../components/Button";
import Table from "../components/client/EditInClient"; // Client-specific Table component
import UpdateClient from "../components/client/UpdateClient"; // Modal for updating a client
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import axios from "axios";

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [openUpdateClient, setOpenUpdateClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Fetch all clients
  const fetchClients = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/clients/clients");
      setClients(response.data);
      console.log(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  // Delete a client
  const handleDelete = async (clientId) => {
    try {
      await axios.delete(`"http://localhost:4000/api/clients/clients/${clientId}`);
      setClients(clients.filter((client) => client.id !== clientId));
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  // Update a client
  const handleUpdateClient = async (updatedClient) => {
    try {
      await axios.put(`http://localhost:4000/api/clients/clients/${updatedClient.id}`, updatedClient);
      setClients(
        clients.map((client) =>
          client.id === updatedClient.id ? updatedClient : client
        )
      );
      setOpenUpdateClient(false);
    } catch (error) {
      console.error("Error updating client:", error);
    }
  };

  // Open edit modal
  const handleEditClient = (client) => {
    setSelectedClient(client);
    setOpenUpdateClient(true);
  };

  // Navigate to detailed view
  const handleRowClick = (client) => {
    navigate(`/client-dashboard/${client.id}`);
  };

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <Title title="Clients" />
        
        <Link to="/add-client">
          <Button
            label="Add Client"
            icon={<IoMdAdd className="text-lg" />}
            className="flex flex-row-reverse gap-1 items-center bg-blue-600 text-white rounded-md py-2 2xl:py-2.5"
          />
        </Link>
      </div>


      <div className="w-full">
        <Table
          clients={clients}
          onEdit={handleEditClient}
          onRowClick={handleRowClick}
          onDelete={handleDelete}
        />
      </div>

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













// import React, { useState } from "react";
// import { IoMdAdd } from "react-icons/io";
// import Title from "../components/Title";
// import Button from "../components/Button";
// import Table from "../components/client/EditInClient"; // You'll need a client-specific Table component
// import UpdateClient from "../components/client/UpdateClient"; // Modal for updating a client
// import { useNavigate } from "react-router-dom";
// import { Link } from "react-router-dom";


// const Clients = () => {
//   const navigate = useNavigate();
//   const dummyClients = [
//     { id: 1, ref: 612271836, name: "Alpha Konrad", email: "alphs@example.com", phone: "1234567890", company: "Sydney Tech" },
//     { id: 2, ref: 643128764, name: "Ram velu", email: "rma@example.com", phone: "0987654321", company: "RMA Solutions" },
//     { id: 3, ref: 542371836, name: "John Doe", email: "john@example.com", phone: "1234567890", company: "Acme Corp" },
//     { id: 4, ref: 344438764, name: "Jane Smith", email: "jane@example.com", phone: "0987654321", company: "Tech Solutions" },
//   ];

//   const [clients, setClients] = useState(dummyClients);
//   const [openUpdateClient, setOpenUpdateClient] = useState(false);
//   const [selectedClient, setSelectedClient] = useState(null);

//   const handleDelete = (clientId) => {
//     // Implement your delete logic here, e.g., API call to delete the client
//     console.log("Delete client with ID:", clientId);
//     // Optionally, refresh or update the client list state after deletion
//   };
  
//   const handleEditClient = (client) => {
//     setSelectedClient(client);
//     setOpenUpdateClient(true);
//   };
//   const handleRowClick = (client) => {
//     navigate(`/client-dashboard/${client.id}`);
//   };

//   return (
//     <div className="w-full">

//       <div className="flex items-center justify-between mb-4">
//         <Title title="Clients" />
//         <Link to="/add-client">
//     <Button
//       label="Add Client"
//       icon={<IoMdAdd className="text-lg" />}
//       className="flex flex-row-reverse gap-1 items-center bg-blue-600 text-white rounded-md py-2 2xl:py-2.5"
//     />
//   </Link> 
//       </div>

//       <div className="w-full">
//       <Table clients={clients} onEdit={handleEditClient} onRowClick={handleRowClick}  onDelete={handleDelete}/>
//       </div>

//       {selectedClient && (
//         <UpdateClient
//           open={openUpdateClient}
//           setOpen={setOpenUpdateClient}
//           client={selectedClient}
//           onUpdate={(updatedClient) => {
//             setClients(clients.map((client) => (client.id === updatedClient.id ? updatedClient : client)));
//             setOpenUpdateClient(false);
//           }}
//         />
//       )}
//     </div>
//   );
// };

// export default Clients;