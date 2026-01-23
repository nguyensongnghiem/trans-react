import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/authContext";
import * as provinceService from "../services/ProvinceService";
import * as siteOwnerService from "../services/SiteOwnerService";
import * as transOwnerService from "../services/TransmissionOwnerService";
import * as siteTransTypeService from "../services/SiteTransmissionTypeService";

/**
 * Hook tập trung dữ liệu danh mục (Metadata)
 */
export default function useMetadata() {
    const [provinces, setProvinces] = useState([]);
    const [siteOwners, setSiteOwners] = useState([]);
    const [transOwners, setTransOwners] = useState([]);
    const [transTypes, setTransTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { axiosPrivate } = useAuth();

    const fetchMetadata = useCallback(async () => {
        setIsLoading(true);
        try {
            const [p, so, to, tt] = await Promise.all([
                provinceService.getAll(axiosPrivate),
                siteOwnerService.getAll(axiosPrivate),
                transOwnerService.getAll(axiosPrivate),
                siteTransTypeService.getAll(axiosPrivate),
            ]);
            setProvinces(p || []);
            setSiteOwners(so || []);
            setTransOwners(to || []);
            setTransTypes(tt || []);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu danh mục:", error);
        } finally {
            setIsLoading(false);
        }
    }, [axiosPrivate]);

    useEffect(() => {
        fetchMetadata();
    }, [fetchMetadata]);

    return { provinces, siteOwners, transOwners, transTypes, isLoading, refresh: fetchMetadata };
}
