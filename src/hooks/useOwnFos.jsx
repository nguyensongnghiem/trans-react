import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/authContext";
import * as ownFoService from "../services/OwnFoService";
import { toast } from "react-toastify";

function useOwnFos() {
  const [ownFos, setOwnFos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { axiosPrivate } = useAuth();

  const fetchOwnFos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ownFoService.getOwnFos(axiosPrivate);
      setOwnFos(data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách cáp tự đầu tư:", error);
      toast.error("Không thể tải danh sách cáp tự đầu tư");
    } finally {
      setIsLoading(false);
    }
  }, [axiosPrivate]);

  useEffect(() => {
    fetchOwnFos();
  }, [fetchOwnFos]);

  const createOwnFo = async (data) => {
    try {
      await ownFoService.createOwnFo(axiosPrivate, data);
      toast.success("Thêm mới tuyến cáp thành công");
      await fetchOwnFos();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi thêm mới tuyến cáp");
      return false;
    }
  };

  const updateOwnFo = async (id, data) => {
    try {
      await ownFoService.updateOwnFo(axiosPrivate, id, data);
      toast.success("Cập nhật tuyến cáp thành công");
      await fetchOwnFos();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật tuyến cáp");
      return false;
    }
  };

  const deleteOwnFo = async (id) => {
    try {
      await ownFoService.deleteOwnFo(axiosPrivate, id);
      toast.success("Xóa tuyến cáp thành công");
      await fetchOwnFos();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi xóa tuyến cáp");
      return false;
    }
  };

  const uploadKml = async (id, file) => {
    try {
      await ownFoService.uploadKml(axiosPrivate, id, file);
      toast.success("Tải lên file KML thành công");
      await fetchOwnFos();
      return true;
    } catch (error) {
      toast.error("Lỗi khi tải lên file KML");
      return false;
    }
  };

  const downloadKml = (id, filename) => ownFoService.downloadKml(axiosPrivate, id, filename);
  const downloadTemplate = () => ownFoService.getImportTemplate(axiosPrivate);
  const checkImport = (formData) => ownFoService.checkImport(axiosPrivate, formData);
  const saveImport = async (formData) => {
    try {
      const res = await ownFoService.saveImport(axiosPrivate, formData);
      toast.success(res.message || "Import thành công");
      await fetchOwnFos();
      return true;
    } catch (error) {
      throw error;
    }
  };

  return {
    ownFos,
    isLoading,
    fetchOwnFos,
    createOwnFo,
    updateOwnFo,
    deleteOwnFo,
    uploadKml,
    downloadKml,
    downloadTemplate,
    checkImport,
    saveImport,
  };
}

export default useOwnFos;
