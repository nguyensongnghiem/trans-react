import axios from "axios";
import { toast } from "react-toastify";


export const getLeaselineById = async (id) => {
    try {
        let response = await axios.get(`http://localhost:8080/api/leaselines/${id}`);
        return response.data;
    } catch (error) {
        toast.error(error.response.data.message)
        console.log(error);
    }
};

export const getTotalLeaselines = async () => {
    try {
        let response = await axios.get(`http://localhost:8080/api/leaselines/total`);
        console.log(response.data);
        (response.data)
        return response.data;
    } catch (error) {
        toast.error(error.response.data.message)
        console.log(error);
    }
};

export const getTotalCostPerMonth = async () => {
    try {
        let response = await axios.get(`http://localhost:8080/api/leaselines/totalCostPerMonth`);
        console.log(response.data);
        (response.data)
        return response.data;
    } catch (error) {
        toast.error(error.response.data.message)
        console.log(error);
    }
};