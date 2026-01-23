import axios from "../libs/axios/axiosConfig";
import { toast } from "react-toastify";


export const getRouterById = async (id) => {
    try {
        let response = await axios.get(`/routers/${id}`);
        return response.data;
    } catch (error) {
        toast.error(error.response.data.message)
        console.log(error);
    }
};

export const getTotalRouters = async () => {
    try {
        let response = await axios.get(`/routers/reports/total`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        toast.error(error.response.data.message)
        console.log(error);
    }
};