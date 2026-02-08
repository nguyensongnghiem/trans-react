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
    DialogBody,
    DialogFooter,
    Input,
    IconButton,
    Textarea,
} from "@material-tailwind/react";
import { toast } from "react-toastify";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import CustomButton from "../components/CustomButton";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAuth } from "../contexts/authContext";
import { jwtDecode } from "jwt-decode";

function TransmissionOwnerList() {
    const [items, setItems] = useState([]);
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
            isAdmin = roles.includes("ROLE_ADMIN");
        } catch (error) { }
    }

    const fetchData = async () => {
        try {
            const response = await axiosInstance.get("transmissionOwners");
            setItems(response.data);
        } catch (error) {
            toast.error("Lỗi khi tải dữ liệu");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (values, { resetForm }) => {
        try {
            await axiosInstance.post("transmissionOwners", values);
            toast.success("Thêm mới thành công");
            fetchData();
            setOpenCreate(false);
            resetForm();
        } catch (error) {
            toast.error("Lỗi khi thêm mới");
        }
    };

    const handleUpdate = async (values) => {
        try {
            await axiosInstance.put(`transmissionOwners/${selectedItem.id}`, values);
            toast.success("Cập nhật thành công");
            fetchData();
            setOpenEdit(false);
            setSelectedItem(null);
        } catch (error) {
            toast.error("Lỗi khi cập nhật");
        }
    };

    const handleDelete = async () => {
        try {
            await axiosInstance.delete(`transmissionOwners/${selectedItem.id}`);
            toast.success("Xóa thành công");
            fetchData();
            setOpenDelete(false);
            setSelectedItem(null);
        } catch (error) {
            toast.error("Lỗi khi xóa (có thể đang được sử dụng)");
        }
    };

    const filteredList = items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.alias && item.alias.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const validationSchema = Yup.object({
        name: Yup.string().required("Tên đơn vị là bắt buộc"),
        alias: Yup.string().required("Tên viết tắt là bắt buộc"),
        email: Yup.string().email("Email không hợp lệ"),
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Đơn vị truyền dẫn</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Tổng số: <span className="font-semibold text-blue-600">{filteredList.length}</span> đơn vị
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

            <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-200">
                <Input
                    label="Tìm kiếm theo tên hoặc viết tắt"
                    icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Card className="w-full overflow-hidden border border-gray-200 shadow-sm rounded-xl">
                <table className="w-full min-w-max table-auto text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">STT</Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Tên đơn vị</Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Mã số thuế</Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Liên hệ</Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Địa chỉ</Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Ghi chú</Typography>
                            </th>
                            {isAdmin && (
                                <th className="p-4 w-32 text-center">
                                    <Typography variant="small" color="blue-gray" className="font-bold">Hành động</Typography>
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredList.map((item, index) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="p-4">
                                    <Typography variant="small" color="blue-gray">{index + 1}</Typography>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <Typography variant="small" color="blue-gray" className="font-medium">{item.name}</Typography>
                                        <Typography variant="small" color="gray" className="text-xs opacity-70">{item.alias}</Typography>
                                    </div>
                                </td>
                                <td className="p-4 text-sm">{item.taxCode}</td>
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        {item.contactPerson && <Typography variant="small" color="blue-gray" className="font-medium text-xs">{item.contactPerson}</Typography>}
                                        {item.phoneNumber && <Typography variant="small" color="gray" className="text-[10px]">{item.phoneNumber}</Typography>}
                                        {item.email && <Typography variant="small" color="blue" className="text-[10px]">{item.email}</Typography>}
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={item.address}>{item.address}</td>
                                <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={item.note}>{item.note}</td>
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
                    </tbody>
                </table>
            </Card>

            {/* Create Modal */}
            <Dialog
                open={openCreate}
                handler={() => setOpenCreate(false)}
                size="md"
                className="rounded-lg overflow-hidden shadow-xl"
            >
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <div>
                        <Typography variant="h5" color="blue-gray" className="font-semibold text-gray-900">
                            Thêm mới Đơn vị truyền dẫn
                        </Typography>
                        <Typography className="text-xs font-normal text-gray-500 mt-0.5">
                            Thêm đơn vị sở hữu hạ tầng truyền dẫn
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
                    initialValues={{ name: "", alias: "", note: "", address: "", taxCode: "", contactPerson: "", phoneNumber: "", email: "" }}
                    validationSchema={validationSchema}
                    onSubmit={handleCreate}
                >
                    {({ errors, touched, handleSubmit }) => (
                        <Form onSubmit={handleSubmit}>
                            <DialogBody className="p-6 space-y-4 text-blue-gray-700">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2 space-y-1">
                                        <Typography variant="small" color="blue-gray" className="font-bold">Tên đơn vị</Typography>
                                        <Field name="name">
                                            {({ field }) => <Input {...field} size="lg" className="!border-t-blue-gray-200 focus:!border-blue-500" labelProps={{ className: "before:content-none after:content-none" }} error={touched.name && Boolean(errors.name)} />}
                                        </Field>
                                        <ErrorMessage name="name" component="div" className="text-red-500 text-[10px] font-medium mt-1 ml-1" />
                                    </div>
                                    <div className="space-y-1">
                                        <Typography variant="small" color="blue-gray" className="font-bold">Viết tắt (Alias)</Typography>
                                        <Field name="alias">
                                            {({ field }) => <Input {...field} size="lg" className="!border-t-blue-gray-200 focus:!border-blue-500" labelProps={{ className: "before:content-none after:content-none" }} error={touched.alias && Boolean(errors.alias)} />}
                                        </Field>
                                        <ErrorMessage name="alias" component="div" className="text-red-500 text-[10px] font-medium mt-1 ml-1" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Typography variant="small" color="blue-gray" className="font-bold">Mã số thuế</Typography>
                                        <Field name="taxCode">
                                            {({ field }) => <Input {...field} size="lg" className="!border-t-blue-gray-200 focus:!border-blue-500" labelProps={{ className: "before:content-none after:content-none" }} />}
                                        </Field>
                                    </div>
                                    <div className="space-y-1">
                                        <Typography variant="small" color="blue-gray" className="font-bold">Người liên hệ</Typography>
                                        <Field name="contactPerson">
                                            {({ field }) => <Input {...field} size="lg" className="!border-t-blue-gray-200 focus:!border-blue-500" labelProps={{ className: "before:content-none after:content-none" }} />}
                                        </Field>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Typography variant="small" color="blue-gray" className="font-bold">Số điện thoại</Typography>
                                        <Field name="phoneNumber">
                                            {({ field }) => <Input {...field} size="lg" className="!border-t-blue-gray-200 focus:!border-blue-500" labelProps={{ className: "before:content-none after:content-none" }} />}
                                        </Field>
                                    </div>
                                    <div className="space-y-1">
                                        <Typography variant="small" color="blue-gray" className="font-bold">Email</Typography>
                                        <Field name="email">
                                            {({ field }) => <Input {...field} size="lg" className="!border-t-blue-gray-200 focus:!border-blue-500" labelProps={{ className: "before:content-none after:content-none" }} error={touched.email && Boolean(errors.email)} />}
                                        </Field>
                                        <ErrorMessage name="email" component="div" className="text-red-500 text-[10px] font-medium mt-1 ml-1" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Typography variant="small" color="blue-gray" className="font-bold">Địa chỉ</Typography>
                                    <Field name="address">
                                        {({ field }) => <Input {...field} size="lg" className="!border-t-blue-gray-200 focus:!border-blue-500" labelProps={{ className: "before:content-none after:content-none" }} />}
                                    </Field>
                                </div>

                                <div className="space-y-1">
                                    <Typography variant="small" color="blue-gray" className="font-bold">Ghi chú</Typography>
                                    <Field name="note">
                                        {({ field }) => <Textarea {...field} size="lg" className="!border-t-blue-gray-200 focus:!border-blue-500" labelProps={{ className: "before:content-none after:content-none" }} />}
                                    </Field>
                                </div>
                            </DialogBody>
                            <DialogFooter className="bg-gray-50 px-4 py-3 gap-2 border-t border-gray-100">
                                <CustomButton variant="text" color="blue-gray" onClick={() => setOpenCreate(false)} size="sm">Hủy bỏ</CustomButton>
                                <CustomButton type="submit" size="sm" className="bg-[#0d47a1] hover:bg-[#0a3a82] shadow-md shadow-blue-500/20">Lưu thông tin</CustomButton>
                            </DialogFooter>
                        </Form>
                    )}
                </Formik>
            </Dialog>

            {/* Edit Modal */}
            <Dialog
                open={openEdit}
                handler={() => setOpenEdit(false)}
                size="md"
                className="rounded-lg overflow-hidden shadow-xl"
            >
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <div>
                        <Typography variant="h5" color="blue-gray" className="font-semibold text-gray-900">
                            Cập nhật Đơn vị truyền dẫn
                        </Typography>
                        <Typography className="text-xs font-normal text-gray-500 mt-0.5">
                            Chỉnh sửa thông tin đơn vị #{selectedItem?.id}
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
                            alias: selectedItem.alias || "",
                            note: selectedItem.note || "",
                            address: selectedItem.address || "",
                            taxCode: selectedItem.taxCode || "",
                            contactPerson: selectedItem.contactPerson || "",
                            phoneNumber: selectedItem.phoneNumber || "",
                            email: selectedItem.email || ""
                        }}
                        validationSchema={validationSchema}
                        onSubmit={handleUpdate}
                    >
                        {({ errors, touched, handleSubmit }) => (
                            <Form onSubmit={handleSubmit}>
                                <DialogBody className="p-6 space-y-4 text-blue-gray-700">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2 space-y-1">
                                            <Typography variant="small" color="blue-gray" className="font-bold">Tên đơn vị</Typography>
                                            <Field name="name">
                                                {({ field }) => <Input {...field} size="lg" className="!border-t-blue-gray-200 focus:!border-blue-500" labelProps={{ className: "before:content-none after:content-none" }} error={touched.name && Boolean(errors.name)} />}
                                            </Field>
                                            <ErrorMessage name="name" component="div" className="text-red-500 text-[10px] font-medium mt-1 ml-1" />
                                        </div>
                                        <div className="space-y-1">
                                            <Typography variant="small" color="blue-gray" className="font-bold">Viết tắt (Alias)</Typography>
                                            <Field name="alias">
                                                {({ field }) => <Input {...field} size="lg" className="!border-t-blue-gray-200 focus:!border-blue-500" labelProps={{ className: "before:content-none after:content-none" }} error={touched.alias && Boolean(errors.alias)} />}
                                            </Field>
                                            <ErrorMessage name="alias" component="div" className="text-red-500 text-[10px] font-medium mt-1 ml-1" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Typography variant="small" color="blue-gray" className="font-bold">Mã số thuế</Typography>
                                            <Field name="taxCode">
                                                {({ field }) => <Input {...field} size="lg" className="!border-t-blue-gray-200 focus:!border-blue-500" labelProps={{ className: "before:content-none after:content-none" }} />}
                                            </Field>
                                        </div>
                                        <div className="space-y-1">
                                            <Typography variant="small" color="blue-gray" className="font-bold">Người liên hệ</Typography>
                                            <Field name="contactPerson">
                                                {({ field }) => <Input {...field} size="lg" className="!border-t-blue-gray-200 focus:!border-blue-500" labelProps={{ className: "before:content-none after:content-none" }} />}
                                            </Field>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Typography variant="small" color="blue-gray" className="font-bold">Số điện thoại</Typography>
                                            <Field name="phoneNumber">
                                                {({ field }) => <Input {...field} size="lg" className="!border-t-blue-gray-200 focus:!border-blue-500" labelProps={{ className: "before:content-none after:content-none" }} />}
                                            </Field>
                                        </div>
                                        <div className="space-y-1">
                                            <Typography variant="small" color="blue-gray" className="font-bold">Email</Typography>
                                            <Field name="email">
                                                {({ field }) => <Input {...field} size="lg" className="!border-t-blue-gray-200 focus:!border-blue-500" labelProps={{ className: "before:content-none after:content-none" }} error={touched.email && Boolean(errors.email)} />}
                                            </Field>
                                            <ErrorMessage name="email" component="div" className="text-red-500 text-[10px] font-medium mt-1 ml-1" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Typography variant="small" color="blue-gray" className="font-bold">Địa chỉ</Typography>
                                        <Field name="address">
                                            {({ field }) => <Input {...field} size="lg" className="!border-t-blue-gray-200 focus:!border-blue-500" labelProps={{ className: "before:content-none after:content-none" }} />}
                                        </Field>
                                    </div>

                                    <div className="space-y-1">
                                        <Typography variant="small" color="blue-gray" className="font-bold">Ghi chú</Typography>
                                        <Field name="note">
                                            {({ field }) => <Textarea {...field} size="lg" className="!border-t-blue-gray-200 focus:!border-blue-500" labelProps={{ className: "before:content-none after:content-none" }} />}
                                        </Field>
                                    </div>
                                </DialogBody>
                                <DialogFooter className="bg-gray-50 px-4 py-3 gap-2 border-t border-gray-100">
                                    <CustomButton variant="text" color="blue-gray" onClick={() => setOpenEdit(false)} size="sm">Hủy bỏ</CustomButton>
                                    <CustomButton type="submit" size="sm" className="bg-[#0d47a1] hover:bg-[#0a3a82] shadow-md shadow-blue-500/20 flex items-center gap-2">
                                        <PencilIcon className="h-4 w-4" /> Cập nhật
                                    </CustomButton>
                                </DialogFooter>
                            </Form>
                        )}
                    </Formik>
                )}
            </Dialog>

            {/* Delete Modal */}
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
                    <Typography variant="h5" color="red" className="font-semibold">Xác nhận xóa</Typography>
                    <IconButton size="sm" variant="text" className="!absolute right-3.5 top-3.5 text-gray-500 hover:bg-gray-200 rounded-full" onClick={() => setOpenDelete(false)}>
                        <XMarkIcon className="h-5 w-5" />
                    </IconButton>
                </div>
                <DialogBody className="p-6 text-blue-gray-700">
                    <Typography variant="paragraph" color="blue-gray" className="font-medium">
                        Bạn có chắc chắn muốn xóa đơn vị <b>{selectedItem?.name}</b>?
                    </Typography>
                    <Typography variant="small" color="gray" className="mt-3 italic">
                        Dữ liệu sẽ bị xóa vĩnh viễn và không thể phục hồi.
                    </Typography>
                </DialogBody>
                <DialogFooter className="bg-gray-50 px-4 py-3 gap-2 border-t border-gray-200">
                    <CustomButton variant="text" color="blue-gray" onClick={() => setOpenDelete(false)} size="sm">Hủy bỏ</CustomButton>
                    <Button color="red" onClick={handleDelete} size="sm" className="flex items-center gap-2 shadow-md shadow-red-500/20 bg-red-600 hover:bg-red-700">
                        <TrashIcon className="h-4 w-4" /> Xác nhận xóa
                    </Button>
                </DialogFooter>
            </Dialog>
        </div>
    );
}

export default TransmissionOwnerList;