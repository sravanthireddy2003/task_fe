import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../redux/slices/authSlice";

const ClientViewerHome = () => {
  const user = useSelector(selectUser);
  const modules = user?.modules || [];
  const metrics = user?.metrics || {};

  const metricValues = useMemo(() => ({
    tasks: metrics.totalTasks ?? 0,
    projects: metrics.totalProjects ?? 0,
    clients: metrics.totalClients ?? 0,
  }), [metrics]);

  if (!user) return <div className="min-h-[60vh] flex items-center justify-center text-gray-500">Loading client workspace...</div>;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">Client experience</p>
        <h1 className="text-3xl font-semibold text-gray-900">Hello, {user.name || "Client"}.</h1>
        <p className="text-sm text-gray-500 max-w-3xl">This view shows client-facing data: read-only tasks, projects and reports for your account.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-500">Tasks</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900">{metricValues.tasks}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-500">Projects</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900">{metricValues.projects}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-500">Clients</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900">{metricValues.clients}</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Modules</p>
            <h2 className="text-xl font-semibold text-gray-900">Accessible features</h2>
          </div>
          <Link to="/projects" className="text-sm font-semibold text-blue-600">Open projects →</Link>
        </div>

        {modules.length === 0 ? (
          <div className="rounded-2xl border-dashed border-gray-300 bg-white/50 p-6 text-center text-sm text-gray-500">No modules assigned.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {modules.map((m) => (
              <div key={m.moduleId || m.name} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-500">Access: {m.access}</p>
                  </div>
                  <div>
                    <Link to={`/module/${m.moduleId}`} className="text-sm text-blue-600">Details →</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ClientViewerHome;
