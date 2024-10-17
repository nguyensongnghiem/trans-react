import React, { useContext, useState,useEffect } from 'react'
import {setupAxiosInterceptor} from '../axios/axiosConfig'
const AuthContext = React.createContext();

export default function AuthProvider({ children }) {
    // const [user, setUser] = useState();
    const [token, setToken] = useState();
    useEffect(() => {
        setupAxiosInterceptor(token); // Thiết lập interceptor với token hiện tại
    console.log('token mới:'+ token)
    }, [token]);

    const login = (tokenData) => {
        // setUser(userData)
        setToken(tokenData)
    }
    const logout = () => {
        // setUser()
        setToken(undefined)
    }

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}
export const useAuth = () => useContext(AuthContext);