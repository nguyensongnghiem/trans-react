import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  PresentationChartBarIcon,
  HomeIcon,
  ServerIcon,
  BoltIcon,
  RssIcon,
  TableCellsIcon,
  BookOpenIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  SignalIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/authContext";
import { useSidebar } from "../contexts/SidebarContext";
import { jwtDecode } from "jwt-decode";

// 🟢 Cấu hình menu
const menuConfig = [
  {
    id: 1,
    title: "Tổng quan mạng truyền dẫn",
    icon: PresentationChartBarIcon,
    path: "/",
  },
  {
    id: 2,
    title: "Quản lý trạm",
    icon: HomeIcon,
    children: [
      { title: "Danh sách trạm", path: "/site" },
      { title: "Tra cứu thông tin trạm", path: "/site/lookup" },
    ],
  },
  {
    id: 3,
    title: "Quản lý thiết bị",
    icon: ServerIcon,
    children: [
      { title: "Danh sách thiết bị", path: "/router" },
      { title: "Quản lý cấu hình thiết bị", path: "/router/backup-dashboard" },
      { title: "Lập lịch sao lưu cấu hình", path: "/router/backup-scheduler" },
    ],
  },
  {
    id: 4,
    title: "Quản lý cáp quang",
    icon: BoltIcon,
    children: [
      { title: "Tuyến cáp quang thuê", path: "/hired-fo" },
      { title: "Tuyến cáp quang đầu tư", path: "/own-fo" },
      {
        title: "Hạ tầng mạng ngoại vi",
        path: "/under-construction/infrastructure",
      },
    ],
  },
  {
    id: 5,
    title: "Quản lý tuyến viba",
    icon: RssIcon,
    children: [
      { title: "Tuyến viba", path: "/microwave" },
      { title: "Quản lý giấy phép tần số", path: "/admin/microwave-licenses" },
    ],
  },
  {
    id: 6,
    title: "Quản lý kênh thuê",
    icon: SignalIcon,
    children: [
      { title: "Danh sách kênh thuê", path: "/leaseline" },
    ],
  },
  {
    id: 7,
    title: "Quản lý hợp đồng",
    icon: BookOpenIcon,
    children: [
      { title: "Tổng quan", path: "/under-construction/contract-overview" },
      { title: "Hợp đồng thuê FO", path: "/fo-contract" },
      {
        title: "Hợp đồng thuê kênh dung lượng",
        path: "/under-construction/contract-leaseline",
      },
      { title: "Hợp đồng thuê cột", path: "/under-construction/contract-pole" },
      { title: "Hợp đồng cống bể", path: "/under-construction/contract-duct" },
    ],
  },
  {
    id: 8,
    title: "Báo cáo",
    icon: TableCellsIcon,
    children: [
      { title: "Báo cáo tổng hợp", path: "/under-construction/report-summary" },
      {
        title: "Báo cáo cước sử dụng kênh thuê",
        path: "/under-construction/report-cost",
      },
      {
        title: "Báo cáo chi phí theo nhà cung cấp",
        path: "/fo-cost-by-supplier",
      },
      { title: "Báo cáo chi phí theo hợp đồng", path: "/fo-cost-by-contracts" },
    ],
  },
  {
    id: 9,
    title: "Quản trị hệ thống",
    icon: UserGroupIcon,
    requiredRole: "ROLE_ADMIN",
    children: [
      { title: "Quản lý Tỉnh/TP", path: "/province" },
      { title: "Quản lý người dùng", path: "/admin/users" },
      { title: "Quản lý phân quyền", path: "/admin/roles" },
      { title: "Quản lý loại cáp quang", path: "/admin/fiber-types" },
      { title: "Quản lý loại viba", path: "/admin/microwave-types" },
      { title: "Quản lý chức năng thiết bị", path: "/admin/transmission-device-types" },
      { title: "Quản lý model thiết bị", path: "/admin/router-types" },
      { title: "Quản lý nhà cung cấp thiết bị", path: "/admin/vendors" },
      { title: "Quản lý đơn vị sở hữu CSHT", path: "/admin/site-owners" },
      { title: "Quản lý loại CSHT", path: "/admin/site-types" },
      { title: "Quản lý đơn vị sở hữu TD", path: "/admin/transmission-owners" },
      { title: "Quản lý loại TD trạm", path: "/admin/site-transmission-types" },
      { title: "Quản lý đối tác vận hành cáp quang", path: "/admin/fiber-operators" },
      { title: "Quản lý loại kết nối quang", path: "/admin/fo-connection-types" },
      { title: "Quản lý cơ sở dữ liệu", path: "/admin/database" },
    ],
  },
];

const Sidebar2 = () => {
  const [open, setOpen] = useState(0);
  const { sidebarOpen, toggleSidebar } = useSidebar();
  const { auth } = useAuth();
  const location = useLocation();
  let isAdmin = false;

  if (auth?.accessToken) {
    try {
      const decoded = jwtDecode(auth.accessToken);
      const roles = decoded.roles || decoded.authorities || [];
      if (Array.isArray(roles)) {
        isAdmin = roles.includes("ROLE_ADMIN");
      }
    } catch (error) { }
  }

  const handleOpen = (value) => {
    setOpen(open === value ? 0 : value);
  };

  // Check if any child of a menu is active
  const isChildActive = (children) => {
    return children?.some(child => location.pathname === child.path);
  };

  // Auto-open accordion if child is active on mount/location change
  useEffect(() => {
    menuConfig.forEach(menu => {
      if (menu.children && isChildActive(menu.children)) {
        setOpen(menu.id);
      }
    });
  }, [location.pathname]);

  const handleLinkClick = () => {
    // Tailwind's sm breakpoint is 640px.
    // We close the sidebar if the screen is smaller than that and the sidebar is open.
    if (window.innerWidth < 640 && sidebarOpen) {
      toggleSidebar();
    }
  };

  return (
    <>
    {/* Mobile Toggle Button (Visible only on mobile when sidebar is closed) */}
    {!sidebarOpen && (
      <button 
        onClick={toggleSidebar}
        className="fixed top-3 left-4 z-40 p-2 rounded-lg bg-white shadow-md text-gray-700 sm:hidden hover:bg-gray-100"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>
    )}

    {/* Mobile Overlay Backdrop */}
    {sidebarOpen && (
      <div 
        className="fixed inset-0 bg-black/50 z-40 sm:hidden backdrop-blur-sm transition-opacity"
        onClick={toggleSidebar}
      />
    )}

    {/* Desktop Expand Button (When collapsed) - Improved Style & Z-index */}
    {!sidebarOpen && (
        <button 
          onClick={toggleSidebar}
          className="hidden sm:block fixed top-5 left-20 -translate-x-1/2 bg-blue-600 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-500 transition-all z-[60] focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Expand sidebar"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
    )}


    <aside
      className={`fixed sm:static top-0 left-0 h-full bg-[#111c44] border-r border-white/10 text-indigo-100/80 transition-all duration-300 ease-in-out flex flex-col shadow-2xl z-50 ${
        sidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full sm:translate-x-0 sm:w-20"
      }`}
    >
      {/* Logo / Brand Area */}
      <div className={`h-16 flex items-center justify-between border-b border-white/10 ${sidebarOpen ? "px-6" : "px-2 justify-center"}`}>
         {sidebarOpen ? (
             <img src="/images/mobifone.png" alt="MobiFone Logo" className="h-8" />
         ) : (
             <span className="text-2xl font-bold text-white">M</span>
         )}
         
         {/* Desktop Toggle Button (Inside Sidebar) */}
         <button 
            onClick={toggleSidebar}
            className={`p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors ${!sidebarOpen ? "hidden" : "block"}`}
         >
            <div className="sm:hidden">
                <XMarkIcon className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
                <ChevronLeftIcon className="h-5 w-5" />
            </div>
         </button>
      </div>
      
      {/* Menu List */}
      <nav className="flex-1 overflow-y-auto pt-4 pb-6 px-3 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {menuConfig.map((menu) => {
          if (menu.requiredRole === "ROLE_ADMIN" && !isAdmin) return null;

          // --- Single Item (No Children) ---
          if (!menu.children) {
            return (
              <NavLink
                key={menu.id}
                to={menu.path}
                end
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] border border-blue-400/30"
                      : "hover:bg-white/10 hover:text-white hover:translate-x-1"
                  }`
                }
              >
                <menu.icon
                  className={`h-5 w-5 flex-shrink-0 transition-colors ${
                    !sidebarOpen ? "mx-auto" : ""
                  }`}
                />
                <span
                  className={`font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                    sidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 absolute left-16 hidden"
                  }`}
                >
                  {menu.title}
                </span>
                
                {/* Tooltip for collapsed state */}
                {!sidebarOpen && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-[#111c44] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10">
                        {menu.title}
                    </div>
                )}
              </NavLink>
            );
          }

          // --- Accordion Item (With Children) ---
          const isActiveParent = isChildActive(menu.children);
          const isOpen = open === menu.id;

          return (
            <div key={menu.id} className="flex flex-col">
              <button
                onClick={() => handleOpen(menu.id)}
                className={`flex items-center justify-between gap-3 px-3 py-3 rounded-lg transition-all duration-300 group w-full relative ${
                  isActiveParent || isOpen
                    ? "text-white bg-white/10"
                    : "hover:bg-white/5 hover:text-white hover:translate-x-1"
                }`}
              >
                <div className={`flex items-center gap-3 overflow-hidden ${!sidebarOpen ? "w-full justify-center" : ""}`}>
                  <menu.icon
                    className={`h-5 w-5 flex-shrink-0 transition-colors ${
                      isActiveParent ? "text-blue-400" : "text-indigo-200/70 group-hover:text-white"
                    }`}
                  />
                  <span
                    className={`font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                      sidebarOpen ? "opacity-100" : "opacity-0 hidden"
                    }`}
                  >
                    {menu.title}
                  </span>
                </div>

                {sidebarOpen && (
                  <div className="flex items-center">
                    {menu.requiredRole === "ROLE_ADMIN" && (
                      <ShieldCheckIcon className="h-3.5 w-3.5 text-amber-500 mr-2" title="Admin Only" />
                    )}
                    <ChevronDownIcon
                      className={`h-4 w-4 text-indigo-200/50 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                )}
                
                {/* Tooltip for collapsed state */}
                {!sidebarOpen && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-[#111c44] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10">
                        {menu.title}
                    </div>
                )}
              </button>

              {/* Submenu */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isOpen && sidebarOpen ? "max-h-[1200px] opacity-100 mt-1" : "max-h-0 opacity-0"
                }`}
              >
                <ul className="pl-4 space-y-1.5 relative">
                  {/* Vertical line for tree structure */}
                  <div className="absolute left-[1.35rem] top-0 bottom-2 w-px bg-white/10"></div>
                  
                  {menu.children.map((child, idx) => (
                    <li key={idx}>
                      <NavLink
                        to={child.path}
                        end
                        onClick={handleLinkClick}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-300 relative z-10 ml-2 ${
                            isActive
                              ? "text-white bg-blue-600/20 font-medium shadow-[0_0_15px_rgba(59,130,246,0.4)] border border-blue-500/20"
                              : "text-indigo-200/70 hover:text-white hover:bg-white/5 hover:translate-x-1"
                          }`
                        }
                      >
                        {/* Dot indicator */}
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${location.pathname === child.path ? 'bg-blue-400 shadow-[0_0_10px_theme(colors.blue.400)]' : 'bg-indigo-500/40 group-hover:bg-white'}`}></span>
                        <span className="truncate">{child.title}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer Profile Section */}
      <div className="p-4 border-t border-white/10 bg-[#0b1437]">
        <div className={`flex items-center gap-3 ${!sidebarOpen ? "justify-center" : ""}`}>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                {auth?.username ? auth.username.charAt(0).toUpperCase() : "U"}
            </div>
            {sidebarOpen && (
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-white truncate">{auth?.username || "User"}</span>
                    <span className="text-xs text-indigo-200/70 truncate">{isAdmin ? "Administrator" : "Viewer"}</span>
                </div>
            )}
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar2;
