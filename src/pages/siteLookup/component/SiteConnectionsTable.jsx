import { Typography, Chip } from "@material-tailwind/react";
import React from "react";

const SiteConnectionsTable = ({ connections }) => {
    const TABLE_HEAD = [
        "Loại truyền dẫn",
        "Site Gần",
        "Site Xa",
        "Tên / Serial",
        "Trạng thái",
        "Ghi chú",
    ];

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case "OPERATING":
                return "green";
            case "HALTED":
                return "amber";
            case "BROKEN":
                return "red";
            default:
                return "blue-gray";
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case "OwnFO":
                return "blue";
            case "HiredFO":
                return "indigo";
            case "LeaseLine":
                return "purple";
            case "Microwave":
                return "teal";
            default:
                return "gray";
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-max table-auto text-left">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        {TABLE_HEAD.map((head) => (
                            <th key={head} className="p-4">
                                <Typography
                                    variant="small"
                                    color="blue-gray"
                                    className="font-bold leading-none opacity-70"
                                >
                                    {head}
                                </Typography>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {connections && connections.length > 0 ? (
                        connections.map((conn, index) => (
                            <tr key={`${conn.transmissionType}-${conn.id}-${index}`} className="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                                <td className="p-4">
                                    <Chip
                                        size="sm"
                                        variant="ghost"
                                        value={conn.transmissionType}
                                        color={getTypeColor(conn.transmissionType)}
                                        className="rounded-full font-bold"
                                    />
                                </td>
                                <td className="p-4">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        {conn.nearSiteId}
                                    </Typography>
                                </td>
                                <td className="p-4">
                                    <Typography variant="small" color="blue-gray" className="font-normal text-gray-400">
                                        {conn.farSiteId || "-"}
                                    </Typography>
                                </td>
                                <td className="p-4">
                                    <Typography variant="small" color="blue-gray" className="font-bold text-blue-900">
                                        {conn.name}
                                    </Typography>
                                </td>
                                <td className="p-4">
                                    <Chip
                                        size="sm"
                                        variant="dot"
                                        value={conn.status}
                                        color={getStatusColor(conn.status)}
                                        className="font-medium"
                                    />
                                </td>
                                <td className="p-4">
                                    <Typography variant="small" className="font-normal text-gray-600 max-w-[200px] truncate">
                                        {conn.note || "-"}
                                    </Typography>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="p-8 text-center">
                                <Typography variant="small" color="blue-gray" className="font-normal opacity-50 italic">
                                    Không có kết nối truyền dẫn nào được ghi nhận.
                                </Typography>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default SiteConnectionsTable;
