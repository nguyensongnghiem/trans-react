import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/authContext";
import * as licenseService from "../services/MicrowaveLicenseService";
import { toast } from "react-toastify";

function useMicrowaveLicenses() {
  const [licenses, setLicenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { axiosPrivate } = useAuth();

  const fetchLicenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await licenseService.getMicrowaveLicenses(axiosPrivate);
      setLicenses(data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách giấy phép:", error);
      toast.error("Không thể tải danh sách giấy phép");
    } finally {
      setIsLoading(false);
    }
  }, [axiosPrivate]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const createLicense = async (data) => {
    try {
      await licenseService.createMicrowaveLicense(axiosPrivate, data);
      toast.success("Thêm mới giấy phép thành công");
      await fetchLicenses();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi thêm mới giấy phép");
      return false;
    }
  };

  const updateLicense = async (id, data) => {
    try {
      await licenseService.updateMicrowaveLicense(axiosPrivate, id, data);
      toast.success("Cập nhật giấy phép thành công");
      await fetchLicenses();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật giấy phép");
      return false;
    }
  };

  const deleteLicense = async (id) => {
    try {
      await licenseService.deleteMicrowaveLicense(axiosPrivate, id);
      toast.success("Xóa giấy phép thành công");
      await fetchLicenses();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi xóa giấy phép");
      return false;
    }
  };

  return {
    licenses,
    isLoading,
    fetchLicenses,
    createLicense,
    updateLicense,
    deleteLicense,
  };
}

export default useMicrowaveLicenses;
