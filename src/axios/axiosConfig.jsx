// axiosConfig.js
import axios from "axios";
import { useAuth } from "../contexts/authContext";
// Tạo một instance của axios

export const useAxios = () => {
  const { token } = useAuth();
  const axiosInstance = axios.create({
    baseURL: "http://localhost:8080/api",
  });

  // Thêm interceptor để tự động thêm token vào header
  axiosInstance.interceptors.request.use(
    (config) => {

      if (token) {
        console.log('set token:' + token);
        config.headers["Authorization"] = `Bearer ${token}`; // Thêm token vào header
      } else {
        console.log('Xóa token');
        delete config.headers["Authorization"]; // Xóa header nếu không có token
      }
      console.log(config.headers);

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  return axiosInstance;

}