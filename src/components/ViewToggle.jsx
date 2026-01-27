import React from "react";
import clsx from "clsx";
import * as Icons from "../icons";

// Global, reusable view toggle for list/grid layouts
// mode: 'list' | 'grid'
// onChange: (mode) => void
// hasGrid: whether to show the grid button (default true)
// className: optional wrapper classes for alignment
const ViewToggle = ({ mode = "list", onChange, hasGrid = true, className }) => {
  const isList = mode === "list";
  const isGrid = mode === "grid";

  return (
    <div className={clsx("flex bg-gray-100 rounded-lg p-1 border border-gray-200", className)}>
      {hasGrid && (
        <button
          type="button"
          onClick={() => onChange && onChange("grid")}
          className={clsx(
            "flex items-center justify-center px-3 py-2 rounded-md transition-all",
            isGrid ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
          )}
          title="Grid view"
        >
          <Icons.LayoutGrid className="tm-icon" />
        </button>
      )}
      <button
        type="button"
        onClick={() => onChange && onChange("list")}
        className={clsx(
          "flex items-center justify-center px-3 py-2 rounded-md transition-all",
          isList ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
        )}
        title="List view"
      >
        <Icons.Rows4 className="tm-icon" />
      </button>
    </div>
  );
};

export default ViewToggle;
