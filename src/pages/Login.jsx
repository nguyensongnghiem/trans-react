import React, { useState } from 'react';
import { useAuth } from '../contexts/authContext';
import { postData } from '../services/apiService';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAxios } from '../libs/axios/axiosConfig';
import { Button, Typography } from '@material-tailwind/react';
const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const { auth, setAuth } = useAuth();
    const navigate = useNavigate();
    const axiosInstance = useAxios()

    const handleSubmit = async (e) => {
        e.preventDefault();
        const submitCredentials = { 'username': username, 'password': password };
        try {
            setSuccess(false);
            const response = await axiosInstance.post('auth/login', submitCredentials);
            const accessToken = response.data.accessToken;
            console.log(accessToken);
            setAuth({ username, password, accessToken });
            console.log(auth);
            setSuccess(true);

        } catch (error) {
            console.log(error.response);

            if (!error.response) {
                setError('Không kết nối được đến Server');
            }
            else if (error.response?.status === 400) {
                setError('Sai tên đăng nhập hoặc mật khẩu');
            }
            else if (error.response?.status === 401) {
                setError('Không có quyền truy cập');
            }
            else {
                setError('Đăng nhập thất bại');
            }
        }
    }
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100" >
            <div className="w-full max-w-md space-y-3 rounded-lg bg-white p-8 shadow-md">

                {success ?
                    (<div>

                        <Typography variant="h5" className='mb-4'>Bạn đã đăng nhập thành công!</Typography>
                        <NavLink to={'/'}>
                            <a className="text-blue-500 underline hover:text-blue-700">
                                Về trang chủ
                            </a>

                        </NavLink>
                    </div >) :
                    <>
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
                    </>
                }
            </div>
        </div>

    );

}

export default Login