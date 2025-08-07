import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/authContext"; // Import your custom hook for authentication
const BASE_URL = import.meta.env.VITE_BE_API_URL;
function useSimpleSites() {
  const [simpleSites, setSimpleSites] = useState([]);    
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const {axiosPrivate} = useAuth();
  // Hàm để lấy danh sách (Read)
  const fetchSimpleSites = async () => {
    setIsLoading(true);
    try {
      const response = await axiosPrivate.get(`${BASE_URL}/sites/simple-list`);
      setSimpleSites(response.data);
      setError(null);
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi tải danh sách trạm!");
    } finally {
      setIsLoading(false);
    }
  };

  

  // Gọi hàm fetchContracts khi component mount lần đầu
  useEffect(() => {
    fetchSimpleSites();
  }, []);

  return {  simpleSites, isLoading, error,fetchSimpleSites};
}
export default useSimpleSites;