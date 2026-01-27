import clsx from "clsx";
import React from "react";
import * as Icons from '../icons';

const Button = ({
  icon,
  iconPosition = "left",
  className,
  label,
  type = "button",
  onClick = () => {},
  disabled = false,
  variant = "primary", // primary | secondary | danger
  size = "md", // sm | md | lg
  ...rest
}) => {
  // Defensive icon rendering: always render as JSX, never as a component reference
  const renderIcon = () => {
    if (!icon) return null;
    // If icon is a valid React element, render as is
    if (React.isValidElement(icon)) {
        return <span className="inline-flex items-center">{React.cloneElement(icon, { className: clsx(icon.props?.className, 'tm-icon') })}</span>;
    }
    // If icon is a string and matches an exported icon, render from Icons
    if (typeof icon === "string" && Icons[icon]) {
      const IconComp = Icons[icon];
      return (
        <span className="inline-flex items-center">
          <IconComp className={clsx('tm-icon')} />
        </span>
      );
    }
    // If icon is a function/component, render as JSX
    if (typeof icon === "function") {
      const Icon = icon;
      return (
        <span className="inline-flex items-center">
          <Icon className={clsx('tm-icon')} />
        </span>
      );
    }
    // If icon is a string or number, render as text
    if (typeof icon === "string" || typeof icon === "number") {
      return <span>{icon}</span>;
    }
    // Otherwise, do not render
    return null;
  };

  const baseClasses = `
    inline-flex items-center justify-center gap-2
    rounded-lg
    font-medium
    transition-colors duration-200
    disabled:opacity-60 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-50
  `;

  const sizeClasses = {
    sm: "h-9 px-3 text-xs",
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-6 text-sm",
  }[size] || "h-11 px-5 text-sm";

  const variantClasses = {
    primary:
      "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm hover:shadow-md",
    secondary:
      "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm",
    danger:
      "bg-error-500 text-white hover:bg-error-600 active:bg-error-700 shadow-sm hover:shadow-md",
  }[variant] ||
    "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm hover:shadow-md";

  // Defensive label rendering: only render if string, number, or valid React element
  const renderLabel = () => {
    if (
      typeof label === "string" ||
      typeof label === "number" ||
      React.isValidElement(label)
    ) {
      return label;
    }
    return null;
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={clsx(
        baseClasses,
        sizeClasses,
        variantClasses,
        className
      )}
      {...rest}
    >
      {iconPosition === "left" && renderIcon()}
      {renderLabel()}
      {iconPosition === "right" && renderIcon()}
    </button>
  );
};

export default Button;