import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import { DateTime } from "luxon";
import { CustomMenuList } from "../CustomList.jsx";
// import { contractDB } from "../../services/firebase/config.js";
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
} from "@material-tailwind/react";
import FoContractDocuments from "./FoContractDocuments";
import InfoCard from "./component/InfoCard.jsx";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid/index.js";
import { ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/outline"; // Optional Theme applied to the Data Grid
import { toast } from "react-toastify"; // Optional Theme applied to the Data Grid
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

  // ==== STATE QUẢN LÝ XÓA PDF ====== //
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
    console.log("delete", lineId);
    // sau này gọi API delete ở đây
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

  const confirmDeletePdf = async () => {
    if (!fileToDelete) return;

    try {
      setDeleting(true);
      await axiosInstance.delete(
        `/contract/${contractDetail.id}/pdf/${encodeURIComponent(fileToDelete)}`,
      );
      toast.success(`Đã xóa file: ${fileToDelete}`);
      // Update state to reflect deletion
      setPdfList((prev) => prev.filter((f) => f !== fileToDelete));
    } catch (err) {
      console.error(err);
      toast.error("Xóa file thất bại");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setFileToDelete(null);
    }
  };

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
    "Số core",
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
          <Button
            title={hasPdf ? "Xem văn bản hợp đồng" : "Chưa có văn bản PDF"}
            variant="text"
            size="sm"
            className={clsx(
              "p-2.5 transition-all duration-200",
              hasPdf
                ? "text-blue-500 hover:bg-blue-50"
                : "text-gray-400 cursor-not-allowed",
            )}
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              className="size-4"
              fill="currentColor" // ⭐ QUAN TRỌNG
            >
              <path d="M64 464l48 0 0 48-48 0c-35.3 0-64-28.7-64-64L0 64C0 28.7 28.7 0 64 0L229.5 0c17 0 33.3 6.7 45.3 18.7l90.5 90.5c12 12 18.7 28.3 18.7 45.3L384 304l-48 0 0-144-80 0c-17.7 0-32-14.3-32-32l0-80L64 48c-8.8 0-16 7.2-16 16l0 384c0 8.8 7.2 16 16 16zM176 352l32 0c30.9 0 56 25.1 56 56s-25.1 56-56 56l-16 0 0 32c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-48 0-80c0-8.8 7.2-16 16-16zm32 80c13.3 0 24-10.7 24-24s-10.7-24-24-24l-16 0 0 48 16 0zm96-80l32 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-32 0c-8.8 0-16-7.2-16-16l0-128c0-8.8 7.2-16 16-16zm32 128c8.8 0 16-7.2 16-16l0-64c0-8.8-7.2-16-16-16l-16 0 0 96 16 0zm80-112c0-8.8 7.2-16 16-16l48 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 32 32 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 48c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-64 0-64z" />
            </svg>
          </Button>
          <Button
            className="flex gap-1 p-1.5 transition-all duration-300"
            onClick={() => setShowEditDrawer(true)}
            variant="text"
            color="blue"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
              />
            </svg>
          </Button>
          <Chip
            variant="ghost"
            color={contractDetail.active ? "green" : "red"}
            className="ml-auto"
            size="sm"
            value={contractDetail.active ? "Còn hiệu lực" : "Đã thanh lý"}
            icon={
              <span
                className={clsx(
                  "mx-auto mt-1 block h-2 w-2 rounded-full content-['']",
                  contractDetail.active ? "bg-green-900" : "bg-red-900",
                )}
              />
            }
          />
        </div>

        {contractDetail.contractName && (
          <Typography variant="h6">{contractDetail.contractName}</Typography>
        )}
        <CardBody>
          <div className="mb-5 grid grid-cols-4 gap-2">
            <div className="col-span-4 lg:col-span-2 xl:col-span-1">
              <InfoCard
                header="Số tuyến cáp"
                content={contractDetail.hiredFoLineList.length}
              />
              <InfoCard
                header="Tổng số KM"
                content={`${totalKm.toFixed(2)} km`}
              />
            </div>
            <div className="col-span-4 lg:col-span-2 xl:col-span-1">
              <InfoCard
                header="Nhà cung cấp"
                content={contractDetail.transmissionOwner?.name || ""}
              />
              <InfoCard
                header="Tổng giá trị hợp đồng (trước thuế)"
                content={VND.format(totalAmountBeforeTax)}
              />
            </div>
            <div className="col-span-4 lg:col-span-2 xl:col-span-1">
              <InfoCard
                header="Ngày ký hợp đồng"
                content={DateTime.fromISO(contractDetail.signedDate)
                  .setLocale("vn")
                  .toFormat("dd-MM-yyyy")}
              />
              <InfoCard header="Thuế VAT %" content={VND.format(totalVat)} />
            </div>
            <div className="col-span-4 lg:col-span-2 xl:col-span-1">
              <InfoCard
                header="Ngày kết thúc hợp đồng"
                content={DateTime.fromISO(contractDetail.endDate)
                  .setLocale("vn")
                  .toFormat("dd-MM-yyyy")}
              />

              <InfoCard
                header="Tổng giá trị hợp đồng (sau thuế)"
                content={VND.format(totalAmountAfterTax)}
              />
            </div>
          </div>

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
                          <span
                            className={`inline-flex items-center ${
                              line.active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            } text-xs font-medium px-2.5 py-0.5 rounded-full`}
                          >
                            <span
                              className={`w-2 h-2 me-1 ${
                                line.active ? "bg-green-500" : "bg-red-500"
                              } rounded-full`}
                            ></span>
                            {line.active ? "Hoạt động" : "Không hoạt động"}
                          </span>
                        </td>
                        <td className="p-4 max-w-xs truncate">
                          <Typography variant="small">{line.note}</Typography>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center">
                            <IconButton
                              variant="text"
                              size="sm"
                              onClick={() => handleEdit(line.id)}
                            >
                              <PencilIcon className="h-4 w-4 text-gray-900" />
                            </IconButton>
                            <IconButton
                              variant="text"
                              size="sm"
                              onClick={() => handleDeleteRouter(line.id)}
                            >
                              <TrashIcon
                                strokeWidth={3}
                                className="h-4 w-4 text-gray-900"
                              />
                            </IconButton>
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
                cost: editLine.cost ?? 0,
                designedDistance: editLine.designedDistance ?? 0,
                finalDistance: editLine.finalDistance ?? 0,
                note: editLine.note || "",
              }}
              validationSchema={Yup.object({
                coreQuantity: Yup.number()
                  .moreThan(0, "Yêu cầu lớn hơn 0")
                  .required("Nhập số core"),
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

                    {/* CORE */}
                    <div className="flex flex-col gap-2">
                      <label className="text-slate-400 font-semibold">
                        Số core
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
    </>
  );
}

export default FoConTractDetail;
