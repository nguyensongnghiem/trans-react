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
    const value = { token, login, logout }

    return (
        <AuthContext.Provider value={{ value }}>
            {children}
        </AuthContext.Provider>
    )
}
export const useAuth = () => {

    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }

    return context
}