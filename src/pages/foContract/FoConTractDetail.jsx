import React, { useEffect, useMemo, useState, useRef, useCallback  } from "react";
import Select from "react-select";
import { DateTime } from "luxon";
import { CustomMenuList } from "../CustomList.jsx"; 
// import { contractDB } from "../../services/firebase/config.js";
import { clsx } from "clsx";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Drawer,
  IconButton,
  Switch,
  Typography,
} from "@material-tailwind/react";
import FoContractDocuments from "./FoContractDocuments";
import InfoCard from "./component/InfoCard.jsx";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid/index.js";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-material.css"; // Optional Theme applied to the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css";
import * as Yup from "yup";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { toast } from "react-toastify"; // Optional Theme applied to the Data Grid
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import "../../Styles/aggrid.css";
function FoConTractDetail(props) {
  const { id, onUpdated } = props;
  const [contractDetail, setContractDetail] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const axiosInstance = useAxiosPrivate();
  const VND = useMemo(() => new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }), []);
  const [openEditLine, setOpenEditLine] = useState(false);
  const [editLine, setEditLine] = useState(null);

  const handleEdit = useCallback(async (lineId) => {
    try {
      const res = await axiosInstance.get(`/hired-fos/${lineId}`);
      setEditLine(res.data);
      setOpenEditLine(true);
    } catch (err) {
      console.log(err);
      toast.error("Không load được dữ liệu tuyến FO");
    }
  }, [axiosInstance]);
  
  const handleDeleteRouter = async (lineId) => {
    console.log("delete", lineId);
    // sau này gọi API delete ở đây
  };

  const colDefs = useMemo(() => ([
    {
      headerName: "STT",
      width: 70,
      valueGetter: (params) => params.node.rowIndex + 1,
      sortable: false,
      filter: false,
    },
    {
      headerName: "Tên tuyến",
      valueGetter: (p) => p.data.nearSite?.siteId + " - " + p.data.farSite?.siteId,
    },
    {
      headerName: "Tỉnh",
      valueGetter: (p) => p.data.nearSite?.province?.name || "",
      headerClass: "ag-center-header",
      cellClass: "ag-center-cell",
    },
    {
      headerName: "Khoảng cách",
      width: 130,
      valueGetter: (p) => p.data.finalDistance,
      headerClass: "ag-center-header",
      cellClass: "ag-center-cell",
    },
    {
      headerName: "Số core",
      width: 100,
      valueGetter: (p) => p.data.coreQuantity,
      headerClass: "ag-center-header",
      cellClass: "ag-center-cell",
    },
    {
      headerName: "Đơn giá/km",
      valueGetter: (p) => p.data.cost,
      cellRenderer: (p) => VND.format(p.data.cost || 0),
      headerClass: "ag-center-header",
      cellClass: "ag-center-cell",
    },
    {
      headerName: "Thành tiền / Tháng",
      valueGetter: (p) => (p.data.cost || 0) * (p.data.finalDistance || 0),
      cellRenderer: (p) => VND.format(p.value || 0),
      headerClass: "ag-center-header",
      cellClass: "ag-center-cell",
    },
    {
      headerName: "Trạng thái",
      cellRenderer: (p) => (
        <span className={`inline-flex items-center ${
          p.data.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        } text-xs font-medium px-2.5 py-0.5 rounded-full`}>
          <span className={`w-2 h-2 me-1 ${
            p.data.active ? "bg-green-500" : "bg-red-500"
          } rounded-full`}></span>
          {p.data.active ? "Hoạt động" : "Không hoạt động"}
        </span>
      ),
    },
    { headerName: "Ghi chú", valueGetter: (p) => p.data.note },
    {
      headerName: "Tác động",
      cellRenderer: (p) => (
        <div className="flex items-center justify-center">
          <IconButton variant="text" size="sm" onClick={() => handleEdit(p.data.id)}>
            <PencilIcon className="h-4 w-4 text-gray-900" />
          </IconButton>
          <IconButton variant="text" size="sm" onClick={() => handleDeleteRouter(p.data.id)}>
            <TrashIcon strokeWidth={3} className="h-4 w-4 text-gray-900" />
          </IconButton>
        </div>
      ),
    },
  ]), [VND, handleEdit]);


  const whiteSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "white",
      color: "black",
      borderColor: state.isFocused ? "#93c5fd" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(147,197,253,0.5)" : "none",
    }),
    singleValue: (base) => ({ ...base, color: "black" }),
    input: (base) => ({ ...base, color: "black" }),
    menu: (base) => ({ ...base, backgroundColor: "white", color: "black" }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#f3f4f6" : "white",
      color: "black",
    }),
  };

  const [openDocuments, setOpenDocuments] = useState(false);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true,
    minWidth: 60,
  }), []);

  const totalKm = useMemo(() => {
  if (!contractDetail?.hiredFoLineList) return 0;

  return contractDetail.hiredFoLineList.reduce(
    (sum, item) => sum + (item.finalDistance || 0),
    0
  );
  }, [contractDetail]);

  const totalAmountBeforeTax = useMemo(() => {
    if (!contractDetail?.hiredFoLineList) return 0;

    return contractDetail.hiredFoLineList.reduce(
      (sum, item) =>
        sum + (item.cost || 0) * (item.finalDistance || 0),
      0
    );
  }, [contractDetail]);
  
  const totalVat = useMemo(() => {
    return totalAmountBeforeTax * 0.1;
  }, [totalAmountBeforeTax]);

  
  const totalAmountAfterTax = useMemo(() => {
    return totalAmountBeforeTax + totalVat;
  }, [totalAmountBeforeTax, totalVat]);
    const [open, setOpen] = useState(false);



  const [owners, setOwners] = useState([]);
  useEffect(() => {
    axiosInstance.get("/transmission-owner/all")
      .then(res => setOwners(res.data))
      .catch(err => console.error(err));
  }, []);

  // ==== STATE Up file PDF ====== //
  const [pdfFiles, setPdfFiles] = useState([]);

  // ==== STATE QUẢN LÝ PDF ====== //
  const [pdfList, setPdfList] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const loadPdfList = async (contractId) => {
  try {
    const res = await axiosInstance.get(
      `/contract/${contractId}/pdfs`
    );
    setPdfList(res.data);
  } catch (err) {
    console.error("Load pdf list error", err);
  }
};
  useEffect(() => {
    // 🔴 RESET TRƯỚC
    setPdfList([]);
    if (contractDetail?.id) {
      loadPdfList(contractDetail.id);
    }
  }, [contractDetail?.id]);

  // ==== Lưu số hợp đồng cũ ====== //
  const onFirstDataRendered = (params) => {
    const allColumns = params.api.getColumns();
    if (!allColumns) return;

    const colIds = allColumns.map(col => col.getId());
    params.api.autoSizeColumns(colIds);
  };



  const oldContractNumberRef = useRef();
  useEffect(() => {
    if (contractDetail?.contractNumber) {
      oldContractNumberRef.current = contractDetail.contractNumber;
    }
  }, [contractDetail?.contractNumber]);


 // ==== Refresh web ====== //
  const formikRef = useRef(null);
  const loadContract = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(`/contracts/${id}`);
      setContractDetail({ ...res.data }); // tạo reference mới
    } catch (err) {
      console.error("Load contract error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContract();
  }, [id]);

  // const openDrawer = () => setOpen(true);
  const closeDrawer = () => setOpen(false);

  function handleOpenEditDrawer() {
    if (formikRef.current) {
      formikRef.current.resetForm({
        values: {
          id: contractDetail.id,
          contractNumber: contractDetail.contractNumber,
          contractName: contractDetail.contractName,
          signedDate: contractDetail.signedDate,
          endDate: contractDetail.endDate,
          active: contractDetail.active,
          contractUrl: null,
        }
      });
    }
    setOpen(true);
  }
  const [simpleSiteList, setSimpleSiteList] = useState([]);

  useEffect(() => {
    const loadSites = async () => {
      try {
        const res = await axiosInstance.get("/sites/simple-list");
        setSimpleSiteList(res.data);
      } catch (e) {
        console.log(e);
        toast.error("Không load được danh sách site");
      }
    };
    loadSites();
  }, []);


  const handleEditLineSubmit = useCallback(async (values) => {
    try {
      const payload = {
        id: values.id,
        coreQuantity: Number(values.coreQuantity),
        cost: Number(values.cost),
        designedDistance: Number(values.designedDistance || 0),
        finalDistance: Number(values.finalDistance || 0),
        active: !!values.active,
        note: values.note || "",
        nearSite: { id: Number(values.nearSite.id) },
        farSite: { id: Number(values.farSite.id) },
        foContract: { id: Number(contractDetail.id) },
      };

      await axiosInstance.put(`/hired-fos/${values.id}`, payload);
      toast.success("Cập nhật tuyến FO thành công");

      setOpenEditLine(false);
      setEditLine(null);

      await loadContract();
    } catch (err) {
      console.log(err);
      toast.error(err?.response?.data?.message || "Cập nhật tuyến FO thất bại");
    }
  }, [axiosInstance, contractDetail?.id, loadContract]);


  const handleUpdateContract = async (values) => {
    try {
      const oldNumber = oldContractNumberRef.current;
      const newNumber = values.contractNumber;

      // 1️⃣ NẾU ĐỔI SỐ HỢP ĐỒNG → RENAME FOLDER
      if (oldNumber !== newNumber) {
        await axiosInstance.put(`/contract/${id}/change-number`, {
          contractNumber: newNumber
        });
      }

      // 2️⃣ update các field khác
      await axiosInstance.put(`/contract/${id}`, {
        contractNumber: values.contractNumber, 
        contractName: values.contractName,
        signedDate: values.signedDate,
        endDate: values.endDate,
        active: values.active,
        note: values.note,
        transmissionOwnerId: values.transmissionOwnerId
      });

      // 3️⃣ UPLOAD PDF (NẾU CÓ)
      if (pdfFiles.length > 0) {
        const formData = new FormData();
        pdfFiles.forEach((file) => {
          formData.append("files", file);
        });

        await axiosInstance.post(
          `/contract/${values.id}/upload-pdfs`,
          formData
        );
      }

      toast.success("Cập nhật thành công");
      setPdfFiles([]);
      closeDrawer();
      await loadContract();
      // refresh luôn danh mục hợp đồng bên trái
      if (typeof onUpdated === "function") {
        onUpdated({
          id: values.id,
          contractNumber: values.contractNumber,
          signedDate: values.signedDate,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Cập nhật thất bại");
    }
  };



  function handleCloseEditDrawer(resetForm) {
    if (typeof resetForm === "function") {
      resetForm();
    }
    setPdfFiles([]);
    closeDrawer();
  }



  if (!contractDetail) return <p>Không có thông tin </p>;

  function handleDismissEditDrawer(resetForm) {
    resetForm();
    setPdfFiles([]); // 🔴 BẮT BUỘC
    closeDrawer();
  }

  
  const hasPdf = (pdfList?.length ?? 0) > 0;

  return (
    <>
      <div className="mt-6 rounded-none text-blue-gray-600 flex flex-col h-full">
        <div className="mb-3 flex items-center justify-start gap-2 border-b">
          <div className="flex items-center gap-1 border-b-2 border-blue-600 pb-1 pr-1 uppercase text-blue-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-4"
            >
              <path
                fillRule="evenodd"
                d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z"
                clipRule="evenodd"
              />
              <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
            </svg>
            <Typography variant="h6" className="font-semibold">
              {contractDetail.contractNumber}
            </Typography>
          </div>
          <Button
            title={hasPdf ? "Xem văn bản hợp đồng" : "Chưa có văn bản PDF"}
            variant="text"
            size="sm"
            className={clsx(
              "p-2.5 transition-all duration-200",
              hasPdf
                ? "text-blue-500 hover:bg-blue-50"
                : "text-gray-400 cursor-not-allowed"
            )}
            onClick={() => {
              if (!hasPdf) {
                toast.info("Hợp đồng chưa có văn bản PDF. Vui lòng cập nhập dữ liệu!");
                return;
              }
              setOpenDocuments(true);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              className="size-4"
              fill="currentColor"   // ⭐ QUAN TRỌNG
            >
              <path d="M64 464l48 0 0 48-48 0c-35.3 0-64-28.7-64-64L0 64C0 28.7 28.7 0 64 0L229.5 0c17 0 33.3 6.7 45.3 18.7l90.5 90.5c12 12 18.7 28.3 18.7 45.3L384 304l-48 0 0-144-80 0c-17.7 0-32-14.3-32-32l0-80L64 48c-8.8 0-16 7.2-16 16l0 384c0 8.8 7.2 16 16 16zM176 352l32 0c30.9 0 56 25.1 56 56s-25.1 56-56 56l-16 0 0 32c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-48 0-80c0-8.8 7.2-16 16-16zm32 80c13.3 0 24-10.7 24-24s-10.7-24-24-24l-16 0 0 48 16 0zm96-80l32 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-32 0c-8.8 0-16-7.2-16-16l0-128c0-8.8 7.2-16 16-16zm32 128c8.8 0 16-7.2 16-16l0-64c0-8.8-7.2-16-16-16l-16 0 0 96 16 0zm80-112c0-8.8 7.2-16 16-16l48 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 32 32 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 48c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-64 0-64z" />
            </svg>
          </Button>
          <Button
            className="flex gap-1 p-1.5 transition-all duration-300"
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

        {contractDetail.contractName && (
          <Typography variant="h6">
            {contractDetail.contractName}
          </Typography>
        )}
        <CardBody>
          <div className="mb-5 grid grid-cols-4 gap-2">
            <div className="col-span-4 lg:col-span-2 xl:col-span-1">
              <InfoCard
                header="Số tuyến cáp"
                content={contractDetail.hiredFoLineList.length}
              />
              <InfoCard
                header="Tổng số KM"
                content={`${totalKm.toFixed(2)} km`}
             />
            </div>
            <div className="col-span-4 lg:col-span-2 xl:col-span-1">
              <InfoCard
                header="Nhà cung cấp"
                content={contractDetail.transmissionOwner?.name || ""}
              />
              <InfoCard
                header="Tổng giá trị hợp đồng (trước thuế)"
                content={VND.format(totalAmountBeforeTax)}
              />
            </div>
            <div className="col-span-4 lg:col-span-2 xl:col-span-1">
              <InfoCard
                header="Ngày ký hợp đồng"
                content={DateTime.fromISO(contractDetail.signedDate)
                  .setLocale("vn")
                  .toFormat("dd-MM-yyyy")}
              />
              <InfoCard
                header="Thuế VAT %"
                content={VND.format(totalVat)}
              />
            </div>
            <div className="col-span-4 lg:col-span-2 xl:col-span-1">
              <InfoCard
                header="Ngày kết thúc hợp đồng"
                content={DateTime.fromISO(contractDetail.endDate)
                  .setLocale("vn")
                  .toFormat("dd-MM-yyyy")}
              />

              <InfoCard
                  header="Tổng giá trị hợp đồng (sau thuế)"
                  content={VND.format(totalAmountAfterTax)}
                />
            </div>
          </div>

          <div
            className="ag-theme-quartz h-[500px] w-full max-w-full overflow-hidden" // applying the Data Grid theme
          // style={{ height: "400px", width: "100%" }} // the Data Grid will fill the size of the parent container
          >
          <AgGridReact
            rowData={contractDetail.hiredFoLineList}
            columnDefs={colDefs}
            defaultColDef={defaultColDef}
            onFirstDataRendered={onFirstDataRendered} 
          />
          </div>
      </CardBody>
      {/*   Drawer edit hợp đồng */}

      <React.Fragment>
        <Drawer
          open={open}
          onClose={() =>
            handleCloseEditDrawer(formikRef.current?.resetForm)
          }
          placement="right"
          className="pt-4"
          size={500}
          dismiss={{ enabled: false }}
        >

          <Formik
            innerRef={formikRef}
            initialValues={{
              id: contractDetail.id,
              contractNumber: contractDetail.contractNumber,
              contractName: contractDetail.contractName,
              signedDate: contractDetail.signedDate,
              endDate: contractDetail.endDate,
              active: contractDetail.active,
              contractUrl: null, // 🔥 FILE LUÔN LUÔN NULL
              transmissionOwnerId: contractDetail.transmissionOwner?.id || "",
              note: contractDetail.note || "",
            }}

            enableReinitialize={true}
            onSubmit={handleUpdateContract}
            validationSchema={Yup.object({
              contractNumber: Yup.string().required("Yêu cầu nhập số hợp đồng"),
              contractName: Yup.string().required("Yêu cầu nhập tên hợp đồng"),
              signedDate: Yup.date().required("Yêu cầu nhập ngày ký hợp đồng"),
              contractUrl: Yup.mixed().nullable(),
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
                      <div className="col-span-full flex justify-end gap-3 items-center">
                        <Typography variant="h6" className="text-blue-gray-600">
                          {values.active ? "Còn hiệu lực" : "Đã thanh lý"}
                        </Typography>

                        <Switch
                          checked={values.active}
                          color="green"
                          onChange={() => setFieldValue("active", !values.active)}
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

                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Nhà cung cấp
                        </label>

                        <select
                          name="transmissionOwnerId"
                          value={values.transmissionOwnerId}
                          onChange={handleChange}
                          className="rounded border border-gray-300 px-2 py-1"
                        >
                          <option value="">-- Chọn nhà cung cấp --</option>
                          {owners.map(o => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))}
                        </select>
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
                          Ngày kết thúc
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
                        {contractDetail.contractUrl && (
                          <Typography color="blue-gray">
                            Văn bản hợp đồng
                          </Typography>
                        )}
                        <input
                          type="file"
                          accept="application/pdf"
                          multiple
                          className="w-full cursor-pointer rounded border bg-white text-sm
                                    file:mr-4 file:border-0 file:bg-gray-100
                                    file:px-4 file:py-2 file:text-gray-600"
                          onChange={(e) => {
                            const selectedFiles = Array.from(e.target.files || []);

                            setPdfFiles((prev) => [
                              ...prev,
                              ...selectedFiles.filter(
                                f => !prev.some(p => p.name === f.name)
                              )
                            ]);

                            e.target.value = null; // ⭐ cho phép chọn lại file cùng tên
                          }}
                        ></input>
                        {pdfFiles.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {pdfFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between rounded bg-green-100 px-3 py-2 text-sm"
                              >
                                <span className="truncate">
                                  📄 {file.name}
                                </span>

                                <button
                                  type="button"
                                  className="ml-2 text-red-500 hover:text-red-700"
                                  onClick={() =>
                                    setPdfFiles(prev =>
                                      prev.filter((_, i) => i !== index)
                                    )
                                  }
                                >
                                  ❌
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="contractUrl"
                          component="span"
                        ></ErrorMessage>
                      </div>
                    </div>
                    <div className="col-span-full flex flex-col gap-2">
                      <label className="text-slate-400 font-semibold">
                        Ghi chú
                      </label>
                      <Field
                        as="textarea"
                        name="note"
                        rows={3}
                        placeholder="Nhập ghi chú"
                        className="rounded border border-gray-300 px-2 py-1 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </Card>
                </DialogBody>
                <DialogFooter>
                  <Button
                    size="md"
                    type="submit"
                    color="red"
                  >
                    Cập nhật dữ liệu
                  </Button>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </Drawer>
      {/* ===== DRAWER VĂN BẢN HỢP ĐỒNG ===== */}
      {openDocuments && (
        <Drawer
          open
          onClose={() => setOpenDocuments(false)}
          placement="right"
          size="90%"
          className="pt-4"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 pb-2 border-b">
            <Typography variant="h4" color="blue">
              📄 Văn bản hợp đồng
            </Typography>

            <IconButton
              variant="text"
              color="blue-gray"
              onClick={() => setOpenDocuments(false)}
            >
              ✖
            </IconButton>
          </div>

          {/* BODY */}
          <div className="h-[calc(100%-60px)] overflow-hidden">
            <FoContractDocuments contractId={contractDetail.id} />
          </div>
        </Drawer>
      )}
      <Dialog open={openEditLine} handler={() => setOpenEditLine(false)} size="sm">
        <div className="max-h-[90vh] overflow-y-auto p-3">
          <DialogHeader className="relative m-0 block">
            <Typography variant="h4" color="blue">
              Cập nhật tuyến FO
            </Typography>
            <IconButton
              size="sm"
              variant="text"
              className="!absolute right-3.5 top-3.5"
              onClick={() => setOpenEditLine(false)}
            >
              ✖
            </IconButton>
          </DialogHeader>

          {editLine && (
            <Formik
              enableReinitialize
              initialValues={{
                id: editLine.id,
                active: editLine.active ?? true,

                // nearSite / farSite phải là object theo DTO
                nearSite: { id: editLine.nearSite?.id || "" },
                farSite: { id: editLine.farSite?.id || "" },

                coreQuantity: editLine.coreQuantity ?? 1,
                cost: editLine.cost ?? 0,
                designedDistance: editLine.designedDistance ?? 0,
                finalDistance: editLine.finalDistance ?? 0,
                note: editLine.note || "",
              }}
              validationSchema={Yup.object({
                coreQuantity: Yup.number().moreThan(0, "Yêu cầu lớn hơn 0").required("Nhập số core"),
                nearSite: Yup.object({ id: Yup.string().required("Chọn Site A") }),
                farSite: Yup.object({ id: Yup.string().required("Chọn Site B") }),
                cost: Yup.number().min(0, ">= 0").required("Nhập đơn giá"),
                finalDistance: Yup.number().min(0, ">= 0").required("Nhập chiều dài thực tế"),
              })}
              onSubmit={async (values) => {
                try {
                  const payload = {
                    id: values.id,
                    coreQuantity: Number(values.coreQuantity),
                    cost: Number(values.cost),
                    designedDistance: Number(values.designedDistance || 0),
                    finalDistance: Number(values.finalDistance || 0),
                    active: !!values.active,
                    note: values.note || "",

                    nearSite: { id: Number(values.nearSite.id) },
                    farSite: { id: Number(values.farSite.id) },

                    // 🔥 đảm bảo contract luôn đúng
                    foContract: { id: Number(contractDetail.id) },
                  };

                  await axiosInstance.put(`/hired-fos/${values.id}`, payload);

                  toast.success("Cập nhật tuyến FO thành công");
                  setOpenEditLine(false);
                  setEditLine(null);

                  // ✅ refresh UI ngay
                  await loadContract();
                } catch (err) {
                  console.log(err);
                  toast.error(err?.response?.data?.message || "Cập nhật thất bại");
                }
              }}
            >
              {({ values, setFieldValue }) => (
                <Form>
                  <DialogBody className="space-y-4 pb-6">

                    {/* ACTIVE */}
                    <div className="flex justify-end">
                      <Switch
                        checked={values.active}
                        color="green"
                        label={
                          <Typography variant="h6">
                            {values.active ? "Đang hoạt động" : "Không hoạt động"}
                          </Typography>
                        }
                        onChange={(e) => setFieldValue("active", e.target.checked)}
                      />
                    </div>

                    {/* SITE A */}
                    <div className="flex flex-col gap-2">
                      <label className="text-slate-400 font-semibold">Site A</label>

                      <Select
                        value={simpleSiteList.find(s => s.id === Number(values.nearSite.id)) || null}
                        onChange={(opt) => setFieldValue("nearSite.id", opt.id)}
                        options={simpleSiteList}
                        getOptionLabel={(opt) => opt.siteId}
                        getOptionValue={(opt) => String(opt.id)}
                        placeholder="Chọn Site A"
                        styles={whiteSelectStyles}   // ✅ đổi nền trắng chữ đen
                        components={{ MenuList: CustomMenuList }}
                      />

                      <ErrorMessage name="nearSite.id" component="span"
                        className="text-sm italic text-red-500" />
                    </div>

                    {/* SITE B */}
                    <div className="flex flex-col gap-2">
                      <label className="text-slate-400 font-semibold">Site B</label>

                      <Select
                        value={simpleSiteList.find(s => s.id === Number(values.farSite.id)) || null}
                        onChange={(opt) => setFieldValue("farSite.id", opt.id)}
                        options={simpleSiteList}
                        getOptionLabel={(opt) => opt.siteId}
                        getOptionValue={(opt) => String(opt.id)}
                        placeholder="Chọn Site B"
                        styles={whiteSelectStyles}   // ✅ đổi nền trắng chữ đen
                        components={{ MenuList: CustomMenuList }}
                      />

                      <ErrorMessage name="farSite.id" component="span"
                        className="text-sm italic text-red-500" />
                    </div>

                    {/* CORE */}
                    <div className="flex flex-col gap-2">
                      <label className="text-slate-400 font-semibold">Số core</label>
                      <Field
                        name="coreQuantity"
                        type="number"
                        className="rounded border border-gray-300 bg-white text-black px-2 py-1"
                      />
                      <ErrorMessage name="coreQuantity" component="span"
                        className="text-sm italic text-red-500" />
                    </div>

                    {/* FINAL DIST */}
                    <div className="flex flex-col gap-2">
                      <label className="text-slate-400 font-semibold">Chiều dài thực tế (km)</label>
                      <Field
                        name="finalDistance"
                        type="number"
                        className="rounded border border-gray-300 bg-white text-black px-2 py-1"
                      />
                      <ErrorMessage name="finalDistance" component="span"
                        className="text-sm italic text-red-500" />
                    </div>

                    {/* COST */}
                    <div className="flex flex-col gap-2">
                      <label className="text-slate-400 font-semibold">Đơn giá (VNĐ/km)</label>
                      <Field
                        name="cost"
                        type="number"
                        className="rounded border border-gray-300 bg-white text-black px-2 py-1"
                      />
                      <ErrorMessage name="cost" component="span"
                        className="text-sm italic text-red-500" />
                    </div>

                    {/* NOTE */}
                    <div className="flex flex-col gap-2">
                      <label className="text-slate-400 font-semibold">Ghi chú</label>
                      <Field
                        as="textarea"
                        name="note"
                        rows={3}
                        className="rounded border border-gray-300 bg-white text-black px-2 py-1"
                      />
                    </div>

                  </DialogBody>

                  <DialogFooter>
                    <Button variant="text" onClick={() => setOpenEditLine(false)}>
                      Đóng
                    </Button>
                    <Button color="red" type="submit">
                      Cập nhật
                    </Button>
                  </DialogFooter>
                </Form>
              )}
            </Formik>
          )}
        </div>
      </Dialog>

      </React.Fragment>
      </div> 
    </>
  );
}

export default FoConTractDetail;
