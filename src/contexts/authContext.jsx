import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { axiosPrivate } from '../libs/axios/axiosConfig'; // <-- IMPORT axiosPrivate CỦA BẠN TẠI ĐÂY

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [auth, setAuth] = useState(() => {
    const accessToken = localStorage.getItem("accessToken");
    console.log("Initial load - Stored token:", accessToken ? "Exists" : "None");
    if (accessToken) {
      try {
        const claims = jwtDecode(accessToken);
        // Kiểm tra xem token có còn hạn ngay khi ứng dụng tải
        if (claims.exp * 1000 > Date.now()) {
          console.log("Stored token is valid.");
          return {
            username: claims.sub,
            accessToken: accessToken,
            roles: claims.roles,            
          };
        } else {
          console.log("Stored token is expired on initial load. Clearing.");
          localStorage.removeItem("accessToken"); // Xóa token đã hết hạn
        }
      } catch (error) {
        console.error("Failed to decode or validate token from localStorage:", error);
        localStorage.removeItem("accessToken"); // Xóa token bị hỏng/không hợp lệ
      }
    }
    return null; // Trả về null nếu không có token hoặc token không hợp lệ/hết hạn
  });

  const [isLoading, setIsLoading] = useState(true); // Thêm state để theo dõi trạng thái tải ban đầu

  // Cập nhật isAuthenticated và isLoading khi state 'auth' thay đổi
  useEffect(() => {
    setIsAuthenticated(!!auth); // isAuthenticated là true nếu auth có giá trị (không null)
    setIsLoading(false); // Quá trình kiểm tra ban đầu đã hoàn tất
  }, [auth]);

  // Hàm để cập nhật token và thông tin xác thực
  const setToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem("accessToken", newToken);
      try {
        const claims = jwtDecode(newToken);
        // Bạn có thể thêm kiểm tra tính hợp lệ của claims ở đây nếu muốn
        if (claims.sub && claims.roles) {
          setAuth({ username: claims.sub, accessToken: newToken, roles: claims.roles});
          console.log("Auth token set successfully for user:", claims.sub);
        } else {
          console.error("JWT claims are missing required fields (sub, roles).");
          localStorage.removeItem("accessToken");
          setAuth(null);
        }
      } catch (error) {
        console.error("Failed to decode new token:", error);
        localStorage.removeItem("accessToken");
        setAuth(null);
      }
    } else {
      localStorage.removeItem("accessToken");
      setAuth(null);
      console.log("Auth token cleared.");
    }
  }, []); // Không có dependencies vì chỉ dựa vào newToken

  // Hàm đăng xuất
  const logout = useCallback(() => {
    setToken(null); // Sử dụng setAuthToken để xóa token và trạng thái
    console.log("User logged out.");
  }, [setToken]); // setAuthToken là dependency để đảm bảo nó luôn là phiên bản mới nhất

  // Interceptor cho axiosPrivate để tự động gắn JWT và xử lý lỗi 401/403
  useEffect(() => {
    // Request interceptor: Gắn token vào header của mỗi request
    const requestInterceptor = axiosPrivate.interceptors.request.use(
        config => {
            const currentToken = localStorage.getItem('accessToken');
            if (currentToken && !config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${currentToken}`;
            }
            return config;
        },
        error => Promise.reject(error)
    );

    // Response interceptor: Xử lý lỗi 401/403 (token hết hạn/không hợp lệ)
    const responseInterceptor = axiosPrivate.interceptors.response.use(
      response => response,
      error => {
        // Kiểm tra nếu lỗi là 401 (Unauthorized) hoặc 403 (Forbidden)
        // và không phải từ endpoint login (để tránh vòng lặp vô hạn nếu có một endpoint login riêng trên axiosPrivate)
        if ((error.response?.status === 401 || error.response?.status === 403) &&
            !error.config.url.endsWith('/login')) { // Adjusted condition
          console.warn('Authentication error (401/403) detected. Logging out...');
          logout(); // Gọi hàm logout để xử lý
        }
        return Promise.reject(error);
      }
    );

    // Dọn dẹp interceptors khi component unmounts
    return () => {
        axiosPrivate.interceptors.request.eject(requestInterceptor);
        axiosPrivate.interceptors.response.eject(responseInterceptor);
    };
  }, [auth, logout]); // Dependencies for interceptors

  // Kiểm tra token hết hạn định kỳ (ví dụ: mỗi phút)
  useEffect(() => {
    let intervalId;
    if (auth && isAuthenticated) {
      intervalId = setInterval(() => {
        try {
          const claims = jwtDecode(auth.accessToken);
          if (claims.exp * 1000 <= Date.now()) {
            console.log("Token expired during active session. Automatic logout.");
            logout(); // Đăng xuất nếu token hết hạn
          } else {
            console.log("Token still valid (periodic check).");
          }
        } catch (error) {
          console.error("Error decoding token during periodic check:", error);
          logout(); // Đăng xuất nếu có lỗi giải mã token
        }
      }, 60 * 1000); // Kiểm tra mỗi 60 giây (1 phút)
    }

    // Dọn dẹp interval khi component unmount hoặc khi auth/isAuthenticated thay đổi
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log("Token check interval cleared.");
      }
    };
  }, [auth, isAuthenticated, logout]); // Dependencies for this effect

  return (
    <AuthContext.Provider value={{ auth, isAuthenticated, isLoading, setToken, logout, axiosPrivate }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);