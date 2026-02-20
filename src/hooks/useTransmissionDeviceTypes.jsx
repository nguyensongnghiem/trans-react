import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/authContext";
import * as transmissionDeviceTypeService from "../services/TransmissionDeviceTypeService";

/**
 * Hook quản lý logic cho TransmissionDeviceType
 * Pattern: Component -> Hook -> Service -> Axios
 */
function useTransmissionDeviceTypes() {
  const [transmissionDeviceTypes, setTransmissionDeviceTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { axiosPrivate } = useAuth();

  const fetchTransmissionDeviceTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await transmissionDeviceTypeService.getTransmissionDeviceTypes(axiosPrivate);
      setTransmissionDeviceTypes(data);
      setError(null);
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi tải danh sách loại thiết bị truyền dẫn!");
    } finally {
      setIsLoading(false);
    }
  }, [axiosPrivate]);

  const createTransmissionDeviceType = async (data) => {
    setIsLoading(true);
    try {
      const createdData = await transmissionDeviceTypeService.createTransmissionDeviceType(axiosPrivate, data);
      setTransmissionDeviceTypes((prev) => [...prev, createdData]);
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

  const updateTransmissionDeviceType = async (id, data) => {
    setIsLoading(true);
    try {
      const updatedData = await transmissionDeviceTypeService.updateTransmissionDeviceType(axiosPrivate, id, data);
      setTransmissionDeviceTypes((prev) =>
        prev.map((item) => (item.id === id ? updatedData : item))
      );
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

  const deleteTransmissionDeviceType = async (id) => {
    setIsLoading(true);
    try {
      await transmissionDeviceTypeService.deleteTransmissionDeviceType(axiosPrivate, id);
      setTransmissionDeviceTypes((prev) => prev.filter((item) => item.id !== id));
      toast.success("Xóa thành công!");
      return true;
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi xóa (có thể đang được sử dụng)!");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransmissionDeviceTypes();
  }, [fetchTransmissionDeviceTypes]);

  return {
    transmissionDeviceTypes,
    setTransmissionDeviceTypes,
    isLoading,
    error,
    createTransmissionDeviceType,
    updateTransmissionDeviceType,
    deleteTransmissionDeviceType,
    fetchTransmissionDeviceTypes,
  };
}

export default useTransmissionDeviceTypes;
