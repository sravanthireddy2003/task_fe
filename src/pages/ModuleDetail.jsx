import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";

import { MODULE_MAP } from "../App/moduleMap.jsx";
import { selectUser } from "../redux/slices/authSlice";

const ModuleDetail = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const moduleEntry = useMemo(() => {
    if (!user?.modules || !moduleId) return null;
    const normalizedId = moduleId.toLowerCase();
    return user.modules.find((mod) => {
      const candidate = (mod.moduleId || mod.id || mod._id || mod.module_id || "").toString().toLowerCase();
      return candidate === normalizedId;
    });
  }, [user, moduleId]);

  if (!moduleId) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        Module identifier missing. Select a module from your employee workspace.
      </div>
    );
  }

  if (!moduleEntry) {
    return (
      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 text-gray-700 shadow-sm">
        <p className="text-sm text-gray-500">Module ID {moduleId} is not assigned to you.</p>
        <h1 className="text-2xl font-semibold text-gray-900">Module not found</h1>
        <p className="text-sm text-gray-600">Check the employee workspace for available modules or contact your administrator if you believe this is an error.</p>
        <button
          onClick={() => navigate(-1)}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400"
        >
          Go Back
        </button>
      </div>
    );
  }

  const moduleMeta = MODULE_MAP[moduleEntry.name] || { label: moduleEntry.name };
  const routeLink = moduleMeta.link;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-blue-500">Module Insights</p>
        <h1 className="text-3xl font-semibold text-gray-900">{moduleMeta.label}</h1>
        <p className="text-sm text-gray-500">{moduleMeta.description || "Deep dive into the experience delivered by this module."}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-400">Access</p>
          <h2 className="text-xl font-semibold text-gray-900">{moduleEntry.access || "View"} access</h2>
          <p className="mt-2 text-sm text-gray-600">Roles granted: {moduleEntry.access === "full" ? "Full" : "Limited"}</p>
          <p className="mt-4 text-xs text-gray-500">Module identifier</p>
          <p className="text-sm font-mono text-gray-700">{moduleId}</p>
        </article>
        <article className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-blue-600">Actions</p>
          <div className="mt-3 flex flex-col gap-2">
            {routeLink ? (
              <Link
                to={routeLink}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white text-center transition hover:bg-blue-700"
              >
                Open module workspace
              </Link>
            ) : (
              <span className="text-sm font-semibold text-gray-700">Workspace link not configured</span>
            )}
            <button
              onClick={() => navigate(-1)}
              className="text-sm font-semibold text-gray-700 underline"
            >
              Go back
            </button>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-400">Summary</p>
        <p className="mt-2 text-sm text-gray-600">
          {moduleEntry.additionalInfo ||
            "Use this page to review the responsibilities, quick links, and controls you have for this module."}
        </p>
      </section>
    </div>
  );
};

export default ModuleDetail;
