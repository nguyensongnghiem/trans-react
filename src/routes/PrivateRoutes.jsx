import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/authContext'
import axios from 'axios'
export default function PrivateRoutes() {
    const { auth } = useAuth();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Thêm trạng thái loading
    const token = auth.accessToken;
    useEffect(() => {
        const checkAuthenticated = async () => {
            setIsLoading(true); // Bắt đầu quá trình xác thực
            try {
                const response = await axios.get('http://localhost:8080/api/auth/validate-token', {
                    headers: {
                        Authorization: `Bearer ${token}` // Gửi token nếu cần
                    }
                });
                console.log('Authentication check successful');
                console.log(response.data);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Authentication check failed', error);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false); // Kết thúc quá trình xác thực
            }
        };

        checkAuthenticated();
    }, [token]);

    if (isLoading) {
        return <div>Loading...</div>; // Có thể hiển thị một spinner hoặc thông báo loading
    }

    return (
        isAuthenticated ? <Outlet /> : <Navigate to="/login" />
    );
}