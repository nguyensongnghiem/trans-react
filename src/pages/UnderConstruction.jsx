import { NavLink } from "react-router-dom";

const UnderConstructionPage = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="text-center max-w-lg">
        <h1 className="text-5xl font-bold text-yellow-600">🚧</h1>
        <h2 className="mt-4 text-3xl font-bold text-gray-800">
          Trang đang xây dựng
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Chúng tôi đang phát triển tính năng này.  
          Vui lòng quay lại sau!
        </p>
        <NavLink
          to="/"
          replace
          className="mt-6 inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Quay lại trang chủ
        </NavLink>
      </div>
    </div>
  );
};

export default UnderConstructionPage;
