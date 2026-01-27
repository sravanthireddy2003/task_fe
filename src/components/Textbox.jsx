import React from "react";
import clsx from "clsx";

const Textbox = React.forwardRef(
  (
    {
      type,
      placeholder,
      label,
      className,
      register,
      name,
      error,
      disabled,
      icon,
      rightIcon, // New: for password eye
      helperText,
      required,
      showPassword, // New: controlled password state
      onPasswordToggle, // New: toggle handler
    },
    ref
  ) => {
    const inputType = type === "password" && showPassword ? "text" : type;

    return (
      <div className="w-full flex flex-col gap-2">
        {label && (
          <label
            htmlFor={name}
            className="text-caption font-medium text-gray-700 flex items-center gap-1"
          >
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}

          {rightIcon && onPasswordToggle && (
            <button
              type="button"
              onClick={onPasswordToggle}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors"
              disabled={disabled}
              tabIndex="-1"
            >
              {rightIcon}
            </button>
          )}

          <input
            type={inputType}
            name={name}
            placeholder={placeholder}
            ref={ref}
            {...register}
            disabled={disabled}
            aria-invalid={error ? "true" : "false"}
            className={clsx(
              "w-full bg-white px-4 py-3 border border-gray-200 rounded-lg placeholder-gray-400 text-body text-gray-900 outline-none transition-all duration-200 shadow-sm",
              "focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:shadow-md",
              "hover:border-gray-300 hover:shadow-sm",
              icon && "pl-11",
              rightIcon && "pr-12", // Extra padding for right icon
              disabled && "bg-gray-50 cursor-not-allowed opacity-60 border-gray-200",
              error && "border-red-300 focus:ring-red-500 focus:border-red-500",
              className
            )}
          />
        </div>

        {/* Helper Text */}
        {helperText && !error && (
          <p className="text-meta text-gray-500">{helperText}</p>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-caption text-red-600 flex items-center gap-1">
            <span className="text-red-500">⚠</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textbox.displayName = "Textbox";

export default Textbox;
