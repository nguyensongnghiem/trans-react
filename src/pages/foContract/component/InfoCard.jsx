import React from "react";
import { Typography } from "@material-tailwind/react";

/**
 * Professional InfoCard component for displaying contract summary information
 * @param {string} header - The label/title of the info
 * @param {string|number} content - The value to display
 * @param {React.ReactNode} icon - Optional icon component
 * @param {string} color - Color theme: blue, green, amber, purple (default: blue)
 */
function InfoCard({ header, content, icon, color = "blue" }) {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      iconBg: "bg-blue-100",
      iconText: "text-blue-600",
      headerText: "text-blue-gray-600",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      iconBg: "bg-green-100",
      iconText: "text-green-600",
      headerText: "text-blue-gray-600",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconBg: "bg-amber-100",
      iconText: "text-amber-600",
      headerText: "text-blue-gray-600",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      iconBg: "bg-purple-100",
      iconText: "text-purple-600",
      headerText: "text-blue-gray-600",
    },
    teal: {
      bg: "bg-teal-50",
      border: "border-teal-200",
      iconBg: "bg-teal-100",
      iconText: "text-teal-600",
      headerText: "text-blue-gray-600",
    },
  };

  const theme = colorClasses[color] || colorClasses.blue;

  return (
    <div
      className={`relative p-4 rounded-lg border ${theme.border} ${theme.bg} transition-all duration-200 hover:shadow-md group`}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div
            className={`${theme.iconBg} ${theme.iconText} p-2.5 rounded-lg transition-transform duration-200 group-hover:scale-110`}
          >
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Typography
            variant="small"
            className={`${theme.headerText} font-semibold uppercase text-xs tracking-wide mb-1`}
          >
            {header}
          </Typography>
          <Typography
            variant="h6"
            color="blue-gray"
            className="font-bold truncate"
          >
            {content}
          </Typography>
        </div>
      </div>
    </div>
  );
}

export default InfoCard;
