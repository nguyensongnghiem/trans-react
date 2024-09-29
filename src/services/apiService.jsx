import axios from "axios";
const BASE_URL = "http://localhost:8080/api";
export const fetchData = async (endpoint) => {
    try {
        const response = await axios.get(`${BASE_URL}/${endpoint}`);
        return response.data; // Trả về dữ liệu
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error; // Ném lỗi để xử lý ở nơi gọi
    }
};

export const postData = async (endpoint, data) => {
    try {
        const response = await axios.post(`${BASE_URL}/${endpoint}`, data);
        return response.data; // Trả về dữ liệu
    } catch (error) {
        console.error('Error posting data:', error);
        throw error; // Ném lỗi để xử lý ở nơi gọi
    }
};

export const deleteData = async (endpoint) => {
    try {
        await axios.delete(`${BASE_URL}/${endpoint}`);
       // Trả về dữ liệu
    } catch (error) {
        console.error('Error deleting data:', error);
        throw error; // Ném lỗi để xử lý ở nơi gọi
    }
};