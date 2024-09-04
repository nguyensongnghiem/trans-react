import axios from "axios";
import { toast } from "react-toastify";
export const searchSites = async (page, siteId, transOwner, transType) => {
    const query = `http://localhost:8080/api/sites?page=${page}&siteId=${siteId}&transOwner=${transOwner}&transType=${transType}`
    console.log(query);

    try {
        let result = await axios.get(query);

        return result.data
    } catch (error) {
        console.log(error);

    }

}

export const saveSite = async (site) => {
    try {
        let response = await axios.post("http://localhost:8080/api/sites/rest", site);
        toast.success("Thêm mới thành công");
        return true;
    } catch (error) {
        console.log(error);
        if (error.response && error.response.status === 400) {
            toast.error(error.response.data.message);
            error.response.data.details.
        } else {
            toast.error('An unexpected error occurred');
        }
    }

}

export const deleteSite = async (id) => {
    try {
        let response = await axios.delete(`http://localhost:8080/api/sites/${id}`);
        return true;
    } catch (error) {
        console.log(error);
    }
};