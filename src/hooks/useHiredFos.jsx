import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/authContext";
import * as hiredFoService from "../services/HiredFoService";

/**
 * Hook quản lý logic cho HiredFo
 * Pattern: Component -> Hook -> Service -> Axios
 */
function useHiredFos() {
  const [hiredFos, setHiredFos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { axiosPrivate } = useAuth();

  const fetchHiredFos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await hiredFoService.getHiredFos(axiosPrivate);
      setHiredFos(data);
      setError(null);
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi tải danh sách FO thuê!");
    } finally {
      setIsLoading(false);
    }
  }, [axiosPrivate]);

  const getHiredFoById = useCallback(async (id) => {
    try {
      return await hiredFoService.getHiredFoById(axiosPrivate, id);
    } catch (err) {
      toast.error("Lỗi khi lấy thông tin FO thuê!");
      return null;
    }
  }, [axiosPrivate]);

  const createHiredFo = async (newHiredFo) => {
    setIsLoading(true);
    try {
      const createdData = await hiredFoService.createHiredFo(axiosPrivate, newHiredFo);
      await fetchHiredFos(); // Re-fetch to get fully hydrated data
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

  const updateHiredFo = async (id, updatedData) => {
    setIsLoading(true);
    try {
      await hiredFoService.updateHiredFo(axiosPrivate, id, updatedData);
      await fetchHiredFos();
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

  const deleteHiredFo = async (id) => {
    setIsLoading(true);
    try {
      await hiredFoService.deleteHiredFo(axiosPrivate, id);
      setHiredFos((prev) => prev.filter((item) => item.id !== id));
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

  const downloadImportTemplate = async () => {
    try {
      console.log("Downloading import template...");
      const data = await hiredFoService.getImportTemplate(axiosPrivate);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "hired-fo-import-template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Không thể tải file mẫu");
    }
  };

  const checkImportMulti = async (formData) => {
    try {
      const data = await hiredFoService.checkImportMulti(axiosPrivate, formData);
      toast.success("✔ File Excel hợp lệ.");
      return data;
    } catch (error) {
      toast.error("❌ Dữ liệu Excel không hợp lệ.");
      throw error;
    }
  };

  const saveImportMulti = async (formData) => {
    try {
      const res = await hiredFoService.saveImportMulti(axiosPrivate, formData);
      toast.success(res.message || "Import thành công!");
      await fetchHiredFos();
      return res;
    } catch (error) {
      const message = error.response?.data?.message || "Lỗi khi lưu dữ liệu import";
      toast.error(message);
      throw error;
    }
  };

  useEffect(() => {
    fetchHiredFos();
  }, [fetchHiredFos]);

  return {
    hiredFos,
    isLoading,
    error,
    createHiredFo,
    updateHiredFo,
    deleteHiredFo,
    getHiredFoById,
    fetchHiredFos,
    downloadImportTemplate,
    checkImportMulti,
    saveImportMulti,
  };
}

export default useHiredFos;
