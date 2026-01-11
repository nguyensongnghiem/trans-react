import React, { useState, useEffect } from "react";

const RouterBackup = () => {
  const [routers, setRouters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState({}); // Theo dõi trạng thái backup của từng thiết bị
  const [message, setMessage] = useState(null);

  // Lấy URL API từ biến môi trường Vite hoặc dùng mặc định
  const API_URL =
    import.meta.env.VITE_BE_API_URL || "http://localhost:8088/api";

  useEffect(() => {
    fetchRouters();
  }, []);

  const fetchRouters = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/routers`);
      if (!response.ok) throw new Error("Failed to fetch routers");
      const data = await response.json();
      setRouters(data);
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: "Không thể tải danh sách thiết bị. Vui lòng kiểm tra kết nối Backend.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async (routerName) => {
    // Đánh dấu thiết bị này đang xử lý
    setProcessing((prev) => ({ ...prev, [routerName]: true }));
    setMessage(null);

    try {
      // Gọi API Java (Java sẽ gọi tiếp sang Python Service)
      const response = await fetch(`${API_URL}/routers/backup/${routerName}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({
          type: "success",
          text: `Backup thành công: ${routerName}. ${result.message}`,
        });
      } else {
        setMessage({
          type: "error",
          text: `Lỗi backup ${routerName}: ${result.message || "Lỗi không xác định"}`,
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: `Lỗi kết nối khi backup ${routerName}`,
      });
    } finally {
      // Tắt trạng thái xử lý
      setProcessing((prev) => ({ ...prev, [routerName]: false }));
    }
  };

  const handleBackupAll = async () => {
    if (
      !window.confirm(
        "Bạn có chắc muốn chạy backup cho TẤT CẢ thiết bị? Quá trình này sẽ chạy ngầm."
      )
    )
      return;

    try {
      const response = await fetch(`${API_URL}/routers/backup/all`);
      const result = await response.json();
      setMessage({
        type: "info",
        text: result.message || "Đã kích hoạt backup nền cho tất cả thiết bị.",
      });
    } catch (error) {
      setMessage({ type: "error", text: "Lỗi khi kích hoạt backup tất cả." });
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Quản lý Backup Router
        </h1>
        <button
          onClick={handleBackupAll}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow transition duration-150 ease-in-out"
        >
          🔄 Backup Tất Cả (Async)
        </button>
      </div>

      {message && (
        <div
          className={`p-4 mb-6 rounded shadow-sm flex justify-between items-center ${message.type === "error" ? "bg-red-100 text-red-700 border border-red-200" : message.type === "info" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-green-100 text-green-700 border border-green-200"}`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="font-bold text-xl leading-none"
          >
            &times;
          </button>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Tên thiết bị
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                IP Address
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Vendor / Loại
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="px-5 py-5 text-center text-gray-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : routers.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-5 py-5 text-center text-gray-500">
                  Không có thiết bị nào.
                </td>
              </tr>
            ) : (
              routers.map((router) => (
                <tr
                  key={router.id || router.name}
                  className="hover:bg-gray-50 transition duration-150"
                >
                  <td className="px-5 py-5 border-b border-gray-200 text-sm font-medium text-gray-900">
                    {router.name}
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 text-sm text-gray-600">
                    {router.ip}
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 text-sm text-gray-600">
                    {router.routerType?.vendor?.name} -{" "}
                    {router.routerType?.name}
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 text-sm">
                    <button
                      onClick={() => handleBackup(router.name)}
                      disabled={processing[router.name]}
                      className={`py-1 px-3 rounded text-xs font-semibold uppercase tracking-wide transition ${
                        processing[router.name]
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-green-100 text-green-800 hover:bg-green-200 border border-green-200"
                      }`}
                    >
                      {processing[router.name] ? "Đang chạy..." : "Backup Ngay"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RouterBackup;
