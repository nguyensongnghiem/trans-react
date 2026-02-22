import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/authContext";
import * as leaselineService from "../services/LeaselineService";

/**
 * Hook quản lý logic cho Leaseline
 * Pattern: Component -> Hook -> Service -> Axios
 */
function useLeaselines() {
  const [leaselines, setLeaselines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, totalCost: 0 });
  const { axiosPrivate } = useAuth();

  const fetchLeaselines = useCallback(async () => {
    setIsLoading(true);
    try {
      const [data, total, cost] = await Promise.all([
        leaselineService.getLeaselines(axiosPrivate),
        leaselineService.getTotalLeaselines(axiosPrivate),
        leaselineService.getTotalCostPerMonth(axiosPrivate),
      ]);
      setLeaselines(data);
      setStats({ total, totalCost: cost });
      setError(null);
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi tải danh sách kênh thuê!");
    } finally {
      setIsLoading(false);
    }
  }, [axiosPrivate]);

  const createLeaseline = async (newLeaseline) => {
    setIsLoading(true);
    try {
      const createdData = await leaselineService.createLeaseline(axiosPrivate, newLeaseline);
      await fetchLeaselines();
      toast.success("Thêm mới thành công!");
      return createdData;
    } catch (err) {
      setError(err);
      const message = err.response?.data?.message || "Lỗi khi thêm mới!";
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateLeaseline = async (id, updatedData) => {
    setIsLoading(true);
    try {
      await leaselineService.updateLeaseline(axiosPrivate, id, updatedData);
      await fetchLeaselines();
      toast.success("Cập nhật thành công!");
      return true;
    } catch (err) {
      setError(err);
      const message = err.response?.data?.message || "Lỗi khi cập nhật!";
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLeaseline = async (id) => {
    setIsLoading(true);
    try {
      await leaselineService.deleteLeaseline(axiosPrivate, id);
      setLeaselines((prev) => prev.filter((item) => item.id !== id));
      toast.success("Xóa thành công!");
      return true;
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi xóa!");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const data = await leaselineService.getImportTemplate(axiosPrivate);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "leaseline-import-template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Không thể tải file mẫu");
    }
  };

  const checkImport = async (formData) => {
    try {
      const data = await leaselineService.checkImport(axiosPrivate, formData);
      toast.success("✔ File Excel hợp lệ.");
      return data;
    } catch (error) {
      toast.error("❌ Dữ liệu Excel không hợp lệ.");
      throw error;
    }
  };

  const saveImport = async (formData) => {
    try {
      const res = await leaselineService.saveImport(axiosPrivate, formData);
      toast.success(res.message || "Import thành công!");
      await fetchLeaselines();
      return res;
    } catch (error) {
      const message = error.response?.data?.message || "Lỗi khi lưu dữ liệu import";
      toast.error(message);
      throw error;
    }
  };

  useEffect(() => {
    fetchLeaselines();
  }, [fetchLeaselines]);

  return {
    leaselines,
    isLoading,
    error,
    stats,
    createLeaseline,
    updateLeaseline,
    deleteLeaseline,
    fetchLeaselines,
    downloadTemplate,
    checkImport,
    saveImport,
  };
}

export default useLeaselines;
