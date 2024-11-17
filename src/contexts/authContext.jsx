import { useContext, useState, useEffect, createContext } from "react";
import { jwtDecode } from "jwt-decode";
const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [auth, setAuth] = useState(() => {
    const accessToken = localStorage.getItem("accessToken");
    console.log(accessToken);
    if (accessToken) {
      const claims = jwtDecode(accessToken);
      const username = claims.sub;
      const roles = claims.roles;
      return { username, accessToken, roles };
    }

    return accessToken ? { username, accessToken, roles } : null;
  });

  const setToken = (newToken) => {
    localStorage.setItem("accessToken", newToken);
    const claims = jwtDecode(newToken);
    const username = claims.sub;
    const roles = claims.roles;
    setAuth(newToken ? { username, accessToken: newToken, roles } : null);
  };
  const logout = () => {
    localStorage.removeItem("accessToken");
    setAuth(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (auth) {
      const payload = jwtDecode(auth.accessToken);
      if (payload.exp * 1000 > Date.now()) {
        setIsAuthenticated(true);
        console.log("token còn hạn");
      } else {
        setIsAuthenticated(false);
        console.log("token hết hạn");
      }
    }
  });
  return (
    <AuthContext.Provider value={{ auth, isAuthenticated, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
