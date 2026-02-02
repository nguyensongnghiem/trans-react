import { useEffect, useMemo, useState } from "react";
import {
    PencilIcon,
    TrashIcon,
    PlusIcon,
    ArrowDownTrayIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowPathIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";
import Select from "react-select";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import * as XLSX from "xlsx";
import {
    Button,
    Card,
    Dialog,
    IconButton,
    Typography,
    DialogBody,
    DialogHeader,
    DialogFooter,
    Input,
    IconButton as MTIconButton
} from "@material-tailwind/react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useSimpleSites from "../hooks/useSimpleSites";
import useMWLines from "../hooks/useMWLines";
import CustomButton from "../components/CustomButton";
import StatusChip from "../components/StatusChip";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import FormSelect from "../components/FormSelect";

const MWLineSchema = Yup.object().shape({
    nearSite: Yup.object().required("Near Site là bắt buộc").nullable(),
    farSite: Yup.object().required("Far Site là bắt buộc").nullable(),
    serial: Yup.string().required("Serial là bắt buộc"),
    microwaveType: Yup.object().required("Loại thiết bị viba là bắt buộc").nullable(),
});

function MWLineList() {
    const axiosInstance = useAxiosPrivate();
    const { simpleSites: siteList } = useSimpleSites();
    const {
        mwLines: mwLineList,
        createMWLine,
        updateMWLine,
        deleteMWLine
    } = useMWLines();

    const [microwaveTypeList, setMicrowaveTypeList] = useState([]);
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [editMWLine, setEditMWLine] = useState({});
    const [deleteId, setDeleteId] = useState(null);

    const [filters, setFilters] = useState({
        province: null,
        vendor: null,
        microwaveType: null,
        status: null,
        search: "",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 15;

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const res = await axiosInstance.get("microwave-types");
                setMicrowaveTypeList(res.data);
            } catch (error) {
                console.error("Error fetching microwave types", error);
            }
        };
        fetchMetadata();
    }, [axiosInstance]);

    const filteredMWLines = useMemo(() => {
        return mwLineList.filter((mw) => {
            const matchProvince = !filters.province ||
                mw.nearSite?.province?.id === filters.province.id ||
                mw.farSite?.province?.id === filters.province.id;
            const matchVendor = !filters.vendor || mw.microwaveType?.vendor?.id === filters.vendor.id;
            const matchType = !filters.microwaveType || mw.microwaveType?.id === filters.microwaveType.id;
            const matchStatus = !filters.status || mw.status === filters.status.value;
            const matchSearch = !filters.search ||
                mw.serial?.toLowerCase().includes(filters.search.toLowerCase()) ||
                mw.nearSite?.siteId?.toLowerCase().includes(filters.search.toLowerCase()) ||
                mw.farSite?.siteId?.toLowerCase().includes(filters.search.toLowerCase());

            return matchProvince && matchVendor && matchType && matchStatus && matchSearch;
        });
    }, [mwLineList, filters]);

    const totalPages = Math.ceil(filteredMWLines.length / rowsPerPage);
    const paginatedMWLines = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filteredMWLines.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredMWLines, currentPage]);

    const handleEdit = (mw) => {
        setEditMWLine(mw);
        setOpenEdit(true);
    };

    const onBtnExport = () => {
        const data = filteredMWLines.map(mw => ({
            "Near Site": mw.nearSite?.siteId,
            "Far Site": mw.farSite?.siteId,
            "Serial": mw.serial,
            "Loại thiết bị": mw.microwaveType?.name,
            "Hãng": mw.microwaveType?.vendor?.name,
            "Giấy phép": mw.license?.licenseNumber || "N/A",
            "Băng tần": mw.license?.frequencyBand || "N/A",
            "Trạng thái": mw.status
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "MWLines");
        XLSX.writeFile(wb, "DanhSachTuyenViba.xlsx");
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Tuyến Viba</h1>
                    <p className="text-sm text-gray-500 mt-1">Tổng số: {filteredMWLines.length} tuyến</p>
                </div>
                <div className="flex gap-2">
                    <CustomButton className="flex items-center gap-2" size="sm" onClick={() => setOpenCreate(true)}>
                        <PlusIcon className="h-4 w-4" /> Thêm mới
                    </CustomButton>
                    <CustomButton className="flex items-center gap-2 bg-green-600" size="sm" onClick={onBtnExport}>
                        <ArrowDownTrayIcon className="h-4 w-4" /> Xuất Excel
                    </CustomButton>
                </div>
            </div>

            <Card className="p-4 mb-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Input
                        icon={<MagnifyingGlassIcon className="h-4 w-4" />}
                        placeholder="Tìm kiếm Serial, Site ID..."
                        value={filters.search}
                        onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                    />
                    {/* Filters could be more elaborate as in RouterList */}
                </div>
            </Card>

            <Card className="overflow-hidden shadow-sm">
                <table className="w-full text-left table-auto">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 font-bold text-sm">Near Site</th>
                            <th className="p-4 font-bold text-sm">Far Site</th>
                            <th className="p-4 font-bold text-sm">Serial</th>
                            <th className="p-4 font-bold text-sm">Loại TB</th>
                            <th className="p-4 font-bold text-sm">Giấy phép</th>
                            <th className="p-4 font-bold text-sm text-center">Trạng thái</th>
                            <th className="p-4 font-bold text-sm text-center">Tác động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedMWLines.map((mw) => (
                            <tr key={mw.id} className="border-t hover:bg-gray-50">
                                <td className="p-4 text-sm font-medium">{mw.nearSite?.siteId}</td>
                                <td className="p-4 text-sm font-medium">{mw.farSite?.siteId}</td>
                                <td className="p-4 text-sm">{mw.serial}</td>
                                <td className="p-4 text-sm">{mw.microwaveType?.name}</td>
                                <td className="p-4 text-sm">
                                    {mw.license ? (
                                        <div className="text-xs">
                                            <p className="font-bold text-blue-600">{mw.license.licenseNumber}</p>
                                            <p className="text-gray-500">{mw.license.frequencyBand} - {mw.license.frequencyQuantity} tần số</p>
                                        </div>
                                    ) : <span className="text-gray-400 italic text-xs">Chưa có GP</span>}
                                </td>
                                <td className="p-4 text-center">
                                    <StatusChip active={mw.status === 'ACTIVE'} labelOn="Hoạt động" labelOff="Không hoạt động" />
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center gap-1">
                                        <IconButton variant="text" size="sm" color="blue" onClick={() => handleEdit(mw)}>
                                            <PencilIcon className="h-4 w-4" />
                                        </IconButton>
                                        <IconButton variant="text" size="sm" color="red" onClick={() => { setDeleteId(mw.id); setOpenDelete(true); }}>
                                            <TrashIcon className="h-4 w-4" />
                                        </IconButton>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            {/* Create Dialog */}
            <Dialog open={openCreate} handler={() => setOpenCreate(false)} size="lg">
                <DialogHeader>Thêm mới Tuyến Viba</DialogHeader>
                <Formik
                    initialValues={{ nearSite: null, farSite: null, serial: "", microwaveType: null, status: "ACTIVE", license: null }}
                    validationSchema={MWLineSchema}
                    onSubmit={async (values) => {
                        await createMWLine(values);
                        setOpenCreate(false);
                    }}
                >
                    {({ setFieldValue, values }) => (
                        <Form>
                            <DialogBody className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-auto">
                                <div className="space-y-4">
                                    <Typography variant="h6">Thông tin tuyến</Typography>
                                    <FormSelect label="Near Site" name="nearSite" options={siteList} getOptionLabel={o => o.siteId} onChange={v => setFieldValue("nearSite", v)} />
                                    <FormSelect label="Far Site" name="farSite" options={siteList} getOptionLabel={o => o.siteId} onChange={v => setFieldValue("farSite", v)} />
                                    <div>
                                        <Typography variant="small" className="mb-2 font-medium">Serial</Typography>
                                        <Field as={Input} name="serial" placeholder="Nhập Serial" />
                                        <ErrorMessage name="serial" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                    <FormSelect label="Loại thiết bị" name="microwaveType" options={microwaveTypeList} getOptionLabel={o => `${o.vendor.name} - ${o.name}`} onChange={v => setFieldValue("microwaveType", v)} />
                                </div>
                                <div className="space-y-4 border-l pl-4">
                                    <Typography variant="h6">Giấy phép (Tùy chọn)</Typography>
                                    <Input label="Số giấy phép" onChange={e => setFieldValue("license.licenseNumber", e.target.value)} />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input label="Ngày cấp" type="date" onChange={e => setFieldValue("license.issueDate", e.target.value)} />
                                        <Input label="Ngày hết hạn" type="date" onChange={e => setFieldValue("license.expiryDate", e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input label="Băng tần" placeholder="7G/13G..." onChange={e => setFieldValue("license.frequencyBand", e.target.value)} />
                                        <Input label="Số tần số" type="number" onChange={e => setFieldValue("license.frequencyQuantity", e.target.value)} />
                                    </div>
                                </div>
                            </DialogBody>
                            <DialogFooter>
                                <Button variant="text" color="red" onClick={() => setOpenCreate(false)}>Hủy</Button>
                                <Button variant="gradient" color="blue" type="submit">Lưu</Button>
                            </DialogFooter>
                        </Form>
                    )}
                </Formik>
            </Dialog>

            <DeleteConfirmationModal
                open={openDelete}
                onClose={() => setOpenDelete(false)}
                onConfirm={async () => { await deleteMWLine(deleteId); setOpenDelete(false); }}
                title="Xóa tuyến viba"
            />
        </div>
    );
}

export default MWLineList;
