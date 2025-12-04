import React, { useEffect, useState } from 'react';
import fetchWithTenant from '../utils/fetchWithTenant';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchWithTenant('/api/admin/departments', { method: 'GET' });
        setDepartments(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        setError(err.message || 'Failed to load departments');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className='p-4'>Loading departments...</div>;
  if (error) return <div className='p-4 text-red-600'>Error: {error}</div>;

  return (
    <div className='p-6'>
      <h2 className='text-xl font-semibold mb-4'>Departments</h2>
      {departments.length === 0 ? (
        <div>No departments found.</div>
      ) : (
        <div className='overflow-auto rounded-md border'>
          <table className='min-w-full text-left'>
            <thead className='bg-gray-100'>
              <tr>
                <th className='px-4 py-2'>ID</th>
                <th className='px-4 py-2'>Name</th>
                <th className='px-4 py-2'>Created At</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d._id} className='border-t'>
                  <td className='px-4 py-2'>{d._id}</td>
                  <td className='px-4 py-2'>{d.name || d.title || d.department_name}</td>
                  <td className='px-4 py-2'>{d.createdAt || d.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Departments;
