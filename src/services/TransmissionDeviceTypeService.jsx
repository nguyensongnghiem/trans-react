export const getTransmissionDeviceTypes = async (axiosInstance) => {
    try {
        const response = await axiosInstance.get("transmission-device-types");
        return response.data;
    } catch (error) {
        console.error("Error fetching transmission device types:", error);
        throw error;
    }
};

export const createTransmissionDeviceType = async (axiosInstance, data) => {
    try {
        const response = await axiosInstance.post("transmission-device-types", data);
        return response.data;
    } catch (error) {
        console.error("Error creating transmission device type:", error);
        throw error;
    }
};

export const updateTransmissionDeviceType = async (axiosInstance, id, data) => {
    try {
        const response = await axiosInstance.put(`transmission-device-types/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating transmission device type:", error);
        throw error;
    }
};

export const deleteTransmissionDeviceType = async (axiosInstance, id) => {
    try {
        const response = await axiosInstance.delete(`transmission-device-types/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting transmission device type:", error);
        throw error;
    }
};
