import React, { useState, useEffect, useRef } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import {
  Typography,
  Button,
  Chip,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  IconButton,
  Switch,
  Select,
  Option,
  Checkbox,
  List,
  ListItem,
  ListItemPrefix,
  Tooltip,
  Progress,
} from "@material-tailwind/react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ClockIcon,
  PlayIcon,
  StopIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState([]);
  const [availableRegions, setAvailableRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
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

  useEffect(() => {
    fetchSchedules();
    fetchRegions();
    fetchRunningTasks();
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
        updatedSchedule
      );
      setSchedules((prev) =>
        prev.map((s) => (s.id === schedule.id ? updatedSchedule : s))
      );
      toast.success(
        `Đã ${updatedSchedule.is_active ? "kích hoạt" : "tạm dừng"} lịch backup.`
      );
    } catch (error) {
      console.error("Failed to toggle status:", error);
      toast.error("Lỗi khi cập nhật trạng thái.");
    }
  };

  const handleRunNow = async (schedule) => {
    try {
      const res = await axiosInstance.post(`/routers/backups/schedules/${schedule.id}/execute-track`);
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
        toast.info(res.data?.message || "Không tìm thấy thiết bị nào để backup.");
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
      ["running", "canceling"].includes(activeTasks[id]?.status)
    );

    if (runningIds.length > 0) {
      interval = setInterval(async () => {
        const updates = {};
        let hasUpdates = false;

        await Promise.all(
          runningIds.map(async (id) => {
            try {
              const res = await axiosInstance.get(
                `/routers/backups/tasks/${activeTasks[id].task_id}`
              );
              updates[id] = res.data;
              hasUpdates = true;
            } catch (err) {
              console.error("Polling error", err);
            }
          })
        );

        if (hasUpdates) {
          setActiveTasks((prev) => {
            const newState = { ...prev };
            Object.keys(updates).forEach((id) => {
              // Nếu đang đợi hủy (canceling) mà API vẫn trả về running thì giữ nguyên trạng thái canceling
              if (prev[id]?.status === "canceling" && updates[id].status === "running") {
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
                setActiveTasks((prev) => {
                  // Nếu đang xem log của task này thì không xóa vội
                  if (viewLogTaskIdRef.current === id) return prev;

                  const newState = { ...prev };
                  // Kiểm tra lại trạng thái trước khi xóa để tránh lỗi
                  if (newState[id] && ["completed", "canceled"].includes(newState[id].status)) {
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
    if (activeTasks[taskId] && ["completed", "canceled"].includes(activeTasks[taskId].status)) {
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

    const payload = { ...formData };
    payload.month_day = Number(payload.month_day);

    try {
      if (isEdit) {
        await axiosInstance.put(
          `/routers/backups/schedules/${currentScheduleId}`,
          payload
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
        "Lỗi: " + (error.response?.data?.detail || "Không thể lưu lịch backup.")
      );
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegionChange = (regionSlug) => {
    setFormData((prev) => {
      const isSelectAll = regionSlug === "all";
      const allRegionsSelected = prev.regions.includes("all");

      if (isSelectAll) {
        return { ...prev, regions: allRegionsSelected ? [] : ["all"] };
      }

      if (allRegionsSelected) {
        return { ...prev, regions: [regionSlug] };
      }

      const newRegions = prev.regions.includes(regionSlug)
        ? prev.regions.filter((r) => r !== regionSlug)
        : [...prev.regions, regionSlug];

      if (newRegions.length === availableRegions.length) {
        return { ...prev, regions: ["all"] };
      }

      return { ...prev, regions: newRegions };
    });
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
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    let result = "Còn ";
    if (days > 0) result += `${days} ngày `;
    if (hours > 0) result += `${hours} giờ `;
    if (days === 0 && hours === 0) result += `${minutes} phút `;
    return result.trim();
  };

  const isAllRegions = formData.regions.includes("all");

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
        <Button
          className="flex items-center gap-3 bg-blue-600 shadow-md hover:shadow-lg"
          size="md"
          onClick={() => handleOpenDialog()}
        >
          <PlusIcon strokeWidth={2} className="h-4 w-4" /> Thêm Lịch Mới
        </Button>
      </div>

      <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max table-auto text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "Tên Lịch",
                  "Người tạo",
                  "Trạng thái",
                  "Thời gian",
                  "Tần suất",
                  "Lần chạy cuối",
                  "Khu vực",
                  "Tiến độ",
                  "Hành động",
                ].map((head) => (
                  <th
                    key={head}
                    className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center"
                  >
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-bold leading-none opacity-70"
                    >
                      {head}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center">
                    Đang tải...
                  </td>
                </tr>
              ) : (
                schedules.map((schedule) => {
                  const isTaskRunning = activeTasks[schedule.id] && ["running", "canceling"].includes(activeTasks[schedule.id].status);
                  
                  return (
                  <tr
                    key={schedule.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-bold"
                      >
                        {schedule.name}
                      </Typography>
                    </td>
                    <td className="p-4 text-center">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal text-xs"
                      >
                        {schedule.created_by || "system"}
                      </Typography>
                    </td>
                    <td className="p-4 text-center">
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
                            color={schedule.is_active ? "green" : "blue-gray"}
                            className="rounded-full px-3 font-semibold ormal-case"
                          />
                        </div>
                      </Tooltip>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <ClockIcon className="h-4 w-4 text-gray-400" />
                        <Typography variant="small" className="font-medium">
                          {schedule.time}
                        </Typography>
                      </div>
                    </td>
                    <td className="p-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal capitalize"
                      >
                        {schedule.frequency === "daily" && "Hàng ngày"}
                        {schedule.frequency === "weekly" &&
                          `Hàng tuần (${weekDayMap[schedule.week_day] || schedule.week_day})`}
                        {schedule.frequency === "monthly" &&
                          `Hàng tháng (Ngày ${schedule.month_day})`}
                      </Typography>
                      {schedule.is_active && (
                        <Typography variant="small" color="green" className="text-[10px] font-bold mt-1">
                          ({getTimeRemaining(schedule)})
                        </Typography>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <Typography variant="small" color="blue-gray" className="font-normal text-xs">
                        {schedule.last_run || "Chưa chạy"}
                      </Typography>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {schedule.regions.includes("all") ? (
                          <Chip size="sm" value="Tất cả" color="blue" />
                        ) : (
                          schedule.regions.map((r) => (
                            <Chip
                              key={r}
                              size="sm"
                              variant="outlined"
                              value={r}
                            />
                          ))
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {activeTasks[schedule.id] ? (
                        <div className="w-48">
                          <div className="flex justify-between mb-1">
                            <Typography
                              variant="small"
                              className="text-[10px] font-normal text-blue-gray-600 truncate max-w-[120px]"
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
                            onClick={() => setViewLogTaskId(activeTasks[schedule.id].task_id)}
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
                                activeTasks[schedule.id].status === "completed"
                                  ? "green"
                                  : activeTasks[schedule.id].status === "canceled"
                                  ? "red"
                                  : "blue"
                              }
                            />
                            </Tooltip>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          Chưa chạy
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {isTaskRunning ? (
                        <Tooltip content="Dừng chạy">
                          <IconButton
                            variant="text"
                            color="red"
                            onClick={() => handleCancelTask(schedule.id)}
                          >
                            <StopIcon className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip content="Chạy ngay (Test)">
                          <IconButton
                            variant="text"
                            color="green"
                            onClick={() => handleRunNow(schedule)}
                          >
                            <PlayIcon className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip content="Sửa lịch">
                        <IconButton
                          variant="text"
                          onClick={() => handleOpenDialog(schedule)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip content="Xóa lịch">
                        <IconButton
                          variant="text"
                          color="red"
                          disabled={isTaskRunning}
                          className={isTaskRunning ? "opacity-50 cursor-not-allowed" : ""}
                          onClick={() => handleDelete(schedule.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={openDialog} handler={handleCloseDialog} size="md">
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
              placeholder="Nhập tên lịch"
              className="!border-t-blue-gray-200 focus:!border-t-gray-900"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
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
                className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
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
              <Select
                name="frequency"
                value={formData.frequency}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, frequency: val }))
                }
                className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
              >
                <Option value="daily">Hàng ngày</Option>
                <Option value="weekly">Hàng tuần</Option>
                <Option value="monthly">Hàng tháng</Option>
              </Select>
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
              <Select
                name="week_day"
                value={formData.week_day}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, week_day: val }))
                }
                className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
              >
                <Option value="mon">Thứ 2</Option>
                <Option value="tue">Thứ 3</Option>
                <Option value="wed">Thứ 4</Option>
                <Option value="thu">Thứ 5</Option>
                <Option value="fri">Thứ 6</Option>
                <Option value="sat">Thứ 7</Option>
                <Option value="sun">Chủ nhật</Option>
              </Select>
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
                className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
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
              color="green"
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
            <div className="w-full border border-gray-200 rounded-lg overflow-hidden">
              <List className="p-0">
                <ListItem className="p-0">
                  <label className="flex w-full cursor-pointer items-center px-3 py-2">
                    <ListItemPrefix className="mr-3">
                      <Checkbox
                        id="all-regions"
                        ripple={false}
                        checked={isAllRegions}
                        onChange={() => handleRegionChange("all")}
                      />
                    </ListItemPrefix>
                    <Typography color="blue-gray" className="font-bold">
                      Tất cả các tỉnh
                    </Typography>
                  </label>
                </ListItem>
              </List>
              <hr />
              <List className="p-0 flex-row flex-wrap max-h-48 overflow-y-auto">
                {availableRegions.map((region) => (
                  <ListItem key={region.slug} className="p-0 w-1/3">
                    <label className="flex w-full cursor-pointer items-center px-3 py-2">
                      <ListItemPrefix className="mr-3">
                        <Checkbox
                          id={`region-${region.slug}`}
                          ripple={false}
                          checked={
                            isAllRegions ||
                            formData.regions.includes(region.slug)
                          }
                          disabled={isAllRegions}
                          onChange={() => handleRegionChange(region.slug)}
                        />
                      </ListItemPrefix>
                      <Typography color="blue-gray" className="font-medium">
                        {region.name}
                      </Typography>
                    </label>
                  </ListItem>
                ))}
              </List>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={handleCloseDialog}
            className="mr-1"
          >
            <span>Hủy</span>
          </Button>
          <Button variant="gradient" color="green" onClick={handleSubmit}>
            <span>{isEdit ? "Lưu thay đổi" : "Tạo mới"}</span>
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        handler={() => setOpenDeleteDialog(false)}
        size="sm"
      >
        <DialogHeader>Xác nhận xóa</DialogHeader>
        <DialogBody>
          Bạn có chắc chắn muốn xóa lịch backup này không? Hành động này không
          thể hoàn tác.
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="blue-gray"
            onClick={() => setOpenDeleteDialog(false)}
            className="mr-1"
          >
            Hủy
          </Button>
          <Button variant="gradient" color="red" onClick={confirmDelete}>
            Xóa
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Log Viewer Dialog */}
      <Dialog open={!!viewLogTaskId} handler={handleCloseLogDialog} size="lg">
        <DialogHeader className="flex items-center gap-3">
          <DocumentTextIcon className="h-6 w-6 text-blue-500" />
          Chi tiết Tiến trình Backup
        </DialogHeader>
        <DialogBody divider className="p-0">
          <div className="bg-gray-900 text-green-400 font-mono p-4 h-[60vh] overflow-y-auto text-sm rounded-b-lg">
            {viewLogTaskId && activeTasks[Object.keys(activeTasks).find(key => activeTasks[key].task_id === viewLogTaskId)]?.logs?.length > 0 ? (
              activeTasks[Object.keys(activeTasks).find(key => activeTasks[key].task_id === viewLogTaskId)].logs.map((log, index) => (
                <div key={index} className="mb-1 border-b border-gray-800 pb-1 last:border-0">
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
          <Button variant="gradient" color="blue" onClick={handleCloseLogDialog}>
            Đóng
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default ScheduleManagement;
