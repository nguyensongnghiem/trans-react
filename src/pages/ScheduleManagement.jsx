import React, { useState, useEffect } from "react";
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
} from "@material-tailwind/react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ClockIcon,
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

  useEffect(() => {
    fetchSchedules();
    fetchRegions();
  }, []);

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
                  "Trạng thái",
                  "Thời gian",
                  "Tần suất",
                  "Khu vực",
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
                schedules.map((schedule) => (
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
                          onClick={() => handleDelete(schedule.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                ))
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
    </div>
  );
};

export default ScheduleManagement;
