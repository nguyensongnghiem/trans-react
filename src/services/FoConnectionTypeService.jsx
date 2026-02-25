export const getFoConnectionTypes = async (axiosPrivate) => {
    const response = await axiosPrivate.get("/fo-connection-types");
    return response.data;
};

export const createFoConnectionType = async (axiosPrivate, data) => {
    const response = await axiosPrivate.post("/fo-connection-types", data);
    return response.data;
};

export const updateFoConnectionType = async (axiosPrivate, id, data) => {
    const response = await axiosPrivate.put(`/fo-connection-types/${id}`, data);
    return response.data;
};

export const deleteFoConnectionType = async (axiosPrivate, id) => {
    const response = await axiosPrivate.delete(`/fo-connection-types/${id}`);
    return response.data;
};
