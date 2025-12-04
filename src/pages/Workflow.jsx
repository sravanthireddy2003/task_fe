import React, { useEffect, useState } from 'react';
import fetchWithTenant from '../utils/fetchWithTenant';

const Workflow = () => {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchWithTenant('/api/workflow', { method: 'GET' });
        setFlows(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        setError(err.message || 'Failed to load workflows');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className='p-4'>Loading workflows...</div>;
  if (error) return <div className='p-4 text-red-600'>Error: {error}</div>;

  return (
    <div className='p-6'>
      <h2 className='text-xl font-semibold mb-4'>Workflow (Project & Task Flow)</h2>
      {flows.length === 0 ? (
        <div>No workflows found.</div>
      ) : (
        <div className='space-y-3'>
          {flows.map((f) => (
            <div key={f._id || f.id} className='p-3 border rounded'>
              <div className='font-semibold'>{f.name || f.title}</div>
              <div className='text-sm text-gray-600'>{f.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Workflow;
