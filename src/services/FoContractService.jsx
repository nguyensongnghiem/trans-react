// FoContractService.js
import { postFile } from "./apiService";

export const checkExcelImport = async (axiosInstance, file, contractNumber) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("contractNumber", contractNumber.toUpperCase());

    return postFile(axiosInstance, "contract/import-excel/check", formData);
};

export const getAllSites = async (axiosInstance) => {
    const response = await axiosInstance.get('/sites');
    return response.data;
};

export const searchSites = async (axiosInstance, { page, siteId, transOwner, transType, province }) => {
    const query = `/sites/search?page=${page}&siteId=${siteId}&transOwner=${transOwner}&transType=${transType}&province=${province}`;
    const response = await axiosInstance.get(query);
    return response.data;
};

export const saveSite = async (axiosInstance, siteData) => {
    const response = await axiosInstance.post("/sites", siteData);
    return response.data;
};

export const deleteSite = async (axiosInstance, id) => {
    await axiosInstance.delete(`/sites/${id}`);
    return true;
};

export const getSiteById = async (axiosInstance, id) => {
    const response = await axiosInstance.get(`/sites/${id}`);
    return response.data;
};

export const getTotalSites = async (axiosInstance) => {
    const response = await axiosInstance.get(`/sites/reports/total`);
    return response.data;
};

export const countByProvince = async (axiosInstance, province) => {
    const response = await axiosInstance.get(`/sites/reports/count-by-province?province=${province}`);
    return response.data;
};

export const countByTransmissionType = async (axiosInstance, transmissionType) => {
    const response = await axiosInstance.get(`/sites/reports/count-by-transmission-type?transmission-type=${transmissionType}`);
    return response.data;
};
