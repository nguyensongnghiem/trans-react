import { useEffect, useState } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
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

      <Dialog
        open={openCreate}
        handler={() => setOpenCreate(false)}
        size="sm"
        className="rounded-lg overflow-hidden shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <Typography variant="h5" color="blue-gray" className="font-semibold text-gray-900">
              Thêm mới Loại cáp
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Nhập thông tin loại cáp quang mới
            </Typography>
          </div>
          <IconButton
            size="sm"
            variant="text"
            className="text-gray-500 hover:bg-gray-200 rounded-full"
            onClick={() => setOpenCreate(false)}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>
        <Formik
          initialValues={{ name: "", description: "", colorCode: "#000000", lineStyle: "solid", active: true }}
          validationSchema={validationSchema}
          onSubmit={handleCreate}
        >
          {({ errors, touched, values, setFieldValue, handleSubmit }) => (
            <Form onSubmit={handleSubmit}>
              <DialogBody className="p-6 space-y-4 text-blue-gray-700">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Typography variant="small" color="blue-gray" className="font-bold">
                      Tên loại cáp
                    </Typography>
                    <Field name="name">
                      {({ field }) => (
                        <Input
                          {...field}
                          size="lg"
                          className="!border-t-blue-gray-200 focus:!border-blue-500"
                          labelProps={{
                            className: "before:content-none after:content-none",
                          }}
                          placeholder="Nhập tên loại cáp..."
                          error={touched.name && Boolean(errors.name)}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="name" component="div" className="text-red-500 text-[10px] font-medium mt-1 ml-1" />
                  </div>
                  <div className="space-y-1">
                    <Typography variant="small" color="blue-gray" className="font-bold">
                      Mô tả
                    </Typography>
                    <Field name="description">
                      {({ field }) => (
                        <Textarea
                          {...field}
                          rows={3}
                          className="!border-t-blue-gray-200 focus:!border-blue-500"
                          labelProps={{
                            className: "before:content-none after:content-none",
                          }}
                          placeholder="Mô tả chi tiết..."
                        />
                      )}
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Typography variant="small" color="blue-gray" className="font-bold">
                        Màu sắc
                      </Typography>
                      <div className="flex items-center gap-2 p-2 border border-blue-gray-200 rounded-lg">
                        <Field name="colorCode" type="color" className="h-8 w-14 p-0 border-0 bg-transparent cursor-pointer" />
                        <span className="text-sm font-medium">{values.colorCode}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Typography variant="small" color="blue-gray" className="font-bold">
                        Kiểu đường
                      </Typography>
                      <Field
                        as="select"
                        name="lineStyle"
                        className="w-full p-2.5 border border-blue-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                      >
                        <option value="solid">Solid (Nét liền)</option>
                        <option value="dashed">Dashed (Nét đứt)</option>
                        <option value="dotted">Dotted (Nét chấm)</option>
                      </Field>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Switch
                      label={<Typography color="blue-gray" className="font-medium text-sm ml-2">Trạng thái hoạt động</Typography>}
                      checked={values.active}
                      onChange={(e) => setFieldValue("active", e.target.checked)}
                      color="blue"
                    />
                  </div>
                </div>
              </DialogBody>
              <DialogFooter className="bg-gray-50 px-4 py-3 gap-2 border-t border-gray-100">
                <CustomButton variant="text" color="blue-gray" onClick={() => setOpenCreate(false)} size="sm">
                  Hủy bỏ
                </CustomButton>
                <CustomButton
                  type="submit"
                  size="sm"
                  className="bg-[#0d47a1] hover:bg-[#0a3a82] shadow-md shadow-blue-500/20"
                >
                  Lưu thông tin
                </CustomButton>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </Dialog>

      <Dialog
        open={openEdit}
        handler={() => setOpenEdit(false)}
        size="sm"
        className="rounded-lg overflow-hidden shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <Typography variant="h5" color="blue-gray" className="font-semibold text-gray-900">
              Cập nhật Loại cáp
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Chỉnh sửa thông tin loại cáp quang #{selectedItem?.id}
            </Typography>
          </div>
          <IconButton
            size="sm"
            variant="text"
            className="text-gray-500 hover:bg-gray-200 rounded-full"
            onClick={() => setOpenEdit(false)}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>
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
            {({ errors, touched, values, setFieldValue, handleSubmit }) => (
              <Form onSubmit={handleSubmit}>
                <DialogBody className="p-6 space-y-4 text-blue-gray-700">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Typography variant="small" color="blue-gray" className="font-bold">
                        Tên loại cáp
                      </Typography>
                      <Field name="name">
                        {({ field }) => (
                          <Input
                            {...field}
                            size="lg"
                            className="!border-t-blue-gray-200 focus:!border-blue-500"
                            labelProps={{
                              className: "before:content-none after:content-none",
                            }}
                            error={touched.name && Boolean(errors.name)}
                          />
                        )}
                      </Field>
                      <ErrorMessage name="name" component="div" className="text-red-500 text-[10px] font-medium mt-1 ml-1" />
                    </div>
                    <div className="space-y-1">
                      <Typography variant="small" color="blue-gray" className="font-bold">
                        Mô tả
                      </Typography>
                      <Field name="description">
                        {({ field }) => (
                          <Textarea
                            {...field}
                            rows={3}
                            className="!border-t-blue-gray-200 focus:!border-blue-500"
                            labelProps={{
                              className: "before:content-none after:content-none",
                            }}
                          />
                        )}
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Typography variant="small" color="blue-gray" className="font-bold">
                          Màu sắc
                        </Typography>
                        <div className="flex items-center gap-2 p-2 border border-blue-gray-200 rounded-lg">
                          <Field name="colorCode" type="color" className="h-8 w-14 p-0 border-0 bg-transparent cursor-pointer" />
                          <span className="text-sm font-medium">{values.colorCode}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Typography variant="small" color="blue-gray" className="font-bold">
                          Kiểu đường
                        </Typography>
                        <Field
                          as="select"
                          name="lineStyle"
                          className="w-full p-2.5 border border-blue-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                        >
                          <option value="solid">Solid (Nét liền)</option>
                          <option value="dashed">Dashed (Nét đứt)</option>
                          <option value="dotted">Dotted (Nét chấm)</option>
                        </Field>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Switch
                        label={<Typography color="blue-gray" className="font-medium text-sm ml-2">Trạng thái hoạt động</Typography>}
                        checked={values.active}
                        onChange={(e) => setFieldValue("active", e.target.checked)}
                        color="blue"
                      />
                    </div>
                  </div>
                </DialogBody>
                <DialogFooter className="bg-gray-50 px-4 py-3 gap-2 border-t border-gray-100">
                  <CustomButton variant="text" color="blue-gray" onClick={() => setOpenEdit(false)} size="sm">
                    Hủy bỏ
                  </CustomButton>
                  <CustomButton
                    type="submit"
                    size="sm"
                    className="bg-[#0d47a1] hover:bg-[#0a3a82] shadow-md shadow-blue-500/20 flex items-center gap-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Cập nhật
                  </CustomButton>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        )}
      </Dialog>

      <Dialog
        open={openDelete}
        handler={() => setOpenDelete(false)}
        size="xs"
        className="rounded-lg overflow-hidden shadow-xl"
      >
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
        <DialogBody className="p-6 text-blue-gray-700">
          <Typography variant="paragraph" color="blue-gray" className="font-medium">
            Bạn có chắc chắn muốn xóa loại cáp <b>{selectedItem?.name}</b> không?
          </Typography>
          <Typography variant="small" color="gray" className="mt-3 italic">
            Dữ liệu sẽ bị xóa vĩnh viễn và không thể phục hồi.
          </Typography>
        </DialogBody>
        <DialogFooter className="bg-gray-50 px-4 py-3 gap-2 border-t border-gray-200">
          <CustomButton variant="text" color="blue-gray" onClick={() => setOpenDelete(false)} size="sm">
            Hủy bỏ
          </CustomButton>
          <Button
            color="red"
            onClick={handleDelete}
            size="sm"
            className="flex items-center gap-2 shadow-md shadow-red-500/20 bg-red-600 hover:bg-red-700"
          >
            <TrashIcon className="h-4 w-4" />
            Xác nhận xóa
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default FiberTypeList;