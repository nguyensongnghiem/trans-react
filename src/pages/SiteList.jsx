import { useEffect, useState } from "react";
import * as siteService from "../services/SiteService";

import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";

function SiteList() {
  const [siteList, setSiteList] = useState(null);
  const [page, setPage] = useState(0);
  const [siteId, setSiteId] = useState("");
  const [isLoading, setIsLoading] = useState(true)
 
  useEffect(() => {
    getAllSites();
  }, [page,siteId]);
  const getAllSites = async () => {
    const sites = await siteService.getAllSites(page, siteId);
    setSiteList(sites)
    setIsLoading(false)    

  };
 
  const theme = useTheme(getTheme());
  if (isLoading) return <p>Loading... </p>
  return (
    <div className="container mx-auto px-4">
      <h2 className="text-sky-600 uppercase underline underline-offset-4 font-semibold text-xl my-4">Danh sách trạm</h2>
      <div className="bg-white shadow-lg rounded-lg overflow-hidden ">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase">
              <th className="py-3 px-6 text-center">Tỉnh</th>
              <th className="py-3 px-6 text-center">Site ID</th>
              <th className="py-3 px-6 text-center">Site ID khác</th>
              <th className="py-3 px-6 text-center">Vĩ độ</th>
              <th className="py-3 px-6 text-center">Kinh độ</th>
              <th className="py-3 px-6 text-center">Đơn vị sở hữu TD</th>
              <th className="py-3 px-6 text-center">Loại TD</th>
              <th className="py-3 px-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {siteList.content.map((site) => {
              return (
                <tr key={site.id} className="border-b border-gray-200 hover:bg-sky-100">
                  <td className="py-3 px-6 text-center whitespace-nowrap">{site.province.name}</td>
                  <td className="py-3 px-6 text-center whitespace-nowrap">{site.siteId}</td>
                  <td className="py-3 px-6 text-center whitespace-nowrap">{site.siteId2}</td>
                  <td className="py-3 px-6 text-center whitespace-nowrap">{site.latitude}</td>
                  <td className="py-3 px-6 text-center whitespace-nowrap">{site.longitude}</td>
                  <td className="py-3 px-6 text-center whitespace-nowrap">{site.transmissionOwner?.name}</td>
                  <td className="py-3 px-6 text-center whitespace-nowrap">{site.SiteTransmissionType?.name}</td>

                  <td className="py-3 px-6 text-center">
                    <div className="flex item-center justify-center">
                      <div className="w-4 mr-2 transform hover:text-purple-500 hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <div className="w-4 mr-2 transform hover:text-purple-500 hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}

          </tbody>
        </table>

      </div>
      <div className="flex justify-between mt-4 flex-wrap">
        <p>{`Trang ${siteList.pageable.pageNumber+1} / ${siteList.totalPages}`}</p>    
        <div className="inline-flex items-center">
          <button onClick={()=>setPage(siteList.number-1)} className="px-4 py-2 bg-gray-200 rounded-l-md hover:bg-sky-200">Previous</button>
          {[...Array(siteList.totalPages)].filter((x,i) => {
            return (i>siteList.number-5 && i<siteList.number+5)
          })          
          .map((x, i) =>(            
            <button key={i} onClick={()=>setPage(i)} className="px-4 py-2 bg-white border-t border-b border-gray-200 hover:text-sky-500">{i+1}</button>                      
          )
          )}
          <button onClick={()=>setPage(siteList.number+1)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-r-md">Next</button>
        </div>
      </div>

    </div>
  )
}
export default SiteList;
