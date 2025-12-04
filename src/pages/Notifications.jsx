import React, { useEffect, useState } from 'react';
import fetchWithTenant from '../utils/fetchWithTenant';

const Notifications = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchWithTenant('/api/notifications', { method: 'GET' });
        setNotes(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        setError(err.message || 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className='p-4'>Loading notifications...</div>;
  if (error) return <div className='p-4 text-red-600'>Error: {error}</div>;

  return (
    <div className='p-6'>
      <h2 className='text-xl font-semibold mb-4'>Notifications</h2>
      {notes.length === 0 ? (
        <div>No notifications.</div>
      ) : (
        <ul className='space-y-2'>
          {notes.map((n) => (
            <li key={n._id || n.id} className='p-3 border rounded'>
              <div className='font-medium'>{n.title || n.message || 'Notification'}</div>
              <div className='text-sm text-gray-600'>{n.body || n.message || ''}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
