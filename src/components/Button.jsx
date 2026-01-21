import clsx from "clsx";
import React from "react";

const Button = ({
  icon,
  className,
  label,
  type = "button",
  onClick = () => {},
  disabled = false,
}) => {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return <span className="ml-2">{icon}</span>;
    }
    if (typeof icon === "function") {
      const Icon = icon;
      return (
        <span className="ml-2">
          <Icon />
        </span>
      );
    }
    return <span className="ml-2">{icon}</span>;
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={clsx(
        `
        inline-flex items-center justify-center
        h-11 px-6
        rounded-md
        text-base font-medium
        transition-all duration-200
        disabled:opacity-60 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `,
        className
      )}
    >
      {label}
      {renderIcon()}
    </button>
  );
};

export default Button;
