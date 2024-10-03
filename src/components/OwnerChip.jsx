import { Chip } from "@material-tailwind/react";
function OwnerChip({ name }) {
    return (<Chip
        variant="ghost"
        size="sm"
        value={name=== 'MobiFone'?'MBF':name}
        color={
            name === "MobiFone"
                ? "blue"
                : name === "VNPT"
                    ? "cyan"
                    : name === "CMC"
                        ? "yellow"
                        : name === "PITC"
                            ? "green"
                            : "red"
        }

    />);
}

export default OwnerChip;