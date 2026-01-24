import React, { useMemo } from "react";
import Select from "react-select";
import { useField, useFormikContext } from "formik";
import { Typography } from "@material-tailwind/react";
import { CustomMenuList } from "../pages/CustomList";

/**
 * Finalized FormSelect component.
 * Merges working logic from TestSelect with optional virtualization.
 */
const FormSelect = ({
  label,
  name,
  options = [],
  placeholder = "Chọn...",
  isSearchable = true,
  isClearable = false,
  getOptionLabel,
  getOptionValue, // Should return the unique ID/value of the option
  loadingMessage = () => "Đang tải...",
  noOptionsMessage = () => "Không có dữ liệu",
  required = false,
  className = "",
  useVirtualization = true,
  ...props
}) => {
  const [field, meta] = useField(name);
  const { setFieldValue, setFieldTouched } = useFormikContext();

  // Find the selected option using loose equality (matching filter bar/TestSelect logic)
  const selectedOption = useMemo(() => {
    if (field.value === undefined || field.value === null || field.value === "") return null;
    return options.find((opt) => {
      const val = getOptionValue ? getOptionValue(opt) : opt.id || opt.value;
      return val == field.value;
    });
  }, [field.value, options, getOptionValue]);

  const handleChange = (selected) => {
    const val = selected
      ? getOptionValue
        ? getOptionValue(selected)
        : selected.id || selected.value
      : null;
    setFieldValue(name, val);
  };

  const handleBlur = () => {
    setFieldTouched(name, true);
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "38px",
      borderRadius: "0.375rem",
      borderColor: meta.touched && meta.error ? "#ef4444" : state.isFocused ? "#3b82f6" : "#e2e8f0",
      boxShadow: state.isFocused
        ? meta.touched && meta.error
          ? "0 0 0 1px #ef4444"
          : "0 0 0 1px #3b82f6"
        : "none",
      "&:hover": {
        borderColor: state.isFocused ? (meta.touched && meta.error ? "#ef4444" : "#3b82f6") : "#cbd5e1",
      },
    }),
    input: (base) => ({ ...base, fontSize: "0.875rem" }),
    placeholder: (base) => ({ ...base, fontSize: "0.875rem", color: "#9ca3af" }),
    singleValue: (base) => ({ ...base, fontSize: "0.875rem", color: "#111827" }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    // Do NOT override 'option' styles to keep the library's default highlight/hover logic
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <Typography variant="small" color="blue-gray" className="mb-1 font-bold">
          {label} {required && <span className="text-red-500">*</span>}
        </Typography>
      )}
      <Select
        {...props}
        instanceId={`form-select-${name}`}
        name={name}
        placeholder={placeholder}
        options={options}
        value={selectedOption}
        onChange={handleChange}
        onBlur={handleBlur}
        styles={customStyles}
        components={useVirtualization ? { MenuList: CustomMenuList } : {}}
        isSearchable={isSearchable}
        isClearable={isClearable}
        getOptionLabel={getOptionLabel}
        getOptionValue={getOptionValue || ((option) => option.id || option.value)}
        loadingMessage={loadingMessage}
        noOptionsMessage={noOptionsMessage}
        menuPortalTarget={document.body}
      />
      {meta.touched && meta.error && (
        <div className="mt-1 text-xs text-red-600 font-medium italic">{meta.error}</div>
      )}
    </div>
  );
};

export default FormSelect;
