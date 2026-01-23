// SiteOwnerService.js
export const getAll = async (axiosInstance) => {
    const response = await axiosInstance.get('/siteOwners');
    return response.data;
};