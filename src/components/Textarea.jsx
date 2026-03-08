import React, { forwardRef } from "react";
import Label from "./Label";

const Textarea = forwardRef(
  (
    {
      label,
      id,
      placeholder,
      error,
      required,
      className = "",
      rows = 4,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name || Math.random().toString(36).substr(2, 9);

    return (
      <div className="w-full">
        {label && (
          <Label htmlFor={inputId} required={required}>
            {label}
          </Label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          disabled={disabled}
          className={`
            block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-all duration-200
            placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
            ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                : "border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-100"
            }
            ${className}
          `}
          placeholder={placeholder}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
export default Textarea;