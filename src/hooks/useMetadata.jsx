import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/authContext";
import * as provinceService from "../services/ProvinceService";
import * as siteOwnerService from "../services/SiteOwnerService";
import * as transOwnerService from "../services/TransmissionOwnerService";
import * as siteTransTypeService from "../services/SiteTransmissionTypeService";
import * as siteTypeService from "../services/SiteTypeService";
import * as fiberTypeService from "../services/FiberTypeService";
import * as foConnectionTypeService from "../services/FoConnectionTypeService";

/**
 * Hook tập trung dữ liệu danh mục (Metadata)
 */
export default function useMetadata() {
    const [provinces, setProvinces] = useState([]);
    const [siteOwners, setSiteOwners] = useState([]);
    const [transOwners, setTransOwners] = useState([]);
    const [transTypes, setTransTypes] = useState([]);
    const [siteTypes, setSiteTypes] = useState([]);
    const [fiberTypes, setFiberTypes] = useState([]);
    const [foConnectionTypes, setFoConnectionTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { axiosPrivate } = useAuth();

    const fetchMetadata = useCallback(async () => {
        setIsLoading(true);
        try {
            const [p, so, to, tt, st, ft, fct] = await Promise.all([
                provinceService.getProvinces(axiosPrivate),
                siteOwnerService.getSiteOwners(axiosPrivate),
                transOwnerService.getTransmissionOwners(axiosPrivate),
                siteTransTypeService.getSiteTransmissionTypes(axiosPrivate),
                siteTypeService.getSiteTypes(axiosPrivate),
                fiberTypeService.getFiberTypes(axiosPrivate),
                foConnectionTypeService.getFoConnectionTypes(axiosPrivate),
            ]);
            setProvinces(p || []);
            setSiteOwners(so || []);
            setTransOwners(to || []);
            setTransTypes(tt || []);
            setSiteTypes(st || []);
            setFiberTypes(ft || []);
            setFoConnectionTypes(fct || []);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu danh mục:", error);
        } finally {
            setIsLoading(false);
        }
    }, [axiosPrivate]);

    useEffect(() => {
        fetchMetadata();
    }, [fetchMetadata]);

    return { provinces, siteOwners, transOwners, transTypes, siteTypes, fiberTypes, foConnectionTypes, isLoading, refresh: fetchMetadata };
}
