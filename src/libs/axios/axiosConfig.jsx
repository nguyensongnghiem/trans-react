// axiosConfig.js
import axios from "axios";
import { useAuth } from "../../contexts/authContext";
// Tạo một instance của axios

const BASE_URL = "http://localhost:8080/api";
export default axios.create({
  baseURL: BASE_URL,
});

export const axiosPrivate = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: true
});


export const useAxios = () => {
  const { auth } = useAuth();
  const token = auth.accessToken
  const axiosPrivate = axios.create({
    baseURL: "http://localhost:8080/api",
  });

  // Thêm interceptor để tự động thêm token vào header
  axiosPrivate.interceptors.request.use(
    (config) => {

      if (token && !isTokenExpired(token)) {

        console.log('Interceptor: set token:' + token);
        config.headers["Authorization"] = `Bearer ${token}`; // Thêm token vào header      
      } else if (!token) {
        // console.log('Interceptor: Xóa token khỏi header');
        console.log('Không có token');

        delete config.headers["Authorization"]; // Xóa header nếu không có token  
      }
      else
        // console.log(config.headers);
        console.error('Token không hợp lệ hoặc đã hết hạn');
      return config;
    },
    (error) => {
      console.log(error);

      return Promise.reject(error);
    }
  );

  // axiosPrivate.interceptors.response.use(
  //   (response) => {
  //     return response;
  //   },
  //   (error) => {
  //     return Promise.reject(error);
  //   }
  // )
  const isTokenExpired = (token) => {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationDate = payload.exp * 1000; // Chuyển đổi sang milliseconds
    return Date.now() >= expirationDate;
  };
  return axiosPrivate;

}