import React from "react";

const Label = ({ children, htmlFor, required, className = "" }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-semibold text-gray-700 mb-1.5 ${className}`}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

export default Label;