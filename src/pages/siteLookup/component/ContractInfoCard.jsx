import React from 'react';
import { Card, Typography, Chip } from "@material-tailwind/react";
import { DocumentTextIcon } from "@heroicons/react/24/solid";
import moment from 'moment';

function ContractInfoCard({ contractList }) {
  return (
    <Card className="h-full border border-gray-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <Typography variant="h6" className="text-gray-800 font-bold flex items-center gap-2">
          <DocumentTextIcon className="h-5 w-5 text-gray-500" />
          Hợp đồng (Contracts)
        </Typography>
        <Chip 
            size="sm" 
            variant="ghost" 
            color="blue-gray" 
            value={`${contractList?.length || 0} hợp đồng`} 
            className="rounded-full bg-gray-200 text-gray-700 normal-case font-medium border-none"
        />
      </div>

      <div className="p-0 overflow-auto flex-1">
        {contractList && contractList.length > 0 ? (
            <table className="w-full min-w-max table-auto text-left">
                <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                    <tr>
                         <th className="p-4 border-b border-gray-200">
                            <Typography variant="small" color="blue-gray" className="font-bold opacity-70 leading-none">Số hợp đồng</Typography>
                        </th>
                        <th className="p-4 border-b border-gray-200">
                            <Typography variant="small" color="blue-gray" className="font-bold opacity-70 leading-none">Tên hợp đồng</Typography>
                        </th>
                        <th className="p-4 border-b border-gray-200">
                            <Typography variant="small" color="blue-gray" className="font-bold opacity-70 leading-none">Đối tác</Typography>
                        </th>
                        <th className="p-4 border-b border-gray-200">
                            <Typography variant="small" color="blue-gray" className="font-bold opacity-70 leading-none">Ngày ký</Typography>
                        </th>
                         <th className="p-4 border-b border-gray-200">
                            <Typography variant="small" color="blue-gray" className="font-bold opacity-70 leading-none">Ngày hết hạn</Typography>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {contractList.map((contract, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                            <td className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">
                                    {contract.contractNumber}
                                </Typography>
                            </td>
                            <td className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-normal text-gray-600 max-w-xs truncate">
                                    {contract.contractName || "-"}
                                </Typography>
                            </td>
                             <td className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-normal text-gray-600">
                                    {contract.transmissionOwner?.name || "-"}
                                </Typography>
                            </td>
                             <td className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-medium">
                                    {contract.signedDate ? moment(contract.signedDate).format("DD/MM/YYYY") : "-"}
                                </Typography>
                            </td>
                             <td className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-medium">
                                    {contract.endDate ? moment(contract.endDate).format("DD/MM/YYYY") : "-"}
                                </Typography>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Typography variant="h6" className="font-normal opacity-50">Không có thông tin hợp đồng</Typography>
            </div>
        )}
      </div>
    </Card>
  );
}

export default ContractInfoCard;
