import React, { useState, useEffect } from "react";
import Select from "react-select";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  IconButton,
  Tooltip,
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineHeader,
  TimelineIcon,
  TimelineBody,
  Typography,
  Input,
  Chip,
} from "@material-tailwind/react";
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  EyeIcon,
  ClockIcon,
  CalendarDaysIcon,
  QueueListIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayIcon,
  ServerIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/solid";
import CustomButton from "../components/CustomButton";

const BackupDashboard = () => {
  const [summary, setSummary] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedRouter, setSelectedRouter] = useState(null);
  const [deviceBackups, setDeviceBackups] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [backupStatusFilter, setBackupStatusFilter] = useState("all");
  const [openExport, setOpenExport] = useState(false);
  const [selectedExportProvinces, setSelectedExportProvinces] = useState([]);
  const [availableProvinces, setAvailableProvinces] = useState([]);
  const [processing, setProcessing] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const axiosInstance = useAxiosPrivate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Gọi song song các API để lấy dữ liệu
      const [routersRes, summaryRes, historyRes] = await Promise.all([
        axiosInstance.get("/routers"),
        axiosInstance.get("/routers/backups/summary"),
        axiosInstance.get("/routers/backups/history"),
      ]);

      const allRouters = routersRes.data;
      const summaryData = summaryRes.data;
      const historyData = historyRes.data;

      // Merge router list with backup summary
      const summaryMap = new Map(
        summaryData.map((item) => [item.router_name, item]),
      );

      const mergedList = allRouters.map((router) => {
        const backupInfo = summaryMap.get(router.name);
        return {
          ...router,
          router_name: router.name,
          backup_count: backupInfo ? backupInfo.backup_count : 0,
          last_backup: backupInfo ? backupInfo.last_backup : "Chưa có",
          timestamp: backupInfo ? backupInfo.timestamp : 0,
        };
      });

      setSummary(mergedList);
      // Sắp xếp lịch sử theo thời gian mới nhất -> cũ nhất
      setHistory(historyData.sort((a, b) => b.timestamp - a.timestamp));

      // Extract unique provinces for export
      const provinces = [
        ...new Set(historyData.map((h) => h.province).filter((p) => p)),
      ].sort();
      setAvailableProvinces(provinces);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Chưa có";
    return new Date(timestamp * 1000).toLocaleString("vi-VN");
  };

  const handleBackup = async (routerName) => {
    setProcessing((prev) => ({ ...prev, [routerName]: true }));
    try {
      const response = await axiosInstance.post(
        `/routers/backups/trigger/${routerName}`,
      );
      const result = response.data;

      if (result.success) {
        toast.success(`Sao lưu thành công: ${routerName}`);
        fetchData(); // Refresh data
      } else {
        toast.error(
          `Lỗi sao lưu ${routerName}: ${result.message || "Lỗi không xác định"}`,
        );
      }
    } catch (error) {
      toast.error(`Lỗi kết nối khi sao lưu ${routerName}`);
    } finally {
      setProcessing((prev) => ({ ...prev, [routerName]: false }));
    }
  };

  const handleOpenDetail = async (routerName) => {
    setSelectedRouter(routerName);
    setOpenDetail(true);
    setLoadingDetail(true);
    setDeviceBackups([]); // Reset data cũ
    try {
      const response = await axiosInstance.get(
        `/routers/backups/files/${routerName}`,
      );
      setDeviceBackups(response.data);
    } catch (err) {
      console.error(err);
      // Có thể hiển thị thông báo lỗi nếu cần
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDownload = async (filename) => {
    try {
      const response = await axiosInstance.get(
        `/routers/backups/files/${selectedRouter}/${filename}`,
        { responseType: "blob" }
      );
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      alert("Lỗi tải file: " + error.message);
    }
  };

  const handleDownloadFromHistory = async (routerName, filename) => {
    try {
      const response = await axiosInstance.get(
        `/routers/backups/files/${routerName}/${filename}`,
        { responseType: "blob" }
      );
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      alert("Lỗi tải file: " + error.message);
    }
  };

  const handleExportProvinceChange = (selectedOptions) => {
    const selectedValues = selectedOptions
      ? selectedOptions.map((opt) => opt.value)
      : [];
    const prevSelected = selectedExportProvinces;
    const hasAll = selectedValues.includes("all");
    const prevHasAll = prevSelected.includes("all");

    let newSelected = [];

    if (!prevHasAll && hasAll) {
      newSelected = ["all"];
    } else if (prevHasAll && hasAll && selectedValues.length > 1) {
      newSelected = selectedValues.filter((v) => v !== "all");
    } else {
      newSelected = selectedValues;
    }
    setSelectedExportProvinces(newSelected);
  };

  const handleExport = async () => {
    if (selectedExportProvinces.length === 0) {
      alert("Vui lòng chọn ít nhất một khu vực.");
      return;
    }

    try {
      const response = await axiosInstance.post(
        `/routers/backups/export`,
        { provinces: selectedExportProvinces },
        { responseType: "blob" }
      );
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backups_export_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setOpenExport(false);
      setSelectedExportProvinces([]);
    } catch (error) {
      console.error(error);
      alert("Lỗi xuất dữ liệu: " + error.message);
    }
  };

  const filteredSummary = summary.filter((item) => {
    const matchName = item.router_name
      .toLowerCase()
      .includes(filterName.toLowerCase());

    let matchStatus = true;
    if (backupStatusFilter === "backed_up") {
      matchStatus = item.backup_count > 0;
    } else if (backupStatusFilter === "not_backed_up") {
      matchStatus = item.backup_count === 0;
    }

    let matchDate = true;
    if (dateRange.start) {
      const start = new Date(dateRange.start).setHours(0, 0, 0, 0) / 1000;
      matchDate = matchDate && item.timestamp >= start;
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end).setHours(23, 59, 59, 999) / 1000;
      matchDate = matchDate && item.timestamp <= end;
    }
    return matchName && matchDate && matchStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filterName, dateRange, backupStatusFilter]);

  const totalPages = Math.ceil(filteredSummary.length / itemsPerPage);
  const paginatedSummary = filteredSummary.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const filteredHistory = history;

  const totalRouters = summary.length;
  const backedUpCount = summary.filter((i) => i.backup_count > 0).length;
  const notBackedUpCount = totalRouters - backedUpCount;
  const totalFiles = summary.reduce((acc, curr) => acc + curr.backup_count, 0);

  const provinceOptions = [
    { value: "all", label: "Tất cả" },
    ...availableProvinces.map((p) => ({ value: p, label: p })),
  ];

  const backupStatusOptions = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "backed_up", label: "Đã sao lưu" },
    { value: "not_backed_up", label: "Chưa sao lưu" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Quản Lý cấu hình thiết bị
        </h1>
        <div className="flex gap-2">
          <CustomButton
            onClick={() => setOpenExport(true)}
            className="flex items-center gap-2"
            size="sm"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Xuất dữ liệu
          </CustomButton>
          <CustomButton
            onClick={fetchData}
            className="flex items-center gap-2"
            size="sm"
            color="blue-gray"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Làm mới
          </CustomButton>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Lỗi:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="p-3 rounded-full bg-blue-50 text-blue-500 mr-4">
            <ServerIcon className="h-8 w-8" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold">Tổng thiết bị</p>
            <p className="text-2xl font-bold text-gray-800">{totalRouters}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="p-3 rounded-full bg-green-50 text-green-500 mr-4">
            <CheckCircleIcon className="h-8 w-8" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold">Đã sao lưu</p>
            <p className="text-2xl font-bold text-gray-800">{backedUpCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="p-3 rounded-full bg-orange-50 text-orange-500 mr-4">
            <ExclamationTriangleIcon className="h-8 w-8" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold">Chưa sao lưu</p>
            <p className="text-2xl font-bold text-gray-800">{notBackedUpCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="p-3 rounded-full bg-purple-50 text-purple-500 mr-4">
            <ArchiveBoxIcon className="h-8 w-8" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold">Tổng file cấu hình</p>
            <p className="text-2xl font-bold text-gray-800">{totalFiles}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 items-end">
        <div className="w-full md:w-72">
          <Input
            label="Tìm kiếm thiết bị"
            icon={<MagnifyingGlassIcon className="h-5 w-5" />}
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Select
            value={backupStatusOptions.find(
              (opt) => opt.value === backupStatusFilter,
            )}
            onChange={(option) => setBackupStatusFilter(option.value)}
            options={backupStatusOptions}
            placeholder="Trạng thái"
            className="text-sm"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Input
            type="date"
            label="Từ ngày"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange({ ...dateRange, start: e.target.value })
            }
            containerProps={{ className: "min-w-[150px]" }}
          />
          <span className="text-gray-500">-</span>
          <Input
            type="date"
            label="Đến ngày"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange({ ...dateRange, end: e.target.value })
            }
            containerProps={{ className: "min-w-[150px]" }}
          />
        </div>
        <CustomButton
          variant="text"
          color="blue-gray"
          size="sm"
          onClick={() => {
            setFilterName("");
            setDateRange({ start: "", end: "" });
            setBackupStatusFilter("all");
          }}
        >
          Xóa lọc
        </CustomButton>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">
          Đang tải dữ liệu...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột 1: Thống kê theo thiết bị (Chiếm 2 phần) */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-700 flex">
                <QueueListIcon className="h-5 w-5 mr-2" />
                Quản lý cấu hình thiết bị
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tên thiết bị
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Phiên bản phần mềm
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Số lượng file
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Lần sao lưu cuối
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Sao lưu
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tác động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSummary.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-4 text-gray-500"
                      >
                        Chưa có dữ liệu sao lưu nào.
                      </td>
                    </tr>
                  ) : (
                    paginatedSummary.map((item) => (
                      <tr key={item.router_name} className="hover:bg-gray-50">
                        <td className="px-5 py-4 border-b border-gray-200 text-sm font-medium text-gray-900">
                          {item.router_name}
                        </td>
                        <td className="px-5 py-4 border-b border-gray-200 text-sm font-medium text-gray-900">
                          Mock data
                        </td>

                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-center">
                          <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-xs font-bold">
                            {item.backup_count}
                          </span>
                        </td>
                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-600">
                          {item.last_backup || "Chưa bao giờ"}
                        </td>
                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-center">
                          <CustomButton
                            size="sm"
                            color={
                              processing[item.router_name] ? "gray" : "teal"
                            }
                            onClick={() => handleBackup(item.router_name)}
                            disabled={processing[item.router_name]}
                            className="flex items-center gap-2 justify-center whitespace-nowrap mx-auto"
                          >
                            {processing[item.router_name] ? (
                              <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <PlayIcon className="h-4 w-4" />
                            )}
                            {processing[item.router_name]
                              ? "Đang sao lưu..."
                              : "Sao lưu"}
                          </CustomButton>
                        </td>
                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-center">
                          {item.backup_count > 0 && (
                            <Tooltip content="Xem chi tiết & Tải xuống">
                              <IconButton
                                variant="text"
                                color="blue"
                                onClick={() =>
                                  handleOpenDetail(item.router_name)
                                }
                              >
                                <EyeIcon className="h-5 w-5" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="px-5 py-3 bg-white border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-600">
                Hiển thị{" "}
                <strong>
                  {filteredSummary.length > 0
                    ? (currentPage - 1) * itemsPerPage + 1
                    : 0}
                </strong>{" "}
                đến{" "}
                <strong>
                  {Math.min(currentPage * itemsPerPage, filteredSummary.length)}
                </strong>{" "}
                trong số <strong>{filteredSummary.length}</strong> kết quả
              </span>
              <div className="flex gap-2">
                <CustomButton
                  size="sm"
                  variant="text"
                  color="blue-gray"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                >
                  Trước
                </CustomButton>
                <CustomButton
                  size="sm"
                  variant="text"
                  color="blue-gray"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                >
                  Sau
                </CustomButton>
              </div>
            </div>
          </div>

          {/* Cột 2: Lịch sử hoạt động gần đây (Chiếm 1 phần) */}
          <div className="bg-white rounded-lg shadow overflow-hidden h-fit">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-700 flex">
                <CalendarDaysIcon className="h-5 w-5 mr-2" />
                Hoạt động gần đây
              </h2>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredHistory.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-4">
                  Chưa có lịch sử sao lưu.
                </div>
              ) : (
                <Timeline>
                  {filteredHistory.slice(0, 15).map((log, index) => {
                    const isLast =
                      index === filteredHistory.slice(0, 15).length - 1;
                    const isSuccess =
                      log.success !== false && log.status !== "failed";

                    return (
                      <TimelineItem key={index}>
                        {!isLast && <TimelineConnector />}
                        <TimelineHeader className="items-center">
                          <TimelineIcon
                            className={`p-2 ${isSuccess ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500"}`}
                          >
                            {isSuccess ? (
                              <CheckCircleIcon className="h-4 w-4" />
                            ) : (
                              <ExclamationTriangleIcon className="h-4 w-4" />
                            )}
                          </TimelineIcon>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Typography
                                variant="h6"
                                color="blue-gray"
                                className="text-sm font-bold"
                              >
                                {log.router_name}
                              </Typography>
                              <Chip
                                size="sm"
                                variant="ghost"
                                value={isSuccess ? "Thành công" : "Thất bại"}
                                color={isSuccess ? "green" : "red"}
                                className="rounded-full px-2 py-0.5 text-[10px]"
                              />
                              {isSuccess && (
                                <Tooltip
                                  content="Tải file cấu hình"
                                  className="ml-auto"
                                >
                                  <IconButton
                                    variant="text"
                                    color="blue-gray"
                                    size="sm"
                                    onClick={() =>
                                      handleDownloadFromHistory(
                                        log.router_name,
                                        log.filename,
                                      )
                                    }
                                  >
                                    <ArrowDownTrayIcon className="h-5 w-5" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </div>
                            <Typography
                              variant="small"
                              color="gray"
                              className="text-xs font-normal"
                            >
                              {formatDate(log.timestamp)}
                            </Typography>
                          </div>
                        </TimelineHeader>
                        <TimelineBody className="pb-8 -mt-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <Typography
                                color="gray"
                                className="font-normal text-xs"
                              >
                                Người thực hiện:{" "}
                                <span className="font-semibold text-blue-600">
                                  {log.username || "system"}
                                </span>
                              </Typography>
                              {!isSuccess && log.message && (
                                <Typography
                                  color="red"
                                  className="font-normal text-xs mt-1 break-words max-w-[200px]"
                                >
                                  Lỗi: {log.message}
                                </Typography>
                              )}
                              <div className="mt-2">
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                                  {log.province || "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TimelineBody>
                      </TimelineItem>
                    );
                  })}
                </Timeline>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Backup */}
      <Dialog
        open={openDetail}
        handler={() => setOpenDetail(!openDetail)}
        size="lg"
      >
        <DialogHeader className="justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            Lịch sử sao lưu:{" "}
            <span className="text-blue-600">{selectedRouter}</span>
          </div>
          <IconButton
            color="blue-gray"
            size="sm"
            variant="text"
            onClick={() => setOpenDetail(false)}
          >
            <XMarkIcon strokeWidth={2.5} className="h-5 w-5" />
          </IconButton>
        </DialogHeader>
        <DialogBody className="overflow-y-auto max-h-[60vh] p-0">
          {loadingDetail ? (
            <div className="text-center py-10">Đang tải danh sách...</div>
          ) : deviceBackups.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              Không có file cấu hình nào.
            </div>
          ) : (
            <table className="w-full min-w-max table-auto text-left">
              <thead>
                <tr>
                  <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4 text-sm text-blue-gray-900">
                    Tên file
                  </th>
                  <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4 text-sm text-blue-gray-900">
                    Ngày tạo
                  </th>
                  <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4 text-sm text-blue-gray-900">
                    Kích thước
                  </th>
                  <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4 text-sm text-blue-gray-900 text-center">
                    Tải xuống
                  </th>
                </tr>
              </thead>
              <tbody>
                {deviceBackups.map((file, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-4 border-b border-blue-gray-50 text-sm font-medium text-gray-900">
                      {file.filename}
                    </td>
                    <td className="p-4 border-b border-blue-gray-50 text-sm text-gray-600">
                      {file.created_at}
                    </td>
                    <td className="p-4 border-b border-blue-gray-50 text-sm text-gray-600">
                      {(file.size_bytes / 1024).toFixed(2)} KB
                    </td>
                    <td className="p-4 border-b border-blue-gray-50 text-center">
                      <IconButton
                        variant="text"
                        color="green"
                        onClick={() => handleDownload(file.filename)}
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DialogBody>
        <DialogFooter>
          <CustomButton
            variant="filled"
            color="blue-gray"
            size="sm"
            onClick={() => setOpenDetail(false)}
          >
            Đóng
          </CustomButton>
        </DialogFooter>
      </Dialog>

      {/* Modal Export */}
      <Dialog
        open={openExport}
        handler={() => setOpenExport(!openExport)}
        size="sm"
      >
        <DialogHeader>Xuất dữ liệu cấu hình</DialogHeader>
        <DialogBody divider className="max-h-[60vh] overflow-y-auto">
          <Typography className="mb-2 font-normal text-gray-600">
            Chọn các tỉnh/thành phố muốn tải xuống file cấu hình:
          </Typography>
          <Select
            isMulti
            value={provinceOptions.filter((opt) =>
              selectedExportProvinces.includes(opt.value),
            )}
            onChange={handleExportProvinceChange}
            options={provinceOptions}
            placeholder="Chọn khu vực..."
            className="basic-multi-select"
            classNamePrefix="select"
            menuPortalTarget={document.body}
            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
          />
        </DialogBody>
        <DialogFooter>
          <CustomButton
            variant="text"
            color="gray"
            onClick={() => setOpenExport(false)}
            className="mr-1"
            size="sm"
          >
            Hủy
          </CustomButton>
          <CustomButton
            variant="filled"
            color="green"
            onClick={handleExport}
            size="sm"
          >
            Tải xuống
          </CustomButton>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default BackupDashboard;
