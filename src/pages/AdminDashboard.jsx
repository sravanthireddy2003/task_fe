import React, { useEffect, useState } from 'react';
import fetchWithTenant from '../utils/fetchWithTenant';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetchWithTenant('/api/admin/dashboard');
        if (!resp.ok) throw new Error('Failed to load dashboard');
        const data = await resp.json();
        setMetrics(data.data || data);

        const uresp = await fetchWithTenant('/api/admin/users');
        if (uresp.ok) {
          const udata = await uresp.json();
          setUsers(udata.data || []);
        }
      } catch (err) {
        setError(err.message || 'Error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className='text-red-500'>Error: {error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Users</div>
          <div className="text-2xl font-semibold">{metrics?.users ?? '-'}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Projects</div>
          <div className="text-2xl font-semibold">{metrics?.projects ?? '-'}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Tasks</div>
          <div className="text-2xl font-semibold">{metrics?.tasks ?? '-'}</div>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Recent Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
                <th className="py-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="py-2">{u.name}</td>
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">{u.role}</td>
                  <td className="py-2">{u.isActive ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
