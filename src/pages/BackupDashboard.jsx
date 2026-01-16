import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
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
  Checkbox,
  List,
  ListItem,
  ListItemPrefix,
  Card,
} from "@material-tailwind/react";
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ClockIcon,
  CalendarDaysIcon,
  QueueListIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";

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
  const [openExport, setOpenExport] = useState(false);
  const [selectedExportProvinces, setSelectedExportProvinces] = useState([]);
  const [availableProvinces, setAvailableProvinces] = useState([]);

  const API_URL =
    import.meta.env.VITE_BE_API_URL || "http://localhost:8088/api";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Gọi song song 2 API để lấy dữ liệu
      const [summaryRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/routers/backups/summary`),
        fetch(`${API_URL}/routers/backups/history`),
      ]);

      if (!summaryRes.ok) {
        const errText = await summaryRes.text();
        throw new Error(`Lỗi Summary: ${errText || summaryRes.statusText}`);
      }
      if (!historyRes.ok) {
        const errText = await historyRes.text();
        throw new Error(`Lỗi History: ${errText || historyRes.statusText}`);
      }

      const summaryData = await summaryRes.json();
      const historyData = await historyRes.json();

      setSummary(summaryData);
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

  const handleOpenDetail = async (routerName) => {
    setSelectedRouter(routerName);
    setOpenDetail(true);
    setLoadingDetail(true);
    setDeviceBackups([]); // Reset data cũ
    try {
      const response = await fetch(
        `${API_URL}/routers/backups/files/${routerName}`
      );
      if (!response.ok) throw new Error("Failed to fetch backups");
      const data = await response.json();
      setDeviceBackups(data);
    } catch (err) {
      console.error(err);
      // Có thể hiển thị thông báo lỗi nếu cần
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDownload = async (filename) => {
    try {
      const response = await fetch(
        `${API_URL}/routers/backups/files/${selectedRouter}/${filename}`
      );
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
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
      const response = await fetch(
        `${API_URL}/routers/backups/files/${routerName}/${filename}`
      );
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
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

  const handleExport = async () => {
    if (selectedExportProvinces.length === 0) {
      alert("Vui lòng chọn ít nhất một khu vực.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/routers/backups/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provinces: selectedExportProvinces }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
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
    let matchDate = true;
    if (dateRange.start) {
      const start = new Date(dateRange.start).setHours(0, 0, 0, 0) / 1000;
      matchDate = matchDate && item.timestamp >= start;
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end).setHours(23, 59, 59, 999) / 1000;
      matchDate = matchDate && item.timestamp <= end;
    }
    return matchName && matchDate;
  });

  const filteredHistory = history.filter((log) => {
    const matchName = log.router_name
      .toLowerCase()
      .includes(filterName.toLowerCase());
    let matchDate = true;
    if (dateRange.start) {
      const start = new Date(dateRange.start).setHours(0, 0, 0, 0) / 1000;
      matchDate = matchDate && log.timestamp >= start;
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end).setHours(23, 59, 59, 999) / 1000;
      matchDate = matchDate && log.timestamp <= end;
    }
    return matchName && matchDate;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard Quản Lý Backup
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setOpenExport(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow transition duration-150 flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Xuất dữ liệu
          </button>
          <button
            onClick={fetchData}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow transition duration-150 flex items-center gap-2"
          >
            🔄 Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Lỗi:</strong> {error}
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end">
        <div className="w-full md:w-72">
          <Input
            label="Tìm kiếm thiết bị"
            icon={<MagnifyingGlassIcon className="h-5 w-5" />}
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
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
        <Button
          variant="text"
          color="blue-gray"
          onClick={() => {
            setFilterName("");
            setDateRange({ start: "", end: "" });
          }}
        >
          Xóa lọc
        </Button>
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
                Thống kê Backup Thiết bị
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tên Router
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Số lượng File
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Lần Backup Cuối
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSummary.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-4 text-gray-500"
                      >
                        Chưa có dữ liệu backup nào.
                      </td>
                    </tr>
                  ) : (
                    filteredSummary.map((item) => (
                      <tr key={item.router_name} className="hover:bg-gray-50">
                        <td className="px-5 py-4 border-b border-gray-200 text-sm font-medium text-gray-900">
                          {item.router_name}
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
                          {item.backup_count > 0 ? (
                            <span className="text-green-600 font-semibold">
                              ● Đã có
                            </span>
                          ) : (
                            <span className="text-red-500">● Trống</span>
                          )}
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
                  Chưa có lịch sử.
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
                              <Tooltip content="Tải file cấu hình" className="ml-auto">
                                <IconButton
                                  variant="text"
                                  color="blue-gray"
                                  size="sm"
                                  onClick={() =>
                                    handleDownloadFromHistory(
                                      log.router_name,
                                      log.filename
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
            Lịch sử Backup:{" "}
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
              Không có file backup nào.
            </div>
          ) : (
            <table className="w-full min-w-max table-auto text-left">
              <thead>
                <tr>
                  <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4 text-sm text-blue-gray-900">
                    Tên File
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
          <Button
            variant="gradient"
            color="blue"
            onClick={() => setOpenDetail(false)}
          >
            Đóng
          </Button>
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
          <Card className="w-full shadow-none border border-gray-200">
            <List className="p-0">
              <ListItem className="p-0">
                <label className="flex w-full cursor-pointer items-center px-3 py-2">
                  <ListItemPrefix className="mr-3">
                    <Checkbox
                      ripple={false}
                      className="hover:before:opacity-0"
                      checked={selectedExportProvinces.includes("all")}
                      onChange={() => {
                        if (selectedExportProvinces.includes("all")) {
                          setSelectedExportProvinces([]);
                        } else {
                          setSelectedExportProvinces(["all"]);
                        }
                      }}
                    />
                  </ListItemPrefix>
                  <Typography color="blue-gray" className="font-medium">
                    Tất cả
                  </Typography>
                </label>
              </ListItem>
              {availableProvinces.map((province) => (
                <ListItem key={province} className="p-0">
                  <label className="flex w-full cursor-pointer items-center px-3 py-2">
                    <ListItemPrefix className="mr-3">
                      <Checkbox
                        ripple={false}
                        className="hover:before:opacity-0"
                        checked={
                          selectedExportProvinces.includes("all") ||
                          selectedExportProvinces.includes(province)
                        }
                        disabled={selectedExportProvinces.includes("all")}
                        onChange={() => {
                          if (selectedExportProvinces.includes(province)) {
                            setSelectedExportProvinces(
                              selectedExportProvinces.filter(
                                (p) => p !== province
                              )
                            );
                          } else {
                            setSelectedExportProvinces([
                              ...selectedExportProvinces,
                              province,
                            ]);
                          }
                        }}
                      />
                    </ListItemPrefix>
                    <Typography color="blue-gray" className="font-medium">
                      {province}
                    </Typography>
                  </label>
                </ListItem>
              ))}
            </List>
          </Card>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={() => setOpenExport(false)}
            className="mr-1"
          >
            Hủy
          </Button>
          <Button variant="gradient" color="green" onClick={handleExport}>
            Tải xuống
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default BackupDashboard;
