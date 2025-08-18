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

const Sidebar2 = () => {
  const [open, setOpen] = React.useState(0);

  const handleOpen = (value) => {
    setOpen(open === value ? 0 : value);
  };

  return (
    <div className="h-[calc(100vh-2rem)] w-full max-w-[20rem] p-4 shadow-xl bg-blue-gray-900 shadow-blue-gray-900/5">
      <div className="my-2 flex items-center gap-4 p-4">
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
            <List className="p-0 text-white opacity-70">
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
              className={`mx-auto text-white opacity-70 h-4 w-4 transition-transform ${open === 3 ? "rotate-180" : ""}`}
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
              className={`mx-auto text-white opacity-70 h-4 w-4 transition-transform ${open === 4 ? "rotate-180" : ""}`}
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
              className="border-b-0 p-3 "
            >
              <ListItemPrefix>
                <BuildingLibraryIcon className="h-5 w-5 text-white opacity-70" />
              </ListItemPrefix>
              <Typography
                color="blue-gray"
                className="mr-auto font-normal text-white opacity-70"
              >
                Hợp đồng thuê FO
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
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Danh sách hợp đồng
                </ListItem>
              </NavLink>
              {/* Menu item đã được di chuyển */}
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
              <NavLink
                to="/fo-cost-by-supplier"
                className={({ isActive }) =>
                  [isActive ? "text-blue-400" : undefined].join(" ")
                }
              >
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Báo cáo chi phí theo nhà cung cấp
                </ListItem>
              </NavLink>
               <NavLink
                to="/fo-cost-by-contracts"
                className={({ isActive }) =>
                  [isActive ? "text-blue-400" : undefined].join(" ")
                }
              >
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Báo cáo chi phí theo hợp đồng
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
  );
};

export default Sidebar2;
