import React from "react";
import { Button as MTButton } from "@material-tailwind/react";
import clsx from "clsx";

/**
 * Component Button tùy chỉnh áp dụng theme "mềm mại", chuyên nghiệp mặc định.
 * Nó bao bọc Button của Material Tailwind và thiết lập các style mặc định.
 *
 * - `variant`: Mặc định là "filled".
 * - `color`: Nếu variant là "filled" và không có màu nào được cung cấp, nó sẽ mặc định thành màu xám đen (`bg-gray-900`).
 * - Tất cả các props khác sẽ được truyền trực tiếp vào Button của Material Tailwind.
 */
const CustomButton = ({ className, variant = "filled", color, ...props }) => {
  // Các class cơ bản cho theme mềm mại: bo góc nhẹ và có bóng mờ.
  const baseClasses = "rounded-md shadow-sm hover:shadow-md";

  // Màu nền mặc định cho variant 'filled' nếu không có màu nào được chỉ định
  const colorClass =
    variant === "filled" && !color ? "bg-gray-900 text-white" : "";

  // Kết hợp tất cả các class: theme cơ bản, màu mặc định, và bất kỳ class tùy chỉnh nào từ props
  const finalClassName = clsx(baseClasses, colorClass, className);

  return (
    <MTButton variant={variant} color={color} className={finalClassName} {...props} />
  );
};

export default CustomButton;