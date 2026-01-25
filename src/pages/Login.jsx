import React, { useState } from "react";
import { useAuth } from "../contexts/authContext";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../libs/axios/axiosConfig";
import {
  Input,
  Typography,
} from "@material-tailwind/react";
import { UserIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import CustomButton from "../components/CustomButton";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const submitCredentials = { username: username, password: password };
    try {
      const response = await axios.post("auth/login", submitCredentials, {
        withCredentials: true,
      });
      console.log(response.data);
      const accessToken = response.data.accessToken;
      setToken(accessToken);
      navigate(from, { replace: true });
    } catch (error) {
      console.log(error.response);

      if (!error.response) {
        setError("Không kết nối được đến Server");
      } else if (error.response?.status === 400) {
        setError("Sai tên đăng nhập hoặc mật khẩu");
      } else if (error.response?.status === 401) {
        setError("Không có quyền truy cập");
      } else {
        setError("Đăng nhập thất bại");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Left Side - Branding */}
        <div className="hidden w-1/2 flex-col justify-center bg-gradient-to-br from-[#0d47a1] to-[#1976d2] p-12 text-white md:flex">
          <div className="mb-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-10 w-10 text-white"
              >
                <path
                  fillRule="evenodd"
                  d="M19.902 4.098a3.75 3.75 0 0 0-5.304 0l-4.5 4.5a3.75 3.75 0 0 0 1.035 6.037.75.75 0 0 1-.646 1.352 5.25 5.25 0 0 1-1.449-8.45l4.5-4.5a5.25 5.25 0 1 1 7.424 7.424l-1.757 1.757a.75.75 0 1 1-1.06-1.06l1.757-1.757a3.75 3.75 0 0 0 0-5.304Zm-7.389 4.267a.75.75 0 0 1 1-.353 5.25 5.25 0 0 1 1.449 8.45l-4.5 4.5a5.25 5.25 0 1 1-7.424-7.424l1.757-1.757a.75.75 0 1 1 1.06 1.06l-1.757 1.757a3.75 3.75 0 1 0 5.304 5.304l4.5-4.5a3.75 3.75 0 0 0-1.035-6.037.75.75 0 0 1-.354-1Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <Typography variant="h3" className="font-bold">
              TransManager
            </Typography>
            <Typography className="mt-2 font-normal text-blue-100">
              Hệ thống quản lý truyền dẫn tập trung.
            </Typography>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm text-blue-50">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-200"></span>
              Quản lý trạm & thiết bị
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-50">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-200"></span>
              Theo dõi hợp đồng & kênh thuê
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-50">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-200"></span>
              Tự động hóa Backup cấu hình
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex w-full flex-col justify-center p-8 sm:p-12 md:w-1/2">
          <div className="mb-8 text-center md:text-left">
            <Typography
              variant="h4"
              color="blue-gray"
              className="mb-1 font-bold"
            >
              Đăng nhập
            </Typography>
            <Typography color="gray" className="text-sm font-normal">
              Nhập thông tin tài khoản để truy cập hệ thống.
            </Typography>
          </div>

          {error && (
            <div className="mb-6 flex items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-center text-sm text-red-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-1 font-semibold"
              >
                Tên đăng nhập
              </Typography>
              <Input
                size="lg"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                icon={<UserIcon className="h-5 w-5 text-gray-400" />}
                crossOrigin={undefined}
                className="!border-t-blue-gray-200 focus:!border-blue-700"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
              />
            </div>
            <div>
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-1 font-semibold"
              >
                Mật khẩu
              </Typography>
              <Input
                size="lg"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={
                  <div
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer hover:text-blue-700 transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                }
                crossOrigin={undefined}
                className="!border-t-blue-gray-200 focus:!border-blue-700"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
              />
            </div>

            <div className="flex items-center justify-end -mt-1">
              <Typography
                as="a"
                href="#"
                variant="small"
                color="blue"
                className="font-medium hover:text-blue-800 transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                Quên mật khẩu?
              </Typography>
            </div>

            <CustomButton
              type="submit"
              className="mt-2 w-full bg-[#0d47a1] py-3 text-sm shadow-md transition-all hover:bg-[#0a3a82] hover:shadow-lg"
            >
              Đăng Nhập
            </CustomButton>
          </form>

          <div className="mt-8 text-center">
            <Typography variant="small" color="gray" className="font-normal">
              Chưa có tài khoản?{" "}
              <Typography
                as="a"
                href="#"
                variant="small"
                color="blue"
                className="ml-1 inline-block font-bold hover:text-blue-800 transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                Liên hệ Admin
              </Typography>
            </Typography>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="pointer-events-none fixed bottom-4 w-full text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} MobiFone Transmission Management. All
        rights reserved.
      </div>
    </div>
  );
};

export default Login;
