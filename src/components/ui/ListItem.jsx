import React from "react";
import clsx from "clsx";

/**
 * Generic list item for vertical lists.
 * Supports leading visuals, primary/secondary text, and trailing metadata/actions.
 */
const ListItem = ({
  leading,
  title,
  subtitle,
  meta,
  children,
  onClick,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "flex items-center justify-between gap-3 px-4 py-3",
        "border-b border-gray-100 last:border-b-0",
        "hover:bg-gray-50",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {leading && <div className="shrink-0">{leading}</div>}
        <div className="min-w-0">
          {title && (
            <div className="text-sm font-medium text-gray-900 truncate">
              {title}
            </div>
          )}
          {subtitle && (
            <div className="text-xs text-gray-500 truncate mt-0.5">
              {subtitle}
            </div>
          )}
          {children}
        </div>
      </div>
      {meta && <div className="shrink-0 text-xs text-gray-500 ml-4">{meta}</div>}
    </div>
  );
};

export default ListItem;
