import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import { DateTime } from "luxon";
import { CustomMenuList } from "../CustomList.jsx";
import { clsx } from "clsx";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Drawer,
  IconButton,
  Switch,
  Typography,
  Tooltip,
} from "@material-tailwind/react";
import {
  DocumentTextIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  MapIcon,
  HashtagIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import FoContractDocuments from "./FoContractDocuments";
import InfoCard from "./component/InfoCard.jsx";
import StatusChip from "../../components/StatusChip";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import { toast } from "react-toastify";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import FoContractEditDrawer from "./FoContractEditDrawer.jsx";
import "../../Styles/aggrid.css";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
function FoConTractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contractDetail, setContractDetail] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const axiosInstance = useAxiosPrivate();
  const VND = useMemo(
    () =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }),
    [],
  );
  const [openEditLine, setOpenEditLine] = useState(false);
  const [editLine, setEditLine] = useState(null);
  const [showEditDrawer, setShowEditDrawer] = useState(false);

  // ==== STATE QUẢN LÝ XÓA LINE ====== //
  const [showDeleteLineModal, setShowDeleteLineModal] = useState(false);
  const [lineToDelete, setLineToDelete] = useState(null);
  const [deletingLine, setDeletingLine] = useState(false);

  const handleEdit = useCallback(
    async (lineId) => {
      try {
        const res = await axiosInstance.get(`/hired-fos/${lineId}`);
        setEditLine(res.data);
        setOpenEditLine(true);
      } catch (err) {
        console.log(err);
        toast.error("Không load được dữ liệu tuyến FO");
      }
    },
    [axiosInstance],
  );

  const handleDeleteRouter = async (lineId) => {
    const line = contractDetail.hiredFoLineList.find((l) => l.id === lineId);
    setLineToDelete(line);
    setShowDeleteLineModal(true);
  };

  const confirmDeleteLine = async () => {
    if (!lineToDelete) return;

    try {
      setDeletingLine(true);
      await axiosInstance.delete(`/hired-fos/${lineToDelete.id}`);
      toast.success("Đã xóa tuyến cáp thành công");
      await loadContract(); // Refresh data
    } catch (err) {
      console.error(err);
      toast.error("Xóa tuyến cáp thất bại");
    } finally {
      setDeletingLine(false);
      setShowDeleteLineModal(false);
      setLineToDelete(null);
    }
  };

  const whiteSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "white",
      color: "black",
      borderColor: state.isFocused ? "#93c5fd" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(147,197,253,0.5)" : "none",
    }),
    singleValue: (base) => ({ ...base, color: "black" }),
    input: (base) => ({ ...base, color: "black" }),
    menu: (base) => ({ ...base, backgroundColor: "white", color: "black" }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#f3f4f6" : "white",
      color: "black",
    }),
  };

  const [openDocuments, setOpenDocuments] = useState(false);

  const totalKm = useMemo(() => {
    if (!contractDetail?.hiredFoLineList) return 0;

    return contractDetail.hiredFoLineList.reduce(
      (sum, item) => sum + (item.finalDistance || 0),
      0,
    );
  }, [contractDetail]);

  const totalAmountBeforeTax = useMemo(() => {
    if (!contractDetail?.hiredFoLineList) return 0;

    return contractDetail.hiredFoLineList.reduce(
      (sum, item) => sum + (item.cost || 0) * (item.finalDistance || 0),
      0,
    );
  }, [contractDetail]);

  const totalVat = useMemo(() => {
    return totalAmountBeforeTax * 0.1;
  }, [totalAmountBeforeTax]);

  const totalAmountAfterTax = useMemo(() => {
    return totalAmountBeforeTax + totalVat;
  }, [totalAmountBeforeTax, totalVat]);

  // ==== STATE Up file PDF ====== //
  const [pdfFiles, setPdfFiles] = useState([]);

  // ==== STATE QUẢN LÝ PDF ====== //
  const [pdfList, setPdfList] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const loadPdfList = async (contractId) => {
    try {
      const res = await axiosInstance.get(`/contract/${contractId}/pdfs`);
      setPdfList(res.data);
    } catch (err) {
      console.error("Load pdf list error", err);
    }
  };
  useEffect(() => {
    // 🔴 RESET TRƯỚC
    setPdfList([]);
    if (contractDetail?.id) {
      loadPdfList(contractDetail.id);
    }
  }, [contractDetail?.id]);

  // ==== Lưu số hợp đồng cũ ====== //
  // ==== Refresh web ====== //
  const loadContract = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(`/contracts/${id}`);
      setContractDetail({ ...res.data }); // tạo reference mới
    } catch (err) {
      console.error("Load contract error", err);
    } finally {
      setIsLoading(false);
    }
  }, [axiosInstance, id]);

  useEffect(() => {
    loadContract();
  }, [id]);

  const [simpleSiteList, setSimpleSiteList] = useState([]);

  useEffect(() => {
    const loadSites = async () => {
      try {
        const res = await axiosInstance.get("/sites/simple-list");
        setSimpleSiteList(res.data);
      } catch (e) {
        console.log(e);
        toast.error("Không load được danh sách site");
      }
    };
    loadSites();
  }, [axiosInstance]);

  const handleEditLineSubmit = useCallback(
    async (values) => {
      try {
        const payload = {
          id: values.id,
          coreQuantity: Number(values.coreQuantity),
          hiredCoreQuantity: Number(values.hiredCoreQuantity),
          usedCoreQuantity: Number(values.usedCoreQuantity),
          cost: Number(values.cost),
          designedDistance: Number(values.designedDistance || 0),
          finalDistance: Number(values.finalDistance || 0),
          active: !!values.active,
          note: values.note || "",
          nearSite: { id: Number(values.nearSite.id) },
          farSite: { id: Number(values.farSite.id) },
          foContract: { id: Number(contractDetail.id) },
        };

        await axiosInstance.put(`/hired-fos/${values.id}`, payload);
        toast.success("Cập nhật tuyến FO thành công");

        setOpenEditLine(false);
        setEditLine(null);

        await loadContract();
      } catch (err) {
        console.log(err);
        toast.error(
          err?.response?.data?.message || "Cập nhật tuyến FO thất bại",
        );
      }
    },
    [axiosInstance, contractDetail?.id, loadContract],
  );

  if (!contractDetail) return <p>Không có thông tin </p>;

  const hasPdf = (pdfList?.length ?? 0) > 0;

  const TABLE_HEAD = [
    "STT",
    "Tên tuyến",
    "Tỉnh",
    "Khoảng cách (km)",
    "Số core cáp",
    "Số core Thuê",
    "Số core sử dụng",
    "Đơn giá/km",
    "Thành tiền/Tháng",
    "Trạng thái",
    "Ghi chú",
    "Tác động",
  ];

  return (
    <>
      <div className="p-6 bg-gray-50 min-h-screen">
        <Button
          variant="text"
          className="flex items-center gap-2 mb-2 w-fit pl-0 hover:bg-transparent"
          onClick={() => navigate(-1)}
        >
          <ChevronLeftIcon className="h-4 w-4" /> Quay lại
        </Button>

        <div className="mb-3 flex items-center justify-start gap-2 border-b">
          <div className="flex items-center gap-1 border-b-2 border-blue-600 pb-1 pr-1 uppercase text-blue-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-4"
            >
              <path
                fillRule="evenodd"
                d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z"
                clipRule="evenodd"
              />
              <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
            </svg>
            <Typography variant="h6" className="font-semibold">
              {contractDetail.contractNumber}
            </Typography>
          </div>
          <Tooltip
            content={hasPdf ? "Xem văn bản hợp đồng" : "Chưa có văn bản PDF"}
          >
            <IconButton
              variant="text"
              color="blue-gray"
              disabled={!hasPdf}
              onClick={() => {
                if (!hasPdf) {
                  toast.info(
                    "Hợp đồng chưa có văn bản PDF. Vui lòng cập nhập dữ liệu!",
                  );
                  return;
                }
                setOpenDocuments(true);
              }}
            >
              <DocumentTextIcon className="h-5 w-5" />
            </IconButton>
          </Tooltip>
          <Tooltip content="Chỉnh sửa thông tin hợp đồng">
            <IconButton
              variant="text"
              color="blue-gray"
              onClick={() => setShowEditDrawer(true)}
            >
              <PencilIcon className="h-5 w-5" />
            </IconButton>
          </Tooltip>
          <StatusChip
            active={contractDetail.active}
            labelOn="Còn hiệu lực"
            labelOff="Đã thanh lý"
          />
        </div>

        {contractDetail.contractName && (
          <Typography variant="h6">{contractDetail.contractName}</Typography>
        )}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoCard
              header="Số tuyến cáp"
              content={contractDetail.hiredFoLineList.length}
              icon={<HashtagIcon className="h-5 w-5" />}
              color="blue"
            />
            <InfoCard
              header="Tổng số KM"
              content={`${totalKm.toFixed(2)} km`}
              icon={<MapIcon className="h-5 w-5" />}
              color="teal"
            />
            <InfoCard
              header="Nhà cung cấp"
              content={contractDetail.transmissionOwner?.name || ""}
              icon={<BuildingOfficeIcon className="h-5 w-5" />}
              color="purple"
            />
            <InfoCard
              header="Giá trị (trước thuế)"
              content={VND.format(totalAmountBeforeTax)}
              icon={<CurrencyDollarIcon className="h-5 w-5" />}
              color="green"
            />
            <InfoCard
              header="Ngày ký hợp đồng"
              content={DateTime.fromISO(contractDetail.signedDate)
                .setLocale("vn")
                .toFormat("dd-MM-yyyy")}
              icon={<CalendarDaysIcon className="h-5 w-5" />}
              color="blue"
            />
            <InfoCard
              header="Ngày kết thúc"
              content={DateTime.fromISO(contractDetail.endDate)
                .setLocale("vn")
                .toFormat("dd-MM-yyyy")}
              icon={<CalendarDaysIcon className="h-5 w-5" />}
              color="amber"
            />
            <InfoCard
              header="Thuế VAT (10%)"
              content={VND.format(totalVat)}
              icon={<DocumentTextIcon className="h-5 w-5" />}
              color="purple"
            />
            <InfoCard
              header="Tổng giá trị (sau thuế)"
              content={VND.format(totalAmountAfterTax)}
              icon={<CurrencyDollarIcon className="h-5 w-5" />}
              color="green"
            />
          </div>
        </div>

        <CardBody>
          <div className="mt-8">
            <Typography variant="h5" color="blue-gray" className="mb-4">
              Danh sách tuyến cáp
            </Typography>
            <Card className="w-full overflow-hidden border border-gray-200 shadow-sm rounded-xl">
              <div className="overflow-auto max-h-[60vh]">
                <table className="w-full min-w-max table-auto text-left">
                  <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-sm border-b border-gray-200">
                    <tr>
                      {TABLE_HEAD.map((head) => (
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
                    {contractDetail.hiredFoLineList.map((line, index) => (
                      <tr
                        key={line.id}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="p-4">
                          <Typography variant="small">{index + 1}</Typography>
                        </td>
                        <td className="p-4">
                          <Typography variant="small" className="font-bold">
                            {line.nearSite?.siteId} - {line.farSite?.siteId}
                          </Typography>
                        </td>
                        <td className="p-4">
                          <Typography variant="small">
                            {line.nearSite?.province?.name || ""}
                          </Typography>
                        </td>
                        <td className="p-4">
                          <Typography variant="small">
                            {line.finalDistance}
                          </Typography>
                        </td>
                        <td className="p-4">
                          <Typography variant="small">
                            {line.coreQuantity}
                          </Typography>
                        </td>
                        <td className="p-4">
                          <Typography variant="small">
                            {line.hiredCoreQuantity}
                          </Typography>
                        </td>
                        <td className="p-4">
                          <Typography variant="small">
                            {line.usedCoreQuantity}
                          </Typography>
                        </td>
                        <td className="p-4">
                          <Typography variant="small">
                            {VND.format(line.cost || 0)}
                          </Typography>
                        </td>
                        <td className="p-4">
                          <Typography variant="small">
                            {VND.format(
                              (line.cost || 0) * (line.finalDistance || 0),
                            )}
                          </Typography>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center">
                            <StatusChip
                              active={line.active}
                              labelOn="Hoạt động"
                              labelOff="Không hoạt động"
                            />
                          </div>
                        </td>
                        <td className="p-4 max-w-xs truncate">
                          <Typography variant="small">{line.note}</Typography>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1">
                            <Tooltip content="Chỉnh sửa">
                              <IconButton
                                variant="text"
                                size="sm"
                                color="blue-gray"
                                onClick={() => handleEdit(line.id)}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip content="Xóa">
                              <IconButton
                                variant="text"
                                size="sm"
                                color="red"
                                onClick={() => handleDeleteRouter(line.id)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {contractDetail.hiredFoLineList.length === 0 && (
                      <tr>
                        <td
                          colSpan={TABLE_HEAD.length}
                          className="p-4 text-center"
                        >
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-normal"
                          >
                            Hợp đồng này chưa có tuyến cáp nào.
                          </Typography>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </CardBody>
      </div>
      {/* ===== MODAL VĂN BẢN HỢP ĐỒNG (Thay thế Drawer) ===== */}
      <Dialog
        open={openDocuments}
        handler={() => setOpenDocuments(false)}
        size="xl"
        className="flex flex-col h-[90vh]"
      >
        <DialogHeader className="justify-between border-b">
          <Typography variant="h4" color="blue">
            📄 Văn bản hợp đồng
          </Typography>
          <IconButton
            variant="text"
            color="blue-gray"
            onClick={() => setOpenDocuments(false)}
          >
            <XMarkIcon strokeWidth={2} className="h-5 w-5" />
          </IconButton>
        </DialogHeader>
        <DialogBody className="flex-1 p-0 overflow-hidden">
          <FoContractDocuments contractId={contractDetail.id} />
        </DialogBody>
      </Dialog>
      <Dialog
        open={openEditLine}
        handler={() => setOpenEditLine(false)}
        size="sm"
      >
        <div className="max-h-[90vh] overflow-y-auto p-3">
          <DialogHeader className="relative m-0 block">
            <Typography variant="h4" color="blue">
              Cập nhật tuyến FO
            </Typography>
            <IconButton
              size="sm"
              variant="text"
              className="!absolute right-3.5 top-3.5"
              onClick={() => setOpenEditLine(false)}
            >
              ✖
            </IconButton>
          </DialogHeader>

          {editLine && (
            <Formik
              enableReinitialize
              initialValues={{
                id: editLine.id,
                active: editLine.active ?? true,

                // nearSite / farSite phải là object theo DTO
                nearSite: { id: editLine.nearSite?.id || "" },
                farSite: { id: editLine.farSite?.id || "" },

                coreQuantity: editLine.coreQuantity ?? 1,
                hiredCoreQuantity: editLine.hiredCoreQuantity ?? 1,
                usedCoreQuantity: editLine.usedCoreQuantity ?? 0,
                cost: editLine.cost ?? 0,
                designedDistance: editLine.designedDistance ?? 0,
                finalDistance: editLine.finalDistance ?? 0,
                note: editLine.note || "",
              }}
              validationSchema={Yup.object({
                coreQuantity: Yup.number()
                  .min(0, ">= 0")
                  .required("Nhập số core cáp"),
                hiredCoreQuantity: Yup.number()
                  .min(0, ">= 0")
                  .required("Nhập số core thuê"),
                usedCoreQuantity: Yup.number()
                  .min(0, ">= 0")
                  .required("Nhập số core sử dụng"),
                nearSite: Yup.object({
                  id: Yup.string().required("Chọn Site A"),
                }),
                farSite: Yup.object({
                  id: Yup.string().required("Chọn Site B"),
                }),
                cost: Yup.number().min(0, ">= 0").required("Nhập đơn giá"),
                finalDistance: Yup.number()
                  .min(0, ">= 0")
                  .required("Nhập chiều dài thực tế"),
              })}
              onSubmit={async (values) => {
                try {
                  const payload = {
                    id: values.id,
                    coreQuantity: Number(values.coreQuantity),
                    hiredCoreQuantity: Number(values.hiredCoreQuantity),
                    usedCoreQuantity: Number(values.usedCoreQuantity),
                    cost: Number(values.cost),
                    designedDistance: Number(values.designedDistance || 0),
                    finalDistance: Number(values.finalDistance || 0),
                    active: !!values.active,
                    note: values.note || "",

                    nearSite: { id: Number(values.nearSite.id) },
                    farSite: { id: Number(values.farSite.id) },

                    // 🔥 đảm bảo contract luôn đúng
                    foContract: { id: Number(contractDetail.id) },
                  };

                  await axiosInstance.put(`/hired-fos/${values.id}`, payload);

                  toast.success("Cập nhật tuyến FO thành công");
                  setOpenEditLine(false);
                  setEditLine(null);

                  // ✅ refresh UI ngay
                  await loadContract();
                } catch (err) {
                  console.log(err);
                  toast.error(
                    err?.response?.data?.message || "Cập nhật thất bại",
                  );
                }
              }}
            >
              {({ values, setFieldValue }) => (
                <Form>
                  <DialogBody className="space-y-4 pb-6">
                    {/* ACTIVE */}
                    <div className="flex justify-end">
                      <Switch
                        checked={values.active}
                        color="green"
                        label={
                          <Typography variant="h6">
                            {values.active
                              ? "Đang hoạt động"
                              : "Không hoạt động"}
                          </Typography>
                        }
                        onChange={(e) =>
                          setFieldValue("active", e.target.checked)
                        }
                      />
                    </div>

                    {/* SITE A */}
                    <div className="flex flex-col gap-2">
                      <label className="text-slate-400 font-semibold">
                        Site A
                      </label>

                      <Select
                        value={
                          simpleSiteList.find(
                            (s) => s.id === Number(values.nearSite.id),
                          ) || null
                        }
                        onChange={(opt) => setFieldValue("nearSite.id", opt.id)}
                        options={simpleSiteList}
                        getOptionLabel={(opt) => opt.siteId}
                        getOptionValue={(opt) => String(opt.id)}
                        placeholder="Chọn Site A"
                        styles={whiteSelectStyles} // ✅ đổi nền trắng chữ đen
                        components={{ MenuList: CustomMenuList }}
                      />

                      <ErrorMessage
                        name="nearSite.id"
                        component="span"
                        className="text-sm italic text-red-500"
                      />
                    </div>

                    {/* SITE B */}
                    <div className="flex flex-col gap-2">
                      <label className="text-slate-400 font-semibold">
                        Site B
                      </label>

                      <Select
                        value={
                          simpleSiteList.find(
                            (s) => s.id === Number(values.farSite.id),
                          ) || null
                        }
                        onChange={(opt) => setFieldValue("farSite.id", opt.id)}
                        options={simpleSiteList}
                        getOptionLabel={(opt) => opt.siteId}
                        getOptionValue={(opt) => String(opt.id)}
                        placeholder="Chọn Site B"
                        styles={whiteSelectStyles} // ✅ đổi nền trắng chữ đen
                        components={{ MenuList: CustomMenuList }}
                      />

                      <ErrorMessage
                        name="farSite.id"
                        component="span"
                        className="text-sm italic text-red-500"
                      />
                    </div>

                    {/* CORES */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Số core cáp
                        </label>
                        <Field
                          name="coreQuantity"
                          type="number"
                          className="rounded border border-gray-300 bg-white text-black px-2 py-1"
                        />
                        <ErrorMessage
                          name="coreQuantity"
                          component="span"
                          className="text-sm italic text-red-500"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Số core Thuê
                        </label>
                        <Field
                          name="hiredCoreQuantity"
                          type="number"
                          className="rounded border border-gray-300 bg-white text-black px-2 py-1"
                        />
                        <ErrorMessage
                          name="hiredCoreQuantity"
                          component="span"
                          className="text-sm italic text-red-500"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-slate-400 font-semibold">
                          Số core sử dụng
                        </label>
                        <Field
                          name="usedCoreQuantity"
                          type="number"
                          className="rounded border border-gray-300 bg-white text-black px-2 py-1"
                        />
                        <ErrorMessage
                          name="usedCoreQuantity"
                          component="span"
                          className="text-sm italic text-red-500"
                        />
                      </div>
                    </div>

                    {/* FINAL DIST */}
                    <div className="flex flex-col gap-2">
                      <label className="text-slate-400 font-semibold">
                        Chiều dài thực tế (km)
                      </label>
                      <Field
                        name="finalDistance"
                        type="number"
                        className="rounded border border-gray-300 bg-white text-black px-2 py-1"
                      />
                      <ErrorMessage
                        name="finalDistance"
                        component="span"
                        className="text-sm italic text-red-500"
                      />
                    </div>

                    {/* COST */}
                    <div className="flex flex-col gap-2">
                      <label className="text-slate-400 font-semibold">
                        Đơn giá (VNĐ/km)
                      </label>
                      <Field
                        name="cost"
                        type="number"
                        className="rounded border border-gray-300 bg-white text-black px-2 py-1"
                      />
                      <ErrorMessage
                        name="cost"
                        component="span"
                        className="text-sm italic text-red-500"
                      />
                    </div>

                    {/* NOTE */}
                    <div className="flex flex-col gap-2">
                      <label className="text-slate-400 font-semibold">
                        Ghi chú
                      </label>
                      <Field
                        as="textarea"
                        name="note"
                        rows={3}
                        className="rounded border border-gray-300 bg-white text-black px-2 py-1"
                      />
                    </div>
                  </DialogBody>

                  <DialogFooter>
                    <Button
                      variant="text"
                      onClick={() => setOpenEditLine(false)}
                    >
                      Đóng
                    </Button>
                    <Button color="red" type="submit">
                      Cập nhật
                    </Button>
                  </DialogFooter>
                </Form>
              )}
            </Formik>
          )}
        </div>
      </Dialog>

      {/* Drawer Edit Contract (Khi dùng ở chế độ Page) */}
      {showEditDrawer && (
        <FoContractEditDrawer
          id={id}
          onClose={() => setShowEditDrawer(false)}
          onUpdated={() => {
            loadContract();
          }}
        />
      )}

      {/* Delete Line Confirmation Modal */}
      <DeleteConfirmationModal
        open={showDeleteLineModal}
        handler={() => setShowDeleteLineModal(false)}
        onConfirm={confirmDeleteLine}
        itemName={
          lineToDelete
            ? `${lineToDelete.nearSite?.siteId} - ${lineToDelete.farSite?.siteId}`
            : ""
        }
        title="Xác nhận xóa tuyến cáp"
        message="Bạn có chắc chắn muốn xóa tuyến cáp này? Hành động này không thể hoàn tác."
        confirmText="Xóa tuyến cáp"
        deleting={deletingLine}
      />
    </>
  );
}

export default FoConTractDetail;
