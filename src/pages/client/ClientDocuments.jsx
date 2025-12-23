import React from "react";
import { useSelector } from "react-redux";

const ClientDocuments = () => {
  const user = useSelector((state) => state.auth.user);
  const allowedEndpoints = user?.resources?.allowedEndpoints || [];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Document & File Management</p>
        <h1 className="text-3xl font-semibold text-gray-900">Your documents</h1>
        <p className="text-sm text-gray-500 max-w-3xl">
          Files and attachments exposed for the clients team will appear here. Use the endpoints listed below to understand what this login allows.
        </p>
      </div>

      {allowedEndpoints.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/50 p-6 text-sm text-gray-500">
          No document endpoints were shared with this profile.
        </div>
      ) : (
        <div className="grid gap-2 text-sm font-mono text-gray-700">
          {allowedEndpoints.map((endpoint) => (
            <div key={endpoint} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2">
              {endpoint}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ClientDocuments;
