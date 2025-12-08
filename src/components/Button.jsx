import clsx from "clsx";
import React from "react";

const Button = ({ icon, className, label, type, onClick = () => {}, disabled = false }) => {
  return (
    <button
      type={type || "button"}
      className={clsx("px-3 py-2 outline-none", className)}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
    >
      <span>{label}</span>
      {icon && icon}
    </button>
  );
};

export default Button;
