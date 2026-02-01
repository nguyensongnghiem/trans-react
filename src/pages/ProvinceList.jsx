import { useEffect, useState } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
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
} from "@material-tailwind/react";
import { toast } from "react-toastify";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import CustomButton from "../components/CustomButton";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAuth } from "../contexts/authContext";
import { jwtDecode } from "jwt-decode";

function ProvinceList() {
  const [provinces, setProvinces] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const axiosInstance = useAxiosPrivate();
  const { auth } = useAuth();
  
  let isAdmin = false;
  if (auth?.accessToken) {
    try {
      const decoded = jwtDecode(auth.accessToken);
      const roles = decoded.roles || decoded.authorities || [];
      if (Array.isArray(roles)) {
        isAdmin = roles.includes("ROLE_ADMIN");
      }
    } catch (error) {}
  }

  const fetchProvinces = async () => {
    try {
      const res = await axiosInstance.get("provinces");
      setProvinces(res.data);
    } catch (error) {
      console.error("Failed to fetch provinces", error);
      toast.error("Lỗi khi tải danh sách tỉnh");
    }
  };

  useEffect(() => {
    fetchProvinces();
  }, []);

  const handleCreate = async (values, { resetForm }) => {
    try {
      await axiosInstance.post("provinces", values);
      toast.success("Thêm mới thành công");
      fetchProvinces();
      setOpenCreate(false);
      resetForm();
    } catch (error) {
      toast.error("Lỗi khi thêm mới (có thể mã tỉnh đã tồn tại)");
    }
  };

  const handleUpdate = async (values) => {
    try {
      await axiosInstance.put(`provinces/${selectedItem.id}`, values);
      toast.success("Cập nhật thành công");
      fetchProvinces();
      setOpenEdit(false);
      setSelectedItem(null);
    } catch (error) {
      toast.error("Lỗi khi cập nhật");
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await axiosInstance.delete(`provinces/${selectedItem.id}`);
      toast.success("Xóa thành công");
      fetchProvinces();
      setOpenDelete(false);
      setSelectedItem(null);
    } catch (error) {
      toast.error("Lỗi khi xóa (có thể đang được sử dụng bởi các trạm)");
    }
  };

  const filteredList = provinces.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.id && item.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const validationSchema = Yup.object({
    id: Yup.string().required("Mã tỉnh là bắt buộc"),
    name: Yup.string().required("Tên tỉnh là bắt buộc"),
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Quản lý Tỉnh / Thành phố
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số: <span className="font-semibold text-blue-600">{filteredList.length}</span> tỉnh
          </p>
        </div>
        {isAdmin && (
          <CustomButton
            className="flex items-center gap-2 bg-[#0d47a1] hover:bg-[#0a3a82]"
            size="sm"
            onClick={() => setOpenCreate(true)}
          >
            <PlusIcon className="h-4 w-4" /> Thêm mới
          </CustomButton>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-200 w-full md:w-1/3">
        <Input
          label="Tìm kiếm"
          icon={<MagnifyingGlassIcon className="h-5 w-5" />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="w-full overflow-hidden border border-gray-200 shadow-sm rounded-xl">
        <table className="w-full min-w-max table-auto text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 w-32">
                <Typography variant="small" color="blue-gray" className="font-bold">Mã Tỉnh</Typography>
              </th>
              <th className="p-4">
                <Typography variant="small" color="blue-gray" className="font-bold">Tên Tỉnh</Typography>
              </th>
              {isAdmin && (
                <th className="p-4 w-32 text-center">
                  <Typography variant="small" color="blue-gray" className="font-bold">Hành động</Typography>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredList.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{item.id}</td>
                <td className="p-4">{item.name}</td>
                {isAdmin && (
                  <td className="p-4 flex justify-center gap-2">
                    <IconButton
                      variant="text"
                      color="blue"
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item);
                        setOpenEdit(true);
                      }}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      variant="text"
                      color="red"
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item);
                        setOpenDelete(true);
                      }}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </IconButton>
                  </td>
                )}
              </tr>
            ))}
            {filteredList.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 3 : 2} className="p-4 text-center text-gray-500">
                  Không tìm thấy dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Create Modal */}
      <Dialog open={openCreate} handler={() => setOpenCreate(!openCreate)} size="xs">
        <DialogHeader>Thêm mới Tỉnh</DialogHeader>
        <Formik
          initialValues={{ id: "", name: "" }}
          validationSchema={validationSchema}
          onSubmit={handleCreate}
        >
          {({ errors, touched }) => (
            <Form>
              <DialogBody>
                <div className="flex flex-col gap-4">
                  <div>
                    <Field name="id">
                      {({ field }) => (
                        <Input {...field} label="Mã Tỉnh (VD: HNI)" error={touched.id && Boolean(errors.id)} />
                      )}
                    </Field>
                    <ErrorMessage name="id" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                  <div>
                    <Field name="name">
                      {({ field }) => (
                        <Input {...field} label="Tên Tỉnh" error={touched.name && Boolean(errors.name)} />
                      )}
                    </Field>
                    <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                </div>
              </DialogBody>
              <DialogFooter>
                <Button variant="text" onClick={() => setOpenCreate(false)} className="mr-2">
                  Hủy
                </Button>
                <CustomButton type="submit">Lưu</CustomButton>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={openEdit} handler={() => setOpenEdit(!openEdit)} size="xs">
        <DialogHeader>Cập nhật Tỉnh</DialogHeader>
        {selectedItem && (
          <Formik
            initialValues={{ id: selectedItem.id, name: selectedItem.name }}
            validationSchema={validationSchema}
            onSubmit={handleUpdate}
          >
            {({ errors, touched }) => (
              <Form>
                <DialogBody>
                  <div className="flex flex-col gap-4">
                    <div>
                      <Field name="id">
                        {({ field }) => (
                          <Input {...field} label="Mã Tỉnh" disabled />
                        )}
                      </Field>
                      <Typography variant="small" color="gray" className="mt-1 text-xs">
                        Mã tỉnh không thể thay đổi
                      </Typography>
                    </div>
                    <div>
                      <Field name="name">
                        {({ field }) => (
                          <Input {...field} label="Tên Tỉnh" error={touched.name && Boolean(errors.name)} />
                        )}
                      </Field>
                      <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                  </div>
                </DialogBody>
                <DialogFooter>
                  <Button variant="text" onClick={() => setOpenEdit(false)} className="mr-2">
                    Hủy
                  </Button>
                  <CustomButton type="submit">Cập nhật</CustomButton>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        )}
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={openDelete} handler={() => setOpenDelete(!openDelete)} size="xs">
        <DialogHeader>Xác nhận xóa</DialogHeader>
        <DialogBody>
          Bạn có chắc chắn muốn xóa tỉnh <b>{selectedItem?.name}</b> không?
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={() => setOpenDelete(false)} className="mr-2">
            Hủy
          </Button>
          <Button color="red" onClick={handleDelete}>
            Xóa
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default ProvinceList;
