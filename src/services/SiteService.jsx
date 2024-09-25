import axios from "axios";
import { toast } from "react-toastify";



export const getAllSites = async (setError) => {
    const query = `http://localhost:8080/api/sites`
    try {
        let result = await axios.get(query);

        return result.data
    } catch (error) {
        setError(error);
    }

}
export const searchSites = async (page, siteId, transOwner, transType, province) => {
    const query = `http://localhost:8080/api/sites/search?page=${page}&siteId=${siteId}&transOwner=${transOwner}&transType=${transType}&province=${province}`
    try {
        let result = await axios.get(query);

        return result.data
    } catch (error) {
        console.log(error);

    }

}

export const saveSite = async (site, setErrors) => {

    try {
        let response = await axios.post("http://localhost:8080/api/sites", site);
        toast.success(site.id !== null ? 'Cập nhật thành công' : 'Thêm mới thành công');
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

export const getSiteById = async (id) => {
    try {
        let response = await axios.get(`http://localhost:8080/api/sites/${id}`);
        return response.data;
    } catch (error) {
        toast.error(error.response.data.message)
        console.log(error);
    }
};

export const getTotalSites = async () => {
    try {
        let response = await axios.get(`http://localhost:8080/api/sites/reports/total`);
        return response.data;
    } catch (error) {
        toast.error(error.response.data.message)
        console.log(error);
    }
};

export const countByProvince = async (province) => {
    try {
        let response = await axios.get(`http://localhost:8080/api/sites/reports/count-by-province?province=${province}`);
        return response.data;
    } catch (error) {
        toast.error(error.response.data.message)
        console.log(error);
    }
};

export const countByTransmissionType = async (transmissionType) => {
    try {
        let response = await axios.get(`http://localhost:8080/api/sites/reports/count-by-transmission-type?transmission-type=${transmissionType}`);
        return response.data;
    } catch (error) {
        toast.error(error.response.data.message)

    }
};