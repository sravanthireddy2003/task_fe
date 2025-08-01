// import React, { useState, useEffect } from "react";
// import { IoMdAdd } from "react-icons/io";
// import Title from "../components/Title";
// import Button from "../components/Button";
// import Table from "../components/client/EditInClient"; // Client-specific Table component
// import UpdateClient from "../components/client/UpdateClient"; // Modal for updating a client
// import { useNavigate } from "react-router-dom";
// import { Link } from "react-router-dom";
// import axios from "axios";

// const Clients = () => {
//   const navigate = useNavigate();
//   const [clients, setClients] = useState([]);
//   const [openUpdateClient, setOpenUpdateClient] = useState(false);
//   const [selectedClient, setSelectedClient] = useState(null);

//   // Fetch all clients
//   const fetchClients = async () => {
//     try {
//       const response = await axios.get(`${import.meta.env.VITE_SERVERURL}/api/clients/clients`);
//       setClients(response.data);
//       console.log(clients);
//     } catch (error) {
//       console.error("Error fetching clients:", error);
//     }
//   };

//   // Delete a client
//   const handleDelete = async (clientId) => {
//     try {
//       await axios.delete(`${import.meta.env.VITE_SERVERURL}/api/clients/clients/${clientId}`);
//       setClients(clients.filter((client) => client.id !== clientId));
//     } catch (error) {
//       console.error("Error deleting client:", error);
//     }
//   };

//   // Update a client
//   const handleUpdateClient = async (updatedClient) => {
//     try {
//       await axios.put(`${import.meta.env.VITE_SERVERURL}/api/clients/clients/${updatedClient.id}`, updatedClient);
//       setClients(
//         clients.map((client) =>
//           client.id === updatedClient.id ? updatedClient : client
//         )
//       );
//       setOpenUpdateClient(false);
//     } catch (error) {
//       console.error("Error updating client:", error);
//     }
//   };

//   // Open edit modal
//   const handleEditClient = (client) => {
//     setSelectedClient(client);
//     setOpenUpdateClient(true);
//   };

//   // Navigate to detailed view
//   const handleRowClick = (client) => {
//     navigate(`/client-dashboard/${client.id}`);
//   };

//   // Fetch clients on component mount
//   useEffect(() => {
//     fetchClients();
//   }, []);

//   return (
//     <div className="w-full">
//       <div className="flex items-center justify-between mb-4">
//         <Title title="Clients" />
        
//         <Link to="/add-client">
//           <Button
//             label="Add Client"
//             icon={<IoMdAdd className="text-lg" />}
//             className="flex flex-row-reverse gap-1 items-center bg-blue-600 text-white rounded-md py-2 2xl:py-2.5"
//           />
//         </Link>
//       </div>


//       <div className="w-full">
//         <Table
//           clients={clients}
//           onEdit={handleEditClient}
//           onRowClick={handleRowClick}
//           onDelete={handleDelete}
//         />
//       </div>

//       {selectedClient && (
//         <UpdateClient
//           open={openUpdateClient}
//           setOpen={setOpenUpdateClient}
//           client={selectedClient}
//           onUpdate={handleUpdateClient}
//         />
//       )}
//     </div>
//   );
// };

// export default Clients;













// // import React, { useState } from "react";
// // import { IoMdAdd } from "react-icons/io";
// // import Title from "../components/Title";
// // import Button from "../components/Button";
// // import Table from "../components/client/EditInClient"; // You'll need a client-specific Table component
// // import UpdateClient from "../components/client/UpdateClient"; // Modal for updating a client
// // import { useNavigate } from "react-router-dom";
// // import { Link } from "react-router-dom";


// // const Clients = () => {
// //   const navigate = useNavigate();
// //   const dummyClients = [
// //     { id: 1, ref: 612271836, name: "Alpha Konrad", email: "alphs@example.com", phone: "1234567890", company: "Sydney Tech" },
// //     { id: 2, ref: 643128764, name: "Ram velu", email: "rma@example.com", phone: "0987654321", company: "RMA Solutions" },
// //     { id: 3, ref: 542371836, name: "John Doe", email: "john@example.com", phone: "1234567890", company: "Acme Corp" },
// //     { id: 4, ref: 344438764, name: "Jane Smith", email: "jane@example.com", phone: "0987654321", company: "Tech Solutions" },
// //   ];

// //   const [clients, setClients] = useState(dummyClients);
// //   const [openUpdateClient, setOpenUpdateClient] = useState(false);
// //   const [selectedClient, setSelectedClient] = useState(null);

// //   const handleDelete = (clientId) => {
// //     // Implement your delete logic here, e.g., API call to delete the client
// //     console.log("Delete client with ID:", clientId);
// //     // Optionally, refresh or update the client list state after deletion
// //   };
  
// //   const handleEditClient = (client) => {
// //     setSelectedClient(client);
// //     setOpenUpdateClient(true);
// //   };
// //   const handleRowClick = (client) => {
// //     navigate(`/client-dashboard/${client.id}`);
// //   };

// //   return (
// //     <div className="w-full">

// //       <div className="flex items-center justify-between mb-4">
// //         <Title title="Clients" />
// //         <Link to="/add-client">
// //     <Button
// //       label="Add Client"
// //       icon={<IoMdAdd className="text-lg" />}
// //       className="flex flex-row-reverse gap-1 items-center bg-blue-600 text-white rounded-md py-2 2xl:py-2.5"
// //     />
// //   </Link> 
// //       </div>

// //       <div className="w-full">
// //       <Table clients={clients} onEdit={handleEditClient} onRowClick={handleRowClick}  onDelete={handleDelete}/>
// //       </div>

// //       {selectedClient && (
// //         <UpdateClient
// //           open={openUpdateClient}
// //           setOpen={setOpenUpdateClient}
// //           client={selectedClient}
// //           onUpdate={(updatedClient) => {
// //             setClients(clients.map((client) => (client.id === updatedClient.id ? updatedClient : client)));
// //             setOpenUpdateClient(false);
// //           }}
// //         />
// //       )}
// //     </div>
// //   );
// // };

// // export default Clients;



import React, { useState, useEffect } from "react";
import { IoMdAdd } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import Title from "../components/Title";
import Button from "../components/Button";
import Table from "../components/client/EditInClient";
import UpdateClient from "../components/client/UpdateClient";
import { useNavigate } from "react-router-dom";
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