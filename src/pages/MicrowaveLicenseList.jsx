import { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import {
    PencilIcon,
    TrashIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    ArrowUpTrayIcon,
    ArrowDownTrayIcon,
    CheckCircleIcon,
    CloudArrowUpIcon,
} from "@heroicons/react/24/solid";
import {
    FunnelIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Select from "react-select";
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
import useMicrowaveTypes from "../hooks/useMicrowaveTypes";
import useMetadata from "../hooks/useMetadata";
import FormSelect from "../components/FormSelect";
import StatusBadge from "../components/StatusBadge";

const mapFormToRequest = (values) => {
    // Destructure to remove nested objects that shouldn't be in the request
    const { nearSite, farSite, mwLine, nearSiteMwModel, farSiteMwModel, ...rest } = values;

    return {
        ...rest,
        mwLineId: mwLine?.id || values.mwLineId,
        nearSiteId: nearSite?.id || values.nearSiteId,
        farSiteId: farSite?.id || values.farSiteId,
        nearSiteMwModelId: nearSiteMwModel?.id || values.nearSiteMwModelId,
        farSiteMwModelId: farSiteMwModel?.id || values.farSiteMwModelId,
        nearSiteFrequencies: values.nearSiteFrequencies?.filter(f => f !== null && f !== "").map(Number),
        farSiteFrequencies: values.farSiteFrequencies?.filter(f => f !== null && f !== "").map(Number),
    };
};

function MicrowaveLicenseList() {
    const axiosInstance = useAxiosPrivate();
    const { simpleSites: siteList } = useSimpleSites();
    const { microwaveTypes } = useMicrowaveTypes();
    const { provinces } = useMetadata();
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
    const [filters, setFilters] = useState({
        province: null,
        mwType: null,
        status: null,
        search: "",
    });
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

    const handleOpenImport = () => {
        setOpenImport((prev) => !prev);
        if (!openImport) {
            setImportFile(null);
            setImportErrors(null);
            setImportResults(null);
            setIsChecking(false);
            setIsSaving(false);
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
            handleOpenImport();
            setImportFile(null);
            setImportResults(null);
            window.location.reload();
        } catch (error) {
            toast.error("Lỗi khi lưu dữ liệu");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredList = useMemo(() => {
        return items.filter((item) => {
            const matchProvince = !filters.province ||
                item.nearSite?.province?.id === filters.province.value ||
                item.farSite?.province?.id === filters.province.value;

            const matchMwType = !filters.mwType ||
                item.nearSiteMwModel?.id === filters.mwType.value ||
                item.farSiteMwModel?.id === filters.mwType.value;

            const isAssigned = !!item.mwLine;
            const matchStatus = !filters.status ||
                (filters.status.value === 'assigned' && isAssigned) ||
                (filters.status.value === 'unassigned' && !isAssigned);

            const searchLower = filters.search.toLowerCase();
            const matchSearch = !filters.search ||
                item.licenseNumber?.toLowerCase().includes(searchLower) ||
                item.nearSite?.siteId?.toLowerCase().includes(searchLower) ||
                item.farSite?.siteId?.toLowerCase().includes(searchLower);

            return matchProvince && matchMwType && matchStatus && matchSearch;
        });
    }, [items, filters]);

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

    const provinceOptions = provinces.map(p => ({ value: p.id, label: p.name }));
    const mwTypeOptions = microwaveTypes.map(t => ({ value: t.id, label: t.name }));
    const statusOptions = [
        { value: 'assigned', label: 'Đã gán' },
        { value: 'unassigned', label: 'Chưa gán' }
    ];

    const whiteSelectStyles = {
        control: (base, state) => ({
            ...base,
            minHeight: "40px",
            borderRadius: "8px",
            borderColor: "#e2e8f0",
            boxShadow: "none",
            "&:hover": { borderColor: "#93c5fd" },
        }),
        menu: (base) => ({ ...base, zIndex: 9999 }),
    };

    const onBtnExport = () => {
        const dataToExport = filteredList.map(item => ({
            "Số giấy phép": item.licenseNumber,
            "Tuyến": `${item.nearSite?.siteId || 'N/A'} - ${item.farSite?.siteId || 'N/A'}`,
            "Thiết bị A": item.nearSiteMwModel?.name || "N/A",
            "Thiết bị B": item.farSiteMwModel?.name || "N/A",
            "Ngày cấp": formatDateLabel(item.issueDate),
            "Ngày hết hạn": formatDateLabel(item.expiryDate),
            "Anten A (Cao/K.thước)": `${item.nearSiteAntennaHeight || '-'}m / ${item.nearSiteAntennaSize || '-'}m`,
            "Anten B (Cao/K.thước)": `${item.farSiteAntennaHeight || '-'}m / ${item.farSiteAntennaSize || '-'}m`,
            "Tốc độ A (Mbps)": item.nearSiteTransmissionSpeed,
            "Tốc độ B (Mbps)": item.farSiteTransmissionSpeed,
            "Số cặp tần số": item.nearSiteFrequencies?.length || 0,
            "Tần số A": item.nearSiteFrequencies?.join(', ') || "N/A",
            "Tần số B": item.farSiteFrequencies?.join(', ') || "N/A",
            "Trạng thái": item.mwLine ? "Đã gán" : "Chưa gán",
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "MicrowaveLicenses");
        XLSX.writeFile(wb, "DanhSachGiayPhepViba.xlsx");
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
                                onClick={handleOpenImport}
                            >
                                <ArrowUpTrayIcon className="h-4 w-4" /> Import
                            </CustomButton>
                            <CustomButton
                                className="flex items-center gap-2 bg-green-600"
                                size="sm"
                                onClick={onBtnExport}
                            >
                                <ArrowDownTrayIcon className="h-4 w-4" /> Xuất Excel
                            </CustomButton>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm mb-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4 text-blue-gray-700">
                    <FunnelIcon className="h-5 w-5" />
                    <span className="font-bold text-sm uppercase tracking-wider">Bộ lọc tìm kiếm</span>
                    {(filters.search || filters.province || filters.mwType || filters.status) && (
                        <button
                            onClick={() => setFilters({ province: null, mwType: null, status: null, search: "" })}
                            className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
                        >
                            <ArrowPathIcon className="h-3 w-3" /> Xóa bộ lọc
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Tỉnh</span>
                        <Select
                            isClearable
                            placeholder="Tất cả tỉnh"
                            className="text-sm"
                            options={provinceOptions}
                            value={filters.province}
                            onChange={(val) => setFilters(prev => ({ ...prev, province: val }))}
                            styles={whiteSelectStyles}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Loại thiết bị</span>
                        <Select
                            isClearable
                            placeholder="Tất cả loại"
                            className="text-sm"
                            options={mwTypeOptions}
                            value={filters.mwType}
                            onChange={(val) => setFilters(prev => ({ ...prev, mwType: val }))}
                            styles={whiteSelectStyles}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Trạng thái</span>
                        <Select
                            isClearable
                            placeholder="Tất cả trạng thái"
                            className="text-sm"
                            options={statusOptions}
                            value={filters.status}
                            onChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
                            styles={whiteSelectStyles}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Tìm kiếm nhanh</span>
                        <Input
                            icon={<MagnifyingGlassIcon className="h-4 w-4" />}
                            placeholder="Số GP, Site ID..."
                            className="!border-t-blue-gray-200 focus:!border-blue-500 rounded-lg text-sm"
                            labelProps={{ className: "before:content-none after:content-none" }}
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            containerProps={{ className: "min-w-0" }}
                        />
                    </div>
                </div>
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
                                <Typography variant="small" color="blue-gray" className="font-bold">Tuyến & Thiết bị</Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Thời hạn</Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Thông số anten</Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Băng thông (Mbps)</Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Số cặp tần số </Typography>
                            </th>
                            <th className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-bold">Trạng thái</Typography>
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
                                <td colSpan={isAdmin ? 9 : 8} className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                        <Typography variant="small" color="blue-gray">Đang tải dữ liệu...</Typography>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredList.length === 0 ? (
                            <tr>
                                <td colSpan={isAdmin ? 9 : 8} className="p-4 text-center">
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
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <Typography variant="small" color="blue-gray" className="font-bold text-blue-600">
                                                {item.nearSite?.siteId || "-"} - {item.farSite?.siteId || "-"}
                                            </Typography>
                                            <span className="text-[10px] text-gray-500">
                                                {item.nearSiteMwModel?.name || "-"} / {item.farSiteMwModel?.name || "-"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col text-[11px] text-gray-600">
                                            <div className="flex gap-1">
                                                <span className="font-semibold">Cấp:</span>
                                                <span>{formatDateLabel(item.issueDate)}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <span className="font-semibold">Hết hạn:</span>
                                                <span>{formatDateLabel(item.expiryDate)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-500">
                                                <b>{item.nearSite?.siteId || "A"}:</b> H: {item.nearSiteAntennaHeight || "-"}m, D: {item.nearSiteAntennaSize || "-"}m
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                <b>{item.farSite?.siteId || "B"}:</b> H: {item.farSiteAntennaHeight || "-"}m, D: {item.farSiteAntennaSize || "-"}m
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-500">
                                                <b>{item.nearSite?.siteId || "A"}:</b> {item.nearSiteTransmissionSpeed || "-"} Mbps
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                <b>{item.farSite?.siteId || "B"}:</b> {item.farSiteTransmissionSpeed || "-"} Mbps
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <Typography variant="small" color="blue-gray" className="font-medium tabular-nums">
                                                {item.nearSiteFrequencies?.length || 0}
                                            </Typography>
                                            <span className="text-[10px] text-gray-500">
                                                <b>{item.nearSite?.siteId || "A"}:</b> {item.nearSiteFrequencies?.join(", ") || "-"}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                <b>{item.farSite?.siteId || "B"}:</b> {item.farSiteFrequencies?.join(", ") || "-"}
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
                        nearSiteMwModel: { id: null },
                        farSiteMwModel: { id: null },
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
                                        <FormSelect label="Loại thiết bị A" name="nearSiteMwModel.id" options={microwaveTypes}
                                            getOptionLabel={(o) => o.name} getOptionValue={(o) => o.id} />

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
                                        <FormSelect label="Loại thiết bị B" name="farSiteMwModel.id" options={microwaveTypes}
                                            getOptionLabel={(o) => o.name} getOptionValue={(o) => o.id} />

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
                            nearSiteMwModel: selectedItem.nearSiteMwModel || { id: null },
                            farSiteMwModel: selectedItem.farSiteMwModel || { id: null },
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
                                            <FormSelect label="Loại thiết bị A" name="nearSiteMwModel.id" options={microwaveTypes} getOptionLabel={(o) => o.name} getOptionValue={(o) => o.id} />
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
                                            <FormSelect label="Loại thiết bị B" name="farSiteMwModel.id" options={microwaveTypes} getOptionLabel={(o) => o.name} getOptionValue={(o) => o.id} />
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
                handler={handleOpenImport}
                className="overflow-hidden rounded-lg bg-white shadow-xl flex flex-col max-h-[90vh]"
                size="lg"
            >
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <div>
                        <Typography variant="h5" color="blue-gray" className="font-semibold text-gray-900">
                            Import Giấy phép Viba từ Excel
                        </Typography>
                        <Typography className="text-xs font-normal text-gray-500 mt-0.5">
                            Tải lên tệp Excel để thêm hàng loạt giấy phép vào hệ thống
                        </Typography>
                    </div>
                    <IconButton
                        size="sm"
                        variant="text"
                        className="text-gray-500 hover:bg-gray-200 rounded-full"
                        onClick={handleOpenImport}
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </IconButton>
                </div>
                <DialogBody className="p-6">
                    {!importResults ? (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-10 bg-gray-50/50">
                            <CloudArrowUpIcon className="h-16 w-16 text-blue-gray-200 mb-4" />
                            <Typography variant="h6" color="blue-gray" className="mb-1">
                                Kéo thả file hoặc click để chọn
                            </Typography>
                            <Typography variant="small" className="text-gray-500 mb-6">
                                Chỉ chấp nhận file .xlsx hoặc .xls
                            </Typography>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                className="hidden"
                                id="excel-upload-license"
                            />
                            <div className="flex gap-3">
                                <label
                                    htmlFor="excel-upload-license"
                                    className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm"
                                >
                                    Chọn file
                                </label>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors flex items-center gap-2"
                                >
                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                    Tải file mẫu
                                </button>
                            </div>
                            {importFile && (
                                <div className="mt-6 flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg">
                                    <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-800">{importFile.name}</span>
                                    <button onClick={() => { setImportFile(null); setImportErrors(null); }} className="ml-2 text-blue-400 hover:text-blue-600">
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between bg-green-50 border border-green-100 p-4 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <CheckCircleIcon className="h-8 w-8 text-green-500" />
                                    <div>
                                        <Typography variant="h6" color="green" className="leading-none mb-1">
                                            Kiểm tra dữ liệu thành công
                                        </Typography>
                                        <Typography className="text-xs text-green-700 font-medium">
                                            Tìm thấy {importResults.rows.length} dòng dữ liệu hợp lệ và sẵn sàng để lưu.
                                        </Typography>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setImportResults(null);
                                        setImportFile(null);
                                    }}
                                    className="text-xs font-bold text-green-700 hover:underline"
                                >
                                    Thay đổi file
                                </button>
                            </div>

                            {/* Preview Table */}
                            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[40vh] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="p-2 font-bold text-blue-gray-700">Số giấy phép</th>
                                            <th className="p-2 font-bold text-blue-gray-700">Ngày cấp</th>
                                            <th className="p-2 font-bold text-blue-gray-700">Ngày hết hạn</th>
                                            <th className="p-2 font-bold text-blue-gray-700">Trạm A</th>
                                            <th className="p-2 font-bold text-blue-gray-700">Trạm B</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {importResults.rows.slice(0, 10).map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="p-2 font-semibold">{row.licenseNumber}</td>
                                                <td className="p-2">{formatDateLabel(row.issueDate)}</td>
                                                <td className="p-2">{formatDateLabel(row.expiryDate)}</td>
                                                <td className="p-2">{row.nearSite}</td>
                                                <td className="p-2">{row.farSite}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {importResults.rows.length > 10 && (
                                    <div className="p-2 bg-gray-50 text-center text-[10px] text-gray-500 italic">
                                        Và {importResults.rows.length - 10} dòng khác...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {importErrors && Object.keys(importErrors).length > 0 && (
                        <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                                <Typography variant="h6" color="red">
                                    Lỗi dữ liệu ({Object.keys(importErrors).length} dòng bị lỗi)
                                </Typography>
                            </div>
                            <div className="max-h-[30vh] overflow-y-auto bg-white rounded-lg border border-red-100">
                                {Object.entries(importErrors).map(([rowNum, errorGroup]) => (
                                    <div key={rowNum} className="p-3 border-b border-red-50 last:border-none">
                                        <Typography className="text-xs font-bold text-gray-800 mb-1">
                                            Dòng {rowNum}:
                                        </Typography>
                                        <div className="flex flex-wrap gap-2">
                                            {errorGroup.errors.map((err, i) => (
                                                <div key={i} className="bg-red-50 text-[10px] px-2 py-0.5 rounded border border-red-100 text-red-700">
                                                    <span className="font-bold">{err.column}:</span> {err.message}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </DialogBody>
                <DialogFooter className="border-t border-gray-100 bg-gray-50 px-4 py-3 gap-2">
                    <CustomButton
                        variant="text"
                        color="blue-gray"
                        onClick={handleOpenImport}
                        size="sm"
                        disabled={isChecking || isSaving}
                    >
                        Hủy bỏ
                    </CustomButton>
                    {!importResults ? (
                        <CustomButton
                            className="bg-[#0d47a1] hover:bg-[#0a3a82] flex items-center gap-2"
                            onClick={handleCheckImport}
                            disabled={!importFile || isChecking}
                            size="sm"
                            loading={isChecking}
                        >
                            {isChecking ? (
                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                                <MagnifyingGlassIcon className="h-4 w-4" />
                            )}
                            <span>Kiểm tra dữ liệu</span>
                        </CustomButton>
                    ) : (
                        <CustomButton
                            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                            onClick={handleSaveImport}
                            disabled={isSaving}
                            size="sm"
                            loading={isSaving}
                        >
                            {isSaving ? (
                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircleIcon className="h-4 w-4" />
                            )}
                            <span>Lưu dữ liệu vào hệ thống</span>
                        </CustomButton>
                    )}
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
