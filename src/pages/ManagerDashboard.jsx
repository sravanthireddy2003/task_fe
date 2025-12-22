import React, { useEffect, useMemo, useState } from 'react';
import { httpGetService } from '../App/httpHandler';
import { toast } from 'sonner';

const normalizeList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const ManagerDashboard = () => {
  const [metrics, setMetrics] = useState({ projectCount: 0, taskCount: 0, clientCount: 0 });
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dashboardResponse, clientsResponse, projectsResponse] = await Promise.all([
          httpGetService('api/manager/dashboard'),
          httpGetService('api/manager/clients'),
          httpGetService('api/manager/projects'),
        ]);

        setMetrics(dashboardResponse?.data || dashboardResponse || {});
        setClients(normalizeList(clientsResponse));
        setProjects(normalizeList(projectsResponse));
      } catch (err) {
        const message = err?.message || err?.data?.message || 'Unable to load manager dashboard';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const latestClients = useMemo(() => clients.slice(0, 3), [clients]);
  const latestProjects = useMemo(() => projects.slice(0, 3), [projects]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-[0.25em] text-indigo-500">Manager overview</p>
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">High level metrics for the modules you own.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {['projectCount', 'taskCount', 'clientCount'].map((key) => (
          <article
            key={key}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-lg"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              {key === 'projectCount'
                ? 'Projects'
                : key === 'taskCount'
                  ? 'Tasks'
                  : 'Clients'}
            </p>
            <p className="mt-3 text-3xl font-semibold text-gray-900">
              {loading ? '…' : metrics[key] ?? 0}
            </p>
            <p className="text-xs text-gray-500">{key === 'taskCount' ? 'All assigned tasks' : 'Managed by you'}</p>
          </article>
        ))}
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Latest projects</h2>
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400">{projects.length} total</span>
          </div>
          <div className="mt-5 space-y-4">
            {loading ? (
              <p className="text-sm text-gray-500">Loading projects…</p>
            ) : latestProjects.length === 0 ? (
              <p className="text-sm text-gray-500">No projects to show.</p>
            ) : (
              latestProjects.map((project) => (
                <article key={project.id || project.public_id || project._id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
                    <span>{project.name}</span>
                    <span className="uppercase text-xs text-gray-500">{project.status || project.stage || 'Active'}</span>
                  </div>
                  <p className="text-xs text-gray-500">Priority: {project.priority || 'Medium'}</p>
                  {project.client?.name && (
                    <p className="text-xs text-gray-500">Client: {project.client.name}</p>
                  )}
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Assigned clients</h2>
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400">{clients.length} total</span>
          </div>
          <div className="mt-5 space-y-4">
            {loading ? (
              <p className="text-sm text-gray-500">Loading clients…</p>
            ) : latestClients.length === 0 ? (
              <p className="text-sm text-gray-500">No clients available.</p>
            ) : (
              latestClients.map((client) => (
                <article key={client.id || client.public_id || client._id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="text-sm font-semibold text-gray-800">{client.name || client.company || 'Client'}</div>
                  {client.company && <p className="text-xs text-gray-500">{client.company}</p>}
                  <p className="text-xs text-gray-500">Ref: {client.ref || client.public_id || '—'}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManagerDashboard;
