import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/authContext";
import * as routerService from "../services/RouterService";

/**
 * Hook quản lý logic cho Router
 * Pattern: Component -> Hook -> Service -> Axios
 */
function useRouters() {
  const [routers, setRouters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { axiosPrivate } = useAuth();

  const fetchRouters = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await routerService.getRouters(axiosPrivate);
      setRouters(data);
      setError(null);
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi tải danh sách router!");
    } finally {
      setIsLoading(false);
    }
  }, [axiosPrivate]);

  const createRouter = async (newRouter) => {
    setIsLoading(true);
    try {
      const createdData = await routerService.createRouter(axiosPrivate, newRouter);
      setRouters((prev) => [...prev, createdData]);
      toast.success("Tạo router mới thành công!");
      return createdData;
    } catch (err) {
      setError(err);
      const message = err.response?.data?.message || "Lỗi khi tạo router!";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRouter = async (id, updatedData) => {
    setIsLoading(true);
    try {
      const responseData = await routerService.updateRouter(axiosPrivate, id, updatedData);
      setRouters((prev) =>
        prev.map((item) => (item.id === id ? responseData : item))
      );
      toast.success("Cập nhật router thành công!");
    } catch (err) {
      setError(err);
      const message = err.response?.data?.message || "Lỗi khi cập nhật router!";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRouter = async (id) => {
    setIsLoading(true);
    try {
      await routerService.deleteRouter(axiosPrivate, id);
      setRouters((prev) => prev.filter((item) => item.id !== id));
      toast.success("Xóa router thành công!");
    } catch (err) {
      setError(err);
      toast.error("Lỗi khi xóa router!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRouters();
  }, [fetchRouters]);

  return {
    routers,
    setRouters,
    isLoading,
    error,
    createRouter,
    updateRouter,
    deleteRouter,
    fetchRouters,
  };
}

export default useRouters;