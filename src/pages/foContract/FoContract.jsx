import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useSites from "../../hooks/useSites.jsx";
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { ArrowRightCircleIcon, PlusCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import React from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import * as XLSX from 'xlsx';
import useContracts from "../../hooks/useContracts.jsx";
import {
  Stepper,
  Step,
  Button,
  Card,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  Chip,
  Accordion,
  AccordionHeader,
  AccordionBody,
  Input,
  Dialog,
  IconButton,
  DialogBody,
  DialogHeader,
} from "@material-tailwind/react";
import { HashtagIcon, PlusIcon } from "@heroicons/react/24/solid";
import {
  MagnifyingGlassIcon,
  CogIcon,
  UserIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";
import FoConTractDetail from "./FoConTractDetail.jsx";

import { useSidebar } from "../../contexts/SidebarContext.jsx";

function FoContract() {
  const { sidebarOpen } = useSidebar();
  const navigate = useNavigate();
  const {
    contracts: contractList,
    createContract,
    fetchContracts,
  } = useContracts();
  const { simpleSites, isSitesLoading, fetchSites } = useSites();
  // const [simpleSiteList, setSimpleSiteList] = useState([]);
  // const [contractList, setContractList] = useState([]);
  const [newContract, setNewContract] = useState({
    contractNumber: null,
    contractName: null,
    signedDate: null,
    endDate: null,
    contractUrl: null,
    transmissionOwner: { id: 1 },
    note: "",
  });
  const [transmissionOwnerList, setTransmissionOwnerList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState({});
  const [openAlert, setOpenAlert] = React.useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState();
  const [openCreate, setOpenCreate] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isLastStep, setIsLastStep] = useState(false);
  const [isFirstStep, setIsFirstStep] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const axiosInstance = useAxiosPrivate();
  useEffect(() => {
    const getAllTransmissionOwner = async () => {
      try {
        const transmissionOwners =
          await axiosInstance.get("transmissionOwners");
        setTransmissionOwnerList(transmissionOwners.data);
      } catch (error) {
        console.log(error);
      }
    };
    getAllTransmissionOwner();
  }, []);

  const handleOpen = (year) => {
    setOpen(
      Object.keys(open).includes(String(year))
        ? { ...open, [year]: !open[year] }
        : { ...open, [year]: true }
    );
  };

  function handleContractSearch(e) {
    setSearchTerm(e.target.value);
  }

  const contractListWithSearch = contractList
    .sort((a, b) => {
      const diffDate = new Date(a.signedDate) - new Date(b.signedDate);
      if (diffDate === 0)
        return a.contractNumber.localeCompare(b.contractNumber);
      return diffDate;
    })
    .filter((contract) => contract.contractNumber.includes(searchTerm));

  const contractByYearWithSearch = contractListWithSearch.reduce(
    (acc, contract) => {
      const year = new Date(contract.signedDate).getFullYear();
      if (!acc[year]) {
        acc[year] = 0;
      }
      acc[year]++;
      return acc;
    },
    {}
  );
  const contractArrayByYearWithSearch = Object.entries(
    contractByYearWithSearch
  ).map(([year, count]) => ({
    year: parseInt(year),
    count,
  }));
  // Xử lý mở modal thêm mới hợp đồng
  // const handleOpenCreate = () => {
  //   if (openCreate) {
  //     // Reset state của hợp đồng
  //     setNewContract({
  //       contractNumber: null,
  //       contractName: null,
  //       signedDate: null,
  //       endDate: null,
  //       contractUrl: null,
  //       transmissionOwner: { id: 1 }, // hoặc id mặc định ban đầu
  //       note: "",
  //     });
  //     setUploadFile(null);
  //     // Reset active step về 0
  //     setActiveStep(0);
  //     // Reset các state khác nếu cần
  //     // Ví dụ: setError(null);
  //   }
  //   setOpenCreate(!openCreate);
  // };

  // Xử lý thêm mới hợp đồng
  const handleCreateContract = async (contract) => {
    console.log("Đã gọi tạo contract" + contract);
    try {
      const response = await createContract(contract);
      await fetchContracts(); // Cập nhật lại danh sách hợp đồng sau khi tạo mới
      setActiveStep(1); // Chuyển sang bước 2
    } catch (error) {
      console.error("Lỗi tạo mới hợp đồng:", error);
    }
  };
  const handleUploadList = async (file) => {
    console.log(file);
  };

  const contractValidate = Yup.object({
    contractNumber: Yup.string().required("Yêu cầu nhập số hợp đồng"),
    contractName: Yup.string().required("Yêu cầu nhập tên hợp đồng"),
    signedDate: Yup.date().required("Yêu cầu nhập ngày ký"),
    endDate: Yup.date().required("Yêu cầu nhập ngày hết hạn"),
    transmissionOwner: Yup.object({
      id: Yup.string().required("Yêu cầu nhập nhà cung cấp"),
    }),
    // contractUrl: Yup.mixed()
    //   .required("Yêu cầu tải lên văn bản pdf")
    //   .test("fileFormat", "Yêu cầu định dạng pdf", (value) => {
    //     console.log(value);
    //     if (value && typeof value === "object" && value.name) {
    //       const supportedFormats = ["pdf"];
    //       return supportedFormats.includes(
    //         value.name.split(".").pop()
    //       );
    //     }
    //     return true;
    //   }),
  });
  // const handleNext = () => !isLastStep && setActiveStep((cur) => cur + 1);
  const handlePrev = () => !isFirstStep && setActiveStep((cur) => cur - 1);
  const handleNext = async (
    values,
    { validateForm, setErrors, setTouched }
  ) => {
    // console.log("Lỗi validate contract" + values);
    const errors = await validateForm();
    if (Object.keys(errors).length > 0) {
      // Nếu có lỗi, hiển thị lỗi
      setTouched({
        contractNumber: true,
        contractName: true,
        signedDate: true,
        endDate: true,
        transmissionOwner: { id: true },
      });
      setErrors(errors);
      return;
    }
    // Bước 2: Gọi API để tạo hợp đồng
    await handleCreateContract(values);
  };
  // if (isLoading) return <Spinner />;
  const onBtnExport = () => {
    const headers = ["Số hợp đồng", "Tên hợp đồng", "Ngày ký", "Ngày hết hạn", "Nhà cung cấp", "Ghi chú"];
    const dataToExport = contractList.map(contract => {
      return {
        "Số hợp đồng": contract.contractNumber,
        "Tên hợp đồng": contract.contractName,
        "Ngày ký": contract.signedDate,
        "Ngày hết hạn": contract.endDate,
        "Nhà cung cấp": contract.transmissionOwner?.name,
        "Ghi chú": contract.note
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contracts");
    XLSX.writeFile(workbook, "ContractList.xlsx");
  };
  return (
    <div className={`flex gap-2 p-3`}>
      <div className="flex-shrink-0">
        <div
          className="h-[calc(100vh-2rem)] max-w-max overflow-y-auto border-r-2 border-r-gray-300 p-1"
        >
          <div className="mb-1 flex items-center gap-2 justify-between">
            <Typography variant="h6" color="blue-gray">
              Danh mục hợp đồng
            </Typography>
            <div className="flex gap-2">
              <Link to="/fo-create">
                <Button
                  variant="gradient"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                 
                </Button>
              </Link>
              <Button
                variant="gradient"
                size="sm"
                color="green"
                className="flex items-center gap-2"
                onClick={onBtnExport}
              >
                Xuất Excel
              </Button>
            </div>
          </div>
          <div className="p-0">
            <Input
              icon={<MagnifyingGlassIcon className="h-4 w-4" />}
              variant="standard"
              label="Tìm theo tên hợp đồng"
              onChange={handleContractSearch}
              value={searchTerm}
            />
          </div>
          {/* Danh sách hợp đồng theo năm */}
          <List className="p-0">
            {contractArrayByYearWithSearch.map((item) => {
              return (
                <Accordion
                  key={item.year}
                  open={open[item.year]}                 
                  icon={
                    <Chip
                      value={item.count}
                      variant="ghost"
                      size="sm"
                      color="blue"
                      className="rounded-full"
                    />
                  }
                >
                  <ListItem className="p-0" selected={open === item.year}>
                    <AccordionHeader
                      onClick={() => handleOpen(item.year)}
                      className="border-b-0 p-2"
                    >
                      <ListItemPrefix>
                        <HashtagIcon className="h-3 w-3" />
                      </ListItemPrefix>
                      <Typography
                        color="blue"
                        className="mr-auto font-normal text-sm"
                      >
                        {item.year}
                      </Typography>
                    </AccordionHeader>
                  </ListItem>
                  <AccordionBody className="py-0.5">
                    <List className="p-0">
                      {contractListWithSearch
                        .filter((contract) => {
                          return (
                            new Date(contract.signedDate).getFullYear() ===
                            item.year
                          );
                        })
                        .map((contract) => {
                          return (
                            <ListItem
                              key={contract.id}
                              onClick={() => setSelectedId(contract.id)}
                            >
                              <ListItemPrefix>
                                <ArrowRightCircleIcon
                                  strokeWidth={2}
                                  className="h-2 w-2"
                                />
                              </ListItemPrefix>
                              <Typography
                                color="blue-gray"
                                className="text-sm"
                              >
                                {contract.contractNumber}
                              </Typography>
                              {/* <ListItemSuffix>
                                <Badge color={contract.active ? 'green' : 'red'}>

                                </Badge>
                              </ListItemSuffix> */}
                            </ListItem>
                          );
                        })}
                    </List>
                  </AccordionBody>
                </Accordion>
              );
            })}
          </List>
        </div>
      </div>
      <div className="flex-grow">
        {selectedId && <FoConTractDetail id={selectedId} />}
      </div>
    </div>
  );
}
export default FoContract;
