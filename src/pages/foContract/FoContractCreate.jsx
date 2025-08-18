// NewFoContract.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
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
} from "@material-tailwind/react";
import {
  CogIcon,
  UserIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";

function NewFoContract() {
  const navigate = useNavigate();
  const { createContract } = useContracts();
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
  const [activeStep, setActiveStep] = useState(0);
  const [isLastStep, setIsLastStep] = useState(false);
  const [isFirstStep, setIsFirstStep] = useState(false);
  const axiosInstance = useAxiosPrivate();

  useEffect(() => {
    const getAllTransmissionOwner = async () => {
      try {
        const transmissionOwners = await axiosInstance.get("transmissionOwners");
        setTransmissionOwnerList(transmissionOwners.data);
      } catch (error) {
        console.log(error);
      }
    };
    getAllTransmissionOwner();
  }, [axiosInstance]);

  const handleCreateContract = async (contract) => {
    try {
      await createContract(contract);
      setActiveStep(1); // Move to the next step
      toast.success("Đã tạo hợp đồng thành công!");
    } catch (error) {
      console.error("Lỗi tạo mới hợp đồng:", error);
      toast.error("Lỗi khi tạo hợp đồng.");
    }
  };

  const contractValidate = Yup.object({
    contractNumber: Yup.string().required("Yêu cầu nhập số hợp đồng"),
    contractName: Yup.string().required("Yêu cầu nhập tên hợp đồng"),
    signedDate: Yup.date().required("Yêu cầu nhập ngày ký"),
    endDate: Yup.date().required("Yêu cầu nhập ngày hết hạn"),
    transmissionOwner: Yup.object({
      id: Yup.string().required("Yêu cầu nhập nhà cung cấp"),
    }),
  });

  const handlePrev = () => !isFirstStep && setActiveStep((cur) => cur - 1);
  const handleNext = async (values, { validateForm, setErrors, setTouched }) => {
    const errors = await validateForm();
    if (Object.keys(errors).length > 0) {
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
    await handleCreateContract(values);
  };
  
  return (
    <div className="p-5">
      <Typography variant="h4" color="blue">
        Thêm mới hợp đồng thuê FO
      </Typography>
      <Typography className="mt-1 font-normal text-gray-600">
        Đảm bảo dữ liệu đồng bộ
      </Typography>
      <div className="w-full px-24 py-4">
        <Stepper
          activeStep={activeStep}
          isLastStep={(value) => setIsLastStep(value)}
          isFirstStep={(value) => setIsFirstStep(value)}
        >
          <Step>
            <UserIcon className="h-5 w-5" />
            <div className="absolute -bottom-[2rem] w-max text-center">
              <Typography variant="h6" color={activeStep === 0 ? "blue-gray" : "gray"}>
                Tạo hợp đồng
              </Typography>
            </div>
          </Step>
          <Step>
            <CogIcon className="h-5 w-5" />
            <div className="absolute -bottom-[2rem] w-max text-center">
              <Typography variant="h6" color={activeStep === 1 ? "blue-gray" : "gray"}>
                Nhập danh sách tuyến cáp
              </Typography>
            </div>
          </Step>
          <Step>
            <BuildingLibraryIcon className="h-5 w-5" />
            <div className="absolute -bottom-[2rem] w-max text-center">
              <Typography variant="h6" color={activeStep === 2 ? "blue-gray" : "gray"}>
                Hoàn thành
              </Typography>
            </div>
          </Step>
        </Stepper>
        <div className="mt-4">
          {activeStep === 0 && (
            <Formik
              onSubmit={handleCreateContract}
              initialValues={newContract}
              validationSchema={contractValidate}
            >
              {({ values, validateForm, setErrors, setTouched }) => (
                <Form className="flex flex-col">
                  <div className="space-y-4 pb-6">
                    <Card className="shadow-none">
                      <div className="grid grid-cols-12 gap-3 p-2">
                        {/* Form fields here, as they were in your original code */}
                        <div className="col-span-full flex flex-col gap-2">
                          <label className="text-slate-400 font-semibold">
                            Số hợp đồng
                          </label>
                          <Field
                            name="contractNumber"
                            placeholder="Nhập số hợp đồng"
                            className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                          <ErrorMessage
                            className="justify-items-end text-sm font-light italic text-red-500"
                            name="contractNumber"
                            component="span"
                          />
                        </div>

                        <div className="col-span-full flex flex-col items-stretch gap-2">
                          <label className="text-slate-400 font-semibold">
                            Tên hợp đồng
                          </label>
                          <Field
                            name="contractName"
                            placeholder="Nhập tên hợp đồng"
                            className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                          <ErrorMessage
                            className="justify-items-end text-sm font-light italic text-red-500"
                            name="contractName"
                            component="span"
                          />
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
                            {transmissionOwnerList.map((owner) => (
                              <option key={owner.id} value={owner.id}>
                                {owner.name}
                              </option>
                            ))}
                          </Field>
                        </div>

                        <div className="col-span-full flex flex-col items-stretch gap-2">
                          <label className="text-slate-400 font-semibold">
                            Ngày ký
                          </label>
                          <Field
                            name="signedDate"
                            type="date"
                            className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                          <ErrorMessage
                            className="justify-items-end text-sm font-light italic text-red-500"
                            name="signedDate"
                            component="span"
                          />
                        </div>

                        <div className="col-span-full flex flex-col items-stretch gap-2">
                          <label className="text-slate-400 font-semibold">
                            Ngày hết hạn
                          </label>
                          <Field
                            name="endDate"
                            type="date"
                            className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                          <ErrorMessage
                            className="justify-items-end text-sm font-light italic text-red-500"
                            name="endDate"
                            component="span"
                          />
                        </div>

                        <div className="col-span-full flex flex-col items-stretch gap-2">
                          <label className="text-slate-400 font-semibold">
                            Ghi chú
                          </label>
                          <Field
                            className="h-24 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                            as="textarea"
                            name="note"
                          />
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="flex justify-between">
                    <Button onClick={handlePrev} disabled={isFirstStep}>
                      Quay lại
                    </Button>
                    <Button
                      size="md"
                      color="blue"
                      onClick={() => handleNext(values, { validateForm, setErrors, setTouched })}
                      disabled={isLastStep}
                    >
                      Tạo hợp đồng
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
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
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewFoContract;