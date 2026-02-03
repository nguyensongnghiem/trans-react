// VendorService.jsx

export const getVendors = async (axiosInstance) => {
    const response = await axiosInstance.get('/vendors');
    return response.data;
};

export const createVendor = async (axiosInstance, data) => {
    const response = await axiosInstance.post('/vendors', data);
    return response.data;
};

export const updateVendor = async (axiosInstance, id, data) => {
    const response = await axiosInstance.put(`/vendors/${id}`, data);
    return response.data;
};

export const deleteVendor = async (axiosInstance, id) => {
    const response = await axiosInstance.delete(`/vendors/${id}`);
    return response.data;
};
