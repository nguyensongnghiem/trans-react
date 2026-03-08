import React from "react";
import { ArrowPathIcon } from "@heroicons/react/24/solid";

/**
 * Button Component - Pure Tailwind
 * Đồng bộ theme với ứng dụng (Gradient Blue, Glow effects)
 */
const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary", // primary, secondary, danger, success, warning, outline, ghost, link
  size = "md", // sm, md, lg
  className = "",
  disabled = false,
  isLoading = false,
  icon: Icon,
  ...props
}) => {
  // Base styles
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-60 disabled:cursor-not-allowed";

  // Size styles
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-2.5 text-base",
  };

  // Icon size based on button size
  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  // Variant styles
  const variantStyles = {
    // Filled buttons with glow effect
    primary:
      "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 border border-transparent hover:-translate-y-0.5 active:scale-[0.98] focus:ring-blue-400",
    danger:
      "bg-red-600 text-white shadow-lg shadow-red-500/30 hover:bg-red-700 hover:shadow-red-500/50 border border-transparent hover:-translate-y-0.5 active:scale-[0.98] focus:ring-red-400",
    success:
      "bg-green-600 text-white shadow-lg shadow-green-500/30 hover:bg-green-700 hover:shadow-green-500/50 border border-transparent hover:-translate-y-0.5 active:scale-[0.98] focus:ring-green-400",
    warning:
      "bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:bg-amber-600 hover:shadow-amber-500/50 border border-transparent hover:-translate-y-0.5 active:scale-[0.98] focus:ring-amber-400",
    
    // Standard secondary button
    secondary:
      "bg-gray-200 text-gray-800 border border-transparent hover:bg-gray-300 active:scale-[0.98] focus:ring-gray-400",

    // Outline buttons
    outline:
      "bg-transparent text-blue-600 border-2 border-blue-500 hover:bg-blue-50 active:scale-[0.98] focus:ring-blue-400",
    "outline-danger":
      "bg-transparent text-red-600 border-2 border-red-500 hover:bg-red-50 active:scale-[0.98] focus:ring-red-400",

    // Ghost/Text buttons
    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-400",
    "ghost-primary":
      "bg-transparent text-blue-600 hover:bg-blue-500/10 active:bg-blue-500/20 focus:ring-blue-400",

    // Link style
    link: "bg-transparent text-blue-600 underline-offset-4 hover:underline focus:ring-blue-400 p-1",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        ${baseStyles}
        ${sizeStyles[size] || sizeStyles.md}
        ${variantStyles[variant] || variantStyles.primary}
        ${className}
      `}
      {...props}
    >
      {isLoading && (
        <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
      )}

      {!isLoading && Icon && (
        <Icon className={`${iconSizes[size]} ${children ? "mr-2" : "mr-0"}`} />
      )}

      {children}
    </button>
  );
};

export default Button;