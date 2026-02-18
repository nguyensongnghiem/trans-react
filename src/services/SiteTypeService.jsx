// SiteTypeService.js

export const getSiteTypes = async (axiosInstance) => {
    const response = await axiosInstance.get('/site-type');
    return response.data;
};