import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/authContext";
import * as fiberTypeService from "../services/FiberTypeService";

/**
 * Hook quản lý logic cho FiberType
 * Pattern: Component -> Hook -> Service -> Axios
 */
function useFiberTypes() {
  const [fiberTypes, setFiberTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { axiosPrivate } = useAuth();

  const fetchFiberTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fiberTypeService.getFiberTypes(axiosPrivate);
      setFiberTypes(data);
      setError(null);
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi tải danh sách loại cáp!");
    } finally {
      setIsLoading(false);
    }
  }, [axiosPrivate]);

  const createFiberType = async (data) => {
    setIsLoading(true);
    try {
      const createdData = await fiberTypeService.createFiberType(axiosPrivate, data);
      setFiberTypes((prev) => [...prev, createdData]);
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

  const updateFiberType = async (id, data) => {
    setIsLoading(true);
    try {
      const updatedData = await fiberTypeService.updateFiberType(axiosPrivate, id, data);
      setFiberTypes((prev) => prev.map((item) => (item.id === id ? updatedData : item)));
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

  const deleteFiberType = async (id) => {
    setIsLoading(true);
    try {
      await fiberTypeService.deleteFiberType(axiosPrivate, id);
      setFiberTypes((prev) => prev.filter((item) => item.id !== id));
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
    fetchFiberTypes();
  }, [fetchFiberTypes]);

  return { fiberTypes, isLoading, error, createFiberType, updateFiberType, deleteFiberType, fetchFiberTypes };
}

export default useFiberTypes;
