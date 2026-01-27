import React from "react";
import clsx from "clsx";

/**
 * Design-system data table wrapper.
 * Normalizes header, body, zebra stripes, hover, and padding.
 */
const DataTable = ({
  columns,
  data,
  getRowKey,
  renderRow,
  emptyState,
  className,
}) => {
  const rows = data || [];

  return (
    <div className={clsx("overflow-x-auto rounded-xl border border-gray-200 bg-white", className)}>
      <table className="min-w-full text-sm text-gray-800">
        {columns && (
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key || col.id || col.accessor || col.label}
                  className={clsx(
                    "px-4 py-3 text-left whitespace-nowrap",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.className,
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 && emptyState && (
            <tr>
              <td
                colSpan={columns ? columns.length : 1}
                className="px-4 py-6 text-center text-sm text-gray-500"
              >
                {emptyState}
              </td>
            </tr>
          )}
          {rows.length > 0 &&
            rows.map((row, index) => {
              const key = getRowKey ? getRowKey(row, index) : index;
              return renderRow(row, index, key);
            })}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
