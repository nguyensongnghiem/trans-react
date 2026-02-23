import { useEffect, useMemo, useState } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  GlobeAsiaAustraliaIcon,
  CloudArrowUpIcon,
  EyeIcon,
  MapIcon,
  DocumentIcon,
  CheckCircleIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/solid";
import {
  DocumentArrowUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ExclamationTriangleIcon
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
  Chip,
  IconButton as MTIconButton,
} from "@material-tailwind/react";
import { CustomMenuList } from "./CustomList";
import { toast } from "react-toastify";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useOwnFos from "../hooks/useOwnFos";
import useSimpleSites from "../hooks/useSimpleSites";
import useFiberTypes from "../hooks/useFiberTypes";
import CustomButton from "../components/CustomButton";
import StatusChip from "../components/StatusChip";
import KmlMap from "../components/KmlMap";
import StatusBadge from "../components/StatusBadge";
import { FoLineStatus, FoLineStatusLabels, FoLineStatusColors, getFoLineStatusOptions } from "../constants/statusConstants";
import FormSelect from "../components/FormSelect";

const mapFormToRequest = (values) => {
  return {
    id: values.id,
    nearSiteId: values.nearSite?.id || null,
    farSiteId: values.farSite?.id || null,
    fiberTypeId: values.fiberType?.id || null,
    coreQuantity: values.coreQuantity || 0,
    usedCoreQuantity: values.usedCoreQuantity || 0,
    designedDistance: values.designedDistance || 0,
    finalDistance: values.finalDistance || 0,
    status: values.status || FoLineStatus.OPERATING,
    note: values.note || "",
  };
};

function OwnFoList() {
  const {
    ownFos: ownFoList,
    isLoading: isOwnFosLoading,
    createOwnFo,
    updateOwnFo,
    deleteOwnFo,
    uploadKml,
    downloadKml,
    downloadTemplate,
    checkImport,
    saveImport,
  } = useOwnFos();

  const { simpleSites: simpleSiteList } = useSimpleSites();
  const { fiberTypes: fiberTypeList } = useFiberTypes();

  const [deleteId, setDeleteId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [openMap, setOpenMap] = useState(false);
  const [selectedFoMap, setSelectedFoMap] = useState(null);
  const [editFoLine, setEditFoLine] = useState({});
  const [kmlFile, setKmlFile] = useState(null);

  // Import states
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importErrors, setImportErrors] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filter and pagination states
  const [filters, setFilters] = useState({
    search: "",
    status: null,
    province: null,
    fiberType: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const filterOptions = useMemo(() => {
    const provinces = new Set();
    const fiberTypes = new Set();
    ownFoList.forEach((item) => {
      if (item.nearSite?.province?.name) {
        provinces.add(item.nearSite.province.name);
      }
      if (item.fiberType?.name) {
        fiberTypes.add(item.fiberType.name);
      }
    });
    return {
      provinces: Array.from(provinces)
        .sort()
        .map((p) => ({ value: p, label: p })),
      fiberTypes: Array.from(fiberTypes)
        .sort()
        .map((f) => ({ value: f, label: f })),
    };
  }, [ownFoList]);

  const filteredOwnFos = useMemo(() => {
    return ownFoList.filter((item) => {
      const matchStatus =
        !filters.status || item.status === filters.status.value;
      const matchProvince =
        !filters.province ||
        item.nearSite?.province?.name === filters.province.value;
      const matchFiberType =
        !filters.fiberType ||
        item.fiberType?.name === filters.fiberType.value;
      const matchSearch =
        !filters.search ||
        (item.nearSite?.siteId + " - " + item.farSite?.siteId)
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        item.note?.toLowerCase().includes(filters.search.toLowerCase());

      return (
        matchStatus &&
        matchSearch &&
        matchProvince &&
        matchFiberType
      );
    });
  }, [ownFoList, filters]);

  const totalPages = Math.ceil(filteredOwnFos.length / rowsPerPage);
  const paginatedOwnFos = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredOwnFos.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredOwnFos, currentPage, rowsPerPage]);

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: null,
      province: null,
      fiberType: null,
    });
  };


  const handleOpenCreate = () => setOpenCreate(!openCreate);
  const handleCreate = async (values) => {
    const request = mapFormToRequest(values);
    const success = await createOwnFo(request);
    if (success) {
      setOpenCreate(false);
    }
  };

  const handleEdit = (item) => {
    setEditFoLine(item);
    setKmlFile(null);
    setOpenEdit(true);
  };

  const handleEditSubmit = async (values) => {
    const request = mapFormToRequest(values);
    const success = await updateOwnFo(values.id, request);
    if (success) {
      if (kmlFile) {
        await uploadKml(values.id, kmlFile);
      }
      setOpenEdit(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleDeleteSubmit = async () => {
    const success = await deleteOwnFo(deleteId);
    if (success) {
      setOpenDelete(false);
    }
  };

  const handleViewMap = (fo) => {
    setSelectedFoMap(fo);
    setOpenMap(true);
  };

  const handleKmlDownload = (fo) => {
    downloadKml(fo.id, fo.kmlFileName);
  };

  const onBtnExport = () => {
    const dataToExport = filteredOwnFos.map((item) => {
      const statusLabel = FoLineStatusLabels[item.status] || item.status;

      return {
        Tỉnh: item.nearSite?.province?.name,
        "Tên tuyến": `${item.nearSite?.siteId} - ${item.farSite?.siteId}`,
        "Khoảng cách (km)": item.finalDistance,
        "Tổng core": item.coreQuantity,
        "Core sử dụng": item.usedCoreQuantity,
        "Loại cáp": item.fiberType?.name,
        "Trạng thái": statusLabel,
        "Ghi chú": item.note,
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "OwnFoLine");
    XLSX.writeFile(workbook, "OwnFoLine.xlsx");
  };

  // Import Handlers
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportErrors(null);
      setImportPreview([]);
      setImportSuccess(false);
    }
    e.target.value = null;
  };

  const handleCheckImport = async () => {
    if (!importFile) {
      toast.warning("Vui lòng chọn file Excel");
      return;
    }
    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const res = await checkImport(formData);
      setImportPreview(res.rows || []);
      setImportErrors(null);
      setImportSuccess(true);
    } catch (error) {
      setImportErrors(error.response?.data || {});
      setImportPreview([]);
      setImportSuccess(false);
    }
  };

  const handleSaveImport = async () => {
    if (!importSuccess) return;
    setSaving(true);
    const formData = new FormData();
    formData.append("file", importFile);
    try {
      await saveImport(formData);
      setOpenImport(false);
      setImportFile(null);
      setImportSuccess(false);
      setImportPreview([]);
      setImportErrors(null);
    } catch (error) {
      // toast.error handled by hook
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadTemplate = () => {
    downloadTemplate();
  };

  const whiteSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "white",
      color: "black",
      borderColor: state.isFocused ? "#93c5fd" : "#d1d5db",
      "&:hover": { borderColor: "#93c5fd" },
      minHeight: "38px",
    }),
    menu: (base) => ({ ...base, zIndex: 9999 }),
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Danh sách Cáp quang tự đầu tư
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số: <span className="font-semibold text-blue-600">{filteredOwnFos.length}</span> / {ownFoList.length} tuyến
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
            onClick={() => { setOpenImport(true); setImportFile(null); setImportPreview([]); setImportErrors(null); setImportSuccess(false); }}
          >
            <ArrowUpTrayIcon className="h-4 w-4" /> Import Excel
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Tỉnh</span>
            <Select
              isClearable
              placeholder="Tất cả tỉnh"
              className="text-sm"
              options={filterOptions.provinces}
              value={filters.province}
              onChange={(val) => setFilters((prev) => ({ ...prev, province: val }))}
              styles={whiteSelectStyles}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Loại cáp</span>
            <Select
              isClearable
              placeholder="Tất cả loại cáp"
              className="text-sm"
              options={filterOptions.fiberTypes}
              value={filters.fiberType}
              onChange={(val) => setFilters((prev) => ({ ...prev, fiberType: val }))}
              styles={whiteSelectStyles}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Trạng thái</span>
            <Select
              isClearable
              placeholder="Tất cả trạng thái"
              className="text-sm"
              options={getFoLineStatusOptions()}
              value={filters.status}
              onChange={(val) => setFilters((prev) => ({ ...prev, status: val }))}
              styles={whiteSelectStyles}
            />
          </div>
          <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Tìm kiếm nhanh</span>
            <Input
              icon={<MagnifyingGlassIcon className="h-4 w-4" />}
              placeholder="Tên tuyến, Ghi chú..."
              className="rounded-lg text-sm"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>
        {(filters.search || filters.status || filters.province || filters.fiberType) && (
          <button
            onClick={handleResetFilters}
            className="mt-4 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
          >
            <ArrowPathIcon className="h-3 w-3" /> Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table */}
      <Card className="w-full overflow-hidden border border-gray-200 shadow-sm rounded-xl">
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full min-w-max table-auto text-left">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50/90 backdrop-blur-sm border-b border-gray-200">
                {["STT", "Tỉnh", "Tên tuyến", "Khoảng cách", "Tổng core", "Core sử dụng", "Loại cáp", "Trạng thái", "Ghi chú", "Bản đồ tuyến cáp", "Tác động"].map((head) => (
                  <th key={head} className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-bold">{head}</Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedOwnFos.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-4">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                  <td className="p-4">{item.nearSite?.province?.name}</td>
                  <td className="p-4 font-bold">{item.nearSite?.siteId} - {item.farSite?.siteId}</td>
                  <td className="p-4">{item.finalDistance} km</td>
                   <td className="p-4">{item.coreQuantity}</td>
                   <td className="p-4 font-semibold text-blue-600">{item.usedCoreQuantity || 0}</td>
                   <td className="p-4">{item.fiberType?.name}</td>
                   <td className="p-4">
                     <StatusBadge 
                       status={item.status} 
                       labels={FoLineStatusLabels} 
                       colors={FoLineStatusColors} 
                     />
                   </td>
                  <td className="p-4 max-w-xs truncate italic opacity-70">{item.note}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Tooltip content={item.kmlFileName ? "Xem bản đồ" : "Chưa có bản đồ"}>
                        <span className="inline-block">
                          <IconButton
                            variant="text"
                            size="sm"
                            color="blue-gray"
                            onClick={() => item.kmlFileName && handleViewMap(item)}
                            disabled={!item.kmlFileName}
                          >
                            <MapIcon className="h-4 w-4" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip content={item.kmlFileName ? "Tải KML" : "Chưa có file KML"}>
                        <span className="inline-block">
                          <IconButton
                            variant="text"
                            size="sm"
                            color="blue-gray"
                            onClick={() => item.kmlFileName && handleKmlDownload(item)}
                            disabled={!item.kmlFileName}
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <IconButton variant="text" size="sm" onClick={() => handleEdit(item)}>
                        <PencilIcon className="h-4 w-4" />
                      </IconButton>
                      <IconButton variant="text" size="sm" color="red" onClick={() => handleDelete(item.id)}>
                        <TrashIcon className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white">
          <Typography variant="small">Trang <b>{currentPage}</b> / <b>{totalPages || 1}</b></Typography>
          <div className="flex gap-2">
            <MTIconButton variant="outlined" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
              <ChevronLeftIcon strokeWidth={2} className="h-4 w-4" />
            </MTIconButton>
            <MTIconButton variant="outlined" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(currentPage + 1)}>
              <ChevronRightIcon strokeWidth={2} className="h-4 w-4" />
            </MTIconButton>
          </div>
        </div>
      </Card>

      <Dialog
        open={openCreate}
        handler={handleOpenCreate}
        className="overflow-hidden rounded-lg bg-white shadow-xl"
        size="sm"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <Typography variant="h5" color="blue-gray" className="font-semibold text-gray-900">
              Thêm mới tuyến cáp tự đầu tư
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Nhập các thông tin chi tiết cho tuyến cáp quang mới
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
            initialValues={{ coreQuantity: 24, usedCoreQuantity: 0, nearSite: { id: null }, farSite: { id: null }, designedDistance: 0, finalDistance: 0, fiberType: { id: 1 }, status: FoLineStatus.OPERATING, note: "" }}
            validationSchema={Yup.object({
              coreQuantity: Yup.number().required("Bắt buộc").min(1, "Phải > 0"),
              nearSite: Yup.object({ id: Yup.number().required("Bắt buộc") }),
              farSite: Yup.object({ id: Yup.number().required("Bắt buộc") }),
            })}
            onSubmit={handleCreate}
          >
            {({ setFieldValue, values }) => (
              <Form className="flex flex-col">
                <DialogBody className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Trạm đầu (Site A)</Typography>
                      <Select
                        options={simpleSiteList}
                        getOptionLabel={(o) => o.siteId}
                        getOptionValue={(o) => o.id}
                        onChange={(val) => setFieldValue("nearSite.id", val?.id)}
                        components={{ MenuList: CustomMenuList }}
                        styles={whiteSelectStyles}
                        placeholder="Chọn trạm..."
                      />
                      <ErrorMessage name="nearSite.id" component="div" className="text-red-500 text-[10px] mt-0.5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Trạm cuối (Site B)</Typography>
                      <Select
                        options={simpleSiteList}
                        getOptionLabel={(o) => o.siteId}
                        getOptionValue={(o) => o.id}
                        onChange={(val) => setFieldValue("farSite.id", val?.id)}
                        components={{ MenuList: CustomMenuList }}
                        styles={whiteSelectStyles}
                        placeholder="Chọn trạm..."
                      />
                      <ErrorMessage name="farSite.id" component="div" className="text-red-500 text-[10px] mt-0.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Tổng số core</Typography>
                      <Field
                        name="coreQuantity"
                        type="number"
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Số core sử dụng</Typography>
                      <Field
                        name="usedCoreQuantity"
                        type="number"
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Trạng thái</Typography>
                      <Field
                        as="select"
                        name="status"
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all bg-white h-[38px]"
                      >
                        {getFoLineStatusOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </Field>
                    </div>
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Loại cáp</Typography>
                      <Field
                        as="select"
                        name="fiberType.id"
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all bg-white h-[38px]"
                      >
                        {fiberTypeList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </Field>
                    </div>
                  </div>

                  <div>
                    <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Chiều dài thực tế (km)</Typography>
                    <Field
                      name="finalDistance"
                      type="number"
                      step="0.01"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Ghi chú</Typography>
                    <Field
                      name="note"
                      as="textarea"
                      rows={3}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                      placeholder="Nhập ghi chú..."
                    />
                  </div>
                </DialogBody>
                <DialogFooter className="border-t border-gray-100 bg-gray-50 px-4 py-3 gap-2">
                  <CustomButton variant="text" color="blue-gray" onClick={handleOpenCreate} size="sm">
                    Hủy bỏ
                  </CustomButton>
                  <CustomButton type="submit" size="sm" className="bg-[#0d47a1] hover:bg-[#0a3a82]">
                    Lưu tuyến mới
                  </CustomButton>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </div>
      </Dialog>

      <Dialog
        open={openEdit}
        handler={() => setOpenEdit(false)}
        className="overflow-hidden rounded-lg bg-white shadow-xl"
        size="sm"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <Typography variant="h5" color="blue-gray" className="font-semibold text-gray-900">
              Cập nhật tuyến cáp
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Chỉnh sửa thông tin tuyến cáp quang: <span className="font-bold text-blue-700">{editFoLine.nearSite?.siteId} - {editFoLine.farSite?.siteId}</span>
            </Typography>
          </div>
          <IconButton
            size="sm"
            variant="text"
            className="text-gray-500 hover:bg-gray-200 rounded-full"
            onClick={() => setOpenEdit(false)}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>

        <div className="max-h-[80vh] overflow-y-auto">
          <Formik
            enableReinitialize
            initialValues={editFoLine}
            onSubmit={handleEditSubmit}
          >
            {({ setFieldValue, values }) => (
              <Form className="flex flex-col">
                <DialogBody className="p-6 space-y-5">
                  {/* Status Dropdown */}
                  <div className="flex flex-col gap-1">
                    <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Trạng thái</Typography>
                    <Field
                      as="select"
                      name="status"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all bg-white h-[38px]"
                    >
                      {getFoLineStatusOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Site A</Typography>
                      <Select
                        options={simpleSiteList}
                        value={simpleSiteList.find(o => o.id === values.nearSite?.id)}
                        getOptionLabel={(o) => o.siteId}
                        getOptionValue={(o) => o.id}
                        onChange={(val) => setFieldValue("nearSite.id", val?.id)}
                        components={{ MenuList: CustomMenuList }}
                        styles={whiteSelectStyles}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Site B</Typography>
                      <Select
                        options={simpleSiteList}
                        value={simpleSiteList.find(o => o.id === values.farSite?.id)}
                        getOptionLabel={(o) => o.siteId}
                        getOptionValue={(o) => o.id}
                        onChange={(val) => setFieldValue("farSite.id", val?.id)}
                        components={{ MenuList: CustomMenuList }}
                        styles={whiteSelectStyles}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Tổng số core</Typography>
                      <Field
                        name="coreQuantity"
                        type="number"
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Số core sử dụng</Typography>
                      <Field
                        name="usedCoreQuantity"
                        type="number"
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Loại cáp</Typography>
                    <Field
                      as="select"
                      name="fiberType.id"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all bg-white h-[38px]"
                    >
                      {fiberTypeList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Field>
                  </div>

                  <div>
                    <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Chiều dài thực tế (km)</Typography>
                    <Field
                      name="finalDistance"
                      type="number"
                      step="0.01"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  {/* KML Upload Section */}
                  <div className="rounded-lg border border-gray-200 p-3 bg-gray-50/50">
                    <Typography variant="small" color="blue-gray" className="mb-2 font-bold flex items-center gap-2">
                      <PlusIcon className="h-4 w-4 text-blue-500" />
                      File bản đồ (KML/KMZ)
                    </Typography>

                    {values.kmlFileName && (
                      <div className="mb-3 flex items-center justify-between bg-white p-2 rounded border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <CloudArrowUpIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-[10px] font-medium text-blue-gray-700 truncate" title={values.kmlFileName}>
                            {values.kmlFileName}
                          </span>
                        </div>
                        <Tooltip content="Tải về">
                          <IconButton size="sm" variant="text" color="blue" onClick={() => handleKmlDownload(values)}>
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    )}

                    <div className="relative">
                      <input
                        type="file"
                        accept=".kml,.kmz"
                        className="block w-full text-[10px] text-slate-500
                                  file:mr-4 file:py-1 file:px-3
                                  file:rounded-full file:border-0
                                  file:text-xs file:font-semibold
                                  file:bg-blue-50 file:text-blue-700
                                  hover:file:bg-blue-100
                                  cursor-pointer"
                        onChange={(e) => setKmlFile(e.target.files[0])}
                      />
                      {kmlFile && (
                        <div className="mt-2 flex items-center gap-2">
                          <Chip size="sm" variant="ghost" value="Mới" color="green" className="rounded-full px-2 py-0.5 text-[10px]" />
                          <span className="text-[10px] text-green-700 font-medium truncate">{kmlFile.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Ghi chú</Typography>
                    <Field
                      name="note"
                      as="textarea"
                      rows={3}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                      placeholder="Nhập ghi chú..."
                    />
                  </div>
                </DialogBody>
                <DialogFooter className="border-t border-gray-100 bg-gray-50 px-4 py-3 gap-2">
                  <CustomButton variant="text" color="blue-gray" onClick={() => setOpenEdit(false)} size="sm">
                    Hủy bỏ
                  </CustomButton>
                  <CustomButton type="submit" size="sm" className="bg-[#0d47a1] hover:bg-[#0a3a82] flex items-center gap-2">
                    <PencilIcon className="h-4 w-4" />
                    Cập nhật tuyến
                  </CustomButton>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </div>
      </Dialog>

      <Dialog
        open={openImport}
        handler={() => setOpenImport(false)}
        className="overflow-hidden rounded-lg bg-white shadow-xl flex flex-col max-h-[90vh]"
        size="lg"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <Typography variant="h5" color="blue-gray" className="font-semibold text-gray-900">
              Import Tuyến cáp tự đầu tư
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Tải lên tệp Excel để thêm hàng loạt tuyến cáp vào hệ thống
            </Typography>
          </div>
          <IconButton
            size="sm"
            variant="text"
            className="text-gray-500 hover:bg-gray-200 rounded-full"
            onClick={() => setOpenImport(false)}
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
              onClick={handleDownloadTemplate}
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Tải tệp mẫu</span>
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
                  Sẵn sàng import <span className="font-bold text-green-800 text-sm mx-0.5">{importPreview.length}</span> tuyến cáp vào hệ thống. Nhấn "Lưu vào hệ thống" để hoàn tất.
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
                              <span className="text-red-600 font-medium text-xs">{err.message}</span>
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
                      <th className="px-4 py-3 font-bold border-r border-gray-200 last:border-0">Trạm đầu</th>
                      <th className="px-4 py-3 font-bold border-r border-gray-200 last:border-0">Trạm cuối</th>
                      <th className="px-4 py-3 font-bold border-r border-gray-200 last:border-0 text-center">Core</th>
                      <th className="px-4 py-3 font-bold border-r border-gray-200 last:border-0 text-center">Khoảng cách</th>
                      <th className="px-4 py-3 font-bold">Loại cáp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importPreview.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="bg-white hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-blue-700 border-r border-gray-50">{row.nearSite}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-900 border-r border-gray-50">{row.farSite}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-600 border-r border-gray-50 text-center">{row.coreQuantity}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-600 border-r border-gray-50 text-center">{row.finalDistance} km</td>
                        <td className="px-4 py-2.5">
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-gray-200">
                            {row.fiberTypeName}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {importPreview.length > 10 && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={5} className="px-4 py-4 text-center text-gray-400 italic text-[11px] font-medium">
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
          <CustomButton variant="text" color="blue-gray" onClick={() => setOpenImport(false)} size="sm">
            Hủy bỏ
          </CustomButton>
          {!importSuccess ? (
            <CustomButton
              className="bg-[#0d47a1] hover:bg-[#0a3a82] flex items-center gap-2"
              onClick={handleCheckImport}
              disabled={!importFile}
              size="sm"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              <span>Kiểm tra dữ liệu</span>
            </CustomButton>
          ) : (
            <CustomButton
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              onClick={handleSaveImport}
              disabled={saving}
              size="sm"
            >
              {saving ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircleIcon className="h-4 w-4" />
              )}
              <span>{saving ? "Đang lưu..." : "Lưu vào hệ thống"}</span>
            </CustomButton>
          )}
        </DialogFooter>
      </Dialog>

      {/* Map Modal */}
      <Dialog open={openMap} handler={() => setOpenMap(false)} size="xl" className="overflow-hidden">
        <DialogBody className="p-0 h-[85vh]">
          {selectedFoMap && openMap && <KmlMap
            foId={selectedFoMap.id}
            onClose={() => setOpenMap(false)}
            title={`${selectedFoMap.nearSite?.siteId} - ${selectedFoMap.farSite?.siteId}`}
          />}
        </DialogBody>
      </Dialog>

      <Dialog
        open={openDelete}
        handler={() => setOpenDelete(false)}
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
          <IconButton
            size="sm"
            variant="text"
            className="!absolute right-3.5 top-3.5 text-gray-500 hover:bg-gray-200 rounded-full"
            onClick={() => setOpenDelete(false)}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>

        <DialogBody className="p-6 text-blue-gray-700">
          <Typography variant="paragraph" color="blue-gray" className="font-medium">
            Bạn có chắc chắn muốn xóa tuyến cáp này?
          </Typography>
          <Typography variant="small" color="gray" className="mt-3 italic">
            Hành động này không thể phục hồi và dữ liệu sẽ bị xóa vĩnh viễn khỏi hệ thống.
          </Typography>
        </DialogBody>

        <DialogFooter className="bg-gray-50 px-4 py-3 gap-2 border-t border-gray-200">
          <CustomButton variant="text" color="blue-gray" onClick={() => setOpenDelete(false)} size="sm">
            Hủy bỏ
          </CustomButton>
          <CustomButton
            variant="filled"
            color="red"
            onClick={handleDeleteSubmit}
            size="sm"
            className="flex items-center gap-2 shadow-md shadow-red-500/20 bg-red-600 hover:bg-red-700"
          >
            <TrashIcon className="h-4 w-4" />
            <span>Xác nhận xóa</span>
          </CustomButton>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default OwnFoList;
