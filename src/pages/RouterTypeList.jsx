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
import FormSelect from "../components/FormSelect";
import { getVendors } from "../services/VendorService";

function RouterTypeList() {
    const [items, setItems] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const axiosInstance = useAxiosPrivate();

    const fetchData = async () => {
        try {
            const [typesRes, vendorsRes] = await Promise.all([
                axiosInstance.get("router-types"),
                getVendors(axiosInstance)
            ]);
            setItems(typesRes.data);
            setVendors(vendorsRes);
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Lỗi khi tải dữ liệu");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (values, { resetForm }) => {
        try {
            await axiosInstance.post("router-types", values);
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
            await axiosInstance.put(`router-types/${selectedItem.id}`, values);
            toast.success("Cập nhật thành công");
            fetchData();
            setOpenEdit(false);
            setSelectedItem(null);
        } catch (error) {
            toast.error("Lỗi khi cập nhật");
        }
    };

    const handleDelete = async () => {
        if (!selectedItem) return;
        try {
            await axiosInstance.delete(`router-types/${selectedItem.id}`);
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
        item.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const validationSchema = Yup.object({
        name: Yup.string().required("Tên loại Router là bắt buộc"),
        vendor: Yup.object({
            id: Yup.number().required("Nhà sản xuất là bắt buộc"),
        }).required(),
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Quản lý Loại thiết bị Router
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
                    label="Tìm kiếm theo tên hoặc nhà sản xuất"
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
                                <Typography variant="small" color="blue-gray" className="font-bold">Tên loại Router</Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Nhà sản xuất (Vendor)</Typography>
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
                                <td className="p-4">{item.vendor?.name || "-"}</td>
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
                                <td colSpan={4} className="p-4 text-center text-gray-500">
                                    Không tìm thấy dữ liệu
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>

            {/* Create Modal */}
            <Dialog open={openCreate} handler={() => setOpenCreate(!openCreate)} size="sm">
                <DialogHeader>Thêm mới Loại Router</DialogHeader>
                <Formik
                    initialValues={{ name: "", vendor: { id: "" } }}
                    validationSchema={validationSchema}
                    onSubmit={handleCreate}
                >
                    {({ errors, touched }) => (
                        <Form>
                            <DialogBody>
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <Field name="name">
                                            {({ field }) => (
                                                <Input {...field} label="Tên loại Router" error={touched.name && Boolean(errors.name)} />
                                            )}
                                        </Field>
                                        <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                    <div>
                                        <FormSelect
                                            label="Nhà sản xuất"
                                            name="vendor.id"
                                            options={vendors}
                                            getOptionLabel={(option) => option.name}
                                            getOptionValue={(option) => option.id}
                                            required
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
                <DialogHeader>Cập nhật Loại Router</DialogHeader>
                {selectedItem && (
                    <Formik
                        initialValues={{
                            name: selectedItem.name,
                            vendor: { id: selectedItem.vendor?.id || "" }
                        }}
                        validationSchema={validationSchema}
                        onSubmit={handleUpdate}
                    >
                        {({ errors, touched }) => (
                            <Form>
                                <DialogBody>
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <Field name="name">
                                                {({ field }) => (
                                                    <Input {...field} label="Tên loại Router" error={touched.name && Boolean(errors.name)} />
                                                )}
                                            </Field>
                                            <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                                        </div>
                                        <div>
                                            <FormSelect
                                                label="Nhà sản xuất"
                                                name="vendor.id"
                                                options={vendors}
                                                getOptionLabel={(option) => option.name}
                                                getOptionValue={(option) => option.id}
                                                required
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
                    Bạn có chắc chắn muốn xóa loại Router <b>{selectedItem?.name}</b> không?
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

export default RouterTypeList;
