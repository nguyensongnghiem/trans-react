import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="flex flex-col h-full bg-gray-800 text-white">
      {/*<div className="flex items-center justify-center h-16 border-b border-gray-700">*/}
      {/*  <h1 className="font-medium text-sky-200">Transmission Manager</h1>*/}
      {/*</div>*/}
      <nav className="flex-1 py-4">
        <ul className="space-y-2">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                [
                  "block px-4 py-2 hover:bg-gray-700 transition-colors duration-100",
                  isActive ? "text-sky-500" : undefined,
                ].join(" ")
              }
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/site"
              className={({ isActive }) =>
                [
                  "block px-4 py-2 hover:bg-gray-700 transition-colors duration-100",
                  isActive ? "text-sky-500" : undefined,
                ].join(" ")
              }
            >
              Site List
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/router"
              className={({ isActive }) =>
                [
                  "block px-4 py-2 hover:bg-gray-700 transition-colors duration-100",
                  isActive ? "text-sky-500" : undefined,
                ].join(" ")
              }
            >
              Router List
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="mt-auto flex items-center justify-center py-2 border-t border-gray-700">
        <a
          href="#"
          className="text-gray-400 hover:text-white transition-colors duration-300"
        >
          Logout
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
