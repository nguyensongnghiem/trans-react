import axios from "axios";
import { toast } from "react-toastify";
import * as logger from "react-dom/test-utils";

export const searchSites = async (page, siteId, transOwner, transType, province) => {
    const query = `http://localhost:8080/api/sites?page=${page}&siteId=${siteId}&transOwner=${transOwner}&transType=${transType}&province=${province}`
    console.log(query);

    try {
        let result = await axios.get(query);

        return result.data
    } catch (error) {
        console.log(error);

    }

}

export const saveSite = async (site, setErrors) => {

    try {
        let response = await axios.post("http://localhost:8080/api/sites/rest", site);
        toast.success("Thêm mới thành công");
        return true;
    } catch (error) {
        console.log(error);
        if (error.response && error.response.status === 400) {
            toast.error(error.response.data.message);
            console.log(error.response.data.details);
            setErrors(error.response.data.details);
        } else {
            toast.error('Có lỗi bất thường xảy ra');
        }
    }

}

export const deleteSite = async (id) => {
    try {
        let response = await axios.delete(`http://localhost:8080/api/sites/${id}`);
        toast.success("Đã xóa thành công !")
        return true;
    } catch (error) {
        toast.error(error.response.data.message)
        console.log(error);
    }
};