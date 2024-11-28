import { Link, NavLink, useLocation } from "react-router-dom";

const Unauthorized = () => {
  const location = useLocation();
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600">401</h1>
        <p className="mt-4 text-lg text-gray-700">Không có quyền truy cập.</p>
        <p className="mt-2 text-sm text-gray-500">
          Xin vui lòng liên hệ quản trị viên hoặc quay lại trang chủ.
        </p>
        <NavLink
          to="/"
          replace
          className="mt-6 inline-block rounded bg-light-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Quay lại trang chủ
        </NavLink>
      </div>
    </div>
  );
};

export default Unauthorized;
