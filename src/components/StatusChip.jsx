import React from "react";

/**
 * StatusChip component to display ON/OFF status with a dot indicator.
 * 
 * @param {boolean} active - The status state.
 * @param {string} labelOn - Label to display when active is true (default: "ON").
 * @param {string} labelOff - Label to display when active is false (default: "OFF").
 */
const StatusChip = ({ active, labelOn = "ON", labelOff = "OFF" }) => {
  return (
    <span
      className={`inline-flex items-center ${
        active ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-red-50 text-red-700 border-red-200"
      } text-xs font-medium px-2.5 py-0.5 rounded-full border shadow-sm transition-all duration-200`}
    >
      <span
        className={`w-2 h-2 me-1.5 ${
          active ? "bg-teal-500 shadow-[0_0_5px_rgba(20,184,166,0.5)]" : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
        } rounded-full animate-pulse-slow`}
      ></span>
      {active ? labelOn : labelOff}
    </span>
  );
};

export default StatusChip;
