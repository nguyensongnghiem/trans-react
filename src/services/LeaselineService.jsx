// LeaselineService.js
export const getLeaselineById = async (axiosInstance, id) => {
    const response = await axiosInstance.get(`/leaselines/${id}`);
    return response.data;
};

export const getTotalLeaselines = async (axiosInstance) => {
    const response = await axiosInstance.get(`/leaselines/total`);
    return response.data;
};

export const getTotalCostPerMonth = async (axiosInstance) => {
    const response = await axiosInstance.get(`/leaselines/totalCostPerMonth`);
    return response.data;
};