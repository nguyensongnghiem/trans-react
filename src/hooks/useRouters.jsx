import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/authContext";
import * as routerService from "../services/RouterService";

/**
 * Hook quản lý logic cho Router
 * Pattern: Component -> Hook -> Service -> Axios
 */
function useRouters() {
  const [routers, setRouters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { axiosPrivate } = useAuth();

  const fetchRouters = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await routerService.getRouters(axiosPrivate);
      setRouters(data);
      setError(null);
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi tải danh sách router!");
    } finally {
      setIsLoading(false);
    }
  }, [axiosPrivate]);

  const createRouter = async (newRouter) => {
    setIsLoading(true);
    try {
      const createdData = await routerService.createRouter(axiosPrivate, newRouter);
      // Re-fetch all routers to ensure we have fully hydrated data (including nested relations)
      await fetchRouters();
      toast.success("Tạo router mới thành công!");
      return createdData;
    } catch (err) {
      setError(err);
      const message = err.response?.data?.message || "Lỗi khi tạo router!";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRouter = async (id, updatedData) => {
    setIsLoading(true);
    try {
      await routerService.updateRouter(axiosPrivate, id, updatedData);
      // Re-fetch all routers to ensure we have fully hydrated data (including nested relations)
      await fetchRouters();
      toast.success("Cập nhật router thành công!");
    } catch (err) {
      setError(err);
      const message = err.response?.data?.message || "Lỗi khi cập nhật router!";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRouter = async (id) => {
    setIsLoading(true);
    try {
      await routerService.deleteRouter(axiosPrivate, id);
      setRouters((prev) => prev.filter((item) => item.id !== id));
      toast.success("Xóa router thành công!");
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi xóa router!");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImportTemplate = async () => {
    try {
      const data = await routerService.getImportTemplate(axiosPrivate);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "router-import-template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Không thể tải file mẫu");
      console.error("Template download error:", error);
    }
  };

  const checkImportData = async (formData) => {
    // Hàm này sẽ throw lỗi, để component có thể bắt và xử lý
    try {
      const data = await routerService.checkImport(axiosPrivate, formData);
      toast.success("✔ File Excel hợp lệ, sẵn sàng để lưu.");
      return data; // Component sẽ dùng dữ liệu này để xem trước
    } catch (error) {
      toast.error("❌ Dữ liệu Excel không hợp lệ.");
      throw error; // Ném lỗi ra để component xử lý UI
    }
  };

  const saveImportData = async (formData) => {
    try {
      const res = await routerService.saveImport(axiosPrivate, formData);
      toast.success(res.message || "Import router thành công!");
      await fetchRouters(); // Tải lại danh sách
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi lưu dữ liệu import");
      throw error; // Ném lỗi ra để component xử lý
    }
  };

  useEffect(() => {
    fetchRouters();
  }, [fetchRouters]);

  return {
    routers,
    setRouters,
    isLoading,
    error,
    createRouter,
    updateRouter,
    deleteRouter,
    fetchRouters,
    downloadImportTemplate,
    checkImportData,
    saveImportData,
  };
}

export default useRouters;