import axios from "axios";
import { toast } from "react-toastify";


export const getRouterById = async (id) => {
    try {
        let response = await axios.get(`http://localhost:8080/api/routers/${id}`);
        return response.data;
    } catch (error) {
        toast.error(error.response.data.message)
        console.log(error);
    }
};

export const getTotalRouters = async () => {
    try {
        let response = await axios.get(`http://localhost:8080/api/routers/reports/total`);
        console.log(response.data);
        (response.data)
        return response.data;
    } catch (error) {
        toast.error(error.response.data.message)
        console.log(error);
    }
};