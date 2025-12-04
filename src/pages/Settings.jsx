import React, { useEffect, useState } from 'react';
import fetchWithTenant from '../utils/fetchWithTenant';

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchWithTenant('/api/admin/settings', { method: 'GET' });
        setSettings(res?.data || res || null);
      } catch (err) {
        setError(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className='p-4'>Loading settings...</div>;
  if (error) return <div className='p-4 text-red-600'>Error: {error}</div>;

  return (
    <div className='p-6'>
      <h2 className='text-xl font-semibold mb-4'>Settings & Master Configuration</h2>
      <pre className='bg-gray-50 p-4 rounded border overflow-auto'>{JSON.stringify(settings, null, 2)}</pre>
    </div>
  );
};

export default Settings;
