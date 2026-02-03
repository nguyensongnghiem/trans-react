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
import { format } from "date-fns";

function MicrowaveLicenseList() {
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
            const response = await axiosInstance.get("microwave-licenses");
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
            await axiosInstance.post("microwave-licenses", values);
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
            await axiosInstance.put(`microwave-licenses/${selectedItem.id}`, values);
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
            await axiosInstance.delete(`microwave-licenses/${selectedItem.id}`);
            toast.success("Xóa thành công");
            fetchData();
            setOpenDelete(false);
            setSelectedItem(null);
        } catch (error) {
            toast.error("Lỗi khi xóa (có thể đang được sử dụng)");
        }
    };

    const filteredList = items.filter((item) =>
        item.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const validationSchema = Yup.object({
        licenseNumber: Yup.string().required("Số giấy phép là bắt buộc"),
        issueDate: Yup.date().required("Ngày cấp là bắt buộc"),
        expiryDate: Yup.date().required("Ngày hết hạn là bắt buộc").min(Yup.ref('issueDate'), "Ngày hết hạn phải sau ngày cấp"),
        frequencyBand: Yup.string().required("Băng tần là bắt buộc"),
        frequencyQuantity: Yup.number().required("Số lượng tần số là bắt buộc").min(1, "Phải lớn hơn 0"),
    });

    const formatDateLabel = (dateString) => {
        if (!dateString) return "-";
        try {
            return format(new Date(dateString), "dd/MM/yyyy");
        } catch (error) {
            return dateString;
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Giấy phép Viba</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Tổng số: <span className="font-semibold text-blue-600">{filteredList.length}</span> giấy phép
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
                    label="Tìm kiếm theo số giấy phép"
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
                                <Typography variant="small" color="blue-gray" className="font-bold">Số GP</Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Ngày cấp</Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Ngày hết hạn</Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Băng tần</Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Số lượng TS</Typography>
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
                                <td className="p-4 font-medium">{item.licenseNumber}</td>
                                <td className="p-4">{formatDateLabel(item.issueDate)}</td>
                                <td className="p-4">{formatDateLabel(item.expiryDate)}</td>
                                <td className="p-4">{item.frequencyBand}</td>
                                <td className="p-4">{item.frequencyQuantity}</td>
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
            <Dialog open={openCreate} handler={() => setOpenCreate(!openCreate)} size="md">
                <DialogHeader>Thêm mới Giấy phép Viba</DialogHeader>
                <Formik
                    initialValues={{
                        licenseNumber: "",
                        issueDate: "",
                        expiryDate: "",
                        frequencyBand: "",
                        frequencyQuantity: 1
                    }}
                    validationSchema={validationSchema}
                    onSubmit={handleCreate}
                >
                    {({ errors, touched, setFieldValue }) => (
                        <Form className="grid gap-4 p-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Field name="licenseNumber">
                                        {({ field }) => (
                                            <Input {...field} label="Số giấy phép" error={touched.licenseNumber && Boolean(errors.licenseNumber)} />
                                        )}
                                    </Field>
                                    <ErrorMessage name="licenseNumber" component="div" className="text-red-500 text-xs mt-1" />
                                </div>
                                <div>
                                    <Field name="frequencyBand">
                                        {({ field }) => (
                                            <Input {...field} label="Băng tần" error={touched.frequencyBand && Boolean(errors.frequencyBand)} />
                                        )}
                                    </Field>
                                    <ErrorMessage name="frequencyBand" component="div" className="text-red-500 text-xs mt-1" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Field name="issueDate">
                                        {({ field }) => (
                                            <Input {...field} type="date" label="Ngày cấp" error={touched.issueDate && Boolean(errors.issueDate)} />
                                        )}
                                    </Field>
                                    <ErrorMessage name="issueDate" component="div" className="text-red-500 text-xs mt-1" />
                                </div>
                                <div>
                                    <Field name="expiryDate">
                                        {({ field }) => (
                                            <Input {...field} type="date" label="Ngày hết hạn" error={touched.expiryDate && Boolean(errors.expiryDate)} />
                                        )}
                                    </Field>
                                    <ErrorMessage name="expiryDate" component="div" className="text-red-500 text-xs mt-1" />
                                </div>
                            </div>
                            <div>
                                <Field name="frequencyQuantity">
                                    {({ field }) => (
                                        <Input {...field} type="number" label="Số lượng tần số" error={touched.frequencyQuantity && Boolean(errors.frequencyQuantity)} />
                                    )}
                                </Field>
                                <ErrorMessage name="frequencyQuantity" component="div" className="text-red-500 text-xs mt-1" />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="text" onClick={() => setOpenCreate(false)}>Hủy</Button>
                                <CustomButton type="submit">Lưu</CustomButton>
                            </div>
                        </Form>
                    )}
                </Formik>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={openEdit} handler={() => setOpenEdit(!openEdit)} size="md">
                <DialogHeader>Cập nhật Giấy phép Viba</DialogHeader>
                {selectedItem && (
                    <Formik
                        initialValues={{
                            licenseNumber: selectedItem.licenseNumber,
                            issueDate: selectedItem.issueDate ? selectedItem.issueDate.split('T')[0] : "",
                            expiryDate: selectedItem.expiryDate ? selectedItem.expiryDate.split('T')[0] : "",
                            frequencyBand: selectedItem.frequencyBand,
                            frequencyQuantity: selectedItem.frequencyQuantity
                        }}
                        validationSchema={validationSchema}
                        onSubmit={handleUpdate}
                    >
                        {({ errors, touched }) => (
                            <Form className="grid gap-4 p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Field name="licenseNumber">
                                            {({ field }) => (
                                                <Input {...field} label="Số giấy phép" error={touched.licenseNumber && Boolean(errors.licenseNumber)} />
                                            )}
                                        </Field>
                                        <ErrorMessage name="licenseNumber" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                    <div>
                                        <Field name="frequencyBand">
                                            {({ field }) => (
                                                <Input {...field} label="Băng tần" error={touched.frequencyBand && Boolean(errors.frequencyBand)} />
                                            )}
                                        </Field>
                                        <ErrorMessage name="frequencyBand" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Field name="issueDate">
                                            {({ field }) => (
                                                <Input {...field} type="date" label="Ngày cấp" error={touched.issueDate && Boolean(errors.issueDate)} />
                                            )}
                                        </Field>
                                        <ErrorMessage name="issueDate" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                    <div>
                                        <Field name="expiryDate">
                                            {({ field }) => (
                                                <Input {...field} type="date" label="Ngày hết hạn" error={touched.expiryDate && Boolean(errors.expiryDate)} />
                                            )}
                                        </Field>
                                        <ErrorMessage name="expiryDate" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                </div>
                                <div>
                                    <Field name="frequencyQuantity">
                                        {({ field }) => (
                                            <Input {...field} type="number" label="Số lượng tần số" error={touched.frequencyQuantity && Boolean(errors.frequencyQuantity)} />
                                        )}
                                    </Field>
                                    <ErrorMessage name="frequencyQuantity" component="div" className="text-red-500 text-xs mt-1" />
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="text" onClick={() => setOpenEdit(false)}>Hủy</Button>
                                    <CustomButton type="submit">Cập nhật</CustomButton>
                                </div>
                            </Form>
                        )}
                    </Formik>
                )}
            </Dialog>

            {/* Delete Modal */}
            <Dialog open={openDelete} handler={() => setOpenDelete(!openDelete)} size="xs">
                <DialogHeader>Xác nhận xóa</DialogHeader>
                <DialogBody>
                    Bạn có chắc muốn xóa giấy phép số <b>{selectedItem?.licenseNumber}</b>?
                </DialogBody>
                <DialogFooter>
                    <Button variant="text" onClick={() => setOpenDelete(false)} className="mr-2">Hủy</Button>
                    <Button color="red" onClick={handleDelete}>Xóa</Button>
                </DialogFooter>
            </Dialog>
        </div>
    );
}

export default MicrowaveLicenseList;
