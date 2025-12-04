import React, { useEffect, useState } from 'react';
import fetchWithTenant from '../utils/fetchWithTenant';

const Chat = () => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchWithTenant('/api/chat/threads', { method: 'GET' });
        setThreads(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        setError(err.message || 'Failed to load chat threads');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className='p-4'>Loading chat threads...</div>;
  if (error) return <div className='p-4 text-red-600'>Error: {error}</div>;

  return (
    <div className='p-6'>
      <h2 className='text-xl font-semibold mb-4'>Chat / Real-Time Collaboration</h2>
      {threads.length === 0 ? (
        <div>No chat threads.</div>
      ) : (
        <ul className='space-y-2'>
          {threads.map((t) => (
            <li className='p-3 border rounded' key={t._id || t.id}>
              <div className='font-medium'>{t.title || t.name || 'Conversation'}</div>
              <div className='text-sm text-gray-600'>{t.lastMessage || t.preview}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Chat;
