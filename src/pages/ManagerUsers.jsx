import React, { useEffect, useMemo, useState } from "react";
import { httpGetService } from "../App/httpHandler";
import { toast } from "sonner";
import * as Icons from "../icons";
import PageHeader from "../components/PageHeader";

const normalizeEmployees = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const statusBadge = (isActive) =>
  isActive
    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
    : "bg-amber-100 text-amber-800 border border-amber-200";

const ManagerUsers = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadEmployees = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await httpGetService("api/manager/employees/all");
      setEmployees(normalizeEmployees(response));
    } catch (err) {
      const message = err?.message || err?.data?.message || "Unable to load employees";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const activeCount = useMemo(
    () => employees.filter((employee) => employee?.isActive).length,
    [employees]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Team"
        subtitle="See the employees assigned to your account"
        onRefresh={loadEmployees}
        refreshing={loading}
      >
        <div className="flex flex-wrap gap-3 text-small-text text-gray-600">
          <div className="flex items-center gap-1">
            <Icons.Users className="h-4 w-4 text-gray-400" />
            <span>{employees.length} total</span>
          </div>
          <div className="flex items-center gap-1">
            <Icons.Clock className="h-4 w-4 text-gray-400" />
            <span>{activeCount} active</span>
          </div>
        </div>
      </PageHeader>

      {loading && (
        <div className="min-h-[260px] flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 bg-white">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-500" />
          <p className="text-sm text-gray-500">Loading team members…</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-section-title text-red-900">{error}</p>
          <p className="text-sm text-red-700 mb-4">Unable to retrieve employee data at the moment.</p>
          <button
            onClick={loadEmployees}
            className="btn btn-secondary border-red-300 text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="tm-list-container">
          <div className="overflow-x-auto">
            <table className="tm-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Title</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-sm text-gray-500">
                      No employees were returned by the API.
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr
                      key={employee?.id || employee?.internalId || employee?.email}
                      className="cursor-pointer"
                    >
                      <td>
                        <div className="text-[14px] font-semibold text-gray-900">{employee?.name || "Unnamed"}</div>
                        <div className="text-[12px] text-gray-500">
                          {employee?.departmentPublicId || "No department"}
                        </div>
                      </td>
                      <td>
                        <span className="text-[14px] text-gray-700">{employee?.email || "-"}</span>
                      </td>
                      <td>
                        <span className="text-[14px] text-gray-700">{employee?.title || "-"}</span>
                      </td>
                      <td>
                        <span className="text-[14px] text-gray-700">{employee?.phone || "-"}</span>
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(
                            employee?.isActive
                          )}`}
                        >
                          {employee?.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerUsers;
