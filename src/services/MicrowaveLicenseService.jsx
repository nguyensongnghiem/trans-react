// MicrowaveLicenseService.jsx

export const getMicrowaveLicenses = async (axiosInstance) => {
    const response = await axiosInstance.get('/microwave-licenses');
    return response.data;
};

export const createMicrowaveLicense = async (axiosInstance, data) => {
    const response = await axiosInstance.post('/microwave-licenses', data);
    return response.data;
};

export const updateMicrowaveLicense = async (axiosInstance, id, data) => {
    const response = await axiosInstance.put(`/microwave-licenses/${id}`, data);
    return response.data;
};

export const deleteMicrowaveLicense = async (axiosInstance, id) => {
    const response = await axiosInstance.delete(`/microwave-licenses/${id}`);
    return response.data;
};
