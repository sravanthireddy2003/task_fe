import React, { useEffect, useState } from 'react';
import fetchWithTenant from '../utils/fetchWithTenant';

const EmployeeDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetchWithTenant('/api/employee/my-tasks');
        if (!resp.ok) throw new Error('Failed to load tasks');
        const data = await resp.json();
        setTasks(data.data || []);
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
      <h1 className="text-2xl font-bold">Employee Dashboard</h1>
      <div className='mt-4'>
        <h2 className='font-semibold mb-2'>My Tasks</h2>
        <ul>
          {tasks.map(t => (
            <li key={t.id} className='bg-white p-3 rounded mb-2 shadow'>
              <div className='font-semibold'>{t.title}</div>
              <div className='text-sm text-gray-500'>{t.status}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
