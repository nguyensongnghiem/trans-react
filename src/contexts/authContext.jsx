import React, { useContext, useState } from 'react'
const AuthContext = React.createContext();
export default function AuthProvider({ children }) {
    // const [user, setUser] = useState();
    const [token, setToken] = useState();

    const login = (tokenData) => {
        // setUser(userData)
        setToken(tokenData)
    }
    const logout = () => {
        // setUser()
        setToken()
    }


    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}
export const useAuth = () => useContext(AuthContext);