// RoleService.jsx

export const getRoles = async (axiosInstance) => {
    const response = await axiosInstance.get('/roles');
    return response.data;
};

export const createRole = async (axiosInstance, data) => {
    const response = await axiosInstance.post('/roles', data);
    return response.data;
};

export const updateRole = async (axiosInstance, id, data) => {
    const response = await axiosInstance.put(`/roles/${id}`, data);
    return response.data;
};

export const deleteRole = async (axiosInstance, id) => {
    const response = await axiosInstance.delete(`/roles/${id}`);
    return response.data;
};
