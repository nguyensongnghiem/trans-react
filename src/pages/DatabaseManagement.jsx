import React, { useState, useEffect } from "react";
import {
    Card,
    CardBody,
    Typography,
    Button,
    Spinner,
    Tabs,
    TabsHeader,
    TabsBody,
    Tab,
    TabPanel,
    IconButton,
    Tooltip,
    Input,
    Switch,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Chip,
    Timeline,
    TimelineItem,
    TimelineConnector,
    TimelineHeader,
    TimelineIcon,
    TimelineBody,
} from "@material-tailwind/react";
import {
    CloudArrowDownIcon,
    ServerStackIcon,
    ClockIcon,
    ClipboardDocumentListIcon,
    TrashIcon,
    PencilIcon,
    PlusIcon,
    PlayIcon,
    ServerIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArchiveBoxIcon,
    ArrowDownTrayIcon,
    CalendarDaysIcon,
    QueueListIcon,
    ArrowUpTrayIcon
} from "@heroicons/react/24/solid";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import CustomButton from "../components/CustomButton";
import StatusChip from "../components/StatusChip";

const DatabaseManagement = () => {
    const [activeSection, setActiveSection] = useState("manual"); // manual, restore, schedule, history
    const [loading, setLoading] = useState(false);
    const [configs, setConfigs] = useState([]);
    const [logs, setLogs] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        name: "",
        cronExpression: "0 0 2 * * *",
        active: true,
        retentionDays: 30,
        description: "",
        time: "02:00",
        frequency: "daily",
        weekDay: "mon",
        monthDay: 1
    });

    const [restoreFile, setRestoreFile] = useState(null);
    const [openRestoreDialog, setOpenRestoreDialog] = useState(false);

    const axiosInstance = useAxiosPrivate();

    useEffect(() => {
        fetchData();
        // Set up intervals for refreshing if needed, but for now just one-time fetch or on tab change
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [configsRes, logsRes] = await Promise.all([
                axiosInstance.get("admin/database/configs"),
                axiosInstance.get("admin/database/logs")
            ]);
            setConfigs(configsRes.data);
            setLogs(logsRes.data);
        } catch (error) {
            toast.error("Không thể tải dữ liệu.");
        } finally {
            setLoading(false);
        }
    };

    const handleManualBackup = async (type = "download") => {
        setLoading(true);
        try {
            if (type === "download") {
                const response = await axiosInstance.get("admin/database/backup", {
                    responseType: "blob",
                });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement("a");
                link.href = url;
                const contentDisposition = response.headers["content-disposition"];
                let fileName = "database_backup.sql";
                if (contentDisposition) {
                    const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                    if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
                }
                link.setAttribute("download", fileName);
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                window.URL.revokeObjectURL(url);
                toast.success("Tải xuống bản sao lưu thành công!");
            } else {
                await axiosInstance.post("admin/database/backup/local");
                toast.success("Đã tạo bản sao lưu tại /app/uploads/db_backups/");
                fetchData();
            }
        } catch (error) {
            toast.error("Lỗi khi thực hiện sao lưu.");
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        if (!restoreFile) {
            toast.error("Vui lòng chọn file backup");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("file", restoreFile);

        try {
            await axiosInstance.post("admin/database/restore", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            toast.success("Khôi phục database thành công!");
            setOpenRestoreDialog(false);
            setRestoreFile(null);
            fetchData();
        } catch (error) {
            toast.error("Lỗi khi khôi phục database: " + (error.response?.data || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (config = null) => {
        if (config) {
            setIsEdit(true);
            const parts = config.cronExpression.split(" ");
            const time = `${parts[2].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
            let frequency = "daily";
            let weekDay = "mon";
            let monthDay = 1;

            if (parts[5] !== "*" && parts[5] !== "?") {
                frequency = "weekly";
                const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
                weekDay = days[parseInt(parts[5]) - 1]?.toLowerCase() || "mon";
            } else if (parts[3] !== "*") {
                frequency = "monthly";
                monthDay = parseInt(parts[3]);
            }

            setFormData({
                ...config,
                time,
                frequency,
                weekDay,
                monthDay
            });
        } else {
            setIsEdit(false);
            setFormData({
                id: null,
                name: "",
                cronExpression: "0 0 2 * * *",
                active: true,
                retentionDays: 30,
                description: "",
                time: "02:00",
                frequency: "daily",
                weekDay: "mon",
                monthDay: 1
            });
        }
        setOpenDialog(true);
    };

    const handleSaveConfig = async () => {
        const [hour, min] = formData.time.split(":").map(Number);
        let cron = `0 ${min} ${hour} `;

        if (formData.frequency === "daily") {
            cron += "* * *";
        } else if (formData.frequency === "weekly") {
            const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
            const dayNum = days.indexOf(formData.weekDay) + 1;
            cron += `? * ${dayNum}`;
        } else if (formData.frequency === "monthly") {
            cron += `${formData.monthDay} * *`;
        }

        const payload = { ...formData, cronExpression: cron };
        try {
            await axiosInstance.post("admin/database/configs", payload);
            toast.success("Lưu cấu hình thành công!");
            fetchData();
            setOpenDialog(false);
        } catch (error) {
            toast.error("Lỗi khi lưu cấu hình.");
        }
    };

    const handleDeleteConfig = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa lịch backup này?")) {
            try {
                await axiosInstance.delete(`admin/database/configs/${id}`);
                toast.success("Đã xóa lịch backup.");
                fetchData();
            } catch (error) {
                toast.error("Lỗi khi xóa cấu hình.");
            }
        }
    };

    const downloadLogFile = async (log) => {
        try {
            const response = await axiosInstance.get(`admin/database/download/${log.id}`, {
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", log.fileName || "backup.sql");
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("Không thể tải file. File có thể đã bị xóa.");
        }
    };

    const formatSize = (bytes) => {
        if (!bytes) return "0 B";
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Derived stats for cards
    const totalBackups = logs.filter(l => l.status === "SUCCESS").length;
    const lastBackup = logs.length > 0 ? logs[0].executionTime : null;
    const activeSchedules = configs.filter(c => c.active).length;
    const storageUsed = logs.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);

    const SidebarItem = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 ${
                activeSection === id 
                ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
        >
            <Icon className="h-5 w-5" />
            <span className="font-semibold text-sm">{label}</span>
        </button>
    );

    return (
        <div className="p-0 bg-gray-50 min-h-screen font-sans flex flex-col md:flex-row gap-0">
            {/* Left Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-2 z-10">
                <div className="mb-6 px-2">
                    <div className="flex items-center gap-2 mb-1">
                        <ServerStackIcon className="h-6 w-6 text-blue-800" />
                        <Typography variant="h6" className="font-bold text-gray-800">TransManager DB</Typography>
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Database Tools</p>
                </div>

                <div className="space-y-1">
                    <SidebarItem id="manual" label="Sao lưu thủ công" icon={PlayIcon} />
                    <SidebarItem id="restore" label="Khôi phục Database" icon={ArrowUpTrayIcon} />
                    <SidebarItem id="schedule" label="Lịch sao lưu tự động" icon={ClockIcon} />
                    <SidebarItem id="history" label="Nhật ký & Lịch sử" icon={ClipboardDocumentListIcon} />
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="px-2 py-3 bg-blue-50/50 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-blue-800 uppercase">Storage Used</span>
                            <span className="text-[10px] font-bold text-blue-800">{formatSize(storageUsed)}</span>
                        </div>
                        <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-blue-600 h-full w-[45%]" />
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                                Quản Lý Cơ Sở Dữ Liệu
                            </h1>
                            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider">System Healthy</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            Vận hành, giám sát và bảo mật dữ liệu hệ thống.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <CustomButton onClick={fetchData} className="flex items-center gap-2" size="sm" color="blue-gray" variant="outlined">
                            <PlayIcon className="h-4 w-4 rotate-180" /> Làm mới
                        </CustomButton>
                    </div>
                </header>

                {/* Top Stats - More professional cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                        { label: "Tổng bản sao lưu", value: totalBackups, icon: ArchiveBoxIcon, color: "blue" },
                        { label: "Lần cuối chạy", value: lastBackup ? new Date(lastBackup).toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'}) : "Chưa có", icon: ClockIcon, color: "teal" },
                        { label: "Lịch đang chạy", value: activeSchedules, icon: CalendarDaysIcon, color: "orange" },
                    ].map((stat, i) => (
                        <Card key={i} className="rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <CardBody className="flex items-center p-6">
                                <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 mr-4`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>

                {/* Section Content with Animation */}
                <div className="transition-all duration-300 transform">
                    {activeSection === "manual" && (
                        <Card className="shadow-sm border border-gray-100 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <Typography variant="h6" className="text-gray-800 font-bold flex items-center gap-2">
                                    <PlayIcon className="h-5 w-5 text-blue-600" /> Tùy chọn Sao lưu Thủ công
                                </Typography>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="group p-6 rounded-2xl border border-blue-100 bg-white hover:border-blue-300 hover:shadow-lg transition-all">
                                        <div className="p-3 rounded-xl bg-blue-50 text-blue-600 w-fit mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <CloudArrowDownIcon className="h-6 w-6" />
                                        </div>
                                        <Typography variant="h6" className="mb-2 font-bold text-gray-900">Tải về máy khách</Typography>
                                        <Typography className="text-gray-500 text-xs mb-6 leading-relaxed">
                                            Tạo file nén SQL chứa toàn bộ dữ liệu hiện tại và tải trực tiếp về thiết bị của bạn. Không chiếm dung lượng trên máy chủ.
                                        </Typography>
                                        <CustomButton onClick={() => handleManualBackup("download")} disabled={loading} className="w-full rounded-xl py-3 font-bold">
                                            {loading ? <Spinner className="h-4 w-4" /> : "Download Backup"}
                                        </CustomButton>
                                    </div>

                                    <div className="group p-6 rounded-2xl border border-teal-100 bg-white hover:border-teal-300 hover:shadow-lg transition-all">
                                        <div className="p-3 rounded-xl bg-teal-50 text-teal-600 w-fit mb-4 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                            <ServerIcon className="h-6 w-6" />
                                        </div>
                                        <Typography variant="h6" className="mb-2 font-bold text-gray-900">Lưu vào bộ nhớ Server</Typography>
                                        <Typography className="text-gray-500 text-xs mb-6 leading-relaxed">
                                            Sao lưu và lưu vào đường dẫn /app/uploads/db_backups. Các file này sẽ tuân theo lịch trình dọn dẹp (Retention) của hệ thống.
                                        </Typography>
                                        <CustomButton variant="outlined" color="teal" onClick={() => handleManualBackup("local")} disabled={loading} className="w-full rounded-xl py-3 font-bold border-2">
                                            {loading ? <Spinner className="h-4 w-4" /> : "Save to Server"}
                                        </CustomButton>
                                    </div>
                                </div>

                                <div className="mt-8 p-4 bg-amber-50 rounded-xl border-l-4 border-amber-400 flex gap-4 items-start">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <Typography variant="small" color="amber" className="font-extrabold mb-1 uppercase text-[10px] tracking-widest">
                                            Lưu ý Vận hành
                                        </Typography>
                                        <Typography className="text-[11px] text-amber-900 font-medium leading-relaxed">
                                            Hệ thống sẽ tạm khóa các bảng trong giây lát khi thực hiện export để đảm bảo tính toàn vẹn dữ liệu. 
                                            Hãy thực hiện vào thời điểm ít người truy cập nhất.
                                        </Typography>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeSection === "restore" && (
                        <Card className="shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <Typography variant="h6" className="text-gray-800 font-bold flex items-center gap-2">
                                    <ArrowUpTrayIcon className="h-5 w-5 text-red-600" /> Khôi phục Dữ liệu
                                </Typography>
                            </div>
                            <div className="p-12 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                                <div className="p-4 rounded-full bg-red-50 text-red-600 mb-6">
                                    <ExclamationTriangleIcon className="h-12 w-12" />
                                </div>
                                <Typography variant="h4" className="mb-4 font-black text-gray-900">Cảnh báo Quan trọng!</Typography>
                                <Typography className="text-gray-600 mb-8 leading-relaxed">
                                    Tính năng này sẽ khôi phục lại toàn bộ trạng thái database từ file .sql tải lên. 
                                    <strong> Mọi dữ liệu hiện có sẽ bị xóa và thay thế hoàn toàn.</strong>
                                    Hãy chắc chắn bạn đã tạo một bản sao lưu hiện tại trước khi tiếp tục.
                                </Typography>
                                
                                <div className="w-full p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 flex flex-col items-center">
                                    <CustomButton variant="gradient" color="red" onClick={() => setOpenRestoreDialog(true)} disabled={loading} className="px-12 py-3 rounded-xl shadow-lg shadow-red-100 flex items-center gap-2">
                                        <ArrowUpTrayIcon className="h-5 w-5" /> Bắt đầu quy trình Khôi phục
                                    </CustomButton>
                                    <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Hỗ trợ file format: .sql, .gz</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeSection === "schedule" && (
                        <Card className="shadow-sm border border-gray-100 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95">
                            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                                <Typography variant="h6" className="text-gray-800 font-bold flex items-center gap-2">
                                    <ClockIcon className="h-5 w-5 text-indigo-600" /> Tự động hóa Dịch vụ
                                </Typography>
                                <CustomButton size="sm" className="flex items-center gap-2 rounded-lg bg-indigo-600" onClick={() => handleOpenDialog()}>
                                    <PlusIcon className="h-4 w-4" /> Thêm lịch mới
                                </CustomButton>
                            </div>
                            <div className="p-0">
                                <table className="w-full text-left table-auto">
                                    <thead>
                                        <tr className="bg-gray-50/30">
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chi tiết lịch</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cron Patter</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Trạng thái</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {configs.map((config) => (
                                            <tr key={config.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900 text-sm">{config.name}</span>
                                                        <span className="text-xs text-gray-500 mt-1">{config.description || "Tự động sao lưu định kỳ"}</span>
                                                        <div className="flex items-center gap-1.5 mt-2">
                                                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                                                                Retention: {config.retentionDays} ngày
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <code className="text-xs bg-gray-900 text-white px-2.5 py-1.5 rounded-lg font-mono shadow-inner border border-gray-700">{config.cronExpression}</code>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <StatusChip active={config.active} labelOn="Đang chạy" labelOff="Tạm dừng" />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end gap-1">
                                                        <IconButton variant="text" size="sm" color="blue" onClick={() => handleOpenDialog(config)} className="rounded-lg">
                                                            <PencilIcon className="h-4 w-4" />
                                                        </IconButton>
                                                        <IconButton variant="text" size="sm" color="red" onClick={() => handleDeleteConfig(config.id)} className="rounded-lg">
                                                            <TrashIcon className="h-4 w-4" />
                                                        </IconButton>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {configs.length === 0 && (
                                            <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic text-sm">Chưa có kịch bản sao lưu nào được thiết lập</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {activeSection === "history" && (
                        <Card className="shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                                <Typography variant="h6" className="text-gray-800 font-bold flex items-center gap-2">
                                    <ClipboardDocumentListIcon className="h-5 w-5 text-gray-600" /> Nhật ký Giao dịch Dữ liệu
                                </Typography>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Filtered by:</span>
                                    <Chip value="Recent 10" size="sm" className="rounded-lg bg-gray-100 text-gray-600 font-bold" />
                                </div>
                            </div>
                            <div className="p-0 max-h-[600px] overflow-y-auto">
                                <table className="w-full text-left table-auto">
                                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thời gian</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chi tiết tệp</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Kết quả</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Dung lượng</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900">{new Date(log.executionTime).toLocaleString('vi-VN')}</span>
                                                        <span className={`w-fit mt-1 text-[9px] font-black px-1.5 py-0.5 rounded ${log.backupType === 'AUTO' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {log.backupType}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 max-w-[200px]">
                                                    <span className="text-xs font-medium text-gray-600 font-mono truncate block" title={log.fileName}>{log.fileName}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center">
                                                        <Chip
                                                            size="sm"
                                                            variant="gradient"
                                                            value={log.status === "SUCCESS" ? "Thành công" : "Thất bại"}
                                                            color={log.status === "SUCCESS" ? "green" : "red"}
                                                            className="rounded-full py-0.5 px-3 text-[9px] font-bold"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-xs font-mono font-bold text-gray-600">{formatSize(log.fileSize)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    {log.status === "SUCCESS" && (
                                                        <Tooltip content="Mở trình tải xuống">
                                                            <IconButton variant="filled" size="sm" color="blue" onClick={() => downloadLogFile(log)} className="rounded-lg shadow-blue-100">
                                                                <ArrowDownTrayIcon className="h-4 w-4" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>
            </main>

            {/* Config Dialog */}
            <Dialog open={openDialog} handler={() => setOpenDialog(false)} size="sm" className="rounded-xl shadow-2xl">
                <DialogHeader className="border-b border-gray-100 pb-4">
                    <Typography variant="h5" color="blue-gray">
                        {isEdit ? "Điều chỉnh lịch sao lưu" : "Thiết lập lịch sao lưu mới"}
                    </Typography>
                </DialogHeader>
                <DialogBody className="flex flex-col gap-5 py-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Tên tiến trình</label>
                        <Input
                            placeholder="Ví dụ: Sao lưu hàng đêm lúc 2h"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="!border-t-blue-gray-200 focus:!border-blue-500"
                            labelProps={{ className: "hidden" }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Tần suất</label>
                            <select
                                className="w-full p-2 border border-blue-gray-200 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                                value={formData.frequency}
                                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                            >
                                <option value="daily">Hàng ngày</option>
                                <option value="weekly">Hàng tuần</option>
                                <option value="monthly">Hàng tháng</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Thời điểm</label>
                            <Input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="!border-t-blue-gray-200 focus:!border-blue-500"
                                labelProps={{ className: "hidden" }}
                            />
                        </div>
                    </div>

                    {formData.frequency === "weekly" && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Ngày chạy</label>
                            <select
                                className="w-full p-2 border border-blue-gray-200 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                                value={formData.weekDay}
                                onChange={(e) => setFormData({ ...formData, weekDay: e.target.value })}
                            >
                                <option value="mon">Thứ 2</option>
                                <option value="tue">Thứ 3</option>
                                <option value="wed">Thứ 4</option>
                                <option value="thu">Thứ 5</option>
                                <option value="fri">Thứ 6</option>
                                <option value="sat">Thứ 7</option>
                                <option value="sun">Chủ nhật</option>
                            </select>
                        </div>
                    )}

                    {formData.frequency === "monthly" && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Ngày chạy trong tháng</label>
                            <Input
                                type="number"
                                min="1"
                                max="31"
                                value={formData.monthDay}
                                onChange={(e) => setFormData({ ...formData, monthDay: parseInt(e.target.value) })}
                                className="!border-t-blue-gray-200 focus:!border-blue-500"
                                labelProps={{ className: "hidden" }}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Lưu trữ (ngày)</label>
                            <Input
                                type="number"
                                value={formData.retentionDays}
                                onChange={(e) => setFormData({ ...formData, retentionDays: parseInt(e.target.value) })}
                                className="!border-t-blue-gray-200 focus:!border-blue-500"
                                labelProps={{ className: "hidden" }}
                            />
                        </div>
                        <div className="flex flex-col justify-center items-center gap-1 pt-4">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Kích hoạt</label>
                            <Switch
                                color="blue"
                                checked={formData.active}
                                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Mô tả/Ghi chú</label>
                        <Input
                            placeholder="Ghi chú về lịch này..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="!border-t-blue-gray-200 focus:!border-blue-500"
                            labelProps={{ className: "hidden" }}
                        />
                    </div>
                </DialogBody>
                <DialogFooter className="bg-gray-50 rounded-b-xl gap-2">
                    <Button variant="text" color="red" size="sm" onClick={() => setOpenDialog(false)}>Đóng</Button>
                    <Button color="blue" size="sm" onClick={handleSaveConfig} className="shadow-blue-200">Xác nhận Lưu</Button>
                </DialogFooter>
            </Dialog>

            {/* Restore Dialog */}
            <Dialog open={openRestoreDialog} handler={() => setOpenRestoreDialog(false)} size="xs" className="rounded-xl">
                <DialogHeader className="border-b border-gray-100 pb-4">
                    <Typography variant="h5" color="red" className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="h-6 w-6" /> Xác nhận khôi phục
                    </Typography>
                </DialogHeader>
                <DialogBody className="py-6">
                    <Typography className="text-gray-700 mb-4">
                        Bạn đang chuẩn bị khôi phục lại database từ một file backup. 
                        Hành động này sẽ <strong>ghi đè toàn bộ dữ liệu hiện tại</strong> và không thể hoàn tác.
                    </Typography>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Chọn file SQL backup</label>
                        <input
                            type="file"
                            accept=".sql"
                            onChange={(e) => setRestoreFile(e.target.files[0])}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-200 rounded-md p-1"
                        />
                    </div>
                </DialogBody>
                <DialogFooter className="bg-gray-50 rounded-b-xl gap-2">
                    <Button variant="text" color="blue-gray" size="sm" onClick={() => setOpenRestoreDialog(false)}>Hủy</Button>
                    <Button color="red" size="sm" onClick={handleRestore} disabled={loading || !restoreFile}>
                        {loading ? <Spinner className="h-4 w-4" /> : "Bắt đầu khôi phục"}
                    </Button>
                </DialogFooter>
            </Dialog>
        </div>
    );
};

export default DatabaseManagement;
