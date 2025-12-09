import React, { useState } from "react";
import { FaEdit, FaSort, FaTrash } from "react-icons/fa";

const Table = ({ clients, onEdit, onRowClick, onDelete }) => {
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [filter, setFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1); // Track the current page
  const [itemsPerPage, setItemsPerPage] = useState(5); // Items per page

  // Sorting function
  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortField(field);
  };

  const handleDelete = (clientId) => {
    // Implement your delete logic here, e.g., API call to delete the client
    console.log("Delete client with ID:", clientId);
    // Optionally, refresh or update the client list state after deletion
  };

  // Filtered and sorted clients based on input
  const filteredClients = clients
    .filter((client) =>
      client.name?.toLowerCase().includes(filter.toLowerCase()) ||
      client.company?.toLowerCase().includes(filter.toLowerCase()) ||
      // support multiple possible manager name keys
      (client.manager_name || client.managerName || client.manager)?.toString().toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      if (sortField) {
        if (sortDirection === "asc") {
          const va = (a[sortField] ?? a[sortField] ?? "")
            .toString()
            .toLowerCase();
          const vb = (b[sortField] ?? b[sortField] ?? "")
            .toString()
            .toLowerCase();
          return va > vb ? 1 : -1;
        } else {
          const va = (a[sortField] ?? a[sortField] ?? "")
            .toString()
            .toLowerCase();
          const vb = (b[sortField] ?? b[sortField] ?? "")
            .toString()
            .toLowerCase();
          return va < vb ? 1 : -1;
        }
      }
      return 0;
    });

  // Pagination logic: Slice the filtered clients array
  const totalClients = filteredClients.length;
  const totalPages = Math.ceil(totalClients / itemsPerPage); // Total number of pages
  const currentClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div>
      {/* Filter Input */}
      <div className="flex items-center justify-end mb-4">
        <input
          type="text"
          placeholder="Filter by Name/Company "
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-md p-3 width-full"
        />
      </div>

      {/* Table */}
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr className="bg-blue-600">
            <th className="border px-4 py-2">
              Ref{" "}
              <button onClick={() => handleSort("ref")} className="ml-2">
                <FaSort />
              </button>
            </th>
            <th className="border px-4 py-2">
              Company{" "}
              <button onClick={() => handleSort("company")} className="ml-2">
                <FaSort />
              </button>
            </th>
            <th className="border px-4 py-2">
              Manager{" "}
              <button onClick={() => handleSort("manager_name")} className="ml-2">
                <FaSort />
              </button>
            </th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Phone</th>
            <th className="border px-4 py-2">
              Name{" "}
              <button onClick={() => handleSort("name")} className="ml-2">
                <FaSort />
              </button>
            </th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentClients.map((client) => (
            <tr
              key={client.id}
              onClick={() => onRowClick(client)}
              className="cursor-pointer bg-white hover:bg-blue-300"
            >
              <td className="border px-4 py-2">{client.ref}</td>
              <td className="border px-4 py-2">{client.company}</td>
              <td className="border px-4 py-2">{client.manager_name || client.managerName || client.manager || ''}</td>
              <td className="border px-4 py-2">{client.email}</td>
              <td className="border px-4 py-2">{client.phone}</td>
              <td className="border px-4 py-2">{client.name}</td>
              <td className="border px-4 py-2 flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(client);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent row click event
                    onDelete(client.id);
                    console.log("Delete clicked");
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-blue-500 text-white rounded-md mx-1"
        >
          First
        </button>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-blue-500 text-white rounded-md mx-1"
        >
          Prev
        </button>
        <span className="px-4 py-2">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-blue-500 text-white rounded-md mx-1"
        >
          Next
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-blue-500 text-white rounded-md mx-1"
        >
          Last
        </button>
      </div>
    </div>
  );
};

export default Table;
