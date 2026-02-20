import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/authContext";
import * as provinceService from "../services/ProvinceService";
import * as siteOwnerService from "../services/SiteOwnerService";
import * as transOwnerService from "../services/TransmissionOwnerService";
import * as siteTransTypeService from "../services/SiteTransmissionTypeService";
import * as siteTypeService from "../services/SiteTypeService";

/**
 * Hook tập trung dữ liệu danh mục (Metadata)
 */
export default function useMetadata() {
    const [provinces, setProvinces] = useState([]);
    const [siteOwners, setSiteOwners] = useState([]);
    const [transOwners, setTransOwners] = useState([]);
    const [transTypes, setTransTypes] = useState([]);
    const [siteTypes, setSiteTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { axiosPrivate } = useAuth();

    const fetchMetadata = useCallback(async () => {
        setIsLoading(true);
        try {
            const [p, so, to, tt, st] = await Promise.all([
                provinceService.getProvinces(axiosPrivate),
                siteOwnerService.getSiteOwners(axiosPrivate),
                transOwnerService.getTransmissionOwners(axiosPrivate),
                siteTransTypeService.getSiteTransmissionTypes(axiosPrivate),
                siteTypeService.getSiteTypes(axiosPrivate),
            ]);
            setProvinces(p || []);
            setSiteOwners(so || []);
            setTransOwners(to || []);
            setTransTypes(tt || []);
            setSiteTypes(st || []);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu danh mục:", error);
        } finally {
            setIsLoading(false);
        }
    }, [axiosPrivate]);

    useEffect(() => {
        fetchMetadata();
    }, [fetchMetadata]);

    return { provinces, siteOwners, transOwners, transTypes, siteTypes, isLoading, refresh: fetchMetadata };
}
