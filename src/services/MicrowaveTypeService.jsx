// MicrowaveTypeService.jsx

export const getMicrowaveTypes = async (axiosInstance) => {
    const response = await axiosInstance.get('/microwave-types');
    return response.data;
};

export const createMicrowaveType = async (axiosInstance, newType) => {
    const response = await axiosInstance.post('/microwave-types', newType);
    return response.data;
};

export const updateMicrowaveType = async (axiosInstance, id, updatedType) => {
    const response = await axiosInstance.put(`/microwave-types/${id}`, updatedType);
    return response.data;
};

export const deleteMicrowaveType = async (axiosInstance, id) => {
    await axiosInstance.delete(`/microwave-types/${id}`);
    return true;
};
