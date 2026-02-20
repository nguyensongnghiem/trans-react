import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/authContext";
import * as microwaveTypeService from "../services/MicrowaveTypeService";
import * as vendorService from "../services/VendorService";

/**
 * Hook quản lý logic cho MicrowaveType
 * Pattern: Component -> Hook -> Service -> Axios
 */
function useMicrowaveTypes() {
  const [microwaveTypes, setMicrowaveTypes] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { axiosPrivate } = useAuth();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [typesData, vendorsData] = await Promise.all([
        microwaveTypeService.getMicrowaveTypes(axiosPrivate),
        vendorService.getVendors(axiosPrivate),
      ]);
      setMicrowaveTypes(typesData);
      setVendors(vendorsData);
      setError(null);
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi tải dữ liệu cho loại Viba!");
    } finally {
      setIsLoading(false);
    }
  }, [axiosPrivate]);

  const createMicrowaveType = async (data) => {
    setIsLoading(true);
    try {
      const createdData = await microwaveTypeService.createMicrowaveType(axiosPrivate, data);
      // Re-fetch để đảm bảo dữ liệu vendor được join đầy đủ
      await fetchData();
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

  const updateMicrowaveType = async (id, data) => {
    setIsLoading(true);
    try {
      const updatedData = await microwaveTypeService.updateMicrowaveType(axiosPrivate, id, data);
      setMicrowaveTypes((prev) => prev.map((item) => (item.id === id ? updatedData : item)));
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

  const deleteMicrowaveType = async (id) => {
    setIsLoading(true);
    try {
      await microwaveTypeService.deleteMicrowaveType(axiosPrivate, id);
      setMicrowaveTypes((prev) => prev.filter((item) => item.id !== id));
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
    fetchData();
  }, [fetchData]);

  return { microwaveTypes, vendors, isLoading, error, createMicrowaveType, updateMicrowaveType, deleteMicrowaveType, fetchData };
}

export default useMicrowaveTypes;