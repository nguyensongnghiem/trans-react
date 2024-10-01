import React, { useEffect, useMemo, useState } from "react";
import { fetchData } from "../../services/apiService.jsx";
import { useParams } from "react-router-dom";
import { DateTime } from "luxon";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  DialogBody,
  DialogFooter,
  Drawer,
  IconButton,
  Input,
  Textarea,
  Typography,
} from "@material-tailwind/react";
import { DocumentIcon } from "@heroicons/react/24/solid";
import InfoCard from "./component/InfoCard.jsx";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid/index.js";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-material.css"; // Optional Theme applied to the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css";
import * as Yup from "yup";
import { ErrorMessage, Field, Form, Formik } from "formik"; // Optional Theme applied to the Data Grid
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

  const [open, setOpen] = React.useState(false);
  const openDrawer = () => setOpen(true);
  const closeDrawer = () => setOpen(false);

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

  function handleOpenEditDrawer() {
    openDrawer();
  }

  function handleEditSubmit(value) {
    console.log(value);
  }

  function handleCloseEditDrawer() {
    closeDrawer();
  }

  return (
    <>
      <Card className="mt-6 rounded-none shadow-none">
        <div className="border-b mb-5 flex justify-start gap-5 text-sm">
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
            <Typography variant="h5" className="font-semibold">
              {contractDetail.contractNumber}
            </Typography>
          </div>
          <IconButton variant="text" size="sm" onClick={handleOpenEditDrawer}>
            <PencilIcon className="h-4 w-4 text-gray-900" />
          </IconButton>
        </div>
        <Typography className="" color="blue" variant="h6">
          {contractDetail.contractName}
        </Typography>
        <CardBody>
          <div className="grid grid-cols-4 mb-5 gap-2">
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
        <CardFooter className="pt-0"></CardFooter>
      </Card>

      {/*   Drawer edit hợp đồng */}

      <React.Fragment>
        <Drawer
          open={open}
          onClose={handleCloseEditDrawer}
          placement="right"
          className="pt-4"
          size={500}
        >
          <div className="flex items-center justify-between px-4 pb-2">
            <Typography variant="h4" color="blue">
              Cập nhật thông tin hợp đồng
            </Typography>

            <IconButton
              variant="text"
              color="blue-gray"
              onClick={handleCloseEditDrawer}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </IconButton>
          </div>
          <div className="mb-5 px-4">
            <Typography variant="small" color="gray" className="font-normal ">
              Cập nhật thông tin cơ bản của hợp đồng
            </Typography>
          </div>
          <Formik
            onSubmit={handleEditSubmit}
            initialValues={{
              ...contractDetail,
            }}
            enableReinitialize={true}
            validationSchema={Yup.object({
              contractNumber: Yup.string().required("Yêu cầu nhập số hợp đồng"),
              contractName: Yup.string().required("Yêu cầu nhập tên hợp đồng"),
              signedDate: Yup.date().required("Yêu cầu nhập ngày ký hợp đồng"),
              endDate: Yup.date().required(
                "Yêu cầu nhập ngày kết thúc hợp đồng",
              ),
            })}
          >
            <Form className="flex flex-initial flex-shrink flex-col">
              <DialogBody className="space-y-4 pb-6">
                <Card className="shadow-none">
                  <div className="grid grid-cols-12 gap-3 p-2">
                    <div className="col-span-full flex flex-col gap-2">
                      <label className="text-slate-400 font-semibold">
                        Số hợp đồng
                      </label>
                      <Field
                        name="contractNumber"
                        placeholder="Nhập số hợp đồng"
                        className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                      ></Field>
                      <ErrorMessage
                        className="justify-items-end text-sm font-light italic text-red-500"
                        name="contractNumber"
                        component="span"
                      ></ErrorMessage>
                    </div>
                    <div className="col-span-full flex flex-col gap-2">
                      <label className="text-slate-400 font-semibold">
                        Tên hợp đồng
                      </label>
                      <Field
                        name="contractName"
                        placeholder="Nhập tên hợp đồng"
                        className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                      ></Field>
                      <ErrorMessage
                        className="justify-items-end text-sm font-light italic text-red-500"
                        name="contractName"
                        component="span"
                      ></ErrorMessage>
                    </div>
                    <div className="col-span-full flex flex-col items-stretch gap-2">
                      <label className="text-slate-400 font-semibold">
                        Ngày ký
                      </label>
                      <Field
                        name="signedDate"
                        type="date"
                        placeholder="Nhập Site ID khác"
                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                      ></Field>
                      <ErrorMessage
                        className="justify-items-end text-sm font-light italic text-red-500"
                        name="signedDate"
                        component="span"
                      ></ErrorMessage>
                    </div>
                    <div className="col-span-full flex flex-col items-stretch gap-2">
                      <label className="text-slate-400 font-semibold">
                        Ngày ký
                      </label>
                      <Field
                        name="endDate"
                        type="date"
                        placeholder="Nhập Site ID khác"
                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                      ></Field>
                      <ErrorMessage
                        className="justify-items-end text-sm font-light italic text-red-500"
                        name="endDate"
                        component="span"
                      ></ErrorMessage>
                    </div>
                  </div>
                </Card>
              </DialogBody>
              <DialogFooter>
                <Button size="md" type="submit" color="red">
                  Cập nhật dữ liệu
                </Button>
              </DialogFooter>
            </Form>
            {/* <img src={MySvg} alt="" className="flex-initial p-5" /> */}
          </Formik>
        </Drawer>
      </React.Fragment>
    </>
  );
}

export default FoConTractDetail;
