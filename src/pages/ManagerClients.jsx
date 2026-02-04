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
            className="border rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <h1 className="text-2xl font-bold text-gray-900">{selectedClient.name}</h1>
                <p className="text-sm text-gray-500">{selectedClient.company || '—'}</p>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                ← Back to list
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[{
                label: 'Client Ref',
                value: selectedClient.ref || '—'
              }, {
                label: 'Manager',
                value: selectedClient.manager_name || '—'
              }, {
                label: 'Status',
                value: selectedClient.status || 'Active'
              }, {
                label: 'Created',
                value: selectedClient.created_at ? new Date(selectedClient.created_at).toLocaleString() : 'N/A'
              }, {
                label: 'Email',
                value: selectedClient.email || '—'
              }, {
                label: 'Phone',
                value: selectedClient.phone || '—'
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
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Company</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Phone</th>
                </tr>
              </thead>
              <tbody>
                {clientsToShow.map((client) => (
                  <tr
                    key={client.id || client.public_id || client._id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedClient(client)}
                  >
                    <td className="px-4 py-2 text-gray-900">{client.name}</td>
                    <td className="px-4 py-2 text-gray-700">{client.company || '-'}</td>
                    <td className="px-4 py-2 text-xs">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 font-medium ${
                          client.status === 'Inactive' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                        }`}
                      >
                        {client.status || (client.isDeleted ? 'Inactive' : 'Active')}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-700">{client.email || '-'}</td>
                    <td className="px-4 py-2 text-gray-700">{client.phone || '-'}</td>
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