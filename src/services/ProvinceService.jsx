// ProvinceService.js
export const getAll = async (axiosInstance) => {
    const response = await axiosInstance.get('/provinces');
    return response.data;
};