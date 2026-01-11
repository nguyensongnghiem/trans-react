import React, { useState, useEffect } from "react";

const BackupDashboard = () => {
  const [summary, setSummary] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL =
    import.meta.env.VITE_BE_API_URL || "http://localhost:8088/api";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Gọi song song 2 API để lấy dữ liệu
      const [summaryRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/routers/backups/summary`),
        fetch(`${API_URL}/routers/backups/history`),
      ]);

      if (!summaryRes.ok) {
        const errText = await summaryRes.text();
        throw new Error(`Lỗi Summary: ${errText || summaryRes.statusText}`);
      }
      if (!historyRes.ok) {
        const errText = await historyRes.text();
        throw new Error(`Lỗi History: ${errText || historyRes.statusText}`);
      }

      const summaryData = await summaryRes.json();
      const historyData = await historyRes.json();

      setSummary(summaryData);
      // Sắp xếp lịch sử theo thời gian mới nhất -> cũ nhất
      setHistory(historyData.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Chưa có";
    return new Date(timestamp * 1000).toLocaleString("vi-VN");
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard Quản Lý Backup
        </h1>
        <button
          onClick={fetchData}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow transition duration-150 flex items-center gap-2"
        >
          🔄 Làm mới
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Lỗi:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-500">
          Đang tải dữ liệu...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột 1: Thống kê theo thiết bị (Chiếm 2 phần) */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-700">
                📊 Trạng thái Backup Thiết bị
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tên Router
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Số lượng File
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Lần Backup Cuối
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-4 text-gray-500"
                      >
                        Chưa có dữ liệu backup nào.
                      </td>
                    </tr>
                  ) : (
                    summary.map((item) => (
                      <tr key={item.router_name} className="hover:bg-gray-50">
                        <td className="px-5 py-4 border-b border-gray-200 text-sm font-medium text-gray-900">
                          {item.router_name}
                        </td>
                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-center">
                          <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-xs font-bold">
                            {item.backup_count}
                          </span>
                        </td>
                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-600">
                          {item.last_backup || "Chưa bao giờ"}
                        </td>
                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-center">
                          {item.backup_count > 0 ? (
                            <span className="text-green-600 font-semibold">
                              ● Đã có
                            </span>
                          ) : (
                            <span className="text-red-500">● Trống</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cột 2: Lịch sử hoạt động gần đây (Chiếm 1 phần) */}
          <div className="bg-white rounded-lg shadow overflow-hidden h-fit">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-700">
                🕒 Hoạt động gần đây
              </h2>
            </div>
            <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {history.slice(0, 15).map((log, index) => (
                <li key={index} className="px-6 py-4 hover:bg-gray-50">
                  <div className="text-sm font-medium text-gray-900">
                    {log.router_name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(log.timestamp)}
                  </div>
                  <div
                    className="text-xs text-gray-400 mt-1 truncate"
                    title={log.filename}
                  >
                    {log.filename}
                  </div>
                </li>
              ))}
              {history.length === 0 && (
                <li className="px-6 py-4 text-gray-500 text-sm text-center">
                  Chưa có lịch sử.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupDashboard;
