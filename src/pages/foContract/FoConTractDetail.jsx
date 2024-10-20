import React, { useEffect, useMemo, useState } from "react";
import { fetchData, postData, putData } from "../../services/apiService.jsx";
import { useParams } from "react-router-dom";
import { DateTime } from "luxon";
import { contractDB } from "../../services/firebase/config.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { clsx } from "clsx";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  DialogBody,
  DialogFooter,
  Drawer,
  IconButton,
  Input, Switch,
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
import { ErrorMessage, Field, Form, Formik } from "formik";
import { toast } from "react-toastify"; // Optional Theme applied to the Data Grid
import { useAxios } from "../../libs/axios/axiosConfig.jsx";
function FoConTractDetail(props) {
  const { id } = props;
  const [contractDetail, setContractDetail] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const axiosInstance = useAxios();
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
      headerName: "Đơn giá/km",
      valueGetter: (p) => p.data.cost,
      cellRenderer: (p) => VND.format(p.data.cost),
    },
    {
      headerName: "Trạng thái",
      valueGetter: (p) => p.data.active,
      cellRenderer: (p) => {
        return (
          <span className={`inline-flex items-center ${p.data.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300`}>
            <span className={`w-2 h-2 me-1 ${p.data.active ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></span>
            {p.data.active ? 'Hoạt động' : 'Không hoạt động'}
          </span>
        );
      },
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

  useEffect(() => {
    const loadContract = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get(`contracts/${id}`);
        setContractDetail(response.data);
      } catch (e) {
        console.log(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadContract();
  }, [id]);

  const fetchFile = async () => {

    const fileRef = ref(contractDB, contractDetail.contractUrl); // Đường dẫn đến file trong Firebase Storage

    try {
      const url = await getDownloadURL(fileRef);
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], 'contract_document.pdf', { type: blob.type }); // Đặt tên và kiểu file
      return file
    } catch (error) {
      console.error("Error fetching file:", error);
    }
  };

  if (contractDetail) {
    const currentContractPdf = fetchFile()
  }

  const openDrawer = () => setOpen(true);
  const closeDrawer = () => setOpen(false);
  const VND = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  function handleOpenEditDrawer() {
    openDrawer();
  }

  async function handleEditSubmit(value) {
    console.log(value);
    if (typeof value.contractUrl !== "string") {
      console.log("upload lên firebase");
      const contractPdf = ref(
        contractDB,
        `contracts/${value.contractUrl.name}`,
      );
      try {
        await uploadBytes(contractPdf, value.contractUrl);
        const url = await getDownloadURL(contractPdf);
        value.contractUrl = url;
      } catch (e) {
        if (e.message) toast.error(e.message);
      }

    }

    const { hiredFoLineList, ...submitContract } = value;

    console.log(submitContract);
    await putData(`contracts/${submitContract.id}`, submitContract);
    setContractDetail({ ...contractDetail, ...submitContract });
    // setContractDetail(submitContract)
    handleCloseEditDrawer();
    toast.success("Đã cập nhật thông tin hợp đồng");
  }

  function handleCloseEditDrawer(resetForm) {
    closeDrawer();
  }
  if (!contractDetail) return <p>Không có thông tin </p>;

  function handleDismissEditDrawer(resetForm) {
    resetForm()
    closeDrawer();
  }

  return (
    <>
      <Card className="mt-6 rounded-none p-4 text-blue-gray-600 shadow-lg">
        <div className="mb-5 flex items-center justify-start gap-5 border-b">
          <div className="flex items-center gap-2 border-b-2 border-blue-600 pb-2 pr-2 uppercase text-blue-gray-600">
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
          <Button
            className="flex gap-2 p-2.5 transition-all duration-200"
            onClick={() => {
              window.open(contractDetail.contractUrl, "_blank");
            }}
            variant="text"
            color="blue"
            size="sm"
            disabled={contractDetail.contractUrl === null}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="#4b9bf3"
              viewBox="0 0 512 512"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-4"
            >
              <path d="M64 464l48 0 0 48-48 0c-35.3 0-64-28.7-64-64L0 64C0 28.7 28.7 0 64 0L229.5 0c17 0 33.3 6.7 45.3 18.7l90.5 90.5c12 12 18.7 28.3 18.7 45.3L384 304l-48 0 0-144-80 0c-17.7 0-32-14.3-32-32l0-80L64 48c-8.8 0-16 7.2-16 16l0 384c0 8.8 7.2 16 16 16zM176 352l32 0c30.9 0 56 25.1 56 56s-25.1 56-56 56l-16 0 0 32c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-48 0-80c0-8.8 7.2-16 16-16zm32 80c13.3 0 24-10.7 24-24s-10.7-24-24-24l-16 0 0 48 16 0zm96-80l32 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-32 0c-8.8 0-16-7.2-16-16l0-128c0-8.8 7.2-16 16-16zm32 128c8.8 0 16-7.2 16-16l0-64c0-8.8-7.2-16-16-16l-16 0 0 96 16 0zm80-112c0-8.8 7.2-16 16-16l48 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 32 32 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 48c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-64 0-64z" />
            </svg>
            Văn bản
          </Button>
          <Button
            className="flex gap-2 p-2.5 transition-all duration-300"
            onClick={handleOpenEditDrawer}
            variant="text"
            color="blue"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
              />
            </svg>
            Cập nhật
          </Button>
          <Chip
            variant="ghost"
            color={contractDetail.active ? "green" : "red"}
            className="ml-auto"
            size="sm"
            value={contractDetail.active ? "Còn hiệu lực" : "Đã thanh lý"}
            icon={
              <span
                className={clsx(
                  "mx-auto mt-1 block h-2 w-2 rounded-full content-['']",
                  contractDetail.active ? "bg-green-900" : "bg-red-900",
                )}
              />
            }
          />
        </div>
        <Typography variant="h6">{contractDetail.contractName}</Typography>
        <CardBody>
          <div className="mb-5 grid grid-cols-4 gap-2">
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
            className="ag-theme-quartz h-[500px] w-full" // applying the Data Grid theme
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
      </Card>

      {/*   Drawer edit hợp đồng */}

      <React.Fragment>
        <Drawer
          open={open}
          onClose={handleCloseEditDrawer}
          placement="right"
          className="pt-4"
          size={500}
          dismiss={{ enabled: false }}
        >

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
              contractUrl: Yup.mixed()
                .required("Yêu cầu tải lên văn bản pdf")
                .test("fileFormat", "Yêu cầu định dạng pdf", (value) => {
                  if (value && typeof value === "object") {
                    const supportedFormats = ["pdf"];
                    return supportedFormats.includes(
                      value.name.split(".").pop(),
                    );
                  }
                  return true;
                }),
              endDate: Yup.string().required(
                "Yêu cầu nhập ngày kết thúc hợp đồng",
              ),
            })}
          >
            {({
              values,
              resetForm,
              errors,
              isSubmitting,
              isValid,
              setFieldValue,
              handleChange,
            }) => (
              <Form className="flex flex-initial flex-shrink flex-col">
                <div className="flex items-center justify-between px-4 pb-2">
                  <Typography variant="h4" color="blue">
                    Cập nhật thông tin hợp đồng
                  </Typography>

                  <IconButton
                    variant="text"
                    color="blue-gray"
                    onClick={() => handleDismissEditDrawer(resetForm)}
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
                  <Typography variant="small" color="gray" className="font-normal">
                    Cập nhật thông tin cơ bản của hợp đồng
                  </Typography>
                </div>
                <DialogBody className="space-y-4 pb-6">
                  <Card className="shadow-none">
                    <div className="grid grid-cols-12 gap-3 p-2">
                      <div className="col-span-full flex justify-end gap-2">
                        {/*<label className="text-slate-400 font-semibold">*/}
                        {/*  Trạng thái*/}
                        {/*</label>*/}
                        <Field
                          as={Switch}
                          name="active"
                          color="green"
                          label={
                            <Typography variant="h6">
                              {values.active ? 'Còn hiệu lực' : 'Đã thanh lý'}
                            </Typography>
                          }
                          checked={values.active}
                          onChange={({ target }) =>
                            setFieldValue("active", target.checked)
                          } // Thiết lập giá trị true/false
                        />
                      </div>
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
                          className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        ></Field>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="endDate"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Tải lên văn bản hợp đồng
                        </label>
                        {contractDetail.contractUrl ? (
                          <Button

                            color="blue"
                            size="sm"

                            onClick={() => {
                              window.open(contractDetail.contractUrl, "_blank");
                            }}
                          >
                            Văn bản hợp đồng
                          </Button>
                        ) : (
                          <Typography color="blue-gray">
                            - Chưa có hợp đồng
                          </Typography>
                        )}
                        <input
                          type="file"
                          name="contractUrl"
                          accept=".pdf"
                          className="w-full cursor-pointer rounded border bg-white text-sm font-semibold text-gray-400 file:mr-4 file:cursor-pointer file:border-0 file:bg-gray-100 file:px-4 file:py-3 file:text-gray-500 file:hover:bg-gray-200"
                          onChange={(e) => {
                            // Object is possibly null error w/o check
                            const file = e.currentTarget.files[0];
                            if (e.currentTarget.files) {
                              setFieldValue(
                                "contractUrl",
                                file || currentContractPdf,
                              );
                            }
                          }}
                        ></input>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="contractUrl"
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
            )}
          </Formik>
        </Drawer>
      </React.Fragment>
    </>
  );
}

export default FoConTractDetail;
