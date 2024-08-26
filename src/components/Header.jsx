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
    <header className="bg-white shadow-md flex items-center py-2 px-4 gap-x-8 w-full">
      <img src="./src/assets/mobifone.png" alt="logo" className="h-full mr-auto" />
      <div className="">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="px-2 border border-gray-300 rounded-xl py-1 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
        />
      </div>
      <div className="">
        {isLoggedIn ? (
          <a
            className="inline-block bg-red-500 hover:bg-red-600 text-white rounded-sm shadow-md font-semibold px-2 py-1  hover:cursor-pointer"
            onClick={handleLogout}
          >
            Logout
          </a>
        ) : (
          <a
            className="inline-block bg-sky-500 hover:bg-sky-600 text-white rounded-sm shadow-md font-semibold px-2 py-1  hover:cursor-pointer"
            onClick={handleLogin}
          >
            Login
          </a>
        )}
      </div>

    </header>
  );
};

export default Header;
