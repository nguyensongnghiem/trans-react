import { Card, Typography, Chip } from "@material-tailwind/react";
import { ServerIcon } from "@heroicons/react/24/solid";

function DeviceInfoCard(props) {
  const { site } = props;

  return (
    <Card className="h-full border border-gray-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <Typography variant="h6" className="text-gray-800 font-bold flex items-center gap-2">
          <ServerIcon className="h-5 w-5 text-gray-500" />
          Thiết bị tại trạm
        </Typography>
        <Chip 
            size="sm" 
            variant="ghost" 
            color="blue-gray" 
            value={`${site.routerList?.length || 0} thiết bị`} 
            className="rounded-full bg-gray-200 text-gray-700 normal-case font-medium border-none"
        />
      </div>
      
      <div className="p-0 overflow-auto flex-1">
        {site.routerList && site.routerList.length > 0 ? (
            <table className="w-full min-w-max table-auto text-left">
                <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                    <tr>
                        <th className="p-4 border-b border-gray-200">
                            <Typography variant="small" color="blue-gray" className="font-bold opacity-70 leading-none">Tên thiết bị</Typography>
                        </th>
                        <th className="p-4 border-b border-gray-200">
                            <Typography variant="small" color="blue-gray" className="font-bold opacity-70 leading-none">IP Address</Typography>
                        </th>
                         <th className="p-4 border-b border-gray-200 text-right">
                            <Typography variant="small" color="blue-gray" className="font-bold opacity-70 leading-none">Loại</Typography>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {site.routerList.map((router, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                            <td className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold text-blue-900">
                                    {router.name}
                                </Typography>
                            </td>
                            <td className="p-4">
                                <Typography variant="small" className="font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded inline-block text-xs">
                                    {router.ip || "N/A"}
                                </Typography>
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex gap-1 justify-end flex-wrap">
                                    {router.transmissionDeviceType && (
                                        <span className="text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                                            {router.transmissionDeviceType.name}
                                        </span>
                                    )}
                                    {router.routerType && (
                                         <span className="text-[10px] font-bold uppercase tracking-wide bg-teal-50 text-teal-700 px-2 py-1 rounded border border-teal-100">
                                            {router.routerType.name}
                                        </span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Typography variant="h6" className="font-normal opacity-50">Không có thiết bị truyền dẫn</Typography>
            </div>
        )}
      </div>
    </Card>
  );
}

export default DeviceInfoCard;
