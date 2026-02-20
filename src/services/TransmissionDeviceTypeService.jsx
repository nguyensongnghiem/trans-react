export const getTransmissionDeviceTypes = async (axiosInstance) => {
    const response = await axiosInstance.get("transmission-device-types");
    return response.data;
};

export const createTransmissionDeviceType = async (axiosInstance, data) => {
    const response = await axiosInstance.post("transmission-device-types", data);
    return response.data;
};

export const updateTransmissionDeviceType = async (axiosInstance, id, data) => {
    const response = await axiosInstance.put(`transmission-device-types/${id}`, data);
    return response.data;
};

export const deleteTransmissionDeviceType = async (axiosInstance, id) => {
    const response = await axiosInstance.delete(`transmission-device-types/${id}`);
    return response.data;
};
