import { Button } from "@material-tailwind/react";
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
    <header className="flex w-full items-center gap-x-8 bg-gray-200 px-4 py-2">
      <img src="./src/assets/mobifone.png" alt="logo" className="mr-auto h-full" />
      <div className="">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="rounded-xl border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      <div className="">
        {isLoggedIn ? (
          <Button
            color="red"
            onClick={handleLogout}
          >
            Logout
          </Button>
        ) : (
          <Button
            color="blue"
            onClick={handleLogin}
          >
            Login
          </Button>
        )}
      </div>

    </header>
  );
};

export default Header;
