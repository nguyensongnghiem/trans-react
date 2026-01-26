import { useEffect, useMemo, useState } from "react";
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import React from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { checkExcelImport } from "../../services/FoContractService.jsx";
import * as XLSX from "xlsx";
import {
  Stepper,
  Step,
  Button,
  Card,
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
  IconButton as MTIconButton,
} from "@material-tailwind/react";
import {
  CogIcon,
  UserIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";
import FoConTractDetail from "./FoConTractDetail.jsx";
import FoContractEditDrawer from "./FoContractEditDrawer.jsx";
import Select from "react-select";
import StatusChip from "../../components/StatusChip.jsx";
import CustomButton from "../../components/CustomButton.jsx";
import { DateTime } from "luxon";

function FoContract() {
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

  // Dialog states
  const [openCreate, setOpenCreate] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [startInEditMode, setStartInEditMode] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Filter and pagination states
  const [filters, setFilters] = useState({
    search: "",
    transmissionOwner: null,
    year: null,
    status: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // Stepper states for creation
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

  // Filtering and Pagination Logic
  const filteredContracts = useMemo(() => {
    return contractList.filter((contract) => {
      const matchOwner =
        !filters.transmissionOwner ||
        contract.transmissionOwner?.id === filters.transmissionOwner.id;
      const matchYear =
        !filters.year ||
        new Date(contract.signedDate).getFullYear() === filters.year.value;
      const matchStatus =
        !filters.status || contract.active === filters.status.value;
      const matchSearch =
        !filters.search ||
        contract.contractNumber
          ?.toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        contract.contractName
          ?.toLowerCase()
          .includes(filters.search.toLowerCase());

      return matchOwner && matchYear && matchStatus && matchSearch;
    });
  }, [contractList, filters]);

  const totalPages = Math.ceil(filteredContracts.length / rowsPerPage);
  const paginatedContracts = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredContracts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredContracts, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      search: "",
      transmissionOwner: null,
      year: null,
      status: null,
    });
  };

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
      const res = await checkExcelImport(
        axiosInstance,
        excelFile,
        contractNumber,
      );

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
            id: values.transmissionOwner.id,
          },
        }),
      );

      // PDF
      pdfFiles.forEach((file) => {
        formData.append("pdfFiles", file);
      });

      // EXCEL (file gốc đã upload ở step 2)
      formData.append("excelFile", excelFile);

      // 🚫 KHÔNG headers
      const res = await axiosInstance.post("/contract/full-create", formData);
      console.log(res.data);

      toast.success("🎉 Tạo hợp đồng thành công");
      await loadContractList();

      // Close create modal and open detail modal for the new contract
      setOpenCreate(false);
      handleOpenDetail(res.data.id);
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 409) {
        toast.error(data?.message || "Số hợp đồng đã tồn tại");
        setActiveStep(0); // quay lại bước nhập thông tin
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

    const dataToExport = filteredContracts.map((contract) => ({
      "Số hợp đồng": contract.contractNumber,
      "Tên hợp đồng": contract.contractName,
      "Ngày ký": contract.signedDate,
      "Ngày hết hạn": contract.endDate,
      "Nhà cung cấp": contract.transmissionOwner?.name,
      "Ghi chú": contract.note,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport, {
      header: headers,
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contracts");
    XLSX.writeFile(workbook, "ContractList.xlsx");
  };

  // const handleNext = () => !isLastStep && setActiveStep((cur) => cur + 1);
  const handlePrev = () => !isFirstStep && setActiveStep((cur) => cur - 1);
  const handleNext = async (
    values,
    { validateForm, setErrors, setTouched },
  ) => {
    console.log(values);
    const errors = await validateForm();
    console.log(errors);
    if (Object.keys(errors).length === 0) {
      !isLastStep && setActiveStep((cur) => cur + 1);
    } else {
      setTouched({
        contractNumber: true,
        contractName: true,
        signedDate: true,
        endDate: true,
        contractUrl: true,
        transmissionOwner: { id: true },
      });
      setErrors(errors);
    }
  };

  const handleOpenDetail = (id) => {
    setStartInEditMode(false);
    setDetailId(id);
    setOpenDetail(true);
    setOpenEdit(false);
  };

  const handleOpenEdit = (id) => {
    setStartInEditMode(true);
    setDetailId(id);
    setOpenEdit(true);
    setOpenDetail(false);
  };

  const handleCloseDetail = () => {
    setDetailId(null);
    setOpenDetail(false);
    setStartInEditMode(false);
  };

  const handleCloseEdit = () => {
    setDetailId(null);
    setOpenEdit(false);
    setStartInEditMode(false);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/contract/${deleteId}`);
      toast.success("Xóa hợp đồng thành công!");
      loadContractList();
    } catch (error) {
      toast.error("Lỗi khi xóa hợp đồng.");
    } finally {
      setOpenDelete(false);
      setDeleteId(null);
    }
  };

  const yearOptions = useMemo(() => {
    const years = new Set(
      contractList.map((c) => new Date(c.signedDate).getFullYear()),
    );
    return Array.from(years)
      .sort((a, b) => b - a)
      .map((y) => ({ label: y, value: y }));
  }, [contractList]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Danh sách hợp đồng
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số:{" "}
            <span className="font-semibold text-blue-600">
              {filteredContracts.length}
            </span>{" "}
            / {contractList.length} hợp đồng
          </p>
        </div>
        <div className="flex gap-2">
          <CustomButton
            className="flex items-center gap-2 bg-[#0d47a1] hover:bg-[#0a3a82]"
            size="sm"
            onClick={handleOpenCreate}
          >
            <PlusIcon className="h-4 w-4" />
            Thêm mới
          </CustomButton>
          <CustomButton
            className="flex items-center gap-2 bg-[#1d6f42] hover:bg-[#155d36]"
            size="sm"
            onClick={onBtnExport}
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Xuất Excel
          </CustomButton>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm mb-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4 text-blue-gray-700">
          <FunnelIcon className="h-5 w-5" />
          <span className="font-bold text-sm uppercase tracking-wider">
            Bộ lọc tìm kiếm
          </span>
          {(filters.search ||
            filters.transmissionOwner ||
            filters.year ||
            filters.status) && (
            <button
              onClick={handleResetFilters}
              className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
            >
              <ArrowPathIcon className="h-3 w-3" />
              Xóa bộ lọc
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <Input
            icon={<MagnifyingGlassIcon className="h-4 w-4" />}
            placeholder="Số/Tên hợp đồng..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
          />
          {/* Transmission Owner Filter */}
          <Select
            isClearable
            placeholder="Nhà cung cấp"
            options={transmissionOwnerList}
            getOptionLabel={(o) => o.name}
            getOptionValue={(o) => o.id}
            value={filters.transmissionOwner}
            onChange={(val) =>
              setFilters((prev) => ({ ...prev, transmissionOwner: val }))
            }
          />
          {/* Year Filter */}
          <Select
            isClearable
            placeholder="Năm ký"
            options={yearOptions}
            value={filters.year}
            onChange={(val) => setFilters((prev) => ({ ...prev, year: val }))}
          />
          {/* Status Filter */}
          <Select
            isClearable
            placeholder="Trạng thái"
            options={[
              { label: "Còn hiệu lực", value: true },
              { label: "Đã thanh lý", value: false },
            ]}
            value={filters.status}
            onChange={(val) => setFilters((prev) => ({ ...prev, status: val }))}
          />
        </div>
      </div>

      {/* Contracts Table */}
      <Card className="w-full overflow-hidden border border-gray-200 shadow-sm rounded-xl">
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full min-w-max table-auto text-left">
            {/* Table Header */}
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50/90 backdrop-blur-sm border-b border-gray-200">
                {["Số HĐ", "Tên hợp đồng", "Nhà cung cấp", "Ngày ký", "Ngày hết hạn", "Trạng thái", "Tác động"].map(head => (
                  <th key={head} className="p-4"><Typography variant="small" color="blue-gray" className="font-bold leading-none">{head}</Typography></th>
                ))}
              </tr>
            </thead>
            {/* Table Body */}
            <tbody className="divide-y divide-gray-100">
              {paginatedContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-4"><Typography variant="small" color="blue-gray" className="font-bold">{contract.contractNumber}</Typography></td>
                  <td className="p-4 max-w-xs truncate"><Typography variant="small" color="blue-gray" className="font-normal">{contract.contractName}</Typography></td>
                  <td className="p-4"><Typography variant="small" color="blue-gray" className="font-normal">{contract.transmissionOwner?.name}</Typography></td>
                  <td className="p-4"><Typography variant="small" color="blue-gray" className="font-normal">{DateTime.fromISO(contract.signedDate).toFormat("dd/MM/yyyy")}</Typography></td>
                  <td className="p-4"><Typography variant="small" color="blue-gray" className="font-normal">{DateTime.fromISO(contract.endDate).toFormat("dd/MM/yyyy")}</Typography></td>
                  <td className="p-4"><StatusChip active={contract.active} labelOn="Còn hiệu lực" labelOff="Đã thanh lý" /></td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1">
                      <IconButton variant="text" size="sm" color="gray" onClick={() => handleOpenDetail(contract.id)}><EyeIcon className="h-4 w-4" /></IconButton>
                      <IconButton variant="text" size="sm" color="blue" onClick={() => handleOpenEdit(contract.id)}><PencilIcon className="h-4 w-4" /></IconButton>
                      <IconButton variant="text" size="sm" color="red" onClick={() => handleDelete(contract.id)}><TrashIcon className="h-4 w-4" /></IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {/* ... (Copy from SiteList2.jsx) ... */}
      </Card>

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
                  {({ setFieldValue, values, setErrors, isSubmitting, validateForm, setTouched }) => (
                    <Form
                      className="flex flex-initial flex-shrink flex-col"
                      onSubmit={(e) => {
                        e.preventDefault(); // Prevent default form submission
                      }}
                    >
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

        </div>
      </Dialog>

      {/* Modal Chi tiết */}
      <Dialog open={openDetail} handler={handleCloseDetail} size="xl">
        <DialogHeader className="justify-between">
          <Typography variant="h5" color="blue-gray">
            Chi tiết hợp đồng
          </Typography>
          <IconButton color="blue-gray" size="sm" variant="text" onClick={handleCloseDetail}>
            <XMarkIcon strokeWidth={2} className="h-5 w-5" />
          </IconButton>
        </DialogHeader>
        <DialogBody className="overflow-y-auto max-h-[80vh]">
          {detailId && (
            <FoConTractDetail
              id={detailId}
              onUpdated={async () => {
                await loadContractList();
              }}
              onTriggerEdit={(idToEdit) => {
                handleCloseDetail();
                handleOpenEdit(idToEdit);
              }}
            />
          )}
        </DialogBody>
      </Dialog>

      {/* Drawer Edit (Render độc lập, không nằm trong Modal) */}
      {openEdit && detailId && (
        <FoContractEditDrawer
          id={detailId}
          onUpdated={() => {
            loadContractList();
            handleCloseEdit();
          }}
          onClose={handleCloseEdit}
        />
      )}

      {/* Modal Xóa */}
      <Dialog open={openDelete} handler={() => setOpenDelete(false)} size="sm">
        <DialogHeader>Xác nhận xóa</DialogHeader>
        <DialogBody>Bạn có chắc chắn muốn xóa hợp đồng này?</DialogBody>
        <DialogFooter><Button variant="text" color="gray" onClick={() => setOpenDelete(false)}>Hủy</Button><Button color="red" onClick={confirmDelete}>Xóa</Button></DialogFooter>
      </Dialog>
    </div>
  );
}
export default FoContract;
