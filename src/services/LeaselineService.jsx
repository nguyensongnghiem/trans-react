import axios from "../libs/axios/axiosConfig";
import { toast } from "react-toastify";


export const getLeaselineById = async (id) => {
    try {
        let response = await axios.get(`/leaselines/${id}`);
        return response.data;
    } catch (error) {
        toast.error(error.response.data.message)
        console.log(error);
    }
};

export const getTotalLeaselines = async () => {
    try {
        let response = await axios.get(`/leaselines/total`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        toast.error(error.response.data.message)
        console.log(error);
    }
};

export const getTotalCostPerMonth = async () => {
    try {
        let response = await axios.get(`/leaselines/totalCostPerMonth`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        toast.error(error.response.data.message)
        console.log(error);
    }
};