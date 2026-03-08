import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import { jwtDecode } from "jwt-decode";
import BreadcrumbsWithIcon from "./BreadCrumbs";
import ConfirmationModal from "./ConfirmationModal";
import Button from "./Button";
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

const Header = () => {
  const { auth, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const menuRef = useRef(null);

  const token = auth?.accessToken;
  let username;
  let roles;
  let isAdmin = false;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      username = decoded.sub;
      roles = decoded.roles || decoded.authorities || [];
      if (Array.isArray(roles)) {
        isAdmin = roles.includes("ROLE_ADMIN");
      }
    } catch (error) {
      console.error("Invalid token:", error);
    }
  }

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogin = () => {
    navigate("/login");
  };

  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate("/login"); // Redirect to login after logout
  };

  return (
    <>
      <header className="flex h-16 w-full items-center justify-between gap-x-4 border-b border-gray-200 bg-white px-6 shadow-sm">
        {/* Breadcrumbs on the left */}
        <div>
          <BreadcrumbsWithIcon />
        </div>

        {/* User menu on the right */}
        <div className="flex items-center">
          {isAuthenticated && username ? (
            <div className="relative" ref={menuRef}>
              {/* Menu Trigger */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`group flex items-center gap-3 rounded-full border border-gray-200 bg-white p-1 pr-4 shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                  isMenuOpen ? "ring-2 ring-blue-100 border-blue-300" : ""
                }`}
              >
                <div className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200 group-hover:ring-blue-400 transition-all">
                  <img
                    src="/images/avatar-default.png"
                    alt="user avatar"
                    className="h-full w-full object-cover"
                  />
                </div>
                
                <div className="hidden text-left md:block">
                  <p className="text-sm font-bold text-gray-700 group-hover:text-blue-700 transition-colors">
                    {username}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 group-hover:text-blue-500/70 transition-colors">
                    {isAdmin ? "Administrator" : "User"}
                  </p>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 text-gray-400 transition-transform duration-300 group-hover:text-blue-500 ${
                    isMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              <div
                className={`absolute right-0 z-50 mt-3 w-72 origin-top-right transform rounded-2xl bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] ring-1 ring-gray-100 transition-all duration-200 ease-out ${
                  isMenuOpen
                    ? "scale-100 opacity-100 translate-y-0"
                    : "scale-95 opacity-0 -translate-y-2 pointer-events-none"
                }`}
              >
                  {/* Dropdown Header - Dark Blue Theme matching Sidebar */}
                  <div className="relative overflow-hidden rounded-t-2xl bg-[#111c44] p-6 text-white">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
                    <div className="relative flex items-center gap-4">
                      <img
                        src="/images/avatar-default.png"
                        alt="user avatar"
                        className="h-12 w-12 rounded-full border-2 border-white/20 object-cover shadow-lg"
                      />
                      <div>
                        <p className="text-base font-bold text-white">
                          {username}
                        </p>
                        <p className="text-xs text-blue-200/80 truncate max-w-[140px]">
                          {auth?.email || (isAdmin ? "Administrator" : "User")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Body */}
                  <div className="p-2">
                    <a
                      href="#"
                      className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-blue-50 hover:text-blue-600 hover:pl-5"
                    >
                      <UserCircleIcon className="h-5 w-5 text-gray-400 transition-colors group-hover:text-blue-500" />
                      <span>Thông tin cá nhân</span>
                    </a>
                    <a
                      href="#"
                      className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-blue-50 hover:text-blue-600 hover:pl-5"
                    >
                      <Cog6ToothIcon className="h-5 w-5 text-gray-400 transition-colors group-hover:text-blue-500" />
                      <span>Cài đặt</span>
                    </a>
                  </div>

                  <div className="border-t border-gray-100 p-2">
                    <button
                      onClick={handleLogoutClick}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-red-600 transition-all hover:bg-red-50 hover:pl-5"
                    >
                      <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleLogin}
              variant="ghost-primary"
              icon={ArrowRightOnRectangleIcon}
            >
              Đăng nhập
            </Button>
          )}
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống? Phiên làm việc hiện tại sẽ kết thúc."
        confirmText="Đăng xuất"
        cancelText="Hủy bỏ"
        variant="danger"
      />
    </>
  );
};

export default Header;
