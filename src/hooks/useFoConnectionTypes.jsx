import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/authContext";
import * as foConnectionTypeService from "../services/FoConnectionTypeService";

function useFoConnectionTypes() {
    const [foConnectionTypes, setFoConnectionTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { axiosPrivate } = useAuth();

    const fetchFoConnectionTypes = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await foConnectionTypeService.getFoConnectionTypes(axiosPrivate);
            setFoConnectionTypes(data);
            setError(null);
        } catch (err) {
            setError(err);
            toast.error("Lỗi khi tải danh sách hình thức kết nối!");
        } finally {
            setIsLoading(false);
        }
    }, [axiosPrivate]);

    const createFoConnectionType = async (data) => {
        setIsLoading(true);
        try {
            const createdData = await foConnectionTypeService.createFoConnectionType(axiosPrivate, data);
            setFoConnectionTypes((prev) => [...prev, createdData]);
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

    const updateFoConnectionType = async (id, data) => {
        setIsLoading(true);
        try {
            const updatedData = await foConnectionTypeService.updateFoConnectionType(axiosPrivate, id, data);
            setFoConnectionTypes((prev) => prev.map((item) => (item.id === id ? updatedData : item)));
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

    const deleteFoConnectionType = async (id) => {
        setIsLoading(true);
        try {
            await foConnectionTypeService.deleteFoConnectionType(axiosPrivate, id);
            setFoConnectionTypes((prev) => prev.filter((item) => item.id !== id));
            toast.success("Xóa thành công!");
            return true;
        } catch (err) {
            setError(err);
            toast.error("Lỗi khi xóa!");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFoConnectionTypes();
    }, [fetchFoConnectionTypes]);

    return { foConnectionTypes, isLoading, error, createFoConnectionType, updateFoConnectionType, deleteFoConnectionType, fetchFoConnectionTypes };
}

export default useFoConnectionTypes;
