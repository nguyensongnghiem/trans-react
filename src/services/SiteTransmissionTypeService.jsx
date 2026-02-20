// SiteTransmissionTypeService.js
export const getSiteTransmissionTypes = async (axiosInstance) => {
    const response = await axiosInstance.get('/site-transmission-types');
    return response.data;
};

export const getTotalFoSite = async (axiosInstance) => {
    const response = await axiosInstance.get('/site-transmission-types/totalFo');
    return response.data;
};

export const getTotalMWSite = async (axiosInstance) => {
    const response = await axiosInstance.get('/site-transmission-types/totalMW');
    return response.data;
};

export const getTotalLLSite = async (axiosInstance) => {
    const response = await axiosInstance.get('/site-transmission-types/totalLL');
    return response.data;
};

export const createSiteTransmissionType = async (axiosInstance, data) => {
    const response = await axiosInstance.post('/site-transmission-types', data);
    return response.data;
};

export const updateSiteTransmissionType = async (axiosInstance, id, data) => {
    const response = await axiosInstance.put(`/site-transmission-types/${id}`, data);
    return response.data;
};

export const deleteSiteTransmissionType = async (axiosInstance, id) => {
    const response = await axiosInstance.delete(`/site-transmission-types/${id}`);
    return response.data;
};
