import { useContext, useState, useEffect, createContext } from 'react'

const AuthContext = createContext();

export default function AuthProvider({ children }) {
    const [auth, setAuth] = useState({});
    return (
        <AuthContext.Provider value={{ auth, setAuth }}>
            {children}
        </AuthContext.Provider>
    )
}
export const useAuth = () => useContext(AuthContext);