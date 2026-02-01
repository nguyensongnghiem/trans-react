import { useEffect, useMemo, useState, useRef } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  ArrowUpTrayIcon,
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
import OwnerChip from "../components/OwnerChip";
function HiredFoList() {
  const [simpleSiteList, setSimpleSiteList] = useState([]);
  const [hiredFoList, setHiredFoList] = useState([]);
  const [contracts, setContracts] = useState([]);
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
    province: null,
    supplier: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // Filter Logic
  const filterOptions = useMemo(() => {
    const contracts = new Set();
    const provinces = new Set();
    const suppliers = new Set();
    hiredFoList.forEach((item) => {
      if (item.foContract?.contractNumber) {
        contracts.add(item.foContract.contractNumber);
      }
      if (item.nearSite?.province?.name) {
        provinces.add(item.nearSite.province.name);
      }
      if (item.foContract?.transmissionOwner?.name) {
        suppliers.add(item.foContract.transmissionOwner.name);
      }
    });
    return {
      contracts: Array.from(contracts)
        .sort()
        .map((c) => ({ value: c, label: c })),
      provinces: Array.from(provinces)
        .sort()
        .map((p) => ({ value: p, label: p })),
      suppliers: Array.from(suppliers)
        .sort()
        .map((s) => ({ value: s, label: s })),
    };
  }, [hiredFoList]);

  const filteredHiredFos = useMemo(() => {
    return hiredFoList.filter((item) => {
      const matchContract =
        !filters.contract ||
        item.foContract?.contractNumber === filters.contract.value;
      const matchStatus =
        !filters.status || item.active === filters.status.value;
      const matchProvince =
        !filters.province ||
        item.nearSite?.province?.name === filters.province.value;
      const matchSupplier =
        !filters.supplier ||
        item.foContract?.transmissionOwner?.name === filters.supplier.value;
      const matchSearch =
        !filters.search ||
        (item.nearSite?.siteId + " - " + item.farSite?.siteId)
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        item.note?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.foContract?.contractNumber
          ?.toLowerCase()
          .includes(filters.search.toLowerCase());

      return (
        matchContract &&
        matchStatus &&
        matchSearch &&
        matchProvince &&
        matchSupplier
      );
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
      province: null,
      supplier: null,
    });
  };

  useEffect(() => {
    const getAllHiredFo = async () => {
      try {
        setIsLoading(true);
        const hiredFoList = await axiosInstance.get("hired-fos");
        console.log(hiredFoList.data);
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
        const [sites, contractsRes] = await Promise.all([
          axiosInstance.get("sites/simple-list"),
          axiosInstance.get("contract/all")
        ]);
        setSimpleSiteList(sites.data);
        setContracts(contractsRes.data);
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
  const handleCreate = async (values) => {
    try {
      await axiosInstance.post("hired-fos", values);
      toast.success("Đã thêm mới tuyến cáp thành công.");
      reloadHiredFoList();
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra", {
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
      Tỉnh: item.nearSite?.province?.name,
      "Tên tuyến": `${item.nearSite?.siteId} - ${item.farSite?.siteId}`,
      "Khoảng cách (km)": item.finalDistance,
      "Số core": item.coreQuantity,
      "Đơn giá (VNĐ)": item.cost,
      "Số hợp đồng": item.foContract?.contractNumber,
      "Nhà cung cấp": item.foContract?.transmissionOwner?.name,
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
          <h1 className="text-2xl font-bold text-gray-800">
            Danh sách FO thuê
          </h1>
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
            onClick={handleOpenCreate}
          >
            <PlusIcon strokeWidth={2} className="h-4 w-4" /> Thêm mới
          </CustomButton>
          <CustomButton
            className="flex items-center gap-2 bg-[#e65100] hover:bg-[#bf360c]"
            size="sm"
            onClick={handleOpenImport}
          >
            <ArrowUpTrayIcon strokeWidth={2} className="h-4 w-4" /> Import excel
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
          {(filters.search ||
            filters.contract ||
            filters.status ||
            filters.province ||
            filters.supplier) && (
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
            <span className="text-[11px] font-bold text-blue-gray-400 uppercase ml-1">
              Tỉnh
            </span>
            <Select
              isClearable
              placeholder="Tất cả tỉnh"
              className="text-sm"
              options={filterOptions.provinces}
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
              Nhà cung cấp
            </span>
            <Select
              isClearable
              placeholder="Tất cả NCC"
              className="text-sm"
              options={filterOptions.suppliers}
              value={filters.supplier}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, supplier: val }))
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
              Số hợp đồng
            </span>
            <Select
              isClearable
              placeholder="Tất cả hợp đồng"
              className="text-sm"
              options={filterOptions.contracts}
              value={filters.contract}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, contract: val }))
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
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, status: val }))
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
                {[
                  "STT",
                  "Tỉnh",
                  "Tên tuyến",
                  "Khoảng cách",
                  "Số core",
                  "Đơn giá",
                  "Số hợp đồng",
                  "Nhà cung cấp",
                  "Trạng thái",
                  "Ghi chú",
                  "Tác động",
                ].map((head) => (
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
                <tr
                  key={item.id}
                  className="hover:bg-gray-50/80 transition-colors"
                >
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {item.nearSite?.province?.name}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-bold"
                    >
                      {item.nearSite?.siteId} - {item.farSite?.siteId}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {item.finalDistance} km
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {item.coreQuantity}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {VND.format(item.cost)}
                    </Typography>
                  </td>
                  <td className="p-4">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {item.foContract?.contractNumber}
                    </Typography>
                  </td>
                  <td className="p-4">
                    {item.foContract?.transmissionOwner?.name && (
                      <OwnerChip
                        name={item.foContract.transmissionOwner.name}
                        className="inline-block"
                      />
                    )}
                  </td>
                  <td className="p-4">
                    <StatusChip active={item.active} />
                  </td>
                  <td className="p-4 max-w-xs truncate">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal italic opacity-70"
                    >
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
        size="sm"
      >
        <Formik
            onSubmit={handleCreate}
            initialValues={{
              foContract: { id: null },
              nearSite: { id: null },
              farSite: { id: null },
              coreQuantity: 2,
              finalDistance: 0,
              cost: 0,
              note: "",
              active: true
            }}
            validationSchema={Yup.object({
              foContract: Yup.object({ id: Yup.number().required("Bắt buộc chọn hợp đồng") }),
              nearSite: Yup.object({ id: Yup.number().required("Bắt buộc chọn trạm đầu") }),
              farSite: Yup.object({ id: Yup.number().required("Bắt buộc chọn trạm cuối") }),
              coreQuantity: Yup.number().required("Bắt buộc"),
              finalDistance: Yup.number().required("Bắt buộc"),
              cost: Yup.number().required("Bắt buộc"),
            })}
          >
            {({ setFieldValue }) => (
              <Form>
                <DialogHeader>Thêm mới tuyến cáp thuê</DialogHeader>
                <DialogBody className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold opacity-70">Hợp đồng</label>
                    <Select
                      placeholder="Chọn hợp đồng..."
                      options={contracts}
                      getOptionLabel={(o) => o.contractNumber + " - " + o.contractName}
                      getOptionValue={(o) => o.id}
                      onChange={(val) => setFieldValue("foContract.id", val.id)}
                      styles={whiteSelectStyles}
                      components={{ MenuList: CustomMenuList }}
                    />
                    <ErrorMessage className="text-xs text-red-500" name="foContract.id" component="span" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-bold opacity-70">Site A</label>
                      <Select
                        placeholder="Site A"
                        options={simpleSiteList}
                        getOptionLabel={(o) => o.siteId}
                        getOptionValue={(o) => o.id}
                        onChange={(val) => setFieldValue("nearSite.id", val.id)}
                        components={{ MenuList: CustomMenuList }}
                        styles={whiteSelectStyles}
                      />
                      <ErrorMessage className="text-xs text-red-500" name="nearSite.id" component="span" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-bold opacity-70">Site B</label>
                      <Select
                        placeholder="Site B"
                        options={simpleSiteList}
                        getOptionLabel={(o) => o.siteId}
                        getOptionValue={(o) => o.id}
                        onChange={(val) => setFieldValue("farSite.id", val.id)}
                        components={{ MenuList: CustomMenuList }}
                        styles={whiteSelectStyles}
                      />
                      <ErrorMessage className="text-xs text-red-500" name="farSite.id" component="span" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-bold opacity-70">Số core</label>
                      <Field name="coreQuantity" type="number" className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="text-sm font-bold opacity-70">Khoảng cách (km)</label>
                      <Field name="finalDistance" type="number" step="0.01" className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="text-sm font-bold opacity-70">Đơn giá (VNĐ)</label>
                      <Field name="cost" type="number" className="w-full border rounded p-2" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold opacity-70">Ghi chú</label>
                    <Field as="textarea" name="note" className="w-full border rounded p-2 h-20" />
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
      <Dialog open={importOpen} handler={handleOpenImport} size="lg" className="flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50 rounded-t-lg">
          <div>
            <Typography variant="h4" color="blue-gray" className="font-bold">
              Import Dữ liệu Hợp đồng & Tuyến cáp
            </Typography>
            <Typography variant="small" color="gray" className="font-normal mt-1">
              Tải lên file Excel để cập nhật dữ liệu hàng loạt
            </Typography>
          </div>
          <IconButton variant="text" color="blue-gray" onClick={handleOpenImport}>
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>

        <DialogBody className="overflow-y-auto p-4 flex-1">
          {/* File Selection Area */}
          <div className="mb-6 p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 text-center hover:bg-gray-50 transition-colors relative">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-blue-50 rounded-full">
                <CloudArrowUpIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-blue-600">Nhấn để tải lên</span> hoặc kéo thả file vào đây
                <br />
                <span className="text-xs text-gray-400">Hỗ trợ định dạng .xlsx, .xls</span>
              </div>
              
              <input
                type="file"
                accept=".xlsx, .xls"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setExcelFile(f);
                    setExcelChecked(false);
                    setExcelSuccess(false);
                    setExcelErrors({});
                    setExcelRows([]);
                  }
                  e.target.value = null; 
                }}
              />
            </div>
          </div>

          {excelFile && (
            <div className="mb-6 flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-blue-100">
                  <DocumentIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <Typography variant="small" color="blue-gray" className="font-bold">
                    {excelFile.name}
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-500 text-xs">
                    {(excelFile.size / 1024).toFixed(2)} KB
                  </Typography>
                </div>
              </div>
              <IconButton variant="text" color="red" size="sm" onClick={() => {
                setExcelFile(null);
                setExcelChecked(false);
                setExcelSuccess(false);
                setExcelRows([]);
              }}>
                <TrashIcon className="h-4 w-4" />
              </IconButton>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
             <Typography variant="small" className="text-gray-500">
                Chưa có file mẫu? <span className="text-blue-600 cursor-pointer hover:underline font-medium" onClick={handleDownloadTemplate}>Tải về tại đây</span>
             </Typography>
          </div>

          {/* Status Messages */}
          {excelChecked && excelSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <Typography variant="small" color="green" className="font-bold">
                  Kiểm tra dữ liệu thành công!
                </Typography>
                <Typography variant="small" className="text-green-700">
                  Đã tìm thấy <b>{excelRows.length}</b> dòng dữ liệu hợp lệ. Nhấn "Lưu vào hệ thống" để tiến hành import.
                </Typography>
              </div>
            </div>
          )}

          {/* Error Display */}
          {excelChecked && !excelSuccess && Object.keys(excelErrors).length > 0 && (
            <div className="mb-4 border border-red-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center gap-2 text-red-700 font-medium">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span>Phát hiện lỗi trong file ({Object.keys(excelErrors).length} dòng)</span>
              </div>
              <div className="max-h-60 overflow-y-auto p-0">
                <ul className="divide-y divide-gray-100">
                  {Object.entries(excelErrors).map(([row, rowError]) => (
                    <li key={row} className="p-3 hover:bg-gray-50">
                      <div className="flex gap-2 text-sm">
                        <span className="font-bold text-gray-700 whitespace-nowrap">Dòng {row}:</span>
                        <ul className="list-disc list-inside text-red-600 flex-1">
                          {rowError.errors?.map((err, idx) => (
                            <li key={idx}>
                              <span className="font-medium text-gray-800">{err.column}:</span> {err.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {excelSuccess && excelRows.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-bold text-gray-700 text-xs uppercase tracking-wider">
                Xem trước dữ liệu ({excelRows.length} dòng)
              </div>
              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 border-b font-medium">Hợp đồng</th>
                      <th className="px-4 py-3 border-b font-medium">Trạm đầu</th>
                      <th className="px-4 py-3 border-b font-medium">Trạm cuối</th>
                      <th className="px-4 py-3 border-b font-medium">Core</th>
                      <th className="px-4 py-3 border-b font-medium">Đơn giá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {excelRows.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="bg-white hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-blue-600">{row.contractNumber}</td>
                        <td className="px-4 py-2">{row.nearSite}</td>
                        <td className="px-4 py-2">{row.farSite}</td>
                        <td className="px-4 py-2">{row.coreQuantity}</td>
                        <td className="px-4 py-2">{VND.format(row.cost)}</td>
                      </tr>
                    ))}
                    {excelRows.length > 10 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-center text-gray-500 italic bg-gray-50">
                          ... và {excelRows.length - 10} dòng khác ...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="border-t border-gray-100 bg-gray-50 px-4 py-3 flex justify-end gap-2 rounded-b-lg">
          <Button variant="text" color="blue-gray" onClick={handleOpenImport} className="normal-case">
            Hủy bỏ
          </Button>
          {!excelSuccess ? (
            <CustomButton 
              color="blue" 
              onClick={handleCheckExcelMulti}
              disabled={!excelFile}
              className="flex items-center gap-2"
            >
              <MagnifyingGlassIcon className="h-4 w-4" /> Kiểm tra dữ liệu
            </CustomButton>
          ) : (
            <CustomButton 
              color="green" 
              onClick={handleSaveExcelMulti}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ArrowDownTrayIcon className="h-4 w-4" />}
              {saving ? "Đang lưu..." : "Lưu vào hệ thống"}
            </CustomButton>
          )}
        </DialogFooter>
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
