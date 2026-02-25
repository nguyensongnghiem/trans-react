export const getFiberOperators = async (axiosPrivate) => {
    const response = await axiosPrivate.get("/fiber-operators");
    return response.data;
};

export const createFiberOperator = async (axiosPrivate, data) => {
    const response = await axiosPrivate.post("/fiber-operators", data);
    return response.data;
};

export const updateFiberOperator = async (axiosPrivate, id, data) => {
    const response = await axiosPrivate.put(`/fiber-operators/${id}`, data);
    return response.data;
};

export const deleteFiberOperator = async (axiosPrivate, id) => {
    const response = await axiosPrivate.delete(`/fiber-operators/${id}`);
    return response.data;
};
