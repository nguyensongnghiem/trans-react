// HiredFoService.jsx
export const getHiredFos = async (axiosInstance) => {
    const response = await axiosInstance.get('/hired-fos');
    return response.data;
};

export const getHiredFoById = async (axiosInstance, id) => {
    const response = await axiosInstance.get(`/hired-fos/${id}`);
    return response.data;
};

export const createHiredFo = async (axiosInstance, data) => {
    const response = await axiosInstance.post('/hired-fos', data);
    return response.data;
};

export const updateHiredFo = async (axiosInstance, id, data) => {
    const response = await axiosInstance.put(`/hired-fos/${id}`, data);
    return response.data;
};

export const deleteHiredFo = async (axiosInstance, id) => {
    await axiosInstance.delete(`/hired-fos/${id}`);
    return true;
};

export const getImportTemplate = async (axiosInstance) => {
    console.log("Downloading import template inside service...");
    const response = await axiosInstance.get('/hired-fos/import-excel/template', { responseType: 'blob' });
    return response.data;
};

export const checkImportMulti = async (axiosInstance, formData) => {
    const response = await axiosInstance.post('/hired-fos/import-excel/check-multi', formData);
    return response.data;
};

export const saveImportMulti = async (axiosInstance, formData) => {
    const response = await axiosInstance.post('/hired-fos/import-excel/save-multi', formData);
    return response.data;
};
