import React, { useState } from 'react';
import { useAuth } from '../contexts/authContext';
import { postData } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const submitCredentials = { 'username': username, 'password': password };
        try {
            const response = await postData('auth/login', submitCredentials);
            if (response.accessToken) {
                login(response.accessToken);
                navigate('/');
            } else {
                setError(response.message);

            }
        } catch (error) {
            setError(error.message);
        }
    }
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md space-y-3 rounded-lg bg-white p-8 shadow-md">
                <h2 className="text-center text-2xl font-bold">Đăng Nhập</h2>
                {error && <div className="text-red-500">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium">Tên đăng nhập</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full rounded-md border border-gray-300 p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full rounded-md border border-gray-300 p-2"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700">
                        Đăng Nhập
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;