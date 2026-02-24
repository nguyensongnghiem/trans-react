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
    const [activeTab, setActiveTab] = useState("manual");
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

    return (
        <div className="p-6 bg-gray-100 min-h-screen font-sans">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ServerStackIcon className="h-8 w-8 text-blue-800" />
                        Dashboard Quản Lý Database Backup
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Theo dõi trạng thái, lập lịch và quản lý các bản sao lưu cơ sở dữ liệu.
                    </p>
                </div>
                <CustomButton onClick={fetchData} className="flex items-center gap-2" size="sm" color="blue-gray">
                    <PlayIcon className="h-4 w-4 rotate-180" /> Làm mới
                </CustomButton>
            </div>

            {/* Stats Cards - Match BackupDashboard style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card className="rounded-lg shadow-sm border-none">
                    <CardBody className="flex items-center p-4">
                        <div className="p-3 rounded-full bg-blue-50 text-blue-500 mr-4">
                            <ArchiveBoxIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Tổng bản sao lưu</p>
                            <p className="text-2xl font-bold text-gray-800">{totalBackups}</p>
                        </div>
                    </CardBody>
                </Card>
                <Card className="rounded-lg shadow-sm border-none">
                    <CardBody className="flex items-center p-4">
                        <div className="p-3 rounded-full bg-green-50 text-green-500 mr-4">
                            <ClockIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Lần backup cuối</p>
                            <p className="text-sm font-bold text-gray-800">
                                {lastBackup ? new Date(lastBackup).toLocaleString('vi-VN') : "Chưa có"}
                            </p>
                        </div>
                    </CardBody>
                </Card>
                <Card className="rounded-lg shadow-sm border-none">
                    <CardBody className="flex items-center p-4">
                        <div className="p-3 rounded-full bg-orange-50 text-orange-500 mr-4">
                            <CalendarDaysIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Lịch đang chạy</p>
                            <p className="text-2xl font-bold text-gray-800">{activeSchedules}</p>
                        </div>
                    </CardBody>
                </Card>
                <Card className="rounded-lg shadow-sm border-none">
                    <CardBody className="flex items-center p-4">
                        <div className="p-3 rounded-full bg-purple-50 text-purple-500 mr-4">
                            <ServerIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Tổng dung lượng</p>
                            <p className="text-2xl font-bold text-gray-800">{formatSize(storageUsed)}</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-sm border-none overflow-hidden">
                        <Tabs value={activeTab}>
                            <div className="px-6 pt-4 bg-gray-50 border-b border-gray-200">
                                <TabsHeader className="bg-transparent" indicatorProps={{ className: "bg-blue-600 text-white" }}>
                                    <Tab value="manual" onClick={() => setActiveTab("manual")} className={activeTab === "manual" ? "text-white" : ""}>
                                        <div className="flex items-center gap-2 py-1">
                                            <PlayIcon className="h-4 w-4" /> Sao lưu thủ công
                                        </div>
                                    </Tab>
                                    <Tab value="schedule" onClick={() => setActiveTab("schedule")} className={activeTab === "schedule" ? "text-white" : ""}>
                                        <div className="flex items-center gap-2 py-1">
                                            <ClockIcon className="h-4 w-4" /> Lập lịch sao lưu
                                        </div>
                                    </Tab>
                                </TabsHeader>
                            </div>
                            <TabsBody>
                                <TabPanel value="manual" className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 flex flex-col justify-between">
                                            <div>
                                                <Typography variant="h6" color="blue" className="mb-2 flex items-center gap-2">
                                                    <CloudArrowDownIcon className="h-5 w-5" /> Tải về máy (Download)
                                                </Typography>
                                                <Typography className="text-gray-600 text-xs mb-4">
                                                    Tạo file nén SQL và tải trực tiếp về thiết bị của bạn. Không lưu lại trên server.
                                                </Typography>
                                            </div>
                                            <CustomButton onClick={() => handleManualBackup("download")} disabled={loading} className="w-full">
                                                {loading ? <Spinner className="h-4 w-4" /> : "Bắt đầu tải về"}
                                            </CustomButton>
                                        </div>
                                        <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/30 flex flex-col justify-between">
                                            <div>
                                                <Typography variant="h6" color="teal" className="mb-2 flex items-center gap-2">
                                                    <ServerIcon className="h-5 w-5" /> Lưu lên Server (Local)
                                                </Typography>
                                                <Typography className="text-gray-600 text-xs mb-4">
                                                    Sao lưu và lưu vào bộ nhớ cục bộ của máy chủ. Có thể xem và tải lại trong phần Lịch sử.
                                                </Typography>
                                            </div>
                                            <CustomButton variant="outlined" color="teal" onClick={() => handleManualBackup("local")} disabled={loading} className="w-full">
                                                {loading ? <Spinner className="h-4 w-4" /> : "Lưu vào Server"}
                                            </CustomButton>
                                        </div>
                                        <div className="p-4 rounded-xl border border-red-100 bg-red-50/30 flex flex-col justify-between">
                                            <div>
                                                <Typography variant="h6" color="red" className="mb-2 flex items-center gap-2">
                                                    <ArrowUpTrayIcon className="h-5 w-5" /> Khôi phục Database (Restore)
                                                </Typography>
                                                <Typography className="text-gray-600 text-xs mb-4">
                                                    Tải lên file backup (.sql) để khôi phục lại toàn bộ dữ liệu. <span className="font-bold text-red-600">Lưu ý: Hành động này sẽ ghi đè dữ liệu hiện tại!</span>
                                                </Typography>
                                            </div>
                                            <CustomButton variant="outlined" color="red" onClick={() => setOpenRestoreDialog(true)} disabled={loading} className="w-full">
                                                {loading ? <Spinner className="h-4 w-4" /> : "Chọn file & Khôi phục"}
                                            </CustomButton>
                                        </div>
                                    </div>

                                    <div className="mt-8 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                                        <Typography variant="small" color="orange" className="font-bold mb-1 uppercase text-[10px] tracking-widest">
                                            Lưu ý vận hành
                                        </Typography>
                                        <ul className="list-disc list-inside text-xs text-orange-900 space-y-1 font-medium">
                                            <li>Nên backup trước khi thực hiện các thay đổi cấu hình lớn (như Import/Sync dữ liệu).</li>
                                            <li>Backup local sẽ tự động bị xóa sau số ngày đã cấu hình trong phần lập lịch (Retention).</li>
                                        </ul>
                                    </div>
                                </TabPanel>

                                <TabPanel value="schedule" className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <Typography variant="h6" color="blue-gray" className="flex items-center gap-2">
                                            <QueueListIcon className="h-5 w-5 text-gray-500" /> Cấu hình các tiến trình chạy ngầm
                                        </Typography>
                                        <CustomButton size="sm" className="flex items-center gap-2" onClick={() => handleOpenDialog()}>
                                            <PlusIcon className="h-4 w-4" /> Thêm lịch mới
                                        </CustomButton>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left table-auto border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 border-y border-gray-200">
                                                    <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lịch chạy</th>
                                                    <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cron Pattern</th>
                                                    <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Trạng thái</th>
                                                    <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Hành động</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {configs.map((config) => (
                                                    <tr key={config.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                                        <td className="p-3">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-800 text-sm">{config.name}</span>
                                                                <span className="text-[10px] text-gray-500 italic mt-0.5">{config.description || "Không có mô tả"}</span>
                                                                <span className="text-[10px] font-bold text-blue-600 mt-1">Lưu trữ: {config.retentionDays} ngày</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3">
                                                            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-red-500 font-mono">{config.cronExpression}</code>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <StatusChip active={config.active} labelOn="Active" labelOff="Disabled" />
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="flex justify-center gap-1">
                                                                <Tooltip content="Chỉnh sửa">
                                                                    <IconButton variant="text" size="sm" color="blue" onClick={() => handleOpenDialog(config)}>
                                                                        <PencilIcon className="h-4 w-4" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip content="Xóa bỏ">
                                                                    <IconButton variant="text" size="sm" color="red" onClick={() => handleDeleteConfig(config.id)}>
                                                                        <TrashIcon className="h-4 w-4" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {configs.length === 0 && (
                                                    <tr><td colSpan="4" className="p-8 text-center text-gray-400 italic text-sm">Chưa có cấu hình lịch tự động nào</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </TabPanel>
                            </TabsBody>
                        </Tabs>
                    </Card>

                    {/* Full History Table - Similar to Detailed History */}
                    <Card className="shadow-sm border-none overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                                <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500" /> Nhật ký Sao lưu (History)
                            </h2>
                            <Chip value={`Đã lưu: ${logs.length}`} className="rounded-full bg-blue-50 text-blue-600" />
                        </div>
                        <div className="overflow-x-auto max-h-[400px]">
                            <table className="w-full text-left table-auto border-collapse">
                                <thead className="sticky top-0 bg-white z-10">
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thời gian</th>
                                        <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tên tệp tin</th>
                                        <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Kết quả</th>
                                        <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Dung lượng</th>
                                        <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Tải lại</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="p-3 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-800">{new Date(log.executionTime).toLocaleString('vi-VN')}</span>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <span className={`text-[9px] uppercase font-bold px-1.5 rounded-sm ${log.backupType === 'AUTO' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                                            {log.backupType}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 truncate max-w-[180px]">
                                                <span className="text-xs font-medium text-gray-600 font-mono" title={log.fileName}>{log.fileName}</span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <Chip
                                                    size="sm"
                                                    variant="ghost"
                                                    value={log.status === "SUCCESS" ? "Thành công" : "Lỗi"}
                                                    color={log.status === "SUCCESS" ? "green" : "red"}
                                                    className="rounded-full py-0.5 px-2 text-[10px]"
                                                />
                                            </td>
                                            <td className="p-3 text-right text-xs font-mono text-gray-500">{formatSize(log.fileSize)}</td>
                                            <td className="p-3 text-center">
                                                {log.status === "SUCCESS" && (
                                                    <Tooltip content="Tải file từ server">
                                                        <IconButton variant="text" size="sm" color="blue" onClick={() => downloadLogFile(log)}>
                                                            <ArrowDownTrayIcon className="h-4 w-4" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr><td colSpan="5" className="p-8 text-center text-gray-400 italic text-sm text-gray-500">Chưa có lịch sử sao lưu</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Sidebar Activity - Match BackupDashboard style */}
                <div className="space-y-6">
                    <Card className="shadow-sm border-none overflow-hidden h-fit">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                                <CalendarDaysIcon className="h-5 w-5 text-gray-500" /> Hoạt động gần đây
                            </h2>
                        </div>
                        <div className="px-6 py-8 overflow-y-auto max-h-[800px]">
                            {logs.length === 0 ? (
                                <div className="text-center text-gray-500 text-xs py-4">Chưa có lịch sử.</div>
                            ) : (
                                <Timeline>
                                    {logs.slice(0, 8).map((log, index) => {
                                        const isLast = index === logs.slice(0, 8).length - 1;
                                        const isSuccess = log.status === "SUCCESS";
                                        return (
                                            <TimelineItem key={log.id} className="h-28">
                                                {!isLast && <TimelineConnector className="!w-[1px]" />}
                                                <TimelineHeader className="h-3 inline-flex items-center">
                                                    <TimelineIcon className={`p-1.5 ${isSuccess ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500"}`}>
                                                        {isSuccess ? <CheckCircleIcon className="h-4 w-4" /> : <ExclamationTriangleIcon className="h-4 w-4" />}
                                                    </TimelineIcon>
                                                    <div className="flex flex-col gap-0.5 ml-3">
                                                        <Typography variant="h6" color="blue-gray" className="text-xs font-bold leading-none">
                                                            {log.backupType === 'AUTO' ? 'Sao lưu tự động' : 'Sao lưu thủ công'}
                                                        </Typography>
                                                        <Typography variant="small" color="gray" className="text-[10px] font-normal opacity-70">
                                                            {new Date(log.executionTime).toLocaleString('vi-VN')}
                                                        </Typography>
                                                    </div>
                                                </TimelineHeader>
                                                <TimelineBody className="ml-9 -mt-1 pt-2">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] text-gray-600 truncate max-w-[150px] font-mono bg-white inline-block px-1 border border-gray-100 rounded">
                                                            {log.fileName}
                                                        </span>
                                                        {!isSuccess && log.message && (
                                                            <span className="text-[9px] text-red-500 font-medium italic">Lỗi: {log.message}</span>
                                                        )}
                                                        {isSuccess && (
                                                            <span className="text-[9px] text-green-600 font-bold uppercase tracking-tighter">Done • {formatSize(log.fileSize)}</span>
                                                        )}
                                                    </div>
                                                </TimelineBody>
                                            </TimelineItem>
                                        );
                                    })}
                                </Timeline>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center">
                            <Typography variant="small" className="text-[10px] text-gray-400 font-bold uppercase cursor-pointer hover:text-blue-500 transition-colors">
                                Xem tất cả nhật ký
                            </Typography>
                        </div>
                    </Card>

                    <Card className="shadow-sm border-none bg-blue-600 text-white p-6 relative overflow-hidden group">
                        <div className="relative z-10">
                            <Typography variant="h5" className="mb-2 flex items-center gap-2">
                                <ArchiveBoxIcon className="h-6 w-6" /> System Health
                            </Typography>
                            <Typography className="text-blue-100 text-xs mb-4">
                                Database đang hoạt động ổn định. Đảm bảo dung lượng đĩa còn trống ít nhất 1GB để thực hiện sao lưu.
                            </Typography>
                            <div className="bg-white/10 p-3 rounded-lg flex justify-between items-center">
                                <span className="text-[10px] font-bold uppercase">MySQL Status</span>
                                <Chip value="Online" size="sm" className="rounded-full bg-green-400 text-white py-0.5" />
                            </div>
                        </div>
                        <ServerStackIcon className="h-32 w-32 absolute -bottom-8 -right-8 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                    </Card>
                </div>
            </div>

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
