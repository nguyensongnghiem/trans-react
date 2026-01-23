import { useEffect, useMemo, useState, useRef } from "react";
import {
  DocumentIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/solid";
import Select from "react-select";
import * as Yup from "yup";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { MagnifyingGlassIcon, FunnelIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { Input } from "@material-tailwind/react";

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
import useSimpleSites from "../hooks/useSimpleSites";
import useRouters from "../hooks/useRouters"; // Import your custom hook for routers
import CustomButton from "../components/CustomButton";
import StatusChip from "../components/StatusChip";
function RouterList() {
  // const navigate = useNavigate();
  const gridRef = useRef();
  const [routerTypeList, setRouterTypeList] = useState([]);
  const [transmissionDeviceTypeList, setTransmissionDeviceTypeList] = useState(
    [],
  );
  const [deleteId, setDeleteId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editRouter, setEditRouter] = useState({});
  const [editId, setEditId] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [transmissionOwners, setTransmissionOwners] = useState([]);
  const [filters, setFilters] = useState({
    province: null,
    routerType: null,
    transDeviceType: null,
    transmissionOwner: null,
    search: "",
  });
  const axiosInstance = useAxiosPrivate();
  const [colDefs, setColDefs] = useState([
    { headerName: "Tỉnh", valueGetter: (p) => p.data.site.province?.name },
    { headerName: "Site ID", valueGetter: (p) => p.data.site.siteId },
    {
      headerName: "Tên thiết bị",
      valueGetter: (p) => p.data.name,
    },
    { headerName: "Loại Router", valueGetter: (p) => p.data.routerType?.name },
    {
      headerName: "Loại thiết bị TD",
      valueGetter: (p) => p.data.transmissionDeviceType?.name,
    },
    {
      headerName: "IP quản lý",
      valueGetter: (p) => p.data.ip,
    },
    { headerName: "Ghi chú", valueGetter: (p) => p.data.note },
    {
      headerName: "Trạng thái",
      valueGetter: (p) => p.data.active,
      cellRenderer: (p) => {
        return (
          <div className="flex items-center justify-center h-full">
            <StatusChip 
              active={p.data.active} 
              labelOn="Hoạt động" 
              labelOff="Không hoạt động" 
            />
          </div>
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
            onClick={() => handleDeleteRouter(p.data.id)}
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
  const {
    simpleSites: simpleSiteList,
    setSimpleSites: setSimpleSiteList,
    isLoading: isSimpleSitesLoading,
  } = useSimpleSites();
  const {
    routers: routerList,
    setRouters: setRouterList,
    isLoadding: isRoutersLoading,
    createRouter,
    updateRouter,
    deleteRouter,
    fetchRouters,
  } = useRouters();

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
        const transDeviceTypeList = await axiosInstance.get(
          "transmission-device-types",
        );
        setTransmissionDeviceTypeList(transDeviceTypeList.data);
      } catch (error) {
        console.log(error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [provRes, ownerRes] = await Promise.all([
          axiosInstance.get("provinces"),
          axiosInstance.get("transmissionOwners"),
        ]);
        setProvinces(provRes.data);
        setTransmissionOwners(ownerRes.data);
      } catch (error) {
        console.error("Error fetching filter metadata:", error);
      }
    };
    fetchMetadata();
  }, []);

  const filteredRouters = useMemo(() => {
    return routerList.filter((router) => {
      const matchProvince = !filters.province || router.site?.province?.id === filters.province.id;
      const matchRouterType = !filters.routerType || router.routerType?.id === filters.routerType.id;
      const matchTransDeviceType = !filters.transDeviceType || router.transmissionDeviceType?.id === filters.transDeviceType.id;
      const matchTransmissionOwner = !filters.transmissionOwner || router.site?.transmissionOwner?.id === filters.transmissionOwner.id;
      const matchSearch = !filters.search || 
        (router.name?.toLowerCase().includes(filters.search.toLowerCase())) ||
        (router.ip?.toLowerCase().includes(filters.search.toLowerCase())) ||
        (router.site?.siteId?.toLowerCase().includes(filters.search.toLowerCase()));

      return matchProvince && matchRouterType && matchTransDeviceType && matchTransmissionOwner && matchSearch;
    });
  }, [routerList, filters]);

  const getRouterById = async (editId) => {
    try {
      const router = await axiosInstance.get(`routers/${editId}`);
      setEditRouter({ ...router.data });
    } catch (error) {
      console.log(error);
    }
  };

  // Xử lý thêm mới
  const handleOpenCreate = () => {
    setOpenCreate(!openCreate);
  };

  // Tạo mới Router
  const handleCreate = async (router) => {
    console.log(router);
    await createRouter(router);
    setOpenCreate(!openCreate);
  };
  // Xử lý Edit

  const handleEdit = async (editId) => {
    await getRouterById(editId);
    handleOpenEdit();
  };

  const handleOpenEdit = () => {
    setOpenEdit(!openEdit);
  };

  const handleEditSubmit = async (router) => {
    console.log(router);
    await updateRouter(router.id, router);
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
    await deleteRouter(deleteId);
    setDeleteId(null);
    setOpenDelete(!openDelete);
  };

  let deleteRouterName;
  if (deleteId != null) {
    deleteRouterName = routerList.find((router) => router.id === deleteId).name;
    console.log(deleteRouterName);
  }

  // if (isLoading) return <Spinner />;
  const onBtnExport = () => {
    const columnDefs = gridRef.current.api.getColumnDefs();
    const rowData = [];
    gridRef.current.api.forEachNode((node) => rowData.push(node.data));

    const dataToExport = rowData.map((node) => {
      const row = {};
      columnDefs.forEach((colDef) => {
        if (colDef.headerName && colDef.valueGetter) {
          let value = colDef.valueGetter({ data: node });
          if (colDef.valueFormatter) {
            value = colDef.valueFormatter({ value: value });
          }
          row[colDef.headerName] = value;
        }
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Routers");
    XLSX.writeFile(workbook, "RouterList.xlsx");
  };

  const handleResetFilters = () => {
    setFilters({
      province: null,
      routerType: null,
      transDeviceType: null,
      transmissionOwner: null,
      search: "",
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Danh sách thiết bị</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số: <span className="font-semibold text-blue-600">{filteredRouters.length}</span> / {routerList.length} thiết bị
          </p>
        </div>
        <div className="flex gap-2">
          <CustomButton
            className="flex items-center gap-2"
            size="sm"
            onClick={handleOpenCreate}
          >
            <PlusIcon className="h-4 w-4" />
            Thêm mới
          </CustomButton>
          <CustomButton
            className="flex items-center gap-2"
            size="sm"
            color="blue-gray"
            onClick={onBtnExport}
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Xuất Excel
          </CustomButton>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm mb-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4 text-blue-gray-700">
          <FunnelIcon className="h-5 w-5" />
          <span className="font-bold text-sm uppercase tracking-wider">Bộ lọc tìm kiếm</span>
          {(filters.province || filters.routerType || filters.transDeviceType || filters.transmissionOwner || filters.search) && (
            <button 
              onClick={handleResetFilters}
              className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
            >
              <ArrowPathIcon className="h-3 w-3" />
              Xóa bộ lọc
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Tỉnh</span>
            <Select
              isClearable
              placeholder="Tất cả tỉnh"
              className="text-sm"
              options={provinces}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.province}
              onChange={(val) => setFilters(prev => ({ ...prev, province: val }))}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '40px',
                  borderRadius: '8px',
                  borderColor: '#e2e8f0',
                })
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Loại Router</span>
            <Select
              isClearable
              placeholder="Tất cả loại"
              className="text-sm"
              options={routerTypeList}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.routerType}
              onChange={(val) => setFilters(prev => ({ ...prev, routerType: val }))}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '40px',
                  borderRadius: '8px',
                  borderColor: '#e2e8f0',
                })
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Thiết bị TD</span>
            <Select
              isClearable
              placeholder="Tất cả thiết bị"
              className="text-sm"
              options={transmissionDeviceTypeList}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.transDeviceType}
              onChange={(val) => setFilters(prev => ({ ...prev, transDeviceType: val }))}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '40px',
                  borderRadius: '8px',
                  borderColor: '#e2e8f0',
                })
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Nhà cung cấp</span>
            <Select
              isClearable
              placeholder="Tất cả nhà CC"
              className="text-sm"
              options={transmissionOwners}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.transmissionOwner}
              onChange={(val) => setFilters(prev => ({ ...prev, transmissionOwner: val }))}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '40px',
                  borderRadius: '8px',
                  borderColor: '#e2e8f0',
                })
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Tìm kiếm nhanh</span>
            <Input
              icon={<MagnifyingGlassIcon className="h-4 w-4" />}
              placeholder="Site ID, Tên, IP..."
              className="!border-t-blue-gray-200 focus:!border-blue-500 rounded-lg"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              containerProps={{
                className: "min-w-0"
              }}
            />
          </div>
        </div>
      </div>
      <div
        className="ag-theme-quartz" // applying the Data Grid theme
        style={{ height: "100vh", width: "100%" }} // the Data Grid will fill the size of the parent container
      >
        <AgGridReact
          ref={gridRef}
          rowData={filteredRouters}
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
                  <CustomButton size="sm" type="submit" color="blue">
                    Thêm mới
                  </CustomButton>
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
              Cập nhật thông tin thiết bị
            </Typography>
            <Typography className="mt-1 font-normal text-gray-700">
              Cập nhật dữ liệu thiết bị đảm bảo thực tế
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
              ...editRouter,
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
                          defaultValue={simpleSiteList.find(
                            ({ id }) => id === values.site.id,
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
                      <div className="col-span-full flex flex-col items-stretch gap-2">
                        <label className="text-slate-400 font-semibold">
                          IP quản lý
                        </label>
                        <Field
                          name="ip"
                          placeholder="Nhập IP quản lý"
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
                  <CustomButton size="sm" type="submit" color="blue">
                    Cập nhật dữ liệu
                  </CustomButton>
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
          <CustomButton
            variant="text"
            color="gray"
            onClick={handleOpenDelete}
            className="mr-1"
          >
            <span>Hủy</span>
          </CustomButton>
          <CustomButton
            variant="filled"
            color="red"
            onClick={handleDeleteSubmit}
          >
            <span>Xóa</span>
          </CustomButton>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
export default RouterList;
