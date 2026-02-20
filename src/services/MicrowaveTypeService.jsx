// MicrowaveTypeService.jsx

export const getMicrowaveTypes = async (axiosInstance) => {
    const response = await axiosInstance.get("microwave-types");
    return response.data;
};

export const createMicrowaveType = async (axiosInstance, data) => {
    const response = await axiosInstance.post("microwave-types", data);
    return response.data;
};

export const updateMicrowaveType = async (axiosInstance, id, data) => {
    const response = await axiosInstance.put(`microwave-types/${id}`, data);
    return response.data;
};

export const deleteMicrowaveType = async (axiosInstance, id) => {
    const response = await axiosInstance.delete(`microwave-types/${id}`);
    return response.data;
};