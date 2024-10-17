// axiosConfig.js
import axios from "axios";
import { useAuth } from "../contexts/authContext";
// Tạo một instance của axios
const axiosInstance = axios.create({
  baseURL: "http://localhost:8080/api", // Thay đổi URL này thành URL của API của bạn
});

// Thêm interceptor để tự động thêm token vào header
const setupAxiosInterceptor = (token) =>
  axiosInstance.interceptors.request.use(
    (config) => {   
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`; // Thêm token vào header
      } else {
        delete config.headers["Authorization"]; // Xóa header nếu không có token
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

export { axiosInstance, setupAxiosInterceptor };
