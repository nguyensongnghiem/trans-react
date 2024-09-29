import React, { useEffect, useMemo, useState } from "react";
import { fetchData } from "../../services/apiService.jsx";
import { useParams } from "react-router-dom";
import { DateTime } from "luxon";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  IconButton,
  Typography,
} from "@material-tailwind/react";
import { DocumentIcon } from "@heroicons/react/24/solid";
import InfoCard from "./component/InfoCard.jsx";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid/index.js";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-material.css"; // Optional Theme applied to the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
function FoConTractDetail(props) {
  const { id } = props;
  const [contractDetail, setContractDetail] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [colDefs, setColDefs] = useState([
    {
      headerName: "Tên tuyến",
      valueGetter: (p) =>
        p.data.nearSite?.siteId + " - " + p.data.farSite?.siteId,
    },
    { headerName: "Khoảng cách", valueGetter: (p) => p.data.finalDistance },
    {
      headerName: "Số core",
      valueGetter: (p) => p.data.coreQuantity,
    },
    {
      headerName: "Chi phí / tháng",
      valueGetter: (p) => p.data.cost,
      cellRenderer: (p) => VND.format(p.data.cost),
    },
    { headerName: "Ghi chú", valueGetter: (p) => p.data.note },
    {
      headerName: "Tác động",
      cellRenderer: (p) => (
        <div className="flex items-center justify-center">
          <IconButton
            variant="text"
            size="sm"
            onClick={() => handleEdit(p.data.id)}
          >
            <PencilIcon className="h-4 w-4 text-gray-900" />
          </IconButton>
          <IconButton
            variant="text"
            size="sm"
            onClick={() => handleDeleteRouter(p.data.id)}
          >
            <TrashIcon strokeWidth={3} className="h-4 w-4 text-gray-900" />
          </IconButton>
        </div>
      ),
    },
  ]);
  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
      sortable: true,
      filter: true,
      floatingFilter: true,
    };
  });
  useEffect(() => {
    const loadContract = async () => {
      setIsLoading(true);
      try {
        const contract = await fetchData(`contracts/${id}`);
        setContractDetail(contract);
        console.log(contract);
      } catch (e) {
        console.log(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadContract();
  }, [id]);

  const VND = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  if (!contractDetail) return <p>Không có thông tin </p>;
  return (
    <>
      <Card className="mt-6 rounded-none shadow-none">
        <div className="border-b mb-5 flex justify-between gap-5 text-sm">
          <div className="text-blue-600 flex items-center gap-2 pb-2 pr-2 border-b-2 border-blue-600 uppercase">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6"
            >
              <path
                fillRule="evenodd"
                d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z"
                clipRule="evenodd"
              />
              <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
            </svg>

            <Typography variant="h5" className="font-semibold inline-block">
              {contractDetail.contractNumber}
            </Typography>
          </div>
          <Typography className='inline-block w-2/4 '>{contractDetail.contractName}</Typography>
        </div>
        <Card className="border-none"></Card>

        <CardBody>
          <div className="grid grid-cols-4 mb-5">
            <div className="col-span-4 lg:col-span-2 xl:col-span-1">
              <InfoCard
                header="Số tuyến cáp"
                content={contractDetail.hiredFoLineList.length}
              />
            </div>
            <div className="col-span-4 lg:col-span-2 xl:col-span-1">
              <InfoCard
                header="Nhà cung cấp"
                content={contractDetail.transmissionOwner.name}
              />
            </div>
            <div className="col-span-4 lg:col-span-2 xl:col-span-1">
              <InfoCard
                header="Ngày ký hợp đồng"
                content={DateTime.fromISO(contractDetail.signedDate)
                  .setLocale("vn")
                  .toFormat("dd-MM-yyyy")}
              />
            </div>
            <div className="col-span-4 lg:col-span-2 xl:col-span-1">
              <InfoCard
                header="Ngày kết thúc hợp đồng"
                content={DateTime.fromISO(contractDetail.endDate)
                  .setLocale("vn")
                  .toFormat("dd-MM-yyyy")}
              />
            </div>
          </div>

          <div
            className="ag-theme-quartz w-full h-[500px]" // applying the Data Grid theme
            // style={{ height: "400px", width: "100%" }} // the Data Grid will fill the size of the parent container
          >
            <AgGridReact
              rowData={contractDetail.hiredFoLineList}
              columnDefs={colDefs}
              defaultColDef={defaultColDef}
              className="overflow-x-auto"
            />
          </div>
        </CardBody>
        <CardFooter className="pt-0">
          {/*<Button>Read More</Button>*/}
        </CardFooter>
      </Card>
    </>
  );
}

export default FoConTractDetail;
