// FoContractService.jsx
export const getContracts = async (axiosInstance) => {
    const response = await axiosInstance.get('/contract/all');
    return response.data;
};

export const createFullContract = async (axiosInstance, formData) => {
    const response = await axiosInstance.post('/contract/full-create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const updateContract = async (axiosInstance, id, data) => {
    const response = await axiosInstance.put(`/contract/${id}`, data);
    return response.data;
};

export const deleteContract = async (axiosInstance, id) => {
    await axiosInstance.delete(`/contract/${id}`);
    return true;
};

export const checkExcelImport = async (axiosInstance, file, contractNumber) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("contractNumber", contractNumber.toUpperCase());
    const response = await axiosInstance.post('/contract/import-excel/check', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const getContractPdfs = async (axiosInstance, id) => {
    const response = await axiosInstance.get(`/contract/${id}/pdfs`);
    return response.data;
};

export const getDownloadTemplate = async (axiosInstance) => {
    const response = await axiosInstance.get('/contract/download-template', { responseType: 'blob' });
    return response.data;
};
