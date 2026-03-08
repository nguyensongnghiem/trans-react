import React from "react";
import ReactSelect from "react-select";
import Label from "./Label";

/**
 * Custom Select Component sử dụng React-Select
 * Đồng bộ theme Gradient Blue của ứng dụng
 */
const Select = ({
  label,
  id,
  options = [],
  value,
  onChange,
  placeholder = "Chọn...",
  error,
  required,
  isDisabled,
  isLoading,
  isMulti,
  isClearable = true,
  isSearchable = true,
  className = "",
  ...props
}) => {
  const selectId = id || props.name;

  // Custom Styles cho React-Select để khớp với Tailwind Theme
  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "42px", // Khớp với chiều cao của Input (py-2.5)
      borderRadius: "0.5rem", // rounded-lg
      backgroundColor: state.isDisabled ? "#F9FAFB" : "#FFFFFF",
      borderColor: error
        ? "#FCA5A5" // red-300
        : state.isFocused
        ? "#3B82F6" // blue-500
        : "#D1D5DB", // gray-300
      boxShadow: state.isFocused
        ? error
          ? "0 0 0 2px #FECACA" // ring-red-200
          : "0 0 0 2px #DBEAFE" // ring-blue-100
        : "0 1px 2px 0 rgb(0 0 0 / 0.05)", // shadow-sm
      "&:hover": {
        borderColor: state.isFocused
          ? "#3B82F6"
          : error
          ? "#EF4444"
          : "#60A5FA", // hover:border-blue-400
      },
      transition: "all 0.2s ease",
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "0.5rem",
      boxShadow:
        "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)", // shadow-lg
      zIndex: 9999,
      overflow: "hidden",
      border: "1px solid #F3F4F6",
    }),
    option: (base, state) => {
      // Gradient background cho item được chọn
      if (state.isSelected) {
        return {
          ...base,
          backgroundImage: "linear-gradient(to right, #2563EB, #3B82F6)", // from-blue-600 to-blue-500
          color: "white",
          fontWeight: "500",
          ":active": {
            backgroundColor: "#1D4ED8",
          },
        };
      }
      // Hover state
      if (state.isFocused) {
        return {
          ...base,
          backgroundColor: "#EFF6FF", // bg-blue-50
          color: "#1D4ED8", // text-blue-700
          cursor: "pointer",
        };
      }
      return {
        ...base,
        color: "#374151", // text-gray-700
      };
    },
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#EFF6FF", // bg-blue-50
      borderRadius: "0.375rem",
      border: "1px solid #DBEAFE",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "#1E40AF", // text-blue-800
      fontWeight: "500",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#1E40AF",
      ":hover": {
        backgroundColor: "#DBEAFE",
        color: "#1E3A8A",
      },
    }),
    input: (base) => ({
      ...base,
      color: "#111827", // text-gray-900
    }),
    placeholder: (base) => ({
      ...base,
      color: "#9CA3AF", // text-gray-400
      fontSize: "0.875rem",
    }),
    singleValue: (base) => ({
      ...base,
      color: "#111827", // text-gray-900
      fontSize: "0.875rem",
    }),
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <Label htmlFor={selectId} required={required}>
          {label}
        </Label>
      )}
      <ReactSelect
        {...props}
        id={selectId}
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isLoading={isLoading}
        isMulti={isMulti}
        isClearable={isClearable}
        isSearchable={isSearchable}
        styles={customStyles}
        menuPortalTarget={typeof document !== "undefined" ? document.body : null} // Giúp menu không bị che
      />
      {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
};

export default Select;