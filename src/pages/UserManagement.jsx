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
  Select,
  Option,
  Checkbox,
  List,
  ListItem,
  ListItemPrefix,
} from "@material-tailwind/react";
import { PencilIcon, TrashIcon, UserPlusIcon } from "@heroicons/react/24/solid";

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
    roles: [], // Danh sách role được chọn (mảng các role name string)
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
      // Reset form khi mở dialog mới
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
    // Map userRoles từ object user sang mảng tên role
    // Giả sử cấu trúc user.userRoles = [{id: 1, role: {name: "ROLE_ADMIN"}}, ...]
    const currentRoles = user.userRoles
      ? user.userRoles.map((ur) => ur.role.name)
      : [];

    setFormData({
      username: user.username,
      password: "", // Không hiển thị password cũ
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
      toast.error(
        "Lỗi khi xóa người dùng: " +
          (error.response?.data || error.message || "Lỗi không xác định")
      );
    }
  };

  const handleSubmit = async () => {
    try {
      if (isEdit) {
        // Update
        const payload = {
          email: formData.email,
          state: formData.state,
          roles: formData.roles,
        };
        // Chỉ gửi password nếu người dùng nhập mới
        if (formData.password) {
          payload.password = formData.password;
        }

        await axiosInstance.put(`/users/${currentUser.id}`, payload);
        toast.success("Cập nhật thành công");
      } else {
        // Create
        await axiosInstance.post("/users", formData);
        toast.success("Tạo người dùng thành công");
      }
      setOpenDialog(false);
      fetchUsers();
    } catch (error) {
      toast.error(
        "Lỗi: " +
          (error.response?.data || error.message || "Lỗi không xác định")
      );
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
        ? prev.roles.filter((r) => r !== roleName) // Bỏ chọn
        : [...prev.roles, roleName]; // Chọn thêm
      return { ...prev, roles: newRoles };
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card className="h-full w-full">
        <CardHeader floated={false} shadow={false} className="rounded-none">
          <div className="mb-4 flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <Typography variant="h5" color="blue-gray">
                Quản lý Người dùng
              </Typography>
              <Typography color="gray" className="mt-1 font-normal">
                Xem và quản lý danh sách tài khoản hệ thống
              </Typography>
            </div>
            <div className="flex w-full shrink-0 gap-2 md:w-max">
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
        </CardHeader>
        <CardBody className="overflow-scroll px-0">
          <table className="w-full min-w-max table-auto text-left">
            <thead>
              <tr>
                {[
                  "ID",
                  "Username",
                  "Email",
                  "Quyền hạn",
                  "Trạng thái",
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
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center">
                    Không có người dùng nào.
                  </td>
                </tr>
              ) : (
                users.map((user, index) => {
                  const isLast = index === users.length - 1;
                  const classes = isLast
                    ? "p-4"
                    : "p-4 border-b border-blue-gray-50";

                  return (
                    <tr key={user.id}>
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
                        <Chip
                          size="sm"
                          variant="ghost"
                          value={user.state}
                          color={
                            user.state === "ACTIVE"
                              ? "green"
                              : user.state === "LOCKED"
                                ? "red"
                                : "blue-gray"
                          }
                        />
                      </td>
                      <td className={classes}>
                        <div className="flex gap-2">
                          <IconButton
                            variant="text"
                            color="blue"
                            onClick={() => handleEdit(user)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            variant="text"
                            color="red"
                            onClick={() => handleDelete(user.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* Dialog Thêm/Sửa */}
      <Dialog open={openDialog} handler={handleOpen} size="xs">
        <DialogHeader>
          {isEdit ? "Cập nhật người dùng" : "Thêm người dùng mới"}
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Input
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={isEdit} // Không cho sửa username
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={isEdit ? "Để trống nếu không đổi" : "Nhập mật khẩu"}
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          <Select
            label="Trạng thái"
            value={formData.state}
            onChange={handleStateChange}
          >
            <Option value="ACTIVE">Hoạt động (Active)</Option>
            <Option value="INACTIVE">Vô hiệu hóa (Inactive)</Option>
            <Option value="LOCKED">Khóa (Locked)</Option>
          </Select>

          {/* Phần chọn Role */}
          <div className="mt-2">
            <Typography
              variant="small"
              color="blue-gray"
              className="mb-2 font-medium"
            >
              Phân quyền
            </Typography>
            <Card className="w-full overflow-hidden border border-gray-200 shadow-none">
              <List className="p-0 flex-row flex-wrap">
                {availableRoles.map((role) => (
                  <ListItem key={role.id} className="p-0 w-1/2">
                    <label className="flex w-full cursor-pointer items-center px-3 py-2">
                      <ListItemPrefix className="mr-3">
                        <Checkbox
                          id={`role-${role.id}`}
                          ripple={false}
                          className="hover:before:opacity-0"
                          containerProps={{ className: "p-0" }}
                          checked={formData.roles.includes(role.name)}
                          onChange={() => handleRoleChange(role.name)}
                        />
                      </ListItemPrefix>
                      <Typography color="blue-gray" className="font-medium">
                        {role.name}
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
            onClick={handleOpen}
            className="mr-1"
          >
            Hủy
          </Button>
          <Button variant="gradient" color="green" onClick={handleSubmit}>
            {isEdit ? "Lưu thay đổi" : "Tạo mới"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default UserManagement;
