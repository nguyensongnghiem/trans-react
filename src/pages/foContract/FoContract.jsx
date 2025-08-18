import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useSites from "../../hooks/useSites.jsx";
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { ArrowRightCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import React from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
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
import { HashtagIcon } from "@heroicons/react/24/solid";
import {
  MagnifyingGlassIcon,
  CogIcon,
  UserIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";
import FoConTractDetail from "./FoConTractDetail.jsx";

function FoContract() {
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
  return (
    <div className="grid grid-cols-12 gap-3 p-5">
      <div className="col-span-3">
        <div className="h-[calc(100vh-2rem)] w-full overflow-y-auto border-r-2 border-r-gray-300 p-2">
          <div className="mb-2 flex items-center gap-4">
            <Typography variant="h5" color="blue-gray">
              Danh mục hợp đồng
            </Typography>
            <Link to="/fo-create">
            <Button
              variant="gradient"
              size="sm"
              className="mb-3 flex items-center gap-3"
              // onClick={handleOpenCreate}
              >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
                >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Thêm mới
            </Button>
                  </Link>
          </div>
          <div className="p-0">
            <Input
              icon={<MagnifyingGlassIcon className="h-5 w-5" />}
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
                      className="border-b-0 p-3"
                    >
                      <ListItemPrefix>
                        <HashtagIcon className="h-4 w-4" />
                      </ListItemPrefix>
                      <Typography
                        color="blue"
                        className="mr-auto font-semibold"
                      >
                        {item.year}
                      </Typography>
                    </AccordionHeader>
                  </ListItem>
                  <AccordionBody className="py-1">
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
                                  className="h-3 w-3"
                                />
                              </ListItemPrefix>
                              <Typography color="blue-gray" className="text-md">
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
      <div className="col-span-9">
        {selectedId && <FoConTractDetail id={selectedId} />}
      </div>
      {/* Modal Thêm mới */}

      <Dialog
        open={openCreate}
        handler={handleOpenCreate}
        className="overflow-hidden"
        size="lg"
      >
        <div className="max-h-[90vh] overflow-y-auto p-3">
          <DialogHeader className="relative m-0 block">
            <Typography variant="h4" color="blue">
              Thêm mới hợp đồng thuê FO
            </Typography>
            <Typography className="mt-1 font-normal text-gray-600">
              Đảm bảo dữ liệu đồng bộ
            </Typography>
            <IconButton
              size="sm"
              variant="text"
              className="!absolute right-3.5 top-3.5"
              onClick={handleOpenCreate}
            >
              <XMarkIcon className="h-4 w-4 stroke-2" />
            </IconButton>
          </DialogHeader>
          <div className="w-full px-24 py-4">
            <Stepper
              activeStep={activeStep}
              isLastStep={(value) => setIsLastStep(value)}
              isFirstStep={(value) => setIsFirstStep(value)}
            >
              <Step>
                <UserIcon className="h-5 w-5" />
                <div className="absolute -bottom-[2rem] w-max text-center">
                  <Typography
                    variant="h6"
                    color={activeStep === 0 ? "blue-gray" : "gray"}
                  >
                    Tạo hợp đồng
                  </Typography>
                </div>
              </Step>
              <Step>
                <CogIcon className="h-5 w-5" />
                <div className="absolute -bottom-[2rem] w-max text-center">
                  <Typography
                    variant="h6"
                    color={activeStep === 1 ? "blue-gray" : "gray"}
                  >
                    Nhập danh sách tuyến cáp
                  </Typography>
                </div>
              </Step>
              <Step>
                <BuildingLibraryIcon className="h-5 w-5" />
                <div className="absolute -bottom-[2rem] w-max text-center">
                  <Typography
                    variant="h6"
                    color={activeStep === 2 ? "blue-gray" : "gray"}
                  >
                    Step 3
                  </Typography>
                </div>
              </Step>
            </Stepper>
            <div className="mt-4">
              {activeStep == 0 && (
                <div>
                  <Formik
                    onSubmit={handleCreateContract}
                    initialValues={newContract}
                    validationSchema={contractValidate}
                  >
                    {({
                      setFieldValue,
                      values,
                      setErrors,
                      isSubmitting,
                      validateForm,
                      setTouched,
                    }) => (
                      <Form className="flex flex-initial flex-shrink flex-col">
                        <DialogBody className="space-y-4 pb-6">
                          <Card className="shadow-none">
                            <div className="grid grid-cols-12 gap-3 p-2">
                              <div className="col-span-full flex flex-col gap-2">
                                <label className="text-slate-400 font-semibold">
                                  Số hợp đồng
                                </label>

                                <Field
                                  name="contractNumber"
                                  placeholder="Nhập số hợp đồng"
                                  className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                ></Field>
                                <ErrorMessage
                                  className="justify-items-end text-sm font-light italic text-red-500"
                                  name="contractNumber"
                                  component="span"
                                ></ErrorMessage>
                              </div>

                              <div className="col-span-full flex flex-col items-stretch gap-2">
                                <label className="text-slate-400 font-semibold">
                                  Tên hợp đồng
                                </label>
                                <Field
                                  name="contractName"
                                  placeholder="Nhập tên hợp đồng"
                                  className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                ></Field>
                                <ErrorMessage
                                  className="justify-items-end text-sm font-light italic text-red-500"
                                  name="contractName"
                                  component="span"
                                ></ErrorMessage>
                              </div>

                              <div className="col-span-full flex flex-col items-stretch gap-2">
                                <label className="text-slate-400 font-semibold">
                                  Nhà cung cấp
                                </label>
                                <Field
                                  className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  as="select"
                                  name="transmissionOwner.id"
                                >
                                  {transmissionOwnerList.map((owner) => {
                                    return (
                                      <option key={owner.id} value={owner.id}>
                                        {owner.name}
                                      </option>
                                    );
                                  })}
                                </Field>
                              </div>
                              <div className="col-span-full flex flex-col items-stretch gap-2">
                                <label className="text-slate-400 font-semibold">
                                  Ngày ký
                                </label>
                                <Field
                                  name="signedDate"
                                  placeholder="Nhập ngày ký"
                                  type="date"
                                  className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                ></Field>
                                <ErrorMessage
                                  className="justify-items-end text-sm font-light italic text-red-500"
                                  name="signedDate"
                                  component="span"
                                ></ErrorMessage>
                              </div>

                              <div className="col-span-full flex flex-col items-stretch gap-2">
                                <label className="text-slate-400 font-semibold">
                                  Ngày hết hạn
                                </label>
                                <Field
                                  name="endDate"
                                  placeholder="Nhập ngày hết hạn"
                                  type="date"
                                  className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                ></Field>
                                <ErrorMessage
                                  className="justify-items-end text-sm font-light italic text-red-500"
                                  name="endDate"
                                  component="span"
                                ></ErrorMessage>
                              </div>
                              <div className="col-span-full flex flex-col items-stretch gap-2">
                                <label className="text-slate-400 font-semibold">
                                  Tải lên văn bản hợp đồng
                                </label>
                                <input
                                  type="file"
                                  name="contractUrl"
                                  accept=".pdf"
                                  className="w-full cursor-pointer rounded border bg-white text-sm font-semibold text-gray-400 file:mr-4 file:cursor-pointer file:border-0 file:bg-gray-100 file:px-4 file:py-3 file:text-gray-500 file:hover:bg-gray-200"
                                  onChange={(e) => {
                                    // Object is possibly null error w/o check
                                    const file = e.currentTarget.files[0];
                                    if (e.currentTarget.files) {
                                      setFieldValue(
                                        "contractUrl",
                                        file || currentContractPdf
                                      );
                                    }
                                  }}
                                ></input>
                                <ErrorMessage
                                  className="justify-items-end text-sm font-light italic text-red-500"
                                  name="contractUrl"
                                  component="span"
                                ></ErrorMessage>
                              </div>
                              <div className="col-span-full col-start-1 mb-3 flex flex-col items-stretch gap-2 md:col-span-12">
                                <label className="text-slate-400 font-semibold">
                                  Ghi chú
                                </label>
                                <Field
                                  className="h-24 h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  as="textarea"
                                  name="note"
                                ></Field>
                              </div>
                            </div>
                          </Card>
                        </DialogBody>

                        {/* <DialogBody className="space-y-4 pb-6"></DialogBody> */}
                        <div className="flex justify-between">
                          <Button onClick={handlePrev} disabled={isFirstStep}>
                            Quay lại
                          </Button>

                          {!isLastStep ? (
                            <Button
                              size="md"
                              color="blue"
                              onClick={() => {
                                if (activeStep === 0) {
                                  handleNext(values, {
                                    validateForm,
                                    setErrors,
                                    setTouched,
                                  });
                                } else if (activeStep === 1) {
                                  handleUploadList();
                                }
                              }}
                              // onClick={() => setErrors({contractNumber: 'Looix'})}
                              disabled={isLastStep}
                            >
                              {activeStep == 0
                                ? "Tạo hợp đồng"
                                : "Thêm tuyến cáp"}
                            </Button>
                          ) : (
                            <Button size="md" type="submit" color="red">
                              Hoàn thành
                            </Button>
                          )}
                        </div>
                      </Form>
                    )}
                    
                  </Formik>
                </div>
              )}
              {activeStep === 1 && (
                      <Card className="shadow-none">
                        <div className="grid grid-cols-12 gap-3 p-2">
                          <div className="col-span-full flex flex-col gap-2">
                            <label className="text-slate-400 font-semibold">
                              Tải lên file excel theo mẫu (
                              <a
                                className="text-blue-500 italic"
                                href="/template/Danh sach FO trien khai v2.xlsx"
                              >
                                {" "}
                                File mẫu{" "}
                              </a>
                              )
                            </label>
                            {/* <input
                              type="file"
                              name="uploadList"
                              accept=".pdf"
                              className="w-full cursor-pointer rounded border bg-white text-sm font-semibold text-gray-400 file:mr-4 file:cursor-pointer file:border-0 file:bg-gray-100 file:px-4 file:py-3 file:text-gray-500 file:hover:bg-gray-200"
                              onChange={(e) => {
                                // Object is possibly null error w/o check
                                const file = e.currentTarget.files[0];
                                if (e.currentTarget.files) {
                                  setFieldValue(
                                    "uploadList",
                                    file || currentContractPdf
                                  );
                                }
                              }}
                            ></input> 
                            <ErrorMessage
                              className="justify-items-end text-sm font-light italic text-red-500"
                              name="uploadList"
                              component="span"
                            ></ErrorMessage>*/}
                          </div>
                        </div>
                      </Card>
                    )}
            </div>
          </div>

          {/* <div className="mt-32 flex justify-between">
            <Button onClick={handlePrev} disabled={isFirstStep}>
              Prev
            </Button>
            <Button onClick={handleNext} disabled={isLastStep}>
              Next
            </Button>
          </div> */}
        </div>
      </Dialog> 
    </div>
  );
}
export default FoContract;
