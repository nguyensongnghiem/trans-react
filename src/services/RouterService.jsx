// RouterService.js

/**
 * Service xử lý các API liên quan đến Router
 * Pattern: Service nhận axiosInstance để thực hiện request
 */

export const getRouters = async (axiosInstance) => {
    const response = await axiosInstance.get('/routers');
    return response.data;
};

export const getRouterById = async (axiosInstance, id) => {
    const response = await axiosInstance.get(`/routers/${id}`);
    return response.data;
};

export const createRouter = async (axiosInstance, newRouter) => {
    const response = await axiosInstance.post('/routers', newRouter);
    return response.data;
};

export const updateRouter = async (axiosInstance, id, updatedRouter) => {
    const response = await axiosInstance.put(`/routers/${id}`, updatedRouter);
    return response.data;
};

export const deleteRouter = async (axiosInstance, id) => {
    await axiosInstance.delete(`/routers/${id}`);
    return true;
};

export const getTotalRouters = async (axiosInstance) => {
    const response = await axiosInstance.get(`/routers/reports/total`);
    return response.data;
};