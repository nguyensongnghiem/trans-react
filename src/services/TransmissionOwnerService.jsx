// TransmissionOwnerService.js
export const getAll = async (axiosInstance) => {
    const response = await axiosInstance.get('/transmissionOwners');
    return response.data;
};