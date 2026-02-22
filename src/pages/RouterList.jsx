import { useEffect, useMemo, useState, useRef } from "react";
import {
  DocumentIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
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
import { Input, IconButton as MTIconButton } from "@material-tailwind/react";

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
} from "@material-tailwind/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CustomMenuList } from "./CustomList";
import { toast } from "react-toastify";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useSimpleSites from "../hooks/useSimpleSites";
import useRouters from "../hooks/useRouters"; // Import your custom hook for routers
import useMetadata from "../hooks/useMetadata";
import useTransmissionDeviceTypes from "../hooks/useTransmissionDeviceTypes";
import CustomButton from "../components/CustomButton";
import StatusChip from "../components/StatusChip";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import FormSelect from "../components/FormSelect";
import StatusBadge from "../components/StatusBadge";
import { DeviceStatus, DeviceStatusLabels, DeviceStatusColors, getDeviceStatusOptions } from "../constants/statusConstants";
function RouterList() {
  // const navigate = useNavigate();
  const gridRef = useRef();
  const [routerTypeList, setRouterTypeList] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editRouter, setEditRouter] = useState({});
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
    vendor: null,
    routerType: null,
    transDeviceType: null,
    status: null,
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const axiosInstance = useAxiosPrivate();
  const {
    simpleSites: simpleSiteList,
    setSimpleSites: setSimpleSiteList,
    isLoading: isSimpleSitesLoading,
  } = useSimpleSites();

  const { provinces } = useMetadata();
  const { transmissionDeviceTypes: transmissionDeviceTypeList } = useTransmissionDeviceTypes();

  const {
    routers: routerList,
    setRouters: setRouterList,
    isLoadding: isRoutersLoading,
    createRouter,
    updateRouter,
    deleteRouter,
    fetchRouters,
    downloadImportTemplate,
    checkImportData,
    saveImportData,
  } = useRouters();

  useEffect(() => {
    const loadData = async () => {
      try {
        const routerTypes = await axiosInstance.get("router-types");
        setRouterTypeList(routerTypes.data);
      } catch (error) {
        console.log(error);
      }
    };
    loadData();
  }, []);

  // Filter Logic: Use data from hooks directly
  const filterOptions = useMemo(() => {
    // Extract unique vendors from routerTypeList
    const vendorsMap = new Map();
    routerTypeList.forEach((rt) => {
      if (rt.vendor) {
        vendorsMap.set(rt.vendor.id, rt.vendor);
      }
    });
    const vendors = Array.from(vendorsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return {
      provinces: provinces || [],
      vendors: vendors,
      routerTypes: routerTypeList || [],
      transDeviceTypes: transmissionDeviceTypeList || [],
    };
  }, [provinces, routerTypeList, transmissionDeviceTypeList]);

  const filteredRouters = useMemo(() => {
    return routerList.filter((router) => {
      const matchProvince =
        !filters.province || router.site?.province?.id === filters.province.id;
      const matchVendor =
        !filters.vendor || router.routerType?.vendor?.id === filters.vendor.id;
      const matchRouterType =
        !filters.routerType || router.routerType?.id === filters.routerType.id;
      const matchTransDeviceType =
        !filters.transDeviceType ||
        router.transmissionDeviceType?.id === filters.transDeviceType.id;
      const matchStatus =
        !filters.status || router.status === filters.status.value;
      const matchSearch =
        !filters.search ||
        router.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        router.ip?.toLowerCase().includes(filters.search.toLowerCase()) ||
        router.site?.siteId
          ?.toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        router.assetCode?.toLowerCase().includes(filters.search.toLowerCase()) ||
        router.serial?.toLowerCase().includes(filters.search.toLowerCase()) ||
        router.note?.toLowerCase().includes(filters.search.toLowerCase());

      return (
        matchProvince &&
        matchVendor &&
        matchRouterType &&
        matchTransDeviceType &&
        matchStatus &&
        matchSearch
      );
    });
  }, [routerList, filters]);

  const totalPages = Math.ceil(filteredRouters.length / rowsPerPage);
  const paginatedRouters = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredRouters.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredRouters, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const getRouterById = async (editId) => {
    try {
      const router = await axiosInstance.get(`routers/${editId}`);
      setEditRouter({ ...router.data });
    } catch (error) {
      console.log(error);
    }
  };

  // Helper: Map Formik values (Nested) to Backend DTO (Flat)
  const mapFormToRequest = (values, isCreate = false) => {
    const payload = {
      name: values.name,
      routerTypeId: values.routerType?.id || null,
      transmissionDeviceTypeId: values.transmissionDeviceType?.id || null,
      siteId: values.site?.id || null,
      ip: values.ip,
      assetCode: values.assetCode || null,
      serial: values.serial || null,
      status: values.status || DeviceStatus.OPERATING,
      note: values.note || null,
    };

    if (!isCreate) {
      payload.id = values.id;
    }

    return payload;
  };

  // Xử lý thêm mới
  const handleOpenCreate = () => {
    setOpenCreate(!openCreate);
  };

  // Tạo mới Router
  const handleCreate = async (values) => {
    console.log("Giá trị từ Form:", values);
    const payload = mapFormToRequest(values, true);
    await createRouter(payload);
    setOpenCreate(!openCreate);
  };
  // Xử lý Edit

  const handleEdit = async (editId) => {
    await getRouterById(editId);
    handleOpenEdit();
  };

  const handleOpenEdit = () => {
    setOpenEdit(!openEdit);
  };

  const handleEditSubmit = async (values) => {
    console.log("Giá trị từ Form:", values);
    const payload = mapFormToRequest(values);
    await updateRouter(payload.id, payload);
    setOpenEdit(!openEdit);
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
    await deleteRouter(deleteId);
    setDeleteId(null);
    setOpenDelete(!openDelete);
  };

  let deleteRouterName;
  if (deleteId != null) {
    deleteRouterName = routerList.find((router) => router.id === deleteId).name;
    console.log(deleteRouterName);
  }

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
      setImportPreview(res.rows || []);
      setImportErrors(null);
      setImportSuccess(true);
    } catch (error) {
      setImportErrors(error.response?.data || {});
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
      // Lỗi đã được xử lý và hiển thị toast trong hook
      console.error("Save import failed:", error);
    } finally {
      setIsImporting(false);
    }
  };

  // if (isLoading) return <Spinner />;
  const onBtnExport = () => {
    const dataToExport = filteredRouters.map((router) => ({
      Tỉnh: router.site?.province?.name,
      "Site ID": router.site?.siteId,
      "Tên thiết bị": router.name,
      "Model": router.routerType?.name,
      "Chức năng": router.transmissionDeviceType?.name,
      "IP quản lý": router.ip,
      "Nhà sản xuất": router.routerType?.vendor?.name,
      "Mã tài sản": router.assetCode,
      Serial: router.serial,
      "Trạng thái": DeviceStatusLabels[router.status] || router.status,
      "Ghi chú": router.note,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Routers");
    XLSX.writeFile(workbook, "RouterList.xlsx");
  };

  const handleResetFilters = () => {
    setFilters({
      province: null,
      vendor: null,
      routerType: null,
      transDeviceType: null,
      status: null,
      search: "",
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Danh sách thiết bị
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số:{" "}
            <span className="font-semibold text-blue-600">
              {filteredRouters.length}
            </span>{" "}
            / {routerList.length} thiết bị
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
            filters.vendor ||
            filters.routerType ||
            filters.transDeviceType ||
            filters.status ||
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
              options={filterOptions.provinces}
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
              Nhà sản xuất
            </span>
            <Select
              isClearable
              placeholder="Tất cả hãng"
              className="text-sm"
              options={filterOptions.vendors}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.vendor}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, vendor: val }))
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
              Model
            </span>
            <Select
              isClearable
              placeholder="Tất cả model"
              className="text-sm"
              options={filterOptions.routerTypes}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.routerType}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, routerType: val }))
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
              Thiết bị TD
            </span>
            <Select
              isClearable
              placeholder="Tất cả thiết bị"
              className="text-sm"
              options={filterOptions.transDeviceTypes}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.transDeviceType}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, transDeviceType: val }))
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
              options={getDeviceStatusOptions().map(opt => ({ label: opt.label, value: opt.value }))}
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

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">
              Tìm kiếm nhanh
            </span>
            <Input
              icon={<MagnifyingGlassIcon className="h-4 w-4" />}
              placeholder="Site ID, Tên, IP..."
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
                    Tên thiết bị
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Model
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Nhà sản xuất
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
                    Serial
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Chức năng
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    IP quản lý
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
                    Trạng thái
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
            <tbody className="divide-y divide-gray-100">
              {paginatedRouters.map((router, index) => (
                <tr
                  key={router.id}
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
                      {router.site?.province?.name}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-bold"
                    >
                      {router.site?.siteId}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-medium"
                    >
                      {router.name}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {router.routerType?.name}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {router.routerType?.vendor?.name || "-"}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {router.assetCode || "-"}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {router.serial || "-"}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {router.transmissionDeviceType?.name}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal font-mono text-xs"
                    >
                      {router.ip}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal opacity-70 italic max-w-[200px] truncate"
                    >
                      {router.note || "-"}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      <StatusBadge
                        status={router.status}
                        labels={DeviceStatusLabels}
                        colors={DeviceStatusColors}
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1">
                      <IconButton
                        variant="text"
                        size="sm"
                        color="blue"
                        onClick={() => handleEdit(router.id)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        variant="text"
                        size="sm"
                        color="red"
                        onClick={() => handleDeleteRouter(router.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRouters.length === 0 && (
            <div className="py-20 text-center">
              <Typography variant="h6" color="blue-gray" className="opacity-40">
                Không tìm thấy thiết bị nào khớp với bộ lọc
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
              Thêm mới thiết bị
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Nhập các thông tin chi tiết cho router mới
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
              name: "",
              site: { id: "" },
              ip: "",
              transmissionDeviceType: { id: 1 },
              routerType: { id: 1 },
              status: DeviceStatus.OPERATING,
              note: "",
            }}
            validationSchema={Yup.object({
              name: Yup.string().required("Yêu cầu nhập tên router"),
              site: Yup.object({
                id: Yup.string().required("Yêu cầu nhập site ID"),
              }),
              ip: Yup.string().required("Yêu cầu nhập Ip quản lý"),
            })}
          >
            {({ setFieldValue, getFieldProps, values, setErrors }) => (
              <Form className="flex flex-col">
                <DialogBody className="p-6">
                  <div className="grid grid-cols-1 gap-5">
                    {/* Trạng thái Dropdown */}
                    <FormSelect
                      label="Trạng thái"
                      name="status"
                      options={getDeviceStatusOptions()}
                      getOptionLabel={(option) => option.label}
                      getOptionValue={(option) => option.value}
                      useVirtualization={false}
                      value={getDeviceStatusOptions().find(opt => opt.value === values.status)}
                      onChange={(option) => setFieldValue("status", option?.value || DeviceStatus.OPERATING)}
                    />

                    {/* Tên thiết bị */}
                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-1 font-bold"
                      >
                        Tên thiết bị <span className="text-red-500">*</span>
                      </Typography>
                      <Field
                        name="name"
                        placeholder="VD: R_HNI_001"
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                      />
                      <ErrorMessage
                        name="name"
                        component="div"
                        className="mt-1 text-xs text-red-600 font-medium"
                      />
                    </div>

                    {/* Site ID */}
                    <FormSelect
                      label="Site ID"
                      name="site.id"
                      placeholder="Chọn Site ID..."
                      options={simpleSiteList || []}
                      getOptionLabel={(option) => option.siteId}
                      getOptionValue={(option) => option.id}
                      required
                    />

                    {/* IP Quản lý */}
                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-1 font-bold"
                      >
                        IP quản lý <span className="text-red-500">*</span>
                      </Typography>
                      <Field
                        name="ip"
                        placeholder="VD: 192.168.1.1"
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all font-mono"
                      />
                      <ErrorMessage
                        name="ip"
                        component="div"
                        className="mt-1 text-xs text-red-600 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormSelect
                        label="Chức năng"
                        name="transmissionDeviceType.id"
                        options={transmissionDeviceTypeList || []}
                        getOptionLabel={(option) => option.name}
                        getOptionValue={(option) => option.id}
                        useVirtualization={false}
                      />
                      <FormSelect
                        label="Model"
                        name="routerType.id"
                        options={routerTypeList || []}
                        getOptionLabel={(option) => option.name}
                        getOptionValue={(option) => option.id}
                        useVirtualization={false}
                      />
                    </div>

                    {/* Ghi chú */}
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
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all resize-none"
                        placeholder="Nhập ghi chú thêm..."
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

      {/* Modal Sửa thông tin */}
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
              Cập nhật thiết bị
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Chỉnh sửa thông tin thiết bị
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
              ...editRouter,
              assetCode: editRouter.assetCode || "",
              serial: editRouter.serial || "",
            }}
            validationSchema={Yup.object({
              name: Yup.string().required("Yêu cầu nhập tên router"),
              site: Yup.object({
                id: Yup.string().required("Yêu cầu nhập site ID"),
              }),
              ip: Yup.string().required("Yêu cầu nhập Ip quản lý"),
            })}
          >
            {({ setFieldValue, getFieldProps, values, setErrors }) => (
              <Form className="flex flex-col">
                <DialogBody className="p-6">
                  <div className="grid grid-cols-1 gap-5">
                    {/* Trạng thái Dropdown */}
                    <FormSelect
                      label="Trạng thái"
                      name="status"
                      options={getDeviceStatusOptions()}
                      getOptionLabel={(option) => option.label}
                      getOptionValue={(option) => option.value}
                      useVirtualization={false}
                      value={getDeviceStatusOptions().find(opt => opt.value === values.status)}
                      onChange={(option) => setFieldValue("status", option?.value || values.status)}
                    />

                    {/* Tên thiết bị */}
                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-1 font-bold"
                      >
                        Tên thiết bị <span className="text-red-500">*</span>
                      </Typography>
                      <Field
                        name="name"
                        placeholder="VD: R_HNI_001"
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                      />
                      <ErrorMessage
                        name="name"
                        component="div"
                        className="mt-1 text-xs text-red-600 font-medium"
                      />
                    </div>

                    {/* Site ID */}
                    <FormSelect
                      label="Site ID"
                      name="site.id"
                      placeholder="Chọn Site ID..."
                      options={simpleSiteList || []}
                      getOptionLabel={(option) => option.siteId}
                      getOptionValue={(option) => option.id}
                      required
                    />

                    {/* IP Quản lý */}
                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-1 font-bold"
                      >
                        IP quản lý <span className="text-red-500">*</span>
                      </Typography>
                      <Field
                        name="ip"
                        placeholder="VD: 192.168.1.1"
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all font-mono"
                      />
                      <ErrorMessage
                        name="ip"
                        component="div"
                        className="mt-1 text-xs text-red-600 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormSelect
                        label="Chức năng"
                        name="transmissionDeviceType.id"
                        options={transmissionDeviceTypeList || []}
                        getOptionLabel={(option) => option.name}
                        getOptionValue={(option) => option.id}
                        useVirtualization={false}
                      />
                      <FormSelect
                        label="Model"
                        name="routerType.id"
                        options={routerTypeList || []}
                        getOptionLabel={(option) => option.name}
                        getOptionValue={(option) => option.id}
                        useVirtualization={false}
                      />
                    </div>

                    {/* Ghi chú */}
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
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all resize-none"
                        placeholder="Nhập ghi chú thêm..."
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

      {/* Reusable Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={openDelete}
        handler={handleOpenDelete}
        onConfirm={handleDeleteSubmit}
        itemName={deleteRouterName}
        title="Xác nhận xóa thiết bị"
        message="Bạn có chắc chắn muốn xóa thiết bị"
        confirmText="Xác nhận xóa"
      />

      {/* Modal Import Excel */}
      <Dialog
        open={openImport}
        handler={handleOpenImport}
        className="overflow-hidden rounded-lg bg-white shadow-xl"
        size="lg"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <Typography variant="h5" color="blue-gray" className="font-semibold text-gray-900">
              Import Router từ Excel
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Tải lên file Excel mẫu để cập nhật danh sách router hàng loạt
            </Typography>
          </div>
          <IconButton size="sm" variant="text" color="blue-gray" onClick={handleOpenImport}>
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>

        <DialogBody className="p-6">
          {!importSuccess ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-10 bg-gray-50/50">
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
                onChange={handleFileChange}
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
                  onClick={downloadTemplate}
                  className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors flex items-center gap-2"
                >
                  <DocumentIcon className="h-4 w-4" />
                  Tải file mẫu
                </button>
              </div>
              {importFile && (
                <div className="mt-6 flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg">
                  <DocumentIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">{importFile.name}</span>
                  <button onClick={() => setImportFile(null)} className="ml-2 text-blue-400 hover:text-blue-600">
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
                      Tìm thấy {importPreview.length} dòng dữ liệu hợp lệ và sẵn sàng để lưu.
                    </Typography>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setImportSuccess(false);
                    setImportPreview([]);
                  }}
                  className="text-xs font-bold text-green-700 hover:underline"
                >
                  Thay đổi file
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[40vh] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-2 font-bold text-blue-gray-700">Tên Router</th>
                      <th className="p-2 font-bold text-blue-gray-700">Model</th>
                      <th className="p-2 font-bold text-blue-gray-700">Site ID</th>
                      <th className="p-2 font-bold text-blue-gray-700">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importPreview.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="p-2">{row.name}</td>
                        <td className="p-2">{row.routerTypeName}</td>
                        <td className="p-2">{row.siteId}</td>
                        <td className="p-2">{row.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importPreview.length > 10 && (
                  <div className="p-2 bg-gray-50 text-center text-[10px] text-gray-500 italic">
                    Và {importPreview.length - 10} dòng khác...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {importErrors && (
            <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3 text-red-700">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <Typography variant="h6" color="red">
                  Lỗi dữ liệu ({Object.keys(importErrors).length} dòng bị lỗi)
                </Typography>
              </div>
              <div className="max-h-[30vh] overflow-y-auto bg-white rounded-lg border border-red-100">
                {Object.entries(importErrors).map(([rowNum, errorGroup]) => (
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
          <CustomButton variant="text" color="blue-gray" onClick={handleOpenImport} size="sm" disabled={isImporting}>
            Hủy bỏ
          </CustomButton>
          {!importSuccess ? (
            <CustomButton
              className="bg-[#0d47a1] hover:bg-[#0a3a82]"
              size="sm"
              onClick={handleCheckImport}
              loading={isImporting}
              disabled={!importFile}
            >
              Kiểm tra dữ liệu
            </CustomButton>
          ) : (
            <CustomButton
              className="bg-[#1d6f42] hover:bg-[#155d36]"
              size="sm"
              onClick={handleSaveImport}
              loading={isImporting}
            >
              Lưu dữ liệu vào hệ thống
            </CustomButton>
          )}
        </DialogFooter>
      </Dialog>
    </div>
  );
}
export default RouterList;
