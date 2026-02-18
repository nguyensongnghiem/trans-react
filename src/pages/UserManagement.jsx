import React, { useState, useEffect, useMemo } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import {
  Card,
  Typography,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  IconButton,
  Select,
  Option,
  Checkbox,
} from "@material-tailwind/react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import CustomButton from "../components/CustomButton";
import StatusChip from "../components/StatusChip";

const UserSchema = Yup.object().shape({
  username: Yup.string()
    .required("Tên đăng nhập là bắt buộc")
    .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
    .max(50, "Tên đăng nhập tối đa 50 ký tự"),
  email: Yup.string()
    .email("Email không hợp lệ"),
  password: Yup.string().test(
    "password-required",
    "Mật khẩu là bắt buộc",
    function (value) {
      // Required if it's a new user (no id)
      if (!this.parent.id && !value) return false;
      return true;
    }
  ),
  roles: Yup.array()
    .min(1, "Phải chọn ít nhất một quyền"),
  state: Yup.string()
    .required("Trạng thái là bắt buộc"),
});

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteUserName, setDeleteUserName] = useState("");

  const [filters, setFilters] = useState({
    search: "",
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

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchSearch =
        !filters.search ||
        user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(filters.search.toLowerCase()));
      return matchSearch;
    });
  }, [users, filters]);

  const handleOpenCreate = () => {
    setIsEdit(false);
    setSelectedUser(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (user) => {
    setIsEdit(true);
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleDeleteClick = (user) => {
    setDeleteId(user.id);
    setDeleteUserName(user.username);
    setOpenDelete(true);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (isEdit) {
        const payload = {
          email: values.email,
          state: values.state,
          roles: values.roles,
        };
        if (values.password) {
          payload.password = values.password;
        }
        await axiosInstance.put(`/users/${selectedUser.id}`, payload);
        toast.success("Cập nhật thành công");
      } else {
        await axiosInstance.post("/users", values);
        toast.success("Tạo người dùng thành công");
      }
      setOpenDialog(false);
      fetchUsers();
      resetForm();
    } catch (error) {
      toast.error(`Lỗi: ${error.response?.data?.message || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/users/${deleteId}`);
      toast.success("Xóa người dùng thành công");
      fetchUsers();
      setOpenDelete(false);
    } catch (error) {
      toast.error(`Lỗi khi xóa: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleResetFilters = () => {
    setFilters({ search: "" });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Quản lý Người dùng
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số: <span className="font-semibold text-blue-600">{filteredUsers.length}</span> người dùng
          </p>
        </div>
        <CustomButton
          className="flex items-center gap-2 bg-[#0d47a1] hover:bg-[#0a3a82]"
          size="sm"
          onClick={handleOpenCreate}
        >
          <PlusIcon strokeWidth={2} className="h-4 w-4" /> Thêm mới
        </CustomButton>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm mb-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4 text-blue-gray-700">
          <FunnelIcon className="h-5 w-5" />
          <span className="font-bold text-sm uppercase tracking-wider">Bộ lọc tìm kiếm</span>
          {filters.search && (
            <button
              onClick={handleResetFilters}
              className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
            >
              <ArrowPathIcon className="h-3 w-3" /> Xóa bộ lọc
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Tìm kiếm nhanh</span>
            <Input
              icon={<MagnifyingGlassIcon className="h-4 w-4" />}
              placeholder="Username, Email..."
              className="!border-t-blue-gray-200 focus:!border-blue-500 rounded-lg text-sm"
              labelProps={{ className: "before:content-none after:content-none" }}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              containerProps={{ className: "min-w-0" }}
            />
          </div>
        </div>
      </div>

      <Card className="w-full overflow-hidden border border-gray-200 shadow-sm rounded-xl">
        <table className="w-full min-w-max table-auto text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 w-20">
                <Typography variant="small" color="blue-gray" className="font-bold">STT</Typography>
              </th>
              <th className="p-4">
                <Typography variant="small" color="blue-gray" className="font-bold">Username</Typography>
              </th>
              <th className="p-4">
                <Typography variant="small" color="blue-gray" className="font-bold">Email</Typography>
              </th>
              <th className="p-4">
                <Typography variant="small" color="blue-gray" className="font-bold">Quyền hạn</Typography>
              </th>
              <th className="p-4 w-32 text-center">
                <Typography variant="small" color="blue-gray" className="font-bold">Trạng thái</Typography>
              </th>
              <th className="p-4 w-32 text-center">
                <Typography variant="small" color="blue-gray" className="font-bold">Hành động</Typography>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user, index) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <Typography variant="small" color="blue-gray" className="font-normal">
                    {index + 1}
                  </Typography>
                </td>
                <td className="p-4">
                  <Typography variant="small" color="blue-gray" className="font-bold">
                    {user.username}
                  </Typography>
                </td>
                <td className="p-4">
                  <Typography variant="small" color="blue-gray" className="font-normal text-gray-600">
                    {user.email || "N/A"}
                  </Typography>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {user.userRoles && user.userRoles.length > 0 ? (
                      user.userRoles.map((ur, idx) => (
                        <div key={idx} className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                          {ur.role?.name?.replace("ROLE_", "") || ""}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">No Roles</span>
                    )}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <StatusChip
                    active={user.state === "ACTIVE"}
                    labelOn="ACTIVE"
                    labelOff={user.state}
                    className="inline-flex"
                  />
                </td>
                <td className="p-4 flex justify-center gap-2">
                  <IconButton variant="text" color="blue" size="sm" onClick={() => handleOpenEdit(user)}>
                    <PencilIcon className="h-4 w-4" />
                  </IconButton>
                  <IconButton variant="text" color="red" size="sm" onClick={() => handleDeleteClick(user)}>
                    <TrashIcon className="h-4 w-4" />
                  </IconButton>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500 italic">
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        handler={() => setOpenDialog(false)}
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
            onClick={() => setOpenDialog(false)}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>

        <Formik
          initialValues={{
            id: selectedUser?.id || null,
            username: selectedUser?.username || "",
            password: "",
            email: selectedUser?.email || "",
            state: selectedUser?.state || "ACTIVE",
            roles: selectedUser ? (selectedUser.userRoles || []).map(r => r.role?.name).filter(Boolean) : []
          }}
          validationSchema={UserSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, isSubmitting }) => (
            <Form className="flex flex-col h-full">
              <DialogBody className="p-6 overflow-y-auto max-h-[70vh] text-blue-gray-700">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Typography variant="small" color="blue-gray" className="font-bold mb-1">
                        Username
                      </Typography>
                      <Field name="username">
                        {({ field }) => (
                          <Input
                            {...field}
                            size="lg"
                            disabled={isEdit}
                            placeholder="Nhập tên đăng nhập"
                            className="!border-t-blue-gray-200 focus:!border-blue-500"
                            labelProps={{ className: "before:content-none after:content-none" }}
                            error={touched.username && Boolean(errors.username)}
                          />
                        )}
                      </Field>
                      <ErrorMessage name="username" component="div" className="text-red-500 text-xs mt-1 ml-1" />
                    </div>

                    <div>
                      <Typography variant="small" color="blue-gray" className="font-bold mb-1">
                        Password
                      </Typography>
                      <Field name="password">
                        {({ field }) => (
                          <Input
                            {...field}
                            type="password"
                            size="lg"
                            placeholder={isEdit ? "Để trống nếu không đổi" : "Nhập mật khẩu"}
                            className="!border-t-blue-gray-200 focus:!border-blue-500"
                            labelProps={{ className: "before:content-none after:content-none" }}
                            error={touched.password && Boolean(errors.password)}
                          />
                        )}
                      </Field>
                      <ErrorMessage name="password" component="div" className="text-red-500 text-xs mt-1 ml-1" />
                    </div>

                    <div>
                      <Typography variant="small" color="blue-gray" className="font-bold mb-1">
                        Email
                      </Typography>
                      <Field name="email">
                        {({ field }) => (
                          <Input
                            {...field}
                            type="email"
                            size="lg"
                            placeholder="example@mobifone.vn"
                            className="!border-t-blue-gray-200 focus:!border-blue-500"
                            labelProps={{ className: "before:content-none after:content-none" }}
                            error={touched.email && Boolean(errors.email)}
                          />
                        )}
                      </Field>
                      <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1 ml-1" />
                    </div>

                    <div>
                      <Typography variant="small" color="blue-gray" className="font-bold mb-2">
                        Phân quyền
                      </Typography>
                      <div className="grid grid-cols-2 gap-2 border border-gray-200 p-3 rounded-lg bg-gray-50/50">
                        {availableRoles.map((role) => (
                          <div key={role.id} className="flex items-center">
                            <Checkbox
                              id={role.name}
                              label={
                                <Typography color="blue-gray" className="font-medium text-sm">
                                  {role.name.replace("ROLE_", "")}
                                </Typography>
                              }
                              checked={values.roles.includes(role.name)}
                              onChange={(e) => {
                                const newRoles = e.target.checked
                                  ? [...values.roles, role.name]
                                  : values.roles.filter(r => r !== role.name);
                                setFieldValue("roles", newRoles);
                              }}
                              containerProps={{ className: "p-2" }}
                            />
                          </div>
                        ))}
                      </div>
                      <ErrorMessage name="roles" component="div" className="text-red-500 text-xs mt-1 ml-1" />
                    </div>

                    <div>
                      <Typography variant="small" color="blue-gray" className="font-bold mb-1">
                        Trạng thái
                      </Typography>
                      <Select
                        value={values.state}
                        onChange={(val) => setFieldValue("state", val)}
                        className="!border-t-blue-gray-200 focus:!border-blue-500"
                        labelProps={{ className: "before:content-none after:content-none" }}
                        error={touched.state && Boolean(errors.state)}
                      >
                        <Option value="ACTIVE">Hoạt động (Active)</Option>
                        <Option value="INACTIVE">Vô hiệu hóa (Inactive)</Option>
                        <Option value="LOCKED">Khóa (Locked)</Option>
                      </Select>
                      <ErrorMessage name="state" component="div" className="text-red-500 text-xs mt-1 ml-1" />
                    </div>
                  </div>
                </div>
              </DialogBody>
              <DialogFooter className="bg-gray-50 px-4 py-3 gap-2 border-t border-gray-100">
                <Button variant="text" color="blue-gray" onClick={() => setOpenDialog(false)} className="mr-2">
                  Hủy
                </Button>
                <CustomButton type="submit" disabled={isSubmitting}>
                  {isEdit ? "Cập nhật" : "Tạo mới"}
                </CustomButton>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={openDelete} handler={() => setOpenDelete(!openDelete)} size="xs" className="rounded-lg shadow-xl overflow-hidden">
        <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-full">
            <TrashIcon className="h-5 w-5 text-red-600" />
          </div>
          <Typography variant="h5" color="red" className="font-semibold">
            Xác nhận xóa
          </Typography>
          <IconButton
            size="sm"
            variant="text"
            className="!absolute right-3.5 top-3.5 text-gray-500 hover:bg-gray-200 rounded-full"
            onClick={() => setOpenDelete(false)}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>
        <DialogBody className="p-6 text-center text-blue-gray-700">
          <Typography variant="paragraph" color="blue-gray" className="font-medium">
            Bạn có chắc chắn muốn xóa người dùng <br /> <span className="font-bold text-red-600">{deleteUserName}</span> ?
          </Typography>
        </DialogBody>
        <DialogFooter className="bg-gray-50 px-4 py-3 gap-2 border-t border-gray-100 justify-center">
          <Button variant="text" color="blue-gray" onClick={() => setOpenDelete(false)}>
            Hủy bỏ
          </Button>
          <Button color="red" onClick={confirmDelete}>
            Xóa vĩnh viễn
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default UserManagement;
