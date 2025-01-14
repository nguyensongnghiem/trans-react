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
function HiredFoList() {
  // const navigate = useNavigate();

  const [simpleSiteList, setSimpleSiteList] = useState([]);
  const [hiredFoList, setHiredFoList] = useState([]);
  const [routerTypeList, setRouterTypeList] = useState([]);
  const [transmissionDeviceTypeList, setTransmissionDeviceTypeList] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editFoLine, setEditFoLine] = useState({});
  const [editId, setEditId] = useState(null);
  const axiosInstance = useAxiosPrivate();
  const [colDefs, setColDefs] = useState([
      {
        headerName: "Tên tuyến",
        valueGetter: (p) =>
          p.data.nearSite?.siteId + " - " + p.data.farSite?.siteId,
      },
      { headerName: "Khoảng cách", valueGetter: (p) => p.data.finalDistance },
      {
        headerName: "Số core",
        valueGetter: (p) => p.data.coreQuantity,
      },
      {
        headerName: "Số hợp đồng",
        valueGetter: (p) => p.data.cost,
        cellRenderer: (p) => p.data.foContract.contractNumber,
      },
      // {
      //   headerName: "Tên hợp đồng",
      //   valueGetter: (p) => p.data.cost,
      //   cellRenderer: (p) => p.data.foContract.contractName,
      // },
      {
        headerName: "Trạng thái",
        valueGetter: (p) => p.data.active,
        cellRenderer: (p) => {
          return (
            <span className={`inline-flex items-center ${p.data.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300`}>
              <span className={`w-2 h-2 me-1 ${p.data.active ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></span>
              {p.data.active ? 'Hoạt động' : 'Không hoạt động'}
            </span>
          );
        },
      },
      { headerName: "Ghi chú", valueGetter: (p) => p.data.note },
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
            {/* <IconButton
              variant="text"
              size="sm"
              onClick={() => handleDeleteRouter(p.data.id)}
            >
              <TrashIcon strokeWidth={3} className="h-4 w-4 text-gray-900" />
            </IconButton> */}
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
    const getAllHiredFo = async () => {
      try {
        setIsLoading(true);
        const hiredFoList = await axiosInstance.get("hired-fos");
        setHiredFoList(hiredFoList.data);
      } catch (error) {
        console.log(error);
      } 
      finally {
        setIsLoading(false);
      }
    };
    getAllHiredFo();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const siteList = await axiosInstance.get("sites/simple-list");
        setSimpleSiteList(siteList.data);
      } catch (error) {
        console.log(error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const routerTypes = await axiosInstance.get("router-types");
        setRouterTypeList(routerTypes.data);
      } catch (error) {
        console.log(error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const transDeviceTypeList = await axiosInstance.get("transmission-device-types");
        setTransmissionDeviceTypeList(transDeviceTypeList.data);
      } catch (error) {
        console.log(error);
      }
    };
    loadData();
  }, []);

  const getFoById = async (editId) => {
    try {
      const foLine = await axiosInstance.get(`hired-fos/${editId}`);
      setEditFoLine({ ...foLine.data });
    } catch (error) {
      console.log(error);
    }      
  };

  // Xử lý thêm mới
  const handleOpenCreate = () => {
    setOpenCreate(!openCreate);
  };
  const handleCreate = async (router) => {
    console.log(router);
    try {
      await axiosInstance.post("routers", router);
      toast.success("Đã thêm mới thiết bị thành công.");
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
    await getFoById(editId);
    handleOpenEdit();
  };

  const handleOpenEdit = () => {
    setOpenEdit(!openEdit);
  };

  const handleEditSubmit = async (foLine) => {
    console.log(foLine);
    try {
      await axiosInstance.put(`hired-fos/${foLine.id}`, foLine);
      setHiredFoList((prevList) =>
        prevList.map((item) => (item.id === foLine.id ? foLine : item))
      );
      toast.success("Đã cập nhật thành công tuyến FO");
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

  const handleDeleteRouter = async (deleteId) => {
    setDeleteId(deleteId);
    handleOpenDelete();
  };
  const handleOpenDelete = () => {
    setOpenDelete(!openDelete);
  };
  const handleDeleteSubmit = async () => {
    try {
      await axiosInstance.delete("routers/" + deleteId);
      setDeleteId(null);
      toast.success("Đã xóa thành công thiết bị");
      setHiredFoList((prevState) =>
        prevState.filter((router) => router.id !== deleteId)
      );
    } catch (e) {
      console.log(e);
      toast.error("Có lỗi xảy ra khi xóa trạm");
    } finally {
      handleOpenDelete();
    }
  };
  const VND = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  let deleteRouterName;
  if (deleteId != null) {
    deleteRouterName = hiredFoList.find((router) => router.id === deleteId).name;
    console.log(deleteRouterName);
  }

  // if (isLoading) return <Spinner />;
  return (
    <div className="p-5">
      <Typography variant="h4" color="blue-gray" className="mb-3">
        Danh sách FO thuê
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
          rowData={hiredFoList}
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
              Thêm mới thiết bị
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
              name: null,
              site: { id: null },
              ip: "",
              transmissionDeviceType: { id: 1 },
              routerType: { id: 1 },
              note: "",
            }}
            validationSchema={Yup.object({
              name: Yup.string().required("Yêu cầu nhập tên router"),
              site: Yup.object({
                id: Yup.string().required("Yêu cầu nhập site ID"),
              }),
              ip: Yup.string().required("Yêu cầu nhập Ip quản lý"),
            })}
          >
            {({ setFieldValue, getFieldProps, values, setErrors }) => (
              <Form className="flex flex-initial flex-shrink flex-col">
                <DialogBody className="space-y-4 pb-6">
                  <Card className="shadow-none">
                    <div className="grid grid-cols-12 gap-3 p-2">
                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Tên thiết bị
                        </label>

                        <Field
                          name="name"
                          placeholder="Nhập tên thiết bị"
                          className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        ></Field>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="name"
                          component="span"
                        ></ErrorMessage>
                      </div>

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

                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          IP quản lý
                        </label>
                        <Field
                          name="ip"
                          placeholder="Nhập IP quản ý"
                          className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        ></Field>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="ip"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Loại thiết bị truyền dẫn
                        </label>
                        <Field
                          className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          as="select"
                          name="transmissionDeviceType.id"
                        >
                          {transmissionDeviceTypeList.map((transDeviceType) => {
                            return (
                              <option
                                key={transDeviceType.id}
                                value={transDeviceType.id}
                              >
                                {transDeviceType.name}
                              </option>
                            );
                          })}
                        </Field>
                      </div>
                      {/* <p className="col-span-full text-2xl text-blue-600">Vị trí</p> */}
                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Loại thiết bị Router
                        </label>
                        <Field
                          className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          as="select"
                          name="routerType.id"
                        >
                          {routerTypeList.map((routerType) => {
                            return (
                              <option key={routerType.id} value={routerType.id}>
                                {routerType.name}
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
              Cập nhật thông tin tuyến cáp
            </Typography>
            <Typography className="mt-1 font-normal text-gray-700">
              Cập nhật dữ liệu đảm bảo thực tế
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
              ...editFoLine,
            }}
            validationSchema={Yup.object({
              coreQuantity: Yup.number().required("Yêu cầu nhập số core"),
              finalDistance: Yup.number().required("Yêu cầu nhập chiều dài tuyến thực tế"),
              cost: Yup.number().required("Yêu cầu nhập đơn giá thuê"),
              nearSite: Yup.object({
                id: Yup.string().required("Yêu cầu nhập site ID"),
              }),
              farSite: Yup.object({
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
                          Số hợp đồng
                        </label>
                        <Field
                          name="foContract.contractNumber"                          
                          className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          disabled
                        ></Field>                       
                      </div>
                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Tên hợp đồng
                        </label>
                        <Field
                          name="foContract.contractName"                          
                          className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          disabled
                        ></Field>                       
                      </div>

                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Site A
                        </label>
                        <Select
                          placeholder="Site A"
                          defaultValue={simpleSiteList.find(
                            ({ id }) => id === values.nearSite.id
                          )}
                          value={
                            simpleSiteList
                              ? simpleSiteList.find((option) => {
                                  return option.id === getFieldProps("nearSite.id");
                                })
                              : ""
                          }
                          onChange={(selectedOption) => {
                            setFieldValue("nearSite.id", selectedOption.id);
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
                          name="nearSite.id"
                          getOptionLabel={(option) => option.siteId}
                          isLoading={false}
                          loadingMessage={() => "Đang lấy thông tin trạm..."}
                          noOptionsMessage={() => "Không có thông tin trạm"}
                        />
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="nearSite.siteId"
                          component="span"
                        ></ErrorMessage>
                      </div>
                      <div className="col-span-full flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Site B
                        </label>
                        <Select
                          placeholder="Site B"
                          defaultValue={simpleSiteList.find(
                            ({ id }) => id === values.farSite.id
                          )}
                          value={
                            simpleSiteList
                              ? simpleSiteList.find((option) => {
                                  return option.id === getFieldProps("site.id");
                                })
                              : ""
                          }
                          onChange={(selectedOption) => {
                            setFieldValue("farSite.id", selectedOption.id);
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
                          name="farSite.id"
                          getOptionLabel={(option) => option.siteId}
                          isLoading={false}
                          loadingMessage={() => "Đang lấy thông tin trạm..."}
                          noOptionsMessage={() => "Không có thông tin trạm"}
                        />
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="farSite.siteId"
                          component="span"
                        ></ErrorMessage>
                      </div>

                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Chiều dài thực tế tuyến FO (km)
                        </label>
                        <Field
                          name="finalDistance"
                          placeholder="Nhập chiều dài thực tế"
                          className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          type="number"
                        ></Field>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="finalDistance"
                          component="span"
                        ></ErrorMessage>
                      </div>
                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          Đơn giá thuê (VNĐ)
                        </label>
                        <Field
                          name="cost"
                          placeholder="Nhập đơn giá thuê chưa VAT"
                          className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                          type="number"
                        ></Field>
                        <ErrorMessage
                          className="justify-items-end text-sm font-light italic text-red-500"
                          name="cost"
                          component="span"
                        ></ErrorMessage>
                      </div>
                      
                      {/* <p className="col-span-full text-2xl text-blue-600">Vị trí</p> */}
                  
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
        <DialogHeader>Xác nhận xóa router khỏi cơ sở dữ liệu</DialogHeader>
        <DialogBody>
          Bạn muốn xóa thông tin trạm <span>{deleteRouterName}</span> ?
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
export default HiredFoList;
