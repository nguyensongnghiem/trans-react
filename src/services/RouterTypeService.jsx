// RouterTypeService.jsx

export const getRouterTypes = async (axiosInstance) => {
    const response = await axiosInstance.get('/router-types');
    return response.data;
};

export const createRouterType = async (axiosInstance, newType) => {
    const response = await axiosInstance.post('/router-types', newType);
    return response.data;
};

export const updateRouterType = async (axiosInstance, id, updatedType) => {
    const response = await axiosInstance.put(`/router-types/${id}`, updatedType);
    return response.data;
};

export const deleteRouterType = async (axiosInstance, id) => {
    await axiosInstance.delete(`/router-types/${id}`);
    return true;
};
