// VendorService.jsx

export const getVendors = async (axiosInstance) => {
    const response = await axiosInstance.get('/vendors');
    return response.data;
};
