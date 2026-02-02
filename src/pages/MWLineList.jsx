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
    Switch,
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
    nearSite: Yup.object({
        id: Yup.number().required("Near Site là bắt buộc")
    }),
    farSite: Yup.object({
        id: Yup.number().required("Far Site là bắt buộc")
    }),
    serial: Yup.string().required("Serial là bắt buộc"),
    microwaveType: Yup.object({
        id: Yup.number().required("Loại thiết bị viba là bắt buộc")
    }),
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

    const filterOptions = useMemo(() => {
        const getUnique = (arr, extractor) => {
            const map = new Map();
            arr.forEach(item => {
                const val = extractor(item);
                if (val && !map.has(val.id)) {
                    map.set(val.id, val);
                }
            });
            return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
        };

        const getFilteredFor = (excludeKey) => {
            return mwLineList.filter((mw) => {
                if (excludeKey !== "province" && filters.province &&
                    (mw.nearSite?.province?.id !== filters.province.id && mw.farSite?.province?.id !== filters.province.id))
                    return false;
                if (excludeKey !== "vendor" && filters.vendor && mw.microwaveType?.vendor?.id !== filters.vendor.id)
                    return false;
                if (excludeKey !== "microwaveType" && filters.microwaveType && mw.microwaveType?.id !== filters.microwaveType.id)
                    return false;
                if (excludeKey !== "status" && filters.status && mw.status !== filters.status.value)
                    return false;
                if (excludeKey !== "search" && filters.search) {
                    const search = filters.search.toLowerCase();
                    return (
                        mw.serial?.toLowerCase().includes(search) ||
                        mw.nearSite?.siteId?.toLowerCase().includes(search) ||
                        mw.farSite?.siteId?.toLowerCase().includes(search)
                    );
                }
                return true;
            });
        };

        const provinceFiltered = getFilteredFor("province");
        const provincesMap = new Map();
        provinceFiltered.forEach(mw => {
             if (mw.nearSite?.province) provincesMap.set(mw.nearSite.province.id, mw.nearSite.province);
             if (mw.farSite?.province) provincesMap.set(mw.farSite.province.id, mw.farSite.province);
        });
        const provinces = Array.from(provincesMap.values()).sort((a, b) => a.name.localeCompare(b.name));

        return {
            provinces: provinces,
            vendors: getUnique(getFilteredFor("vendor"), mw => mw.microwaveType?.vendor),
            microwaveTypes: getUnique(getFilteredFor("microwaveType"), mw => mw.microwaveType),
        };
    }, [mwLineList, filters]);

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

    const handleResetFilters = () => {
        setFilters({
            province: null,
            vendor: null,
            microwaveType: null,
            status: null,
            search: "",
        });
    };

    const handleEdit = (mw) => {
        const initialDataForEdit = {
            ...mw,
            license: mw.license || { licenseNumber: '', issueDate: null, expiryDate: null, frequencyBand: '', frequencyQuantity: null }
        };
        setEditMWLine(initialDataForEdit);
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

            <div className="bg-white p-5 rounded-xl shadow-sm mb-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4 text-blue-gray-700">
                    <FunnelIcon className="h-5 w-5" />
                    <span className="font-bold text-sm uppercase tracking-wider">Bộ lọc tìm kiếm</span>
                    {(filters.province || filters.vendor || filters.microwaveType || filters.status || filters.search) && (
                        <button
                            onClick={handleResetFilters}
                            className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
                        >
                            <ArrowPathIcon className="h-3 w-3" /> Xóa bộ lọc
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Tỉnh</span>
                        <Select
                            isClearable
                            placeholder="Tất cả tỉnh"
                            className="text-sm"
                            options={filterOptions.provinces}
                            getOptionLabel={(option) => option.name}
                            getOptionValue={(option) => option.id}
                            value={filters.province}
                            onChange={(val) => setFilters((prev) => ({ ...prev, province: val }))}
                            menuPortalTarget={document.body}
                            styles={{
                                control: (base) => ({ ...base, minHeight: "40px", borderRadius: "8px", borderColor: "#e2e8f0" }),
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                            }}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Hãng sản xuất</span>
                        <Select
                            isClearable
                            placeholder="Tất cả hãng"
                            className="text-sm"
                            options={filterOptions.vendors}
                            getOptionLabel={(option) => option.name}
                            getOptionValue={(option) => option.id}
                            value={filters.vendor}
                            onChange={(val) => setFilters((prev) => ({ ...prev, vendor: val }))}
                            menuPortalTarget={document.body}
                            styles={{
                                control: (base) => ({ ...base, minHeight: "40px", borderRadius: "8px", borderColor: "#e2e8f0" }),
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                            }}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Loại thiết bị</span>
                        <Select
                            isClearable
                            placeholder="Tất cả loại"
                            className="text-sm"
                            options={filterOptions.microwaveTypes}
                            getOptionLabel={(option) => option.name}
                            getOptionValue={(option) => option.id}
                            value={filters.microwaveType}
                            onChange={(val) => setFilters((prev) => ({ ...prev, microwaveType: val }))}
                            menuPortalTarget={document.body}
                            styles={{
                                control: (base) => ({ ...base, minHeight: "40px", borderRadius: "8px", borderColor: "#e2e8f0" }),
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                            }}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Trạng thái</span>
                        <Select
                            isClearable
                            placeholder="Tất cả trạng thái"
                            className="text-sm"
                            options={[
                                { label: "Hoạt động", value: "ACTIVE" },
                                { label: "Không hoạt động", value: "INACTIVE" },
                            ]}
                            value={filters.status}
                            onChange={(val) => setFilters((prev) => ({ ...prev, status: val }))}
                            menuPortalTarget={document.body}
                            styles={{
                                control: (base) => ({ ...base, minHeight: "40px", borderRadius: "8px", borderColor: "#e2e8f0" }),
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                            }}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Tìm kiếm nhanh</span>
                        <Input
                            icon={<MagnifyingGlassIcon className="h-4 w-4" />}
                            placeholder="Serial, Site ID..."
                            className="!border-t-blue-gray-200 focus:!border-blue-500 rounded-lg text-sm"
                            labelProps={{ className: "before:content-none after:content-none" }}
                            value={filters.search}
                            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                            containerProps={{ className: "min-w-0" }}
                        />
                    </div>
                </div>
            </div>

            <Card className="overflow-hidden shadow-sm">
                <table className="w-full text-left table-auto">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 font-bold text-sm">Tỉnh</th>
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
                                <td className="p-4 text-sm font-medium">
                                    {mw.nearSite?.province?.name}
                                    {mw.farSite?.province && mw.nearSite?.province?.id !== mw.farSite?.province?.id ? ` - ${mw.farSite.province.name}` : ''}
                                </td>
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
                    initialValues={{ nearSite: { id: null }, farSite: { id: null }, serial: "", microwaveType: { id: null }, status: "ACTIVE", license: { licenseNumber: '', issueDate: null, expiryDate: null, frequencyBand: '', frequencyQuantity: null } }}
                    validationSchema={MWLineSchema}
                    onSubmit={async (values) => {
                        const payload = { ...values };
                        // If license object has no real values, set it to null before sending
                        if (payload.license && !Object.values(payload.license).some(v => v)) {
                            payload.license = null;
                        }
                        await createMWLine(payload);
                        setOpenCreate(false);
                    }}
                >
                    {({ setFieldValue, values }) => (
                        <Form>
                            <DialogBody className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-auto">
                                <div className="space-y-4">
                                    <Typography variant="h6">Thông tin tuyến</Typography>
                                    <FormSelect label="Near Site" name="nearSite.id" options={siteList} getOptionLabel={o => o.siteId} getOptionValue={o => o.id} onChange={v => setFieldValue("nearSite.id", v?.id)} />
                                    <FormSelect label="Far Site" name="farSite.id" options={siteList} getOptionLabel={o => o.siteId} getOptionValue={o => o.id} onChange={v => setFieldValue("farSite.id", v?.id)} />
                                    <div>
                                        <Typography variant="small" className="mb-2 font-medium">Serial</Typography>
                                        <Field as={Input} name="serial" placeholder="Nhập Serial" />
                                        <ErrorMessage name="serial" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                    <FormSelect label="Loại thiết bị" name="microwaveType.id" options={microwaveTypeList} getOptionLabel={o => `${o.vendor.name} - ${o.name}`} getOptionValue={o => o.id} onChange={v => setFieldValue("microwaveType.id", v?.id)} />
                                </div>
                                <div className="space-y-4 border-l pl-4">
                                    <Typography variant="h6">Giấy phép (Tùy chọn)</Typography>
                                    <Field as={Input} name="license.licenseNumber" label="Số giấy phép" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Field as={Input} name="license.issueDate" label="Ngày cấp" type="date" />
                                        <Field as={Input} name="license.expiryDate" label="Ngày hết hạn" type="date" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Field as={Input} name="license.frequencyBand" label="Băng tần" placeholder="7G/13G..." />
                                        <Field as={Input} name="license.frequencyQuantity" label="Số tần số" type="number" />
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

            {/* Edit Dialog */}
            <Dialog open={openEdit} handler={() => setOpenEdit(false)} size="lg">
                <DialogHeader>Cập nhật Tuyến Viba</DialogHeader>
                <Formik
                    enableReinitialize
                    initialValues={editMWLine}
                    validationSchema={MWLineSchema}
                    onSubmit={async (values) => {
                        const payload = { ...values };
                        if (payload.license && !Object.values(payload.license).some(v => v)) {
                            payload.license = null;
                        }
                        await updateMWLine(values.id, payload);
                        setOpenEdit(false);
                    }}
                >
                    {({ setFieldValue, values }) => (
                        <Form>
                            <DialogBody className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-auto">
                                <div className="space-y-4">
                                    <Typography variant="h6">Thông tin tuyến</Typography>
                                    <FormSelect label="Near Site" name="nearSite.id" options={siteList} getOptionLabel={o => o.siteId} getOptionValue={o => o.id} />
                                    <FormSelect label="Far Site" name="farSite.id" options={siteList} getOptionLabel={o => o.siteId} getOptionValue={o => o.id} />
                                    <div>
                                        <Typography variant="small" className="mb-2 font-medium">Serial</Typography>
                                        <Field as={Input} name="serial" placeholder="Nhập Serial" />
                                        <ErrorMessage name="serial" component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                    <FormSelect label="Loại thiết bị" name="microwaveType.id" options={microwaveTypeList} getOptionLabel={o => `${o.vendor.name} - ${o.name}`} getOptionValue={o => o.id} />
                                    <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                                        <div>
                                            <Typography variant="small" color="blue-gray" className="font-bold">Trạng thái hoạt động</Typography>
                                        </div>
                                        <Switch
                                            color="green"
                                            checked={values.status === 'ACTIVE'}
                                            onChange={(e) => setFieldValue("status", e.target.checked ? 'ACTIVE' : 'INACTIVE')}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4 border-l pl-4">
                                    <Typography variant="h6">Giấy phép (Tùy chọn)</Typography>
                                    <Field as={Input} name="license.licenseNumber" label="Số giấy phép" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Field as={Input} name="license.issueDate" label="Ngày cấp" type="date" />
                                        <Field as={Input} name="license.expiryDate" label="Ngày hết hạn" type="date" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Field as={Input} name="license.frequencyBand" label="Băng tần" placeholder="7G/13G..." />
                                        <Field as={Input} name="license.frequencyQuantity" label="Số tần số" type="number" />
                                    </div>
                                </div>
                            </DialogBody>
                            <DialogFooter>
                                <Button variant="text" color="red" onClick={() => setOpenEdit(false)}>Hủy</Button>
                                <Button variant="gradient" color="blue" type="submit">Cập nhật</Button>
                            </DialogFooter>
                        </Form>
                    )}
                </Formik>
            </Dialog>

            <DeleteConfirmationModal
                open={openDelete}
                handler={() => setOpenDelete(false)}
                onConfirm={async () => { await deleteMWLine(deleteId); setOpenDelete(false); }}
                title="Xóa tuyến viba"
            />
        </div>
    );
}

export default MWLineList;
