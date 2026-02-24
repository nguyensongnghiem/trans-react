import { useEffect, useMemo, useState, useRef } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  CheckCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/solid";
import Select from "react-select";
import * as Yup from "yup";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Card,
  Dialog,
  IconButton,
  Typography,
  DialogBody,
  DialogHeader,
  DialogFooter,
  Input,
  IconButton as MTIconButton,
  Switch,
  Spinner,
  
} from "@material-tailwind/react";
import { toast } from "react-toastify";
import OwnerChip from "../components/OwnerChip";
import CustomButton from "../components/CustomButton";
import FormSelect from "../components/FormSelect";
import StatusBadge from "../components/StatusBadge";
import { SiteStatus, SiteStatusLabels, SiteStatusColors, getSiteStatusOptions } from "../constants/statusConstants";
import useSites from "../hooks/useSites";
import useMetadata from "../hooks/useMetadata";
import useMultiLoading from "../hooks/useMultiLoading";

const SiteValidationSchema = Yup.object().shape({
  siteId: Yup.string().required("Vui lòng nhập Site ID"),  
  latitude: Yup.number()
    .required("Vui lòng nhập vĩ độ")
    .typeError("Vĩ độ phải là một số")
    .test(
      "max-digits",
      "Vĩ độ có tối đa 2 chữ số phần nguyên và 8 chữ số thập phân",
      (value) => {
        if (value === null || value === undefined) return true;
        const parts = String(value).split(".");
        const integerPart = parts[0].replace('-', '');
        const fractionPart = parts[1] || "";
        return integerPart.length <= 2 && fractionPart.length <= 8;
      }
    ),
  longitude: Yup.number()
    .required("Vui lòng nhập kinh độ")
    .typeError("Kinh độ phải là một số")
    .test(
      "max-digits",
      "Kinh độ có tối đa 3 chữ số phần nguyên và 8 chữ số thập phân",
      (value) => {
        if (value === null || value === undefined) return true;
        const parts = String(value).split(".");
        const integerPart = parts[0].replace('-', '');
        const fractionPart = parts[1] || "";
        return integerPart.length <= 3 && fractionPart.length <= 8;
      }
    ),
  province: Yup.object().shape({ id: Yup.number().required("Vui lòng chọn tỉnh/thành phố") }),
  siteTransmissionType: Yup.object().shape({ id: Yup.number().nullable() }),
  transmissionOwner: Yup.object().shape({ id: Yup.number().nullable() }),
  siteOwner: Yup.object().shape({ id: Yup.number().nullable() }), // Cho phép null
  siteType: Yup.object().shape({ id: Yup.number().nullable() }), // Cho phép null
});

function SiteList2() {
  const navigate = useNavigate();

  const [deleteId, setDeleteId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editSite, setEditSite] = useState({});
  const [editId, setEditId] = useState(null);
  // Import states
  const [openImport, setOpenImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importErrors, setImportErrors] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const [filters, setFilters] = useState({
    province: null,
    transmissionOwner: null,
    siteTransmissionType: null,
    siteOwner: null,
    siteType: null,
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const { 
    sites: siteListFull, 
    isLoading: sitesLoading, 
    createSite, 
    updateSite, 
    deleteSite,
    downloadImportTemplate,
    checkImportData,
    saveImportData
  } = useSites();

  const { 
    provinces, 
    siteOwners: siteOwnerList, 
    transOwners: transmissionOwnerList, 
    transTypes: siteTransmissionTypeList, 
    siteTypes: siteTypeList,
    isLoading: metaLoading,
  } = useMetadata();

  const isLoading = useMultiLoading([sitesLoading, metaLoading]);

  const filteredSites = useMemo(() => {
    return siteListFull.filter((site) => {
      const matchProvince =
        !filters.province || site.province?.id === filters.province.id;
      const matchTransOwner =
        !filters.transmissionOwner ||
        site.transmissionOwner?.id === filters.transmissionOwner.id;
      const matchSiteTransType =
        !filters.siteTransmissionType ||
        site.siteTransmissionType?.id === filters.siteTransmissionType.id;
      const matchSiteOwner =
        !filters.siteOwner || site.siteOwner?.id === filters.siteOwner.id;
      const matchSiteType =
        !filters.siteType || site.siteType?.id === filters.siteType.id;
      const matchSearch =
        !filters.search ||
        site.siteId?.toLowerCase().includes(filters.search.toLowerCase()) ||
        site.siteId2?.toLowerCase().includes(filters.search.toLowerCase()) ||
        site.siteName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        site.note?.toLowerCase().includes(filters.search.toLowerCase());

      return (
        matchProvince &&
        matchTransOwner &&
        matchSiteTransType &&
        matchSiteOwner &&
        matchSiteType &&
        matchSearch
      );
    });
  }, [siteListFull, filters]);

  const totalPages = Math.ceil(filteredSites.length / rowsPerPage);
  const paginatedSites = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredSites.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredSites, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const onBtnExport = () => {
    const dataToExport = filteredSites.map((site) => ({
      "Tỉnh": site.province?.name,
      "Site ID": site.siteId,
      "Mã tài sản": site.assetCode,
      "SiteName ERP": site.siteErp,
      "Site ID khác": site.siteId2,
      "Tên trạm": site.siteName,
      "Loại trạm": site.siteType?.name,
      "Loại truyền dẫn trạm": site.siteTransmissionType?.name,
      "Đơn vị sở hữu TD": site.transmissionOwner?.name,
      "Đơn vị sở hữu CSHT": site.siteOwner?.name,
      "Vĩ độ": site.latitude,
      "Kinh độ": site.longitude,
      "Địa chỉ": site.address,
      "Ghi chú": site.note,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sites");
    XLSX.writeFile(workbook, "SiteList.xlsx");
  };

  const handleResetFilters = () => {
    setFilters({
      province: null,
      transmissionOwner: null,
      siteTransmissionType: null,
      siteOwner: null,
      siteType: null,
      search: "",
    });
  };

  // Xử lý thêm mới
  const handleOpenCreate = () => {
    setOpenCreate(!openCreate);
  };

  // Helper: Map Formik values (Nested) to Backend DTO (Flat)
  const mapFormToRequest = (values, isCreate = false) => {
    const payload = {
      siteId: values.siteId,
      assetCode: values.assetCode || null,
      siteErp: values.siteErp || null,
      siteId2: values.siteId2 || null,
      siteName: values.siteName,
      latitude: +values.latitude,
      longitude: +values.longitude,
      address: values.address || null,
      note: values.note || null,
      provinceId: values.province?.id || null,
      siteOwnerId: values.siteOwner?.id || null,
      siteTypeId: values.siteType?.id || null,
      siteTransmissionTypeId: values.siteTransmissionType?.id || null,
      transmissionOwnerId: values.transmissionOwner?.id || null,
      status: values.status || SiteStatus.OPERATING, // Default to OPERATING
    };

    if (!isCreate) {
      payload.id = values.id;
    }

    return payload;
  };

  const handleCreate = async (values, { setErrors }) => {
    console.log("Giá trị từ Form:" + values);
    const payload = mapFormToRequest(values, true);    
    await createSite(payload);
    setOpenCreate(false);
  };

  // Xử lý Edit

  const handleEdit = async (id) => {
    try {
      const site = siteListFull.find(s => s.id === id);
      if (!site) {
        toast.error("Không tìm thấy thông tin trạm.");
        return;
      }
      setEditId(id);
      
      // Sanitizing null objects to ensure Formik doesn't choke on null values for nested fields
      setEditSite({
        ...site,
        assetCode: site.assetCode || "",
        siteErp: site.siteErp || "",
        siteId2: site.siteId2 || "",
        address: site.address || "",
        note: site.note || "",
        province: site.province || { id: null },
        transmissionOwner: site.transmissionOwner || { id: null },
        siteTransmissionType: site.siteTransmissionType || { id: null },
        siteOwner: site.siteOwner || { id: null },
        siteType: site.siteType || { id: null },
      });
      handleOpenEdit();
    } catch (error) {
      toast.error("Không thể lấy thông tin trạm");
    }
  };

  const handleOpenEdit = () => {
    setOpenEdit(!openEdit);
  };

  const handleEditSubmit = async (values) => {
    console.log("Giá trị từ Form:", values);
    const payload = mapFormToRequest(values);

    console.log("payload:", payload);
    await updateSite(values.id, payload);
    setOpenEdit(false);
  };

  // Xử lý Xóa

  const handleDeleteSite = async (deleteId) => {
    setDeleteId(deleteId);
    handleOpenDelete();
  };
  const handleOpenDelete = () => {
    setOpenDelete(!openDelete);
  };
  const handleDeleteSubmit = async () => {
    await deleteSite(deleteId);
    setDeleteId(null);
    setOpenDelete(false);
  };

  // Import functions
  const handleOpenImport = () => {
    setOpenImport(!openImport);
    if (!openImport) {
      setImportFile(null);
      setImportPreview([]);
      setImportErrors(null);
      setImportSuccess(false);
    }
  };

  const handleFileChange = (e) => {
    setImportFile(e.target.files[0]);
    setImportPreview([]);
    setImportErrors(null);
    setImportSuccess(false);
  };

  const downloadTemplate = async () => {
    await downloadImportTemplate();
  };

  const handleCheckImport = async () => {
    if (!importFile) {
      toast.warning("Vui lòng chọn file Excel");
      return;
    }
    const formData = new FormData();
    formData.append("file", importFile);
    setIsImporting(true);

    try {
      const res = await checkImportData(formData);
      // Kiểm tra cả 2 trường hợp: res là data trực tiếp hoặc res là axios response
      setImportPreview(res.rows || res.data?.rows || []);
      setImportErrors(null);
      setImportSuccess(true);
    } catch (error) {
      setImportErrors(error.response?.data || {});
      console.error("Check import error:", error);
      const errorData = error.response?.data;
      // Nếu server trả về lỗi có cấu trúc (validation errors)
      if (errorData && Object.keys(errorData).length > 0) {
        setImportErrors(errorData);
      } else {
        // Fallback: Tạo lỗi chung để hiển thị lên UI nếu không có chi tiết
        setImportErrors({
          "Lỗi hệ thống": { errors: [{ columnName: "N/A", message: error.message || "Có lỗi xảy ra khi kiểm tra dữ liệu" }] }
        });
      }
      setImportPreview([]);
      setImportSuccess(false);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveImport = async () => {
    if (!importSuccess) return;
    const formData = new FormData();
    formData.append("file", importFile);
    setIsImporting(true);

    try {
      await saveImportData(formData);
      handleOpenImport();
    } catch (error) {
      console.error("Save import failed:", error);
    } finally {
      setIsImporting(false);
    }
  };

  let deleteSiteId;
  if (deleteId != null) {
    deleteSiteId = siteListFull.find((site) => site.id === deleteId)?.siteId;
    console.log(deleteSiteId);
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Danh sách trạm</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số:{" "}
            <span className="font-semibold text-blue-600">
              {filteredSites.length}
            </span>{" "}
            / {siteListFull.length} trạm
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
            className="flex items-center gap-2 bg-[#e65100] hover:bg-[#bf360c]"
            size="sm"
            onClick={handleOpenImport}
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            Import Excel
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
          {(filters.province ||
            filters.transmissionOwner ||
            filters.siteTransmissionType ||
            filters.siteOwner ||
            filters.search) && (
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
              options={provinces || []}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
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
              Đơn vị sở hữu truyền dẫn
            </span>
            <Select
              isClearable
              placeholder="Tất cả đơn vị"
              className="text-sm"
              options={transmissionOwnerList || []}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.transmissionOwner}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, transmissionOwner: val }))
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
              Loại truyền dẫn của trạm
            </span>
            <Select
              isClearable
              placeholder="Tất cả loại"
              className="text-sm"
              options={siteTransmissionTypeList || []}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.siteTransmissionType}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, siteTransmissionType: val }))
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
              Đơn vị sở hữu CSHT
            </span>
            <Select
              isClearable
              placeholder="Tất cả chủ nhà"
              className="text-sm"
              options={siteOwnerList || []}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.siteOwner}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, siteOwner: val }))
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
              Loại trạm
            </span>
            <Select
              isClearable
              placeholder="Tất cả loại"
              className="text-sm"
              options={siteTypeList || []}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.siteType}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, siteType: val }))
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
              Tìm kiếm nhanh
            </span>
            <Input
              icon={<MagnifyingGlassIcon className="h-4 w-4" />}
              placeholder="Site ID, Tên, Ghi chú..."
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

      <Card className="w-full overflow-hidden border border-gray-200 shadow-sm rounded-xl">
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full min-w-max table-auto text-left">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50/90 backdrop-blur-sm border-b border-gray-200">

                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    STT
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Tỉnh
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Site ID
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Mã tài sản
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Site ID khác (nếu có)
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Tên trạm
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Loại trạm
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Truyền dẫn
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Vị trí
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Địa chỉ
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Trạng thái
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Ghi chú
                  </Typography>
                </th>
                <th className="p-4 text-center">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Tác động
                  </Typography>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading ? (
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
              ) : paginatedSites.map((site, index) => (
                <tr
                  key={site.id}
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
                      {site.province?.name}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-bold"
                    >
                      {site.siteId}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {site.assetCode || "-"}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {site.siteId2 || "-"}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-medium"
                    >
                      {site.siteName}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {site.siteType?.name || "-"}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal"
                      >
                        {site.siteTransmissionType?.name}
                      </Typography>
                      {site.transmissionOwner?.name && (
                        <OwnerChip name={site.transmissionOwner.name} />
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal text-xs italic"
                    >
                      {site.latitude?.toFixed(4)}, {site.longitude?.toFixed(4)}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal opacity-70 max-w-[200px] truncate"
                      title={site.address}
                    >
                      {site.address || "-"}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <StatusBadge 
                      status={site.status} 
                      labels={SiteStatusLabels} 
                      colors={SiteStatusColors} 
                    />
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal opacity-70 italic max-w-[200px] truncate"
                    >
                      {site.note || "-"}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1">
                      <IconButton
                        variant="text"
                        size="sm"
                        color="blue"
                        onClick={() => handleEdit(site.id)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        variant="text"
                        size="sm"
                        color="red"
                        onClick={() => handleDeleteSite(site.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && siteListFull.length > 0 && filteredSites.length === 0 && (
            <div className="py-20 text-center">
              <Typography variant="h6" color="blue-gray" className="opacity-40">
                Không tìm thấy trạm nào khớp với bộ lọc
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
        className="overflow-hidden rounded-lg bg-white shadow-xl"
        size="sm"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <Typography
              variant="h5"
              color="blue-gray"
              className="font-semibold text-gray-900"
            >
              Thêm mới trạm
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Nhập các thông tin chi tiết cho trạm mới
            </Typography>
          </div>
          <IconButton
            size="sm"
            variant="text"
            className="text-gray-500 hover:bg-gray-200 rounded-full"
            onClick={handleOpenCreate}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>

        <div className="max-h-[80vh] overflow-y-auto">
          <Formik
            onSubmit={handleCreate}
            initialValues={{
              province: { id: null },
              siteId: "",
              assetCode: "",
              siteErp: "",
              siteId2: "",
              siteName: "",
              latitude: null,
              longitude: null,
              address: "",
              transmissionOwner: { id: "" },
              siteTransmissionType: { id: "" },
              siteOwner: { id: "" },
              siteType: { id: "" },
              note: "",
              status: SiteStatus.OPERATING,
            }}
            validationSchema={SiteValidationSchema}
          >
            {({ setFieldValue, values }) => (
              <Form className="flex flex-col">
                <DialogBody className="p-6">
                  <div className="grid grid-cols-1 gap-5">
                    {/* Trạng thái Dropdown */}
                    <FormSelect
                      label="Trạng thái"
                      name="status"
                      options={getSiteStatusOptions()}
                      getOptionLabel={(option) => option.label}
                      getOptionValue={(option) => option.value}
                      useVirtualization={false}
                      value={getSiteStatusOptions().find(opt => opt.value === values.status)}
                      onChange={(option) => setFieldValue("status", option?.value || SiteStatus.OPERATING)}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          Site ID <span className="text-red-500">*</span>
                        </Typography>
                        <Field
                          name="siteId"
                          placeholder="VD: DN_001"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                        />
                        <ErrorMessage
                          name="siteId"
                          component="div"
                          className="mt-1 text-xs text-red-600 font-medium"
                        />
                      </div>
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          Site ID khác
                        </Typography>
                        <Field
                          name="siteId2"
                          placeholder="VD: DN_001_OLD"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          Mã tài sản
                        </Typography>
                        <Field
                          name="assetCode"
                          placeholder="Mã tài sản..."
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          SiteName ERP
                        </Typography>
                        <Field
                          name="siteErp"
                          placeholder="Mã ERP..."
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-1 font-bold"
                      >
                        Tên trạm 
                      </Typography>
                      <Field
                        name="siteName"
                        placeholder="Nhập tên trạm..."
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                      />
                      <ErrorMessage
                        name="siteName"
                        component="div"
                        className="mt-1 text-xs text-red-600 font-medium"
                      />
                    </div>

                    <FormSelect
                      label="Tỉnh"
                      name="province.id"
                      options={provinces}
                      getOptionLabel={(option) => option.name}
                      getOptionValue={(option) => option.id}
                      required
                      useVirtualization={false}
                      isClearable
                    />
                  
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FormSelect
                          label="Đơn vị sở hữu CSHT"
                          name="siteOwner.id"
                          options={siteOwnerList}
                          placeholder="Chọn chủ sở hữu"
                          getOptionLabel={(option) => option.name}
                          getOptionValue={(option) => option.id}
                          useVirtualization={false}
                          isClearable
                        />                       
                      </div>
                      <div>
                        <FormSelect
                          label="Loại trạm"
                          name="siteType.id"
                          options={siteTypeList}
                          placeholder="Chọn loại trạm"
                          getOptionLabel={(option) => option.name}
                          getOptionValue={(option) => option.id}
                          useVirtualization={false}
                          isClearable
                        />                      
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          Vĩ độ <span className="text-red-500">*</span>
                        </Typography>
                        <Field
                          name="latitude"
                          placeholder="VD: 21.0285"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all font-mono text-xs"
                        />
                        <ErrorMessage
                          name="latitude"
                          component="div"
                          className="mt-1 text-xs text-red-600 font-medium"
                        />
                      </div>
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          Kinh độ <span className="text-red-500">*</span>
                        </Typography>
                        <Field
                          name="longitude"
                          placeholder="VD: 105.8542"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all font-mono text-xs"
                        />
                        <ErrorMessage
                          name="longitude"
                          component="div"
                          className="mt-1 text-xs text-red-600 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-1 font-bold"
                      >
                        Địa chỉ
                      </Typography>
                      <Field
                        name="address"
                        placeholder="Nhập địa chỉ trạm..."
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FormSelect
                          label="Loại truyền dẫn"
                          name="siteTransmissionType.id"
                          options={siteTransmissionTypeList}
                          getOptionLabel={(option) => option.name}
                          getOptionValue={(option) => option.id}
                          useVirtualization={false}
                          isClearable
                        />
                      
                      </div>
                      <div>
                        <FormSelect
                          label="Đơn vị sở hữu TD"
                          name="transmissionOwner.id"
                          options={transmissionOwnerList}
                          getOptionLabel={(option) => option.name}
                          getOptionValue={(option) => option.id}
                          useVirtualization={false}
                          isClearable
                          required
                        />
                      
                      </div>
                    </div>

                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-1 font-bold"
                      >
                        Ghi chú
                      </Typography>
                      <Field
                        as="textarea"
                        name="note"
                        rows={3}
                        placeholder="Nhập ghi chú..."
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>
                </DialogBody>

                <DialogFooter className="border-t border-gray-100 bg-gray-50 px-4 py-3 gap-2">
                  <CustomButton
                    variant="text"
                    color="blue-gray"
                    onClick={handleOpenCreate}
                    size="sm"
                  >
                    Hủy bỏ
                  </CustomButton>
                  <CustomButton
                    type="submit"
                    className="bg-[#0d47a1] hover:bg-[#0a3a82]"
                    size="sm"
                  >
                    <div className="flex items-center gap-2">
                      <PlusIcon className="h-4 w-4" />
                      <span>Thêm mới</span>
                    </div>
                  </CustomButton>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </div>
      </Dialog>

      {/* Modal Sửa thông tin trạm */}
      <Dialog
        open={openEdit}
        handler={handleOpenEdit}
        className="overflow-hidden rounded-lg bg-white shadow-xl"
        size="sm"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <Typography
              variant="h5"
              color="blue-gray"
              className="font-semibold text-gray-900"
            >
              Cập nhật trạm
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Thay đổi các thông số kỹ thuật của trạm
            </Typography>
          </div>
          <IconButton
            size="sm"
            variant="text"
            className="text-gray-500 hover:bg-gray-200 rounded-full"
            onClick={handleOpenEdit}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>

        <div className="max-h-[80vh] overflow-y-auto">
          <Formik
            onSubmit={handleEditSubmit}
            initialValues={{
              ...editSite,
            }}
            validationSchema={SiteValidationSchema}
            validate={(values) => {
              console.log("Values:", values);
    return {};
            }}
          >
            {({ setFieldValue, values }) => (
              <Form className="flex flex-col">
                <DialogBody className="p-6">
                  <div className="grid grid-cols-1 gap-5">
                    {/* Trạng thái Dropdown */}
                    <FormSelect
                      label="Trạng thái"
                      name="status"
                      options={getSiteStatusOptions()}
                      getOptionLabel={(option) => option.label}
                      getOptionValue={(option) => option.value}
                      useVirtualization={false}
                      value={getSiteStatusOptions().find(opt => opt.value === values.status)}
                      onChange={(option) => setFieldValue("status", option?.value || values.status)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          Site ID <span className="text-red-500">*</span>
                        </Typography>
                        <Field
                          name="siteId"
                          placeholder="VD: DN_001"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                        />
                        <ErrorMessage
                          name="siteId"
                          component="div"
                          className="mt-1 text-xs text-red-600 font-medium"
                        />
                      </div>
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          Site ID khác
                        </Typography>
                        <Field
                          name="siteId2"
                          placeholder="VD: DN_001_OLD"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                        />
                        <ErrorMessage
                          name="siteId2"
                          component="div"
                          className="mt-1 text-xs text-red-600 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          Mã tài sản
                        </Typography>
                        <Field
                          name="assetCode"
                          placeholder="Mã tài sản..."
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                        />
                        <ErrorMessage
                          name="assetCode"
                          component="div"
                          className="mt-1 text-xs text-red-600 font-medium"
                        />
                      </div>
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          Mã ERP
                        </Typography>
                        <Field
                          name="siteErp"
                          placeholder="Mã ERP..."
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                        />
                        <ErrorMessage
                          name="siteErp"
                          component="div"
                          className="mt-1 text-xs text-red-600 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-1 font-bold"
                      >
                        Tên trạm <span className="text-red-500">*</span>
                      </Typography>
                      <Field
                        name="siteName"
                        placeholder="Nhập tên trạm..."
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                      />
                      <ErrorMessage
                        name="siteName"
                        component="div"
                        className="mt-1 text-xs text-red-600 font-medium"
                      />
                    </div>

                    <div>
                      <FormSelect
                        label="Tỉnh"
                        name="province.id"
                        options={provinces}
                        getOptionLabel={(option) => option.name}
                        getOptionValue={(option) => option.id}
                        required
                        useVirtualization={false}
                        isClearable
                      />
                      
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FormSelect
                          label="Đơn vị sở hữu CSHT"
                          name="siteOwner.id"
                          options={siteOwnerList}
                          placeholder="Chọn chủ sở hữu"
                          getOptionLabel={(option) => option.name}
                          getOptionValue={(option) => option.id}
                          useVirtualization={false}
                          isClearable
                          required
                        />
                       
                      </div>
                      <div>
                        <FormSelect
                          label="Loại trạm"
                          name="siteType.id"
                          options={siteTypeList}
                          placeholder="Chọn loại trạm"
                          getOptionLabel={(option) => option.name}
                          getOptionValue={(option) => option.id}
                          useVirtualization={false}
                          isClearable
                        />
                        
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          Vĩ độ <span className="text-red-500">*</span>
                        </Typography>
                        <Field
                          name="latitude"
                          placeholder="VD: 21.0285"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all font-mono text-xs"
                        />
                        <ErrorMessage
                          name="latitude"
                          component="div"
                          className="mt-1 text-xs text-red-600 font-medium"
                        />
                      </div>
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          Kinh độ <span className="text-red-500">*</span>
                        </Typography>
                        <Field
                          name="longitude"
                          placeholder="VD: 105.8542"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all font-mono text-xs"
                        />
                        <ErrorMessage
                          name="longitude"
                          component="div"
                          className="mt-1 text-xs text-red-600 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-1 font-bold"
                      >
                        Địa chỉ
                      </Typography>
                      <Field
                        name="address"
                        placeholder="Nhập địa chỉ trạm..."
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                      />
                      <ErrorMessage
                        name="address"
                        component="div"
                        className="mt-1 text-xs text-red-600 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div> 
                        <FormSelect
                          label="Loại truyền dẫn"
                          name="siteTransmissionType.id"
                          options={siteTransmissionTypeList}
                          getOptionLabel={(option) => option.name}
                          getOptionValue={(option) => option.id}
                          useVirtualization={false}
                          isClearable
                          required
                        />
                      </div>
                      <div>
                        <FormSelect
                          label="Đơn vị sở hữu TD"
                          name="transmissionOwner.id"
                          options={transmissionOwnerList}
                          getOptionLabel={(option) => option.name}
                          getOptionValue={(option) => option.id}
                          useVirtualization={false}
                          isClearable
                          required
                        />
                        <ErrorMessage
                          name="transmissionOwner.id"
                          component="div"
                          className="mt-1 text-xs text-red-600 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-1 font-bold"
                      >
                        Ghi chú
                      </Typography>
                      <Field
                        as="textarea"
                        name="note"
                        rows={3}
                        placeholder="Nhập ghi chú..."
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all resize-none"
                      />
                      <ErrorMessage
                        name="note"
                        component="div"
                        className="mt-1 text-xs text-red-600 font-medium"
                      />
                    </div>
                  </div>
                </DialogBody>

                <DialogFooter className="border-t border-gray-100 bg-gray-50 px-4 py-3 gap-2">
                  <CustomButton
                    variant="text"
                    color="blue-gray"
                    onClick={handleOpenEdit}
                    size="sm"
                  >
                    Hủy bỏ
                  </CustomButton>
                  <CustomButton
                    type="submit"
                    className="bg-[#0d47a1] hover:bg-[#0a3a82]"
                    size="sm"
                  >
                    <div className="flex items-center gap-2">
                      <PencilIcon className="h-4 w-4" />
                      <span>Cập nhật</span>
                    </div>
                  </CustomButton>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </div>
      </Dialog>

      {/* Modal confirm xóa site */}
      <Dialog
        open={openDelete}
        handler={handleOpenDelete}
        size="xs"
        className="rounded-lg overflow-hidden shadow-xl"
      >
        <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-full">
            <TrashIcon className="h-5 w-5 text-red-600" />
          </div>
          <Typography variant="h5" color="red" className="font-semibold">
            Xác nhận xóa
          </Typography>
        </div>

        <DialogBody className="p-6 text-blue-gray-700">
          <Typography
            variant="paragraph"
            color="blue-gray"
            className="font-medium"
          >
            Bạn có chắc chắn muốn xóa trạm{" "}
            <span className="font-bold text-gray-900">{deleteSiteId}</span>?
          </Typography>
          <Typography variant="small" color="gray" className="mt-3 italic">
            Hành động này không thể phục hồi và dữ liệu sẽ bị xóa vĩnh viễn khỏi
            hệ thống.
          </Typography>
        </DialogBody>

        <DialogFooter className="bg-gray-50/50 px-4 py-3 gap-2 border-t border-gray-200">
          <CustomButton
            variant="text"
            color="blue-gray"
            onClick={handleOpenDelete}
            size="sm"
          >
            Hủy bỏ
          </CustomButton>
          <CustomButton
            variant="filled"
            color="red"
            onClick={handleDeleteSubmit}
            size="sm"
            className="flex items-center gap-2 shadow-md shadow-red-500/20"
          >
            <TrashIcon className="h-4 w-4" />
            <span>Xác nhận xóa</span>
          </CustomButton>
        </DialogFooter>
      </Dialog>

      {/* Modal Import Site */}
      <Dialog
        open={openImport}
        handler={handleOpenImport}
        className="overflow-hidden rounded-lg bg-white shadow-xl flex flex-col max-h-[90vh]"
        size="lg"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <Typography variant="h5" color="blue-gray" className="font-semibold text-gray-900">
              Import Danh sách trạm
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Tải lên tệp Excel để thêm hàng loạt trạm vào hệ thống
            </Typography>
          </div>
          <IconButton
            size="sm"
            variant="text"
            className="text-gray-500 hover:bg-gray-200 rounded-full"
            onClick={handleOpenImport}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>

        <DialogBody className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Step 1: Template */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <Typography variant="small" color="blue" className="font-bold uppercase mb-1">
                Bước 1: Tải tệp mẫu và chuẩn bị dữ liệu
              </Typography>
              <Typography variant="small" color="blue-gray" className="text-[11px] leading-relaxed">
                Sử dụng tệp mẫu Excel đúng định dạng để đảm bảo dữ liệu được nhập chính xác.
                Vui lòng không thay đổi cấu trúc các cột trong tệp mẫu.
              </Typography>
            </div>
            <CustomButton
              size="sm"
              variant="outlined"
              color="blue"
              className="flex items-center gap-2 bg-white shrink-0 shadow-sm"
              onClick={downloadTemplate}
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Tải file mẫu</span>
            </CustomButton>
          </div>

          {/* Step 2: File Selection */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <Typography variant="small" color="blue-gray" className="font-bold uppercase mb-3 text-[11px] tracking-wider">
              Bước 2: Chọn tệp Excel từ máy tính
            </Typography>

            {!importFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 text-center hover:bg-blue-50/30 hover:border-blue-300 transition-all p-8 relative group">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="p-3 bg-white rounded-full shadow-sm border border-gray-200 group-hover:scale-110 transition-transform">
                    <CloudArrowUpIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-blue-600">Nhấn để tải lên</span> hoặc kéo thả file vào đây
                    <br />
                    <span className="text-xs text-gray-400 mt-1 block tracking-tight">Hỗ trợ các định dạng tiêu chuẩn .xlsx, .xls</span>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-xl animate-fadeIn">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="p-2.5 bg-white rounded-lg border border-blue-100 shadow-sm flex-shrink-0">
                    <DocumentIcon className="h-7 w-7 text-blue-600" />
                  </div>
                  <div className="overflow-hidden">
                    <Typography variant="small" color="blue-gray" className="font-bold truncate max-w-[300px]" title={importFile.name}>
                      {importFile.name}
                    </Typography>
                    <Typography variant="small" className="text-blue-gray-400 text-[10px] font-medium uppercase mt-0.5">
                      Excel Spreadsheet • {(importFile.size / 1024).toFixed(2)} KB
                    </Typography>
                  </div>
                </div>
                <IconButton
                  variant="text"
                  color="red"
                  size="sm"
                  className="rounded-full hover:bg-red-50 flex-shrink-0"
                  onClick={() => {
                    setImportFile(null);
                    setImportSuccess(false);
                    setImportPreview([]);
                    setImportErrors(null);
                  }}
                >
                  <TrashIcon className="h-5 w-5" />
                </IconButton>
              </div>
            )}
          </div>

          {/* Verification Result */}
          {importSuccess && (
            <div className="p-5 bg-green-50 border border-green-100 rounded-xl flex items-start gap-4 animate-fadeIn shadow-sm">
              <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-700" />
              </div>
              <div className="flex-1">
                <Typography variant="small" color="green" className="font-bold mb-0.5">
                  Kiểm tra dữ liệu thành công!
                </Typography>
                <Typography variant="small" className="text-gray-700 text-xs">
                  Sẵn sàng import <span className="font-bold text-green-800 text-sm mx-0.5">{importPreview.length}</span> trạm vào hệ thống. Nhấn "Lưu vào hệ thống" để hoàn tất.
                </Typography>
              </div>
            </div>
          )}

          {/* Errors */}
          {importErrors && Object.keys(importErrors).length > 0 && (
            <div className="border border-red-200 rounded-xl overflow-hidden bg-white shadow-sm animate-fadeIn">
              <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center gap-3">
                <div className="bg-red-100 p-1.5 rounded-full flex-shrink-0">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-700" />
                </div>
                <Typography variant="small" className="text-red-800 font-bold uppercase tracking-wider text-[11px]">
                  Phát hiện lỗi trong file ({Object.keys(importErrors).length} dòng)
                </Typography>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <ul className="divide-y divide-gray-100">
                  {Object.entries(importErrors).map(([row, errorGroup]) => (
                    <li key={row} className="p-4 hover:bg-red-50/30 transition-colors">
                      <div className="flex gap-4">
                        <span className="font-bold text-gray-900 bg-red-100/50 px-2.5 py-1 rounded-md h-fit text-xs border border-red-200">Dòng {row}</span>
                        <ul className="space-y-2 flex-1 mt-0.5">
                          {errorGroup.errors?.map((err, idx) => (
                            <li key={idx} className="flex flex-col gap-0.5">
                              <span className="font-bold text-gray-700 text-[11px] uppercase tracking-tight">{err.columnName || err.column}</span>
                              <span className="text-red-600 font-medium text-xs">{err.errorMessage || err.message}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {importSuccess && importPreview.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-fadeIn bg-white">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <Typography variant="small" className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                  Xem trước dữ liệu (Tối đa 10 dòng)
                </Typography>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-200">
                  TỔNG {importPreview.length} DÒNG
                </span>
              </div>
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-gray-500 uppercase bg-gray-100 sticky top-0 z-10 border-b">
                    <tr>
                      <th className="px-4 py-3 font-bold border-r border-gray-200 last:border-0">Mã trạm</th>
                      <th className="px-4 py-3 font-bold border-r border-gray-200 last:border-0">Tên trạm</th>
                      <th className="px-4 py-3 font-bold border-r border-gray-200 last:border-0">Tỉnh/TP</th>
                      <th className="px-4 py-3 font-bold">Loại truyền dẫn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importPreview.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="bg-white hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-blue-700 border-r border-gray-50">{row.siteId}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-900 border-r border-gray-50">{row.siteName}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-600 border-r border-gray-50">{row.provinceName}</td>
                        <td className="px-4 py-2.5">
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-gray-200">
                            {row.siteTransmissionTypeName}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {importPreview.length > 10 && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={4} className="px-4 py-4 text-center text-gray-400 italic text-[11px] font-medium">
                          ... và {importPreview.length - 10} dòng khác không được hiển thị trong bản xem trước ...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="border-t border-gray-100 bg-gray-50 px-4 py-3 flex justify-end gap-2 rounded-b-lg shadow-inner">
          <CustomButton variant="text" color="blue-gray" onClick={handleOpenImport} size="sm">
            Hủy bỏ
          </CustomButton>
          {!importSuccess ? (
            <CustomButton
              className="bg-[#0d47a1] hover:bg-[#0a3a82] flex items-center gap-2"
              onClick={handleCheckImport}
              disabled={!importFile || isImporting}
              size="sm"
            >
              {isImporting ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <MagnifyingGlassIcon className="h-4 w-4" />
              )}
              <span>Kiểm tra dữ liệu</span>
            </CustomButton>
          ) : (
            <CustomButton
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              onClick={handleSaveImport}
              disabled={isImporting}
              size="sm"
            >
              {isImporting ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircleIcon className="h-4 w-4" />
              )}
              <span>{isImporting ? "Đang lưu..." : "Lưu vào hệ thống"}</span>
            </CustomButton>
          )}
        </DialogFooter>
      </Dialog>
    </div>
  );
}
export default SiteList2;
