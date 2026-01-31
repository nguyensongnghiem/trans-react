import { Chip } from "@material-tailwind/react";
import clsx from "clsx";

function OwnerChip({ name, className }) {
  const colorMap = {
    MobiFone: "blue",
    VNPT: "cyan",
    CMC: "yellow",
    PITC: "green",
    Viettel: "teal",
    FPT: "orange",
  };

  const color = colorMap[name] || "blue-gray"; // Màu mặc định

  return (
    <Chip
      variant="ghost"
      size="sm"
      value={name === "MobiFone" ? "MBF" : name}
      color={color}
      className={clsx("rounded-full font-semibold", className)}
    />
  );
}

export default OwnerChip;
