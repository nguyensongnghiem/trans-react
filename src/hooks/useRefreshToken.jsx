import React from "react";
import { useAuth } from "../contexts/authContext";

import axios from "../libs/axios/axiosConfig";

const useRefreshToken = () => {
  const {auth, setToken } = useAuth();
   const refreshToken = async () => {
    try {
      const response = await axios.get('/auth/refresh-token',{
        withCredentials:true
      })
      console.log('old auth ' + auth);      
      console.log('new token ' + response.data.accessToken);      
      setToken(response.data.accessToken)     

    return response.data.accessToken
    } catch (error) {
      console.log('Không thể làm mới token');
      window.location.href = '/login'      
    }
    
    
   }

  return {refreshToken};
}
export default useRefreshToken
