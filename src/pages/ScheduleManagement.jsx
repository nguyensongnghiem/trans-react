import React, { useState, useEffect, useRef } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import ReactSelect from "react-select";
import {
  Typography,
  Chip,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  IconButton,
  Switch,
  Checkbox,
  List,
  ListItem,
  ListItemPrefix,
  Tooltip,
  Progress,
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineHeader,
  TimelineIcon,
  TimelineBody,
} from "@material-tailwind/react";
import CustomButton from "../components/CustomButton";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ClockIcon,
  PlayIcon,
  StopIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/solid";

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState([]);
  const [availableRegions, setAvailableRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [globalHistory, setGlobalHistory] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [currentScheduleId, setCurrentScheduleId] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    is_active: true,
    time: "02:00",
    frequency: "daily",
    regions: ["all"],
    week_day: "mon",
    month_day: 1,
  });

  const [activeTasks, setActiveTasks] = useState({});
  const [viewLogTaskId, setViewLogTaskId] = useState(null);
  // Sử dụng ref để truy cập giá trị mới nhất trong setTimeout/interval
  const viewLogTaskIdRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const weekDayMap = {
    mon: "Thứ 2",
    tue: "Thứ 3",
    wed: "Thứ 4",
    thu: "Thứ 5",
    fri: "Thứ 6",
    sat: "Thứ 7",
    sun: "Chủ nhật",
  };

  const frequencyOptions = [
    { value: "daily", label: "Hàng ngày" },
    { value: "weekly", label: "Hàng tuần" },
    { value: "monthly", label: "Hàng tháng" },
  ];

  const weekDayOptions = [
    { value: "mon", label: "Thứ 2" },
    { value: "tue", label: "Thứ 3" },
    { value: "wed", label: "Thứ 4" },
    { value: "thu", label: "Thứ 5" },
    { value: "fri", label: "Thứ 6" },
    { value: "sat", label: "Thứ 7" },
    { value: "sun", label: "Chủ nhật" },
  ];

  const regionOptions = [
    { value: "all", label: "Tất cả các tỉnh" },
    ...availableRegions.map((r) => ({ value: r.slug, label: r.name })),
  ];

  const axiosInstance = useAxiosPrivate();
  const resetFormData = () => {
    setFormData({
      id: null,
      name: "",
      is_active: true,
      time: "02:00",
      frequency: "daily",
      regions: ["all"],
      week_day: "mon",
      month_day: 1,
    });
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      // Giả định backend Java đã proxy request này tới service backup
      const response = await axiosInstance.get("/routers/backups/schedules");
      setSchedules(response.data);
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
      toast.error("Không thể tải danh sách lịch backup.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      // Giả định backend Java đã proxy request này tới service backup
      const response = await axiosInstance.get("/routers/backups/regions");
      setAvailableRegions(response.data);
    } catch (error) {
      console.error("Failed to fetch regions:", error);
      toast.error("Không thể tải danh sách khu vực (tỉnh).");
    }
  };

  const fetchRunningTasks = async () => {
    try {
      const res = await axiosInstance.get("/routers/backups/tasks/active");
      if (Array.isArray(res.data)) {
        const tasksMap = {};
        res.data.forEach((task) => {
          if (task.job_id) {
            tasksMap[task.job_id] = task;
          }
        });
        // Gộp với state hiện tại (nếu có) để không bị ghi đè
        setActiveTasks((prev) => ({ ...prev, ...tasksMap }));
      }
    } catch (error) {
      console.error("Failed to fetch running tasks:", error);
    }
  };

  const fetchGlobalHistory = async () => {
    try {
      const res = await axiosInstance.get("/routers/backups/schedules/history");
      setGlobalHistory(res.data);
    } catch (error) {
      console.error("Failed to fetch global history:", error);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchRegions();
    fetchRunningTasks();
    fetchGlobalHistory();
  }, []);

  // Cập nhật thời gian mỗi phút để tính toán lại countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Cập nhật ref mỗi khi state thay đổi
  useEffect(() => {
    viewLogTaskIdRef.current = viewLogTaskId;
  }, [viewLogTaskId]);

  const handleOpenDialog = (schedule = null) => {
    if (schedule) {
      setIsEdit(true);
      setCurrentScheduleId(schedule.id);
      setFormData({
        ...schedule,
        month_day: schedule.month_day || 1,
        week_day: schedule.week_day || "mon",
      });
    } else {
      setIsEdit(false);
      setCurrentScheduleId(null);
      resetFormData();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleDelete = (scheduleId) => {
    setDeleteId(scheduleId);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/routers/backups/schedules/${deleteId}`);
      toast.success("Xóa lịch backup thành công!");
      fetchSchedules(); // Tải lại danh sách
    } catch (error) {
      console.error("Failed to delete schedule:", error);
      toast.error("Lỗi khi xóa lịch backup.");
    } finally {
      setOpenDeleteDialog(false);
      setDeleteId(null);
    }
  };

  const handleToggleStatus = async (schedule) => {
    try {
      const updatedSchedule = { ...schedule, is_active: !schedule.is_active };
      await axiosInstance.put(
        `/routers/backups/schedules/${schedule.id}`,
        updatedSchedule,
      );
      setSchedules((prev) =>
        prev.map((s) => (s.id === schedule.id ? updatedSchedule : s)),
      );
      toast.success(
        `Đã ${updatedSchedule.is_active ? "kích hoạt" : "tạm dừng"} lịch backup.`,
      );
    } catch (error) {
      console.error("Failed to toggle status:", error);
      toast.error("Lỗi khi cập nhật trạng thái.");
    }
  };

  const handleViewHistory = async (scheduleId) => {
    setHistoryData([]);
    setOpenHistoryDialog(true);
    try {
      const res = await axiosInstance.get(`/routers/backups/schedules/${scheduleId}/history`);
      setHistoryData(res.data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      toast.error("Không thể tải lịch sử chạy.");
    }
  };

  const handleRunNow = async (schedule) => {
    try {
      const res = await axiosInstance.post(
        `/routers/backups/schedules/${schedule.id}/execute-track`,
      );
      if (res.data && res.data.task_id) {
        // Khởi tạo dữ liệu an toàn để tránh lỗi render
        setActiveTasks((prev) => ({
          ...prev,
          [schedule.id]: {
            task_id: res.data.task_id,
            processed: 0,
            total: 0,
            status: "running",
            current_device: "Đang khởi tạo...",
          },
        }));
        toast.info(`Đã bắt đầu backup: ${schedule.name}`);
      } else {
        toast.info(
          res.data?.message || "Không tìm thấy thiết bị nào để backup.",
        );
      }
    } catch (error) {
      console.error("Failed to execute schedule:", error);
      toast.error("Lỗi khi kích hoạt lịch.");
    }
  };

  const handleCancelTask = async (scheduleId) => {
    const task = activeTasks[scheduleId];
    if (!task?.task_id) return;
    try {
      await axiosInstance.post(`/routers/backups/tasks/${task.task_id}/cancel`);
      toast.info("Đang gửi yêu cầu hủy...");
      setActiveTasks((prev) => ({
        ...prev,
        [scheduleId]: { ...prev[scheduleId], status: "canceling" },
      }));
    } catch (error) {
      console.error("Failed to cancel task:", error);
      toast.error("Lỗi khi hủy tác vụ.");
    }
  };

  // Polling effect for progress
  useEffect(() => {
    let interval;
    const runningIds = Object.keys(activeTasks).filter((id) =>
      ["running", "canceling"].includes(activeTasks[id]?.status),
    );

    if (runningIds.length > 0) {
      interval = setInterval(async () => {
        const updates = {};
        let hasUpdates = false;

        await Promise.all(
          runningIds.map(async (id) => {
            try {
              const res = await axiosInstance.get(
                `/routers/backups/tasks/${activeTasks[id].task_id}`,
              );
              updates[id] = res.data;
              hasUpdates = true;
            } catch (err) {
              console.error("Polling error", err);
            }
          }),
        );

        if (hasUpdates) {
          setActiveTasks((prev) => {
            const newState = { ...prev };
            Object.keys(updates).forEach((id) => {
              // Nếu đang đợi hủy (canceling) mà API vẫn trả về running thì giữ nguyên trạng thái canceling
              if (
                prev[id]?.status === "canceling" &&
                updates[id].status === "running"
              ) {
                return;
              }
              newState[id] = { ...newState[id], ...updates[id] };
            });
            return newState;
          });

          // Tự động xóa task khỏi danh sách sau 3 giây nếu đã hoàn thành hoặc hủy
          Object.keys(updates).forEach((id) => {
            if (["completed", "canceled"].includes(updates[id].status)) {
              setTimeout(() => {
                fetchGlobalHistory(); // Refresh history when task completes
                setActiveTasks((prev) => {
                  // Nếu đang xem log của task này thì không xóa vội
                  if (viewLogTaskIdRef.current === id) return prev;

                  const newState = { ...prev };
                  // Kiểm tra lại trạng thái trước khi xóa để tránh lỗi
                  if (
                    newState[id] &&
                    ["completed", "canceled"].includes(newState[id].status)
                  ) {
                    delete newState[id];
                  }
                  return newState;
                });
              }, 3000);
            }
          });
        }
      }, 1000); // Poll mỗi 1 giây
    }
    return () => clearInterval(interval);
  }, [activeTasks]); // viewLogTaskId không cần ở đây vì đã dùng ref

  const handleCloseLogDialog = () => {
    const taskId = viewLogTaskId;
    setViewLogTaskId(null);

    // Nếu task đã xong khi đang xem log, xóa nó khỏi danh sách khi đóng dialog
    if (
      activeTasks[taskId] &&
      ["completed", "canceled"].includes(activeTasks[taskId].status)
    ) {
      const newTasks = { ...activeTasks };
      delete newTasks[taskId];
      setActiveTasks(newTasks);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.time) {
      toast.warn("Vui lòng điền tên và thời gian cho lịch backup.");
      return;
    }

    if (!formData.regions || formData.regions.length === 0) {
      toast.warn("Vui lòng chọn ít nhất một khu vực (Phạm vi Backup).");
      return;
    }

    const payload = { ...formData };
    payload.month_day = Number(payload.month_day);

    try {
      if (isEdit) {
        await axiosInstance.put(
          `/routers/backups/schedules/${currentScheduleId}`,
          payload,
        );
        toast.success("Cập nhật lịch backup thành công!");
      } else {
        await axiosInstance.post("/routers/backups/schedules", payload);
        toast.success("Tạo mới lịch backup thành công!");
      }
      fetchSchedules(); // Tải lại danh sách
      handleCloseDialog();
    } catch (error) {
      console.error("Failed to save schedule:", error);
      toast.error(
        "Lỗi: " +
          (error.response?.data?.detail || "Không thể lưu lịch backup."),
      );
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegionSelectChange = (selectedOptions) => {
    const selectedValues = selectedOptions
      ? selectedOptions.map((opt) => opt.value)
      : [];
    const prevRegions = formData.regions;
    const hasAll = selectedValues.includes("all");
    const prevHasAll = prevRegions.includes("all");

    let newRegions = [];

    if (!prevHasAll && hasAll) {
      // Nếu chưa có "all" mà giờ có -> Người dùng mới chọn "Tất cả" -> Xóa các cái khác
      newRegions = ["all"];
    } else if (prevHasAll && hasAll && selectedValues.length > 1) {
      // Nếu đang có "all" mà chọn thêm cái khác -> Bỏ "all", giữ cái mới
      newRegions = selectedValues.filter((v) => v !== "all");
    } else {
      // Trường hợp còn lại (bỏ chọn, hoặc chọn bình thường)
      newRegions = selectedValues;
    }

    setFormData((prev) => ({ ...prev, regions: newRegions }));
  };

  const getNextRunTime = (schedule) => {
    if (!schedule.is_active || !schedule.time) return null;

    const now = new Date();
    const [hours, minutes] = schedule.time.split(":").map(Number);
    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    if (schedule.frequency === "daily") {
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
    } else if (schedule.frequency === "weekly") {
      const weekDays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const targetDay = weekDays.indexOf(schedule.week_day); // 0-6
      const currentDay = now.getDay(); // 0-6

      let daysToAdd = (targetDay - currentDay + 7) % 7;
      if (daysToAdd === 0 && nextRun <= now) {
        daysToAdd = 7;
      }
      nextRun.setDate(nextRun.getDate() + daysToAdd);
    } else if (schedule.frequency === "monthly") {
      const targetDate = schedule.month_day;
      nextRun.setDate(targetDate);
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
    }
    return nextRun;
  };

  const getTimeRemaining = (schedule) => {
    const nextRun = getNextRunTime(schedule);
    if (!nextRun) return "";
    const diffMs = nextRun - new Date();
    if (diffMs <= 0) return "Sắp chạy...";
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    let result = "Còn ";
    if (days > 0) result += `${days} ngày `;
    if (hours > 0) result += `${hours} giờ `;
    if (days === 0 && hours === 0) result += `${minutes} phút `;
    return result.trim();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Typography
            variant="h4"
            color="blue-gray"
            className="font-bold tracking-tight"
          >
            Quản lý Lịch Backup
          </Typography>
          <Typography color="gray" className="mt-1 font-normal text-gray-600">
            Thiết lập và tự động hóa quy trình sao lưu cấu hình thiết bị.
          </Typography>
        </div>
        <CustomButton
          className="flex items-center gap-2"
          size="sm"
          onClick={() => handleOpenDialog()}
        >
          <PlusIcon strokeWidth={2} className="h-4 w-4" /> Thêm Lịch Mới
        </CustomButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Schedule List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-700 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                Danh sách Lịch Backup
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr>
                    {[
                      "Tên Lịch",
                      "Trạng thái",
                      "Thời gian",
                      "Tần suất",
                      "Khu vực",
                      "Tiến độ",
                      "Hành động",
                    ].map((head) => (
                      <th
                        key={head}
                        className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-5 py-5 text-center text-sm text-gray-500">
                        Đang tải...
                      </td>
                    </tr>
                  ) : (
                    schedules.map((schedule) => {
                      const isTaskRunning =
                        activeTasks[schedule.id] &&
                        ["running", "canceling"].includes(
                          activeTasks[schedule.id].status,
                        );

                      return (
                        <tr
                          key={schedule.id}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-5 py-4 border-b border-gray-200 text-sm">
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-bold"
                            >
                              {schedule.name}
                            </Typography>
                            <Typography variant="small" color="gray" className="text-[10px]">
                              {schedule.created_by || "system"}
                            </Typography>
                          </td>
                          <td className="px-5 py-4 border-b border-gray-200 text-sm text-center">
                            <Tooltip content="Nhấn để thay đổi trạng thái">
                              <div
                                className="inline-block cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleToggleStatus(schedule)}
                              >
                                <Chip
                                  size="sm"
                                  variant="ghost"
                                  value={
                                    schedule.is_active ? "Đang chạy" : "Tạm dừng"
                                  }
                                  color={schedule.is_active ? "teal" : "blue-gray"}
                                  className="rounded-md px-2 py-0.5 font-semibold normal-case text-[10px]"
                                />
                              </div>
                            </Tooltip>
                          </td>
                          <td className="px-5 py-4 border-b border-gray-200 text-sm">
                            <div className="flex items-center gap-2 text-gray-700 justify-center">
                              <ClockIcon className="h-4 w-4 text-gray-400" />
                              <Typography variant="small" className="font-medium">
                                {schedule.time}
                              </Typography>
                            </div>
                          </td>
                          <td className="px-5 py-4 border-b border-gray-200 text-sm text-center">
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-normal capitalize text-xs"
                            >
                              {schedule.frequency === "daily" && "Hàng ngày"}
                              {schedule.frequency === "weekly" &&
                                `Hàng tuần (${weekDayMap[schedule.week_day] || schedule.week_day})`}
                              {schedule.frequency === "monthly" &&
                                `Hàng tháng (Ngày ${schedule.month_day})`}
                            </Typography>
                            {schedule.is_active && (
                              <Typography
                                variant="small"
                                color="green"
                                className="text-[10px] font-bold mt-1"
                              >
                                ({getTimeRemaining(schedule)})
                              </Typography>
                            )}
                          </td>
                          <td className="px-5 py-4 border-b border-gray-200 text-sm">
                            <div className="flex flex-wrap gap-1 max-w-[150px] justify-center mx-auto">
                              {schedule.regions.includes("all") ? (
                                <Chip
                                  size="sm"
                                  value="Tất cả"
                                  color="blue-gray"
                                  className="rounded-md text-[10px] px-2 py-0.5"
                                />
                              ) : (
                                schedule.regions.slice(0, 2).map((r) => (
                                  <Chip
                                    key={r}
                                    size="sm"
                                    variant="outlined"
                                    value={r}
                                    className="rounded-md text-[10px] px-2 py-0.5"
                                  />
                                ))
                              )}
                              {schedule.regions.length > 2 && !schedule.regions.includes("all") && (
                                <span className="text-[10px] text-gray-500">+{schedule.regions.length - 2}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 border-b border-gray-200 text-sm">
                            {activeTasks[schedule.id] ? (
                              <div className="w-32 mx-auto">
                                <div className="flex justify-between mb-1">
                                  <Typography
                                    variant="small"
                                    className="text-[10px] font-normal text-blue-gray-600 truncate max-w-[80px]"
                                    title={activeTasks[schedule.id].current_device}
                                  >
                                    {activeTasks[schedule.id].current_device}
                                  </Typography>
                                  <Typography
                                    variant="small"
                                    className="text-[10px] font-normal text-blue-gray-600"
                                  >
                                    {activeTasks[schedule.id].processed}/
                                    {activeTasks[schedule.id].total}
                                  </Typography>
                                </div>
                                <div
                                  className="flex items-center gap-2 cursor-pointer"
                                  onClick={() =>
                                    setViewLogTaskId(
                                      activeTasks[schedule.id].task_id,
                                    )
                                  }
                                >
                                  <Tooltip content="Bấm để xem Log chi tiết">
                                    <Progress
                                      value={
                                        activeTasks[schedule.id].total > 0
                                          ? (activeTasks[schedule.id].processed /
                                              activeTasks[schedule.id].total) *
                                            100
                                          : 0
                                      }
                                      size="sm"
                                      color={
                                        activeTasks[schedule.id].status ===
                                        "completed"
                                          ? "teal"
                                          : activeTasks[schedule.id].status ===
                                              "canceled"
                                            ? "red"
                                            : "blue-gray"
                                      }
                                      className="rounded-md h-2"
                                      barProps={{ className: "rounded-md" }}
                                    />
                                  </Tooltip>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center">
                                <span className="text-gray-400 text-[10px] italic block">
                                  {schedule.last_run ? `Last: ${schedule.last_run.split(' ')[1]}` : "Chưa chạy"}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 border-b border-gray-200 text-sm">
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip content="Xem lịch sử">
                                <IconButton
                                  variant="text"
                                  color="blue"
                                  size="sm"
                                  onClick={() => handleViewHistory(schedule.id)}
                                >
                                  <ClipboardDocumentListIcon className="h-4 w-4" />
                                </IconButton>
                              </Tooltip>
                              {isTaskRunning ? (
                                <Tooltip content="Dừng chạy">
                                  <IconButton
                                    variant="text"
                                    color="red"
                                    size="sm"
                                    onClick={() => handleCancelTask(schedule.id)}
                                  >
                                    <StopIcon className="h-4 w-4" />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Tooltip content="Chạy ngay (Test)">
                                  <IconButton
                                    variant="text"
                                    color="teal"
                                    size="sm"
                                    onClick={() => handleRunNow(schedule)}
                                  >
                                    <PlayIcon className="h-4 w-4" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip content="Sửa">
                                <IconButton
                                  variant="text"
                                  size="sm"
                                  onClick={() => handleOpenDialog(schedule)}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip content="Xóa">
                                <IconButton
                                  variant="text"
                                  color="red"
                                  size="sm"
                                  disabled={isTaskRunning}
                                  className={
                                    isTaskRunning
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }
                                  onClick={() => handleDelete(schedule.id)}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </IconButton>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Global History */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 shadow-sm overflow-hidden rounded-lg h-fit">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-700 flex items-center">
                <CalendarDaysIcon className="h-5 w-5 mr-2" />
                Hoạt động gần đây
              </h2>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {globalHistory.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-4">
                  Chưa có lịch sử chạy.
                </div>
              ) : (
                <Timeline>
                  {globalHistory.map((item, index) => {
                    const isLast = index === globalHistory.length - 1;
                    const isSuccess = item.status === "completed";
                    const isRunning = item.status === "running";
                    
                    return (
                      <TimelineItem key={item.id}>
                        {!isLast && <TimelineConnector />}
                        <TimelineHeader className="items-center">
                          <TimelineIcon 
                            className={`p-2 ${isSuccess ? "bg-green-50 text-green-500" : isRunning ? "bg-blue-50 text-blue-500" : "bg-red-50 text-red-500"}`}
                          >
                            {isSuccess ? (
                              <CheckCircleIcon className="h-4 w-4" />
                            ) : isRunning ? (
                              <ClockIcon className="h-4 w-4 animate-pulse" />
                            ) : (
                              <ExclamationTriangleIcon className="h-4 w-4" />
                            )}
                          </TimelineIcon>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Typography variant="h6" color="blue-gray" className="text-sm font-bold">
                                {item.schedule_name}
                              </Typography>
                              <Chip
                                size="sm"
                                variant="ghost"
                                value={item.status === 'completed' ? 'Thành công' : item.status === 'running' ? 'Đang chạy' : 'Thất bại'}
                                color={isSuccess ? "green" : isRunning ? "blue" : "red"}
                                className="rounded-full px-2 py-0.5 text-[10px]"
                              />
                            </div>
                            <Typography variant="small" color="gray" className="text-xs font-normal">
                              {item.start_time_fmt}
                            </Typography>
                          </div>
                        </TimelineHeader>
                        <TimelineBody className="pb-8 -mt-2">
                          <Typography color="gray" className="font-normal text-xs">
                            Loại: <span className="font-semibold text-blue-600">{item.trigger_type === 'manual' ? 'Thủ công' : 'Tự động'}</span>
                          </Typography>
                          {item.details && (
                            <Typography color="gray" className="font-normal text-xs mt-1 break-words">
                              Chi tiết: {item.details}
                            </Typography>
                          )}
                        </TimelineBody>
                      </TimelineItem>
                    );
                  })}
                </Timeline>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={openDialog}
        handler={handleCloseDialog}
        size="md"
        className="rounded-lg"
      >
        <DialogHeader>
          {isEdit ? "Chỉnh sửa Lịch Backup" : "Tạo Lịch Backup Mới"}
        </DialogHeader>
        <DialogBody
          divider
          className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto p-6"
        >
          <div>
            <Typography
              variant="small"
              color="blue-gray"
              className="mb-2 font-medium"
            >
              Tên lịch
            </Typography>
            <Input
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              placeholder="VD: Backup Hàng Ngày"
              className="!border-t-blue-gray-200 focus:!border-t-gray-900 rounded-md"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
              containerProps={{ className: "rounded-md" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-2 font-medium"
              >
                Thời gian (HH:MM)
              </Typography>
              <Input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleFormChange}
                className="!border-t-blue-gray-200 focus:!border-t-gray-900 rounded-md"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
                containerProps={{ className: "rounded-md" }}
              />
            </div>
            <div>
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-2 font-medium"
              >
                Tần suất
              </Typography>
              <ReactSelect
                value={frequencyOptions.find(
                  (opt) => opt.value === formData.frequency,
                )}
                onChange={(option) =>
                  setFormData((prev) => ({ ...prev, frequency: option.value }))
                }
                options={frequencyOptions}
                placeholder="Chọn tần suất"
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
            </div>
          </div>

          {formData.frequency === "weekly" && (
            <div>
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-2 font-medium"
              >
                Chọn ngày trong tuần
              </Typography>
              <ReactSelect
                value={weekDayOptions.find(
                  (opt) => opt.value === formData.week_day,
                )}
                onChange={(option) =>
                  setFormData((prev) => ({ ...prev, week_day: option.value }))
                }
                options={weekDayOptions}
                placeholder="Chọn ngày"
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
            </div>
          )}
          {formData.frequency === "monthly" && (
            <div>
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-2 font-medium"
              >
                Ngày trong tháng (1-31)
              </Typography>
              <Input
                type="number"
                name="month_day"
                min="1"
                max="31"
                value={formData.month_day}
                onChange={handleFormChange}
                className="!border-t-blue-gray-200 focus:!border-t-gray-900 rounded-md"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
                containerProps={{ className: "rounded-md" }}
              />
            </div>
          )}

          <div className="flex items-center justify-between border p-3 rounded-lg bg-gray-50">
            <div>
              <Typography
                variant="small"
                color="blue-gray"
                className="font-medium"
              >
                Trạng thái hoạt động
              </Typography>
              <Typography variant="small" color="gray" className="font-normal">
                Bật/Tắt lịch backup tự động này
              </Typography>
            </div>
            <Switch
              checked={formData.is_active}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  is_active: e.target.checked,
                }))
              }
              color="teal"
            />
          </div>

          <div>
            <Typography
              variant="small"
              color="blue-gray"
              className="mb-2 font-medium"
            >
              Phạm vi Backup
            </Typography>
            <ReactSelect
              isMulti
              value={regionOptions.filter((opt) =>
                formData.regions.includes(opt.value),
              )}
              onChange={handleRegionSelectChange}
              options={regionOptions}
              placeholder="Chọn khu vực..."
              className="basic-multi-select"
              classNamePrefix="select"
              menuPortalTarget={document.body}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <CustomButton
            variant="text"
            onClick={handleCloseDialog}
            className="mr-1"
            color="gray"
          >
            <span>Hủy</span>
          </CustomButton>
          <CustomButton variant="filled" onClick={handleSubmit}>
            <span>{isEdit ? "Lưu thay đổi" : "Tạo mới"}</span>
          </CustomButton>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        handler={() => setOpenDeleteDialog(false)}
        size="sm"
        className="rounded-lg"
      >
        <DialogHeader>Xác nhận xóa</DialogHeader>
        <DialogBody>
          Bạn có chắc chắn muốn xóa lịch backup này không? Hành động này không
          thể hoàn tác.
        </DialogBody>
        <DialogFooter>
          <CustomButton
            variant="text"
            color="gray"
            onClick={() => setOpenDeleteDialog(false)}
            className="mr-1"
          >
            Hủy
          </CustomButton>
          <CustomButton variant="filled" color="red" onClick={confirmDelete}>
            Xóa
          </CustomButton>
        </DialogFooter>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={openHistoryDialog}
        handler={() => setOpenHistoryDialog(false)}
        size="lg"
        className="rounded-lg"
      >
        <DialogHeader>Lịch sử thực thi</DialogHeader>
        <DialogBody divider className="max-h-[60vh] overflow-y-auto p-0">
          <table className="w-full min-w-max table-auto text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 border-b border-gray-100 text-xs font-semibold text-gray-600">Thời gian bắt đầu</th>
                <th className="p-4 border-b border-gray-100 text-xs font-semibold text-gray-600">Thời gian kết thúc</th>
                <th className="p-4 border-b border-gray-100 text-xs font-semibold text-gray-600">Loại</th>
                <th className="p-4 border-b border-gray-100 text-xs font-semibold text-gray-600">Trạng thái</th>
                <th className="p-4 border-b border-gray-100 text-xs font-semibold text-gray-600">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {historyData.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center text-gray-500">Chưa có dữ liệu lịch sử.</td></tr>
              ) : (
                historyData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="p-4 text-sm text-gray-700">{item.start_time_fmt}</td>
                    <td className="p-4 text-sm text-gray-700">
                      {item.end_time_fmt} 
                      {item.duration && <span className="text-xs text-gray-400 ml-1">({item.duration})</span>}
                    </td>
                    <td className="p-4 text-sm text-gray-700 capitalize">{item.trigger_type === 'manual' ? 'Thủ công' : 'Tự động'}</td>
                    <td className="p-4">
                      <Chip
                        size="sm"
                        variant="ghost"
                        value={item.status}
                        color={item.status === 'completed' ? 'green' : item.status === 'failed' ? 'red' : item.status === 'canceled' ? 'orange' : 'blue'}
                        className="rounded-full px-2 py-0.5 text-[10px] capitalize"
                      />
                    </td>
                    <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={item.details}>{item.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DialogBody>
        <DialogFooter>
          <CustomButton variant="filled" onClick={() => setOpenHistoryDialog(false)}>
            Đóng
          </CustomButton>
        </DialogFooter>
      </Dialog>

      {/* Log Viewer Dialog */}
      <Dialog
        open={!!viewLogTaskId}
        handler={handleCloseLogDialog}
        size="lg"
        className="rounded-lg"
      >
        <DialogHeader className="flex items-center gap-3">
          <DocumentTextIcon className="h-6 w-6 text-blue-500" />
          Chi tiết Tiến trình Backup
        </DialogHeader>
        <DialogBody divider className="p-0">
          <div className="bg-gray-900 text-green-400 font-mono p-4 h-[60vh] overflow-y-auto text-sm rounded-b-lg">
            {viewLogTaskId &&
            activeTasks[
              Object.keys(activeTasks).find(
                (key) => activeTasks[key].task_id === viewLogTaskId,
              )
            ]?.logs?.length > 0 ? (
              activeTasks[
                Object.keys(activeTasks).find(
                  (key) => activeTasks[key].task_id === viewLogTaskId,
                )
              ].logs.map((log, index) => (
                <div
                  key={index}
                  className="mb-1 border-b border-gray-800 pb-1 last:border-0"
                >
                  {log}
                </div>
              ))
            ) : (
              <div className="text-gray-500 italic">Đang chờ log...</div>
            )}
            {/* Tự động cuộn xuống dưới cùng có thể thêm sau */}
          </div>
        </DialogBody>
        <DialogFooter>
          <CustomButton variant="filled" onClick={handleCloseLogDialog}>
            Đóng
          </CustomButton>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default ScheduleManagement;
