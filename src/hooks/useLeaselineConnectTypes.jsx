import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/authContext";
import * as leaselineConnectTypeService from "../services/LeaselineConnectTypeService";

function useLeaselineConnectTypes() {
  const [leaselineConnectTypes, setLeaselineConnectTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { axiosPrivate } = useAuth();

  const fetchLeaselineConnectTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await leaselineConnectTypeService.getLeaselineConnectTypes(axiosPrivate);
      setLeaselineConnectTypes(data || []);
    } catch (error) {
      console.error("Lỗi khi tải loại kết nối kênh thuê:", error);
    } finally {
      setIsLoading(false);
    }
  }, [axiosPrivate]);

  useEffect(() => {
    fetchLeaselineConnectTypes();
  }, [fetchLeaselineConnectTypes]);

  return { leaselineConnectTypes, isLoading, refresh: fetchLeaselineConnectTypes };
}

export default useLeaselineConnectTypes;
