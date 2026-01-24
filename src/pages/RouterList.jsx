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
import { MagnifyingGlassIcon, FunnelIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Input, IconButton as MTIconButton } from "@material-tailwind/react";

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
import FormSelect from "../components/FormSelect";
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
  const [filters, setFilters] = useState({
    province: null,
    vendor: null,
    routerType: null,
    transDeviceType: null,
    status: null,
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const axiosInstance = useAxiosPrivate();
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


  // Linked Filter Logic: Derive options from current filtered result (ignoring own filter)
  const filterOptions = useMemo(() => {
    const getUnique = (arr, keyPath) => {
      const seen = new Set();
      return arr.reduce((acc, item) => {
        const val = keyPath.split('.').reduce((o, i) => o?.[i], item);
        if (val && !seen.has(val.id)) {
          seen.add(val.id);
          acc.push(val);
        }
        return acc;
      }, []).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    };

    // Helper to filter routers by all filters EXCEPT specialized ones
    const getFilteredFor = (excludeKey) => {
      return routerList.filter(r => {
        if (excludeKey !== 'province' && filters.province && r.site?.province?.id !== filters.province.id) return false;
        if (excludeKey !== 'vendor' && filters.vendor && r.routerType?.vendor?.id !== filters.vendor.id) return false;
        if (excludeKey !== 'routerType' && filters.routerType && r.routerType?.id !== filters.routerType.id) return false;
        if (excludeKey !== 'transDeviceType' && filters.transDeviceType && r.transmissionDeviceType?.id !== filters.transDeviceType.id) return false;
        if (excludeKey !== 'status' && filters.status && r.active !== filters.status.value) return false;
        if (excludeKey !== 'search' && filters.search) {
          const search = filters.search.toLowerCase();
          return (r.name?.toLowerCase().includes(search)) ||
                 (r.ip?.toLowerCase().includes(search)) ||
                 (r.site?.siteId?.toLowerCase().includes(search)) ||
                 (r.note?.toLowerCase().includes(search));
        }
        return true;
      });
    };

    return {
      provinces: getUnique(getFilteredFor('province'), 'site.province'),
      vendors: getUnique(getFilteredFor('vendor'), 'routerType.vendor'),
      routerTypes: getUnique(getFilteredFor('routerType'), 'routerType'),
      transDeviceTypes: getUnique(getFilteredFor('transDeviceType'), 'transmissionDeviceType'),
    };
  }, [routerList, filters]);

  const filteredRouters = useMemo(() => {
    return routerList.filter((router) => {
      const matchProvince = !filters.province || router.site?.province?.id === filters.province.id;
      const matchVendor = !filters.vendor || router.routerType?.vendor?.id === filters.vendor.id;
      const matchRouterType = !filters.routerType || router.routerType?.id === filters.routerType.id;
      const matchTransDeviceType = !filters.transDeviceType || router.transmissionDeviceType?.id === filters.transDeviceType.id;
      const matchStatus = !filters.status || router.active === filters.status.value;
      const matchSearch = !filters.search || 
        (router.name?.toLowerCase().includes(filters.search.toLowerCase())) ||
        (router.ip?.toLowerCase().includes(filters.search.toLowerCase())) ||
        (router.site?.siteId?.toLowerCase().includes(filters.search.toLowerCase())) ||
        (router.note?.toLowerCase().includes(filters.search.toLowerCase()));

      return matchProvince && matchVendor && matchRouterType && matchTransDeviceType && matchStatus && matchSearch;
    });
  }, [routerList, filters]);

  const totalPages = Math.ceil(filteredRouters.length / rowsPerPage);
  const paginatedRouters = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredRouters.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredRouters, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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
    const dataToExport = filteredRouters.map((router) => ({
      "Tỉnh": router.site?.province?.name,
      "Site ID": router.site?.siteId,
      "Tên thiết bị": router.name,
      "Loại Router": router.routerType?.name,
      "Loại thiết bị TD": router.transmissionDeviceType?.name,
      "IP quản lý": router.ip,
      "Nhà sản xuất": router.routerType?.vendor?.name,
      "Trạng thái": router.active ? "Hoạt động" : "Không hoạt động",
      "Ghi chú": router.note,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Routers");
    XLSX.writeFile(workbook, "RouterList.xlsx");
  };

  const handleResetFilters = () => {
    setFilters({
      province: null,
      vendor: null,
      routerType: null,
      transDeviceType: null,
      status: null,
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
            className="flex items-center gap-2 bg-[#0d47a1] hover:bg-[#0a3a82]"
            size="sm"
            onClick={handleOpenCreate}
          >
            <PlusIcon className="h-4 w-4" />
            Thêm mới
          </CustomButton>
          <CustomButton
            className="flex items-center gap-2 bg-[#1d6f42] hover:bg-[#155d36]"
            size="sm"
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
          {(filters.province || filters.vendor || filters.routerType || filters.transDeviceType || filters.status || filters.search) && (
            <button 
              onClick={handleResetFilters}
              className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
            >
              <ArrowPathIcon className="h-3 w-3" />
              Xóa bộ lọc
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Tỉnh</span>
            <Select
              isClearable
              placeholder="Tất cả tỉnh"
              className="text-sm"
              options={filterOptions.provinces}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.province}
              onChange={(val) => setFilters(prev => ({ ...prev, province: val }))}
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '40px',
                  borderRadius: '8px',
                  borderColor: '#e2e8f0',
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 })
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Nhà sản xuất</span>
            <Select
              isClearable
              placeholder="Tất cả hãng"
              className="text-sm"
              options={filterOptions.vendors}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.vendor}
              onChange={(val) => setFilters(prev => ({ ...prev, vendor: val }))}
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '40px',
                  borderRadius: '8px',
                  borderColor: '#e2e8f0',
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 })
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Loại Router</span>
            <Select
              isClearable
              placeholder="Tất cả loại"
              className="text-sm"
              options={filterOptions.routerTypes}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.routerType}
              onChange={(val) => setFilters(prev => ({ ...prev, routerType: val }))}
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '40px',
                  borderRadius: '8px',
                  borderColor: '#e2e8f0',
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 })
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Thiết bị TD</span>
            <Select
              isClearable
              placeholder="Tất cả thiết bị"
              className="text-sm"
              options={filterOptions.transDeviceTypes}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.transDeviceType}
              onChange={(val) => setFilters(prev => ({ ...prev, transDeviceType: val }))}
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '40px',
                  borderRadius: '8px',
                  borderColor: '#e2e8f0',
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 })
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Trạng thái</span>
            <Select
              isClearable
              placeholder="Tất cả trạng thái"
              className="text-sm"
              options={[
                { label: "Hoạt động", value: true },
                { label: "Không hoạt động", value: false },
              ]}
              value={filters.status}
              onChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '40px',
                  borderRadius: '8px',
                  borderColor: '#e2e8f0',
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 })
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Tìm kiếm nhanh</span>
            <Input
              icon={<MagnifyingGlassIcon className="h-4 w-4" />}
              placeholder="Site ID, Tên, IP..."
              className="!border-t-blue-gray-200 focus:!border-blue-500 rounded-lg text-sm"
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
      <Card className="w-full overflow-hidden border border-gray-200 shadow-sm rounded-xl">
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full min-w-max table-auto text-left">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50/90 backdrop-blur-sm border-b border-gray-200">
                <th className="p-4">
                  <Typography variant="small" color="blue-gray" className="font-bold leading-none">Tỉnh</Typography>
                </th>
                <th className="p-4">
                  <Typography variant="small" color="blue-gray" className="font-bold leading-none">Site ID</Typography>
                </th>
                <th className="p-4">
                  <Typography variant="small" color="blue-gray" className="font-bold leading-none">Tên thiết bị</Typography>
                </th>
                <th className="p-4">
                  <Typography variant="small" color="blue-gray" className="font-bold leading-none">Loại Router</Typography>
                </th>
                <th className="p-4">
                  <Typography variant="small" color="blue-gray" className="font-bold leading-none">Nhà sản xuất</Typography>
                </th>
                <th className="p-4">
                  <Typography variant="small" color="blue-gray" className="font-bold leading-none">Loại thiết bị TD</Typography>
                </th>
                <th className="p-4">
                  <Typography variant="small" color="blue-gray" className="font-bold leading-none">IP quản lý</Typography>
                </th>
                <th className="p-4">
                  <Typography variant="small" color="blue-gray" className="font-bold leading-none">Ghi chú</Typography>
                </th>
                <th className="p-4 text-center">
                  <Typography variant="small" color="blue-gray" className="font-bold leading-none">Trạng thái</Typography>
                </th>
                <th className="p-4 text-center">
                  <Typography variant="small" color="blue-gray" className="font-bold leading-none">Tác động</Typography>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRouters.map((router) => (
                <tr key={router.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal">{router.site?.province?.name}</Typography>
                  </td>
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-bold">{router.site?.siteId}</Typography>
                  </td>
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-medium">{router.name}</Typography>
                  </td>
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal">{router.routerType?.name}</Typography>
                  </td>
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal">{router.routerType?.vendor?.name || "-"}</Typography>
                  </td>
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal">{router.transmissionDeviceType?.name}</Typography>
                  </td>
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal font-mono text-xs">{router.ip}</Typography>
                  </td>
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal opacity-70 italic max-w-[200px] truncate">{router.note || "-"}</Typography>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      <StatusChip 
                        active={router.active} 
                        labelOn="Hoạt động" 
                        labelOff="Không hoạt động" 
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1">
                      <IconButton
                        variant="text"
                        size="sm"
                        color="blue"
                        onClick={() => handleEdit(router.id)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        variant="text"
                        size="sm"
                        color="red"
                        onClick={() => handleDeleteRouter(router.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRouters.length === 0 && (
            <div className="py-20 text-center">
              <Typography variant="h6" color="blue-gray" className="opacity-40">Không tìm thấy thiết bị nào khớp với bộ lọc</Typography>
            </div>
          )}
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <Typography variant="small" color="blue-gray" className="font-normal">
              Trang <span className="font-bold">{currentPage}</span> / <span className="font-bold">{totalPages || 1}</span>
            </Typography>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
              <span className="text-xs text-blue-gray-400 font-medium">Hiển thị:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs border border-gray-300 rounded px-1 py-0.5 outline-none focus:border-blue-500 transition-colors"
              >
                {[5, 10, 15, 20, 50, 100].map(val => (
                  <option key={val} value={val}>{val} dòng</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <MTIconButton
              variant="outlined"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="rounded-md border-gray-300"
            >
              <ChevronLeftIcon strokeWidth={2} className="h-4 w-4" />
            </MTIconButton>
            <MTIconButton
              variant="outlined"
              size="sm"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="rounded-md border-gray-300"
            >
              <ChevronRightIcon strokeWidth={2} className="h-4 w-4" />
            </MTIconButton>
          </div>
        </div>
      </Card>

      {/* Modal Thêm mới */}
      <Dialog
        open={openCreate}
        handler={handleOpenCreate}
        className="overflow-hidden rounded-lg bg-white shadow-xl"
        size="sm"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <Typography variant="h5" color="blue-gray" className="font-semibold text-gray-900">
              Thêm mới thiết bị
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Nhập các thông tin chi tiết cho router mới
            </Typography>
          </div>
          <IconButton
            size="sm"
            variant="text"
            className="text-gray-500 hover:bg-gray-200 rounded-full"
            onClick={handleOpenCreate}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>

        <div className="max-h-[80vh] overflow-y-auto">
          <Formik
            onSubmit={handleCreate}
            initialValues={{
              name: "",
              site: { id: "" },
              ip: "",
              transmissionDeviceType: { id: 1 },
              routerType: { id: 1 },
              active: true, // Default to active
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
              <Form className="flex flex-col">
                <DialogBody className="p-6">
                  <div className="grid grid-cols-1 gap-5">
                    
                    {/* Trạng thái Switch */}
                    <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                      <div>
                        <Typography variant="small" color="blue-gray" className="font-bold">
                          Trạng thái hoạt động
                        </Typography>
                        <Typography variant="small" className="text-gray-500 text-xs font-normal">
                          Bật/tắt để thiết lập trạng thái ban đầu
                        </Typography>
                      </div>
                      <Switch
                        name="active"
                        color="green"
                        checked={values.active}
                        onChange={({ target }) => setFieldValue("active", target.checked)}
                        className="scale-90"
                        circleProps={{
                          className: "border-none",
                        }}
                      />
                    </div>
                    
                    {/* Tên thiết bị */}
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">
                        Tên thiết bị <span className="text-red-500">*</span>
                      </Typography>
                      <Field
                        name="name"
                        placeholder="VD: R_HNI_001"
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                      />
                      <ErrorMessage
                        name="name"
                        component="div"
                        className="mt-1 text-xs text-red-600 font-medium"
                      />
                    </div>

                    {/* Site ID */}
                    <FormSelect
                      label="Site ID"
                      name="site.id"
                      placeholder="Chọn Site ID..."
                      options={simpleSiteList || []}
                      getOptionLabel={(option) => option.siteId}
                      required
                    />

                    {/* IP Quản lý */}
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">
                        IP quản lý <span className="text-red-500">*</span>
                      </Typography>
                      <Field
                        name="ip"
                        placeholder="VD: 192.168.1.1"
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all font-mono"
                      />
                      <ErrorMessage
                        name="ip"
                        component="div"
                        className="mt-1 text-xs text-red-600 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormSelect
                        label="Loại thiết bị TD"
                        name="transmissionDeviceType.id"
                        options={transmissionDeviceTypeList || []}
                        getOptionLabel={(option) => option.name}
                        useVirtualization={false}
                      />
                      <FormSelect
                        label="Loại Router"
                        name="routerType.id"
                        options={routerTypeList || []}
                        getOptionLabel={(option) => option.name}
                        useVirtualization={false}
                      />
                    </div>

                    {/* Ghi chú */}
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">
                        Ghi chú
                      </Typography>
                      <Field
                        as="textarea"
                        name="note"
                        rows={3}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all resize-none"
                        placeholder="Nhập ghi chú thêm..."
                      />
                    </div>
                  </div>
                </DialogBody>
                
                <DialogFooter className="border-t border-gray-100 bg-gray-50 px-4 py-3 gap-2">
                  <CustomButton 
                    variant="text" 
                    color="blue-gray" 
                    onClick={handleOpenCreate}
                    size="sm"
                  >
                    Hủy bỏ
                  </CustomButton>
                  <CustomButton 
                    type="submit" 
                    className="bg-[#0d47a1] hover:bg-[#0a3a82]"
                    size="sm"
                  >
                    <div className="flex items-center gap-2">
                      <PlusIcon className="h-4 w-4" />
                      <span>Thêm mới</span>
                    </div>
                  </CustomButton>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </div>
      </Dialog>

      {/* Modal Sửa thông tin */}
      <Dialog
        open={openEdit}
        handler={handleOpenEdit}
        className="overflow-hidden rounded-lg bg-white shadow-xl"
        size="sm"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <Typography variant="h5" color="blue-gray" className="font-semibold text-gray-900">
              Cập nhật thiết bị
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Chỉnh sửa thông tin thiết bị
            </Typography>
          </div>
          <IconButton
            size="sm"
            variant="text"
            className="text-gray-500 hover:bg-gray-200 rounded-full"
            onClick={handleOpenEdit}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>

        <div className="max-h-[80vh] overflow-y-auto">
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
              <Form className="flex flex-col">
                <DialogBody className="p-6">
                  <div className="grid grid-cols-1 gap-5">
                    
                    {/* Trạng thái Switch */}
                    <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                      <div>
                        <Typography variant="small" color="blue-gray" className="font-bold">
                          Trạng thái hoạt động
                        </Typography>
                        <Typography variant="small" className="text-gray-500 text-xs font-normal">
                          Bật/tắt để thay đổi trạng thái thiết bị
                        </Typography>
                      </div>
                      <Switch
                        name="active"
                        color="green"
                        checked={values.active}
                        onChange={({ target }) => setFieldValue("active", target.checked)}
                        className="scale-90"
                        circleProps={{
                          className: "border-none",
                        }}
                      />
                    </div>

                    {/* Tên thiết bị */}
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">
                        Tên thiết bị <span className="text-red-500">*</span>
                      </Typography>
                      <Field
                        name="name"
                        placeholder="VD: R_HNI_001"
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                      />
                      <ErrorMessage
                        name="name"
                        component="div"
                        className="mt-1 text-xs text-red-600 font-medium"
                      />
                    </div>

                    {/* Site ID */}
                    <FormSelect
                      label="Site ID"
                      name="site.id"
                      placeholder="Chọn Site ID..."
                      options={simpleSiteList || []}
                      getOptionLabel={(option) => option.siteId}
                      required
                    />

                    {/* IP Quản lý */}
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">
                        IP quản lý <span className="text-red-500">*</span>
                      </Typography>
                      <Field
                        name="ip"
                        placeholder="VD: 192.168.1.1"
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all font-mono"
                      />
                      <ErrorMessage
                        name="ip"
                        component="div"
                        className="mt-1 text-xs text-red-600 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormSelect
                        label="Loại thiết bị TD"
                        name="transmissionDeviceType.id"
                        options={transmissionDeviceTypeList || []}
                        getOptionLabel={(option) => option.name}
                        useVirtualization={false}
                      />
                      <FormSelect
                        label="Loại Router"
                        name="routerType.id"
                        options={routerTypeList || []}
                        getOptionLabel={(option) => option.name}
                        useVirtualization={false}
                      />
                    </div>

                    {/* Ghi chú */}
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">
                        Ghi chú
                      </Typography>
                      <Field
                        as="textarea"
                        name="note"
                        rows={3}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all resize-none"
                        placeholder="Nhập ghi chú thêm..."
                      />
                    </div>
                  </div>
                </DialogBody>
                
                <DialogFooter className="border-t border-gray-100 bg-gray-50 px-4 py-3 gap-2">
                  <CustomButton 
                    variant="text" 
                    color="blue-gray" 
                    onClick={handleOpenEdit}
                    size="sm"
                  >
                    Hủy bỏ
                  </CustomButton>
                  <CustomButton 
                    type="submit" 
                    className="bg-[#0d47a1] hover:bg-[#0a3a82]"
                    size="sm"
                  >
                    <div className="flex items-center gap-2">
                      <PencilIcon className="h-4 w-4" />
                      <span>Cập nhật</span>
                    </div>
                  </CustomButton>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </div>
      </Dialog>

      {/*Modal confirm xóa site*/}
      <Dialog 
        open={openDelete} 
        handler={handleOpenDelete} 
        size="xs"
        className="rounded-lg overflow-hidden shadow-xl"
      >
        <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-full">
            <TrashIcon className="h-5 w-5 text-red-600" />
          </div>
          <Typography variant="h5" color="red" className="font-semibold">
            Xác nhận xóa
          </Typography>
        </div>
        
        <DialogBody className="p-6 text-blue-gray-700">
          <Typography variant="paragraph" color="blue-gray" className="font-medium">
            Bạn có chắc chắn muốn xóa thiết bị <span className="font-bold text-gray-900">{deleteRouterName}</span>? 
          </Typography>
          <Typography variant="small" color="gray" className="mt-3 italic">
            Hành động này không thể hoàn tác và dữ liệu sẽ bị xóa vĩnh viễn khỏi hệ thống.
          </Typography>
        </DialogBody>
        
        <DialogFooter className="bg-gray-50/50 px-4 py-3 gap-2 border-t border-gray-200">
          <CustomButton
            variant="text"
            color="blue-gray"
            onClick={handleOpenDelete}
            size="sm"
          >
            Hủy bỏ
          </CustomButton>
          <CustomButton
            variant="filled"
            color="red"
            onClick={handleDeleteSubmit}
            size="sm"
            className="flex items-center gap-2 shadow-md shadow-red-500/20"
          >
            <TrashIcon className="h-4 w-4" />
            <span>Xác nhận xóa</span>
          </CustomButton>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
export default RouterList;
