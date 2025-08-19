import React from "react";
import { NavLink } from "react-router-dom";
import { TfiAngleRight } from "react-icons/tfi";
import { BsMenuButtonFill } from "react-icons/bs";
import { FaHouseSignal, FaRegHardDrive } from "react-icons/fa6";
import {
  Card,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";
import {
  PresentationChartBarIcon,
  HomeIcon,
  ServerIcon,
  BoltIcon,
  RssIcon,
} from "@heroicons/react/24/solid";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";

const Sidebar2 = ({ sidebarOpen }) => {
  const [open, setOpen] = React.useState(0);

  const handleOpen = (value) => {
    setOpen(open === value ? 0 : value);
  };

  return (
    <div
      className={`h-full w-full p-2 shadow-xl bg-blue-gray-900 shadow-blue-gray-900/5 ${
        sidebarOpen ? "max-w-[16rem]" : "max-w-[4rem]"
      } transition-all duration-300`}
    >
      <div className="my-1 flex items-center gap-2 p-2">
        <Typography variant="h6" color="white">
          <span className={`${sidebarOpen ? "" : "hidden"}`}>Quản lý truyền dẫn</span>
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
              className="border-b-0 p-2 text-white opacity-70"
            >
              <ListItemPrefix>
                <PresentationChartBarIcon className="h-4 w-4 " />
              </ListItemPrefix>
              <Typography color="white" className="mr-auto font-light text-sm">
                <span className={`${sidebarOpen ? "" : "hidden"}`}>Hệ thống</span>
              </Typography>
            </AccordionHeader>
          </ListItem>
          <AccordionBody className="py-0.5">
            <List className="p-0 text-white opacity-70">
              <NavLink to="/">
                <ListItem className="p-1">
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5 " />
                  </ListItemPrefix>
                  <span className={`${sidebarOpen ? "" : "hidden"}`}><Typography variant="small">Tổng quan</Typography></span>
                </ListItem>
              </NavLink>
              <ListItem className="p-1">
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5 " />
                </ListItemPrefix>
                <span className={`${sidebarOpen ? "" : "hidden"}`}><Typography variant="small">Báo cáo</Typography></span>
              </ListItem>
              <ListItem className="p-1">
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5 " />
                </ListItemPrefix>
                <span className={`${sidebarOpen ? "" : "hidden"}`}><Typography variant="small">Projects</Typography></span>
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
              className="border-b-0 p-2 text-white opacity-70 "
            >
              <ListItemPrefix>
                <HomeIcon className="h-4 w-4 " />
              </ListItemPrefix>
              <Typography color="white" className="mr-auto font-light text-sm">
                <span className={`${sidebarOpen ? "" : "hidden"}`}>Quản lý trạm</span>
              </Typography>
            </AccordionHeader>
          </ListItem>
          <AccordionBody className="py-0.5">
            <List className="p-0 text-white opacity-70">
              <NavLink
                to="/site"
                className={({ isActive }) =>
                  [isActive ? "text-blue-400" : undefined].join(" ")
                }
              >
                <ListItem className="p-1">
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  <span className={`${sidebarOpen ? "" : "hidden"}`}><Typography variant="small">Danh sách trạm</Typography></span>
                </ListItem>
              </NavLink>
              <NavLink
                to="/site/lookup"
                className={({ isActive }) =>
                  [isActive ? "text-blue-400" : undefined].join(" ")
                }
              >
                <ListItem className="p-1">
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  <span className={`${sidebarOpen ? "" : "hidden"}`}><Typography variant="small">Tra cứu thông tin trạm</Typography></span>
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
              className={`mx-auto text-white opacity-70 h-4 w-4 transition-transform ${open === 3 ? "rotate-180" : ""}`}
            />
          }
        >
          <ListItem className="p-0" selected={open === 3}>
            <AccordionHeader
              onClick={() => handleOpen(3)}
              className="border-b-0 p-2 "
            >
              <ListItemPrefix>
                <ServerIcon className="h-4 w-4 text-white opacity-70" />
              </ListItemPrefix>
              <Typography
                color="blue-gray"
                className="mr-auto font-light text-sm text-white opacity-70"
              >
                <span className={`${sidebarOpen ? "" : "hidden"}`}>Quản lý thiết bị</span>
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
                <ListItem className="p-1">
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  <span className={`${sidebarOpen ? "" : "hidden"}`}><Typography variant="small">Tra cứu</Typography></span>
                </ListItem>
              </NavLink>
              <ListItem className="p-1">
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                <span className={`${sidebarOpen ? "" : "hidden"}`}><Typography variant="small">Comming soon</Typography></span>
              </ListItem>
            </List>
          </AccordionBody>
        </Accordion>

        <Accordion
          open={open === 4}
          icon={
            <ChevronDownIcon
              strokeWidth={2.5}
              className={`mx-auto text-white opacity-70 h-4 w-4 transition-transform ${open === 4 ? "rotate-180" : ""}`}
            />
          }
        >
          <ListItem className="p-0" selected={open === 4}>
            <AccordionHeader
              onClick={() => handleOpen(4)}
              className="border-b-0 p-2 "
            >
              <ListItemPrefix>
                <BoltIcon className="h-4 w-4 text-white opacity-70" />
              </ListItemPrefix>
              <Typography
                color="blue-gray"
                className="mr-auto font-light text-sm text-white opacity-70"
              >
                <span className={`${sidebarOpen ? "" : "hidden"}`}>Quản lý cáp quang</span>
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
                <ListItem className="p-1">
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  <span className={`${sidebarOpen ? "" : "hidden"}`}><Typography variant="small">Cáp quang đầu tư</Typography></span>
                </ListItem>
              </NavLink>
            </List>
          </AccordionBody>
        </Accordion>

        {/* Quản lý hợp đồng FO */}
        <Accordion
          open={open === 5}
          icon={
            <ChevronDownIcon
              strokeWidth={2.5}
              className={`mx-auto text-white opacity-70 h-4 w-4 transition-transform ${open === 5 ? "rotate-180" : ""}`}
            />
          }
        >
          <ListItem className="p-0" selected={open === 5}>
            <AccordionHeader
              onClick={() => handleOpen(5)}
              className="border-b-0 p-2 "
            >
              <ListItemPrefix>
                <BuildingLibraryIcon className="h-4 w-4 text-white opacity-70" />
              </ListItemPrefix>
              <Typography
                color="blue-gray"
                className="mr-auto font-light text-sm text-white opacity-70"
              >
                <span className={`${sidebarOpen ? "" : "hidden"}`}>Hợp đồng thuê FO</span>
              </Typography>
            </AccordionHeader>
          </ListItem>
          <AccordionBody className="py-1 ">
            <List className="p-0 text-white opacity-70">
              <NavLink
                to="/fo-contract"
                className={({ isActive }) =>
                  [isActive ? "text-blue-400" : undefined].join(" ")
                }
              >
                <ListItem className="p-1">
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  <span className={`${sidebarOpen ? "" : "hidden"}`}><Typography variant="small">Danh sách hợp đồng</Typography></span>
                </ListItem>
              </NavLink>
              {/* Menu item đã được di chuyển */}
              <NavLink
                to="/hired-fo"
                className={({ isActive }) =>
                  [isActive ? "text-blue-400" : undefined].join(" ")
                }
              >
                <ListItem className="p-1">
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  <span className={`${sidebarOpen ? "" : "hidden"}`}><Typography variant="small">Danh sách tuyến thuê FO</Typography></span>
                </ListItem>
              </NavLink>
              <NavLink
                to="/fo-cost-by-supplier"
                className={({ isActive }) =>
                  [isActive ? "text-blue-400" : undefined].join(" ")
                }
              >
                <ListItem className="p-1">
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  <span className={`${sidebarOpen ? "" : "hidden"}`}><Typography variant="small">Báo cáo chi phí theo nhà cung cấp</Typography></span>
                </ListItem>
              </NavLink>
               <NavLink
                to="/fo-cost-by-contracts"
                className={({ isActive }) =>
                  [isActive ? "text-blue-400" : undefined].join(" ")
                }
              >
                <ListItem className="p-1">
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  <span className={`${sidebarOpen ? "" : "hidden"}`}><Typography variant="small">Báo cáo chi phí theo hợp đồng</Typography></span>
                </ListItem>
              </NavLink>
            </List>
          </AccordionBody>
        </Accordion>

        {/* Quản lý kênh thuê */}
        <Accordion
          open={open === 6}
          icon={
            <ChevronDownIcon
              strokeWidth={2.5}
              className={`mx-auto text-white opacity-70 h-4 w-4 transition-transform ${open === 6 ? "rotate-180" : ""}`}
            />
          }
        >
          <ListItem className="p-0" selected={open === 6}>
            <AccordionHeader
              onClick={() => handleOpen(6)}
              className="border-b-0 p-2 "
            >
              <ListItemPrefix>
                <RssIcon className="h-4 w-4 text-white opacity-70" />
              </ListItemPrefix>
              <Typography
                color="blue-gray"
                className="mr-auto font-light text-sm text-white opacity-70"
              >
                <span className={`${sidebarOpen ? "" : "hidden"}`}>Quản lý kênh thuê</span>
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
                <ListItem className="p-1">
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  <span className={`${sidebarOpen ? "" : "hidden"}`}><Typography variant="small">Danh sách kênh</Typography></span>
                </ListItem>
              </NavLink>
            </List>
          </AccordionBody>
        </Accordion>
      </List>
    </div>
  );
};

export default Sidebar2;
