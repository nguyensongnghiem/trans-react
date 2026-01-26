import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Dialog,
  Drawer,
  Button,
  Typography,
  IconButton,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Card,
  Switch,
} from "@material-tailwind/react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { TrashIcon } from "@heroicons/react/24/solid";

function FoContractEditDrawer({ id, onUpdated, onClose }) {
  const [contractData, setContractData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [owners, setOwners] = useState([]);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [pdfList, setPdfList] = useState([]);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const oldContractNumberRef = useRef();
  const formikRef = useRef(null);
  const axiosInstance = useAxiosPrivate();

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const [contractRes, ownersRes, pdfsRes] = await Promise.all([
          axiosInstance.get(`/contracts/${id}`),
          axiosInstance.get("/transmission-owner/all"),
          axiosInstance.get(`/contract/${id}/pdfs`),
        ]);

        const contract = contractRes.data;
        setContractData(contract);
        setOwners(ownersRes.data);
        setPdfList(pdfsRes.data || []);
        oldContractNumberRef.current = contract.contractNumber;
      } catch (err) {
        console.error("Load data error", err);
        toast.error("Không thể tải dữ liệu để chỉnh sửa.");
        onClose();
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id, axiosInstance, onClose]);

  const handleDeletePdf = (file) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  const confirmDeletePdf = async () => {
    if (!fileToDelete) return;
    try {
      setDeleting(true);
      await axiosInstance.delete(
        `/contract/${id}/pdf/${encodeURIComponent(fileToDelete)}`
      );
      toast.success(`Đã xóa file: ${fileToDelete}`);
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

  const handleUpdateContract = async (values) => {
    try {
      const oldNumber = oldContractNumberRef.current;
      const newNumber = values.contractNumber;

      if (oldNumber !== newNumber) {
        await axiosInstance.put(`/contract/${id}/change-number`, {
          contractNumber: newNumber,
        });
      }

      await axiosInstance.put(`/contract/${id}`, {
        contractNumber: values.contractNumber,
        contractName: values.contractName,
        signedDate: values.signedDate,
        endDate: values.endDate,
        active: values.active,
        note: values.note,
        transmissionOwnerId: values.transmissionOwnerId,
      });

      if (pdfFiles.length > 0) {
        const formData = new FormData();
        pdfFiles.forEach((file) => {
          formData.append("files", file);
        });
        await axiosInstance.post(
          `/contract/${values.id}/upload-pdfs`,
          formData
        );
      }

      toast.success("Cập nhật thành công");
      if (typeof onUpdated === "function") {
        onUpdated();
      }
    } catch (err) {
      console.error(err);
      toast.error("Cập nhật thất bại");
    }
  };

  if (isLoading || !contractData) {
    return (
      <Drawer open={true} onClose={onClose} placement="right" size={500}>
        <div className="flex items-center justify-center h-full">
          <p>Đang tải...</p>
        </div>
      </Drawer>
    );
  }

  return (
    <>
      <Drawer
        open={true}
        onClose={onClose}
        placement="right"
        className="p-0"
        size={500}
        dismiss={{ enabled: false }}
      >
        <Formik
          innerRef={formikRef}
          initialValues={{
            id: contractData.id,
            contractNumber: contractData.contractNumber,
            contractName: contractData.contractName,
            signedDate: contractData.signedDate,
            endDate: contractData.endDate,
            active: contractData.active,
            transmissionOwnerId: contractData.transmissionOwner?.id || "",
            note: contractData.note || "",
          }}
          enableReinitialize={true}
          onSubmit={handleUpdateContract}
          validationSchema={Yup.object({
            contractNumber: Yup.string().required("Yêu cầu nhập số hợp đồng"),
            contractName: Yup.string().required("Yêu cầu nhập tên hợp đồng"),
            signedDate: Yup.date().required("Yêu cầu nhập ngày ký hợp đồng"),
            endDate: Yup.string().required(
              "Yêu cầu nhập ngày kết thúc hợp đồng"
            ),
          })}
        >
          {({ values, setFieldValue, handleChange }) => (
            <Form className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <Typography variant="h4" color="blue">
                  Cập nhật hợp đồng
                </Typography>
                <IconButton variant="text" color="blue-gray" onClick={onClose}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </IconButton>
              </div>
              <div className="mb-5 px-4">
                <Typography
                  variant="small"
                  color="gray"
                  className="font-normal"
                >
                  Cập nhật thông tin cơ bản của hợp đồng
                </Typography>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
                <Card className="shadow-none p-2">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex justify-end gap-3 items-center">
                      <Typography variant="h6" className="text-blue-gray-600">
                        {values.active ? "Còn hiệu lực" : "Đã thanh lý"}
                      </Typography>
                      <Switch
                        checked={values.active}
                        color="green"
                        onChange={() => setFieldValue("active", !values.active)}
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-semibold">
                        Số hợp đồng
                      </label>
                      <Field
                        name="contractNumber"
                        placeholder="Nhập số hợp đồng"
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <ErrorMessage
                        className="text-sm italic text-red-500"
                        name="contractNumber"
                        component="span"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-semibold">
                        Tên hợp đồng
                      </label>
                      <Field
                        name="contractName"
                        placeholder="Nhập tên hợp đồng"
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <ErrorMessage
                        className="text-sm italic text-red-500"
                        name="contractName"
                        component="span"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-semibold">
                        Nhà cung cấp
                      </label>
                      <select
                        name="transmissionOwnerId"
                        value={values.transmissionOwnerId}
                        onChange={handleChange}
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5"
                      >
                        <option value="">-- Chọn nhà cung cấp --</option>
                        {owners.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 font-semibold">
                        Ngày ký
                      </label>
                      <Field
                        name="signedDate"
                        type="date"
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5"
                      />
                      <ErrorMessage
                        className="text-sm italic text-red-500"
                        name="signedDate"
                        component="span"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-semibold">
                        Ngày kết thúc
                      </label>
                      <Field
                        name="endDate"
                        type="date"
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5"
                      />
                      <ErrorMessage
                        className="text-sm italic text-red-500"
                        name="endDate"
                        component="span"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-semibold">
                        Văn bản hợp đồng
                      </label>
                      {pdfList.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {pdfList.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between rounded bg-blue-50 border border-blue-200 px-3 py-2 text-sm"
                            >
                              <span className="truncate text-blue-gray-800">
                                📄 {file}
                              </span>
                              <button
                                type="button"
                                className="ml-2 text-red-500 hover:text-red-700"
                                onClick={() => handleDeletePdf(file)}
                                title={`Xóa file ${file}`}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <label className="text-slate-400 font-semibold mt-4 block">
                        Tải lên file mới
                      </label>
                      <input
                        type="file"
                        accept="application/pdf"
                        multiple
                        className="mt-1 w-full cursor-pointer rounded border bg-white text-sm file:mr-4 file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-gray-600"
                        onChange={(e) => {
                          const selectedFiles = Array.from(
                            e.target.files || []
                          );
                          setPdfFiles((prev) => [
                            ...prev,
                            ...selectedFiles.filter(
                              (f) => !prev.some((p) => p.name === f.name)
                            ),
                          ]);
                          e.target.value = null;
                        }}
                      />

                      {pdfFiles.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {pdfFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between rounded bg-green-100 px-3 py-2 text-sm"
                            >
                              <span className="truncate">📄 {file.name}</span>
                              <button
                                type="button"
                                className="ml-2 text-red-500 hover:text-red-700"
                                onClick={() =>
                                  setPdfFiles((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  )
                                }
                              >
                                ❌
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-slate-400 font-semibold">
                        Ghi chú
                      </label>
                      <Field
                        as="textarea"
                        name="note"
                        rows={3}
                        placeholder="Nhập ghi chú"
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                </Card>
              </div>

              <div className="border-t border-gray-200 p-4 flex justify-end">
                <Button size="md" type="submit" color="red">
                  Cập nhật dữ liệu
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </Drawer>

      {/* PDF Delete Modal */}
      <Dialog
        open={showDeleteModal}
        handler={() => setShowDeleteModal(false)}
        size="xs"
      >
        <DialogHeader>Xác nhận xóa file</DialogHeader>
        <DialogBody>
          Bạn có chắc chắn muốn xóa file:{" "}
          <span className="font-bold break-all">{fileToDelete}</span>?
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="blue-gray"
            onClick={() => setShowDeleteModal(false)}
            className="mr-1"
            disabled={deleting}
          >
            <span>Hủy</span>
          </Button>
          <Button
            variant="gradient"
            color="red"
            onClick={confirmDeletePdf}
            disabled={deleting}
          >
            <span>{deleting ? "Đang xóa..." : "Xóa"}</span>
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

export default FoContractEditDrawer;
