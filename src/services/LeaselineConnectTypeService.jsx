export const getLeaselineConnectTypes = async (axiosInstance) => {
    const response = await axiosInstance.get('/leaseline-connect-type');
    return response.data;
};
