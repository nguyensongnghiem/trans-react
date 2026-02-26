import React from 'react';

/**
 * StatusBadge - Reusable component for displaying status with color-coded badges
 * Updated to match StatusChip theme (cleaner, with dot indicator)
 * 
 * @param {string} status - The status enum value
 * @param {object} labels - Object mapping status values to display labels
 * @param {object} colors - Object mapping status values to color names
 */
const StatusBadge = ({ status, labels = {}, colors = {} }) => {
  if (!status) return null;

  const label = labels[status] || status;
  const colorName = colors[status] || 'gray';

  const styles = {
    green: {
      container: "bg-green-50 text-green-700 border-green-200",
      dot: "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"
    },
    blue: {
      container: "bg-blue-50 text-blue-700 border-blue-200",
      dot: "bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]"
    },
    red: {
      container: "bg-red-50 text-red-700 border-red-200",
      dot: "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
    },
    orange: {
      container: "bg-orange-50 text-orange-700 border-orange-200",
      dot: "bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]"
    },
    yellow: {
      container: "bg-yellow-50 text-yellow-700 border-yellow-200",
      dot: "bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]"
    },
    gray: {
      container: "bg-gray-50 text-gray-700 border-gray-200",
      dot: "bg-gray-500 shadow-[0_0_5px_rgba(107,114,128,0.5)]"
    },
    teal: {
      container: "bg-teal-50 text-teal-700 border-teal-200",
      dot: "bg-teal-500 shadow-[0_0_5px_rgba(20,184,166,0.5)]"
    }
  };

  const currentStyle = styles[colorName] || styles.gray;

  return (
    <span
      className={`inline-flex items-center justify-center ${currentStyle.container} text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm transition-all duration-200 min-w-[80px]`}
    >
      <span
        className={`w-1.5 h-1.5 me-1.5 ${currentStyle.dot} rounded-full`}
      ></span>
      {label}
    </span>
  );
};

export default StatusBadge;
