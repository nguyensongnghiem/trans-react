import { useEffect, useMemo, useState } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  GlobeAsiaAustraliaIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/solid";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Select from "react-select";
import * as Yup from "yup";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as XLSX from "xlsx";
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
  Tooltip,
  Input,
  Chip,
  IconButton as MTIconButton,
} from "@material-tailwind/react";
import { CustomMenuList } from "./CustomList";
import { toast } from "react-toastify";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import CustomButton from "../components/CustomButton";
import StatusChip from "../components/StatusChip";

function OwnFoList() {
  const [simpleSiteList, setSimpleSiteList] = useState([]);
  const [ownFoList, setOwnFoList] = useState([]);
  const [fiberTypeList, setFiberTypeList] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editFoLine, setEditFoLine] = useState({});
  const [kmlFile, setKmlFile] = useState(null);
  const axiosInstance = useAxiosPrivate();

  // Filter and pagination states
  const [filters, setFilters] = useState({
    search: "",
    status: null,
    province: null,
    fiberType: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const filterOptions = useMemo(() => {
    const provinces = new Set();
    const fiberTypes = new Set();
    ownFoList.forEach((item) => {
      if (item.nearSite?.province?.name) {
        provinces.add(item.nearSite.province.name);
      }
      if (item.fiberType?.name) {
        fiberTypes.add(item.fiberType.name);
      }
    });
    return {
      provinces: Array.from(provinces)
        .sort()
        .map((p) => ({ value: p, label: p })),
      fiberTypes: Array.from(fiberTypes)
        .sort()
        .map((f) => ({ value: f, label: f })),
    };
  }, [ownFoList]);

  const filteredOwnFos = useMemo(() => {
    return ownFoList.filter((item) => {
      const matchStatus =
        !filters.status || item.active === filters.status.value;
      const matchProvince =
        !filters.province ||
        item.nearSite?.province?.name === filters.province.value;
      const matchFiberType =
        !filters.fiberType ||
        item.fiberType?.name === filters.fiberType.value;
      const matchSearch =
        !filters.search ||
        (item.nearSite?.siteId + " - " + item.farSite?.siteId)
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        item.note?.toLowerCase().includes(filters.search.toLowerCase());

      return (
        matchStatus &&
        matchSearch &&
        matchProvince &&
        matchFiberType
      );
    });
  }, [ownFoList, filters]);

  const totalPages = Math.ceil(filteredOwnFos.length / rowsPerPage);
  const paginatedOwnFos = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredOwnFos.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredOwnFos, currentPage, rowsPerPage]);

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: null,
      province: null,
      fiberType: null,
    });
  };

  const reloadOwnFoList = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get("own-fos");
      setOwnFoList(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadOwnFoList();
    const loadStaticData = async () => {
      try {
        const [sites, fiberTypes] = await Promise.all([
          axiosInstance.get("sites/simple-list"),
          axiosInstance.get("fiber-types"),
        ]);
        setSimpleSiteList(sites.data);
        setFiberTypeList(fiberTypes.data);
      } catch (e) {
        console.error(e);
      }
    };
    loadStaticData();
  }, []);

  const handleOpenCreate = () => setOpenCreate(!openCreate);
  const handleCreate = async (values) => {
    try {
      await axiosInstance.post("own-fos", values);
      toast.success("Đã thêm mới tuyến cáp thành công.");
      reloadOwnFoList();
      setOpenCreate(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleEdit = async (id) => {
    try {
      const res = await axiosInstance.get(`own-fos/${id}`);
      setEditFoLine(res.data);
      setKmlFile(null); // Reset file selection
      setOpenEdit(true);
    } catch (e) {
      toast.error("Không thể lấy thông tin tuyến cáp");
    }
  };

  const handleEditSubmit = async (values) => {
    try {
      // 1. Update text data
      await axiosInstance.put(`own-fos/${values.id}`, values);

      // 2. Upload KML if selected
      if (kmlFile) {
        const formData = new FormData();
        formData.append("file", kmlFile);
        await axiosInstance.post(`own-fos/${values.id}/kml`, formData);
      }

      toast.success("Đã cập nhật thành công");
      reloadOwnFoList();
      setOpenEdit(false);
    } catch (e) {
      toast.error("Lỗi cập nhật dữ liệu");
    }
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleDeleteSubmit = async () => {
    try {
      await axiosInstance.delete(`own-fos/${deleteId}`);
      toast.success("Đã xóa thành công");
      reloadOwnFoList();
    } catch (e) {
      toast.error("Lỗi khi xóa dữ liệu");
    } finally {
      setOpenDelete(false);
    }
  };

  const handleKmlDownload = async (fo) => {
    try {
      const response = await axiosInstance.get(`own-fos/${fo.id}/kml`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const contentDisposition = response.headers["content-disposition"];
      let filename = "map.kml";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length > 1) filename = filenameMatch[1];
      }
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      toast.error("Tuyến này chưa có file KML hoặc lỗi tải về");
    }
  };

  const onBtnExport = () => {
    const dataToExport = filteredOwnFos.map((item) => ({
      Tỉnh: item.nearSite?.province?.name,
      "Tên tuyến": `${item.nearSite?.siteId} - ${item.farSite?.siteId}`,
      "Khoảng cách (km)": item.finalDistance,
      "Số core": item.coreQuantity,
      "Loại cáp": item.fiberType?.name,
      "Trạng thái": item.active ? "Hoạt động" : "Không hoạt động",
      "Ghi chú": item.note,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "OwnFoLine");
    XLSX.writeFile(workbook, "OwnFoLine.xlsx");
  };

  const whiteSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "white",
      color: "black",
      borderColor: state.isFocused ? "#93c5fd" : "#d1d5db",
      "&:hover": { borderColor: "#93c5fd" },
      minHeight: "38px",
    }),
    menu: (base) => ({ ...base, zIndex: 9999 }),
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Danh sách Cáp quang tự đầu tư
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số: <span className="font-semibold text-blue-600">{filteredOwnFos.length}</span> / {ownFoList.length} tuyến
          </p>
        </div>
        <div className="flex gap-2">
          <CustomButton
            className="flex items-center gap-2 bg-[#0d47a1] hover:bg-[#0a3a82]"
            size="sm"
            onClick={handleOpenCreate}
          >
            <PlusIcon strokeWidth={2} className="h-4 w-4" /> Thêm mới
          </CustomButton>
          <CustomButton
            className="flex items-center gap-2 bg-[#1d6f42] hover:bg-[#155d36]"
            size="sm"
            onClick={onBtnExport}
          >
            <ArrowDownTrayIcon className="h-4 w-4" /> Xuất Excel
          </CustomButton>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Tỉnh</span>
            <Select
              isClearable
              placeholder="Tất cả tỉnh"
              className="text-sm"
              options={filterOptions.provinces}
              value={filters.province}
              onChange={(val) => setFilters((prev) => ({ ...prev, province: val }))}
              styles={whiteSelectStyles}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Loại cáp</span>
            <Select
              isClearable
              placeholder="Tất cả loại cáp"
              className="text-sm"
              options={filterOptions.fiberTypes}
              value={filters.fiberType}
              onChange={(val) => setFilters((prev) => ({ ...prev, fiberType: val }))}
              styles={whiteSelectStyles}
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
              onChange={(val) => setFilters((prev) => ({ ...prev, status: val }))}
              styles={whiteSelectStyles}
            />
          </div>
          <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">Tìm kiếm nhanh</span>
            <Input
              icon={<MagnifyingGlassIcon className="h-4 w-4" />}
              placeholder="Tên tuyến, Ghi chú..."
              className="rounded-lg text-sm"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>
        {(filters.search || filters.status || filters.province || filters.fiberType) && (
          <button
            onClick={handleResetFilters}
            className="mt-4 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
          >
            <ArrowPathIcon className="h-3 w-3" /> Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table */}
      <Card className="w-full overflow-hidden border border-gray-200 shadow-sm rounded-xl">
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full min-w-max table-auto text-left">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50/90 backdrop-blur-sm border-b border-gray-200">
                {["STT", "Tỉnh", "Tên tuyến", "Khoảng cách", "Số core", "Loại cáp", "Trạng thái", "Ghi chú", "KML", "Tác động"].map((head) => (
                  <th key={head} className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-bold">{head}</Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedOwnFos.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-4">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                  <td className="p-4">{item.nearSite?.province?.name}</td>
                  <td className="p-4 font-bold">{item.nearSite?.siteId} - {item.farSite?.siteId}</td>
                  <td className="p-4">{item.finalDistance} km</td>
                  <td className="p-4">{item.coreQuantity}</td>
                  <td className="p-4">{item.fiberType?.name}</td>
                  <td className="p-4">
                    <StatusChip active={item.active} />
                  </td>
                  <td className="p-4 max-w-xs truncate italic opacity-70">{item.note}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {item.kmlFileName && (
                        <Tooltip content="Download KML">
                          <IconButton variant="text" size="sm" color="green" onClick={() => handleKmlDownload(item)}>
                            <GlobeAsiaAustraliaIcon className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <IconButton variant="text" size="sm" onClick={() => handleEdit(item.id)}>
                        <PencilIcon className="h-4 w-4" />
                      </IconButton>
                      <IconButton variant="text" size="sm" color="red" onClick={() => handleDelete(item.id)}>
                        <TrashIcon className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white">
          <Typography variant="small">Trang <b>{currentPage}</b> / <b>{totalPages || 1}</b></Typography>
          <div className="flex gap-2">
            <MTIconButton variant="outlined" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
              <ChevronLeftIcon strokeWidth={2} className="h-4 w-4" />
            </MTIconButton>
            <MTIconButton variant="outlined" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(currentPage + 1)}>
              <ChevronRightIcon strokeWidth={2} className="h-4 w-4" />
            </MTIconButton>
          </div>
        </div>
      </Card>

      {/* Create Modal */}
      <Dialog open={openCreate} handler={handleOpenCreate} size="sm">
        <Formik
          initialValues={{ coreQuantity: 24, nearSite: { id: null }, farSite: { id: null }, designedDistance: 0, finalDistance: 0, fiberType: { id: 1 }, active: true, note: "" }}
          validationSchema={Yup.object({
            coreQuantity: Yup.number().required("Bắt buộc"),
            nearSite: Yup.object({ id: Yup.number().required("Bắt buộc") }),
            farSite: Yup.object({ id: Yup.number().required("Bắt buộc") }),
          })}
          onSubmit={handleCreate}
        >
          {({ setFieldValue, values }) => (
            <Form>
              <DialogHeader>Thêm mới tuyến cáp tự đầu tư</DialogHeader>
              <DialogBody className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold opacity-70">Site A</label>
                    <Select
                      options={simpleSiteList}
                      getOptionLabel={(o) => o.siteId}
                      getOptionValue={(o) => o.id}
                      onChange={(val) => setFieldValue("nearSite.id", val.id)}
                      components={{ MenuList: CustomMenuList }}
                      styles={whiteSelectStyles}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold opacity-70">Site B</label>
                    <Select
                      options={simpleSiteList}
                      getOptionLabel={(o) => o.siteId}
                      getOptionValue={(o) => o.id}
                      onChange={(val) => setFieldValue("farSite.id", val.id)}
                      components={{ MenuList: CustomMenuList }}
                      styles={whiteSelectStyles}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold opacity-70">Số core</label>
                    <Field name="coreQuantity" className="w-full border rounded p-2" type="number" />
                  </div>
                  <div>
                    <label className="text-sm font-bold opacity-70">Loại cáp</label>
                    <Field as="select" name="fiberType.id" className="w-full border rounded p-2 h-[42px]">
                      {fiberTypeList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Field>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold opacity-70">Chiều dài thực tế (km)</label>
                  <Field name="finalDistance" className="w-full border rounded p-2" type="number" step="0.01" />
                </div>
                <div>
                  <label className="text-sm font-bold opacity-70">Ghi chú</label>
                  <Field name="note" as="textarea" className="w-full border rounded p-2 h-20" />
                </div>
              </DialogBody>
              <DialogFooter>
                <Button variant="text" onClick={handleOpenCreate}>Hủy</Button>
                <CustomButton type="submit">Lưu</CustomButton>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </Dialog>

      {/* Edit Modal (similar to Create) */}
      <Dialog
        open={openEdit}
        handler={() => setOpenEdit(false)}
        className="overflow-hidden rounded-lg bg-white shadow-xl"
        size="sm"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <Typography
              variant="h5"
              color="blue-gray"
              className="font-semibold text-gray-900"
            >
              Cập nhật tuyến cáp
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Chỉnh sửa thông tin tuyến cáp quang
            </Typography>
          </div>
          <IconButton
            size="sm"
            variant="text"
            className="text-gray-500 hover:bg-gray-200 rounded-full"
            onClick={() => setOpenEdit(false)}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>

        <div className="max-h-[80vh] overflow-y-auto">
        <Formik
          enableReinitialize
          initialValues={editFoLine}
          onSubmit={handleEditSubmit}
        >
          {({ setFieldValue, values }) => (
            <Form className="flex flex-col">
              <DialogBody className="p-6">
                <div className="grid grid-cols-1 gap-5">
                  {/* Status Switch */}
                  <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                    <div>
                      <Typography variant="small" color="blue-gray" className="font-bold">
                        Trạng thái hoạt động
                      </Typography>
                      <Typography variant="small" className="text-gray-500 text-xs font-normal">
                        Bật/tắt trạng thái tuyến cáp
                      </Typography>
                    </div>
                    <Switch
                      color="green"
                      checked={values.active}
                      onChange={(e) => setFieldValue("active", e.target.checked)}
                      className="scale-90"
                      circleProps={{ className: "border-none" }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Site A</Typography>
                      <Select
                        options={simpleSiteList}
                        value={simpleSiteList.find(o => o.id === values.nearSite?.id)}
                        getOptionLabel={(o) => o.siteId}
                        getOptionValue={(o) => o.id}
                        onChange={(val) => setFieldValue("nearSite.id", val.id)}
                        components={{ MenuList: CustomMenuList }}
                        styles={whiteSelectStyles}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Site B</Typography>
                      <Select
                        options={simpleSiteList}
                        value={simpleSiteList.find(o => o.id === values.farSite?.id)}
                        getOptionLabel={(o) => o.siteId}
                        getOptionValue={(o) => o.id}
                        onChange={(val) => setFieldValue("farSite.id", val.id)}
                        components={{ MenuList: CustomMenuList }}
                        styles={whiteSelectStyles}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Số core</Typography>
                      <Field name="coreQuantity" className="w-full border rounded p-2 text-sm" type="number" />
                    </div>
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Loại cáp</Typography>
                      <Field as="select" name="fiberType.id" className="w-full border rounded p-2 h-[38px] text-sm bg-white">
                        {fiberTypeList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </Field>
                    </div>
                  </div>

                  <div>
                    <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Chiều dài thực tế (km)</Typography>
                    <Field name="finalDistance" className="w-full border rounded p-2 text-sm" type="number" step="0.01" />
                  </div>

                  {/* KML Upload Section */}
                  <div className="rounded-lg border border-gray-200 p-3 bg-gray-50/50">
                    <Typography variant="small" color="blue-gray" className="mb-2 font-bold flex items-center gap-2">
                      <GlobeAsiaAustraliaIcon className="h-4 w-4 text-blue-500" /> File bản đồ (KML/KMZ)
                    </Typography>

                    {values.kmlFileName && (
                      <div className="mb-3 flex items-center justify-between bg-white p-2 rounded border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <CloudArrowUpIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-xs font-medium text-blue-gray-700 truncate" title={values.kmlFileName}>
                            {values.kmlFileName}
                          </span>
                        </div>
                        <Tooltip content="Tải về">
                          <IconButton size="sm" variant="text" color="blue" onClick={() => handleKmlDownload(values)}>
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    )}

                    <div className="relative">
                      <input
                        type="file"
                        accept=".kml,.kmz"
                        className="block w-full text-xs text-slate-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-full file:border-0
                                  file:text-xs file:font-semibold
                                  file:bg-blue-50 file:text-blue-700
                                  hover:file:bg-blue-100
                                  cursor-pointer"
                        onChange={(e) => setKmlFile(e.target.files[0])}
                      />
                      {kmlFile && (
                        <div className="mt-2 flex items-center gap-2">
                          <Chip size="sm" variant="ghost" value="Mới" color="green" className="rounded-full px-2 py-0.5 text-[10px]" />
                          <span className="text-xs text-green-700 font-medium truncate">{kmlFile.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Typography variant="small" color="blue-gray" className="mb-1 font-bold">Ghi chú</Typography>
                    <Field name="note" as="textarea" className="w-full border rounded p-2 h-20 text-sm resize-none" placeholder="Nhập ghi chú..." />
                  </div>
                </div>
              </DialogBody>
              <DialogFooter className="border-t border-gray-100 bg-gray-50 px-4 py-3 gap-2">
                <Button variant="text" color="blue-gray" onClick={() => setOpenEdit(false)} size="sm">
                  Hủy bỏ
                </Button>
                <CustomButton type="submit" size="sm" className="flex items-center gap-2">
                  <PencilIcon className="h-4 w-4" /> Cập nhật
                </CustomButton>
              </DialogFooter>
            </Form>
          )}
        </Formik>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={openDelete} handler={() => setOpenDelete(false)} size="xs">
        <DialogHeader className="flex flex-col items-center gap-2">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
          <Typography variant="h5">Xác nhận xóa</Typography>
        </DialogHeader>
        <DialogBody className="text-center">
          Bạn có chắc chắn muốn xóa tuyến cáp này? Hành động này không thể hoàn tác.
        </DialogBody>
        <DialogFooter className="flex justify-center gap-3">
          <Button variant="text" onClick={() => setOpenDelete(false)}>Hủy</Button>
          <Button color="red" onClick={handleDeleteSubmit}>Xóa</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default OwnFoList;
