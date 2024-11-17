import { useState, useEffect } from "react";
import { axiosPrivate } from "../libs/axios/axiosConfig";
import { useAuth } from "../contexts/authContext"
import useRefreshToken from "./useRefreshToken"

const useAxiosPrivate = () => {
    const { auth } = useAuth();
    const {refreshToken} = useRefreshToken();
    const token = auth?.accessToken
    let refreshTokenPromise
    useEffect(() => {
        const requestInterceptor = axiosPrivate.interceptors.request.use(
            (config) => {   
                if (token) {
                    // console.log('Interceptor: set token:' + token);
                    config.headers["Authorization"] = `Bearer ${token}`; // Thêm token vào header      
                } else if (!token) {
                    // console.log('Interceptor: Xóa token khỏi header');
                    // console.error('Không có token');
                    delete config.headers["Authorization"]; // Xóa header nếu không có token  
                }            
                return config;  
            },
            (error) => {
                // console.log(error);
                return Promise.reject(error);
            }
        )
        const responseInterceptor = axiosPrivate.interceptors.response.use(
            (response) => response,
            async (error) => {
                const prevRequest = error?.config;
                if (error?.response?.status === 401 && !prevRequest?.sent) {
                    prevRequest.sent = true;
                    const newAccessToken = await refreshToken();
                    console.log('newAccessToken: ' + newAccessToken);                
                    prevRequest.headers["Authorization"] = `Bearer ${newAccessToken}`; // Thêm token mới vào header
                    return axiosPrivate(prevRequest);
                }
                return Promise.reject(error);
            }
        )
        // const isTokenExpired = (token) => {
        //     const payload = JSON.parse(atob(token.split('.')[1]));
        //     const expirationDate = payload.exp * 1000; // Chuyển đổi sang milliseconds
        //     return Date.now() >= expirationDate;
        // };
        return () => {
            axiosPrivate.interceptors.request.eject(requestInterceptor);
            axiosPrivate.interceptors.response.eject(responseInterceptor);
        };
     
    }, [auth, refreshToken])
    return axiosPrivate
}
export default useAxiosPrivate

