import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/authContext";
import * as contractService from "../services/FoContractService";

function useContracts() {
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { axiosPrivate } = useAuth();

  const fetchContracts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await contractService.getContracts(axiosPrivate);
      setContracts(data);
      setError(null);
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi tải danh sách hợp đồng!");
    } finally {
      setIsLoading(false);
    }
  }, [axiosPrivate]);

  const createContract = async (formData) => {
    setIsLoading(true);
    try {
      const data = await contractService.createFullContract(axiosPrivate, formData);
      await fetchContracts();
      toast.success("Tạo hợp đồng thành công!");
      return data;
    } catch (err) {
      setError(err);
      const message = err.response?.data?.message || "Lỗi khi tạo hợp đồng!";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateContract = async (id, updatedContract) => {
    setIsLoading(true);
    try {
      const data = await contractService.updateContract(axiosPrivate, id, updatedContract);
      await fetchContracts();
      toast.success("Cập nhật hợp đồng thành công!");
      return data;
    } catch (err) {
      setError(err);
      const message = err.response?.data?.message || "Lỗi khi cập nhật hợp đồng!";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteContract = async (id) => {
    setIsLoading(true);
    try {
      await contractService.deleteContract(axiosPrivate, id);
      setContracts((prev) => prev.filter((c) => c.id !== id));
      toast.success("Xóa hợp đồng thành công!");
      return true;
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi xóa hợp đồng!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  return {
    contracts,
    isLoading,
    error,
    createContract,
    updateContract,
    deleteContract,
    fetchContracts,
  };
}

export default useContracts;
