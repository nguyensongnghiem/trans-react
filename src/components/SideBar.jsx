import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { TfiAngleRight } from "react-icons/tfi";
import { BsMenuButtonFill } from "react-icons/bs";
import { FaHouseSignal } from "react-icons/fa6";
import { FaRegHardDrive } from "react-icons/fa6";
import { BsDashLg } from "react-icons/bs";
import { VscDash } from "react-icons/vsc";
const Sidebar = () => {
  const [expandedMenu, setExpandedMenu] = useState(null);

  const toggleSubMenu = (menuKey) => {
    setExpandedMenu(expandedMenu === menuKey ? null : menuKey);
  };

  const menuItems = [
    {
      icon: <BsMenuButtonFill />,
      key: "dashboard",
      label: "Dashboard",
      to: "/",
    },
    {
      icon: <FaHouseSignal />,
      key: "sites",
      label: "Quản lý trạm",
      subMenuItems: [
        { label: "Danh sách", to: "/site" },
        { label: "Thêm mới", to: "/router" },
      ],
    },
    {
      icon: <FaRegHardDrive />,
      key: "routers",
      label: "Router List",
      to: "/router",
    },
  ];

  return (
    <div className="flex flex-col w-full bg-sky-950 text-slate-100">
      <nav className="flex-1 py-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.key}>
              <div>
                <button
                  className="block w-full px-4 py-2 hover:bg-sky-700 hover:border-l-sky-400 hover:border-l-8 transition-colors duration-100 text-left"
                  onClick={() => toggleSubMenu(item.key)} to={item.to}>
                  <div className="flex flex-row items-center">
                    <div className="basis-1/6 align-">
                      {item.icon}
                    </div>
                    <div className="basis-5/6">
                    {item.label}
                    </div>
                    <span className={`float-right transition-transform duration-300 ${expandedMenu === item.key ? "rotate-90" : ""}`}>
                      {item.subMenuItems && <TfiAngleRight size="12px" />}
                    </span>
                  </div>
                </button>

                {expandedMenu === item.key && item.subMenuItems && (
                  <ul className=" rounded-lg mx-3">
                    {item.subMenuItems.map((subItem, index) => (
                      <li key={index}>                        
                        <NavLink
                          to={subItem.to}
                          className={({ isActive }) =>
                            [
                              "block py-2 hover:bg-sky-700 hover:border-l-sky-400 hover:border-l-8 transition-colors duration-100",
                              isActive ? "text-red-400" : undefined,
                            ].join(" ")
                          }
                        >
                          <p className="text-center">                      
                          {subItem.label}
                          </p>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
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
