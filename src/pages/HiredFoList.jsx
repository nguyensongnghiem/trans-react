import { useEffect, useMemo, useState, useRef } from "react";
import { DocumentIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import Select from "react-select";
import * as Yup from "yup";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
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
function HiredFoList() {
  // const navigate = useNavigate();
  const gridRef = useRef();
  const [simpleSiteList, setSimpleSiteList] = useState([]);
  const [hiredFoList, setHiredFoList] = useState([]);
  const [routerTypeList, setRouterTypeList] = useState([]);
  const [transmissionDeviceTypeList, setTransmissionDeviceTypeList] = useState([]);
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

  const [colDefs, setColDefs] = useState([
      {
        headerName: "Tên tuyến",
        valueGetter: (p) =>
          p.data.nearSite?.siteId + " - " + p.data.farSite?.siteId,
      },
      { headerName: "Khoảng cách", valueGetter: (p) => p.data.finalDistance },
      {
        headerName: "Số core",
        valueGetter: (p) => p.data.coreQuantity,
      },
      {
        headerName: "Đơn giá/km",
        valueGetter: (p) => p.data.cost,
      },
      {
        headerName: "Số hợp đồng",
        valueGetter: (p) => p.data.foContract.contractNumber,
        // cellRenderer: (p) => p.data.foContract.contractNumber,
      },
      // {
      //   headerName: "Tên hợp đồng",
      //   valueGetter: (p) => p.data.cost,
      //   cellRenderer: (p) => p.data.foContract.contractName,
      // },
      {
        headerName: "Trạng thái",
        valueGetter: (p) => p.data.active,
        cellRenderer: (p) => {
          return (
            <span className={`inline-flex items-center ${p.data.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300`}>
              <span className={`w-2 h-2 me-1 ${p.data.active ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></span>
              {p.data.active ? 'ON' : 'OFF'}
            </span>
          );
        },
      },
      { headerName: "Ghi chú", valueGetter: (p) => p.data.note },
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
            {/* <IconButton
              variant="text"
              size="sm"
              onClick={() => handleDeleteRouter(p.data.id)}
            >
              <TrashIcon strokeWidth={3} className="h-4 w-4 text-gray-900" />
            </IconButton> */}
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

  useEffect(() => {
    const getAllHiredFo = async () => {
      try {
        setIsLoading(true);
        const hiredFoList = await axiosInstance.get("hired-fos");
        setHiredFoList(hiredFoList.data);
      } catch (error) {
        console.log(error);
      } 
      finally {
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
        const transDeviceTypeList = await axiosInstance.get("transmission-device-types");
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
        prevState.filter((router) => router.id !== deleteId)
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
        form
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
        form
      );

      toast.success(
        `${res.data?.message || "Import thành công"} (HĐ: ${res.data?.totalContract || 0}, Tuyến: ${res.data?.totalLine || 0})`
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
  const VND = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  let deleteRouterName;
  if (deleteId != null) {
    deleteRouterName = hiredFoList.find((router) => router.id === deleteId).name;
    console.log(deleteRouterName);
  }

  // if (isLoading) return <Spinner />;
  const onBtnExport = () => {
    const columnDefs = gridRef.current.api.getColumnDefs();
    const rowData = [];
    gridRef.current.api.forEachNode(node => rowData.push(node.data));

    const dataToExport = rowData.map(node => {
      const row = {};
      columnDefs.forEach(colDef => {
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "HiredFo");
    XLSX.writeFile(workbook, "HiredFo.xlsx");
  };
  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <Typography variant="h4" color="blue-gray" className="mb-3">
          Danh sách FO thuê
        </Typography>
        <div className="flex gap-2">
          <Button
            variant="gradient"
            size="sm"
            className="mb-3 flex items-center gap-3"
            onClick={handleOpenImport}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Thêm mới
          </Button>
          <Button
            variant="gradient"
            size="sm"
            color="green"
            className="mb-3 flex items-center gap-3"
            onClick={onBtnExport}
          >
            Xuất Excel
          </Button>
        </div>
      </div>
      <div
        className="ag-theme-quartz" // applying the Data Grid theme
        style={{ height: "100vh", width: "100%" }} // the Data Grid will fill the size of the parent container
      >
        <AgGridReact
          ref={gridRef}
          rowData={hiredFoList}
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
                  <Button size="md" type="submit" color="red">
                    Thêm mới
                  </Button>
                </DialogFooter>
              </Form>
            )}
            {/* <img src={MySvg} alt="" className="flex-initial p-5" /> */}
          </Formik>
        </div>
      </Dialog>
      <Dialog open={importOpen} handler={handleOpenImport} size="lg">
        <div className="max-h-[90vh] overflow-y-auto p-3">
          <DialogHeader className="relative m-0 block">
            <Typography variant="h4" color="blue">
              Import nhiều hợp đồng + tuyến FO
            </Typography>
            <Typography className="mt-1 font-normal text-gray-600">
              Upload Excel → kiểm tra → preview → lưu DB
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
              <label className="text-slate-400 font-semibold">Chọn file Excel</label>
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
              <Button color="blue" type="button" onClick={handleCheckExcelMulti}>
                KIỂM TRA DỮ LIỆU
              </Button>

              <Button
                color="green"
                type="button"
                disabled={!excelSuccess || saving}
                onClick={handleSaveExcelMulti}
              >
                {saving ? "Đang lưu..." : "LƯU DATABASE"}
              </Button>
            </div>

            {/* Success */}
            {excelChecked && excelSuccess && (
              <div className="rounded border border-green-300 bg-green-50 p-3 text-green-700">
                ✔ File Excel hợp lệ. Có thể lưu DB.
              </div>
            )}

            {/* Error box */}
            {excelChecked && !excelSuccess && Object.keys(excelErrors).length > 0 && (
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
                    <div key={row} className="rounded border border-red-200 bg-white p-4">
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
                  }, {})
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
                              <td className="border px-2 py-1">{r.coreQuantity}</td>
                              <td className="border px-2 py-1">{r.designedDistance}</td>
                              <td className="border px-2 py-1">{r.finalDistance}</td>
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
          <DialogHeader className="relative m-0 block">
            <Typography variant="h4" color="blue">
              Cập nhật thông tin tuyến cáp
            </Typography>
            <Typography className="mt-1 font-normal text-gray-700">
              Cập nhật dữ liệu đảm bảo thực tế
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
              finalDistance: Yup.number().required("Yêu cầu nhập chiều dài tuyến thực tế"),
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
                          value={simpleSiteList.find((o) => o.id === values.nearSite?.id) || null}
                          onChange={(opt) => setFieldValue("nearSite.id", opt?.id || null)}
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
                          value={simpleSiteList.find((o) => o.id === values.farSite?.id) || null}
                          onChange={(opt) => setFieldValue("farSite.id", opt?.id || null)}
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
                <DialogFooter>
                  <Button size="md" type="submit" color="red">
                    Cập nhật dữ liệu
                  </Button>
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
          <Button
            variant="text"
            color="green"
            onClick={handleOpenDelete}
            className="mr-1"
          >
            <span>Hủy</span>
          </Button>
          <Button variant="gradient" color="red" onClick={handleDeleteSubmit}>
            <span>Xóa</span>
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
export default HiredFoList;
