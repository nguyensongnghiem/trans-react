import { useEffect, useMemo, useState } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Select from "react-select";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
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
  Input,
  Switch,
  IconButton as MTIconButton,
} from "@material-tailwind/react";
import {
  DocumentIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/solid";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useSimpleSites from "../hooks/useSimpleSites";
import useMWLines from "../hooks/useMWLines";
import useMicrowaveTypes from "../hooks/useMicrowaveTypes";
import useMicrowaveLicenses from "../hooks/useMicrowaveLicenses";
import CustomButton from "../components/CustomButton";
import StatusChip from "../components/StatusChip";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import FormSelect from "../components/FormSelect";
import StatusBadge from "../components/StatusBadge";
import { DeviceStatus, DeviceStatusLabels, DeviceStatusColors, getDeviceStatusOptions } from "../constants/statusConstants";

const MWLineSchema = Yup.object().shape({
  nearSite: Yup.object({
    id: Yup.number().required("Near Site là bắt buộc"),
  }),
  farSite: Yup.object({
    id: Yup.number().required("Far Site là bắt buộc"),
  }),
  assetCode: Yup.string(),
  nearSiteSerial: Yup.string(),
  farSiteSerial: Yup.string(),
  nearSiteTx: Yup.number().nullable(),
  farSiteTx: Yup.number().nullable(),
  microwaveType: Yup.object({
    id: Yup.number().required("Loại thiết bị viba là bắt buộc"),
  }),
});

const flattenMWLine = (values) => {
  const { nearSite, farSite, microwaveType, license, ...rest } = values;
  return {
    ...rest,
    nearSiteId: nearSite?.id,
    farSiteId: farSite?.id,
    microwaveTypeId: microwaveType?.id,
  };
};

function MWLineList() {
  const axiosInstance = useAxiosPrivate();
  const { simpleSites: siteList } = useSimpleSites();
  const {
    mwLines: mwLineList,
    createMWLine,
    updateMWLine,
    deleteMWLine,
  } = useMWLines();

  const { microwaveTypes: microwaveTypeList } = useMicrowaveTypes();
  const { licenses: licenseList } = useMicrowaveLicenses();
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [editMWLine, setEditMWLine] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  // Import State
  const [openImport, setOpenImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importErrors, setImportErrors] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [filters, setFilters] = useState({
    province: null,
    vendor: null,
    microwaveType: null,
    status: null,
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;


  const filterOptions = useMemo(() => {
    const getUnique = (arr, extractor) => {
      const map = new Map();
      arr.forEach((item) => {
        const val = extractor(item);
        if (val && !map.has(val.id)) {
          map.set(val.id, val);
        }
      });
      return Array.from(map.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    };

    const getFilteredFor = (excludeKey) => {
      return mwLineList.filter((mw) => {
        if (
          excludeKey !== "province" &&
          filters.province &&
          mw.nearSite?.province?.id !== filters.province.id &&
          mw.farSite?.province?.id !== filters.province.id
        )
          return false;
        if (
          excludeKey !== "vendor" &&
          filters.vendor &&
          mw.microwaveType?.vendor?.id !== filters.vendor.id
        )
          return false;
        if (
          excludeKey !== "microwaveType" &&
          filters.microwaveType &&
          mw.microwaveType?.id !== filters.microwaveType.id
        )
          return false;
        if (
          excludeKey !== "status" &&
          filters.status &&
          mw.status !== filters.status.value
        )
          return false;
        if (excludeKey !== "search" && filters.search) {
          const search = filters.search.toLowerCase();
          return (
            mw.nearSiteSerial?.toLowerCase().includes(search) ||
            mw.farSiteSerial?.toLowerCase().includes(search) ||
            mw.assetCode?.toLowerCase().includes(search) ||
            mw.nearSite?.siteId?.toLowerCase().includes(search) ||
            mw.farSite?.siteId?.toLowerCase().includes(search)
          );
        }
        return true;
      });
    };

    const provinceFiltered = getFilteredFor("province");
    const provincesMap = new Map();
    provinceFiltered.forEach((mw) => {
      if (mw.nearSite?.province)
        provincesMap.set(mw.nearSite.province.id, mw.nearSite.province);
      if (mw.farSite?.province)
        provincesMap.set(mw.farSite.province.id, mw.farSite.province);
    });
    const provinces = Array.from(provincesMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    return {
      provinces: provinces,
      vendors: getUnique(
        getFilteredFor("vendor"),
        (mw) => mw.microwaveType?.vendor,
      ),
      microwaveTypes: getUnique(
        getFilteredFor("microwaveType"),
        (mw) => mw.microwaveType,
      ),
    };
  }, [mwLineList, filters]);

  const filteredMWLines = useMemo(() => {
    return mwLineList.filter((mw) => {
      const matchProvince =
        !filters.province ||
        mw.nearSite?.province?.id === filters.province.id ||
        mw.farSite?.province?.id === filters.province.id;
      const matchVendor =
        !filters.vendor || mw.microwaveType?.vendor?.id === filters.vendor.id;
      const matchType =
        !filters.microwaveType ||
        mw.microwaveType?.id === filters.microwaveType.id;
      const matchStatus = !filters.status || mw.status === filters.status.value;
      const matchSearch =
        !filters.search ||
        mw.nearSiteSerial?.toLowerCase().includes(filters.search.toLowerCase()) ||
        mw.farSiteSerial?.toLowerCase().includes(filters.search.toLowerCase()) ||
        mw.assetCode?.toLowerCase().includes(filters.search.toLowerCase()) ||
        mw.nearSite?.siteId
          ?.toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        mw.farSite?.siteId
          ?.toLowerCase()
          .includes(filters.search.toLowerCase());

      return (
        matchProvince && matchVendor && matchType && matchStatus && matchSearch
      );
    });
  }, [mwLineList, filters]);

  const totalPages = Math.ceil(filteredMWLines.length / rowsPerPage);
  const paginatedMWLines = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredMWLines.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredMWLines, currentPage]);

  const handleResetFilters = () => {
    setFilters({
      province: null,
      vendor: null,
      microwaveType: null,
      status: null,
      search: "",
    });
  };

  const handleEdit = (mw) => {
    const initialDataForEdit = {
      ...mw,
      licenseNumber: mw.license?.licenseNumber || "",
    };
    setEditMWLine(initialDataForEdit);
    setOpenEdit(true);
  };

  const onBtnExport = () => {
    const data = filteredMWLines.map((mw) => ({
      "Near Site": mw.nearSite?.siteId,
      "Far Site": mw.farSite?.siteId,
      "Mã tài sản": mw.assetCode,
      "Serial Site A": mw.nearSiteSerial,
      "Serial Site B": mw.farSiteSerial,
      "Tx Site A": mw.nearSiteTx,
      "Tx Site B": mw.farSiteTx,
      "Loại thiết bị": mw.microwaveType?.name,
      Hãng: mw.microwaveType?.vendor?.name,
      "Giấy phép": mw.license?.licenseNumber || "N/A",
      "Trạng thái": mw.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MWLines");
    XLSX.writeFile(wb, "DanhSachTuyenViba.xlsx");
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axiosInstance.get(
        "mw-lines/import-excel/template",
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "mw-line-import-template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Lỗi khi tải template", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportErrors(null);
      setImportResults(null);
    }
    e.target.value = null;
  };

  const handleCheckImport = async () => {
    if (!importFile) return;
    setIsChecking(true);
    setImportErrors(null);
    setImportResults(null);
    const formData = new FormData();
    formData.append("file", importFile);
    try {
      const res = await axiosInstance.post(
        "mw-lines/import-excel/check",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      setImportResults(res.data);
    } catch (error) {
      if (error.response?.status === 400) {
        setImportErrors(error.response.data);
      } else {
        console.error("Lỗi khi kiểm tra file", error);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveImport = async () => {
    if (!importFile) return;
    setIsSaving(true);
    const formData = new FormData();
    formData.append("file", importFile);
    try {
      await axiosInstance.post("mw-lines/import-excel/save", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setOpenImport(false);
      setImportFile(null);
      setImportResults(null);
      // Refresh list
      window.location.reload(); // Quick way to refresh from useMWLines hook
    } catch (error) {
      console.error("Lỗi khi lưu import", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenImport = () => {
    setOpenImport((prev) => !prev);
    if (!openImport) {
      setImportFile(null);
      setImportErrors(null);
      setImportResults(null);
      setIsChecking(false);
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Quản lý Tuyến Viba
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số: {filteredMWLines.length} tuyến
          </p>
        </div>
        <div className="flex gap-2">
          <CustomButton
            className="flex items-center gap-2"
            size="sm"
            onClick={() => setOpenCreate(true)}
          >
            <PlusIcon className="h-4 w-4" /> Thêm mới
          </CustomButton>
          <CustomButton
            className="flex items-center gap-2 bg-[#e65100] hover:bg-[#bf360c]"
            size="sm"
            onClick={handleOpenImport}
          >
            <ArrowUpTrayIcon className="h-4 w-4" /> Import Excel
          </CustomButton>
          <CustomButton
            className="flex items-center gap-2 bg-green-600"
            size="sm"
            onClick={onBtnExport}
          >
            <ArrowDownTrayIcon className="h-4 w-4" /> Xuất Excel
          </CustomButton>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm mb-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4 text-blue-gray-700">
          <FunnelIcon className="h-5 w-5" />
          <span className="font-bold text-sm uppercase tracking-wider">
            Bộ lọc tìm kiếm
          </span>
          {(filters.province ||
            filters.vendor ||
            filters.microwaveType ||
            filters.status ||
            filters.search) && (
              <button
                onClick={handleResetFilters}
                className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
              >
                <ArrowPathIcon className="h-3 w-3" /> Xóa bộ lọc
              </button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              Hãng sản xuất
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
              Loại thiết bị
            </span>
            <Select
              isClearable
              placeholder="Tất cả loại"
              className="text-sm"
              options={filterOptions.microwaveTypes}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.microwaveType}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, microwaveType: val }))
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
              options={getDeviceStatusOptions()}
              getOptionLabel={(o) => o.label}
              getOptionValue={(o) => o.value}
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
              placeholder="Serial, Site ID..."
              className="!border-t-blue-gray-200 focus:!border-blue-500 rounded-lg text-sm"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              containerProps={{ className: "min-w-0" }}
            />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <table className="w-full text-left table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 font-bold text-sm">STT</th>
              <th className="p-4 font-bold text-sm">Tỉnh</th>
              <th className="p-4 font-bold text-sm">Site A</th>
              <th className="p-4 font-bold text-sm">Site B</th>
              <th className="p-4 font-bold text-sm">Mã tài sản</th>
              <th className="p-4 font-bold text-sm">Serial Site A</th>
              <th className="p-4 font-bold text-sm">Tx Site A</th>
              <th className="p-4 font-bold text-sm">Serial Site B</th>
              <th className="p-4 font-bold text-sm">Tx Site B</th>
              <th className="p-4 font-bold text-sm">Loại TB</th>
              <th className="p-4 font-bold text-sm">Giấy phép</th>
              <th className="p-4 font-bold text-sm text-center">Trạng thái</th>
              <th className="p-4 font-bold text-sm text-center">Tác động</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMWLines.map((mw, index) => (
              <tr key={mw.id} className="border-t hover:bg-gray-50">
                <td className="p-4 text-sm">
                  {(currentPage - 1) * rowsPerPage + index + 1}
                </td>
                <td className="p-4 text-sm font-medium">
                  {mw.nearSite?.province?.name}
                  {mw.farSite?.province &&
                    mw.nearSite?.province?.id !== mw.farSite?.province?.id
                    ? ` - ${mw.farSite.province.name}`
                    : ""}
                </td>
                <td className="p-4 text-sm font-medium">
                  {mw.nearSite?.siteId}
                </td>
                <td className="p-4 text-sm font-medium">
                  {mw.farSite?.siteId}
                </td>
                <td className="p-4 text-sm">{mw.assetCode}</td>
                <td className="p-4 text-sm">{mw.nearSiteSerial}</td>
                <td className="p-4 text-sm">{mw.nearSiteTx}</td>
                <td className="p-4 text-sm">{mw.farSiteSerial}</td>
                <td className="p-4 text-sm">{mw.farSiteTx}</td>
                <td className="p-4 text-sm">{mw.microwaveType?.name}</td>
                <td className="p-4 text-sm">
                  {mw.license ? (
                    <div className="text-xs">
                      <p className="font-bold text-blue-600">
                        {mw.license.licenseNumber}
                      </p>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic text-xs">
                      Chưa có GP
                    </span>
                  )}
                </td>
                <td className="p-4 text-center">
                  <div className="flex justify-center">
                    <StatusBadge
                      status={mw.status}
                      labels={DeviceStatusLabels}
                      colors={DeviceStatusColors}
                    />
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex justify-center gap-1">
                    <IconButton
                      variant="text"
                      size="sm"
                      color="blue"
                      onClick={() => handleEdit(mw)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      variant="text"
                      size="sm"
                      color="red"
                      onClick={() => {
                        setDeleteId(mw.id);
                        setOpenDelete(true);
                      }}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Modal Thêm mới */}
      <Dialog
        open={openCreate}
        handler={() => setOpenCreate(false)}
        className="overflow-hidden rounded-lg bg-white shadow-xl"
        size="md"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <Typography
              variant="h5"
              color="blue-gray"
              className="font-semibold text-gray-900"
            >
              Thêm mới Tuyến Viba
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Nhập các thông tin chi tiết cho tuyến viba mới
            </Typography>
          </div>
          <IconButton
            size="sm"
            variant="text"
            className="text-gray-500 hover:bg-gray-200 rounded-full"
            onClick={() => setOpenCreate(false)}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>

        <div className="max-h-[80vh] overflow-y-auto">
          <Formik
            initialValues={{
              nearSite: { id: null },
              farSite: { id: null },
              assetCode: "",
              nearSiteSerial: "",
              farSiteSerial: "",
              nearSiteTx: "",
              farSiteTx: "",
              microwaveType: { id: null },
              status: DeviceStatus.OPERATING,
              licenseNumber: "",
            }}
            validationSchema={MWLineSchema}
            onSubmit={async (values) => {
              const payload = flattenMWLine(values);
              await createMWLine(payload);
              setOpenCreate(false);
            }}
          >
            {({ setFieldValue, values }) => (
              <Form className="flex flex-col">
                <DialogBody className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-5">
                      <div className="flex items-center gap-2 mb-2 border-b border-blue-50 pb-1">
                        <div className="bg-blue-100 p-1.5 rounded-md">
                          <PlusIcon className="h-4 w-4 text-blue-700" />
                        </div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-bold"
                        >
                          Thông tin tuyến
                        </Typography>
                      </div>

                      <FormSelect
                        label="Trạm đầu (Near Site)"
                        name="nearSite.id"
                        options={siteList}
                        getOptionLabel={(o) => o.siteId}
                        getOptionValue={(o) => o.id}
                        required
                      />

                      <FormSelect
                        label="Trạm cuối (Far Site)"
                        name="farSite.id"
                        options={siteList}
                        getOptionLabel={(o) => o.siteId}
                        getOptionValue={(o) => o.id}
                        required
                      />

                      <div className="grid grid-cols-1 gap-4">
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
                            placeholder="Nhập mã tài sản..."
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="mb-1 font-bold"
                            >
                              Serial Site A (Near)
                            </Typography>
                            <Field
                              name="nearSiteSerial"
                              placeholder="Nhập Serial Site A..."
                              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="mb-1 font-bold"
                            >
                              Tx Site A (Frequency)
                            </Typography>
                            <Field
                              type="number"
                              name="nearSiteTx"
                              placeholder="F1..."
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
                              Serial Site B (Far)
                            </Typography>
                            <Field
                              name="farSiteSerial"
                              placeholder="Nhập Serial Site B..."
                              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="mb-1 font-bold"
                            >
                              Tx Site B (Frequency)
                            </Typography>
                            <Field
                              type="number"
                              name="farSiteTx"
                              placeholder="F2..."
                              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <FormSelect
                        label="Loại thiết bị"
                        name="microwaveType.id"
                        options={microwaveTypeList}
                        getOptionLabel={(o) => `${o.vendor.name} - ${o.name}`}
                        getOptionValue={(o) => o.id}
                        required
                      />
                    </div>

                    <div className="space-y-5 md:border-l md:pl-6">
                      <div className="flex items-center gap-2 mb-2 border-b border-amber-50 pb-1">
                        <div className="bg-amber-100 p-1.5 rounded-md">
                          <PlusIcon className="h-4 w-4 text-amber-700" />
                        </div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-bold"
                        >
                          Giấy phép tần số
                        </Typography>
                      </div>

                      <div>
                        <FormSelect
                          label="Số giấy phép"
                          name="licenseNumber"
                          options={licenseList}
                          getOptionLabel={(o) => o.licenseNumber}
                          getOptionValue={(o) => o.licenseNumber}
                          placeholder="Chọn giấy phép tần số..."
                        />
                        <p className="text-[10px] text-gray-500 mt-1 italic">
                          * Chọn từ danh sách giấy phép đã tồn tại trong hệ thống.
                        </p>
                      </div>

                      <div className="pt-2">
                        <FormSelect
                          label="Trạng thái"
                          name="status"
                          options={getDeviceStatusOptions()}
                          getOptionLabel={(o) => o.label}
                          getOptionValue={(o) => o.value}
                          required
                        />
                      </div>

                      <div className="pt-2">
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
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </DialogBody>

                <DialogFooter className="border-t border-gray-100 bg-gray-50 px-4 py-3 gap-2">
                  <CustomButton
                    variant="text"
                    color="blue-gray"
                    onClick={() => setOpenCreate(false)}
                    size="sm"
                  >
                    Hủy bỏ
                  </CustomButton>
                  <CustomButton
                    type="submit"
                    className="bg-[#0d47a1] hover:bg-[#0a3a82]"
                    size="sm"
                  >
                    Lưu tuyến mới
                  </CustomButton>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </div>
      </Dialog >

      {/* Modal Cập nhật */}
      < Dialog
        open={openEdit}
        handler={() => setOpenEdit(false)
        }
        className="overflow-hidden rounded-lg bg-white shadow-xl"
        size="md"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <Typography
              variant="h5"
              color="blue-gray"
              className="font-semibold text-gray-900"
            >
              Cập nhật Tuyến Viba
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Thay đổi các thông tin cho tuyến viba:{" "}
              <span className="font-bold text-blue-700">
                {editMWLine.nearSite?.siteId} - {editMWLine.farSite?.siteId}
              </span>
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
            initialValues={editMWLine}
            validationSchema={MWLineSchema}
            onSubmit={async (values) => {
              const payload = flattenMWLine(values);
              await updateMWLine(values.id, payload);
              setOpenEdit(false);
            }}
          >
            {({ setFieldValue, values }) => (
              <Form className="flex flex-col">
                <DialogBody className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-5">
                      <div className="flex flex-col gap-4 mb-4">
                        <FormSelect
                          label="Trạng thái hoạt động"
                          name="status"
                          options={getDeviceStatusOptions()}
                          getOptionLabel={(o) => o.label}
                          getOptionValue={(o) => o.value}
                          required
                        />
                      </div>

                      <div className="flex items-center gap-2 mb-2 border-b border-blue-50 pb-1">
                        <div className="bg-blue-100 p-1.5 rounded-md">
                          <PencilIcon className="h-4 w-4 text-blue-700" />
                        </div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-bold"
                        >
                          Thông tin tuyến
                        </Typography>
                      </div>

                      <FormSelect
                        label="Trạm Site A (Near)"
                        name="nearSite.id"
                        options={siteList}
                        getOptionLabel={(o) => o.siteId}
                        getOptionValue={(o) => o.id}
                        required
                      />

                      <FormSelect
                        label="Trạm Site B (Far)"
                        name="farSite.id"
                        options={siteList}
                        getOptionLabel={(o) => o.siteId}
                        getOptionValue={(o) => o.id}
                        required
                      />

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
                          placeholder="Nhập mã tài sản..."
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="mb-1 font-bold"
                          >
                            Serial Site A (Near)
                          </Typography>
                          <Field
                            name="nearSiteSerial"
                            placeholder="Nhập Serial Site A..."
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="mb-1 font-bold"
                          >
                            Tx Site A (Frequency)
                          </Typography>
                          <Field
                            type="number"
                            name="nearSiteTx"
                            placeholder="F1..."
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
                            Serial Site B (Far)
                          </Typography>
                          <Field
                            name="farSiteSerial"
                            placeholder="Nhập Serial Site B..."
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="mb-1 font-bold"
                          >
                            Tx Site B (Frequency)
                          </Typography>
                          <Field
                            type="number"
                            name="farSiteTx"
                            placeholder="F2..."
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <FormSelect
                        label="Loại thiết bị"
                        name="microwaveType.id"
                        options={microwaveTypeList}
                        getOptionLabel={(o) => `${o.vendor.name} - ${o.name}`}
                        getOptionValue={(o) => o.id}
                        required
                      />
                    </div>

                    <div className="space-y-5 md:border-l md:pl-6">
                      <div className="flex items-center gap-2 mb-2 border-b border-amber-50 pb-1">
                        <div className="bg-amber-100 p-1.5 rounded-md">
                          <PlusIcon className="h-4 w-4 text-amber-700" />
                        </div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-bold"
                        >
                          Giấy phép tần số
                        </Typography>
                      </div>
                      <div>
                        <FormSelect
                          label="Số giấy phép"
                          name="licenseNumber"
                          options={licenseList}
                          getOptionLabel={(o) => o.licenseNumber}
                          getOptionValue={(o) => o.licenseNumber}
                          placeholder="Chọn giấy phép tần số..."
                        />
                        <p className="text-[10px] text-gray-500 mt-1 italic">
                          * Chọn từ danh sách giấy phép đã tồn tại trong hệ thống.
                        </p>
                      </div>

                      <div className="pt-2">
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
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </DialogBody>

                <DialogFooter className="border-t border-gray-100 bg-gray-50 px-4 py-3 gap-2">
                  <CustomButton
                    variant="text"
                    color="blue-gray"
                    onClick={() => setOpenEdit(false)}
                    size="sm"
                  >
                    Hủy bỏ
                  </CustomButton>
                  <CustomButton
                    type="submit"
                    className="bg-[#0d47a1] hover:bg-[#0a3a82]"
                    size="sm"
                  >
                    Cập nhật tuyến
                  </CustomButton>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </div>
      </Dialog>

      <DeleteConfirmationModal
        open={openDelete}
        handler={() => setOpenDelete(false)}
        onConfirm={async () => {
          await deleteMWLine(deleteId);
          setOpenDelete(false);
        }}
        title="Xóa tuyến viba"
      />

      {/* Modal Import */}
      <Dialog
        open={openImport}
        handler={handleOpenImport}
        className="overflow-hidden rounded-lg bg-white shadow-xl flex flex-col max-h-[90vh]"
        size="lg"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <Typography
              variant="h5"
              color="blue-gray"
              className="font-semibold text-gray-900"
            >
              Import Tuyến Viba từ Excel
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Tải lên tệp Excel để thêm hàng loạt tuyến viba vào hệ thống
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
              <Typography
                variant="small"
                color="blue"
                className="font-bold uppercase mb-1"
              >
                Tải tệp mẫu
              </Typography>
              <Typography
                variant="small"
                color="blue-gray"
                className="text-[11px] leading-relaxed"
              >
                Sử dụng tệp mẫu có sẵn.{" "}

                <span className="text-blue-700 italic">
                  Thông tin về Số giấy phép
                </span>{" "}
                có thể bỏ trống nếu chưa có thông tin.
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
            <Typography
              variant="small"
              color="blue-gray"
              className="font-bold uppercase mb-3 text-[11px] tracking-wider"
            >
              Bước 2: Chọn tệp Excel từ máy tính
            </Typography>

            {!importFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 text-center hover:bg-blue-50/30 hover:border-blue-300 transition-all p-8 relative group">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="p-3 bg-white rounded-full shadow-sm border border-gray-200 group-hover:scale-110 transition-transform">
                    <CloudArrowUpIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-blue-600">
                      Nhấn để tải lên
                    </span>{" "}
                    hoặc kéo thả file vào đây
                    <br />
                    <span className="text-xs text-gray-400 mt-1 block tracking-tight">
                      Hỗ trợ các định dạng tiêu chuẩn .xlsx, .xls
                    </span>
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
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-bold truncate max-w-[300px]"
                      title={importFile.name}
                    >
                      {importFile.name}
                    </Typography>
                    <Typography
                      variant="small"
                      className="text-blue-gray-400 text-[10px] font-medium uppercase mt-0.5"
                    >
                      Excel Spreadsheet • {(importFile.size / 1024).toFixed(2)}{" "}
                      KB
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
                    setImportResults(null);
                    setImportErrors(null);
                  }}
                >
                  <TrashIcon className="h-5 w-5" />
                </IconButton>
              </div>
            )}
          </div>

          {/* Verification Result */}
          {importResults && (
            <div className="p-5 bg-green-50 border border-green-100 rounded-xl flex items-start gap-4 animate-fadeIn shadow-sm">
              <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-700" />
              </div>
              <div className="flex-1">
                <Typography
                  variant="small"
                  color="green"
                  className="font-bold mb-0.5"
                >
                  Kiểm tra dữ liệu thành công!
                </Typography>
                <Typography variant="small" className="text-gray-700 text-xs">
                  Sẵn sàng import{" "}
                  <span className="font-bold text-green-800 text-sm mx-0.5">
                    {importResults.total}
                  </span>{" "}
                  tuyến viba vào hệ thống. Nhấn "Lưu vào hệ thống" để hoàn tất.
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
                <Typography
                  variant="small"
                  className="text-red-800 font-bold uppercase tracking-wider text-[11px]"
                >
                  Phát hiện lỗi trong file ({Object.keys(importErrors).length}{" "}
                  dòng)
                </Typography>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <ul className="divide-y divide-gray-100">
                  {Object.entries(importErrors).map(([row, errorGroup]) => (
                    <li
                      key={row}
                      className="p-4 hover:bg-red-50/30 transition-colors"
                    >
                      <div className="flex gap-4">
                        <span className="font-bold text-gray-900 bg-red-100/50 px-2.5 py-1 rounded-md h-fit text-xs border border-red-200">
                          Dòng {row}
                        </span>
                        <ul className="space-y-2 flex-1 mt-0.5">
                          {errorGroup.errors?.map((err, idx) => (
                            <li key={idx} className="flex flex-col gap-0.5">
                              <span className="font-bold text-gray-700 text-[11px] uppercase tracking-tight">
                                {err.columnName || err.column}
                              </span>
                              <span className="text-red-600 font-medium text-xs">
                                {err.message}
                              </span>
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

          {/* Preview Table (if available in importResults.rows) */}
          {importResults &&
            importResults.rows &&
            importResults.rows.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-fadeIn bg-white">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <Typography
                    variant="small"
                    className="font-bold text-gray-700 uppercase tracking-wider text-[11px]"
                  >
                    Xem trước dữ liệu (Tối đa 10 dòng)
                  </Typography>
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-200">
                    TỔNG {importResults.total} DÒNG
                  </span>
                </div>
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] text-gray-500 uppercase bg-gray-100 sticky top-0 z-10 border-b">
                      <tr>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 last:border-0">
                          Site A
                        </th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 last:border-0">
                          Site B
                        </th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 last:border-0">
                          Mã tài sản
                        </th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 last:border-0">
                          Serial A
                        </th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 last:border-0">
                          Tx A
                        </th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 last:border-0">
                          Serial B
                        </th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 last:border-0">
                          Tx B
                        </th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 last:border-0">
                          Loại TB
                        </th>
                        <th className="px-4 py-3 font-bold">Giấy phép</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {importResults.rows.slice(0, 10).map((row, idx) => (
                        <tr
                          key={idx}
                          className="bg-white hover:bg-blue-50/30 transition-colors"
                        >
                          <td className="px-4 py-2.5 font-bold text-blue-700 border-r border-gray-50">
                            {row.nearSite}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-gray-900 border-r border-gray-50">
                            {row.farSite}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-gray-600 border-r border-gray-50">
                            {row.assetCode}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-gray-600 border-r border-gray-50">
                            {row.nearSiteSerial}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-gray-600 border-r border-gray-50">
                            {row.nearSiteTx}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-gray-600 border-r border-gray-50">
                            {row.farSiteSerial}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-gray-600 border-r border-gray-50">
                            {row.farSiteTx}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-gray-600 border-r border-gray-50">
                            {row.microwaveTypeName}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">
                            {row.licenseNumber || "-"}
                          </td>
                        </tr>
                      ))}
                      {importResults.rows.length > 10 && (
                        <tr className="bg-gray-50/50">
                          <td
                            colSpan={5}
                            className="px-4 py-4 text-center text-gray-400 italic text-[11px] font-medium"
                          >
                            ... và {importResults.rows.length - 10} dòng khác
                            không được hiển thị trong bản xem trước ...
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
          <CustomButton
            variant="text"
            color="blue-gray"
            onClick={handleOpenImport}
            size="sm"
          >
            Hủy bỏ
          </CustomButton>
          {!importResults ? (
            <CustomButton
              className="bg-[#0d47a1] hover:bg-[#0a3a82] flex items-center gap-2"
              onClick={handleCheckImport}
              disabled={!importFile || isChecking}
              size="sm"
            >
              {isChecking ? (
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
              disabled={isSaving}
              size="sm"
            >
              {isSaving ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircleIcon className="h-4 w-4" />
              )}
              <span>{isSaving ? "Đang lưu..." : "Lưu vào hệ thống"}</span>
            </CustomButton>
          )}
        </DialogFooter>
      </Dialog>
    </div >
  );
}

export default MWLineList;
