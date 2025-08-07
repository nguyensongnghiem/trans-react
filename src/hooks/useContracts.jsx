import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/authContext"; // Import your custom hook for authentication
const BASE_URL = import.meta.env.VITE_BE_API_URL;
function useContracts() {
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const {axiosPrivate} = useAuth();
  // Hàm để lấy danh sách (Read)
  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const response = await axiosPrivate.get(`${BASE_URL}/contracts`);
      setContracts(response.data);
      setError(null);
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi tải danh sách hợp đồng!");
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm để tạo mới (Create)
  const createContract = async (newContract) => {
    try {
      const response = await axiosPrivate.post(`${BASE_URL}/contracts`, newContract);
      // Cập nhật lại state sau khi thêm thành công
      setContracts((prevContracts) => [...prevContracts, response.data]);
      toast.success("Tạo hợp đồng thành công!");
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi tạo hợp đồng!");
    }
  };

  // Hàm để chỉnh sửa (Update)
  const updateContract = async (id, updatedContract) => {
    try {
      const response = await axiosPrivate.put(`${BASE_URL}/contracts/${id}`, updatedContract);
      setContracts((prevContracts) =>
        prevContracts.map((contract) =>
          contract.id === id ? response.data : contract
        )
      );
      toast.success("Cập nhật hợp đồng thành công!");
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi cập nhật hợp đồng!");
    }
  };

  // Hàm để xóa (Delete)
  const deleteContract = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/contracts/${id}`);
      setContracts((prevContracts) =>
        prevContracts.filter((contract) => contract.id !== id)
      );
      toast.success("Xóa hợp đồng thành công!");
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi xóa hợp đồng!");
    }
  };

  // Gọi hàm fetchContracts khi component mount lần đầu
  useEffect(() => {
    fetchContracts();
  }, []);

  return { contracts, isLoading, error, createContract, updateContract, deleteContract, fetchContracts };
}
export default useContracts;