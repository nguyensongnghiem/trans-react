import { useState } from "react";
import { NavLink } from "react-router-dom";
import { TfiAngleRight } from "react-icons/tfi";
import { BsMenuButtonFill } from "react-icons/bs";
import { FaHouseSignal } from "react-icons/fa6";
import { FaRegHardDrive } from "react-icons/fa6";
import React from "react";
import {
  Card,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  ListItemSuffix,
  Chip,
  Accordion,
  AccordionHeader,
  AccordionBody,
  Alert,
} from "@material-tailwind/react";
import {
  PresentationChartBarIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  InboxIcon,
  PowerIcon,
  HomeIcon,
  BoltIcon,
  ServerIcon,
  RssIcon,
} from "@heroicons/react/24/solid";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  CubeTransparentIcon,
} from "@heroicons/react/24/outline";

const Sidebar2 = () => {
  const [open, setOpen] = React.useState(0);
  const [openAlert, setOpenAlert] = React.useState(true);

  const handleOpen = (value) => {
    setOpen(open === value ? 0 : value);
  };

  return (
    <div className="h-[calc(100vh-2rem)] w-full max-w-[20rem] p-4 shadow-xl bg-blue-gray-900 shadow-blue-gray-900/5">
      <div className="my-2 flex items-center gap-4 p-4">
        {/* <img
          src="https://docs.material-tailwind.com/img/logo-ct-dark.png"
          alt="brand"
          className="h-8 w-8"
        /> */}
        <Typography variant="h5" color="white">
          Quản lý truyền dẫn
        </Typography>
      </div>
      <List>
        <Accordion
          open={open === 1}
          icon={
            <ChevronDownIcon
              strokeWidth={2.5}
              className={`mx-auto h-4 w-4 transition-transform ${open === 1 ? "rotate-180" : ""}`}
            />
          }
        >
          <ListItem className="p-0" selected={open === 1}>
            <AccordionHeader
              onClick={() => handleOpen(1)}
              className="border-b-0 p-3 text-white opacity-70"
            >
              <ListItemPrefix>
                <PresentationChartBarIcon className="h-5 w-5 " />
              </ListItemPrefix>
              <Typography color="white" className="mr-auto font-normal">
                Hệ thống
              </Typography>
            </AccordionHeader>
          </ListItem>
          <AccordionBody className="py-1">
            <List className="p-0 text-white opacity-70 opacity-70">
              <NavLink to="/">
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5 " />
                  </ListItemPrefix>
                  Tổng quan
                </ListItem>
              </NavLink>
              <ListItem>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5 " />
                </ListItemPrefix>
                Báo cáo
              </ListItem>

              <ListItem>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5 " />
                </ListItemPrefix>
                Projects
              </ListItem>
            </List>
          </AccordionBody>
        </Accordion>
        <Accordion
          open={open === 2}
          icon={
            <ChevronDownIcon
              strokeWidth={2.5}
              className={`mx-auto text-white opacity-70 h-4 w-4 transition-transform ${open === 2 ? "rotate-180" : ""}`}
            />
          }
        >
          <ListItem className="p-0" selected={open === 2}>
            <AccordionHeader
              onClick={() => handleOpen(2)}
              className="border-b-0 p-3 text-white opacity-70 "
            >
              <ListItemPrefix>
                <HomeIcon className="h-5 w-5 " />
              </ListItemPrefix>
              <Typography color="white" className="mr-auto font-normal">
                Quản lý trạm
              </Typography>
            </AccordionHeader>
          </ListItem>
          <AccordionBody className="py-1">
            <List className="p-0 text-white opacity-70">
              <NavLink
                to="/site"
                className={({ isActive }) =>
                  [isActive ? "text-blue-400" : undefined].join(" ")
                }
              >
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Danh sách trạm
                </ListItem>
              </NavLink>
              <NavLink
                to="/site/lookup"
                className={({ isActive }) =>
                  [isActive ? "text-blue-400" : undefined].join(" ")
                }
              >
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Tra cứu thông tin trạm
                </ListItem>
              </NavLink>
            </List>
          </AccordionBody>
        </Accordion>
        <Accordion
          open={open === 3}
          icon={
            <ChevronDownIcon
              strokeWidth={2.5}
              className={`mx-auto text-white  opacity-70 h-4 w-4 transition-transform ${open === 2 ? "rotate-180" : ""}`}
            />
          }
        >
          <ListItem className="p-0" selected={open === 3}>
            <AccordionHeader
              onClick={() => handleOpen(3)}
              className="border-b-0 p-3 "
            >
              <ListItemPrefix>
                <ServerIcon className="h-5 w-5 text-white opacity-70" />
              </ListItemPrefix>
              <Typography
                color="blue-gray"
                className="mr-auto font-normal text-white opacity-70"
              >
                Quản lý thiết bị
              </Typography>
            </AccordionHeader>
          </ListItem>
          <AccordionBody className="py-1 ">
            <List className="p-0 text-white opacity-70">
              <NavLink
                to="/router"
                className={({ isActive }) =>
                  [isActive ? "text-blue-400" : undefined].join(" ")
                }
              >
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Tra cứu
                </ListItem>
              </NavLink>
              <ListItem>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                Comming soon
              </ListItem>
            </List>
          </AccordionBody>
        </Accordion>

        <Accordion
          open={open === 4}
          icon={
            <ChevronDownIcon
              strokeWidth={2.5}
              className={`mx-auto text-white opacity-70  h-4 w-4 transition-transform ${open === 2 ? "rotate-180" : ""}`}
            />
          }
        >
          <ListItem className="p-0" selected={open === 4}>
            <AccordionHeader
              onClick={() => handleOpen(4)}
              className="border-b-0 p-3 "
            >
              <ListItemPrefix>
                <BoltIcon className="h-5 w-5 text-white opacity-70" />
              </ListItemPrefix>
              <Typography
                color="blue-gray"
                className="mr-auto font-normal text-white opacity-70"
              >
                Quản lý cáp quang
              </Typography>
            </AccordionHeader>
          </ListItem>
          <AccordionBody className="py-1 ">
            <List className="p-0 text-white opacity-70">
              <NavLink
                to="/site"
                className={({ isActive }) =>
                  [isActive ? "text-blue-400" : undefined].join(" ")
                }
              >
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Cáp quang đầu tư
                </ListItem>
              </NavLink>
              <NavLink
                to="/fo-contract"
                className={({ isActive }) =>
                  [isActive ? "text-blue-400" : undefined].join(" ")
                }
              >
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Hơp đồng thuê FO
                </ListItem>
              </NavLink>
              <NavLink
                to="/hired-fo"
                className={({ isActive }) =>
                  [isActive ? "text-blue-400" : undefined].join(" ")
                }
              >
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Danh sách tuyến thuê FO
                </ListItem>
              </NavLink>
            </List>
          </AccordionBody>
        </Accordion>

        {/* Quản  lý kênh thuê */}
        <Accordion
          open={open === 5}
          icon={
            <ChevronDownIcon
              strokeWidth={2.5}
              className={`mx-auto text-white opacity-70  h-4 w-4 transition-transform ${open === 2 ? "rotate-180" : ""}`}
            />
          }
        >
          <ListItem className="p-0" selected={open === 5}>
            <AccordionHeader
              onClick={() => handleOpen(5)}
              className="border-b-0 p-3 "
            >
              <ListItemPrefix>
                <RssIcon className="h-5 w-5 text-white opacity-70" />
              </ListItemPrefix>
              <Typography
                color="blue-gray"
                className="mr-auto font-normal text-white opacity-70"
              >
                Quản lý kênh thuê
              </Typography>
            </AccordionHeader>
          </ListItem>
          <AccordionBody className="py-1 ">
            <List className="p-0 text-white opacity-70">
              <NavLink
                to="/leaseline"
                className={({ isActive }) =>
                  [isActive ? "text-blue-400" : undefined].join(" ")
                }
              >
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Danh sách kênh
                </ListItem>
              </NavLink>
          
            </List>
          </AccordionBody>
        </Accordion>
      </List>
    </div>
    // const [expandedMenu, setExpandedMenu] = useState(null);

    // const toggleSubMenu = (menuKey) => {
    //   setExpandedMenu(expandedMenu === menuKey ? null : menuKey);
    // };

    // const menuItems = [
    //   {
    //     icon: <BsMenuButtonFill />,
    //     key: "dashboard",
    //     label: "Dashboard",
    //     to: "/",
    //   },
    //   {
    //     icon: <FaHouseSignal />,
    //     key: "sites",
    //     label: "Quản lý trạm",
    //     subMenuItems: [
    //       { label: "Danh sách", to: "/site" },
    //       { label: "Thêm mới", to: "/site/create" },
    //     ],
    //   },
    //   {
    //     icon: <FaRegHardDrive />,
    //     key: "routers",
    //     label: "Router List",
    //     to: "/router",
    //   },
    // ];

    // return (
    //   <div className="flex w-full flex-col bg-blue-gray-900 text-blue-gray-300">
    //     <nav className="flex-1 py-4">
    //       <ul className="space-y-2">
    //         {menuItems.map((item) => (
    //           <li key={item.key}>
    //             <div>
    //               <button
    //                 className="hover:bg-sky-700 hover:border-l-sky-400 block w-full px-4 py-2 text-left transition-colors duration-100 hover:border-l-8"
    //                 onClick={() => toggleSubMenu(item.key)} to={item.to}>
    //                 <div className="flex flex-row items-center">
    //                   <div className="align- basis-1/6">
    //                     {item.icon}
    //                   </div>
    //                   <div className="basis-5/6">
    //                     {item.label}
    //                   </div>
    //                   <span className={`float-right transition-transform duration-300 ${expandedMenu === item.key ? "rotate-90" : ""}`}>
    //                     {item.subMenuItems && <TfiAngleRight size="12px" />}
    //                   </span>
    //                 </div>
    //               </button>

    //               {expandedMenu === item.key && item.subMenuItems && (
    //                 <ul className="mx-3 rounded-lg">
    //                   {item.subMenuItems.map((subItem, index) => (
    //                     <li key={index}>
    //                       <NavLink
    //                         to={subItem.to}
    //                         className={({ isActive }) =>
    //                           [
    //                             "block py-2 hover:bg-sky-700 hover:border-l-sky-400 hover:border-l-8 transition-colors duration-100",
    //                             isActive ? "text-red-400" : undefined,
    //                           ].join(" ")
    //                         }
    //                       >
    //                         <p className="text-center">
    //                           {subItem.label}
    //                         </p>
    //                       </NavLink>
    //                     </li>
    //                   ))}
    //                 </ul>
    //               )}
    //             </div>
    //           </li>
    //         ))}
    //       </ul>
    //     </nav>
    //     <div className="mt-auto flex items-center justify-center border-t border-gray-700 py-2">
    //       <a
    //         href="#"
    //         className="text-gray-400 transition-colors duration-300 hover:text-white"
    //       >
    //         Logout
    //       </a>
    //     </div>
    //   </div>
    // );
  );
};

export default Sidebar2;
