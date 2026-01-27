import React from "react";
import clsx from "clsx";

/**
 * Design-system form field wrapper.
 * Handles label, description, error, and spacing consistently.
 */
const FormField = ({
  label,
  labelFor,
  required = false,
  description,
  error,
  orientation = "vertical", // "vertical" | "horizontal"
  className,
  children,
}) => {
  const hasError = Boolean(error);

  return (
    <div
      className={clsx(
        "space-y-1.5",
        orientation === "horizontal" && "flex items-start gap-4 space-y-0",
        className,
      )}
    >
      {label && (
        <label
          htmlFor={labelFor}
          className={clsx(
            "block text-sm font-medium",
            hasError ? "text-red-600" : "text-gray-700",
            orientation === "horizontal" && "pt-2 min-w-[120px]",
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className={clsx("flex-1", orientation === "horizontal" && "space-y-1.5")}
      >
        {children}
        {description && !hasError && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
        {hasError && (
          <p className="text-xs text-red-600 mt-0.5">{error}</p>
        )}
      </div>
    </div>
  );
};

export default FormField;
