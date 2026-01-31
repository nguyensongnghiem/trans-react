import { useEffect, useMemo, useState, useRef } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowDownTrayIcon,
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
  IconButton as MTIconButton,
} from "@material-tailwind/react";
import { CustomMenuList } from "./CustomList";
import { toast } from "react-toastify";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import CustomButton from "../components/CustomButton";
import StatusChip from "../components/StatusChip";
function HiredFoList() {
  const [simpleSiteList, setSimpleSiteList] = useState([]);
  const [hiredFoList, setHiredFoList] = useState([]);
  const [routerTypeList, setRouterTypeList] = useState([]);
  const [transmissionDeviceTypeList, setTransmissionDeviceTypeList] = useState(
    [],
  );
  const [deleteId, setDeleteId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editFoLine, setEditFoLine] = useState({});
  const [editId, setEditId] = useState(null);
  const axiosInstance = useAxiosPrivate();

  // ===== Import Multi Contract Excel =====
  const [importOpen, setImportOpen] = useState(false);
  const [excelFile, setExcelFile] = useState(null);

  const [excelChecked, setExcelChecked] = useState(false);
  const [excelSuccess, setExcelSuccess] = useState(false);

  const [excelErrors, setExcelErrors] = useState({});
  const [excelRows, setExcelRows] = useState([]);

  const [saving, setSaving] = useState(false);

  // Filter and pagination states
  const [filters, setFilters] = useState({
    search: "",
    contract: null,
    status: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // Filter Logic
  const filterOptions = useMemo(() => {
    const contracts = new Set();
    hiredFoList.forEach((item) => {
      if (item.foContract?.contractNumber) {
        contracts.add(item.foContract.contractNumber);
      }
    });
    return {
      contracts: Array.from(contracts)
        .sort()
        .map((c) => ({ value: c, label: c })),
    };
  }, [hiredFoList]);

  const filteredHiredFos = useMemo(() => {
    return hiredFoList.filter((item) => {
      const matchContract =
        !filters.contract ||
        item.foContract?.contractNumber === filters.contract.value;
      const matchStatus =
        !filters.status || item.active === filters.status.value;
      const matchSearch =
        !filters.search ||
        (item.nearSite?.siteId + " - " + item.farSite?.siteId)
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        item.note?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.foContract?.contractNumber
          ?.toLowerCase()
          .includes(filters.search.toLowerCase());

      return matchContract && matchStatus && matchSearch;
    });
  }, [hiredFoList, filters]);

  const totalPages = Math.ceil(filteredHiredFos.length / rowsPerPage);
  const paginatedHiredFos = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredHiredFos.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredHiredFos, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      search: "",
      contract: null,
      status: null,
    });
  };

  useEffect(() => {
    const getAllHiredFo = async () => {
      try {
        setIsLoading(true);
        const hiredFoList = await axiosInstance.get("hired-fos");
        setHiredFoList(hiredFoList.data);
      } catch (error) {
        console.log(error);
      } finally {
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

  const reloadHiredFoList = async () => {
    const hiredFoListRes = await axiosInstance.get("hired-fos");
    setHiredFoList(hiredFoListRes.data);
  };

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        await reloadHiredFoList();
      } catch (e) {
        console.log(e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleEditSubmit = async (foLine) => {
    try {
      // 1) Update lên backend
      await axiosInstance.put(`hired-fos/${foLine.id}`, foLine);

      toast.success("Đã cập nhật thành công tuyến FO");

      // 2) Refresh lại list từ backend
      await reloadHiredFoList();
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message || "Có lỗi bất thường xảy ra");
    } finally {
      // 3) Đóng modal edit đúng cách (không toggle)
      setOpenEdit(false);
    }
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
        prevState.filter((router) => router.id !== deleteId),
      );
    } catch (e) {
      console.log(e);
      toast.error("Có lỗi xảy ra khi xóa trạm");
    } finally {
      handleOpenDelete();
    }
  };

  // Select Site A/B: nền trắng chữ đen
  const whiteSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "white",
      color: "black",
      borderColor: state.isFocused ? "#93c5fd" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 1px #93c5fd" : "none",
      "&:hover": { borderColor: "#93c5fd" },
      minHeight: "38px",
    }),
    singleValue: (base) => ({
      ...base,
      color: "black",
    }),
    input: (base) => ({
      ...base,
      color: "black",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#6b7280",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "white",
      color: "black",
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#bfdbfe"
        : state.isFocused
          ? "#e5e7eb"
          : "white",
      color: "black",
    }),
  };

  // Hàm mở file excel
  const handleOpenImport = () => {
    setImportOpen((prev) => !prev);

    if (importOpen) {
      setExcelFile(null);
      setExcelChecked(false);
      setExcelSuccess(false);
      setExcelErrors({});
      setExcelRows([]);
      setSaving(false);
    }
  };
  // Hàm Check file excel
  const handleCheckExcelMulti = async () => {
    if (!excelFile) {
      toast.warning("Vui lòng chọn file Excel");
      return;
    }

    try {
      const form = new FormData();
      form.append("file", excelFile);

      const res = await axiosInstance.post(
        "hired-fos/import-excel/check-multi",
        form,
      );

      setExcelRows(res.data?.rows || []);
      setExcelErrors({});
      setExcelChecked(true);
      setExcelSuccess(true);

      toast.success("✔ File Excel hợp lệ");
    } catch (err) {
      if (err?.response?.status === 400) {
        setExcelErrors(err.response.data || {});
        setExcelRows([]);
        setExcelChecked(true);
        setExcelSuccess(false);
        toast.error("❌ Dữ liệu Excel không hợp lệ");
        return;
      }
      toast.error("Lỗi hệ thống khi kiểm tra Excel");
    }
  };
  // Hàm Lưu file excel
  const handleSaveExcelMulti = async () => {
    if (!excelSuccess) {
      toast.error("File Excel chưa hợp lệ, không thể lưu");
      return;
    }

    try {
      setSaving(true);

      const form = new FormData();
      form.append("file", excelFile);

      const res = await axiosInstance.post(
        "hired-fos/import-excel/save-multi",
        form,
      );

      toast.success(
        `${res.data?.message || "Import thành công"} (HĐ: ${res.data?.totalContract || 0}, Tuyến: ${res.data?.totalLine || 0})`,
      );

      const hiredFoListRes = await axiosInstance.get("hired-fos");
      setHiredFoList(hiredFoListRes.data);

      setImportOpen(false);
      setExcelFile(null);
      setExcelChecked(false);
      setExcelSuccess(false);
      setExcelErrors({});
      setExcelRows([]);
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 409) {
        toast.error(data?.message || "Các số hợp đồng đã tồn tại");
        return;
      }

      if (status === 400) {
        setExcelErrors(data || {});
        setExcelChecked(true);
        setExcelSuccess(false);
        toast.error("Dữ liệu không hợp lệ");
        return;
      }

      toast.error(data?.message || "❌ Lỗi khi lưu dữ liệu");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axiosInstance.get(
        "hired-fos/import-excel/template",
        {
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "hired-fo-import-template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Không thể tải file mẫu. Vui lòng thử lại sau.");
      console.error(error);
    }
  };

  const VND = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  let deleteRouterName;
  if (deleteId != null) {
    deleteRouterName = hiredFoList.find(
      (router) => router.id === deleteId,
    ).name;
    console.log(deleteRouterName);
  }

  // if (isLoading) return <Spinner />;
  const onBtnExport = () => {
    const dataToExport = filteredHiredFos.map((item) => ({
      "Tên tuyến": `${item.nearSite?.siteId} - ${item.farSite?.siteId}`,
      "Khoảng cách (km)": item.finalDistance,
      "Số core": item.coreQuantity,
      "Đơn giá (VNĐ)": item.cost,
      "Số hợp đồng": item.foContract?.contractNumber,
      "Trạng thái": item.active ? "Hoạt động" : "Không hoạt động",
      "Ghi chú": item.note,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "HiredFo");
    XLSX.writeFile(workbook, "HiredFo.xlsx");
  };
    return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Danh sách FO thuê</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số:{" "}
            <span className="font-semibold text-blue-600">
              {filteredHiredFos.length}
            </span>{" "}
            / {hiredFoList.length} tuyến
          </p>
        </div>
        <div className="flex gap-2">
          <CustomButton
            className="flex items-center gap-2 bg-[#0d47a1] hover:bg-[#0a3a82]"
            size="sm"
            onClick={handleOpenImport}
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
        <div className="flex items-center gap-2 mb-4 text-blue-gray-700">
          <FunnelIcon className="h-5 w-5" />
          <span className="font-bold text-sm uppercase tracking-wider">
            Bộ lọc tìm kiếm
          </span>
          {(filters.search || filters.contract || filters.status) && (
            <button
              onClick={handleResetFilters}
              className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
            >
              <ArrowPathIcon className="h-3 w-3" />
              Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">
              Số hợp đồng
            </span>
            <Select
              isClearable
              placeholder="Tất cả hợp đồng"
              className="text-sm"
              options={filterOptions.contracts}
              value={filters.contract}
              onChange={(val) => setFilters((prev) => ({ ...prev, contract: val }))}
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
              Trạng thái
            </span>
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

          <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">
              Tìm kiếm nhanh
            </span>
            <Input
              icon={<MagnifyingGlassIcon className="h-4 w-4" />}
              placeholder="Tên tuyến, Ghi chú, Số HĐ..."
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

      {/* Table */}
      <Card className="w-full overflow-hidden border border-gray-200 shadow-sm rounded-xl">
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full min-w-max table-auto text-left">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50/90 backdrop-blur-sm border-b border-gray-200">
                {["STT", "Tên tuyến", "Khoảng cách", "Số core", "Đơn giá", "Số hợp đồng", "Trạng thái", "Ghi chú", "Tác động"].map((head) => (
                  <th key={head} className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-bold leading-none"
                    >
                      {head}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedHiredFos.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-bold">
                      {item.nearSite?.siteId} - {item.farSite?.siteId}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {item.finalDistance} km
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {item.coreQuantity}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {VND.format(item.cost)}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {item.foContract?.contractNumber}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <StatusChip active={item.active} />
                  </td>
                  <td className="p-4 max-w-xs truncate">
                    <Typography variant="small" color="blue-gray" className="font-normal italic opacity-70">
                      {item.note}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1">
                      <Tooltip content="Sửa">
                        <IconButton
                          variant="text"
                          size="sm"
                          color="blue-gray"
                          onClick={() => handleEdit(item.id)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip content="Xóa">
                        <IconButton
                          variant="text"
                          size="sm"
                          color="red"
                          onClick={() => handleDeleteRouter(item.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredHiredFos.length === 0 && (
            <div className="py-20 text-center">
              <Typography variant="h6" color="blue-gray" className="opacity-40">
                Không tìm thấy tuyến FO nào khớp với bộ lọc
              </Typography>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <Typography variant="small" color="blue-gray" className="font-normal">
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
        className="overflow-hidden"
        size="sm"
      >
        <div className="max-h-[90vh] overflow-y-auto p-3">
          <DialogHeader className="relative m-0 block pb-4 border-b border-gray-100">
            <Typography variant="h4" color="blue-gray" className="font-bold">
              Thêm mới thiết bị
            </Typography>
            <Typography
              color="gray"
              className="mt-1 font-normal text-gray-600 text-sm"
            >
              Nhập thông tin chi tiết để đồng bộ dữ liệu hệ thống.
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
                <DialogFooter className="pt-0 pr-6 pb-6">
                  <CustomButton
                    size="md"
                    type="submit"
                    color="gray"
                    className="bg-gray-900 border-none shadow-none hover:shadow-lg"
                  >
                    Thêm mới thiết bị
                  </CustomButton>
                </DialogFooter>
              </Form>
            )}
            {/* <img src={MySvg} alt="" className="flex-initial p-5" /> */}
          </Formik>
        </div>
      </Dialog>
      <Dialog open={importOpen} handler={handleOpenImport} size="lg">
        <div className="max-h-[90vh] overflow-y-auto p-3">
          <DialogHeader className="relative m-0 block pb-4 border-b border-gray-100">
            <Typography variant="h4" color="blue-gray" className="font-bold">
              Import nhiều hợp đồng + tuyến FO
            </Typography>
            <Typography
              color="gray"
              className="mt-1 font-normal text-gray-600 text-sm"
            >
              Upload file Excel mẫu để cập nhật dữ liệu hàng loạt.
            </Typography>
            <IconButton
              size="sm"
              variant="text"
              className="!absolute right-3.5 top-3.5"
              onClick={handleOpenImport}
            >
              <XMarkIcon className="h-4 w-4 stroke-2" />
            </IconButton>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {/* Upload */}
            <div className="flex flex-col gap-2">
              <label className="text-slate-400 font-semibold">
                Chọn file Excel (
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-blue-500 italic hover:underline"
                >
                  Tải file mẫu tại đây
                </button>
                )
              </label>
              <input
                type="file"
                accept=".xlsx"
                className="w-full rounded border"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setExcelFile(f);
                    setExcelChecked(false);
                    setExcelSuccess(false);
                    setExcelErrors({});
                    setExcelRows([]);
                  }
                }}
              />
              {excelFile && (
                <div className="text-sm text-blue-700">
                  📊 File Excel: <b>{excelFile.name}</b>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <CustomButton
                color="blue"
                type="button"
                onClick={handleCheckExcelMulti}
              >
                KIỂM TRA DỮ LIỆU
              </CustomButton>

              <CustomButton
                color="green"
                type="button"
                disabled={!excelSuccess || saving}
                onClick={handleSaveExcelMulti}
              >
                {saving ? "Đang lưu..." : "LƯU DATABASE"}
              </CustomButton>
            </div>

            {/* Success */}
            {excelChecked && excelSuccess && (
              <div className="rounded border border-green-300 bg-green-50 p-3 text-green-700">
                ✔ File Excel hợp lệ. Có thể lưu DB.
              </div>
            )}

            {/* Error box */}
            {excelChecked &&
              !excelSuccess &&
              Object.keys(excelErrors).length > 0 && (
                <div className="w-full rounded-lg border border-red-400 bg-red-50 p-5 shadow-md">
                  <div className="mb-3 text-lg font-semibold text-red-600">
                    ❌ Dữ liệu Excel không hợp lệ
                  </div>

                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                    Tổng số dòng lỗi
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
                      {Object.keys(excelErrors).length}
                    </span>
                  </div>

                  <div className="max-h-[320px] overflow-y-auto space-y-4 pr-2">
                    {Object.entries(excelErrors).map(([row, rowError]) => (
                      <div
                        key={row}
                        className="rounded border border-red-200 bg-white p-4"
                      >
                        <div className="mb-2 font-semibold text-red-700">
                          ⚠️ Dòng {row}
                        </div>

                        <ul className="ml-5 list-disc space-y-1 text-sm text-gray-800">
                          {rowError.errors?.map((err, idx) => (
                            <li key={idx}>
                              <span className="font-semibold text-red-600">
                                {err.column}:
                              </span>{" "}
                              {err.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Preview */}
            {excelSuccess && excelRows.length > 0 && (
              <div className="space-y-3">
                <Typography variant="h6" color="blue-gray">
                  Preview (group theo Số hợp đồng)
                </Typography>

                {Object.entries(
                  excelRows.reduce((acc, r) => {
                    const cn = (r.contractNumber || "").trim().toUpperCase();
                    if (!acc[cn]) acc[cn] = [];
                    acc[cn].push(r);
                    return acc;
                  }, {}),
                ).map(([cn, list]) => (
                  <div key={cn} className="rounded border p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-blue-700">📌 {cn}</div>
                      <div className="text-sm text-gray-600">
                        Số tuyến: <b>{list.length}</b>
                      </div>
                    </div>

                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full border text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border px-2 py-1">#</th>
                            <th className="border px-2 py-1">Trạm đầu</th>
                            <th className="border px-2 py-1">Trạm cuối</th>
                            <th className="border px-2 py-1">Core</th>
                            <th className="border px-2 py-1">Thiết kế</th>
                            <th className="border px-2 py-1">Thực tế</th>
                            <th className="border px-2 py-1">Đơn giá</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.slice(0, 5).map((r, i) => (
                            <tr key={i}>
                              <td className="border px-2 py-1">{i + 1}</td>
                              <td className="border px-2 py-1">{r.nearSite}</td>
                              <td className="border px-2 py-1">{r.farSite}</td>
                              <td className="border px-2 py-1">
                                {r.coreQuantity}
                              </td>
                              <td className="border px-2 py-1">
                                {r.designedDistance}
                              </td>
                              <td className="border px-2 py-1">
                                {r.finalDistance}
                              </td>
                              <td className="border px-2 py-1">{r.cost}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {list.length > 5 && (
                        <div className="mt-2 text-xs text-gray-500">
                          (Hiển thị 5/{list.length} dòng)
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button variant="text" onClick={handleOpenImport}>
              Đóng
            </Button>
          </DialogFooter>
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
          <DialogHeader className="relative m-0 block pb-4 border-b border-gray-100">
            <Typography variant="h4" color="blue-gray" className="font-bold">
              Cập nhật thông tin tuyến cáp
            </Typography>
            <Typography
              color="gray"
              className="mt-1 font-normal text-gray-600 text-sm"
            >
              Chỉnh sửa thông tin tuyến cáp quang thuê để đảm bảo dữ liệu chính
              xác.
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
            enableReinitialize
            onSubmit={handleEditSubmit}
            initialValues={{
              ...editFoLine,
            }}
            validationSchema={Yup.object({
              coreQuantity: Yup.number().required("Yêu cầu nhập số core"),
              finalDistance: Yup.number().required(
                "Yêu cầu nhập chiều dài tuyến thực tế",
              ),
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
                          styles={whiteSelectStyles}
                          value={
                            simpleSiteList.find(
                              (o) => o.id === values.nearSite?.id,
                            ) || null
                          }
                          onChange={(opt) =>
                            setFieldValue("nearSite.id", opt?.id || null)
                          }
                          components={{ MenuList: CustomMenuList }}
                          isSearchable={true}
                          options={simpleSiteList}
                          getOptionLabel={(option) => option.siteId}
                          getOptionValue={(option) => option.id}
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
                          styles={whiteSelectStyles}
                          value={
                            simpleSiteList.find(
                              (o) => o.id === values.farSite?.id,
                            ) || null
                          }
                          onChange={(opt) =>
                            setFieldValue("farSite.id", opt?.id || null)
                          }
                          components={{ MenuList: CustomMenuList }}
                          isSearchable={true}
                          options={simpleSiteList}
                          getOptionLabel={(option) => option.siteId}
                          getOptionValue={(option) => option.id}
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
                <DialogFooter className="pt-0 pr-6 pb-6">
                  <CustomButton
                    size="md"
                    type="submit"
                    color="gray"
                    className="bg-gray-900 border-none shadow-none hover:shadow-lg"
                  >
                    Cập nhật dữ liệu
                  </CustomButton>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </div>
      </Dialog>

      {/*Modal confirm xóa site*/}
      <Dialog open={openDelete} handler={handleOpenDelete} size="sm">
        <DialogHeader className="flex flex-col items-center gap-2 pt-6">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
          <Typography variant="h4" color="blue-gray" className="font-bold">
            Xác nhận xóa
          </Typography>
        </DialogHeader>
        <DialogBody className="text-center font-normal text-gray-600">
          Bạn có chắc chắn muốn xóa thông tin trạm{" "}
          <span className="font-bold text-blue-gray-900">
            {deleteRouterName}
          </span>
          ?
          <br />
          Hành động này không thể hoàn tác.
        </DialogBody>
        <DialogFooter className="flex justify-center gap-3 pb-6">
          <CustomButton
            variant="text"
            color="gray"
            onClick={handleOpenDelete}
            className="px-6"
          >
            Hủy
          </CustomButton>
          <CustomButton
            color="red"
            onClick={handleDeleteSubmit}
            className="px-6"
          >
            Xác nhận xóa
          </CustomButton>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
export default HiredFoList;
