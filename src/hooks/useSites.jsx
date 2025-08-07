import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/authContext"; // Import your custom hook for authentication
const BASE_URL = import.meta.env.VITE_BE_API_URL;
function useSites() { 
  const [sites, setSites] = useState([]);  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const {axiosPrivate} = useAuth();  
  const fetchSites = async () => {
    setIsLoading(true);
    try {
      const response = await axiosPrivate.get(`${BASE_URL}/sites`);
      setSites(response.data);
      setError(null);
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi tải danh sách trạm!");
    } finally {
      setIsLoading(false);
    }    
  };

  // Hàm để tạo mới (Create)
  const createSite = async (newSite) => {
    try {
      const response = await axiosPrivate.post(`${BASE_URL}/sites`, newSite);
      // Cập nhật lại state sau khi thêm thành công
      setSites((prevSites) => [...prevSites, response.data]);
      toast.success("Tạo trạm mới thành công!");
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi tạo trạm mới!");
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm để chỉnh sửa (Update)
  const updateSite = async (id, updatedSite) => {
    try {
      const response = await axiosPrivate.put(`${BASE_URL}/sites/${id}`, updatedSite);
      setSites((prevSites) =>
        prevSites.map((site) =>
          site.id === id ? response.data : site
        )
      );
      toast.success("Cập nhật trạm thành công!");
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi cập nhật thông tin trạm!");
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm để xóa (Delete)
  const deleteSite = async (id) => {
    try {
      await axiosPrivate.delete(`${BASE_URL}/sites/${id}`);
      setSites((prevSites) =>
        prevSites.filter((site) => site.id !== id)
      );
      toast.success("Xóa trạm thành công!");
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi xóa trạm khỏi hệ thống!");
    } finally {
      setIsLoading(false);
    }
  };

  // Gọi hàm fetchContracts khi component mount lần đầu
  useEffect(() => {
    fetchSites();
  }, []);

  return { sites, isLoading, createSite, updateSite, deleteSite, fetchSites };
}
export default useSites;