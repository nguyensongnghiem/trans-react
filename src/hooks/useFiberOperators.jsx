import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/authContext";
import * as fiberOperatorService from "../services/FiberOperatorService";

function useFiberOperators() {
    const [fiberOperators, setFiberOperators] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { axiosPrivate } = useAuth();

    const fetchFiberOperators = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fiberOperatorService.getFiberOperators(axiosPrivate);
            setFiberOperators(data);
            setError(null);
        } catch (err) {
            setError(err);
            toast.error("Lỗi khi tải danh sách đối tác!");
        } finally {
            setIsLoading(false);
        }
    }, [axiosPrivate]);

    const createFiberOperator = async (data) => {
        setIsLoading(true);
        try {
            const createdData = await fiberOperatorService.createFiberOperator(axiosPrivate, data);
            setFiberOperators((prev) => [...prev, createdData]);
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

    const updateFiberOperator = async (id, data) => {
        setIsLoading(true);
        try {
            const updatedData = await fiberOperatorService.updateFiberOperator(axiosPrivate, id, data);
            setFiberOperators((prev) => prev.map((item) => (item.id === id ? updatedData : item)));
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

    const deleteFiberOperator = async (id) => {
        setIsLoading(true);
        try {
            await fiberOperatorService.deleteFiberOperator(axiosPrivate, id);
            setFiberOperators((prev) => prev.filter((item) => item.id !== id));
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
        fetchFiberOperators();
    }, [fetchFiberOperators]);

    return { fiberOperators, isLoading, error, createFiberOperator, updateFiberOperator, deleteFiberOperator, fetchFiberOperators };
}

export default useFiberOperators;
