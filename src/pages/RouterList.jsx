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
  }, [filteredRouters, currentPage]);

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
