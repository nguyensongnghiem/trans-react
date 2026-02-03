// TransmissionOwnerService.jsx

export const getTransmissionOwners = async (axiosInstance) => {
    const response = await axiosInstance.get('/transmissionOwners');
    return response.data;
};

export const createTransmissionOwner = async (axiosInstance, data) => {
    const response = await axiosInstance.post('/transmissionOwners', data);
    return response.data;
};

export const updateTransmissionOwner = async (axiosInstance, id, data) => {
    const response = await axiosInstance.put(`/transmissionOwners/${id}`, data);
    return response.data;
};

export const deleteTransmissionOwner = async (axiosInstance, id) => {
    const response = await axiosInstance.delete(`/transmissionOwners/${id}`);
    return response.data;
};