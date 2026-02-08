import { useEffect, useMemo, useState, useRef } from "react";
import { DocumentIcon, PencilIcon, TrashIcon, PlusIcon, ArrowDownTrayIcon, CloudArrowUpIcon, CheckCircleIcon, BanknotesIcon, ChartPieIcon, ChartBarIcon, ServerStackIcon } from "@heroicons/react/24/solid";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/outline";
import Select from "react-select";
import * as Yup from "yup";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';

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
  Input,
  IconButton as MTIconButton,
} from "@material-tailwind/react";
import { CustomMenuList } from "./CustomList";
import { toast } from "react-toastify";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import OwnerChip from "../components/OwnerChip";
import StatusChip from "../components/StatusChip";
import CustomButton from "../components/CustomButton";
import StatusBadge from "../components/StatusBadge";
import { LeaseLineStatus, LeaseLineStatusLabels, LeaseLineStatusColors, getLeaseLineStatusOptions } from "../constants/statusConstants";

function LeaselineList() {
  // const navigate = useNavigate();
  const [simpleSiteList, setSimpleSiteList] = useState([]);
  const [leaselineList, setLeaselineList] = useState([]);
  const [transmissionOwnerList, setTransmissionOwnerList] = useState([]);
  const [leaseLineConnectTypeList, setLeaseLineConnectTypeList] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editLeaseline, setEditLeaseline] = useState({});
  const [editId, setEditId] = useState(null);
  const axiosInstance = useAxiosPrivate();

  // Import states
  const [importOpen, setImportOpen] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [excelChecked, setExcelChecked] = useState(false);
  const [excelSuccess, setExcelSuccess] = useState(false);
  const [excelErrors, setExcelErrors] = useState({});
  const [excelRows, setExcelRows] = useState([]);
  const [saving, setSaving] = useState(false);

  // Filter and pagination states
  const [filters, setFilters] = useState({
    search: "",
    site: null,
    transmissionOwner: null,
    leaseLineConnectType: null,
    status: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // Filter Logic
  const filteredLeaselines = useMemo(() => {
    return leaselineList.filter((item) => {
      const matchSite = !filters.site || item.site?.id === filters.site.value;
      const matchOwner = !filters.transmissionOwner || item.transmissionOwner?.id === filters.transmissionOwner.value;
      const matchType = !filters.leaseLineConnectType || item.leaseLineConnectType?.id === filters.leaseLineConnectType.value;
      const matchStatus = !filters.status || item.status === filters.status.value;
      const matchSearch = !filters.search ||
        item.site?.siteId?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.note?.toLowerCase().includes(filters.search.toLowerCase());

      return matchSite && matchOwner && matchType && matchStatus && matchSearch;
    });
  }, [leaselineList, filters]);

  const totalPages = Math.ceil(filteredLeaselines.length / rowsPerPage);
  const paginatedLeaselines = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredLeaselines.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredLeaselines, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      search: "",
      site: null,
      transmissionOwner: null,
      leaseLineConnectType: null,
      status: null,
    });
  };

  useEffect(() => {
    const getAllLeaseline = async () => {
      try {
        setIsLoading(true);
        const leaselines = await axiosInstance.get("leaselines");
        setLeaselineList(leaselines.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    getAllLeaseline();
  }, []);

  useEffect(() => {
    const getAllSites = async () => {
      try {
        const siteList = await axiosInstance.get("sites/simple-list");
        setSimpleSiteList(siteList.data);
      } catch (error) {
        console.log(error);
      }
    };
    getAllSites();
  }, []);

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

  useEffect(() => {
    const getAllLeaselineConnectType = async () => {
      try {
        const leaselineConnectTypeList = await axiosInstance.get(
          "leaseline-connect-type"
        );
        setLeaseLineConnectTypeList(leaselineConnectTypeList.data);
      } catch (error) {
        console.log(error);
      }
    };
    getAllLeaselineConnectType();
  }, []);

  const getLeaselineById = async (editId) => {
    try {
      const leaseline = await axiosInstance.get(`leaselines/${editId}`);
      setEditLeaseline({ ...leaseline.data });
    } catch (error) {
      console.log(error);
    }
  };
  const VND = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });
  
  // --- Thống kê cho Dashboard ---
  const stats = useMemo(() => {
    const totalCount = filteredLeaselines.length;
    const totalCost = filteredLeaselines.reduce(
      (acc, item) => acc + (Number(item.cost) || 0) * (Number(item.quantity) || 1),
      0
    );

    // Thống kê theo Nhà cung cấp
    const providerCounts = {};
    filteredLeaselines.forEach((item) => {
      const name = item.transmissionOwner?.name || "Khác";
      providerCounts[name] = (providerCounts[name] || 0) + 1;
    });
    const providerData = Object.entries(providerCounts)
      .map(([name, count]) => ({
        name,
        count,
        percent: totalCount > 0 ? (count / totalCount) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4); // Lấy top 4

    // Thống kê theo Băng thông
    const bandwidthCounts = {};
    filteredLeaselines.forEach((item) => {
      const speed = item.speed ? `${item.speed} Mbps` : "N/A";
      bandwidthCounts[speed] = (bandwidthCounts[speed] || 0) + 1;
    });
    const counts = Object.values(bandwidthCounts);
    const maxCount = counts.length > 0 ? Math.max(...counts) : 0;

    const bandwidthData = Object.entries(bandwidthCounts)
      .map(([name, count]) => ({
        name,
        count,
        percent: maxCount > 0 ? (count / maxCount) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { totalCount, totalCost, providerData, bandwidthData };
  }, [filteredLeaselines]);

  const pieColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];
  const getPieGradient = (data) => {
    if (!data.length) return "conic-gradient(#e2e8f0 0% 100%)";
    let currentAngle = 0;
    const segments = data.map((d, i) => {
      const start = currentAngle;
      const end = currentAngle + d.percent;
      currentAngle = end;
      return `${pieColors[i % pieColors.length]} ${start}% ${end}%`;
    });
    return `conic-gradient(${segments.join(", ")})`;
  };
  

  // Xử lý thêm mới
  const handleOpenCreate = () => {
    setOpenCreate(!openCreate);
  };
  const handleCreate = async (leaseline) => {
    console.log(leaseline);
    try {
      await axiosInstance.post("leaselines", leaseline);
      toast.success("Đã thêm mới kênh thuê thành công.");
    } catch (error) {
      toast.error(error.response.data.message, {
        zIndex: 9999,
      });
    } finally {
      setOpenCreate(!openCreate);
    }
  };
  // Xử lý Edit

  const handleEdit = async (editId) => {
    await getLeaselineById(editId);
    handleOpenEdit();
  };

  const handleOpenEdit = () => {
    setOpenEdit(!openEdit);
  };

  const handleEditSubmit = async (leaseline) => {
    console.log(leaseline);
    try {
      await axiosInstance.put(`leaselines/${leaseline.id}`, leaseline);
      setLeaselineList((prevList) =>
        prevList.map((item) => (item.id === leaseline.id ? leaseline : item))
      );
      toast.success("Đã cập nhật thành công kênh thuê");
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 400) {
        toast.error(error.data.message);
      } else {
        toast.error("Có lỗi bất thường xảy ra");
      }
    } finally {
      setOpenEdit(!openEdit);
    }
    setOpenEdit(!openEdit);
  };

  // Xử lý Xóa

  const handleDeleteLeaseline = async (deleteId) => {
    setDeleteId(deleteId);
    handleOpenDelete();
  };
  const handleOpenDelete = () => {
    setOpenDelete(!openDelete);
  };
  const handleDeleteSubmit = async () => {
    try {
      await axiosInstance.delete("leaselines/" + deleteId);
      setDeleteId(null);
      toast.success("Đã xóa thành công kênh thuê");
      setLeaselineList((prevState) =>
        prevState.filter((leaseline) => leaseline.id !== deleteId)
      );
    } catch (e) {
      console.log(e);
      toast.error("Có lỗi xảy ra khi xóa kênh thuê");
    } finally {
      handleOpenDelete();
    }
  };

  let deleteLeaselineName;
  if (deleteId != null) {
    deleteLeaselineName = leaselineList.find(
      (leaseline) => leaseline.id === deleteId
    ).site.siteId;
    console.log(deleteLeaselineName);
  }

  // if (isLoading) return <Spinner />;
  const onBtnExport = () => {
    const dataToExport = filteredLeaselines.map((item) => ({
      "Tỉnh": item.site?.province?.name,
      "Site ID": item.site?.siteId,
      "Nhà cung cấp": item.transmissionOwner?.name,
      "Số lượng": item.quantity,
      "Băng thông (Mbps)": item.speed,
      "Đơn giá (VNĐ)": item.cost,
      "Loại kênh": item.leaseLineConnectType?.name,
      "Ghi chú": item.note,
      "Trạng thái": LeaseLineStatusLabels[item.status] || item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leaselines");
    XLSX.writeFile(workbook, "LeaselineList.xlsx");
  };

  // Import Handlers
  const handleOpenImport = () => {
    setImportOpen((prev) => !prev);
    if (importOpen) {
      setExcelFile(null);
      setExcelChecked(false);
      setExcelSuccess(false);
      setExcelErrors({});
      setExcelRows([]);
      setSaving(false);
    }
  };

  const handleCheckImport = async () => {
    if (!excelFile) {
      toast.warning("Vui lòng chọn file Excel");
      return;
    }
    try {
      const form = new FormData();
      form.append("file", excelFile);
      const res = await axiosInstance.post("leaselines/import-excel/check", form);
      setExcelRows(res.data?.rows || []);
      setExcelErrors({});
      setExcelChecked(true);
      setExcelSuccess(true);
      toast.success("✔ File Excel hợp lệ");
    } catch (err) {
      if (err?.response?.status === 400) {
        setExcelErrors(err.response.data || {});
        setExcelRows([]);
        setExcelChecked(true);
        setExcelSuccess(false);
        toast.error("❌ Dữ liệu Excel không hợp lệ");
        return;
      }
      toast.error("Lỗi hệ thống khi kiểm tra Excel");
    }
  };

  const handleSaveImport = async () => {
    if (!excelSuccess) return;
    try {
      setSaving(true);
      const form = new FormData();
      form.append("file", excelFile);
      const res = await axiosInstance.post("leaselines/import-excel/save", form);
      toast.success(res.data?.message || "Import thành công");
      
      // Reload list
      const leaselines = await axiosInstance.get("leaselines");
      setLeaselineList(leaselines.data);

      setImportOpen(false);
      setExcelFile(null);
      setExcelChecked(false);
      setExcelSuccess(false);
      setExcelErrors({});
      setExcelRows([]);
    } catch (err) {
        const data = err?.response?.data;
        toast.error(data?.message || "❌ Lỗi khi lưu dữ liệu");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axiosInstance.get("leaselines/import-excel/template", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "leaseline-import-template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Không thể tải file mẫu.");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Danh sách kênh thuê
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số: <span className="font-semibold text-blue-600">{filteredLeaselines.length}</span> / {leaselineList.length} kênh
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
            <DocumentArrowUpIcon className="h-4 w-4" /> Import Excel
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

      {/* Dashboard Cards */}
      <div className="mb-6 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-blue-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <Typography className="mb-1 font-semibold text-blue-gray-500">
                Tổng số kênh
              </Typography>
              <Typography variant="h4" color="blue-gray" className="font-bold">
                {stats.totalCount}
              </Typography>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
              <ServerStackIcon className="h-6 w-6" />
            </div>
          </div>
          <Typography variant="small" className="mt-2 font-normal text-blue-gray-600">
            Kênh đang hiển thị
          </Typography>
        </Card>

        <Card className="border border-blue-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <Typography className="mb-1 font-semibold text-blue-gray-500">
                Tổng chi phí (tháng)
              </Typography>
              <Typography variant="h4" color="blue-gray" className="font-bold">
                {new Intl.NumberFormat("vi-VN", { notation: "compact", compactDisplay: "short" }).format(stats.totalCost)}
              </Typography>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-500">
              <BanknotesIcon className="h-6 w-6" />
            </div>
          </div>
          <Typography variant="small" className="mt-2 font-normal text-blue-gray-600">
            {VND.format(stats.totalCost)}
          </Typography>
        </Card>

        <Card className="border border-blue-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Typography className="mb-1 font-semibold text-blue-gray-500">
              Tỷ lệ theo Nhà cung cấp
            </Typography>
            <ChartBarIcon className="h-4 w-4 text-blue-gray-300" />
          </div>
          <div className="flex flex-col gap-2">
            {stats.providerData.map((p) => (
              <div key={p.name} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-blue-gray-700">{p.name}</span>
                  <span className="text-blue-gray-500">{p.count} ({p.percent.toFixed(0)}%)</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-blue-gray-50">
                  <div
                    className="h-1.5 rounded-full bg-blue-500"
                    style={{ width: `${p.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border border-blue-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Typography className="mb-1 font-semibold text-blue-gray-500">
              Tỷ lệ Băng thông
            </Typography>
            <ChartBarIcon className="h-4 w-4 text-blue-gray-300" />
          </div>
          <div className="flex items-end gap-2 h-24 mt-2">
            {stats.bandwidthData.slice(0, 5).map((b, i) => (
              <div key={b.name} className="flex flex-col justify-end items-center flex-1 h-full group relative">
                <div
                  className="w-full rounded-t-sm transition-all duration-500 relative hover:opacity-80"
                  style={{
                    height: `${Math.max(b.percent, 10)}%`,
                    backgroundColor: pieColors[i % pieColors.length],
                  }}
                >
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-gray-600">
                    {b.count}
                  </span>
                </div>
                <span className="text-[10px] text-blue-gray-500 truncate w-full text-center mt-1 font-medium" title={b.name}>
                  {b.name}
                </span>
              </div>
            ))}
            {stats.bandwidthData.length === 0 && (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm mb-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4 text-blue-gray-700">
          <FunnelIcon className="h-5 w-5" />
          <span className="font-bold text-sm uppercase tracking-wider">Bộ lọc tìm kiếm</span>
          {(filters.search || filters.site || filters.transmissionOwner || filters.leaseLineConnectType || filters.status) && (
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
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Site ID</span>
            <Select
              isClearable
              placeholder="Tất cả Site"
              className="text-sm"
              options={simpleSiteList.map(s => ({ value: s.id, label: s.siteId }))}
              value={filters.site}
              onChange={(val) => setFilters((prev) => ({ ...prev, site: val }))}
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({ ...base, minHeight: "40px", borderRadius: "8px", borderColor: "#e2e8f0" }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Nhà cung cấp</span>
            <Select
              isClearable
              placeholder="Tất cả NCC"
              className="text-sm"
              options={transmissionOwnerList.map(o => ({ value: o.id, label: o.name }))}
              value={filters.transmissionOwner}
              onChange={(val) => setFilters((prev) => ({ ...prev, transmissionOwner: val }))}
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({ ...base, minHeight: "40px", borderRadius: "8px", borderColor: "#e2e8f0" }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Loại kênh</span>
            <Select
              isClearable
              placeholder="Tất cả loại"
              className="text-sm"
              options={leaseLineConnectTypeList.map(t => ({ value: t.id, label: t.name }))}
              value={filters.leaseLineConnectType}
              onChange={(val) => setFilters((prev) => ({ ...prev, leaseLineConnectType: val }))}
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({ ...base, minHeight: "40px", borderRadius: "8px", borderColor: "#e2e8f0" }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Trạng thái</span>
            <Select
              isClearable
              placeholder="Tất cả trạng thái"
              className="text-sm"
              options={getLeaseLineStatusOptions().map(opt => ({ label: opt.label, value: opt.value }))}
              value={filters.status}
              onChange={(val) => setFilters((prev) => ({ ...prev, status: val }))}
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({ ...base, minHeight: "40px", borderRadius: "8px", borderColor: "#e2e8f0" }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Tìm kiếm nhanh</span>
            <Input
              icon={<MagnifyingGlassIcon className="h-4 w-4" />}
              placeholder="Site ID, Ghi chú..."
              className="!border-t-blue-gray-200 focus:!border-blue-500 rounded-lg text-sm"
              labelProps={{ className: "before:content-none after:content-none" }}
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              containerProps={{ className: "min-w-0" }}
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
                {["STT", "Tỉnh", "Site ID", "Nhà cung cấp", "Số lượng", "Băng thông", "Đơn giá", "Loại kênh", "Trạng thái", "Ghi chú", "Tác động"].map((head) => (
                  <th key={head} className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-bold leading-none">
                      {head}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedLeaselines.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {item.site?.province?.name}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-bold">
                      {item.site?.siteId}
                    </Typography>
                  </td>
                  <td className="p-4">
                    {item.transmissionOwner?.name && <OwnerChip name={item.transmissionOwner.name} className="inline-block" />}
                  </td>
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {item.quantity}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {item.speed} Mbps
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {VND.format(item.cost)}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {item.leaseLineConnectType?.name}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <StatusBadge 
                      status={item.status} 
                      labels={LeaseLineStatusLabels} 
                      colors={LeaseLineStatusColors} 
                    />
                  </td>
                  <td className="p-4 max-w-xs truncate">
                    <Typography variant="small" color="blue-gray" className="font-normal italic opacity-70">
                      {item.note}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1">
                      <IconButton variant="text" size="sm" color="blue-gray" onClick={() => handleEdit(item.id)}>
                        <PencilIcon className="h-4 w-4" />
                      </IconButton>
                      <IconButton variant="text" size="sm" color="red" onClick={() => handleDeleteLeaseline(item.id)}>
                        <TrashIcon className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLeaselines.length === 0 && (
            <div className="py-20 text-center">
              <Typography variant="h6" color="blue-gray" className="opacity-40">
                Không tìm thấy kênh thuê nào khớp với bộ lọc
              </Typography>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <Typography variant="small" color="blue-gray" className="font-normal">
              Trang <span className="font-bold">{currentPage}</span> / <span className="font-bold">{totalPages || 1}</span>
            </Typography>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
              <span className="text-xs text-blue-gray-400 font-medium">Hiển thị:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs border border-gray-300 rounded px-1 py-0.5 outline-none focus:border-blue-500 transition-colors"
              >
                {[5, 10, 15, 20, 50, 100].map((val) => (
                  <option key={val} value={val}>{val} dòng</option>
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
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
        className="overflow-hidden"
        size="sm"
      >
        <div className="max-h-[90vh] overflow-y-auto p-3">
          <DialogHeader className="relative m-0 block">
            <Typography variant="h4" color="blue">
              Thêm mới kênh thuê
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

          <Formik
            onSubmit={handleCreate}
            initialValues={{
              speed: 0,
              cost: 0,
              quantity: 1,
              site: { id: null },
              leaseLineConnectType: { id: 1 },
              transmissionOwner: { id: 1 },
              status: LeaseLineStatus.OPERATING,
              note: "",
            }}
            validationSchema={Yup.object({
              speed: Yup.string().required("Yêu cầu nhập tốc độ"),
              cost: Yup.number().required("Yêu cầu nhập đơn giá"),
              quantity: Yup.number().required("Yêu cầu nhập số lượng"),
              site: Yup.object({
                id: Yup.string().required("Yêu cầu nhập site ID"),
              }),
            })}
          >
            {({ setFieldValue, getFieldProps, values, setErrors }) => (
              <Form className="flex flex-initial flex-shrink flex-col">
                <DialogBody className="space-y-4 pb-6">
                  <Card className="shadow-none">
                    <div className="grid grid-cols-12 gap-3 p-2">
                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Site ID
                        </label>
                        <Select
                          placeholder="Site ID"
                          value={simpleSiteList.find(o => o.id === values.site.id) || null}
                          onChange={(opt) => {
                            setFieldValue("site.id", opt?.id || null);
                          }}
                          classNames={{
                            control: (state) =>
                              state.isFocused
                                ? "border-blue-500"
                                : "border-grey-300",
                          }}
                          components={{ MenuList: CustomMenuList }}
                          isSearchable={true}
                          options={simpleSiteList}
                          getOptionLabel={(option) => option.siteId}
                          getOptionValue={(option) => option.id}
                          isLoading={false}
                          loadingMessage={() => "Đang lấy thông tin trạm..."}
                          noOptionsMessage={() => "Site ID không tìm thấy"}
                        />
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="site.id"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Băng thông (Mbps)
                        </label>

                        <Field
                          name="speed"
                          type="number"
                          placeholder="Nhập băng thông (Mbps)"
                          className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        ></Field>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="speed"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      {/* Đơn giá */}
                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Đơn giá (VND)
                        </label>

                        <Field
                          name="cost"
                          type="number"
                          placeholder="Nhập đơn giá thuê (VNĐ)"
                          className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        ></Field>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="cost"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      {/* Số lượng */}
                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Số lượng
                        </label>

                        <Field
                          name="quantity"
                          type="number"
                          placeholder="Nhập số lượng"
                          className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        ></Field>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="quantity"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      {/* Loại kênh thuê */}
                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Loại kênh thuê
                        </label>
                        <Field
                          className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          as="select"
                          name="leaseLineConnectType.id"
                        >
                          {leaseLineConnectTypeList.map(
                            (leaselineConnectType) => {
                              return (
                                <option
                                  key={leaselineConnectType.id}
                                  value={leaselineConnectType.id}
                                >
                                  {leaselineConnectType.name}
                                </option>
                              );
                            }
                          )}
                        </Field>
                      </div>

                      {/* Nhà cung cấp */}
                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Nhà cung cấp
                        </label>
                        <Field
                          className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          as="select"
                          name="transmissionOwner.id"
                        >
                          {transmissionOwnerList.map((transmissionOwner) => {
                            return (
                              <option
                                key={transmissionOwner.id}
                                value={transmissionOwner.id}
                              >
                                {transmissionOwner.name}
                              </option>
                            );
                          })}
                        </Field>
                    </div>

                    {/* Trạng thái */}
                    <div className="col-span-full flex flex-col items-stretch gap-2">
                      <label className="text-slate-400 font-semibold">
                        Trạng thái
                      </label>
                      <Field
                        className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        as="select"
                        name="status"
                      >
                        {getLeaseLineStatusOptions().map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Field>
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
                </DialogBody>
                <DialogFooter>
                  <Button size="md" type="submit" color="red">
                    Thêm mới
                  </Button>
                </DialogFooter>
              </Form>
            )}
            {/* <img src={MySvg} alt="" className="flex-initial p-5" /> */}
          </Formik>
        </div>
      </Dialog>

      {/* Modal Sửa thông tin */}
      <Dialog
        open={openEdit}
        handler={handleOpenEdit}
        className="overflow-hidden"
        size="sm"
      >
        <div className="max-h-[90vh] overflow-y-auto p-3">
          <DialogHeader className="relative m-0 block">
            <Typography variant="h4" color="blue">
              Cập nhật thông tin kênh thuê
            </Typography>
            <Typography className="mt-1 font-normal text-gray-700">
              Cập nhật dữ liệu kênh thuê đảm bảo thực tế
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
            onSubmit={handleEditSubmit}
            initialValues={{
              ...editLeaseline,
            }}
            validationSchema={Yup.object({
              speed: Yup.string().required("Yêu cầu nhập tốc độ"),
              cost: Yup.number().required("Yêu cầu nhập đơn giá"),
              quantity: Yup.number().required("Yêu cầu nhập số lượng"),
              site: Yup.object({
                id: Yup.string().required("Yêu cầu nhập site ID"),
              }),
            })}
          >
            {({ setFieldValue, getFieldProps, values, setErrors }) => (
              <Form className="flex flex-initial flex-shrink flex-col">
                <DialogBody className="space-y-4 pb-6">
                  <Card className="shadow-none">
                    <div className="grid grid-cols-12 gap-3 p-2">
                    <div className="col-span-full flex flex-col gap-2">
                      <label className="text-slate-400 font-semibold">
                        Trạng thái
                      </label>
                      <Field
                        className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        as="select"
                        name="status"
                      >
                        {getLeaseLineStatusOptions().map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Field>
                    </div>

                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Site ID
                        </label>
                        <Select
                          placeholder="Site ID"
                          value={simpleSiteList.find(o => o.id === values.site?.id) || null}
                          onChange={(opt) => {
                            setFieldValue("site.id", opt?.id || null);
                          }}
                          classNames={{
                            control: (state) =>
                              state.isFocused
                                ? "border-blue-300"
                                : "border-grey-300",
                          }}
                          components={{ MenuList: CustomMenuList }}
                          isSearchable={true}
                          options={simpleSiteList}
                          getOptionLabel={(option) => option.siteId}
                          getOptionValue={(option) => option.id}
                          isLoading={false}
                          loadingMessage={() => "Đang lấy thông tin trạm..."}
                          noOptionsMessage={() => "Không có thông tin trạm"}
                        />
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="site.siteId"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Băng thông (Mbps)
                        </label>
                        <Field
                          name="speed"
                          type="number"
                          placeholder="Nhập băng thông (Mbps)"
                          className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        ></Field>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="speed"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      {/* Đơn giá */}
                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Đơn giá (VND)
                        </label>
                        <Field
                          name="cost"
                          type="number"
                          placeholder="Nhập đơn giá thuê (VNĐ)"
                          className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        ></Field>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="cost"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      {/* Số lượng */}
                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Số lượng
                        </label>
                        <Field
                          name="quantity"
                          type="number"
                          placeholder="Nhập số lượng"
                          className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        ></Field>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="quantity"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Loại kênh thuê
                        </label>
                        <Field
                          className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          as="select"
                          name="leaseLineConnectType.id"
                        >
                          {leaseLineConnectTypeList.map(
                            (leaselineConnectType) => {
                              return (
                                <option
                                  key={leaselineConnectType.id}
                                  value={leaselineConnectType.id}
                                >
                                  {leaselineConnectType.name}
                                </option>
                              );
                            }
                          )}
                        </Field>
                      </div>
                      {/* <p className="col-span-full text-2xl text-blue-600">Vị trí</p> */}
                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Nhà cung cấp
                        </label>
                        <Field
                          className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          as="select"
                          name="transmissionOwner.id"
                        >
                          {transmissionOwnerList.map((transmissionOwner) => {
                            return (
                              <option
                                key={transmissionOwner.id}
                                value={transmissionOwner.id}
                              >
                                {transmissionOwner.name}
                              </option>
                            );
                          })}
                        </Field>
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
                </DialogBody>
                <DialogFooter>
                  <Button size="md" type="submit" color="red">
                    Cập nhật dữ liệu
                  </Button>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </div>
      </Dialog>

      {/* Import Modal */}
      <Dialog open={importOpen} handler={handleOpenImport} size="lg" className="flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50 rounded-t-lg">
          <div>
            <Typography variant="h4" color="blue-gray" className="font-bold">
              Import Kênh thuê
            </Typography>
            <Typography variant="small" color="gray" className="font-normal mt-1">
              Tải lên file Excel để cập nhật dữ liệu hàng loạt
            </Typography>
          </div>
          <IconButton variant="text" color="blue-gray" onClick={handleOpenImport}>
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>

        <DialogBody className="overflow-y-auto p-4 flex-1">
          {/* File Selection Area */}
          <div className="mb-6 p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 text-center hover:bg-gray-50 transition-colors relative">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-blue-50 rounded-full">
                <CloudArrowUpIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-blue-600">Nhấn để tải lên</span> hoặc kéo thả file vào đây
                <br />
                <span className="text-xs text-gray-400">Hỗ trợ định dạng .xlsx, .xls</span>
              </div>
              <input
                type="file"
                accept=".xlsx, .xls"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
              />
            </div>
          </div>

          {excelFile && (
            <div className="mb-6 flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-blue-100">
                  <DocumentIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <Typography variant="small" color="blue-gray" className="font-bold">{excelFile.name}</Typography>
                  <Typography variant="small" className="text-blue-gray-500 text-xs">{(excelFile.size / 1024).toFixed(2)} KB</Typography>
                </div>
              </div>
              <IconButton variant="text" color="red" size="sm" onClick={() => setExcelFile(null)}><TrashIcon className="h-4 w-4" /></IconButton>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
             <Typography variant="small" className="text-gray-500">
                Chưa có file mẫu? <span className="text-blue-600 cursor-pointer hover:underline font-medium" onClick={handleDownloadTemplate}>Tải về tại đây</span>
             </Typography>
          </div>

          {excelChecked && excelSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <Typography variant="small" color="green" className="font-bold">Kiểm tra dữ liệu thành công!</Typography>
                <Typography variant="small" className="text-green-700">Đã tìm thấy <b>{excelRows.length}</b> dòng dữ liệu hợp lệ.</Typography>
              </div>
            </div>
          )}

          {excelChecked && !excelSuccess && Object.keys(excelErrors).length > 0 && (
            <div className="mb-4 border border-red-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center gap-2 text-red-700 font-medium">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span>Phát hiện lỗi trong file ({Object.keys(excelErrors).length} dòng)</span>
              </div>
              <div className="max-h-60 overflow-y-auto p-4">
                <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                  {Object.entries(excelErrors).map(([row, rowError]) => (
                    <li key={row}>
                      <span className="font-bold text-gray-700">Dòng {row}:</span> {rowError.errors?.map(e => e.message).join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="border-t border-gray-100 bg-gray-50 px-4 py-3 flex justify-end gap-2 rounded-b-lg">
          <Button variant="text" color="blue-gray" onClick={handleOpenImport} className="normal-case">Hủy bỏ</Button>
          {!excelSuccess ? (
            <CustomButton color="blue" onClick={handleCheckImport} disabled={!excelFile} className="flex items-center gap-2">
              <MagnifyingGlassIcon className="h-4 w-4" /> Kiểm tra dữ liệu
            </CustomButton>
          ) : (
            <CustomButton color="green" onClick={handleSaveImport} disabled={saving} className="flex items-center gap-2">
              {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ArrowDownTrayIcon className="h-4 w-4" />}
              {saving ? "Đang lưu..." : "Lưu vào hệ thống"}
            </CustomButton>
          )}
        </DialogFooter>
      </Dialog>

      {/*Modal confirm xóa site*/}
      <Dialog open={openDelete} handler={handleOpenDelete} size="md">
        <DialogHeader>Xác nhận xóa kênh thuê khỏi cơ sở dữ liệu</DialogHeader>
        <DialogBody>
          Bạn muốn xóa thông tin kênh thuê tại trạm{" "}
          <span>{deleteLeaselineName}</span> ?
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="green"
            onClick={handleOpenDelete}
            className="mr-1"
          >
            <span>Hủy</span>
          </Button>
          <Button variant="gradient" color="red" onClick={handleDeleteSubmit}>
            <span>Xóa</span>
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
export default LeaselineList;
