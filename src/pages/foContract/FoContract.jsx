import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import { ArrowRightCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import React from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { checkExcelImport } from "../../services/FoContractService.jsx";
import * as XLSX from "xlsx";
import { PlusIcon } from "@heroicons/react/24/outline";
import {
  Stepper,
  Step,
  Button,
  Card,
  CardHeader,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  Chip,
  Accordion,
  AccordionHeader,
  AccordionBody,
  Input,
  Dialog,
  IconButton,
  DialogBody,
  DialogHeader,
  DialogFooter,
} from "@material-tailwind/react";
import { HashtagIcon } from "@heroicons/react/24/solid";
import {
  MagnifyingGlassIcon,
  CogIcon,
  UserIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";
import FoConTractDetail from "./FoConTractDetail.jsx";

function FoContract() {
  const [simpleSiteList, setSimpleSiteList] = useState([]);
  const [contractList, setContractList] = useState([]);
  const [newContract, setNewContract] = useState({
    contractNumber: "",
    contractName: "",
    signedDate: null,
    endDate: null,
    contractUrl: null,
    transmissionOwner: { id: 1 },
    note: "",
  });
  const [transmissionOwnerList, setTransmissionOwnerList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = React.useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState();
  const [openCreate, setOpenCreate] = useState(false);
  const [activeStep, setActiveStep] = React.useState(0);
  const [isLastStep, setIsLastStep] = React.useState(false);
  const [isFirstStep, setIsFirstStep] = React.useState(false);
  const [pdfFiles, setPdfFiles] = useState([]);

  // ===== STEP 2 – EXCEL =====
  const [excelFile, setExcelFile] = useState(null);
  const [excelErrors, setExcelErrors] = useState({});
  const [excelChecked, setExcelChecked] = useState(false); // đã bấm kiểm tra
  const [excelSuccess, setExcelSuccess] = useState(false); // excel hợp lệ
  
  // // ===== STEP 3 – Save DB =====
  const [excelRows, setExcelRows] = useState([]); // dữ liệu excel hợp lệ
  const [saving, setSaving] = useState(false);



  const axiosInstance = useAxiosPrivate();
  useEffect(() => {
    const getAllTransmissionOwner = async () => {
      try {
        const transmissionOwners =
          await axiosInstance.get("transmissionOwners");
        setTransmissionOwnerList(transmissionOwners.data);
      } catch (error) {
        console.log(error);
      }
    };
    getAllTransmissionOwner();
  }, []);

  
  const loadContractList = async () => {
  setIsLoading(true);
  try {
    const response = await axiosInstance.get("/contract/all");
    setContractList(response.data);
  } catch (e) {
    console.log(e);
  } finally {
    setIsLoading(false);
  }
};
useEffect(() => {
  loadContractList();
}, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const siteList = await axiosInstance.get("sites/simple-list");
        setSimpleSiteList(siteList.data);
      } catch (error) {
        console.log(error);
      }
    };
    loadData();
  }, []);

  const handleOpen = (year) => {
    setOpen(
      Object.keys(open).includes(String(year))
        ? { ...open, [year]: !open[year] }
        : { ...open, [year]: true }
    );
  };

  function handleContractSearch(e) {
    setSearchTerm(e.target.value);
  }

  const contractListWithSearch = [...contractList]
    .sort((a, b) => {
      const diffDate = new Date(a.signedDate) - new Date(b.signedDate);
      if (diffDate === 0)
        return a.contractNumber.localeCompare(b.contractNumber);
      return diffDate;
    })
    .filter((contract) =>
      contract.contractNumber.includes(searchTerm)
    );


  const contractByYearWithSearch = contractListWithSearch.reduce(
    (acc, contract) => {
      const year = new Date(contract.signedDate).getFullYear();
      if (!acc[year]) {
        acc[year] = 0;
      }
      acc[year]++;
      return acc;
    },
    {}
  );  
  const contractArrayByYearWithSearch = Object.entries(
    contractByYearWithSearch
  ).map(([year, count]) => ({
    year: parseInt(year),
    count,
  }));
  // Xử lý thêm mới
  const handleOpenCreate = () => {
    setOpenCreate(!openCreate);
    if (openCreate) {
      setActiveStep(0);
      setPdfFiles([]);
      setExcelFile(null);
      setExcelRows([]);
      setExcelErrors({});
      setExcelChecked(false);
      setExcelSuccess(false);
    }
  };


  // ----- Hàm Check File Excel -----
  const handleCheckExcel = async (contractNumber) => {
    if (!excelFile) {
      toast.warning("Vui lòng chọn file Excel");
      return;
    }

    try {
      const res = await checkExcelImport(excelFile, contractNumber);

      setExcelErrors({});
      setExcelSuccess(true);
      setExcelChecked(true);
      setExcelRows(res.rows || []);

      toast.success("✔ File Excel hợp lệ");
    } catch (err) {
      if (err.response?.status === 400) {
        setExcelErrors(err.response.data || {});
        setExcelSuccess(false);
        setExcelChecked(true);
      } else {
        toast.error("Lỗi hệ thống khi kiểm tra Excel");
      }
    }
  };

  const isDuplicateContractNumber = (contractNumber) => {
    const key = (contractNumber || "").trim();
    if (!key) return false;

    return contractList.some(
      (c) => (c.contractNumber || "").trim() === key
    );
  };

  const handleFinish = async (values) => {
    try {
      setSaving(true);
      const formData = new FormData();

      // JSON
      formData.append(
        "data",
        JSON.stringify({
          contractNumber: values.contractNumber,
          contractName: values.contractName,
          signedDate: values.signedDate,
          endDate: values.endDate,
          note: values.note,
          transmissionOwner: {
            id: values.transmissionOwner.id
          }
        })
      );

      // PDF
      pdfFiles.forEach((file) => {
        formData.append("pdfFiles", file);
      });



      // EXCEL (file gốc đã upload ở step 2)
      formData.append("excelFile", excelFile);

      // 🚫 KHÔNG headers
      const res = await axiosInstance.post(
        "/contract/full-create",
        formData
      );
      console.log(res.data)

      toast.success("🎉 Tạo hợp đồng thành công");
      await loadContractList();

      // ✅ TỰ ĐỘNG MỞ HỢP ĐỒNG VỪA TẠO
      setSelectedId(res.data.id);
  
      // Đợi render list xong
      setTimeout(() => {
        setSelectedId(res.data.id);
      }, 0);

      // ✅ MỞ ĐÚNG NĂM
      const year = new Date(res.data.signedDate).getFullYear();
      setOpen((prev) => ({
        ...prev,
        [year]: true,
      }));
      setOpenCreate(false);
      setActiveStep(0);

    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 409) {
        toast.error(data?.message || "Số hợp đồng đã tồn tại");
        setActiveStep(0);           // quay lại bước nhập thông tin
        return;
      }

      if (status === 400) {
        // backend checkExcelOnly trả errorMap, full-create có thể trả message
        toast.error(data?.message || "Dữ liệu không hợp lệ");
        return;
      }

      toast.error(data?.message || "❌ Lỗi khi lưu hợp đồng");
    } finally {
      setSaving(false);
    }
  };



  const validateStep1 = Yup.object({
    contractNumber: Yup.string().required("Yêu cầu nhập số hợp đồng"),
    contractName: Yup.string().required("Yêu cầu nhập tên hợp đồng"),
    signedDate: Yup.date().required("Yêu cầu nhập ngày ký"),
    endDate: Yup.date().required("Yêu cầu nhập ngày hết hạn"),
    transmissionOwner: Yup.object({
      id: Yup.string().required("Yêu cầu nhập nhà cung cấp"),
    }),
  });

  const onBtnExport = () => {
    const headers = [
      "Số hợp đồng",
      "Tên hợp đồng",
      "Ngày ký",
      "Ngày hết hạn",
      "Nhà cung cấp",
      "Ghi chú",
    ];

    const dataToExport = contractList.map((contract) => ({
      "Số hợp đồng": contract.contractNumber,
      "Tên hợp đồng": contract.contractName,
      "Ngày ký": contract.signedDate,
      "Ngày hết hạn": contract.endDate,
      "Nhà cung cấp": contract.transmissionOwner?.name,
      "Ghi chú": contract.note,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contracts");
    XLSX.writeFile(workbook, "ContractList.xlsx");
  };

  // const handleNext = () => !isLastStep && setActiveStep((cur) => cur + 1);
  const handlePrev = () => !isFirstStep && setActiveStep((cur) => cur - 1);
  const handleNext = async (values, {validateForm, setErrors, setTouched}) => {
    console.log(values);
    const errors = await validateForm();    
    console.log(errors);    
    if (Object.keys(errors).length === 0) {      
      !isLastStep && setActiveStep((cur) => cur + 1);
    }
    else {
      setTouched( {contractNumber: true,
        contractName: true,
        signedDate: true,
        endDate: true,
        contractUrl: true,
        transmissionOwner: { id: true }
        });
      setErrors(errors)
    }
  };
  // if (isLoading) return <Spinner />;
return (
  <div className={`flex gap-2 p-3`}>
    <div className="flex-shrink-0">
      <div className="h-[calc(100vh-2rem)] max-w-max overflow-y-auto border-r-2 border-r-gray-300 p-1">
        <div className="mb-1 flex items-center gap-2 justify-between">
          <Typography variant="h6" color="blue-gray">
            Danh mục hợp đồng
          </Typography>

          <div className="flex gap-2">
            {/* Nút thêm mới: icon + giống code mới */}
            <Button
              variant="gradient"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleOpenCreate}
            >
              <PlusIcon className="h-4 w-4" />
            </Button>

            {/* Nút xuất Excel giống code mới */}
            <Button
              variant="gradient"
              size="sm"
              color="green"
              className="flex items-center gap-2"
              onClick={onBtnExport}
            >
              Xuất Excel
            </Button>
          </div>
        </div>

        <div className="p-0">
          <Input
            icon={<MagnifyingGlassIcon className="h-4 w-4" />}
            variant="standard"
            label="Tìm theo tên hợp đồng"
            onChange={handleContractSearch}
            value={searchTerm}
          />
        </div>

        {/* Danh sách hợp đồng theo năm */}
        <List className="p-0">
          {contractArrayByYearWithSearch.map((item) => (
            <Accordion
              key={item.year}
              open={!!open[item.year]}
              icon={
                <Chip
                  value={item.count}
                  variant="ghost"
                  size="sm"
                  color="blue"
                  className="rounded-full"
                />
              }
            >
              <ListItem className="p-0">
                <AccordionHeader
                  onClick={() => handleOpen(item.year)}
                  className="border-b-0 p-2"
                >
                  <ListItemPrefix>
                    <HashtagIcon className="h-3 w-3" />
                  </ListItemPrefix>
                  <Typography color="blue" className="mr-auto font-semibold text-sm">
                    {item.year}
                  </Typography>
                </AccordionHeader>
              </ListItem>

              <AccordionBody className="py-0.5">
                <List className="p-0">
                  {contractListWithSearch
                    .filter(
                      (contract) =>
                        new Date(contract.signedDate).getFullYear() === item.year
                    )
                    .map((contract) => (
                      <ListItem
                        key={contract.id}
                        selected={contract.id === selectedId}
                        onClick={() => setSelectedId(contract.id)}
                      >
                        <ListItemPrefix>
                          <ArrowRightCircleIcon strokeWidth={2} className="h-2 w-2" />
                        </ListItemPrefix>
                        <Typography color="blue-gray" className="text-sm">
                          {contract.contractNumber}
                        </Typography>
                      </ListItem>
                    ))}
                </List>
              </AccordionBody>
            </Accordion>
          ))}
        </List>
      </div>
    </div>
    <div className="flex-grow">
      {selectedId && (
        <FoConTractDetail
          id={selectedId}
          onUpdated={async (updatedContract) => {
            // refresh lại danh mục hợp đồng
            await loadContractList();

            // (tuỳ chọn) đảm bảo năm của hợp đồng đang mở
            if (updatedContract?.signedDate) {
              const year = new Date(updatedContract.signedDate).getFullYear();
              setOpen((prev) => ({ ...prev, [year]: true }));
            }
          }}
        />
      )}
    </div>
      {/* Modal Thêm mới */}

      <Dialog
        open={openCreate}
        handler={handleOpenCreate}
        size="lg"
      >
        <div className="max-h-[90vh] overflow-y-auto p-3">
          <DialogHeader className="relative m-0 block">
            <Typography variant="h4" color="blue">
              Thêm mới hợp đồng thuê FO
            </Typography>
            <Typography className="mt-1 font-normal text-gray-600">
              Đảm bảo dữ liệu đồng bộ
            </Typography>
            <IconButton
              size="sm"
              variant="text"
              className="!absolute right-3.5 top-3.5"
              onClick={handleOpenCreate}
            >
              <XMarkIcon className="h-4 w-4 stroke-2" />
            </IconButton>
          </DialogHeader>
          <div className="w-full px-24 py-4">
            <Stepper
              activeStep={activeStep}
              isLastStep={(value) => setIsLastStep(value)}
              isFirstStep={(value) => setIsFirstStep(value)}
            >
              <Step>
                <UserIcon className="h-5 w-5" />
                <div className="absolute -bottom-[2rem] w-max text-center">
                  <Typography
                    variant="h6"
                    color={activeStep === 0 ? "blue-gray" : "gray"}
                  >
                    Thông tin cơ bản
                  </Typography>
                </div>
              </Step>
              <Step>
                <CogIcon className="h-5 w-5" />
                <div className="absolute -bottom-[2rem] w-max text-center">
                  <Typography
                    variant="h6"
                    color={activeStep === 1 ? "blue-gray" : "gray"}
                  >
                    Nhập danh sách tuyến cáp
                  </Typography>
                </div>
              </Step>
              <Step>
                <BuildingLibraryIcon className="h-5 w-5" />
                <div className="absolute -bottom-[2rem] w-max text-center">
                  <Typography
                    variant="h6"
                    color={activeStep === 2 ? "blue-gray" : "gray"}
                  >
                    Tổng hợp & phê duyệt dữ liệu

                  </Typography>
                </div>
              </Step>
            </Stepper>
            <div className="mt-10">
              <div>
                  <Formik
                    initialValues={newContract}
                    validationSchema={validateStep1}
                    enableReinitialize
                  >
                  {({ setFieldValue,  values, setErrors, isSubmitting, validateForm,setTouched }) => (
                    <Form className="flex flex-initial flex-shrink flex-col">
                      <div className="space-y-4 pb-6 overflow-visible">
                        {activeStep === 0 && (
                          <Card className="shadow-none">
                            <div className="grid grid-cols-12 gap-3 p-2 ">
                              <div className="col-span-full flex flex-col items-stretch gap-2">
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

                              <div className="col-span-full flex flex-col items-stretch gap-2">
                                <label className="text-slate-400 font-semibold">
                                  Tên hợp đồng
                                </label>
                                <Field
                                  name="contractName"
                                  placeholder="Nhập tên hợp đồng"
                                  className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                ></Field>
                                <ErrorMessage
                                  className="justify-items-end text-sm font-light italic text-red-500"
                                  name="contractName"
                                  component="span"
                                ></ErrorMessage>
                              </div>

                              <div className="col-span-full flex flex-col items-stretch gap-2">
                                <label className="text-slate-400 font-semibold">
                                  Nhà cung cấp
                                </label>
                                <Field
                                  className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  as="select"
                                  name="transmissionOwner.id"
                                >
                                  {transmissionOwnerList.map((owner) => {
                                    return (
                                      <option key={owner.id} value={owner.id}>
                                        {owner.name}
                                      </option>
                                    );
                                  })}
                                </Field>
                              </div>
                              <div className="col-span-full flex flex-col items-stretch gap-2">
                                <label className="text-slate-400 font-semibold">
                                  Ngày ký
                                </label>
                                <Field
                                  name="signedDate"
                                  placeholder="Nhập ngày ký"
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
                                  Ngày hết hạn
                                </label>
                                <Field
                                  name="endDate"
                                  placeholder="Nhập ngày hết hạn"
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
                                <input
                                  type="file"
                                  name="contractUrl"
                                  accept=".pdf"
                                  multiple                 // ⭐ cho phép chọn nhiều
                                  className="w-full cursor-pointer rounded border bg-white text-sm font-semibold text-gray-400
                                            file:mr-4 file:border-0 file:bg-gray-100 file:px-4 file:py-3 file:text-gray-500"
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files || []);

                                    if (files.length > 0) {
                                      setPdfFiles((prev) => [
                                        ...prev,
                                        ...files.filter(
                                          f => !prev.some(p => p.name === f.name) // tránh trùng
                                        ),
                                      ]);

                                      setFieldValue("contractUrl", files[0].name); // chỉ để validate
                                    }

                                    e.target.value = null; // cho phép chọn lại cùng file
                                  }}
                                ></input>
                                {pdfFiles.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    {pdfFiles.map((file, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                                      >
                                        <span className="flex items-center gap-2 truncate text-gray-700">
                                          📄 {file.name}
                                        </span>

                                        <button
                                          type="button"
                                          className="text-red-500 hover:text-red-700"
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
                              <div className="col-span-full col-start-1 mb-3 flex flex-col items-stretch gap-2 md:col-span-12">
                                <label className="text-slate-400 font-semibold">
                                  Ghi chú
                                </label>
                                <Field
                                  className="h-24 h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  as="textarea"
                                  name="note"
                                ></Field>
                              </div>
                            </div>
                          </Card>
                        )}
                        {activeStep === 1 && (
                        <Card className="shadow-none">

                          {/* ===== GRID: Upload + Button ===== */}
                          <div className="grid grid-cols-12 gap-3 p-2">

                            {/* Upload Excel */}
                            <div className="col-span-full mt-6 flex flex-col gap-2">
                              <label className="text-slate-400 font-semibold">
                                Tải file Excel theo mẫu (
                                <a
                                  href="/template/Danh sach FO trien khai v2.xlsx"
                                  title="Tải file Excel chuẩn để nhập dữ liệu"
                                  className="text-blue-500 italic hover:underline"
                                >
                                  File mẫu
                                </a>
                                )
                              </label>

                              <input
                                type="file"
                                accept=".xlsx"
                                className="w-full rounded border"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setExcelFile(file);
                                    setExcelErrors({});
                                    setExcelRows([]);
                                    setExcelChecked(false);
                                    setExcelSuccess(false);
                                  }
                                }}
                              />
                              {excelFile && (
                                <div className="mt-2 text-sm text-blue-700">
                                  📊 File Excel: <b>{excelFile.name}</b>
                                </div>
                              )}
                            </div>

                            {/* Button kiểm tra */}
                            <div className="col-span-full">
                              <Button
                                type="button"
                                color="blue"
                                onClick={() => handleCheckExcel(values.contractNumber)}
                              >
                                KIỂM TRA DỮ LIỆU EXCEL
                              </Button>

                              {excelSuccess && (
                                <div className="mt-3 rounded border border-green-300 bg-green-50 p-3 text-green-700">
                                  ✔ File Excel hợp lệ, bạn có thể tiếp tục bước tiếp theo
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* ===== ERROR BOX – NGOÀI GRID ===== */}
                          {activeStep === 1 && excelChecked && !excelSuccess && Object.keys(excelErrors).length > 0 && (

                            <div className="mt-6 w-full rounded-lg border border-red-400 bg-red-50 p-5 shadow-md">

                              {/* Header */}
                              <div className="mb-3 text-lg font-semibold text-red-600">
                                ❌ Dữ liệu Excel không hợp lệ
                              </div>
                              {/* Total lỗi */}
                              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                                Tổng số dòng lỗi
                                <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
                                  {Object.keys(excelErrors).length}
                                </span>
                              </div>

                              {/* Scroll bên trong */}
                              <div className="max-h-[320px] overflow-y-auto space-y-4 pr-2">

                                {Object.entries(excelErrors).map(([row, rowError]) => (
                                  <div
                                    key={row}
                                    className="rounded border border-red-200 bg-white p-4"
                                  >
                                    <div className="mb-2 font-semibold text-red-700">
                                    ⚠️ Dòng {row}
                                    </div>

                                    <ul className="ml-5 list-disc space-y-1 text-sm text-gray-800">
                                      {rowError.errors.map((err, idx) => (
                                        <li key={idx}>
                                          <span className="font-semibold text-red-600">
                                            {err.column}:
                                          </span>{" "}
                                          {err.message}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </Card>
                        )}
                        {activeStep === 2 && (
                        <Card className="shadow-none">
                          <div className="p-4 space-y-4">

                            <Typography variant="h5" color="blue-gray">
                              Xác nhận dữ liệu trước khi lưu
                            </Typography>

                            {/* ===== Thông tin hợp đồng ===== */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div><b>Số hợp đồng:</b> {values.contractNumber}</div>
                              <div><b>Tên hợp đồng:</b> {values.contractName}</div>
                              <div><b>Ngày ký:</b> {values.signedDate}</div>
                              <div><b>Ngày hết hạn:</b> {values.endDate}</div>
                            </div>

                            {/* ===== Danh sách tuyến FO ===== */}
                            <div className="overflow-x-auto">
                              <table className="w-full border text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="border px-2 py-1">#</th>
                                    {/* <th className="border px-2 py-1">Tỉnh</th> */}
                                    <th className="border px-2 py-1">Trạm đầu</th>
                                    <th className="border px-2 py-1">Trạm cuối</th>
                                    <th className="border px-2 py-1">Core</th>
                                    <th className="border px-2 py-1">Thiết kế</th>
                                    <th className="border px-2 py-1">Thực tế</th>
                                    <th className="border px-2 py-1">Đơn giá</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {excelRows.map((r, i) => (
                                    <tr key={i}>
                                      <td className="border px-2 py-1">{i + 1}</td>
                                      {/* <td className="border px-2 py-1">{r.provinceName}</td> */}
                                      <td className="border px-2 py-1">{r.nearSite}</td>
                                      <td className="border px-2 py-1">{r.farSite}</td>
                                      <td className="border px-2 py-1">{r.coreQuantity}</td>
                                      <td className="border px-2 py-1">{r.designedDistance}</td>
                                      <td className="border px-2 py-1">{r.finalDistance}</td>
                                      <td className="border px-2 py-1">{r.cost}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                          </div>
                        </Card>
                      )}
                      </div>
                        
                      {/* <DialogBody className="space-y-4 pb-6"></DialogBody> */}
                      <div className="flex justify-between">
                        <Button onClick={handlePrev} disabled={isFirstStep}>
                          Quay lại
                        </Button>

                        {!isLastStep ?
                          <Button
                            size="md"
                            color="blue"
                            onClick={() => {

                              // ✅ STEP 1: CHẶN TRÙNG SỐ HỢP ĐỒNG NGAY TỪ BƯỚC 0
                              if (activeStep === 0 && isDuplicateContractNumber(values.contractNumber)) {
                                toast.error("Số hợp đồng đã tồn tại, vui lòng nhập tên khác!");
                                return;
                              }

                              // 🚫 STEP 2 CHƯA KIỂM TRA
                              if (activeStep === 1 && !excelChecked) {
                                toast.error("Bạn chưa kiểm tra file Excel");
                                return;
                              }

                              // 🚫 STEP 2 CÓ LỖI
                              if (activeStep === 1 && !excelSuccess) {
                                toast.error("File Excel còn lỗi, không thể tiếp tục");
                                return;
                              }

                              // ✅ OK → qua step tiếp
                              handleNext(values, { validateForm, setErrors, setTouched });
                            }}
                          >
                            Tiếp theo
                          </Button>
                        : <Button
                            size="md"
                            color="green"
                            disabled={saving}
                            onClick={() => handleFinish(values)}
                          >
                            {saving ? "Đang lưu..." : "Hoàn thành"}
                          </Button>  
                        }
                      </div>
                    </Form>
                  )}                  
                </Formik>
              </div>
            </div>
          </div>

          {/* <div className="mt-32 flex justify-between">
            <Button onClick={handlePrev} disabled={isFirstStep}>
              Prev
            </Button>
            <Button onClick={handleNext} disabled={isLastStep}>
              Next
            </Button>
          </div> */}
        </div>
      </Dialog>
    </div>
  );
}
export default FoContract;
