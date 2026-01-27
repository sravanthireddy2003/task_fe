import React, { useState } from "react";
import * as Icons from "../../icons";

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
    <div className="space-y-4">
      {/* Header - Search Filter */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, company, or manager..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
        <div className="text-xs font-medium text-gray-600 whitespace-nowrap">
          {totalClients} result{totalClients !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("ref")}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Ref
                    <Icons.RefreshCcw className="tm-icon" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("company")}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Company
                    <Icons.RefreshCcw className="tm-icon" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Name
                    <Icons.RefreshCcw className="tm-icon" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("manager_name")}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Manager
                    <Icons.RefreshCcw className="tm-icon" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Phone</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentClients.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-sm text-gray-500">
                  No clients found
                </td>
              </tr>
            ) : (
              currentClients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => onRowClick(client)}
                  className="hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{client.ref || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{client.company || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-600">
                        {(client.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      {client.name || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{client.manager_name || client.managerName || client.manager || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 truncate max-w-xs">{client.email || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{client.phone || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(client);
                        }}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors icon-center"
                        title="Edit"
                      >
                        <Icons.Pencil className="tm-icon" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(client.id);
                        }}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors icon-center"
                        title="Delete"
                      >
                        <Icons.Trash2 className="tm-icon" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="px-2 py-1 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2 py-1 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-xs text-gray-700 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Last
          </button>
        </div>
      )}
    </div>
  );
};

export default Table;
