import { useEffect, useMemo, useState, useRef } from "react";
import {
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
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Card,
  Dialog,
  IconButton,
  Typography,
  DialogBody,
  DialogHeader,
  DialogFooter,
  Input,
  IconButton as MTIconButton,
  Switch,
} from "@material-tailwind/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import OwnerChip from "../components/OwnerChip";
import CustomButton from "../components/CustomButton";
import FormSelect from "../components/FormSelect";

function SiteList2() {
  const navigate = useNavigate();
  const [siteListFull, setSiteListFull] = useState([]);
  const [transmissionOwnerList, setTransmissionOwnerList] = useState([]);
  const [siteTransmissionTypeList, setSiteTransmissionTypeList] = useState([]);
  const [siteOwnerList, setSiteOwnerList] = useState([]);
  const [provinces, setProvinces] = useState([]);

  const [deleteId, setDeleteId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editSite, setEditSite] = useState({});
  const [editId, setEditId] = useState(null);

  const [filters, setFilters] = useState({
    province: null,
    transmissionOwner: null,
    siteTransmissionType: null,
    siteOwner: null,
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const axiosInstance = useAxiosPrivate();

  const filteredSites = useMemo(() => {
    return siteListFull.filter((site) => {
      const matchProvince =
        !filters.province || site.province?.id === filters.province.id;
      const matchTransOwner =
        !filters.transmissionOwner ||
        site.transmissionOwner?.id === filters.transmissionOwner.id;
      const matchSiteTransType =
        !filters.siteTransmissionType ||
        site.siteTransmissionType?.id === filters.siteTransmissionType.id;
      const matchSiteOwner =
        !filters.siteOwner || site.siteOwner?.id === filters.siteOwner.id;
      const matchSearch =
        !filters.search ||
        site.siteId?.toLowerCase().includes(filters.search.toLowerCase()) ||
        site.siteId2?.toLowerCase().includes(filters.search.toLowerCase()) ||
        site.siteName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        site.note?.toLowerCase().includes(filters.search.toLowerCase());

      return (
        matchProvince &&
        matchTransOwner &&
        matchSiteTransType &&
        matchSiteOwner &&
        matchSearch
      );
    });
  }, [siteListFull, filters]);

  const totalPages = Math.ceil(filteredSites.length / rowsPerPage);
  const paginatedSites = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredSites.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredSites, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const onBtnExport = () => {
    const dataToExport = filteredSites.map((site) => ({
      Tỉnh: site.province?.name,
      "Site ID": site.siteId,
      "Site ID 2": site.siteId2,
      "Tên trạm": site.siteName,
      "Loại truyền dẫn": site.siteTransmissionType?.name,
      "Đơn vị sở hữu TD": site.transmissionOwner?.name,
      "Chủ nhà trạm": site.siteOwner?.name,
      "Vĩ độ": site.latitude,
      "Kinh độ": site.longitude,
      "Ghi chú": site.note,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sites");
    XLSX.writeFile(workbook, "SiteList.xlsx");
  };

  const handleResetFilters = () => {
    setFilters({
      province: null,
      transmissionOwner: null,
      siteTransmissionType: null,
      siteOwner: null,
      search: "",
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load Sites
        const sitesRes = await axiosInstance.get("sites");
        setSiteListFull(sitesRes.data || []);

        // Load Metadata concurrently
        const [ownersRes, transOwnersRes, provincesRes, transTypesRes] =
          await Promise.all([
            axiosInstance.get("siteOwners"),
            axiosInstance.get("transmissionOwners"),
            axiosInstance.get("provinces"),
            axiosInstance.get("site-transmission-types"),
          ]);

        setSiteOwnerList(ownersRes.data || []);
        setTransmissionOwnerList(transOwnersRes.data || []);
        setProvinces(provincesRes.data || []);
        setSiteTransmissionTypeList(transTypesRes.data || []);
      } catch (error) {
        console.log(error);
        toast.error("Lỗi tải dữ liệu.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Xử lý thêm mới
  const handleOpenCreate = () => {
    setOpenCreate(!openCreate);
  };

  // Helper: Map Formik values (Nested) to Backend DTO (Flat)
  const mapFormToRequest = (values) => {
    return {
      id: values.id,
      siteId: values.siteId,
      siteId2: values.siteId2,
      siteName: values.siteName,
      latitude: +values.latitude,
      longitude: +values.longitude,
      note: values.note,
      active: values.active,
      provinceId: values.province?.id || null,
      siteOwnerId: values.siteOwner?.id || null,
      siteTransmissionTypeId: values.siteTransmissionType?.id || null,
      transmissionOwnerId: values.transmissionOwner?.id || null,
    };
  };

  const handleCreate = async (values, { setErrors }) => {
    console.log("Giá trị từ Form:" + values);
    const payload = mapFormToRequest(values);
    try {
      const response = await axiosInstance.post("sites", payload);
      const newSite = response.data;
      toast.success("Đã thêm mới trạm thành công.");
      setSiteListFull((prevState) => [newSite, ...prevState]);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi thêm mới",
        {
          zIndex: 9999,
        },
      );
    } finally {
      setOpenCreate(!openCreate);
    }
  };

  // Xử lý Edit

  const handleEdit = async (id) => {
    try {
      const response = await axiosInstance.get(`sites/${id}`);
      const site = response.data;
      console.log("site cần edit:" + site);
      setEditId(id);
      setEditSite({ ...site });
      handleOpenEdit();
    } catch (error) {
      console.log("Lỗi api:", error);
      toast.error("Không thể lấy thông tin trạm");
    }
  };

  const handleOpenEdit = () => {
    setOpenEdit(!openEdit);
  };

  const handleEditSubmit = async (values) => {
    console.log("Giá trị từ Form:" + values);
    const payload = mapFormToRequest(values);

    console.log("payload:" + payload);
    try {
      const response = await axiosInstance.put(`sites/${values.id}`, payload);
      const updatedSite = response.data;
      setSiteListFull((prevState) =>
        // Update local state optimistically or refetch
        prevState.map((s) => (s.id === updatedSite.id ? updatedSite : s)),
      );
      toast.success("Đã cập nhật thành công trạm");
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
  };

  // Xử lý Xóa

  const handleDeleteSite = async (deleteId) => {
    setDeleteId(deleteId);
    handleOpenDelete();
  };
  const handleOpenDelete = () => {
    setOpenDelete(!openDelete);
  };
  const handleDeleteSubmit = async () => {
    try {
      await axiosInstance.delete("sites/" + deleteId);
      toast.success("Đã xóa thành công trạm");
      setSiteListFull((prevState) =>
        prevState.filter((site) => site.id !== deleteId),
      );
      setDeleteId(null);
    } catch (e) {
      console.log(e);
      toast.error("Có lỗi xảy ra khi xóa trạm");
    } finally {
      handleOpenDelete();
    }
  };

  let deleteSiteId;
  if (deleteId != null) {
    deleteSiteId = siteListFull.find((site) => site.id === deleteId)?.siteId;
    console.log(deleteSiteId);
  }

  const validate = {
    siteId: Yup.string().required("Site Id không để trống"),
    latitude: Yup.number()
      .required("Không để trống")
      .typeError("(Yêu cầu nhập số)"),
    longitude: Yup.number()
      .required("Không để trống")
      .typeError("Yêu cầu nhập số"),
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Danh sách trạm</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số:{" "}
            <span className="font-semibold text-blue-600">
              {filteredSites.length}
            </span>{" "}
            / {siteListFull.length} trạm
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
          <span className="font-bold text-sm uppercase tracking-wider">
            Bộ lọc tìm kiếm
          </span>
          {(filters.province ||
            filters.transmissionOwner ||
            filters.siteTransmissionType ||
            filters.siteOwner ||
            filters.search) && (
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
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">
              Tỉnh
            </span>
            <Select
              isClearable
              placeholder="Tất cả tỉnh"
              className="text-sm"
              options={provinces}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.province}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, province: val }))
              }
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "40px",
                  borderRadius: "8px",
                  borderColor: "#e2e8f0",
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">
              Sở hữu truyền dẫn
            </span>
            <Select
              isClearable
              placeholder="Tất cả đơn vị"
              className="text-sm"
              options={transmissionOwnerList}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.transmissionOwner}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, transmissionOwner: val }))
              }
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "40px",
                  borderRadius: "8px",
                  borderColor: "#e2e8f0",
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">
              Loại truyền dẫn
            </span>
            <Select
              isClearable
              placeholder="Tất cả loại"
              className="text-sm"
              options={siteTransmissionTypeList}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.siteTransmissionType}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, siteTransmissionType: val }))
              }
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "40px",
                  borderRadius: "8px",
                  borderColor: "#e2e8f0",
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">
              Chủ nhà trạm
            </span>
            <Select
              isClearable
              placeholder="Tất cả chủ nhà"
              className="text-sm"
              options={siteOwnerList}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              value={filters.siteOwner}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, siteOwner: val }))
              }
              menuPortalTarget={document.body}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "40px",
                  borderRadius: "8px",
                  borderColor: "#e2e8f0",
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">
              Tìm kiếm nhanh
            </span>
            <Input
              icon={<MagnifyingGlassIcon className="h-4 w-4" />}
              placeholder="Site ID, Tên, Ghi chú..."
              className="!border-t-blue-gray-200 focus:!border-blue-500 rounded-lg text-sm"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              containerProps={{
                className: "min-w-0",
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
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Tỉnh
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Site ID
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Site ID 2
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Tên trạm
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Truyền dẫn
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Vị trí
                  </Typography>
                </th>
                <th className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Ghi chú
                  </Typography>
                </th>
                <th className="p-4 text-center">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none"
                  >
                    Tác động
                  </Typography>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {paginatedSites.map((site) => (
                <tr
                  key={site.id}
                  className="hover:bg-gray-50/80 transition-colors"
                >
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {site.province?.name}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-bold"
                    >
                      {site.siteId}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {site.siteId2 || "-"}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-medium"
                    >
                      {site.siteName}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal"
                      >
                        {site.siteTransmissionType?.name}
                      </Typography>
                      {site.transmissionOwner?.name && (
                        <OwnerChip name={site.transmissionOwner.name} />
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal text-xs italic"
                    >
                      {site.latitude?.toFixed(4)}, {site.longitude?.toFixed(4)}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal opacity-70 italic max-w-[200px] truncate"
                    >
                      {site.note || "-"}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1">
                      <IconButton
                        variant="text"
                        size="sm"
                        color="blue"
                        onClick={() => handleEdit(site.id)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        variant="text"
                        size="sm"
                        color="red"
                        onClick={() => handleDeleteSite(site.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSites.length === 0 && (
            <div className="py-20 text-center">
              <Typography variant="h6" color="blue-gray" className="opacity-40">
                Không tìm thấy trạm nào khớp với bộ lọc
              </Typography>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <Typography
              variant="small"
              color="blue-gray"
              className="font-normal"
            >
              Trang <span className="font-bold">{currentPage}</span> /{" "}
              <span className="font-bold">{totalPages || 1}</span>
            </Typography>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
              <span className="text-xs text-blue-gray-400 font-medium">
                Hiển thị:
              </span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs border border-gray-300 rounded px-1 py-0.5 outline-none focus:border-blue-500 transition-colors"
              >
                {[5, 10, 15, 20, 50, 100].map((val) => (
                  <option key={val} value={val}>
                    {val} dòng
                  </option>
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
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
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
            <Typography
              variant="h5"
              color="blue-gray"
              className="font-semibold text-gray-900"
            >
              Thêm mới trạm
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Nhập các thông tin chi tiết cho trạm mới
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
              province: { id: "DN" },
              siteId: "",
              siteId2: "",
              siteName: "",
              latitude: "",
              longitude: "",
              transmissionOwner: { id: 1 },
              siteTransmissionType: { id: 1 },
              siteOwner: { id: 1 },
              note: "",
              active: true,
            }}
            validationSchema={Yup.object(validate)}
          >
            {({ setFieldValue, values }) => (
              <Form className="flex flex-col">
                <DialogBody className="p-6">
                  <div className="grid grid-cols-1 gap-5">
                    {/* Trạng thái Switch */}
                    <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-bold"
                        >
                          Trạng thái hoạt động
                        </Typography>
                      </div>
                      <Switch
                        name="active"
                        color="green"
                        checked={values.active}
                        onChange={({ target }) =>
                          setFieldValue("active", target.checked)
                        }
                        className="scale-90"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          Site ID <span className="text-red-500">*</span>
                        </Typography>
                        <Field
                          name="siteId"
                          placeholder="VD: DN_001"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                        />
                        <ErrorMessage
                          name="siteId"
                          component="div"
                          className="mt-1 text-xs text-red-600 font-medium"
                        />
                      </div>
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          Site ID khác
                        </Typography>
                        <Field
                          name="siteId2"
                          placeholder="VD: DN_001_OLD"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-1 font-bold"
                      >
                        Tên trạm <span className="text-red-500">*</span>
                      </Typography>
                      <Field
                        name="siteName"
                        placeholder="Nhập tên trạm..."
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                      />
                    </div>

                    <FormSelect
                      label="Tỉnh"
                      name="province.id"
                      options={provinces}
                      getOptionLabel={(option) => option.name}
                      required
                      useVirtualization={false}
                    />

                    <FormSelect
                      label="Chủ nhà trạm"
                      name="siteOwner.id"
                      options={siteOwnerList}
                      getOptionLabel={(option) => option.name}
                      useVirtualization={false}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          Vĩ độ <span className="text-red-500">*</span>
                        </Typography>
                        <Field
                          name="latitude"
                          placeholder="VD: 21.0285"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all font-mono text-xs"
                        />
                        <ErrorMessage
                          name="latitude"
                          component="div"
                          className="mt-1 text-xs text-red-600 font-medium"
                        />
                      </div>
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          Kinh độ <span className="text-red-500">*</span>
                        </Typography>
                        <Field
                          name="longitude"
                          placeholder="VD: 105.8542"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all font-mono text-xs"
                        />
                        <ErrorMessage
                          name="longitude"
                          component="div"
                          className="mt-1 text-xs text-red-600 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormSelect
                        label="Loại truyền dẫn"
                        name="siteTransmissionType.id"
                        options={siteTransmissionTypeList}
                        getOptionLabel={(option) => option.name}
                        useVirtualization={false}
                      />
                      <FormSelect
                        label="Đơn vị sở hữu TD"
                        name="transmissionOwner.id"
                        options={transmissionOwnerList}
                        getOptionLabel={(option) => option.name}
                        useVirtualization={false}
                      />
                    </div>

                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-1 font-bold"
                      >
                        Ghi chú
                      </Typography>
                      <Field
                        as="textarea"
                        name="note"
                        rows={3}
                        placeholder="Nhập ghi chú..."
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all resize-none"
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

      {/* Modal Sửa thông tin trạm */}
      <Dialog
        open={openEdit}
        handler={handleOpenEdit}
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
              Cập nhật trạm
            </Typography>
            <Typography className="text-xs font-normal text-gray-500 mt-0.5">
              Thay đổi các thông số kỹ thuật của trạm
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
              ...editSite,
            }}
            validationSchema={Yup.object(validate)}
          >
            {({ setFieldValue, values }) => (
              <Form className="flex flex-col">
                <DialogBody className="p-6">
                  <div className="grid grid-cols-1 gap-5">
                    {/* Trạng thái Switch */}
                    <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                      <div>
                        <Typography variant="small" color="blue-gray" className="font-bold">
                          Trạng thái hoạt động
                        </Typography>
                      </div>
                      <Switch
                        name="active"
                        color="green"
                        checked={values.active}
                        onChange={({ target }) => setFieldValue("active", target.checked)}
                        className="scale-90"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          Site ID <span className="text-red-500">*</span>
                        </Typography>
                        <Field
                          name="siteId"
                          placeholder="VD: DN_001"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                        />
                        <ErrorMessage
                          name="siteId"
                          component="div"
                          className="mt-1 text-xs text-red-600 font-medium"
                        />
                      </div>
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          Site ID khác
                        </Typography>
                        <Field
                          name="siteId2"
                          placeholder="VD: DN_001_OLD"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-1 font-bold"
                      >
                        Tên trạm <span className="text-red-500">*</span>
                      </Typography>
                      <Field
                        name="siteName"
                        placeholder="Nhập tên trạm..."
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all"
                      />
                    </div>

                    <FormSelect
                      label="Tỉnh"
                      name="province.id"
                      options={provinces}
                      getOptionLabel={(option) => option.name}
                      required
                      useVirtualization={false}
                    />

                    <FormSelect
                      label="Chủ nhà trạm"
                      name="siteOwner.id"
                      options={siteOwnerList}
                      getOptionLabel={(option) => option.name}
                      useVirtualization={false}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          Vĩ độ <span className="text-red-500">*</span>
                        </Typography>
                        <Field
                          name="latitude"
                          placeholder="VD: 21.0285"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all font-mono text-xs"
                        />
                        <ErrorMessage
                          name="latitude"
                          component="div"
                          className="mt-1 text-xs text-red-600 font-medium"
                        />
                      </div>
                      <div>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-1 font-bold"
                        >
                          Kinh độ <span className="text-red-500">*</span>
                        </Typography>
                        <Field
                          name="longitude"
                          placeholder="VD: 105.8542"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all font-mono text-xs"
                        />
                        <ErrorMessage
                          name="longitude"
                          component="div"
                          className="mt-1 text-xs text-red-600 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormSelect
                        label="Loại truyền dẫn"
                        name="siteTransmissionType.id"
                        options={siteTransmissionTypeList}
                        getOptionLabel={(option) => option.name}
                        useVirtualization={false}
                      />
                      <FormSelect
                        label="Đơn vị sở hữu TD"
                        name="transmissionOwner.id"
                        options={transmissionOwnerList}
                        getOptionLabel={(option) => option.name}
                        useVirtualization={false}
                      />
                    </div>

                    <div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-1 font-bold"
                      >
                        Ghi chú
                      </Typography>
                      <Field
                        as="textarea"
                        name="note"
                        rows={3}
                        placeholder="Nhập ghi chú..."
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 outline-none transition-all resize-none"
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

      {/* Modal confirm xóa site */}
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
          <Typography
            variant="paragraph"
            color="blue-gray"
            className="font-medium"
          >
            Bạn có chắc chắn muốn xóa trạm{" "}
            <span className="font-bold text-gray-900">{deleteSiteId}</span>?
          </Typography>
          <Typography variant="small" color="gray" className="mt-3 italic">
            Hành động này không thể phục hồi và dữ liệu sẽ bị xóa vĩnh viễn khỏi
            hệ thống.
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
export default SiteList2;
