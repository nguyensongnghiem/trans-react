import { saveAs } from 'file-saver';

export const getOwnFos = async (axiosInstance) => {
    const response = await axiosInstance.get('/own-fos');
    return response.data;
};

export const getOwnFoById = async (axiosInstance, id) => {
    const response = await axiosInstance.get(`/own-fos/${id}`);
    return response.data;
};

export const createOwnFo = async (axiosInstance, data) => {
    const response = await axiosInstance.post('/own-fos', data);
    return response.data;
};

export const updateOwnFo = async (axiosInstance, id, data) => {
    const response = await axiosInstance.put(`/own-fos/${id}`, data);
    return response.data;
};

export const deleteOwnFo = async (axiosInstance, id) => {
    const response = await axiosInstance.delete(`/own-fos/${id}`);
    return response.data;
};

export const uploadKml = async (axiosInstance, id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post(`/own-fos/${id}/kml`, formData);
    return response.data;
};

export const downloadKml = async (axiosInstance, id, filename) => {
    const response = await axiosInstance.get(`/own-fos/${id}/kml`, {
        responseType: 'blob'
    });
    saveAs(response.data, filename || `map_${id}.kml`);
};

export const getImportTemplate = async (axiosInstance) => {
    const response = await axiosInstance.get('/own-fos/import-excel/template', {
        responseType: 'blob'
    });
    saveAs(response.data, 'own-fo-import-template.xlsx');
};

export const checkImport = async (axiosInstance, formData) => {
    const response = await axiosInstance.post('/own-fos/import-excel/check', formData);
    return response.data;
};

export const saveImport = async (axiosInstance, formData) => {
    const response = await axiosInstance.post('/own-fos/import-excel/save', formData);
    return response.data;
};
