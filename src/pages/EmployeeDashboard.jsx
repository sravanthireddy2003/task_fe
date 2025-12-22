import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import fetchWithTenant from '../utils/fetchWithTenant';
import { selectUser } from '../redux/slices/authSlice';
import { MODULE_MAP } from '../App/moduleMap.jsx';

const EmployeeDashboard = () => {
  const user = useSelector(selectUser);
  const modules = user?.modules || [];
  const metrics = user?.metrics || {};
  const resources = user?.resources || {};

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetchWithTenant('/api/employee/my-tasks');
        if (!resp.ok) throw new Error('Failed to load tasks');
        const data = await resp.json();
        setTasks(data.data || []);
      } catch (err) {
        setError(err.message || 'Error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const kpis = useMemo(
    () => [
      {
        key: 'assigned',
        label: 'Assigned to me',
        value: metrics.myTasks ?? 0,
      },
      {
        key: 'completed',
        label: 'Completed',
        value: metrics.completedTasks ?? 0,
      },
      {
        key: 'access',
        label: 'Access level',
        value: resources.accessLevel || 'Limited',
      },
      {
        key: 'modules',
        label: 'Modules',
        value: modules.length,
      },
    ],
    [metrics, resources, modules.length]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Employee Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview of your work, access and modules.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((item) => (
          <div
            key={item.key}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="text-sm text-gray-500">{item.label}</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Module shortcuts */}
      {modules.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">My modules</h2>
            <p className="text-xs text-gray-500">
              Click a module to open its workspace
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {modules.map((mod) => {
              const moduleMeta = MODULE_MAP[mod.name] || { label: mod.name };
              const href = mod.path || moduleMeta.link;
              return (
                <Link
                  key={mod.moduleId || mod.id || mod._id || mod.name}
                  to={href || '#'}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2 hover:border-blue-400 hover:bg-blue-50 transition"
                >
                  <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                    {moduleMeta.icon || (mod.name?.charAt(0) || 'M')}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {moduleMeta.label}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      Access: {mod.access || 'view'}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Restrictions / features */}
      {(resources?.features?.length || resources?.restrictions) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources?.features?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                You can use
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {resources.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          {resources?.restrictions && (
            <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <h3 className="font-semibold text-amber-900 mb-2 text-sm">
                Restrictions
              </h3>
              <p className="text-sm text-amber-900">{resources.restrictions}</p>
            </div>
          )}
        </div>
      )}

      {/* My tasks */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">My tasks</h2>
          <Link
            to="/employee/tasks"
            className="text-xs text-blue-600 hover:underline"
          >
            Go to tasks
          </Link>
        </div>
        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-sm text-red-500">Error: {error}</div>
        ) : tasks.length === 0 ? (
          <div className="text-sm text-gray-500">No tasks assigned yet.</div>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li
                key={t.id || t._id}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{t.title}</div>
                    <div className="text-xs text-gray-500">{t.description}</div>
                  </div>
                  <span className="ml-4 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 capitalize">
                    {t.status || 'pending'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
