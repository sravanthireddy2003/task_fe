import React, { useEffect, useState } from 'react';
import fetchWithTenant from '../utils/fetchWithTenant';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchWithTenant('/api/admin/projects', { method: 'GET' });
        setProjects(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        setError(err.message || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className='p-4'>Loading projects...</div>;
  if (error) return <div className='p-4 text-red-600'>Error: {error}</div>;

  return (
    <div className='p-6'>
      <h2 className='text-xl font-semibold mb-4'>Projects</h2>
      {projects.length === 0 ? (
        <div>No projects found.</div>
      ) : (
        <div className='overflow-auto rounded-md border'>
          <table className='min-w-full text-left'>
            <thead className='bg-gray-100'>
              <tr>
                <th className='px-4 py-2'>ID</th>
                <th className='px-4 py-2'>Title</th>
                <th className='px-4 py-2'>Status</th>
                <th className='px-4 py-2'>Updated At</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p._id || p.id || p.project_id} className='border-t'>
                  <td className='px-4 py-2'>{p._id || p.id || p.project_id}</td>
                  <td className='px-4 py-2'>{p.title || p.name}</td>
                  <td className='px-4 py-2'>{p.status || p.stage || '-'}</td>
                  <td className='px-4 py-2'>{p.updatedAt || p.updated_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Projects;
