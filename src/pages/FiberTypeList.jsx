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
  Switch,
  Textarea,
  Chip,
} from "@material-tailwind/react";
import { toast } from "react-toastify";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import CustomButton from "../components/CustomButton";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

function FiberTypeList() {
  const [fiberTypes, setFiberTypes] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const axiosInstance = useAxiosPrivate();

  const fetchFiberTypes = async () => {
    try {
      const res = await axiosInstance.get("fiber-types");
      setFiberTypes(res.data);
    } catch (error) {
      console.error("Failed to fetch fiber types", error);
      toast.error("Lỗi khi tải danh sách loại cáp");
    }
  };

  useEffect(() => {
    fetchFiberTypes();
  }, []);

  const handleCreate = async (values, { resetForm }) => {
    try {
      await axiosInstance.post("fiber-types", values);
      toast.success("Thêm mới thành công");
      fetchFiberTypes();
      setOpenCreate(false);
      resetForm();
    } catch (error) {
      toast.error("Lỗi khi thêm mới");
    }
  };

  const handleUpdate = async (values) => {
    try {
      await axiosInstance.put(`fiber-types/${selectedItem.id}`, values);
      toast.success("Cập nhật thành công");
      fetchFiberTypes();
      setOpenEdit(false);
      setSelectedItem(null);
    } catch (error) {
      toast.error("Lỗi khi cập nhật");
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await axiosInstance.delete(`fiber-types/${selectedItem.id}`);
      toast.success("Xóa thành công");
      fetchFiberTypes();
      setOpenDelete(false);
      setSelectedItem(null);
    } catch (error) {
      toast.error("Lỗi khi xóa (có thể đang được sử dụng)");
    }
  };

  const filteredList = fiberTypes.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validationSchema = Yup.object({
    name: Yup.string().required("Tên loại cáp là bắt buộc"),
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Quản lý Loại cáp quang
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số: <span className="font-semibold text-blue-600">{filteredList.length}</span> loại
          </p>
        </div>
        <CustomButton
          className="flex items-center gap-2 bg-[#0d47a1] hover:bg-[#0a3a82]"
          size="sm"
          onClick={() => setOpenCreate(true)}
        >
          <PlusIcon className="h-4 w-4" /> Thêm mới
        </CustomButton>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-200 w-full">
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
              <th className="p-4 w-20">
                <Typography variant="small" color="blue-gray" className="font-bold">ID</Typography>
              </th>
              <th className="p-4">
                <Typography variant="small" color="blue-gray" className="font-bold">Tên loại cáp</Typography>
              </th>
              <th className="p-4">
                <Typography variant="small" color="blue-gray" className="font-bold">Mô tả</Typography>
              </th>
              <th className="p-4">
                <Typography variant="small" color="blue-gray" className="font-bold">Màu sắc</Typography>
              </th>
              <th className="p-4">
                <Typography variant="small" color="blue-gray" className="font-bold">Kiểu đường</Typography>
              </th>
              <th className="p-4">
                <Typography variant="small" color="blue-gray" className="font-bold">Trạng thái</Typography>
              </th>
              <th className="p-4 w-32 text-center">
                <Typography variant="small" color="blue-gray" className="font-bold">Hành động</Typography>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredList.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4">{item.id}</td>
                <td className="p-4 font-medium">{item.name}</td>
                <td className="p-4 text-sm text-gray-600">{item.description}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: item.colorCode || "#000000" }}
                    ></div>
                    <span className="text-xs text-gray-500">{item.colorCode}</span>
                  </div>
                </td>
                <td className="p-4 text-sm">{item.lineStyle}</td>
                <td className="p-4">
                  <Chip
                    variant="ghost"
                    size="sm"
                    value={item.active ? "Hoạt động" : "Không hoạt động"}
                    color={item.active ? "green" : "blue-gray"}
                    className="w-fit"
                  />
                </td>
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
              </tr>
            ))}
            {filteredList.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  Không tìm thấy dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Create Modal */}
      <Dialog open={openCreate} handler={() => setOpenCreate(!openCreate)} size="sm">
        <DialogHeader>Thêm mới Loại cáp</DialogHeader>
        <Formik
          initialValues={{ name: "", description: "", colorCode: "#000000", lineStyle: "solid", active: true }}
          validationSchema={validationSchema}
          onSubmit={handleCreate}
        >
          {({ errors, touched, values, setFieldValue }) => (
            <Form>
              <DialogBody>
                <div className="flex flex-col gap-4">
                  <div>
                    <Field name="name">
                      {({ field }) => (
                        <Input {...field} label="Tên loại cáp" error={touched.name && Boolean(errors.name)} />
                      )}
                    </Field>
                    <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                  <div>
                    <Field name="description">
                      {({ field }) => (
                        <Textarea {...field} label="Mô tả" />
                      )}
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Màu sắc</label>
                      <div className="flex items-center gap-2">
                        <Field name="colorCode" type="color" className="h-10 w-14 p-0 border-0" />
                        <span className="text-sm">{values.colorCode}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Kiểu đường</label>
                      <Field
                        as="select"
                        name="lineStyle"
                        className="w-full p-2 border border-blue-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="solid">Solid (Nét liền)</option>
                        <option value="dashed">Dashed (Nét đứt)</option>
                        <option value="dotted">Dotted (Nét chấm)</option>
                      </Field>
                    </div>
                  </div>
                  <div>
                    <Switch
                      label="Hoạt động"
                      checked={values.active}
                      onChange={(e) => setFieldValue("active", e.target.checked)}
                      color="green"
                    />
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
      <Dialog open={openEdit} handler={() => setOpenEdit(!openEdit)} size="sm">
        <DialogHeader>Cập nhật Loại cáp</DialogHeader>
        {selectedItem && (
          <Formik
            initialValues={{
              name: selectedItem.name,
              description: selectedItem.description || "",
              colorCode: selectedItem.colorCode || "#000000",
              lineStyle: selectedItem.lineStyle || "solid",
              active: selectedItem.active
            }}
            validationSchema={validationSchema}
            onSubmit={handleUpdate}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <DialogBody>
                  <div className="flex flex-col gap-4">
                    <div>
                      <Field name="name">
                        {({ field }) => (
                          <Input {...field} label="Tên loại cáp" error={touched.name && Boolean(errors.name)} />
                        )}
                      </Field>
                      <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                    <div>
                      <Field name="description">
                        {({ field }) => (
                          <Textarea {...field} label="Mô tả" />
                        )}
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">Màu sắc</label>
                        <div className="flex items-center gap-2">
                          <Field name="colorCode" type="color" className="h-10 w-14 p-0 border-0" />
                          <span className="text-sm">{values.colorCode}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">Kiểu đường</label>
                        <Field
                          as="select"
                          name="lineStyle"
                          className="w-full p-2 border border-blue-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        >
                          <option value="solid">Solid (Nét liền)</option>
                          <option value="dashed">Dashed (Nét đứt)</option>
                          <option value="dotted">Dotted (Nét chấm)</option>
                        </Field>
                      </div>
                    </div>
                    <div>
                      <Switch
                        label="Hoạt động"
                        checked={values.active}
                        onChange={(e) => setFieldValue("active", e.target.checked)}
                        color="green"
                      />
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
          Bạn có chắc chắn muốn xóa loại cáp <b>{selectedItem?.name}</b> không?
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

export default FiberTypeList;