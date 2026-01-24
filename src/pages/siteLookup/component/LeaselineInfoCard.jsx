import React from 'react';
import { Card, Typography, Chip } from "@material-tailwind/react";
import { SignalIcon } from "@heroicons/react/24/solid";

function LeaselineInfoCard({ leaselineList }) {
  return (
    <Card className="h-full border border-gray-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <Typography variant="h6" className="text-gray-800 font-bold flex items-center gap-2">
          <SignalIcon className="h-5 w-5 text-gray-500" />
          Kênh thuê riêng
        </Typography>
        <Chip 
            size="sm" 
            variant="ghost" 
            color="blue-gray" 
            value={`${leaselineList?.length || 0} kênh`} 
            className="rounded-full bg-gray-200 text-gray-700 normal-case font-medium border-none"
        />
      </div>

      <div className="p-0 overflow-auto flex-1">
        {leaselineList && leaselineList.length > 0 ? (
            <table className="w-full min-w-max table-auto text-left">
                <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                    <tr>
                         <th className="p-4 border-b border-gray-200">
                            <Typography variant="small" color="blue-gray" className="font-bold opacity-70 leading-none">Mã kênh</Typography>
                        </th>
                        <th className="p-4 border-b border-gray-200">
                            <Typography variant="small" color="blue-gray" className="font-bold opacity-70 leading-none">Loại kết nối</Typography>
                        </th>
                        <th className="p-4 border-b border-gray-200">
                            <Typography variant="small" color="blue-gray" className="font-bold opacity-70 leading-none">Nhà cung cấp</Typography>
                        </th>
                        <th className="p-4 border-b border-gray-200 text-right">
                            <Typography variant="small" color="blue-gray" className="font-bold opacity-70 leading-none">Tốc độ</Typography>
                        </th>
                         <th className="p-4 border-b border-gray-200 text-right">
                            <Typography variant="small" color="blue-gray" className="font-bold opacity-70 leading-none">Trạng thái</Typography>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {leaselineList.map((leaseline, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                            <td className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">
                                    {leaseline.id} {/* ID as code for now if no specific code field */}
                                </Typography>
                            </td>
                            <td className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-normal text-gray-600">
                                    {leaseline.leaseLineConnectType?.name || "-"}
                                </Typography>
                            </td>
                             <td className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-normal text-gray-600">
                                    {leaseline.transmissionOwner?.name || "-"}
                                </Typography>
                            </td>
                             <td className="p-4 text-right">
                                <Typography variant="small" color="blue-gray" className="font-medium">
                                    {leaseline.speed || 0} Mbps
                                </Typography>
                            </td>
                             <td className="p-4 text-right">
                                <Chip 
                                    size="sm" 
                                    variant="ghost" 
                                    value={leaseline.active ? "Hoạt động" : "Hủy"} 
                                    color={leaseline.active ? "green" : "red"}
                                    className="rounded-full py-0.5 px-2 capitalize inline-block"
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Typography variant="h6" className="font-normal opacity-50">Không có kênh thuê riêng</Typography>
            </div>
        )}
      </div>
    </Card>
  );
}

export default LeaselineInfoCard;
