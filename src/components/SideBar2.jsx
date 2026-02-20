import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  List,
  ListItem,
  ListItemPrefix,
  Accordion,
  AccordionHeader,
  AccordionBody,
  Typography,
  Tooltip,
} from "@material-tailwind/react";
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
} from "@heroicons/react/24/solid";
import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/authContext";
import { jwtDecode } from "jwt-decode";

// 🟢 Cấu hình menu
const menuConfig = [
  {
    id: 1,
    title: "Tổng quan mạng truyền dẫn",
    icon: PresentationChartBarIcon,
    path: "/", // nếu không có children thì dùng path
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
      { title: "Quản lý nhà cung cấp", path: "/admin/vendors" },
      { title: "Quản lý đơn vị sở hữu CSHT", path: "/admin/site-owners" },
      { title: "Quản lý loại CSHT", path: "/admin/site-types" },
      { title: "Quản lý đơn vị sở hữu TD", path: "/admin/transmission-owners" },
      { title: "Quản lý loại TD trạm", path: "/admin/site-transmission-types" },      
      { title: "Quản lý cơ sở dữ liệu", path: "/admin/database" },
    ],
  },
];

const Sidebar2 = ({ sidebarOpen }) => {
  const [open, setOpen] = useState(0);
  const { auth } = useAuth();
  let isAdmin = false;

  if (auth?.accessToken) {
    try {
      const decoded = jwtDecode(auth.accessToken);
      // Kiểm tra role từ token (giả sử key là 'roles' hoặc 'authorities')
      const roles = decoded.roles || decoded.authorities || [];
      if (Array.isArray(roles)) {
        isAdmin = roles.includes("ROLE_ADMIN");
      }
    } catch (error) { }
  }

  const handleOpen = (value) => setOpen(open === value ? 0 : value);

  return (
    <div
      className={`h-full p-2 shadow-xl bg-blue-gray-900 shadow-blue-gray-900/5 ${sidebarOpen ? "w-[20rem]" : "w-[4rem]"
        } transition-all duration-300 flex flex-col`}
    >
      <List className="overflow-y-auto py-3 gap-3 flex-1 min-h-0">
        {menuConfig.map((menu) => {
          if (menu.requiredRole === "ROLE_ADMIN" && !isAdmin) return null;

          // Nếu không có menu con, render NavLink trực tiếp
          if (!menu.children) {
            return (
              <NavLink key={menu.id} to={menu.path} end>
                {({ isActive }) => (
                  <ListItem
                    className={`p-0 w-full ${isActive ? "bg-blue-gray-800" : ""}`}
                    selected={isActive}
                  >
                    <div
                      className={`flex items-center w-full border-b-0 p-2 ${isActive ? "text-blue-300 opacity-100" : "text-white opacity-70"}`}
                    >
                      <ListItemPrefix>
                        <menu.icon className="h-4 w-4" />
                      </ListItemPrefix>
                      <Typography
                        color="inherit"
                        className="mr-auto font-semibold flex items-center"
                      >
                        <span
                          className={`${sidebarOpen ? "" : "hidden"} uppercase`}
                        >
                          {menu.title}
                        </span>
                        {menu.requiredRole === "ROLE_ADMIN" && sidebarOpen && (
                          <Tooltip content="Admin Only">
                            <ShieldCheckIcon className="h-4 w-4 text-orange-500 ml-2" />
                          </Tooltip>
                        )}
                      </Typography>
                    </div>
                  </ListItem>
                )}
              </NavLink>
            );
          }

          // Nếu có menu con, render Accordion
          return (
            <Accordion
              key={menu.id}
              open={open === menu.id}
              icon={
                <ChevronDownIcon
                  strokeWidth={2.5}
                  className={`mx-auto text-white opacity-70 h-4 w-4 transition-transform ${open === menu.id ? "rotate-180" : ""
                    }`}
                />
              }
            >
              <ListItem className="p-0 w-full" selected={open === menu.id}>
                <AccordionHeader
                  onClick={() => handleOpen(menu.id)}
                  className={`border-b-0 p-2 ${open === menu.id ? "text-white opacity-100" : "text-white opacity-70"}`}
                >
                  <ListItemPrefix>
                    <menu.icon className="h-4 w-4" />
                  </ListItemPrefix>
                  <Typography color="white" className="mr-auto font-semibold flex items-center">
                    <span
                      className={`${sidebarOpen ? "" : "hidden"} uppercase`}
                    >
                      {menu.title}
                    </span>
                    {menu.requiredRole === "ROLE_ADMIN" && sidebarOpen && (
                      <Tooltip content="Admin Only">
                        <ShieldCheckIcon className="h-4 w-4 text-orange-500 ml-2" />
                      </Tooltip>
                    )}
                  </Typography>
                </AccordionHeader>
              </ListItem>

              {/* render children nếu có */}
              <AccordionBody className="py-1">
                <List className="p-0 text-white opacity-70">
                  {menu.children.map((child, idx) => (
                    <NavLink key={idx} to={child.path} end>
                      {({ isActive }) => (
                        <ListItem
                          className={`p-1 w-full ${isActive ? "bg-blue-gray-800" : ""}`}
                          selected={isActive}
                        >
                          <ListItemPrefix>
                            <ChevronRightIcon
                              strokeWidth={3}
                              className={`h-3 w-5 ${isActive ? "text-blue-300" : "text-white"}`}
                            />
                          </ListItemPrefix>
                          <span className={`${sidebarOpen ? "" : "hidden"}`}>
                            <Typography
                              className={`${isActive ? "text-blue-300 font-bold" : "text-white font-medium"}`}
                            >
                              {child.title}
                            </Typography>
                          </span>
                        </ListItem>
                      )}
                    </NavLink>
                  ))}
                </List>
              </AccordionBody>
            </Accordion>
          );
        })}
      </List>
    </div>
  );
};

export default Sidebar2;
