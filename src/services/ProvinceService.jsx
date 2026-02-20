// ProvinceService.js
export const getProvinces = async (axiosInstance) => {
    const response = await axiosInstance.get('/provinces');
    return response.data;
};