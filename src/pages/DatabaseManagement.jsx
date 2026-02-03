import React, { useState } from "react";
import {
    Card,
    CardBody,
    Typography,
    Button,
    Spinner,
} from "@material-tailwind/react";
import { CloudArrowDownIcon, ServerStackIcon } from "@heroicons/react/24/solid";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import CustomButton from "../components/CustomButton";

const DatabaseManagement = () => {
    const [loading, setLoading] = useState(false);
    const axiosInstance = useAxiosPrivate();

    const handleBackup = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get("admin/database/backup", {
                responseType: "blob", // Important for handling file downloads
            });

            // Create a URL for the blob
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;

            // Extract filename from content-disposition header if available
            const contentDisposition = response.headers["content-disposition"];
            let fileName = "database_backup.sql";
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch.length === 2) fileName = fileNameMatch[1];
            }

            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Sao lưu dữ liệu thành công!");
        } catch (error) {
            console.error("Backup error:", error);
            toast.error("Lỗi khi thực hiện sao lưu dữ liệu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <ServerStackIcon className="h-8 w-8 text-blue-800" />
                    Quản lý Database
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Các công cụ quản trị và bảo trì cơ sở dữ liệu hệ thống.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border border-gray-200 shadow-sm overflow-hidden">
                    <CardBody className="p-0">
                        <div className="bg-blue-800 p-4 flex items-center justify-center">
                            <CloudArrowDownIcon className="h-16 w-16 text-white opacity-80" />
                        </div>
                        <div className="p-6">
                            <Typography variant="h5" color="blue-gray" className="mb-2">
                                Sao lưu dữ liệu (Backup)
                            </Typography>
                            <Typography className="text-gray-600 text-sm mb-6">
                                Tạo bản sao lưu toàn bộ cơ sở dữ liệu (`.sql`). Bản sao lưu sẽ được tải về máy tính cá nhân của bạn.
                            </Typography>
                            <CustomButton
                                className="w-full flex items-center justify-center gap-2"
                                onClick={handleBackup}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Spinner className="h-4 w-4" /> Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <CloudArrowDownIcon className="h-5 w-5" /> Thực hiện sao lưu
                                    </>
                                )}
                            </CustomButton>
                        </div>
                    </CardBody>
                </Card>

                {/* Placeholder for future tools */}
                <Card className="border border-gray-200 shadow-sm opacity-60 bg-gray-50">
                    <CardBody className="p-6 flex flex-col items-center justify-center text-center h-full">
                        <Typography variant="small" color="blue-gray" className="font-medium">
                            Sắp ra mắt
                        </Typography>
                        <Typography variant="h6" color="blue-gray" className="mt-2">
                            Khôi phục dữ liệu (Restore)
                        </Typography>
                    </CardBody>
                </Card>
            </div>

            <div className="mt-8 bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                <Typography variant="h6" color="orange" className="mb-1">
                    Lưu ý quan trọng:
                </Typography>
                <ul className="list-disc list-inside text-sm text-orange-900 space-y-1">
                    <li>Quá trình sao lưu có thể mất vài phút tùy thuộc vào dung lượng dữ liệu.</li>
                    <li>Vui lòng không đóng trình duyệt cho đến khi file được tải về hoàn tất.</li>
                    <li>Nên thực hiện sao lưu định kỳ vào thời điểm ít người truy cập hệ thống.</li>
                </ul>
            </div>
        </div>
    );
};

export default DatabaseManagement;
