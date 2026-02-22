// FiberTypeService.jsx
export const getFiberTypes = async (axiosInstance) => {
    const response = await axiosInstance.get('/fiber-types');
    return response.data;
};

export const createFiberType = async (axiosInstance, data) => {
    const response = await axiosInstance.post('/fiber-types', data);
    return response.data;
};

export const updateFiberType = async (axiosInstance, id, data) => {
    const response = await axiosInstance.put(`/fiber-types/${id}`, data);
    return response.data;
};

export const deleteFiberType = async (axiosInstance, id) => {
    await axiosInstance.delete(`/fiber-types/${id}`);
    return true;
};
