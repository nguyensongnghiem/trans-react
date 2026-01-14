import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import {
  Card,
  CardHeader,
  Typography,
  Button,
  CardBody,
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
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/solid";

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState([]);
  const [availableRegions, setAvailableRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
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
      const response = await axiosInstance.get("/routers/backup/schedules");
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
      const response = await axiosInstance.get("/routers/backup/regions");
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

  const handleDelete = async (scheduleId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lịch backup này?")) return;
    try {
      await axiosInstance.delete(`/routers/backup/schedules/${scheduleId}`);
      toast.success("Xóa lịch backup thành công!");
      fetchSchedules(); // Tải lại danh sách
    } catch (error) {
      console.error("Failed to delete schedule:", error);
      toast.error("Lỗi khi xóa lịch backup.");
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
          `/routers/backup/schedules/${currentScheduleId}`,
          payload
        );
        toast.success("Cập nhật lịch backup thành công!");
      } else {
        await axiosInstance.post("/routers/backup/schedules", payload);
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card className="h-full w-full">
        <CardHeader floated={false} shadow={false} className="rounded-none">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <Typography variant="h5" color="blue-gray">
                Quản lý Lịch Backup
              </Typography>
              <Typography color="gray" className="mt-1 font-normal">
                Thiết lập lịch backup tự động cho các thiết bị router.
              </Typography>
            </div>
            <Button
              className="flex items-center gap-3"
              size="sm"
              onClick={() => handleOpenDialog()}
            >
              <PlusIcon strokeWidth={2} className="h-4 w-4" /> Thêm Lịch
            </Button>
          </div>
        </CardHeader>
        <CardBody className="overflow-scroll px-0">
          <table className="w-full min-w-max table-auto text-left">
            <thead>
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
                    className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4"
                  >
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal leading-none opacity-70"
                    >
                      {head}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center">
                    Đang tải...
                  </td>
                </tr>
              ) : (
                schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="p-4 border-b border-blue-gray-50">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-bold"
                      >
                        {schedule.name}
                      </Typography>
                    </td>
                    <td className="p-4 border-b border-blue-gray-50">
                      <Chip
                        size="sm"
                        variant="ghost"
                        value={schedule.is_active ? "Đang chạy" : "Tạm dừng"}
                        color={schedule.is_active ? "green" : "red"}
                      />
                    </td>
                    <td className="p-4 border-b border-blue-gray-50">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal"
                      >
                        {schedule.time}
                      </Typography>
                    </td>
                    <td className="p-4 border-b border-blue-gray-50">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal capitalize"
                      >
                        {schedule.frequency === "daily" && "Hàng ngày"}
                        {schedule.frequency === "weekly" &&
                          `Hàng tuần (Thứ ${schedule.week_day})`}
                        {schedule.frequency === "monthly" &&
                          `Hàng tháng (Ngày ${schedule.month_day})`}
                      </Typography>
                    </td>
                    <td className="p-4 border-b border-blue-gray-50">
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
                    <td className="p-4 border-b border-blue-gray-50">
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
        </CardBody>
      </Card>

      <Dialog open={openDialog} handler={handleCloseDialog} size="md">
        <DialogHeader>
          {isEdit ? "Chỉnh sửa Lịch Backup" : "Tạo Lịch Backup Mới"}
        </DialogHeader>
        <DialogBody
          divider
          className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto"
        >
          <Input
            label="Tên lịch"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
            required
          />
          <div className="flex items-center justify-between">
            <Typography>Kích hoạt lịch</Typography>
            <Switch
              checked={formData.is_active}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  is_active: e.target.checked,
                }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Thời gian (HH:MM)"
              type="time"
              name="time"
              value={formData.time}
              onChange={handleFormChange}
              required
            />
            <Select
              label="Tần suất"
              name="frequency"
              value={formData.frequency}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, frequency: val }))
              }
            >
              <Option value="daily">Hàng ngày</Option>
              <Option value="weekly">Hàng tuần</Option>
              <Option value="monthly">Hàng tháng</Option>
            </Select>
          </div>
          {formData.frequency === "weekly" && (
            <Select
              label="Chọn ngày trong tuần"
              name="week_day"
              value={formData.week_day}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, week_day: val }))
              }
            >
              <Option value="mon">Thứ 2</Option>
              <Option value="tue">Thứ 3</Option>
              <Option value="wed">Thứ 4</Option>
              <Option value="thu">Thứ 5</Option>
              <Option value="fri">Thứ 6</Option>
              <Option value="sat">Thứ 7</Option>
              <Option value="sun">Chủ nhật</Option>
            </Select>
          )}
          {formData.frequency === "monthly" && (
            <Input
              label="Chọn ngày trong tháng (1-31)"
              type="number"
              name="month_day"
              min="1"
              max="31"
              value={formData.month_day}
              onChange={handleFormChange}
            />
          )}
          <div>
            <Typography variant="h6" color="blue-gray" className="mb-2">
              Phạm vi Backup
            </Typography>
            <Card className="w-full border border-gray-200 shadow-none">
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
            </Card>
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
    </div>
  );
};

export default ScheduleManagement;
