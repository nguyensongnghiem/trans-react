import React from 'react';
import { Chip } from "@material-tailwind/react";

/**
 * StatusBadge - Reusable component for displaying status with color-coded badges
 * 
 * @param {string} status - The status enum value
 * @param {object} labels - Object mapping status values to display labels
 * @param {object} colors - Object mapping status values to color names
 */
const StatusBadge = ({ status, labels, colors }) => {
  if (!status) return null;

  const colorMap = {
    green: "green",
    blue: "blue",
    gray: "gray",
    orange: "orange",
    red: "red",
    yellow: "yellow"
  };

  const label = labels[status] || status;
  const colorName = colors[status] || 'gray';
  const chipColor = colorMap[colorName] || 'gray';

  return (
    <Chip
      value={label}
      color={chipColor}
      size="sm"
      className="rounded-full text-center justify-center"
    />
  );
};

export default StatusBadge;
