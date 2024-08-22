import { useEffect, useState } from "react";
import * as siteService from "../services/SiteService";

import { CompactTable } from "@table-library/react-table-library/compact";
import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";
import { usePagination } from '@table-library/react-table-library/pagination';
function SiteList() {
  const [siteList, setSiteList] = useState([]);
  const [isLoading,setIsLoading] = useState(true)
  
  useEffect(() => {
    getAllSites();
  }, []);
  const getAllSites = async () => {
    const sites = await siteService.getAllSites();
    setSiteList(sites)
    console.log(sites);
    setIsLoading(false)
  };
  const theme = useTheme(getTheme());
  const data = { nodes: siteList };
  const COLUMNS = [
    { label: "Tỉnh", renderCell: (item) => item.province.name },
    { label: "Site ID", renderCell: (item) => item.siteId },
    { label: "Site ID khác", renderCell: (item) => item.siteId2 },   
    { label: "Vĩ độ", renderCell: (item) => item.latitude },
    { label: "Kinh độ", renderCell: (item) => item.longitude },
    { label: "Đơn vị sở hữu TD", renderCell: (item) => item.siteOwner?.name },
    { label: "Loại TD", renderCell: (item) => item.siteTransmissionType?.name },
  ];
  const pagination = usePagination(data, {
    state: {
      page: 0,
      size: 10,
    },
  });

  if (isLoading) return <p>Loading... </p>
  return (
    <div className="container mx-auto shadow-md px-4 m-4">
    <CompactTable
      columns={COLUMNS}
      data={data}
      theme={theme}
      
      pagination={pagination}
    />
     <div
        style={{ display: 'flex', justifyContent: 'space-between' }}
      >
        <span>
          Total Pages: {pagination.state.getTotalPages(data.nodes)}
        </span>

        <span>
          Page:
          {pagination.state.getPages(data.nodes).map((_, index) => (
            <button
              key={index}
              type="button"
              style={{
                fontWeight:
                  pagination.state.page === index
                    ? 'bold'
                    : 'normal',
              }}
              onClick={() => pagination.fns.onSetPage(index)}
            >
              {index + 1}
            </button>
          ))}
        </span>
      </div>
  </div>
  )
}
export default SiteList;
