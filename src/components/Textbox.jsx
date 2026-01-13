import React from "react";
import clsx from "clsx";

const Textbox = React.forwardRef(
  ({ type, placeholder, label, className, register, name, error, disabled, icon, helperText, required }, ref) => {
    return (
      <div className='w-full flex flex-col gap-2'>
        {label && (
          <label htmlFor={name} className='text-caption font-medium text-slate-700 flex items-center gap-1'>
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}

          <input
            type={type}
            name={name}
            placeholder={placeholder}
            ref={ref}
            {...register}
            disabled={disabled}
            aria-invalid={error ? "true" : "false"}
            className={clsx(
              "w-full bg-white px-4 py-3 border border-slate-200 rounded-xl placeholder-slate-400 text-body text-slate-900 outline-none transition-all duration-200 shadow-sm",
              "focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:shadow-md",
              "hover:border-slate-300 hover:shadow-sm",
              icon && "pl-11",
              disabled && "bg-slate-50 cursor-not-allowed opacity-60 border-slate-200",
              error && "border-red-300 focus:ring-red-500 focus:border-red-500",
              className
            )}
          />
        </div>

        {/* Helper Text */}
        {helperText && !error && (
          <p className="text-meta text-slate-500">{helperText}</p>
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
