import React, { useEffect, useState } from 'react';
import fetchWithTenant from '../utils/fetchWithTenant';

const Documents = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchWithTenant('/api/documents', { method: 'GET' });
        setDocs(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        setError(err.message || 'Failed to load documents');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className='p-4'>Loading documents...</div>;
  if (error) return <div className='p-4 text-red-600'>Error: {error}</div>;

  return (
    <div className='p-6'>
      <h2 className='text-xl font-semibold mb-4'>Documents & Files</h2>
      {docs.length === 0 ? (
        <div>No documents found.</div>
      ) : (
        <div className='overflow-auto rounded-md border'>
          <table className='min-w-full text-left'>
            <thead className='bg-gray-100'>
              <tr>
                <th className='px-4 py-2'>ID</th>
                <th className='px-4 py-2'>Filename</th>
                <th className='px-4 py-2'>Uploaded By</th>
                <th className='px-4 py-2'>Uploaded At</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d._id || d.id || d.file_id} className='border-t'>
                  <td className='px-4 py-2'>{d._id || d.id || d.file_id}</td>
                  <td className='px-4 py-2'>{d.filename || d.originalname || d.name}</td>
                  <td className='px-4 py-2'>{d.uploadedBy || d.user_name || '-'}</td>
                  <td className='px-4 py-2'>{d.createdAt || d.uploadedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Documents;
