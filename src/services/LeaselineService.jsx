// LeaselineService.js
export const getLeaselines = async (axiosInstance) => {
    const response = await axiosInstance.get('/leaselines');
    return response.data;
};

export const getLeaselineById = async (axiosInstance, id) => {
    const response = await axiosInstance.get(`/leaselines/${id}`);
    return response.data;
};

export const createLeaseline = async (axiosInstance, data) => {
    const response = await axiosInstance.post('/leaselines', data);
    return response.data;
};

export const updateLeaseline = async (axiosInstance, id, data) => {
    const response = await axiosInstance.put(`/leaselines/${id}`, data);
    return response.data;
};

export const deleteLeaseline = async (axiosInstance, id) => {
    await axiosInstance.delete(`/leaselines/${id}`);
    return true;
};

export const getTotalLeaselines = async (axiosInstance) => {
    const response = await axiosInstance.get(`/leaselines/total`);
    return response.data;
};

export const getTotalCostPerMonth = async (axiosInstance) => {
    const response = await axiosInstance.get(`/leaselines/totalCostPerMonth`);
    return response.data;
};

export const getImportTemplate = async (axiosInstance) => {
    const response = await axiosInstance.get('/leaselines/import-excel/template', { responseType: 'blob' });
    return response.data;
};

export const checkImport = async (axiosInstance, formData) => {
    const response = await axiosInstance.post('/leaselines/import-excel/check', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const saveImport = async (axiosInstance, formData) => {
    const response = await axiosInstance.post('/leaselines/import-excel/save', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};