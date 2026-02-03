// SiteOwnerService.jsx

export const getSiteOwners = async (axiosInstance) => {
    const response = await axiosInstance.get('/siteOwners');
    return response.data;
};

export const createSiteOwner = async (axiosInstance, data) => {
    const response = await axiosInstance.post('/siteOwners', data);
    return response.data;
};

export const updateSiteOwner = async (axiosInstance, id, data) => {
    const response = await axiosInstance.put(`/siteOwners/${id}`, data);
    return response.data;
};

export const deleteSiteOwner = async (axiosInstance, id) => {
    const response = await axiosInstance.delete(`/siteOwners/${id}`);
    return response.data;
};