import { useEffect, useMemo, useState, useRef } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/solid";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Select from "react-select";
import * as Yup from "yup";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as XLSX from "xlsx";
import {
  Button,
  Card,
  Dialog,
  IconButton,
  Typography,
  DialogBody,
  DialogHeader,
  DialogFooter,
  Switch,
  Tooltip,
  Input,
  IconButton as MTIconButton,
  Spinner,
} from "@material-tailwind/react";
import { CustomMenuList } from "./CustomList";
import { toast } from "react-toastify";
import useHiredFos from "../hooks/useHiredFos";

import useSimpleSites from "../hooks/useSimpleSites";
import useContracts from "../hooks/useContracts";
import useMetadata from "../hooks/useMetadata";
import CustomButton from "../components/CustomButton";
import StatusChip from "../components/StatusChip";
import OwnerChip from "../components/OwnerChip";
import StatusBadge from "../components/StatusBadge";
import { FoLineStatus, FoLineStatusLabels, FoLineStatusColors, getFoLineStatusOptions } from "../constants/statusConstants";
import FormSelect from "../components/FormSelect";
function HiredFoList() {
  const {
    hiredFos: hiredFoList,
    isLoading: isHiredFosLoading,
    createHiredFo,
    updateHiredFo,
    deleteHiredFo,
    downloadImportTemplate,
    checkImportMulti,

    saveImportMulti,
    getHiredFoById,
  } = useHiredFos();

  const {
    simpleSites: simpleSiteList,
    isLoading: isSitesLoading,
  } = useSimpleSites();

  const {
    contracts,
    isLoading: isContractsLoading,
  } = useContracts();

  const {
    provinces,
    transOwners,
    fiberTypes,
    foConnectionTypes,
  } = useMetadata();

  const [deleteId, setDeleteId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [editFoLine, setEditFoLine] = useState({});
  const [editId, setEditId] = useState(null);

  // ===== Import Multi Contract Excel =====
  const [importOpen, setImportOpen] = useState(false);
  const [excelFile, setExcelFile] = useState(null);

  const [excelChecked, setExcelChecked] = useState(false);
  const [excelSuccess, setExcelSuccess] = useState(false);

  const [excelErrors, setExcelErrors] = useState({});
  const [excelRows, setExcelRows] = useState([]);

  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  // Filter and pagination states
  const [filters, setFilters] = useState({
    search: "",
    contract: null,
    status: null,
    province: null,
    supplier: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // Helper functions for data extraction
  const getProvinceName = (item) => {
    if (item.nearSite?.province?.name) return item.nearSite.province.name;
    if (item.nearSiteId && simpleSiteList.length > 0) {
      const site = simpleSiteList.find((s) => s.id === item.nearSiteId);
      return site?.province?.name;
    }
    return null;
  };

  const getNearSiteCode = (item) => item.nearSite?.siteId || item.nearSiteSiteId || "";
  const getFarSiteCode = (item) => item.farSite?.siteId || item.farSiteSiteId || "";
  const getSupplierName = (item) => item.foContract?.transmissionOwner?.name || item.foContract?.transmissionOwnerName || "";
  const getContractNumber = (item) => item.foContract?.contractNumber || "";
  const getIsActive = (item) => item.status === 'OPERATING' || item.active === true;

  // Filter Logic
  const filterOptions = useMemo(() => {
    return {
      contracts: contracts.map((c) => ({
        value: c.contractNumber,
        label: c.contractNumber,
      })),
      provinces: provinces.map((p) => ({
        value: p.name,
        label: p.name,
      })),
      suppliers: transOwners.map((s) => ({
        value: s.name,
        label: s.name,
      })),
    };
  }, [contracts, provinces, transOwners]);

  const filteredHiredFos = useMemo(() => {
    return hiredFoList.filter((item) => {
      const matchContract =
        !filters.contract ||
        getContractNumber(item) === filters.contract.value;

      const matchStatus =
        !filters.status || item.status === filters.status.value;

      const provinceName = getProvinceName(item);
      const matchProvince =
        !filters.province ||
        provinceName === filters.province.value;

      const supplierName = getSupplierName(item);
      const matchSupplier =
        !filters.supplier ||
        supplierName === filters.supplier.value;

      const nearSiteCode = getNearSiteCode(item);
      const farSiteCode = getFarSiteCode(item);
      const contractNum = getContractNumber(item);
      const note = item.note || "";

      const matchSearch =
        !filters.search ||
        (nearSiteCode + " - " + farSiteCode)
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        note.toLowerCase().includes(filters.search.toLowerCase()) ||
        contractNum.toLowerCase().includes(filters.search.toLowerCase());

      return (
        matchContract &&
        matchStatus &&
        matchSearch &&
        matchProvince &&
        matchSupplier
      );
    });
  }, [hiredFoList, filters, simpleSiteList]);

  const totalPages = Math.ceil(filteredHiredFos.length / rowsPerPage);
  const paginatedHiredFos = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredHiredFos.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredHiredFos, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      search: "",
      contract: null,
      status: null,
      province: null,
      supplier: null,
    });
  };

  // Helper: Map Formik values (Nested) to Backend DTO (Flat)
  const mapFormToRequest = (values, isCreate = false) => {
    const payload = {
      nearSiteId: values.nearSite?.id || null,
      farSiteId: values.farSite?.id || null,
      foContractId: values.foContract?.id || null,
      coreQuantity: values.coreQuantity || 0,
      hiredCoreQuantity: values.hiredCoreQuantity || 0,
      usedCoreQuantity: values.usedCoreQuantity || 0,
      designedDistance: values.designedDistance || 0,
      finalDistance: values.finalDistance || 0,
      cost: values.cost || 0,
      fiberTypeId: values.fiberType?.id || null,
      foConnectionTypeId: values.foConnectionType?.id || null,
      note: values.note || "",
      status: values.status || FoLineStatus.OPERATING,
    };

    if (!isCreate) {
      payload.id = values.id;
    }

    return payload;
  };


  const getFoById = async (editId) => {
    const data = await getHiredFoById(editId);
    if (data) {
      setEditFoLine(data);
    }
  };

  // Xử lý thêm mới
  const handleOpenCreate = () => {
    setOpenCreate(!openCreate);
  };
  const handleCreate = async (values) => {
    const payload = mapFormToRequest(values, true);
    const success = await createHiredFo(payload);
    if (success) {
      setOpenCreate(false);
    }
  };
  // Xử lý Edit

  const handleEdit = async (editId) => {
    await getFoById(editId);
    handleOpenEdit();
  };

  const handleOpenEdit = () => {
    setOpenEdit(!openEdit);
  };


  const handleEditSubmit = async (values) => {
    const payload = mapFormToRequest(values);
    const success = await updateHiredFo(payload.id, payload);
    if (success) {
      setOpenEdit(false);
    }
  };

  // Xử lý Xóa

  const handleDeleteRouter = async (deleteId) => {
    setDeleteId(deleteId);
    handleOpenDelete();
  };
  const handleOpenDelete = () => {
    setOpenDelete(!openDelete);
  };
  const handleDeleteSubmit = async () => {
    const success = await deleteHiredFo(deleteId);
    if (success) {
      setDeleteId(null);
      setOpenDelete(false);
    }
  };

  // Select Site A/B: nền trắng chữ đen
  const whiteSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "white",
      color: "black",
      borderColor: state.isFocused ? "#93c5fd" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 1px #93c5fd" : "none",
      "&:hover": { borderColor: "#93c5fd" },
      minHeight: "38px",
    }),
    singleValue: (base) => ({
      ...base,
      color: "black",
    }),
    input: (base) => ({
      ...base,
      color: "black",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#6b7280",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "white",
      color: "black",
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#bfdbfe"
        : state.isFocused
          ? "#e5e7eb"
          : "white",
      color: "black",
    }),
  };

  // Hàm mở file excel
  const handleOpenImport = () => {
    setImportOpen((prev) => !prev);

    if (importOpen) {
      setExcelFile(null);
      setExcelChecked(false);
      setExcelSuccess(false);
      setExcelErrors({});
      setExcelRows([]);
      setSaving(false);
      setChecking(false);
    }
  };
  // Hàm Check file excel
  const handleCheckExcelMulti = async () => {
    if (!excelFile) {
      toast.warning("Vui lòng chọn file Excel");
      return;
    }

    setChecking(true);
    try {
      const form = new FormData();
      form.append("file", excelFile);

      const res = await checkImportMulti(form);

      setExcelRows(res?.rows || []);
      setExcelErrors({});
      setExcelChecked(true);
      setExcelSuccess(true);
    } catch (err) {
      if (err?.response?.status === 400) {
        setExcelErrors(err.response.data || {});
        setExcelRows([]);
        setExcelChecked(true);
        setExcelSuccess(false);
      }
    } finally {
      setChecking(false);
    }
  };
  // Hàm Lưu file excel
  const handleSaveExcelMulti = async () => {
    if (!excelSuccess) {
      toast.error("File Excel chưa hợp lệ, không thể lưu");
      return;
    }

    try {
      setSaving(true);
      const form = new FormData();
      form.append("file", excelFile);

      await saveImportMulti(form);

      setImportOpen(false);
      setExcelFile(null);
      setExcelChecked(false);
      setExcelSuccess(false);
      setExcelErrors({});
      setExcelRows([]);
    } catch (err) {
      if (err?.response?.status === 400) {
        setExcelErrors(err.response.data || {});
        setExcelChecked(true);
        setExcelSuccess(false);
      }
    } finally {
      setSaving(false);
    }
  };

  // Xử lý kéo thả file
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const f = files[0];
      if (f.name.endsWith(".xlsx") || f.name.endsWith(".xls")) {
        setExcelFile(f);
        setExcelChecked(false);
        setExcelSuccess(false);
        setExcelErrors({});
        setExcelRows([]);
      } else {
        toast.warning("Vui lòng chọn file Excel (.xlsx, .xls)");
      }
    }
  };

  const handleDownloadTemplate = async () => {
    await downloadImportTemplate();
  };

  const VND = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  let deleteRouterName;
  if (deleteId != null) {
    const item = hiredFoList.find((r) => r.id === deleteId);
    if (item) {
      const near = item.nearSiteSiteId || item.nearSite?.siteId || "Unknown";
      const far = item.farSiteSiteId || item.farSite?.siteId || "Unknown";
      deleteRouterName = `${near} - ${far}`;
    }
  }

  const onBtnExport = () => {
    const dataToExport = filteredHiredFos.map((item) => {
      const provinceName = getProvinceName(item);
      const near = getNearSiteCode(item);
      const far = getFarSiteCode(item);
      const supplier = getSupplierName(item);
      const statusLabel = FoLineStatusLabels[item.status] || item.status;

      return {
        Tỉnh: provinceName,
        "Tên tuyến": `${near} - ${far}`,
        "Khoảng cách (km)": item.finalDistance,
        "Dung lượng cáp": item.coreQuantity,
        "Số core thuê": item.hiredCoreQuantity,
        "Số core sử dụng": item.usedCoreQuantity,
        "Loại cáp": item.fiberType?.name || item.fiberTypeName || "",
        "Loại kết nối": item.foConnectionType?.name || item.foConnectionTypeName || "",
        "Đơn giá (VNĐ)": item.cost,
        "Số hợp đồng": getContractNumber(item),
        "Nhà cung cấp": supplier,
        "Trạng thái": statusLabel,
        "Ghi chú": item.note,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "HiredFo");
    XLSX.writeFile(workbook, "HiredFo.xlsx");
  };
  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Danh sách FO thuê
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số:{" "}
            <span className="font-semibold text-blue-600">
              {filteredHiredFos.length}
            </span>{" "}
            / {hiredFoList.length} tuyến
          </p>
        </div>
        <div className="flex gap-2">
          <CustomButton
            className="flex items-center gap-2 bg-[#0d47a1] hover:bg-[#0a3a82]"
            size="sm"
            onClick={handleOpenCreate}
          >
            <PlusIcon strokeWidth={2} className="h-4 w-4" /> Thêm mới
          </CustomButton>
          <CustomButton
            className="flex items-center gap-2 bg-[#e65100] hover:bg-[#bf360c]"
            size="sm"
            onClick={handleOpenImport}
          >
            <ArrowUpTrayIcon strokeWidth={2} className="h-4 w-4" /> Import excel
          </CustomButton>
          <CustomButton
            className="flex items-center gap-2 bg-[#1d6f42] hover:bg-[#155d36]"
            size="sm"
            onClick={onBtnExport}
          >
            <ArrowDownTrayIcon className="h-4 w-4" /> Xuất Excel
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
            filters.contract ||
            filters.status ||
            filters.province ||
            filters.supplier) && (
              <button
                onClick={handleResetFilters}
                className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
              >
                <ArrowPathIcon className="h-3 w-3" />
                Xóa bộ lọc
              </button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">
              Tỉnh
            </span>
            <Select
              isClearable
              placeholder="Tất cả tỉnh"
              className="text-sm"
              options={filterOptions.provinces}
              value={filters.province}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, province: val }))
              }
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "40px",
                  borderRadius: "8px",
                  borderColor: "#e2e8f0",
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">
              Nhà cung cấp
            </span>
            <Select
              isClearable
              placeholder="Tất cả NCC"
              className="text-sm"
              options={filterOptions.suppliers}
              value={filters.supplier}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, supplier: val }))
              }
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "40px",
                  borderRadius: "8px",
                  borderColor: "#e2e8f0",
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">
              Số hợp đồng
            </span>
            <Select
              isClearable
              placeholder="Tất cả hợp đồng"
              className="text-sm"
              options={filterOptions.contracts}
              value={filters.contract}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, contract: val }))
              }
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "40px",
                  borderRadius: "8px",
                  borderColor: "#e2e8f0",
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">
              Trạng thái
            </span>
            <Select
              isClearable
              placeholder="Tất cả trạng thái"
              className="text-sm"
              options={getFoLineStatusOptions().map(opt => ({ label: opt.label, value: opt.value }))}
              value={filters.status}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, status: val }))
              }
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "40px",
                  borderRadius: "8px",
                  borderColor: "#e2e8f0",
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">
              Tìm kiếm nhanh
            </span>
            <Input
              icon={<MagnifyingGlassIcon className="h-4 w-4" />}
              placeholder="Tên tuyến, Ghi chú, Số HĐ..."
              className="!border-t-blue-gray-200 focus:!border-blue-500 rounded-lg text-sm"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              containerProps={{
                className: "min-w-0",
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className="w-full overflow-hidden border border-gray-200 shadow-sm rounded-xl">
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full min-w-max table-auto text-left">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50/90 backdrop-blur-sm border-b border-gray-200">
                {[
                  "STT",
                  "Tỉnh",
                  "Tên tuyến",
                  "Khoảng cách",
                  "Dung lượng cáp",
                  "Số core thuê",
                  "Số core sử dụng",
                  "Loại cáp",
                  "Loại kết nối",
                  "Nhà cung cấp",
                  "Trạng thái",
                  "Ghi chú",
                  "Tác động",
                ].map((head) => (
                  <th key={head} className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-bold leading-none"
                    >
                      {head}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isHiredFosLoading ? (
                <tr>
                  <td colSpan={13} className="p-10">
                    <div className="flex justify-center items-center gap-3">
                      <Spinner className="h-8 w-8" color="blue" />
                      <Typography color="blue-gray" className="font-medium">
                        Đang tải dữ liệu...
                      </Typography>
                    </div>
                  </td>
                </tr>
              ) : paginatedHiredFos.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50/80 transition-colors"
                >
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {getProvinceName(item) || "-"}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-bold"
                    >
                      {getNearSiteCode(item)} - {getFarSiteCode(item)}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {item.finalDistance} km
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {item.coreQuantity}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {item.hiredCoreQuantity}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {item.usedCoreQuantity}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {item.fiberType?.name || item.fiberTypeName || "-"}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {item.foConnectionType?.name || item.foConnectionTypeName || "-"}
                    </Typography>
                  </td>
                  <td className="p-4">
                    {getSupplierName(item) && (
                      <OwnerChip
                        name={getSupplierName(item)}
                        className="inline-block"
                      />
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      <StatusBadge
                        status={item.status}
                        labels={FoLineStatusLabels}
                        colors={FoLineStatusColors}
                      />
                    </div>
                  </td>
                  <td className="p-4 max-w-xs truncate">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal italic opacity-70"
                    >
                      {item.note}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1">
                      <Tooltip content="Sửa">
                        <MTIconButton
                          variant="text"
                          size="sm"
                          color="blue-gray"
                          onClick={() => handleEdit(item.id)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </MTIconButton>
                      </Tooltip>
                      <Tooltip content="Xóa">
                        <MTIconButton
                          variant="text"
                          size="sm"
                          color="red"
                          onClick={() => handleDeleteRouter(item.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </MTIconButton>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredHiredFos.length === 0 && (
            <div className="py-20 text-center">
              <Typography variant="h6" color="blue-gray" className="opacity-40">
                Không tìm thấy tuyến FO nào khớp với bộ lọc
              </Typography>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <Typography
              variant="small"
              color="blue-gray"
              className="font-normal"
            >
              Trang <span className="font-bold">{currentPage}</span> /{" "}
              <span className="font-bold">{totalPages || 1}</span>
            </Typography>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
              <span className="text-xs text-blue-gray-400 font-medium">
                Hiển thị:
              </span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs border border-gray-300 rounded px-1 py-0.5 outline-none focus:border-blue-500 transition-colors"
              >
                {[5, 10, 15, 20, 50, 100].map((val) => (
                  <option key={val} value={val}>
                    {val} dòng
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <MTIconButton
              variant="outlined"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="rounded-md border-gray-300"
            >
              <ChevronLeftIcon strokeWidth={2} className="h-4 w-4" />
            </MTIconButton>
            <MTIconButton
              variant="outlined"
              size="sm"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className="rounded-md border-gray-300"
            >
              <ChevronRightIcon strokeWidth={2} className="h-4 w-4" />
            </MTIconButton>
          </div>
        </div>
      </Card>

      {/* Modal Thêm mới */}
      <Dialog
        open={openCreate}
        handler={handleOpenCreate}
        size="sm"
      >
        <Formik
          onSubmit={handleCreate}
          initialValues={{
            foContract: { id: null },
            nearSite: { id: null },
            farSite: { id: null },
            coreQuantity: 2,
            hiredCoreQuantity: 2,
            usedCoreQuantity: 0,
            finalDistance: 0,
            cost: 0,
            fiberType: { id: null },
            foConnectionType: { id: null },
            note: "",
            status: FoLineStatus.OPERATING
          }}
          validationSchema={Yup.object({
            foContract: Yup.object({ id: Yup.number().required("Bắt buộc chọn hợp đồng") }),
            nearSite: Yup.object({ id: Yup.number().required("Bắt buộc chọn trạm đầu") }),
            farSite: Yup.object({ id: Yup.number().required("Bắt buộc chọn trạm cuối") }),
            coreQuantity: Yup.number().required("Bắt buộc").min(0),
            hiredCoreQuantity: Yup.number().required("Bắt buộc").min(0),
            usedCoreQuantity: Yup.number().required("Bắt buộc").min(0),
            finalDistance: Yup.number().required("Bắt buộc"),
            cost: Yup.number().required("Bắt buộc"),
          })}
        >
          {({ setFieldValue }) => (
            <Form>
              <DialogHeader>Thêm mới tuyến cáp thuê</DialogHeader>
              <DialogBody className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold opacity-70">Hợp đồng</label>
                  <Select
                    placeholder="Chọn hợp đồng..."
                    options={contracts}
                    getOptionLabel={(o) => o.contractNumber + " - " + o.contractName}
                    getOptionValue={(o) => o.id}
                    onChange={(val) => setFieldValue("foContract.id", val.id)}
                    styles={whiteSelectStyles}
                    components={{ MenuList: CustomMenuList }}
                  />
                  <ErrorMessage className="text-xs text-red-500" name="foContract.id" component="span" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold opacity-70">Site A</label>
                    <Select
                      placeholder="Site A"
                      options={simpleSiteList}
                      getOptionLabel={(o) => o.siteId}
                      getOptionValue={(o) => o.id}
                      onChange={(val) => setFieldValue("nearSite.id", val.id)}
                      components={{ MenuList: CustomMenuList }}
                      styles={whiteSelectStyles}
                    />
                    <ErrorMessage className="text-xs text-red-500" name="nearSite.id" component="span" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold opacity-70">Site B</label>
                    <Select
                      placeholder="Site B"
                      options={simpleSiteList}
                      getOptionLabel={(o) => o.siteId}
                      getOptionValue={(o) => o.id}
                      onChange={(val) => setFieldValue("farSite.id", val.id)}
                      components={{ MenuList: CustomMenuList }}
                      styles={whiteSelectStyles}
                    />
                    <ErrorMessage className="text-xs text-red-500" name="farSite.id" component="span" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-bold opacity-70">Dung lượng cáp</label>
                    <Field name="coreQuantity" type="number" className="w-full border rounded p-2" />
                  </div>
                  <div>
                    <label className="text-sm font-bold opacity-70">Số core thuê</label>
                    <Field name="hiredCoreQuantity" type="number" className="w-full border rounded p-2" />
                  </div>
                  <div>
                    <label className="text-sm font-bold opacity-70">Số core sử dụng</label>
                    <Field name="usedCoreQuantity" type="number" className="w-full border rounded p-2" />
                  </div>
                  <div>
                    <label className="text-sm font-bold opacity-70">Khoảng cách (km)</label>
                    <Field name="finalDistance" type="number" step="0.01" className="w-full border rounded p-2" />
                  </div>
                  <div>
                    <label className="text-sm font-bold opacity-70">Đơn giá (VNĐ)</label>
                    <Field name="cost" type="number" className="w-full border rounded p-2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold opacity-70">Loại cáp</label>
                    <Select
                      placeholder="Chọn loại cáp..."
                      options={fiberTypes}
                      getOptionLabel={(o) => o.name}
                      getOptionValue={(o) => o.id}
                      onChange={(val) => setFieldValue("fiberType.id", val?.id)}
                      styles={whiteSelectStyles}
                      components={{ MenuList: CustomMenuList }}
                      isClearable
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold opacity-70">Loại kết nối</label>
                    <Select
                      placeholder="Chọn loại kết nối..."
                      options={foConnectionTypes}
                      getOptionLabel={(o) => o.name}
                      getOptionValue={(o) => o.id}
                      onChange={(val) => setFieldValue("foConnectionType.id", val?.id)}
                      styles={whiteSelectStyles}
                      components={{ MenuList: CustomMenuList }}
                      isClearable
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold opacity-70">Trạng thái</label>
                    <Field name="status" as="select" className="w-full border rounded p-2">
                      {getFoLineStatusOptions().map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </Field>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold opacity-70">Ghi chú</label>
                  <Field as="textarea" name="note" className="w-full border rounded p-2 h-20" />
                </div>
              </DialogBody>
              <DialogFooter>
                <Button variant="text" onClick={handleOpenCreate}>Hủy</Button>
                <CustomButton type="submit">Lưu</CustomButton>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </Dialog>
      <Dialog
        open={importOpen}
        handler={handleOpenImport}
        className="overflow-hidden rounded-lg bg-white shadow-xl"
        size="lg"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <Typography variant="h5" color="blue-gray" className="font-semibold text-gray-900">
              Import Tuyến cáp thuê từ Excel
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Tải lên file Excel mẫu để cập nhật dữ liệu hợp đồng và tuyến cáp hàng loạt
            </Typography>
          </div>
          <IconButton size="sm" variant="text" color="blue-gray" onClick={handleOpenImport}>
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>

        <DialogBody className="p-6">
          {!excelSuccess ? (
            <div
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-10 bg-gray-50/50 hover:bg-blue-50/30 hover:border-blue-300 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <CloudArrowUpIcon className="h-16 w-16 text-blue-gray-200 mb-4" />
              <Typography variant="h6" color="blue-gray" className="mb-1">
                Kéo thả file hoặc click để chọn
              </Typography>
              <Typography variant="small" className="text-gray-500 mb-6">
                Chỉ chấp nhận file .xlsx hoặc .xls
              </Typography>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setExcelFile(f);
                    setExcelChecked(false);
                    setExcelSuccess(false);
                    setExcelErrors({});
                    setExcelRows([]);
                  }
                  e.target.value = null;
                }}
                className="hidden"
                id="excel-upload"
              />
              <div className="flex gap-3">
                <label
                  htmlFor="excel-upload"
                  className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm"
                >
                  Chọn file
                </label>
                <button
                  onClick={handleDownloadTemplate}
                  className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors flex items-center gap-2"
                >
                  <DocumentIcon className="h-4 w-4" />
                  Tải file mẫu
                </button>
              </div>
              {excelFile && (
                <div className="mt-6 flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg">
                  <DocumentIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">{excelFile.name} ({(excelFile.size / 1024).toFixed(2)} KB)</span>
                  <button onClick={() => setExcelFile(null)} className="ml-2 text-blue-400 hover:text-blue-600">
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between bg-green-50 border border-green-100 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                  <div>
                    <Typography variant="h6" color="green" className="leading-none mb-1">
                      Kiểm tra dữ liệu thành công
                    </Typography>
                    <Typography className="text-xs text-green-700 font-medium">
                      Tìm thấy {excelRows.length} dòng dữ liệu hợp lệ và sẵn sàng để lưu.
                    </Typography>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setExcelSuccess(false);
                    setExcelRows([]);
                  }}
                  className="text-xs font-bold text-green-700 hover:underline"
                >
                  Thay đổi file
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[40vh] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                    <tr>
                      <th className="p-2 font-bold text-blue-gray-700">Hợp đồng</th>
                      <th className="p-2 font-bold text-blue-gray-700">Trạm đầu</th>
                      <th className="p-2 font-bold text-blue-gray-700">Trạm cuối</th>
                      <th className="p-2 font-bold text-blue-gray-700">Dung lượng</th>
                      <th className="p-2 font-bold text-blue-gray-700">Đơn giá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {excelRows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="p-2 font-medium text-blue-600">{row.contractNumber}</td>
                        <td className="p-2">{row.nearSite}</td>
                        <td className="p-2">{row.farSite}</td>
                        <td className="p-2">{row.coreQuantity}</td>
                        <td className="p-2">{VND.format(row.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {excelRows.length > 10 && (
                  <div className="p-2 bg-gray-50 text-center text-[10px] text-gray-500 italic">
                    Và {excelRows.length - 10} dòng khác...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {excelChecked && !excelSuccess && Object.keys(excelErrors).length > 0 && (
            <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3 text-red-700">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <Typography variant="h6" color="red">
                  Lỗi dữ liệu ({Object.keys(excelErrors).length} dòng bị lỗi)
                </Typography>
              </div>
              <div className="max-h-[30vh] overflow-y-auto bg-white rounded-lg border border-red-100">
                {Object.entries(excelErrors).map(([rowNum, errorGroup]) => (
                  <div key={rowNum} className="p-3 border-b border-red-50 last:border-none">
                    <Typography className="text-xs font-bold text-gray-800 mb-1">
                      Dòng {rowNum}:
                    </Typography>
                    <div className="flex flex-wrap gap-2">
                      {errorGroup.errors.map((err, i) => (
                        <div key={i} className="bg-red-50 text-[10px] px-2 py-0.5 rounded border border-red-100 text-red-700">
                          <span className="font-bold">{err.column}:</span> {err.message}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="border-t border-gray-100 bg-gray-50 px-4 py-3 gap-2">
          <CustomButton variant="text" color="blue-gray" onClick={handleOpenImport} size="sm" disabled={saving}>
            Hủy bỏ
          </CustomButton>
          {!excelSuccess ? (
            <CustomButton
              className="bg-[#0d47a1] hover:bg-[#0a3a82]"
              size="sm"
              onClick={handleCheckExcelMulti}
              loading={checking}
              disabled={!excelFile || checking}
            >
              Kiểm tra dữ liệu
            </CustomButton>
          ) : (
            <CustomButton
              className="bg-[#1d6f42] hover:bg-[#155d36]"
              size="sm"
              onClick={handleSaveExcelMulti}
              loading={saving}
            >
              <div className="flex items-center gap-2">
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Lưu vào hệ thống</span>
              </div>
            </CustomButton>
          )}
        </DialogFooter>
      </Dialog>


      {/* Modal Sửa thông tin */}
      <Dialog
        open={openEdit}
        handler={handleOpenEdit}
        className="overflow-hidden"
        size="sm"
      >
        <div className="max-h-[90vh] overflow-y-auto p-3">
          <DialogHeader className="relative m-0 block pb-4 border-b border-gray-100">
            <Typography variant="h4" color="blue-gray" className="font-bold">
              Cập nhật thông tin tuyến cáp
            </Typography>
            <Typography
              color="gray"
              className="mt-1 font-normal text-gray-600 text-sm"
            >
              Chỉnh sửa thông tin tuyến cáp quang thuê để đảm bảo dữ liệu chính
              xác.
            </Typography>
            <IconButton
              size="sm"
              variant="text"
              className="!absolute right-3.5 top-3.5"
              onClick={handleOpenEdit}
            >
              <XMarkIcon className="h-4 w-4 stroke-2" />
            </IconButton>
          </DialogHeader>

          <Formik
            enableReinitialize
            onSubmit={handleEditSubmit}
            initialValues={{
              ...editFoLine,
              nearSite: { id: editFoLine.nearSiteId || editFoLine.nearSite?.id },
              farSite: { id: editFoLine.farSiteId || editFoLine.farSite?.id },
              fiberType: { id: editFoLine.fiberTypeId || editFoLine.fiberType?.id },
              foConnectionType: { id: editFoLine.foConnectionTypeId || editFoLine.foConnectionType?.id },
              status: editFoLine.status || FoLineStatus.OPERATING,
            }}
            validationSchema={Yup.object({
              coreQuantity: Yup.number().required("Yêu cầu nhập dung lượng cáp").min(0),
              hiredCoreQuantity: Yup.number().required("Yêu cầu nhập số core thuê").min(0),
              usedCoreQuantity: Yup.number().required("Yêu cầu nhập số core sử dụng").min(0),
              finalDistance: Yup.number().required(
                "Yêu cầu nhập chiều dài tuyến thực tế",
              ),
              cost: Yup.number().required("Yêu cầu nhập đơn giá thuê"),
              nearSite: Yup.object({
                id: Yup.string().required("Yêu cầu nhập site ID"),
              }),
              farSite: Yup.object({
                id: Yup.string().required("Yêu cầu nhập site ID"),
              }),
            })}
          >
            {({ setFieldValue, getFieldProps, values, setErrors }) => (
              <Form className="flex flex-initial flex-shrink flex-col">
                <DialogBody className="space-y-4 pb-6">
                  <Card className="shadow-none">
                    <div className="grid grid-cols-12 gap-3 p-2">
                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Trạng thái
                        </label>
                        <Field
                          name="status"
                          as="select"
                          className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          {getFoLineStatusOptions().map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </Field>
                      </div>
                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Số hợp đồng
                        </label>
                        <Field
                          name="foContract.contractNumber"
                          className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          disabled
                        ></Field>
                      </div>
                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Tên hợp đồng
                        </label>
                        <Field
                          name="foContract.contractName"
                          className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          disabled
                        ></Field>
                      </div>

                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Site A
                        </label>
                        <Select
                          placeholder="Site A"
                          styles={whiteSelectStyles}
                          value={
                            simpleSiteList.find(
                              (o) => o.id === values.nearSite?.id,
                            ) || null
                          }
                          onChange={(opt) =>
                            setFieldValue("nearSite.id", opt?.id || null)
                          }
                          components={{ MenuList: CustomMenuList }}
                          isSearchable={true}
                          options={simpleSiteList}
                          getOptionLabel={(option) => option.siteId}
                          getOptionValue={(option) => option.id}
                        />

                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="nearSite.siteId"
                          component="span"
                        ></ErrorMessage>
                      </div>
                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Site B
                        </label>
                        <Select
                          placeholder="Site B"
                          styles={whiteSelectStyles}
                          value={
                            simpleSiteList.find(
                              (o) => o.id === values.farSite?.id,
                            ) || null
                          }
                          onChange={(opt) =>
                            setFieldValue("farSite.id", opt?.id || null)
                          }
                          components={{ MenuList: CustomMenuList }}
                          isSearchable={true}
                          options={simpleSiteList}
                          getOptionLabel={(option) => option.siteId}
                          getOptionValue={(option) => option.id}
                        />

                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="farSite.siteId"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      <div className="col-span-full grid grid-cols-3 gap-3">
                        <div className="flex flex-col items-stretch gap-2">
                          <label className="text-slate-400 font-semibold">
                            Dung lượng cáp
                          </label>
                          <Field
                            name="coreQuantity"
                            className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                            type="number"
                          ></Field>
                          <ErrorMessage
                            className="justify-items-end text-sm font-light italic text-red-500"
                            name="coreQuantity"
                            component="span"
                          ></ErrorMessage>
                        </div>
                        <div className="flex flex-col items-stretch gap-2">
                          <label className="text-slate-400 font-semibold">
                            Số core thuê
                          </label>
                          <Field
                            name="hiredCoreQuantity"
                            className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                            type="number"
                          ></Field>
                          <ErrorMessage
                            className="justify-items-end text-sm font-light italic text-red-500"
                            name="hiredCoreQuantity"
                            component="span"
                          ></ErrorMessage>
                        </div>
                        <div className="flex flex-col items-stretch gap-2">
                          <label className="text-slate-400 font-semibold">
                            Số core sử dụng
                          </label>
                          <Field
                            name="usedCoreQuantity"
                            className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                            type="number"
                          ></Field>
                          <ErrorMessage
                            className="justify-items-end text-sm font-light italic text-red-500"
                            name="usedCoreQuantity"
                            component="span"
                          ></ErrorMessage>
                        </div>
                      </div>

                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Chiều dài thực tế tuyến FO (km)
                        </label>
                        <Field
                          name="finalDistance"
                          placeholder="Nhập chiều dài thực tế"
                          className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          type="number"
                        ></Field>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="finalDistance"
                          component="span"
                        ></ErrorMessage>
                      </div>
                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Đơn giá thuê (VNĐ)
                        </label>
                        <Field
                          name="cost"
                          placeholder="Nhập đơn giá thuê chưa VAT"
                          className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          type="number"
                        ></Field>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="cost"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      <div className="col-span-full grid grid-cols-2 gap-3">
                        <div className="flex flex-col items-stretch gap-2">
                          <label className="text-slate-400 font-semibold">
                            Loại cáp
                          </label>
                          <Select
                            placeholder="Chọn loại cáp..."
                            styles={whiteSelectStyles}
                            value={
                              fiberTypes?.find((o) => o.id === values.fiberType?.id) || null
                            }
                            onChange={(opt) =>
                              setFieldValue("fiberType.id", opt?.id || null)
                            }
                            components={{ MenuList: CustomMenuList }}
                            isSearchable={true}
                            options={fiberTypes}
                            getOptionLabel={(option) => option.name}
                            getOptionValue={(option) => option.id}
                            isClearable
                          />
                        </div>
                        <div className="flex flex-col items-stretch gap-2">
                          <label className="text-slate-400 font-semibold">
                            Loại kết nối
                          </label>
                          <Select
                            placeholder="Chọn loại kết nối..."
                            styles={whiteSelectStyles}
                            value={
                              foConnectionTypes?.find((o) => o.id === values.foConnectionType?.id) || null
                            }
                            onChange={(opt) =>
                              setFieldValue("foConnectionType.id", opt?.id || null)
                            }
                            components={{ MenuList: CustomMenuList }}
                            isSearchable={true}
                            options={foConnectionTypes}
                            getOptionLabel={(option) => option.name}
                            getOptionValue={(option) => option.id}
                            isClearable
                          />
                        </div>
                      </div>

                      {/* <p className="col-span-full text-2xl text-blue-600">Vị trí</p> */}

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
                </DialogBody>
                <DialogFooter className="pt-0 pr-6 pb-6">
                  <CustomButton
                    size="md"
                    type="submit"
                    color="gray"
                    className="bg-gray-900 border-none shadow-none hover:shadow-lg"
                  >
                    Cập nhật dữ liệu
                  </CustomButton>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </div>
      </Dialog>

      {/*Modal confirm xóa site*/}
      <Dialog open={openDelete} handler={handleOpenDelete} size="sm">
        <DialogHeader className="flex flex-col items-center gap-2 pt-6">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
          <Typography variant="h4" color="blue-gray" className="font-bold">
            Xác nhận xóa
          </Typography>
        </DialogHeader>
        <DialogBody className="text-center font-normal text-gray-600">
          Bạn có chắc chắn muốn xóa thông tin trạm{" "}
          <span className="font-bold text-blue-gray-900">
            {deleteRouterName}
          </span>
          ?
          <br />
          Hành động này không thể hoàn tác.
        </DialogBody>
        <DialogFooter className="flex justify-center gap-3 pb-6">
          <CustomButton
            variant="text"
            color="gray"
            onClick={handleOpenDelete}
            className="px-6"
          >
            Hủy
          </CustomButton>
          <CustomButton
            color="red"
            onClick={handleDeleteSubmit}
            className="px-6"
          >
            Xác nhận xóa
          </CustomButton>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
export default HiredFoList;
