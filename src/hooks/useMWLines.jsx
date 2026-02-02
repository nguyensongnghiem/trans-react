import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/authContext";
import * as mwLineService from "../services/MWLineService";

function useMWLines() {
    const [mwLines, setMWLines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { axiosPrivate } = useAuth();

    const fetchMWLines = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await mwLineService.getMWLines(axiosPrivate);
            console.log("MWLines data:", data);
            setMWLines(data);
            setError(null);
        } catch (err) {
            setError(err);
            toast.error("Lỗi khi tải danh sách tuyến viba!");
        } finally {
            setIsLoading(false);
        }
    }, [axiosPrivate]);

    const createMWLine = async (newMWLine) => {
        setIsLoading(true);
        try {
            await mwLineService.createMWLine(axiosPrivate, newMWLine);
            await fetchMWLines();
            toast.success("Tạo tuyến viba mới thành công!");
        } catch (err) {
            setError(err);
            toast.error("Lỗi khi tạo tuyến viba!");
        } finally {
            setIsLoading(false);
        }
    };

    const updateMWLine = async (id, updatedData) => {
        setIsLoading(true);
        try {
            await mwLineService.updateMWLine(axiosPrivate, id, updatedData);
            await fetchMWLines();
            toast.success("Cập nhật tuyến viba thành công!");
        } catch (err) {
            setError(err);
            toast.error("Lỗi khi cập nhật tuyến viba!");
        } finally {
            setIsLoading(false);
        }
    };

    const deleteMWLine = async (id) => {
        setIsLoading(true);
        try {
            await mwLineService.deleteMWLine(axiosPrivate, id);
            setMWLines((prev) => prev.filter((item) => item.id !== id));
            toast.success("Xóa tuyến viba thành công!");
        } catch (err) {
            setError(err);
            toast.error("Lỗi khi xóa tuyến viba!");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMWLines();
    }, [fetchMWLines]);

    return {
        mwLines,
        isLoading,
        error,
        createMWLine,
        updateMWLine,
        deleteMWLine,
        fetchMWLines,
    };
}

export default useMWLines;
