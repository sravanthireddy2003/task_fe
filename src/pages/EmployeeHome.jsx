import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import { MODULE_MAP } from "../App/moduleMap.jsx";
import { selectUser } from "../redux/slices/authSlice";
import PageHeader from "../components/PageHeader";

const statCardVariants = [
  { key: "assigned", label: "Assigned to me", helper: "Tasks waiting on you" },
  { key: "completed", label: "Completed", helper: "Work you wrapped up" },
  { key: "access", label: "Access level", helper: "Permission tier" },
  { key: "modules", label: "Modules", helper: "Capabilities unlocked" },
];

const formatValue = (key, value) => {
  if (key === "access") return value || "Limited";
  return value ?? 0;
};

const ModuleCard = ({ module }) => {
  const moduleId = module.moduleId || module.id || module._id || module.module_id;
  const moduleMeta = MODULE_MAP[module.name];
  const icon = moduleMeta?.icon || (
    <span className="text-lg font-semibold">{module.name?.charAt(0) ?? "M"}</span>
  );
  const routeLink = moduleMeta?.link;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
          {icon}
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{moduleMeta?.label || module.name}</p>
          <p className="text-sm text-gray-500">Access: {module.access || "View"}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-600">
        {moduleMeta?.description || "Stay focused on high impact work by visiting this module when you need it."}
      </p>

      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        {moduleId && (
          <Link
            to={`/module/${moduleId}`}
            className="rounded-full border border-blue-200 px-4 py-1 text-blue-600 transition hover:border-blue-400 hover:bg-blue-50"
          >
            View module
          </Link>
        )}
        {routeLink && (
          <Link
            to={routeLink}
            className="rounded-full border border-gray-200 px-4 py-1 text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
          >
            Go to workspace
          </Link>
        )}
      </div>
    </div>
  );
};

const EmployeeHome = () => {
  const user = useSelector(selectUser);
  const modules = user?.modules ?? [];
  const metrics = user?.metrics ?? {};
  const resources = user?.resources ?? {};

  const metricValues = useMemo(() => ({
    assigned: metrics.myTasks ?? 0,
    completed: metrics.completedTasks ?? 0,
    access: resources.accessLevel,
    modules: modules.length,
  }), [metrics, resources, modules.length]);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
        Loading your workspace...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">Employee experience</p>
        <PageHeader
          title={`Hello, ${user.name || "there"}.`}
          subtitle="This space gathers the things your role needs: your tasks, your modules, and quick links to keep your day moving."
          onRefresh={() => window.location.reload()}
        />
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCardVariants.map((stat) => (
          <div key={stat.key} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-gray-900">{formatValue(stat.key, metricValues[stat.key])}</p>
            <p className="mt-2 text-xs text-gray-500">{stat.helper}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Your modules</p>
            <h2 className="text-xl font-semibold text-gray-900">Focused access</h2>
          </div>
          <Link
            to="/tasks"
            className="text-sm font-semibold text-blue-600 transition hover:text-blue-800"
          >
            Open My Tasks →
          </Link>
        </div>
        {modules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white/50 p-6 text-center text-sm text-gray-500">
            No modules are assigned to you yet. Ask your administrator to share modules so they appear here.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {modules.map((module) => (
              <ModuleCard key={module.moduleId || module.name} module={module} />
            ))}
          </div>
        )}
      </section>

      {resources.restrictions && (
        <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-sm text-orange-900">
          <p className="font-semibold">Restrictions</p>
          <p>{resources.restrictions}</p>
          {resources.features && resources.features.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-orange-900">
              {resources.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <article className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Need help?</p>
          <h3 className="text-lg font-semibold text-gray-900">Talk to your manager</h3>
          <p className="text-sm text-gray-600">Send updates, ask for more modules, or request clarifications on priorities.</p>
        </article>
        <article className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Profile</p>
          <h3 className="text-lg font-semibold text-gray-900">{user.email}</h3>
          <Link to="/profile" className="text-sm font-semibold text-blue-600 hover:text-blue-800">Edit profile →</Link>
        </article>
        <article className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/tasks"
              className="rounded-full border border-gray-200 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-gray-600 hover:border-gray-400"
            >
              My tasks
            </Link>
            <Link
              to="/documents"
              className="rounded-full border border-gray-200 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-gray-600 hover:border-gray-400"
            >
              Documents
            </Link>
            <Link
              to="/chat"
              className="rounded-full border border-gray-200 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-gray-600 hover:border-gray-400"
            >
              Chat
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
};

export default EmployeeHome;
