import React, { useState, useEffect, useMemo } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import Select from "react-select";

const RouterBackup = () => {
  const [routers, setRouters] = useState([]);
  const [filteredRouters, setFilteredRouters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState({}); // Theo dõi trạng thái backup của từng thiết bị
  const [provinceFilter, setProvinceFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const axiosInstance = useAxiosPrivate();

  useEffect(() => {
    fetchRouters();
  }, []);

  const fetchRouters = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/routers");
      setRouters(response.data);
    } catch (error) {
      console.error(error);
      toast.error(
        "Không thể tải danh sách thiết bị. Vui lòng kiểm tra kết nối Backend.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = routers;
    if (provinceFilter) {
      result = result.filter((r) => r.site?.province?.name === provinceFilter);
    }
    if (vendorFilter) {
      result = result.filter(
        (r) => r.routerType?.vendor?.name === vendorFilter,
      );
    }
    if (typeFilter) {
      result = result.filter((r) => r.routerType?.name === typeFilter);
    }
    setFilteredRouters(result);
  }, [routers, provinceFilter, vendorFilter, typeFilter]);

  const provinceOptions = useMemo(
    () =>
      [...new Set(routers.map((r) => r.site?.province?.name).filter(Boolean))]
        .sort()
        .map((p) => ({ value: p, label: p })),
    [routers],
  );
  const vendorOptions = useMemo(
    () =>
      [
        ...new Set(
          routers.map((r) => r.routerType?.vendor?.name).filter(Boolean),
        ),
      ]
        .sort()
        .map((v) => ({ value: v, label: v })),
    [routers],
  );
  const typeOptions = useMemo(
    () =>
      [...new Set(routers.map((r) => r.routerType?.name).filter(Boolean))]
        .sort()
        .map((t) => ({ value: t, label: t })),
    [routers],
  );

  const handleBackup = async (routerName) => {
    // Đánh dấu thiết bị này đang xử lý
    setProcessing((prev) => ({ ...prev, [routerName]: true }));

    try {
      // Gọi API Java (Java sẽ gọi tiếp sang Python Service)
      const response = await axiosInstance.post(
        `/routers/backups/trigger/${routerName}`,
      );
      const result = response.data;

      if (result.success) {
        toast.success(`Backup thành công: ${routerName}`);
      } else {
        toast.error(
          `Lỗi backup ${routerName}: ${result.message || "Lỗi không xác định"}`,
        );
      }
    } catch (error) {
      toast.error(`Lỗi kết nối khi backup ${routerName}`);
    } finally {
      // Tắt trạng thái xử lý
      setProcessing((prev) => ({ ...prev, [routerName]: false }));
    }
  };

  const handleBackupAll = async () => {
    if (
      !window.confirm(
        "Bạn có chắc muốn chạy backup cho TẤT CẢ thiết bị? Quá trình này sẽ chạy ngầm.",
      )
    )
      return;

    try {
      const response = await axiosInstance.post("/routers/backups/trigger/all");
      const result = response.data;
      toast.info(
        result.message || "Đã kích hoạt backup nền cho tất cả thiết bị.",
      );
    } catch (error) {
      toast.error("Lỗi khi kích hoạt backup tất cả.");
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

      <div className="mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col w-48">
          <label className="text-xs font-semibold text-gray-500 mb-1">
            Tỉnh / Thành phố
          </label>
          <Select
            options={provinceOptions}
            value={
              provinceFilter
                ? { value: provinceFilter, label: provinceFilter }
                : null
            }
            onChange={(opt) => setProvinceFilter(opt ? opt.value : "")}
            placeholder="Tất cả"
            isClearable
            className="text-sm"
          />
        </div>

        <div className="flex flex-col w-48">
          <label className="text-xs font-semibold text-gray-500 mb-1">
            Hãng sản xuất
          </label>
          <Select
            options={vendorOptions}
            value={
              vendorFilter ? { value: vendorFilter, label: vendorFilter } : null
            }
            onChange={(opt) => setVendorFilter(opt ? opt.value : "")}
            placeholder="Tất cả"
            isClearable
            className="text-sm"
          />
        </div>

        <div className="flex flex-col w-48">
          <label className="text-xs font-semibold text-gray-500 mb-1">
            Loại thiết bị
          </label>
          <Select
            options={typeOptions}
            value={typeFilter ? { value: typeFilter, label: typeFilter } : null}
            onChange={(opt) => setTypeFilter(opt ? opt.value : "")}
            placeholder="Tất cả"
            isClearable
            className="text-sm"
          />
        </div>

        <button
          onClick={() => {
            setProvinceFilter("");
            setVendorFilter("");
            setTypeFilter("");
          }}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm transition"
        >
          Xóa bộ lọc
        </button>
        <div className="ml-auto text-sm text-gray-500">
          Hiển thị: <b>{filteredRouters.length}</b> / {routers.length}
        </div>
      </div>

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
                Khu vực
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
                <td colSpan="5" className="px-5 py-5 text-center text-gray-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filteredRouters.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-5 py-5 text-center text-gray-500">
                  Không tìm thấy thiết bị phù hợp.
                </td>
              </tr>
            ) : (
              filteredRouters.map((router) => (
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
                    {router.site?.province?.name}
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
