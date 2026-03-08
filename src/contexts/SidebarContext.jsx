import React, { createContext, useState, useContext, useEffect } from "react";

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  // Set initial state based on screen width. `true` for desktop (>=640px), `false` for mobile.
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 640);

  useEffect(() => {
    const handleResize = () => {
      // Tự động ẩn sidebar khi màn hình chuyển sang kích thước mobile.
      if (window.innerWidth < 640) {
        setSidebarOpen(false);
      }
    };

    // Thêm listener để theo dõi sự kiện resize
    window.addEventListener("resize", handleResize);

    // Dọn dẹp listener khi component bị unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Mảng rỗng đảm bảo effect này chỉ chạy một lần khi component được mount

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <SidebarContext.Provider value={{ sidebarOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
