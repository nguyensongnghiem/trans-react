import React, { useState } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <header className="bg-white shadow-md">
      <div className=" h-14 flex justify-between items-center py-2 px-2 bg-white w-full">
        <div className="logo px-0">
          <img src="./src/assets/mobifone.png" alt="" />
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="px-4 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
          />
        </div>
        <div className="login-logout">
          {isLoggedIn ? (
            <button
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-4 rounded"
              onClick={handleLogout}
            >
              Logout
            </button>
          ) : (
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-4 rounded"
              onClick={handleLogin}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
