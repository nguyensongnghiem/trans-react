import { useState, useEffect } from "react";
import { axiosPrivate } from "../libs/axios/axiosConfig";
import { useAuth } from "../contexts/authContext"

const useAxiosPrivate = () => {
    const { auth } = useAuth();
    const token = auth?.accessToken
    axiosPrivate.interceptors.request.use(
        (config) => {

            if (token && !isTokenExpired(token)) {
                console.log('Interceptor: set token:' + token);
                config.headers["Authorization"] = `Bearer ${token}`; // Thêm token vào header      
            } else if (!token) {
                // console.log('Interceptor: Xóa token khỏi header');
                console.error('Không có token');

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
    )
    const isTokenExpired = (token) => {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationDate = payload.exp * 1000; // Chuyển đổi sang milliseconds
        return Date.now() >= expirationDate;
    };
    return axiosPrivate
}
export default useAxiosPrivate

