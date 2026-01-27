import React from "react";
import clsx from "clsx";

/**
 * Generic grid card for metrics and dashboard tiles.
 * Provides consistent padding, border, radius, and typography.
 */
const GridCard = ({
  title,
  subtitle,
  value,
  icon,
  footer,
  tone = "default", // default | primary | success | warning | danger
  className,
  onClick,
  children,
}) => {
  const toneClasses = {
    default: "bg-white border-gray-200",
    primary: "bg-blue-50 border-blue-100",
    success: "bg-emerald-50 border-emerald-100",
    warning: "bg-amber-50 border-amber-100",
    danger: "bg-red-50 border-red-100",
  }[tone] || "bg-white border-gray-200";

  return (
    <div
      onClick={onClick}
      className={clsx(
        "rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow cursor-default",
        toneClasses,
        onClick && "cursor-pointer",
        className,
      )}
    >
      {(title || icon) && (
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            {title && (
              <h3 className="text-sm font-medium text-gray-700">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {icon && <div className="shrink-0 text-gray-500">{icon}</div>}
        </div>
      )}

      {value !== undefined && (
        <div className="text-2xl font-semibold text-gray-900 mb-1">
          {value}
        </div>
      )}

      {children}

      {footer && (
        <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between gap-2">
          {footer}
        </div>
      )}
    </div>
  );
};

export default GridCard;
