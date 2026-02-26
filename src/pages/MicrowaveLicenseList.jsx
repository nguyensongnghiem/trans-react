import { useEffect, useState, useMemo } from "react";
import {
    PencilIcon,
    TrashIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    ArrowUpTrayIcon,
    ArrowDownTrayIcon,
    CheckCircleIcon,
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
    Chip,
} from "@material-tailwind/react";
import { toast } from "react-toastify";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import CustomButton from "../components/CustomButton";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAuth } from "../contexts/authContext";
import { jwtDecode } from "jwt-decode";
import { format } from "date-fns";
import useMicrowaveLicenses from "../hooks/useMicrowaveLicenses";
import useSimpleSites from "../hooks/useSimpleSites";
import FormSelect from "../components/FormSelect";
import StatusBadge from "../components/StatusBadge";

const mapFormToRequest = (values) => {
    // Destructure to remove nested objects that shouldn't be in the request
    const { nearSite, farSite, mwLine, ...rest } = values;

    return {
        ...rest,
        mwLineId: mwLine?.id || values.mwLineId,
        nearSiteId: nearSite?.id || values.nearSiteId,
        farSiteId: farSite?.id || values.farSiteId,
        nearSiteFrequencies: values.nearSiteFrequencies?.filter(f => f !== null && f !== "").map(Number),
        farSiteFrequencies: values.farSiteFrequencies?.filter(f => f !== null && f !== "").map(Number),
    };
};

function MicrowaveLicenseList() {
    const axiosInstance = useAxiosPrivate();
    const { simpleSites: siteList } = useSimpleSites();
    const {
        licenses: items,
        isLoading,
        createLicense,
        updateLicense,
        deleteLicense,
    } = useMicrowaveLicenses();

    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const { auth } = useAuth();

    // Import State
    const [openImport, setOpenImport] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importErrors, setImportErrors] = useState(null);
    const [importResults, setImportResults] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    let isAdmin = false;
    if (auth?.accessToken) {
        try {
            const decoded = jwtDecode(auth.accessToken);
            const roles = decoded.roles || decoded.authorities || [];
            isAdmin = roles.includes("ROLE_ADMIN");
        } catch (error) { }
    }

    const handleCreate = async (values, { resetForm }) => {
        const request = mapFormToRequest(values);
        const success = await createLicense(request);
        if (success) {
            setOpenCreate(false);
            resetForm();
        }
    };

    const handleUpdate = async (values) => {
        const request = mapFormToRequest(values);
        const success = await updateLicense(selectedItem.id, request);
        if (success) {
            setOpenEdit(false);
            setSelectedItem(null);
        }
    };

    const handleDelete = async () => {
        const success = await deleteLicense(selectedItem.id);
        if (success) {
            setOpenDelete(false);
            setSelectedItem(null);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await axiosInstance.get(
                "microwave-licenses/import-excel/template",
                { responseType: "blob" }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "microwave-license-import-template.xlsx");
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Lỗi khi tải template");
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImportFile(file);
            setImportErrors(null);
            setImportResults(null);
        }
        e.target.value = null;
    };

    const handleCheckImport = async () => {
        if (!importFile) return;
        setIsChecking(true);
        setImportErrors(null);
        setImportResults(null);
        const formData = new FormData();
        formData.append("file", importFile);
        try {
            const res = await axiosInstance.post(
                "microwave-licenses/import-excel/check",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            setImportResults(res.data);
        } catch (error) {
            if (error.response?.status === 400) {
                setImportErrors(error.response.data);
            } else {
                toast.error("Lỗi khi kiểm tra file");
            }
        } finally {
            setIsChecking(false);
        }
    };

    const handleSaveImport = async () => {
        if (!importFile) return;
        setIsSaving(true);
        const formData = new FormData();
        formData.append("file", importFile);
        try {
            await axiosInstance.post("microwave-licenses/import-excel/save", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setOpenImport(false);
            setImportFile(null);
            setImportResults(null);
            window.location.reload();
        } catch (error) {
            toast.error("Lỗi khi lưu dữ liệu");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredList = items.filter((item) =>
        item.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const validationSchema = Yup.object().shape({
        licenseNumber: Yup.string().required("Số giấy phép là bắt buộc"),
        issueDate: Yup.date().required("Ngày cấp là bắt buộc"),
        expiryDate: Yup.date().required("Ngày hết hạn là bắt buộc").min(Yup.ref('issueDate'), "Ngày hết hạn phải sau ngày cấp"),
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
                <div className="flex gap-2">
                    {isAdmin && (
                        <>
                            <CustomButton
                                className="flex items-center gap-2 bg-[#0d47a1] hover:bg-[#0a3a82]"
                                size="sm"
                                onClick={() => setOpenCreate(true)}
                            >
                                <PlusIcon className="h-4 w-4" /> Thêm mới
                            </CustomButton>
                            <CustomButton
                                className="flex items-center gap-2 bg-[#e65100] hover:bg-[#bf360c]"
                                size="sm"
                                onClick={() => setOpenImport(true)}
                            >
                                <ArrowUpTrayIcon className="h-4 w-4" /> Import
                            </CustomButton>
                        </>
                    )}
                </div>
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
                                <Typography variant="small" color="blue-gray" className="font-bold">STT</Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Giấy phép</Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Site A</Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Site B</Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Số cặp tần số </Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Đã gán tuyến</Typography>
                            </th>
                            {isAdmin && (
                                <th className="p-4 w-32 text-center">
                                    <Typography variant="small" color="blue-gray" className="font-bold">Hành động</Typography>
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={isAdmin ? 8 : 7} className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                        <Typography variant="small" color="blue-gray">Đang tải dữ liệu...</Typography>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredList.length === 0 ? (
                            <tr>
                                <td colSpan={isAdmin ? 8 : 7} className="p-4 text-center">
                                    <Typography variant="small" color="blue-gray">Không tìm thấy dữ liệu</Typography>
                                </td>
                            </tr>
                        ) : filteredList.map((item, index) => {
                            const mwLineMatchesSites = item.mwLine && item.nearSite && item.farSite && (
                                (item.mwLine.nearSiteSiteId === item.nearSite.siteId && item.mwLine.farSiteSiteId === item.farSite.siteId) ||
                                (item.mwLine.nearSiteSiteId === item.farSite.siteId && item.mwLine.farSiteSiteId === item.nearSite.siteId)
                            );
                            return (
                                <tr key={item.id} className={mwLineMatchesSites ? "bg-green-50 hover:bg-green-100" : "hover:bg-gray-50"}>
                                    <td className="p-4">
                                        <Typography variant="small" color="blue-gray">{index + 1}</Typography>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <Typography variant="small" color="blue-gray" className="font-bold">
                                                {item.licenseNumber}
                                            </Typography>
                                            <div className="flex gap-2 text-[10px] text-gray-500">
                                                <span>Ngày cấp: {formatDateLabel(item.issueDate)}</span>
                                                <span>Ngày hết hạn: {formatDateLabel(item.expiryDate)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <Typography variant="small" color="blue-gray" className="font-medium">
                                                {item.nearSite?.siteId || item.nearSiteId || "-"}
                                            </Typography>
                                            {item.nearSiteAntennaHeight && (
                                                <span className="text-[10px] text-gray-500">
                                                    H:{item.nearSiteAntennaHeight}m, D:{item.nearSiteAntennaSize}m
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <Typography variant="small" color="blue-gray" className="font-medium">
                                                {item.farSite?.siteId || item.farSiteId || "-"}
                                            </Typography>
                                            {item.farSiteAntennaHeight && (
                                                <span className="text-[10px] text-gray-500">
                                                    H:{item.farSiteAntennaHeight}m, D:{item.farSiteAntennaSize}m
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <Typography variant="small" color="blue-gray" className="font-medium tabular-nums">
                                                {item.nearSiteFrequencies?.length || 0}
                                            </Typography>
                                            <span className="text-[10px] text-gray-500">
                                                A: {item.nearSiteFrequencies?.join(", ") || "-"}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                B: {item.farSiteFrequencies?.join(", ") || "-"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {item.mwLine ? (
                                            <Chip
                                                value="Đã gán"
                                                size="sm"
                                                color="green"
                                                variant="ghost"
                                                className="rounded-full w-fit px-2 py-1 text-[10px]"
                                            />
                                        ) : (
                                            <Chip
                                                value="Chưa gán"
                                                size="sm"
                                                color="blue-gray"
                                                variant="ghost"
                                                className="rounded-full w-fit px-2 py-1 text-[10px]"
                                            />
                                        )}
                                    </td>
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
                            );
                        })}
                    </tbody>
                </table>
            </Card>

            {/* Create Modal */}
            <Dialog
                open={openCreate}
                handler={() => setOpenCreate(false)}
                size="lg"
                className="rounded-lg overflow-hidden shadow-xl"
            >
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <div>
                        <Typography variant="h5" color="blue-gray" className="font-semibold text-gray-900">
                            Thêm mới Giấy phép tần số Viba
                        </Typography>
                        <Typography className="text-xs font-normal text-gray-500 mt-0.5">
                            Nhập thông tin giấy phép tần số mới vào hệ thống
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
                    initialValues={{
                        licenseNumber: "",
                        issueDate: "",
                        expiryDate: "",
                        nearSite: { id: null },
                        farSite: { id: null },
                        nearSiteAntennaHeight: "",
                        farSiteAntennaHeight: "",
                        nearSiteAntennaSize: "",
                        farSiteAntennaSize: "",
                        nearSiteTransmitPower: "",
                        farSiteTransmitPower: "",
                        nearSiteTransmissionSpeed: "",
                        farSiteTransmissionSpeed: "",
                        nearSiteFrequencies: [""],
                        farSiteFrequencies: [""],
                    }}
                    validationSchema={validationSchema}
                    onSubmit={handleCreate}
                >
                    {({ errors, touched, handleSubmit, values, setFieldValue }) => (
                        <Form onSubmit={handleSubmit} className="max-h-[85vh] overflow-y-auto">
                            <DialogBody className="p-6 space-y-6 text-blue-gray-700">
                                {/* Thông tin chung */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b border-blue-50 pb-2">
                                        <Typography variant="small" color="blue" className="font-bold uppercase tracking-wider">
                                            Thông tin chung
                                        </Typography>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex flex-col items-stretch gap-2">
                                            <label className="text-slate-400 font-semibold text-sm">Số giấy phép</label>
                                            <Field
                                                name="licenseNumber"
                                                placeholder="Nhập số giấy phép (vd: 123/GP-CVT)"
                                                className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            />
                                            <ErrorMessage name="licenseNumber" component="span" className="text-sm font-light italic text-red-500" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col items-stretch gap-2">
                                            <label className="text-slate-400 font-semibold text-sm">Ngày cấp</label>
                                            <Field
                                                name="issueDate"
                                                type="date"
                                                className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            />
                                            <ErrorMessage name="issueDate" component="span" className="text-sm font-light italic text-red-500" />
                                        </div>
                                        <div className="flex flex-col items-stretch gap-2">
                                            <label className="text-slate-400 font-semibold text-sm">Ngày hết hạn</label>
                                            <Field
                                                name="expiryDate"
                                                type="date"
                                                className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            />
                                            <ErrorMessage name="expiryDate" component="span" className="text-sm font-light italic text-red-500" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    {/* Near Site Side */}
                                    <div className="space-y-4 shadow-sm p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-2 border-b border-blue-50 pb-2">
                                            <Typography variant="small" color="blue" className="font-bold uppercase tracking-wider">
                                                Trạm A (Near Site)
                                            </Typography>
                                        </div>
                                        <FormSelect label="Chọn trạm A" name="nearSite.id" options={siteList}
                                            getOptionLabel={(o) => o.siteId} getOptionValue={(o) => o.id} />

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col items-stretch gap-2">
                                                <label className="text-slate-400 font-semibold text-sm">Độ cao Anten (m)</label>
                                                <Field
                                                    name="nearSiteAntennaHeight"
                                                    type="number"
                                                    placeholder="0.0"
                                                    className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                />
                                            </div>
                                            <div className="flex flex-col items-stretch gap-2">
                                                <label className="text-slate-400 font-semibold text-sm">Kích thước (m)</label>
                                                <Field
                                                    name="nearSiteAntennaSize"
                                                    type="number"
                                                    placeholder="0.0"
                                                    className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col items-stretch gap-2">
                                                <label className="text-slate-400 font-semibold text-sm">Công suất (dBm)</label>
                                                <Field
                                                    name="nearSiteTransmitPower"
                                                    type="number"
                                                    placeholder="0.0"
                                                    className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                />
                                            </div>
                                            <div className="flex flex-col items-stretch gap-2">
                                                <label className="text-slate-400 font-semibold text-sm">Tốc độ (Mbps)</label>
                                                <Field
                                                    name="nearSiteTransmissionSpeed"
                                                    type="number"
                                                    placeholder="0.0"
                                                    className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Typography variant="small" color="blue-gray" className="font-bold">Danh sách tần số A</Typography>
                                                <Button size="sm" variant="text" color="blue" className="flex items-center gap-1 p-1 h-7"
                                                    onClick={() => {
                                                        setFieldValue("nearSiteFrequencies", [...values.nearSiteFrequencies, ""]);
                                                        setFieldValue("farSiteFrequencies", [...values.farSiteFrequencies, ""]);
                                                    }}>
                                                    <PlusIcon className="h-3 w-3" /> Thêm cặp
                                                </Button>
                                            </div>
                                            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                                {values.nearSiteFrequencies.map((freq, idx) => (
                                                    <div key={idx} className="flex gap-2">
                                                        <input
                                                            value={freq}
                                                            type="number"
                                                            placeholder="Tần số..."
                                                            onChange={(e) => {
                                                                const newFreqs = [...values.nearSiteFrequencies];
                                                                newFreqs[idx] = e.target.value;
                                                                setFieldValue("nearSiteFrequencies", newFreqs);
                                                            }}
                                                            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                        />
                                                        <IconButton size="sm" variant="text" color="red"
                                                            disabled={values.nearSiteFrequencies.length === 1}
                                                            onClick={() => {
                                                                const newNear = values.nearSiteFrequencies.filter((_, i) => i !== idx);
                                                                const newFar = values.farSiteFrequencies.filter((_, i) => i !== idx);
                                                                setFieldValue("nearSiteFrequencies", newNear);
                                                                setFieldValue("farSiteFrequencies", newFar);
                                                            }}>
                                                            <TrashIcon className="h-4 w-4" />
                                                        </IconButton>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Far Site Side */}
                                    <div className="space-y-4 shadow-sm p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-2 border-b border-blue-50 pb-2">
                                            <Typography variant="small" color="blue" className="font-bold uppercase tracking-wider">
                                                Trạm B (Far Site)
                                            </Typography>
                                        </div>
                                        <FormSelect label="Chọn trạm B" name="farSite.id" options={siteList}
                                            getOptionLabel={(o) => o.siteId} getOptionValue={(o) => o.id} />

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col items-stretch gap-2">
                                                <label className="text-slate-400 font-semibold text-sm">Độ cao Anten (m)</label>
                                                <Field
                                                    name="farSiteAntennaHeight"
                                                    type="number"
                                                    placeholder="0.0"
                                                    className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                />
                                            </div>
                                            <div className="flex flex-col items-stretch gap-2">
                                                <label className="text-slate-400 font-semibold text-sm">Kích thước (m)</label>
                                                <Field
                                                    name="farSiteAntennaSize"
                                                    type="number"
                                                    placeholder="0.0"
                                                    className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col items-stretch gap-2">
                                                <label className="text-slate-400 font-semibold text-sm">Công suất (dBm)</label>
                                                <Field
                                                    name="farSiteTransmitPower"
                                                    type="number"
                                                    placeholder="0.0"
                                                    className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                />
                                            </div>
                                            <div className="flex flex-col items-stretch gap-2">
                                                <label className="text-slate-400 font-semibold text-sm">Tốc độ (Mbps)</label>
                                                <Field
                                                    name="farSiteTransmissionSpeed"
                                                    type="number"
                                                    placeholder="0.0"
                                                    className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Typography variant="small" color="blue-gray" className="font-bold">Danh sách tần số B</Typography>
                                                <Button size="sm" variant="text" color="blue" className="flex items-center gap-1 p-1 h-7"
                                                    onClick={() => {
                                                        setFieldValue("nearSiteFrequencies", [...values.nearSiteFrequencies, ""]);
                                                        setFieldValue("farSiteFrequencies", [...values.farSiteFrequencies, ""]);
                                                    }}>
                                                    <PlusIcon className="h-3 w-3" /> Thêm cặp
                                                </Button>
                                            </div>
                                            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                                {values.farSiteFrequencies.map((freq, idx) => (
                                                    <div key={idx} className="flex gap-2">
                                                        <input
                                                            value={freq}
                                                            type="number"
                                                            placeholder="Tần số..."
                                                            onChange={(e) => {
                                                                const newFreqs = [...values.farSiteFrequencies];
                                                                newFreqs[idx] = e.target.value;
                                                                setFieldValue("farSiteFrequencies", newFreqs);
                                                            }}
                                                            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                        />
                                                        <IconButton size="sm" variant="text" color="red"
                                                            disabled={values.farSiteFrequencies.length === 1}
                                                            onClick={() => {
                                                                const newNear = values.nearSiteFrequencies.filter((_, i) => i !== idx);
                                                                const newFar = values.farSiteFrequencies.filter((_, i) => i !== idx);
                                                                setFieldValue("nearSiteFrequencies", newNear);
                                                                setFieldValue("farSiteFrequencies", newFar);
                                                            }}>
                                                            <TrashIcon className="h-4 w-4" />
                                                        </IconButton>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
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

            {/* Edit Modal */}
            <Dialog
                open={openEdit}
                handler={() => setOpenEdit(false)}
                size="lg"
                className="rounded-lg overflow-hidden shadow-xl"
            >
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <div>
                        <Typography variant="h5" color="blue-gray" className="font-semibold text-gray-900">
                            Cập nhật Giấy phép tần số iba
                        </Typography>
                        <Typography className="text-xs font-normal text-gray-500 mt-0.5">
                            Chỉnh sửa thông tin giấy phép #{selectedItem?.id}
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
                            licenseNumber: selectedItem.licenseNumber,
                            issueDate: selectedItem.issueDate ? selectedItem.issueDate.split('T')[0] : "",
                            expiryDate: selectedItem.expiryDate ? selectedItem.expiryDate.split('T')[0] : "",
                            nearSite: selectedItem.nearSite || { id: null },
                            farSite: selectedItem.farSite || { id: null },
                            nearSiteAntennaHeight: selectedItem.nearSiteAntennaHeight || "",
                            farSiteAntennaHeight: selectedItem.farSiteAntennaHeight || "",
                            nearSiteAntennaSize: selectedItem.nearSiteAntennaSize || "",
                            farSiteAntennaSize: selectedItem.farSiteAntennaSize || "",
                            nearSiteTransmitPower: selectedItem.nearSiteTransmitPower || "",
                            farSiteTransmitPower: selectedItem.farSiteTransmitPower || "",
                            nearSiteTransmissionSpeed: selectedItem.nearSiteTransmissionSpeed || "",
                            farSiteTransmissionSpeed: selectedItem.farSiteTransmissionSpeed || "",
                            nearSiteFrequencies: selectedItem.nearSiteFrequencies?.length > 0 ? selectedItem.nearSiteFrequencies : [""],
                            farSiteFrequencies: selectedItem.farSiteFrequencies?.length > 0 ? selectedItem.farSiteFrequencies : [""],
                            mwLine: selectedItem.mwLine || null,
                        }}
                        validationSchema={validationSchema}
                        onSubmit={handleUpdate}
                    >
                        {({ errors, touched, handleSubmit, values, setFieldValue }) => (
                            <Form onSubmit={handleSubmit} className="max-h-[85vh] overflow-y-auto">
                                <DialogBody className="p-6 space-y-6 text-blue-gray-700">
                                    {/* Thông tin chung */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-blue-50 pb-2">
                                            <Typography variant="small" color="blue" className="font-bold uppercase tracking-wider">
                                                Thông tin chung
                                            </Typography>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="flex flex-col items-stretch gap-2">
                                                <label className="text-slate-400 font-semibold text-sm">Số giấy phép</label>
                                                <Field
                                                    name="licenseNumber"
                                                    placeholder="Nhập số giấy phép (vd: 123/GP-CVT)"
                                                    className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                />
                                                <ErrorMessage name="licenseNumber" component="span" className="text-sm font-light italic text-red-500" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col items-stretch gap-2">
                                                <label className="text-slate-400 font-semibold text-sm">Ngày cấp</label>
                                                <Field
                                                    name="issueDate"
                                                    type="date"
                                                    className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                />
                                                <ErrorMessage name="issueDate" component="span" className="text-sm font-light italic text-red-500" />
                                            </div>
                                            <div className="flex flex-col items-stretch gap-2">
                                                <label className="text-slate-400 font-semibold text-sm">Ngày hết hạn</label>
                                                <Field
                                                    name="expiryDate"
                                                    type="date"
                                                    className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                />
                                                <ErrorMessage name="expiryDate" component="span" className="text-sm font-light italic text-red-500" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-4 shadow-sm p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-2 border-b border-blue-50 pb-2">
                                                <Typography variant="small" color="blue" className="font-bold uppercase tracking-wider">Trạm A (Near Site)</Typography>
                                            </div>
                                            <FormSelect label="Chọn trạm A" name="nearSite.id" options={siteList} getOptionLabel={(o) => o.siteId} getOptionValue={(o) => o.id} />
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex flex-col items-stretch gap-2">
                                                    <label className="text-slate-400 font-semibold text-sm">Độ cao Anten (m)</label>
                                                    <Field
                                                        name="nearSiteAntennaHeight"
                                                        type="number"
                                                        placeholder="0.0"
                                                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                    />
                                                </div>
                                                <div className="flex flex-col items-stretch gap-2">
                                                    <label className="text-slate-400 font-semibold text-sm">Kích thước (m)</label>
                                                    <Field
                                                        name="nearSiteAntennaSize"
                                                        type="number"
                                                        placeholder="0.0"
                                                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex flex-col items-stretch gap-2">
                                                    <label className="text-slate-400 font-semibold text-sm">Công suất (dBm)</label>
                                                    <Field
                                                        name="nearSiteTransmitPower"
                                                        type="number"
                                                        placeholder="0.0"
                                                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                    />
                                                </div>
                                                <div className="flex flex-col items-stretch gap-2">
                                                    <label className="text-slate-400 font-semibold text-sm">Tốc độ (Mbps)</label>
                                                    <Field
                                                        name="nearSiteTransmissionSpeed"
                                                        type="number"
                                                        placeholder="0.0"
                                                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <Typography variant="small" color="blue-gray" className="font-bold">Danh sách tần số A</Typography>
                                                    <Button size="sm" variant="text" color="blue" className="p-1 h-7 flex items-center gap-1" onClick={() => {
                                                        setFieldValue("nearSiteFrequencies", [...values.nearSiteFrequencies, ""]);
                                                        setFieldValue("farSiteFrequencies", [...values.farSiteFrequencies, ""]);
                                                    }}><PlusIcon className="h-3 w-3" /> Thêm cặp</Button>
                                                </div>
                                                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                                    {values.nearSiteFrequencies.map((freq, idx) => (
                                                        <div key={idx} className="flex gap-2">
                                                            <input
                                                                value={freq}
                                                                type="number"
                                                                placeholder="Tần số..."
                                                                onChange={(e) => {
                                                                    const n = [...values.nearSiteFrequencies];
                                                                    n[idx] = e.target.value;
                                                                    setFieldValue("nearSiteFrequencies", n);
                                                                }}
                                                                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                            />
                                                            <IconButton size="sm" variant="text" color="red" disabled={values.nearSiteFrequencies.length === 1} onClick={() => {
                                                                setFieldValue("nearSiteFrequencies", values.nearSiteFrequencies.filter((_, i) => i !== idx));
                                                                setFieldValue("farSiteFrequencies", values.farSiteFrequencies.filter((_, i) => i !== idx));
                                                            }}><TrashIcon className="h-4 w-4" /></IconButton>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 shadow-sm p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-2 border-b border-blue-50 pb-2">
                                                <Typography variant="small" color="blue" className="font-bold uppercase tracking-wider">Trạm B (Far Site)</Typography>
                                            </div>
                                            <FormSelect label="Chọn trạm B" name="farSite.id" options={siteList} getOptionLabel={(o) => o.siteId} getOptionValue={(o) => o.id} />
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex flex-col items-stretch gap-2">
                                                    <label className="text-slate-400 font-semibold text-sm">Độ cao Anten (m)</label>
                                                    <Field
                                                        name="farSiteAntennaHeight"
                                                        type="number"
                                                        placeholder="0.0"
                                                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                    />
                                                </div>
                                                <div className="flex flex-col items-stretch gap-2">
                                                    <label className="text-slate-400 font-semibold text-sm">Kích thước (m)</label>
                                                    <Field
                                                        name="farSiteAntennaSize"
                                                        type="number"
                                                        placeholder="0.0"
                                                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex flex-col items-stretch gap-2">
                                                    <label className="text-slate-400 font-semibold text-sm">Công suất (dBm)</label>
                                                    <Field
                                                        name="farSiteTransmitPower"
                                                        type="number"
                                                        placeholder="0.0"
                                                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                    />
                                                </div>
                                                <div className="flex flex-col items-stretch gap-2">
                                                    <label className="text-slate-400 font-semibold text-sm">Tốc độ (Mbps)</label>
                                                    <Field
                                                        name="farSiteTransmissionSpeed"
                                                        type="number"
                                                        placeholder="0.0"
                                                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <Typography variant="small" color="blue-gray" className="font-bold">Danh sách tần số B</Typography>
                                                    <Button size="sm" variant="text" color="blue" className="p-1 h-7 flex items-center gap-1" onClick={() => {
                                                        setFieldValue("nearSiteFrequencies", [...values.nearSiteFrequencies, ""]);
                                                        setFieldValue("farSiteFrequencies", [...values.farSiteFrequencies, ""]);
                                                    }}><PlusIcon className="h-3 w-3" /> Thêm cặp</Button>
                                                </div>
                                                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                                    {values.farSiteFrequencies.map((freq, idx) => (
                                                        <div key={idx} className="flex gap-2">
                                                            <input
                                                                value={freq}
                                                                type="number"
                                                                placeholder="Tần số..."
                                                                onChange={(e) => {
                                                                    const n = [...values.farSiteFrequencies];
                                                                    n[idx] = e.target.value;
                                                                    setFieldValue("farSiteFrequencies", n);
                                                                }}
                                                                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                            />
                                                            <IconButton size="sm" variant="text" color="red" disabled={values.farSiteFrequencies.length === 1} onClick={() => {
                                                                setFieldValue("nearSiteFrequencies", values.nearSiteFrequencies.filter((_, i) => i !== idx));
                                                                setFieldValue("farSiteFrequencies", values.farSiteFrequencies.filter((_, i) => i !== idx));
                                                            }}><TrashIcon className="h-4 w-4" /></IconButton>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
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

            {/* Excel Import Modal */}
            <Dialog
                open={openImport}
                handler={() => setOpenImport(false)}
                size="xl"
                className="rounded-lg overflow-hidden shadow-xl"
            >
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <div>
                        <Typography variant="h5" color="blue-gray" className="font-semibold text-gray-900">
                            Nhập dữ liệu từ Excel
                        </Typography>
                        <Typography className="text-xs font-normal text-gray-500 mt-0.5">
                            Tải lên file Excel mẫu để nhập dữ liệu hàng loạt
                        </Typography>
                    </div>
                    <IconButton
                        size="sm"
                        variant="text"
                        className="text-gray-500 hover:bg-gray-200 rounded-full"
                        onClick={() => setOpenImport(false)}
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </IconButton>
                </div>
                <DialogBody className="p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <ArrowDownTrayIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <Typography variant="small" color="blue-gray" className="font-bold">
                                        File mẫu nhập liệu
                                    </Typography>
                                    <Typography className="text-xs text-gray-500">
                                        Sử dụng file excel đúng định dạng để tránh lỗi khi nhập liệu
                                    </Typography>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outlined"
                                color="blue"
                                className="flex items-center gap-2 bg-white"
                                onClick={handleDownloadTemplate}
                            >
                                <ArrowDownTrayIcon className="h-4 w-4" /> Tải file mẫu
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Typography variant="small" color="blue-gray" className="font-bold">
                                Chọn file từ máy tính
                            </Typography>
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mb-2" />
                                            <Typography className="text-sm text-gray-600">
                                                {importFile ? (
                                                    <span className="font-bold text-blue-600">{importFile.name}</span>
                                                ) : (
                                                    <>
                                                        <span className="font-semibold">Nhấp để chọn file</span> hoặc kéo thả vào đây
                                                    </>
                                                )}
                                            </Typography>
                                            <Typography className="text-xs text-gray-500 mt-1 uppercase">
                                                XLS, XLSX (Tối đa 10MB)
                                            </Typography>
                                        </div>
                                        <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
                                    </label>
                                </div>
                                <div className="flex flex-col gap-2 w-48">
                                    <Button
                                        size="md"
                                        color="blue"
                                        className="flex items-center justify-center gap-2"
                                        onClick={handleCheckImport}
                                        disabled={!importFile || isChecking}
                                    >
                                        {isChecking ? "Đang xử lý..." : "Kiểm tra file"}
                                    </Button>
                                    <Button
                                        size="md"
                                        color="green"
                                        className="flex items-center justify-center gap-2"
                                        disabled={!importResults || isSaving}
                                        onClick={handleSaveImport}
                                    >
                                        {isSaving ? "Đang lưu..." : "Lưu dữ liệu"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {importErrors && (
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2 mb-2 text-red-700">
                                    <XMarkIcon className="h-5 w-5" />
                                    <Typography className="font-bold text-sm">
                                        Phát hiện {importErrors.length} lỗi trong file Excel
                                    </Typography>
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                                    {importErrors.map((err, idx) => (
                                        <div key={idx} className="bg-white/60 p-2 rounded border border-red-50 flex items-start gap-2">
                                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">
                                                Dòng {err.row}
                                            </span>
                                            <div className="flex-1">
                                                {err.errors.map((e, i) => (
                                                    <Typography key={i} className="text-[11px] text-gray-700 leading-tight">
                                                        • {e}
                                                    </Typography>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {importResults && (
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2 mb-2 text-green-700">
                                    <CheckCircleIcon className="h-5 w-5" />
                                    <Typography className="font-bold text-sm">
                                        File hợp lệ! Sẵn sàng nhập {importResults.length} bản ghi
                                    </Typography>
                                </div>
                                <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    <table className="w-full text-left border-collapse bg-white/60 rounded-lg overflow-hidden border border-green-50 text-[11px]">
                                        <thead className="bg-green-100/50 text-green-800">
                                            <tr>
                                                <th className="p-2 border-b border-green-50">Dòng</th>
                                                <th className="p-2 border-b border-green-50">Số GP</th>
                                                <th className="p-2 border-b border-green-50">Trạm A</th>
                                                <th className="p-2 border-b border-green-50">Trạm B</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {importResults.map((r, idx) => (
                                                <tr key={idx} className="hover:bg-green-50/50 transition-colors">
                                                    <td className="p-2 border-b border-green-50 font-medium text-green-700">{idx + 1}</td>
                                                    <td className="p-2 border-b border-green-50">{r.licenseNumber}</td>
                                                    <td className="p-2 border-b border-green-50">{r.nearSiteId}</td>
                                                    <td className="p-2 border-b border-green-50">{r.farSiteId}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogBody>
                <DialogFooter className="bg-gray-50 px-4 py-3 gap-2 border-t border-gray-200">
                    <CustomButton variant="text" color="blue-gray" onClick={() => setOpenImport(false)} size="sm">
                        Đóng lại
                    </CustomButton>
                </DialogFooter>
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
                        Bạn có chắc chắn muốn xóa giấy phép số <b>{selectedItem?.licenseNumber}</b>?
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

export default MicrowaveLicenseList;
