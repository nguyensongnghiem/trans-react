import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/authContext"; // Import your custom hook for authentication
const BASE_URL = import.meta.env.VITE_BE_API_URL;
function useRouters() { 
  const [routers, setRouters] = useState([]);  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const {axiosPrivate} = useAuth();  
  const fetchRouters = async () => {
    setIsLoading(true);
    try {
      const response = await axiosPrivate.get(`${BASE_URL}/routers`);
      setRouters(response.data);
      setError(null);
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi tải danh sách router!");
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm để tạo mới (Create)
  const createRouter = async (newRouter) => {
    try {
      const response = await axiosPrivate.post(`${BASE_URL}/routers`, newRouter);
      // Cập nhật lại state sau khi thêm thành công
      setRouters((prevRouters) => [...prevRouters, response.data]);
      toast.success("Tạo router mới thành công!");
    } catch (error) {
      setError(error);
      toast.error(error.response.data.message, {
        zIndex: 9999,
      });
    }
    finally {
      setIsLoading(false);
    }
  };

  // Hàm để chỉnh sửa (Update)
  const updateRouter = async (id, updatedRouter) => {
    try {
      const response = await axiosPrivate.put(`${BASE_URL}/routers/${id}`, updatedRouter);
      setRouters((prevRouters) =>
        prevRouters.map((router) =>
          router.id === id ? response.data : router
        )
      );
      toast.success("Cập nhật router thành công!");
    } catch (error) {
      setError(error);
      toast.error("Lỗi khi cập nhật thông tin router!");
    }
    finally {
      setIsLoading(false);
    }
  };

  // Hàm để xóa (Delete)
  const deleteRouter = async (id) => {
    try {
      await axiosPrivate.delete(`${BASE_URL}/routers/${id}`);
      setRouters((prevRouters) =>
        prevRouters.filter((router) => router.id !== id)
      );
      toast.success("Xóa router thành công!");
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi xóa router khỏi hệ thống!");
    }
    finally {
      setIsLoading(false);
    }
  };  
  useEffect(() => {
    fetchRouters();
  }, []);

  return { routers, setRouters, isLoading,  createRouter, updateRouter, deleteRouter, fetchRouters };
}
export default useRouters;