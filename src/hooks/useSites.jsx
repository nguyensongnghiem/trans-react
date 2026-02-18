import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/authContext";
import * as siteService from "../services/SiteService";

/**
 * Hook quản lý logic cho Site
 * Pattern: Component -> Hook -> Service -> Axios
 */
function useSites() {
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { axiosPrivate } = useAuth();

  const fetchSites = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await siteService.getAllSites(axiosPrivate);
      setSites(data);
      setError(null);
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi tải danh sách trạm!");
    } finally {
      setIsLoading(false);
    }
  }, [axiosPrivate]);

  const createSite = async (newSite) => {
    setIsLoading(true);
    try {
      const createdData = await siteService.createSite(axiosPrivate, newSite);
      setSites((prev) => [...prev, createdData]);
      toast.success("Tạo trạm mới thành công!");
      return createdData;
    } catch (err) {
      setError(err);
      const message = err.response?.data?.message || "Lỗi khi tạo trạm mới!";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSite = async (id, updatedData) => {
    setIsLoading(true);
    try {
      const responseData = await siteService.updateSite(axiosPrivate, id, updatedData);
      setSites((prev) =>
        prev.map((item) => (item.id === id ? responseData : item))
      );
      toast.success("Cập nhật trạm thành công!");
    } catch (err) {
      setError(err);
      const message = err.response?.data?.message || "Lỗi khi cập nhật trạm!";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSite = async (id) => {
    setIsLoading(true);
    try {
      await siteService.deleteSite(axiosPrivate, id);
      setSites((prev) => prev.filter((item) => item.id !== id));
      toast.success("Xóa trạm thành công!");
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi xóa trạm khỏi hệ thống!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const downloadImportTemplate = async () => {
    try {
      const data = await siteService.getImportTemplate(axiosPrivate);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "site-import-template.xlsx");
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
    try {
      const data = await siteService.checkImport(axiosPrivate, formData);
      toast.success("✔ File Excel hợp lệ, sẵn sàng để lưu.");
      return data;
    } catch (error) {
      toast.error("❌ Dữ liệu Excel không hợp lệ.");
      throw error;
    }
  };

  const saveImportData = async (formData) => {
    try {
      const res = await siteService.saveImport(axiosPrivate, formData);
      toast.success(res.message || "Import trạm thành công!");
      await fetchSites(); // Tải lại danh sách
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi lưu dữ liệu import");
      throw error;
    }
  };

  return { sites, isLoading, error, createSite, updateSite, deleteSite, fetchSites, downloadImportTemplate, checkImportData, saveImportData };
}

export default useSites;