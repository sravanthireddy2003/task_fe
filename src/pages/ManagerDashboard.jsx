import React, { useEffect, useState } from 'react';
import fetchWithTenant from '../utils/fetchWithTenant';

const ManagerDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetchWithTenant('/api/manager/dashboard');
        if (!resp.ok) throw new Error('Failed to load manager dashboard');
        const data = await resp.json();
        setMetrics(data.data || data);
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
      <h1 className="text-2xl font-bold">Manager Dashboard</h1>
      <div className='grid grid-cols-2 gap-4 mt-4'>
        <div className='p-4 bg-white rounded shadow'>
          <div className='text-sm text-gray-500'>Projects</div>
          <div className='text-2xl font-semibold'>{metrics?.projectCount ?? '-'}</div>
        </div>
        <div className='p-4 bg-white rounded shadow'>
          <div className='text-sm text-gray-500'>Tasks</div>
          <div className='text-2xl font-semibold'>{metrics?.taskCount ?? '-'}</div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
