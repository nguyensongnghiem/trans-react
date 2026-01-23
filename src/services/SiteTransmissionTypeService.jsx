// SiteTransmissionTypeService.js
export const getAll = async (axiosInstance) => {
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