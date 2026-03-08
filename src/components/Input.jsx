import React, { forwardRef } from "react";
import Label from "./Label";

const Input = forwardRef(
  (
    {
      label,
      id,
      type = "text",
      placeholder,
      error,
      icon: Icon,
      required,
      className = "",
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
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            className={`
              block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-all duration-200
              placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
              ${Icon ? "pl-10" : ""}
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
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;