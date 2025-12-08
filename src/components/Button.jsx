import clsx from "clsx";
import React from "react";

const Button = ({ icon, className, label, type, onClick = () => {}, disabled = false }) => {
  const renderIcon = () => {
    if (!icon) return null;
    // If it's already a React element, render it directly
    if (React.isValidElement(icon)) return (
      <span className="ml-2 inline-block">{icon}</span>
    );
    // If a component (function/class) was passed, create element
    if (typeof icon === 'function') {
      const Icon = icon;
      return (
        <span className="ml-2 inline-block"><Icon /></span>
      );
    }
    // Otherwise render as-is (string etc.)
    return <span className="ml-2 inline-block">{icon}</span>;
  };

  return (
    <button
      type={type || "button"}
      className={clsx("px-3 py-2 outline-none inline-flex items-center justify-center", className)}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
    >
      <span>{label}</span>
      {renderIcon()}
    </button>
  );
};

export default Button;
