import { useState } from "react";
import { NavLink } from "react-router-dom";
import { TfiAngleRight } from "react-icons/tfi";
import { BsMenuButtonFill } from "react-icons/bs";
import { FaHouseSignal } from "react-icons/fa6";
import { FaRegHardDrive } from "react-icons/fa6";

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
        { label: "Thêm mới", to: "/site/create" },
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
    <div className="flex w-full flex-col bg-blue-gray-900 text-blue-gray-300">
      <nav className="flex-1 py-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.key}>
              <div>
                <button
                  className="hover:bg-sky-700 hover:border-l-sky-400 block w-full px-4 py-2 text-left transition-colors duration-100 hover:border-l-8"
                  onClick={() => toggleSubMenu(item.key)} to={item.to}>
                  <div className="flex flex-row items-center">
                    <div className="align- basis-1/6">
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
                  <ul className="mx-3 rounded-lg">
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
      <div className="mt-auto flex items-center justify-center border-t border-gray-700 py-2">
        <a
          href="#"
          className="text-gray-400 transition-colors duration-300 hover:text-white"
        >
          Logout
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
