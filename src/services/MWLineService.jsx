// MWLineService.jsx

export const getMWLines = async (axiosInstance) => {
    const response = await axiosInstance.get('/mw-lines');
    return response.data;
};

export const getMWLineById = async (axiosInstance, id) => {
    const response = await axiosInstance.get(`/mw-lines/${id}`);
    return response.data;
};

export const createMWLine = async (axiosInstance, newMWLine) => {
    const response = await axiosInstance.post('/mw-lines', newMWLine);
    return response.data;
};

export const updateMWLine = async (axiosInstance, id, updatedMWLine) => {
    const response = await axiosInstance.put(`/mw-lines/${id}`, updatedMWLine);
    return response.data;
};

export const deleteMWLine = async (axiosInstance, id) => {
    await axiosInstance.delete(`/mw-lines/${id}`);
    return true;
};
