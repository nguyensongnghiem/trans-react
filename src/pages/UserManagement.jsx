import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import {
  Card,
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
  Select,
  Option,
  Checkbox,
  Spinner,
} from "@material-tailwind/react";
import { PencilIcon, TrashIcon, UserPlusIcon, XMarkIcon } from "@heroicons/react/24/solid";
import CustomButton from "../components/CustomButton";
import StatusChip from "../components/StatusChip";

const TABLE_HEAD = ["ID", "Username", "Email", "Quyền hạn", "Trạng thái", "Hành động"];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    state: "ACTIVE",
    roles: [],
  });

  const axiosInstance = useAxiosPrivate();

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.get("/users/roles");
      setAvailableRoles(response.data);
    } catch (error) {
      console.error("Lỗi tải roles:", error);
    }
  };

  const handleOpen = () => {
    setOpenDialog(!openDialog);
    if (!openDialog) {
      setFormData({
        username: "",
        password: "",
        email: "",
        state: "ACTIVE",
        roles: [],
      });
      setIsEdit(false);
      setCurrentUser(null);
    }
  };

  const handleEdit = (user) => {
    const currentRoles = user.userRoles ? user.userRoles.map((ur) => ur.role.name) : [];
    setFormData({
      username: user.username,
      password: "",
      email: user.email || "",
      state: user.state || "ACTIVE",
      roles: currentRoles,
    });
    setCurrentUser(user);
    setIsEdit(true);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;
    try {
      await axiosInstance.delete(`/users/${id}`);
      toast.success("Xóa người dùng thành công");
      fetchUsers();
    } catch (error) {
      toast.error(`Lỗi khi xóa người dùng: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSubmit = async () => {
    try {
      if (isEdit) {
        const payload = {
          email: formData.email,
          state: formData.state,
          roles: formData.roles,
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        await axiosInstance.put(`/users/${currentUser.id}`, payload);
        toast.success("Cập nhật thành công");
      } else {
        await axiosInstance.post("/users", formData);
        toast.success("Tạo người dùng thành công");
      }
      setOpenDialog(false);
      fetchUsers();
    } catch (error) {
      toast.error(`Lỗi: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStateChange = (value) => {
    setFormData((prev) => ({ ...prev, state: value }));
  };

  const handleRoleChange = (roleName) => {
    setFormData((prev) => {
      const newRoles = prev.roles.includes(roleName)
        ? prev.roles.filter((r) => r !== roleName)
        : [...prev.roles, roleName];
      return { ...prev, roles: newRoles };
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="px-3 mt-3">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Typography variant="h5" color="blue-gray">
            Quản lý Người dùng
          </Typography>
          <Typography color="gray" className="mt-1 font-normal">
            Xem và quản lý danh sách tài khoản hệ thống
          </Typography>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            className="flex items-center gap-3"
            size="sm"
            color="blue"
            onClick={handleOpen}
          >
            <UserPlusIcon strokeWidth={2} className="h-4 w-4" /> Thêm mới
          </Button>
        </div>
      </div>
      <Card className="w-full">
        <CardBody className="overflow-auto px-0">
          <table className="w-full min-w-max table-auto text-left">
            <thead>
              <tr>
                {TABLE_HEAD.map((head) => (
                  <th
                    key={head}
                    className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4"
                  >
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-bold leading-none"
                    >
                      {head}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => {
                const isLast = index === users.length - 1;
                const classes = isLast
                  ? "p-4"
                  : "p-4 border-b border-blue-gray-50";

                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className={classes}>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal"
                      >
                        {user.id}
                      </Typography>
                    </td>
                    <td className={classes}>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-bold"
                      >
                        {user.username}
                      </Typography>
                    </td>
                    <td className={classes}>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal"
                      >
                        {user.email || "N/A"}
                      </Typography>
                    </td>
                    <td className={classes}>
                      <div className="flex flex-wrap gap-1">
                        {user.userRoles && user.userRoles.length > 0 ? (
                          user.userRoles.map((ur, idx) => (
                            <Chip
                              key={idx}
                              value={ur.role.name.replace("ROLE_", "")}
                              size="sm"
                              variant="outlined"
                              className="rounded-full"
                            />
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">
                            Không có
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={classes}>
                      <StatusChip
                        active={user.state === "ACTIVE"}
                        labelOn="ACTIVE"
                        labelOff={user.state}
                      />
                    </td>
                    <td className={classes}>
                      <div className="flex gap-2">
                        <IconButton
                          variant="text"
                          size="sm"
                          color="blue"
                          onClick={() => handleEdit(user)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          variant="text"
                          size="sm"
                          color="red"
                          onClick={() => handleDelete(user.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Dialog
        open={openDialog}
        handler={handleOpen}
        size="md"
        className="rounded-lg overflow-hidden shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <Typography variant="h5" color="blue-gray" className="font-semibold text-gray-900">
              {isEdit ? "Cập nhật người dùng" : "Thêm người dùng mới"}
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              {isEdit ? "Chỉnh sửa thông tin tài khoản" : "Tạo tài khoản mới cho hệ thống"}
            </Typography>
          </div>
          <IconButton
            size="sm"
            variant="text"
            className="text-gray-500 hover:bg-gray-200 rounded-full"
            onClick={handleOpen}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>
        <DialogBody className="grid grid-cols-1 gap-4 p-6 text-blue-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Typography variant="small" color="blue-gray" className="font-bold">
                Username
              </Typography>
              <Input
                size="lg"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={isEdit}
                placeholder="Nhập tên đăng nhập"
                className="!border-t-blue-gray-200 focus:!border-blue-500"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
              />
            </div>
            <div className="space-y-1">
              <Typography variant="small" color="blue-gray" className="font-bold">
                Password
              </Typography>
              <Input
                type="password"
                size="lg"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isEdit ? "Để trống nếu không đổi" : "Nhập mật khẩu"}
                className="!border-t-blue-gray-200 focus:!border-blue-500"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Typography variant="small" color="blue-gray" className="font-bold">
                Email
              </Typography>
              <Input
                type="email"
                size="lg"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@mobifone.vn"
                className="!border-t-blue-gray-200 focus:!border-blue-500"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
              />
            </div>
            <div className="space-y-1">
              <Typography variant="small" color="blue-gray" className="font-bold">
                Trạng thái
              </Typography>
              <Select
                value={formData.state}
                onChange={handleStateChange}
                className="!border-t-blue-gray-200 focus:!border-blue-500"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
              >
                <Option value="ACTIVE">Hoạt động (Active)</Option>
                <Option value="INACTIVE">Vô hiệu hóa (Inactive)</Option>
                <Option value="LOCKED">Khóa (Locked)</Option>
              </Select>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <Typography variant="small" color="blue-gray" className="font-bold">
              Phân quyền
            </Typography>
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 p-3 sm:grid-cols-3 bg-gray-50/50">
              {availableRoles.map((role) => (
                <Checkbox
                  key={role.id}
                  id={`role-${role.id}`}
                  label={
                    <Typography color="blue-gray" className="font-medium text-sm">
                      {role.name.replace("ROLE_", "")}
                    </Typography>
                  }
                  containerProps={{ className: "p-2" }}
                  checked={formData.roles.includes(role.name)}
                  onChange={() => handleRoleChange(role.name)}
                />
              ))}
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="bg-gray-50 px-4 py-3 gap-2 border-t border-gray-100">
          <CustomButton variant="text" color="blue-gray" onClick={handleOpen} size="sm">
            Hủy bỏ
          </CustomButton>
          <CustomButton
            onClick={handleSubmit}
            size="sm"
            className="bg-[#0d47a1] hover:bg-[#0a3a82] shadow-md shadow-blue-500/20"
          >
            {isEdit ? "Lưu thay đổi" : "Tạo mới"}
          </CustomButton>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default UserManagement;
