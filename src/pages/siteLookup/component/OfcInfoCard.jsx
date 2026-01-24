import React from 'react';
import { Card, Typography, Chip } from "@material-tailwind/react";
import { ShareIcon } from "@heroicons/react/24/solid";

function OfcInfoCard({ ofcList }) {
  return (
    <Card className="h-full border border-gray-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <Typography variant="h6" className="text-gray-800 font-bold flex items-center gap-2">
          <ShareIcon className="h-5 w-5 text-gray-500" />
          Cáp quang (Optical Fiber)
        </Typography>
        <Chip 
            size="sm" 
            variant="ghost" 
            color="blue-gray" 
            value={`${ofcList?.length || 0} tuyến`} 
            className="rounded-full bg-gray-200 text-gray-700 normal-case font-medium border-none"
        />
      </div>

      <div className="p-0 overflow-auto flex-1">
        {ofcList && ofcList.length > 0 ? (
            <table className="w-full min-w-max table-auto text-left">
                <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                    <tr>
                         {/* <th className="p-4 border-b border-gray-200">
                            <Typography variant="small" color="blue-gray" className="font-bold opacity-70 leading-none">Mã tuyến</Typography>
                        </th> */}
                         <th className="p-4 border-b border-gray-200">
                            <Typography variant="small" color="blue-gray" className="font-bold opacity-70 leading-none">Điểm đầu - Điểm cuối</Typography>
                        </th>
                        <th className="p-4 border-b border-gray-200">
                            <Typography variant="small" color="blue-gray" className="font-bold opacity-70 leading-none">Loại cáp</Typography>
                        </th>
                        <th className="p-4 border-b border-gray-200">
                            <Typography variant="small" color="blue-gray" className="font-bold opacity-70 leading-none">Nhà cung cấp</Typography>
                        </th>
                        <th className="p-4 border-b border-gray-200 text-right">
                            <Typography variant="small" color="blue-gray" className="font-bold opacity-70 leading-none">Dung lượng (Core)</Typography>
                        </th>
                         <th className="p-4 border-b border-gray-200 text-right">
                            <Typography variant="small" color="blue-gray" className="font-bold opacity-70 leading-none">Chiều dài (km)</Typography>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {ofcList.map((ofc, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                            {/* <td className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">
                                    {ofc.cableCode || `FO_${ofc.id}`}
                                </Typography>
                            </td> */}
                              <td className="p-4">
                                <div className="flex flex-col">
                                    <span className=" text-gray-500"><span className="font-semibold text-gray-700">{ofc.nearSite?.siteId} - {ofc.farSite?.siteId}</span></span>
                                    {/* <span className="text-xs text-gray-500">Đến: <span className="font-semibold text-gray-700">{ofc.farSite?.siteId}</span></span> */}
                                </div>
                            </td>
                            <td className="p-4">
                                <Chip 
                                    size="sm" 
                                    variant="outlined" 
                                    value="Cáp thuê" 
                                    color="blue"
                                    className="rounded-md border-blue-200 text-blue-800 normal-case font-medium inline-block"
                                />
                            </td>
                             <td className="p-4">
                                <Chip 
                                    size="sm" 
                                    variant="outlined" 
                                    value={ofc.foContract?.transmissionOwner?.name || "Chưa xác định"} 
                                    color="gray"
                                    className="rounded-md border-blue-200 text-blue-800 normal-case font-medium inline-block"
                                />
                            </td>
                           
                             <td className="p-4 text-right">
                                <Typography variant="small" color="blue-gray" className="font-medium">
                                    {ofc.coreQuantity || 0} Core
                                </Typography>
                            </td>
                             <td className="p-4 text-right">
                                <Typography variant="small" color="blue-gray" className="font-medium">
                                    {ofc.finalDistance || 0} km
                                </Typography>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Typography variant="h6" className="font-normal opacity-50">Không có tuyến cáp quang</Typography>
            </div>
        )}
      </div>
    </Card>
  );
}

export default OfcInfoCard;
