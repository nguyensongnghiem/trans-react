import { useEffect, useMemo, useState } from "react";
import { DocumentIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import Select from "react-select";
import * as Yup from "yup";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useNavigate } from "react-router-dom";

import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import {
  Button,
  Card,
  Dialog,
  IconButton,
  Typography,
  DialogBody,
  DialogHeader,
  DialogFooter,
  Switch,
} from "@material-tailwind/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CustomMenuList } from "./CustomList";
import { toast } from "react-toastify";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import OwnerChip from "../components/OwnerChip";
function LeaselineList() {
  // const navigate = useNavigate();

  const [simpleSiteList, setSimpleSiteList] = useState([]);
  const [leaselineList, setLeaselineList] = useState([]);
  const [transmissionOwnerList, setTransmissionOwnerList] = useState([]);
  const [leaseLineConnectTypeList, setLeaseLineConnectTypeList] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editLeaseline, setEditLeaseline] = useState({});
  const [editId, setEditId] = useState(null);
  const axiosInstance = useAxiosPrivate();
  const [colDefs, setColDefs] = useState([
    { headerName: "Tỉnh", valueGetter: (p) => p.data.site.province?.name },
    { headerName: "Site ID", valueGetter: (p) => p.data.site.siteId },
    {
      headerName: "Nhà cung cấp",
      valueGetter: (p) => p.data.transmissionOwner?.name,
      cellRenderer: (p) => {
        return (
          <span className="inline-block text-center">
            <OwnerChip name={p.data.transmissionOwner?.name}></OwnerChip>
          </span>
        );
      },
    },
    {
      headerName: "Số lượng",
      valueGetter: (p) => p.data.quantity,
    },
    { headerName: "Băng thông (Mbps)", valueGetter: (p) => p.data.speed },
    {
      headerName: "Đơn giá (VNĐ)",
      valueGetter: (p) => p.data.cost,
      cellRenderer: (p) => VND.format(p.data.cost),
    },
    {
      headerName: "Loại kênh",
      valueGetter: (p) => p.data.leaseLineConnectType?.name,
    },
    { headerName: "Ghi chú", valueGetter: (p) => p.data.note },
    {
      headerName: "Trạng thái",
      valueGetter: (p) => p.data.active,
      cellRenderer: (p) => {
        return (
          <span
            className={`inline-flex items-center ${p.data.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"} text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300`}
          >
            <span
              className={`w-2 h-2 me-1 ${p.data.active ? "bg-green-500" : "bg-red-500"} rounded-full`}
            ></span>
            {p.data.active ? "Hoạt động" : "Không hoạt động"}
          </span>
        );
      },
    },
    {
      headerName: "Tác động",
      cellRenderer: (p) => (
        <div className="flex items-center justify-center">
          <IconButton
            variant="text"
            size="sm"
            onClick={() => handleEdit(p.data.id)}
          >
            <PencilIcon className="h-4 w-4 text-gray-900" />
          </IconButton>
          <IconButton
            variant="text"
            size="sm"
            onClick={() => handleDeleteLeaseline(p.data.id)}
          >
            <TrashIcon strokeWidth={3} className="h-4 w-4 text-gray-900" />
          </IconButton>
        </div>
      ),
    },
  ]);
  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
      sortable: true,
      filter: true,
      floatingFilter: true,
    };
  });

  useEffect(() => {
    const getAllLeaseline = async () => {
      try {
        setIsLoading(true);
        const leaselines = await axiosInstance.get("leaselines");
        setLeaselineList(leaselines.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    getAllLeaseline();
  }, []);

  useEffect(() => {
    const getAllSites = async () => {
      try {
        const siteList = await axiosInstance.get("sites/simple-list");
        setSimpleSiteList(siteList.data);
      } catch (error) {
        console.log(error);
      }
    };
    getAllSites();
  }, []);

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

  useEffect(() => {
    const getAllLeaselineConnectType = async () => {
      try {
        const leaselineConnectTypeList = await axiosInstance.get(
          "leaseline-connect-type"
        );
        setLeaseLineConnectTypeList(leaselineConnectTypeList.data);
      } catch (error) {
        console.log(error);
      }
    };
    getAllLeaselineConnectType();
  }, []);

  const getLeaselineById = async (editId) => {
    try {
      const leaseline = await axiosInstance.get(`leaselines/${editId}`);
      setEditLeaseline({ ...leaseline.data });
    } catch (error) {
      console.log(error);
    }
  };
  const VND = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });
  // Xử lý thêm mới
  const handleOpenCreate = () => {
    setOpenCreate(!openCreate);
  };
  const handleCreate = async (leaseline) => {
    console.log(leaseline);
    try {
      await axiosInstance.post("leaselines", leaseline);
      toast.success("Đã thêm mới kênh thuê thành công.");
    } catch (error) {
      toast.error(error.response.data.message, {
        zIndex: 9999,
      });
    } finally {
      setOpenCreate(!openCreate);
    }
  };
  // Xử lý Edit

  const handleEdit = async (editId) => {
    await getLeaselineById(editId);
    handleOpenEdit();
  };

  const handleOpenEdit = () => {
    setOpenEdit(!openEdit);
  };

  const handleEditSubmit = async (leaseline) => {
    console.log(leaseline);
    try {
      await axiosInstance.put(`leaselines/${leaseline.id}`, leaseline);
      setLeaselineList((prevList) =>
        prevList.map((item) => (item.id === leaseline.id ? leaseline : item))
      );
      toast.success("Đã cập nhật thành công kênh thuê");
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 400) {
        toast.error(error.data.message);
      } else {
        toast.error("Có lỗi bất thường xảy ra");
      }
    } finally {
      setOpenEdit(!openEdit);
    }
    setOpenEdit(!openEdit);
  };

  // Xử lý Xóa

  const handleDeleteLeaseline = async (deleteId) => {
    setDeleteId(deleteId);
    handleOpenDelete();
  };
  const handleOpenDelete = () => {
    setOpenDelete(!openDelete);
  };
  const handleDeleteSubmit = async () => {
    try {
      await axiosInstance.delete("leaselines/" + deleteId);
      setDeleteId(null);
      toast.success("Đã xóa thành công kênh thuê");
      setLeaselineList((prevState) =>
        prevState.filter((leaseline) => leaseline.id !== deleteId)
      );
    } catch (e) {
      console.log(e);
      toast.error("Có lỗi xảy ra khi xóa kênh thuê");
    } finally {
      handleOpenDelete();
    }
  };

  let deleteLeaselineName;
  if (deleteId != null) {
    deleteLeaselineName = leaselineList.find(
      (leaseline) => leaseline.id === deleteId
    ).site.siteId;
    console.log(deleteLeaselineName);
  }

  // if (isLoading) return <Spinner />;
  return (
    <div className="p-5">
      <Typography variant="h4" color="blue-gray" className="mb-3">
        Danh sách kênh thuê
      </Typography>
      <Button
        variant="gradient"
        size="sm"
        className="mb-3 flex items-center gap-3"
        onClick={handleOpenCreate}
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
      <div
        className="ag-theme-quartz" // applying the Data Grid theme
        style={{ height: "100vh", width: "100%" }} // the Data Grid will fill the size of the parent container
      >
        <AgGridReact
          rowData={leaselineList}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={20}
          className="overflow-x-auto"
        />
      </div>

      {/* Modal Thêm mới */}
      <Dialog
        open={openCreate}
        handler={handleOpenCreate}
        className="overflow-hidden"
        size="sm"
      >
        <div className="max-h-[90vh] overflow-y-auto p-3">
          <DialogHeader className="relative m-0 block">
            <Typography variant="h4" color="blue">
              Thêm mới kênh thuê
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

          <Formik
            onSubmit={handleCreate}
            initialValues={{
              speed: 0,
              cost: 0,
              quantity: 1,
              site: { id: null },
              leaseLineConnectType: { id: 1 },
              transmissionOwner: { id: 1 },
              note: "",
            }}
            validationSchema={Yup.object({
              speed: Yup.string().required("Yêu cầu nhập tốc độ"),
              cost: Yup.number().required("Yêu cầu nhập đơn giá"),
              quantity: Yup.number().required("Yêu cầu nhập số lượng"),
              site: Yup.object({
                id: Yup.string().required("Yêu cầu nhập site ID"),
              }),
            })}
          >
            {({ setFieldValue, getFieldProps, values, setErrors }) => (
              <Form className="flex flex-initial flex-shrink flex-col">
                <DialogBody className="space-y-4 pb-6">
                  <Card className="shadow-none">
                    <div className="grid grid-cols-12 gap-3 p-2">
                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Site ID
                        </label>
                        <Select
                          placeholder="Site ID"
                          value={
                            simpleSiteList
                              ? simpleSiteList.find((option) => {
                                  return option.id === getFieldProps("site.id");
                                })
                              : ""
                          }
                          onChange={(selectedOption) => {
                            setFieldValue("site.id", selectedOption.id);
                          }}
                          classNames={{
                            control: (state) =>
                              state.isFocused
                                ? "border-blue-500"
                                : "border-grey-300",
                          }}
                          components={{
                            MenuList: CustomMenuList,
                          }}
                          isSearchable={true}
                          options={simpleSiteList}
                          name="site.id"
                          getOptionLabel={(option) => option.siteId}
                          isLoading={false}
                          loadingMessage={() => "Đang lấy thông tin trạm..."}
                          noOptionsMessage={() => "Site ID không tìm thấy"}
                        />
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="site.id"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Băng thông (Mbps)
                        </label>

                        <Field
                          name="speed"
                          type="number"
                          placeholder="Nhập băng thông (Mbps)"
                          className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        ></Field>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="speed"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      {/* Đơn giá */}
                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Đơn giá (VND)
                        </label>

                        <Field
                          name="cost"
                          type="number"
                          placeholder="Nhập đơn giá thuê (VNĐ)"
                          className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        ></Field>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="cost"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      {/* Số lượng */}
                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Số lượng
                        </label>

                        <Field
                          name="quantity"
                          type="number"
                          placeholder="Nhập số lượng"
                          className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        ></Field>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="quantity"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      {/* Loại kênh thuê */}
                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Loại kênh thuê
                        </label>
                        <Field
                          className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          as="select"
                          name="leaseLineConnectType.id"
                        >
                          {leaseLineConnectTypeList.map(
                            (leaselineConnectType) => {
                              return (
                                <option
                                  key={leaselineConnectType.id}
                                  value={leaselineConnectType.id}
                                >
                                  {leaselineConnectType.name}
                                </option>
                              );
                            }
                          )}
                        </Field>
                      </div>

                      {/* Nhà cung cấp */}
                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Nhà cung cấp
                        </label>
                        <Field
                          className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          as="select"
                          name="transmissionOwner.id"
                        >
                          {transmissionOwnerList.map((transmissionOwner) => {
                            return (
                              <option
                                key={transmissionOwner.id}
                                value={transmissionOwner.id}
                              >
                                {transmissionOwner.name}
                              </option>
                            );
                          })}
                        </Field>
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
                <DialogFooter>
                  <Button size="md" type="submit" color="red">
                    Thêm mới
                  </Button>
                </DialogFooter>
              </Form>
            )}
            {/* <img src={MySvg} alt="" className="flex-initial p-5" /> */}
          </Formik>
        </div>
      </Dialog>

      {/* Modal Sửa thông tin */}
      <Dialog
        open={openEdit}
        handler={handleOpenEdit}
        className="overflow-hidden"
        size="sm"
      >
        <div className="max-h-[90vh] overflow-y-auto p-3">
          <DialogHeader className="relative m-0 block">
            <Typography variant="h4" color="blue">
              Cập nhật thông tin kênh thuê
            </Typography>
            <Typography className="mt-1 font-normal text-gray-700">
              Cập nhật dữ liệu kênh thuê đảm bảo thực tế
            </Typography>
            <IconButton
              size="sm"
              variant="text"
              className="!absolute right-3.5 top-3.5"
              onClick={handleOpenEdit}
            >
              <XMarkIcon className="h-4 w-4 stroke-2" />
            </IconButton>
          </DialogHeader>

          <Formik
            onSubmit={handleEditSubmit}
            initialValues={{
              ...editLeaseline,
            }}
            validationSchema={Yup.object({
              speed: Yup.string().required("Yêu cầu nhập tốc độ"),
              cost: Yup.number().required("Yêu cầu nhập đơn giá"),
              quantity: Yup.number().required("Yêu cầu nhập số lượng"),
              site: Yup.object({
                id: Yup.string().required("Yêu cầu nhập site ID"),
              }),
            })}
          >
            {({ setFieldValue, getFieldProps, values, setErrors }) => (
              <Form className="flex flex-initial flex-shrink flex-col">
                <DialogBody className="space-y-4 pb-6">
                  <Card className="shadow-none">
                    <div className="grid grid-cols-12 gap-3 p-2">
                      <div className="col-span-full flex justify-end gap-2">
                        {/*<label className="text-slate-400 font-semibold">*/}
                        {/*  Trạng thái*/}
                        {/*</label>*/}
                        <Field
                          as={Switch}
                          name="active"
                          color="green"
                          label={
                            <Typography variant="h6">
                              {values.active
                                ? "Đang hoạt động"
                                : "Không hoạt động"}
                            </Typography>
                          }
                          checked={values.active}
                          onChange={({ target }) =>
                            setFieldValue("active", target.checked)
                          } // Thiết lập giá trị true/false
                        />
                      </div>

                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Site ID
                        </label>
                        <Select
                          placeholder="Site ID"
                          defaultValue={simpleSiteList.find(
                            ({ id }) => id === values.site.id
                          )}
                          value={
                            simpleSiteList
                              ? simpleSiteList.find((option) => {
                                  return option.id === getFieldProps("site.id");
                                })
                              : ""
                          }
                          onChange={(selectedOption) => {
                            setFieldValue("site.id", selectedOption.id);
                          }}
                          classNames={{
                            control: (state) =>
                              state.isFocused
                                ? "border-blue-300"
                                : "border-grey-300",
                          }}
                          components={{
                            MenuList: CustomMenuList,
                          }}
                          isSearchable={true}
                          options={simpleSiteList}
                          name="site.id"
                          getOptionLabel={(option) => option.siteId}
                          isLoading={false}
                          loadingMessage={() => "Đang lấy thông tin trạm..."}
                          noOptionsMessage={() => "Không có thông tin trạm"}
                        />
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="site.siteId"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Băng thông (Mbps)
                        </label>
                        <Field
                          name="speed"
                          type="number"
                          placeholder="Nhập băng thông (Mbps)"
                          className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        ></Field>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="speed"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      {/* Đơn giá */}
                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Đơn giá (VND)
                        </label>
                        <Field
                          name="cost"
                          type="number"
                          placeholder="Nhập đơn giá thuê (VNĐ)"
                          className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        ></Field>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="cost"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      {/* Số lượng */}
                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Số lượng
                        </label>
                        <Field
                          name="quantity"
                          type="number"
                          placeholder="Nhập số lượng"
                          className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        ></Field>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="quantity"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Loại kênh thuê
                        </label>
                        <Field
                          className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          as="select"
                          name="leaseLineConnectType.id"
                        >
                          {leaseLineConnectTypeList.map(
                            (leaselineConnectType) => {
                              return (
                                <option
                                  key={leaselineConnectType.id}
                                  value={leaselineConnectType.id}
                                >
                                  {leaselineConnectType.name}
                                </option>
                              );
                            }
                          )}
                        </Field>
                      </div>
                      {/* <p className="col-span-full text-2xl text-blue-600">Vị trí</p> */}
                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Nhà cung cấp
                        </label>
                        <Field
                          className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          as="select"
                          name="transmissionOwner.id"
                        >
                          {transmissionOwnerList.map((transmissionOwner) => {
                            return (
                              <option
                                key={transmissionOwner.id}
                                value={transmissionOwner.id}
                              >
                                {transmissionOwner.name}
                              </option>
                            );
                          })}
                        </Field>
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
                <DialogFooter>
                  <Button size="md" type="submit" color="red">
                    Cập nhật dữ liệu
                  </Button>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </div>
      </Dialog>

      {/*Modal confirm xóa site*/}
      <Dialog open={openDelete} handler={handleOpenDelete} size="md">
        <DialogHeader>Xác nhận xóa kênh thuê khỏi cơ sở dữ liệu</DialogHeader>
        <DialogBody>
          Bạn muốn xóa thông tin kênh thuê tại trạm{" "}
          <span>{deleteLeaselineName}</span> ?
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="green"
            onClick={handleOpenDelete}
            className="mr-1"
          >
            <span>Hủy</span>
          </Button>
          <Button variant="gradient" color="red" onClick={handleDeleteSubmit}>
            <span>Xóa</span>
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
export default LeaselineList;
