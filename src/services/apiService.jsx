import {axiosInstance}  from '../axios/axiosConfig'; // Import axiosInstance
import { toast } from "react-toastify";
// const BASE_URL = "http://localhost:8080/api";
export const fetchData = async (endpoint) => {
  try {
    const response = await axiosInstance.get(`/${endpoint}`);
    return response.data; // Trả về dữ liệu
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi
  }
};

export const postData = async (endpoint, data) => {
  try {
    const response = await axiosInstance.post(`/${endpoint}`, data);
    console.log(response.data);

    return response.data; // Trả về dữ liệu
  } catch (error) {
    console.error("Lỗi khi tạo mới:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi
  }
};

export const putData = async (endpoint, data) => {
  try {
    const response = await axiosInstance.put(`$/${endpoint}`, data);
    return response.data; // Trả về dữ liệu
  } catch (error) {
    console.error("Lỗi khi cập nhật dữ liệu:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi
  }
};

export const deleteData = async (endpoint) => {
  try {
    await axiosInstance.delete(`/${endpoint}`);
    // Trả về dữ liệu
  } catch (error) {
    console.error("Error deleting data:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi
  }
};
