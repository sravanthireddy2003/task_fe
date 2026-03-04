import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import fetchWithTenant from '../utils/fetchWithTenant';
import { selectUser } from '../redux/slices/authSlice';
import PageHeader from "../components/PageHeader";
import { resolveFileUrl } from '../utils/fileHelpers';

const ManagerClients = () => {
  const user = useSelector(selectUser);
  const [managerClients, setManagerClients] = useState([]);
  const [managerLoading, setManagerLoading] = useState(true);
  const [managerError, setManagerError] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadManagerClients = useCallback(async () => {
    setManagerLoading(true);
    try {
      const resp = await fetchWithTenant('/api/manager/clients');
      const list = Array.isArray(resp?.data) ? resp.data : resp;
      setManagerClients(Array.isArray(list) ? list : []);
      setManagerError(null);
    } catch (err) {
      const message = err?.message || 'Failed to load assigned clients';
      setManagerError(message);
      toast.error(message);
    } finally {
      setManagerLoading(false);
    }
  }, []);

  useEffect(() => {
    loadManagerClients();
  }, [loadManagerClients]);

  const clientsToShow = useMemo(() => {
    const normalized = !managerLoading && managerClients.length > 0 ? managerClients : [];
    return normalized.filter((client) => {
      const matchesSearch = !searchQuery
        || client.name?.toLowerCase().includes(searchQuery.toLowerCase())
        || client.company?.toLowerCase().includes(searchQuery.toLowerCase())
        || client.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' && client.status?.toLowerCase() !== 'inactive')
        || (statusFilter === 'inactive' && client.status?.toLowerCase() === 'inactive');
      return matchesSearch && matchesStatus;
    });
  }, [managerClients, managerLoading, searchQuery, statusFilter]);
  const selectedDocuments = useMemo(
    () => (selectedClient?.documents ?? []).map((doc) => ({
      ...doc,
      url: resolveFileUrl(doc.file_url),
    })),
    [selectedClient]
  );

  return (
    <div className="w-full p-4 space-y-4">
      <PageHeader
        title="Assigned Clients"
        subtitle="You can only see clients assigned to you."
        onRefresh={loadManagerClients}
        refreshing={managerLoading}
      >
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search clients by name, company, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input md:w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </PageHeader>
      {selectedClient ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Client Detail</p>
              <h1 className="text-page-title text-gray-900">{selectedClient.name}</h1>
              <p className="text-sm text-gray-500">{selectedClient.company || 'â€”'}</p>
            </div>
            <button
              onClick={() => setSelectedClient(null)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              â† Back to list
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[{
              label: 'Client Ref',
              value: selectedClient.ref || 'â€”'
            }, {
              label: 'Manager',
              value: selectedClient.manager_name || 'â€”'
            }, {
              label: 'Status',
              value: selectedClient.status || 'Active'
            }, {
              label: 'Created',
              value: selectedClient.created_at ? new Date(selectedClient.created_at).toLocaleString() : 'N/A'
            }, {
              label: 'Email',
              value: selectedClient.email || 'â€”'
            }, {
              label: 'Phone',
              value: selectedClient.phone || 'â€”'
            }].map((field) => (
              <div key={field.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">{field.label}</p>
                <p className="mt-1 text-base font-medium text-gray-900">{field.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : managerLoading ? (
        <div className="rounded-lg bg-white p-6 text-center text-gray-500 border border-dashed border-gray-200">
          Fetching assigned clients...
        </div>
      ) : clientsToShow.length === 0 ? (
        <div className="rounded-lg bg-white p-6 text-center text-gray-500 border border-dashed border-gray-200">
          {managerError ? managerError : 'No assigned clients found.'}
        </div>
      ) : (
        <div className="tm-list-container">
          <table className="tm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Status</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {clientsToShow.map((client) => (
                <tr
                  key={client.id || client.public_id || client._id}
                  className="cursor-pointer"
                  onClick={() => setSelectedClient(client)}
                >
                  <td>
                    <span className="text-[14px] font-semibold text-gray-900">{client.name}</span>
                  </td>
                  <td>
                    <span className="text-[14px] text-gray-700">{client.company || '-'}</span>
                  </td>
                  <td>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${client.status === 'Inactive' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}
                    >
                      {client.status || (client.isDeleted ? 'Inactive' : 'Active')}
                    </span>
                  </td>
                  <td>
                    <span className="text-[14px] text-gray-700">{client.email || '-'}</span>
                  </td>
                  <td>
                    <span className="text-[14px] text-gray-700">{client.phone || '-'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManagerClients;
