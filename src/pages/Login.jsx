import React, { useState } from "react";
import { useAuth } from "../contexts/authContext";
import { postData } from "../services/apiService";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import axios from "../libs/axios/axiosConfig";
import {
  Card,
  CardBody,
  CardFooter,
  Input,
  Button,
  Typography,
} from "@material-tailwind/react";
import { jwtDecode } from "jwt-decode";
import useRefreshToken from "../hooks/useRefreshToken";
import { UserIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { auth, setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshToken } = useRefreshToken();
  const from = location.state?.from?.pathname || "/";
  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-96">
        <CardBody className="flex flex-col gap-4">
          <Typography variant="h5" color="blue-gray" className="mb-2">
            Quản lý truyền dẫn
          </Typography>
          {error && (
            <Typography
              variant="small"
              color="red"
              className="text-center font-bold"
            >
              {error}
            </Typography>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-2 font-medium"
              >
                Tên đăng nhập
              </Typography>
              <Input
                size="lg"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                icon={<UserIcon className="h-5 w-5" />}
                crossOrigin={undefined}
                className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
              />
            </div>
            <div>
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-2 font-medium"
              >
                Mật khẩu
              </Typography>
              <Input
                size="lg"
                placeholder="********"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={
                  <div
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </div>
                }
                crossOrigin={undefined}
                className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
              />
            </div>
            <Button variant="filled" fullWidth type="submit" color="blue">
              Đăng Nhập
            </Button>
          </form>
        </CardBody>
        <CardFooter className="pt-0">
          <Typography variant="small" className="mt-6 flex justify-center">
            Quên mật khẩu?
            <Typography
              as="a"
              href="#"
              variant="small"
              color="blue"
              className="ml-1 font-bold"
              onClick={(e) => e.preventDefault()}
            >
              Liên hệ Admin
            </Typography>
          </Typography>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
