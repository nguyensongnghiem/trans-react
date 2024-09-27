import { useEffect, useMemo, useState } from "react";
import { DocumentIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";

import * as siteService from "../services/SiteService";
import { fetchData } from "../services/apiService";
import * as transOwnerService from "../services/TransmissionOwnerService";
import * as siteTransmissionTypeService from "../services/SiteTransmissionTypeService";
import * as provinceService from "../services/ProvinceService";
import * as Yup from "yup";
import * as siteOwnerService from "../services/SiteOwnerService";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { NavLink, useNavigate } from "react-router-dom";
import OwnerChip from "../components/OwnerChip";
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import { Button, MenuItem, Option, Select, Input, Card, Dialog, Textarea, IconButton, Typography, DialogBody, DialogHeader, DialogFooter, Spinner, Chip, Badge, } from "@material-tailwind/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Modal from "react-modal";


function SiteList2() {

  const [colDefs, setColDefs] = useState([
    { headerName: "Tỉnh", valueGetter: site => site.data.province?.name },
    { headerName: "Site ID", valueGetter: site => site.data.siteId },
    {
      headerName: "Truyền dẫn trạm",
      valueGetter: site => site.data.siteTransmissionType?.name,
      cellRenderer: site => {
        return (
          <div className="flex items-center justify-start gap-2">
            <span className="flex-1">{site.data.siteTransmissionType?.name}</span>
            <OwnerChip name={site.data.transmissionOwner?.name} className="flex-1"></OwnerChip>
          </div>
        )
      }
    },
    { headerName: "Site ID khác", valueGetter: site => site.data.siteId2 },
    // { headerName: "Tên trạm", valueGetter: site => site.data.siteName },
    { headerName: "Vĩ độ", valueGetter: site => site.data.latitude, valueFormatter: p => p.value.toFixed(3) },
    { headerName: "Kinh độ", valueGetter: site => site.data.longitude, valueFormatter: p => p.value.toFixed(3) },
    { headerName: "Ghi chú", valueGetter: site => site.data.note},
    
    {
      headerName: "Tác động",
      cellRenderer: (p) => <div className="flex items-center justify-center">
        <IconButton
          variant="text"
          size="sm"
          onClick={() => handleEdit(p.data.id)}
        >
          <PencilIcon className="h-4 w-4 text-gray-900" />
        </IconButton>
        <IconButton
          variant="text"
          size="sm"
          onClick={() => openModal(p.data.id)}
        >
          <TrashIcon
            strokeWidth={3}
            className="h-4 w-4 text-gray-900"
          />
        </IconButton>
      </div>
    },
  ]);
  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
      sortable: true,
      filter: true,
      floatingFilter: true,
    };
  })
  const navigate = useNavigate();
  const [siteList, setSiteList] = useState({});
  const [siteListFull, setSiteListFull] = useState([]);
  const [transmissionOwnerList, setTransmissionOwnerList] = useState([]);
  const [siteTransmissionTypeList, setSiteTransmissionTypeList] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [searchTerm, setSearchTerm] = useState({
    siteId: "",
    transOwner: "",
    transType: "",
    province: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [siteOwnerList, setSiteOwnerList] = useState([]);
  const [editSite, setEditSite] = useState({});
  const [editId, setEditId] = useState(null);

  Modal.setAppElement("#root");

  let deleteSiteId;

  useEffect(() => {
    const getAllSites = async () => {
      const sites = await siteService.searchSites(
        page,
        searchTerm.siteId,
        searchTerm.transOwner,
        searchTerm.transType,
        searchTerm.province
      );
      setSiteList(sites);
      setIsLoading(false);
    };
    getAllSites();
  }, [page, searchTerm]);

  useEffect(() => {
    const getAllSiteFull = async () => {
      setIsLoading(true);
      const sites = await fetchData('sites')
      setSiteListFull(sites);
      console.log(sites);

      setIsLoading(false);
    };
    getAllSiteFull();
  }, []);

  useEffect(() => {
    const getAllSiteOwner = async () => {
      const siteOwnerList = await siteOwnerService.getAll();
      setSiteOwnerList(siteOwnerList);
    };
    getAllSiteOwner();
  }, []);

  useEffect(() => {
    const getAllTransmissionOwner = async () => {
      const transOwnerList = await transOwnerService.getAll();
      setTransmissionOwnerList(transOwnerList);
    };
    getAllTransmissionOwner();
  }, []);

  useEffect(() => {
    const getAllProvince = async () => {
      const provinces = await provinceService.getAll();
      setProvinces(provinces);
    };
    getAllProvince();
  }, []);

  useEffect(() => {
    const getAllSiteTransmissionType = async () => {
      const siteTransTypeList = await siteTransmissionTypeService.getAll();
      setSiteTransmissionTypeList(siteTransTypeList);
    };
    getAllSiteTransmissionType();
  }, []);

  const getSiteById = async (editId) => {
    const site = await siteService.getSiteById(editId);
    setEditSite({ ...site });
    console.log(site);
  };
  const handleCreate = async (site, { setErrors }) => {
    site.latitude = +site.latitude;
    site.longitude = +site.longitude;
    await siteService.saveSite(site, setErrors);
    setOpenCreate(!openCreate);
  };

  const onSearchSubmit = async (value) => {
    console.log(value);
    setSearchTerm(value);
    setPage(0);
 
    setIsLoading(false);
  };

  // Modal function
  function openModal(id) {
    setDeleteId(id);
    setIsOpen(true);
  }

  function afterOpenModal() { }

  function closeModal() {
    setDeleteId(null);
    setIsOpen(false);
  }
  const deleteSite = async (id) => {
    const result = await siteService.deleteSite(id);
    getAllSites();
    closeModal();
  };

  const handleOpenCreate = () => {
    setOpenCreate(!openCreate);
  };
  const handleEdit = async (editId) => {
    await getSiteById(editId);
    handleOpenEdit();
  };

  const handleOpenEdit = () => {
    setOpenEdit(!openEdit);
  };

  const handleEditSubmit = async (site, { setErrors }) => {
    site.latitude = +site.latitude;
    site.longitude = +site.longitude;
    await siteService.saveSite(site, setErrors);
    await getAllSites();
    setOpenEdit(!openEdit);
  };

  if (deleteId != null) {
    deleteSiteId = siteList.content.find((site) => site.id === deleteId).siteId;
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

  if (isLoading) return <Spinner />;
  return (
    <div className="px-3">

      <Typography variant="h4" color="blue-gray" className="mb-3">
        Danh sách trạm
      </Typography>
      <Button
        variant="gradient"
        size="sm"
        className="mb-3 flex items-center gap-3"
        onClick={handleOpenCreate}
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
      <div
        className="ag-theme-quartz " // applying the Data Grid theme
        style={{ height: '100vh', width: "100%" }} // the Data Grid will fill the size of the parent container
      >
        <AgGridReact
          rowData={siteListFull}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={20}
          className="overflow-x-auto"
        />
      </div>

  
      <Modal
        isOpen={isOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        contentLabel="Example Modal"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-lg bg-white p-8 shadow-lg"
      >
        <h2
          className="mb-3 text-lg font-bold text-red-500"
          ref={(_subtitle) => (subtitle = _subtitle)}
        >
          Xóa thông tin
        </h2>
        <p className="mb-3">
          Xác nhận xóa trạm {deleteSiteId} khỏi cơ sở dữ liệu ?
        </p>
        <div className="mt-3 flex justify-end gap-3">
          <button
            onClick={closeModal}
            className="bg-slate-500 hover:bg-slate-600 inline-block rounded-sm px-2 py-1 font-semibold text-white shadow-md hover:cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={() => deleteSite(deleteId)}
            className="inline-block rounded-sm bg-red-500 px-2 py-1 font-semibold text-white shadow-md hover:cursor-pointer hover:bg-red-600"
          >
            Xóa dữ liệu
          </button>
        </div>
      </Modal>

      {/* Modal Thêm mới */}
      <Dialog
        open={openCreate}
        handler={handleOpenCreate}
        className="overflow-hidden"
        dismiss="false"
        size="sm"
      >
        <div className="max-h-[90vh] overflow-y-auto p-3">
          <DialogHeader className="relative m-0 block">
            <Typography variant="h4" color="blue">
              Thêm mới trạm
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
            }}
            validationSchema={Yup.object(validate)}
          >
            <Form className="flex flex-initial flex-shrink flex-col">
              <DialogBody className="space-y-4 pb-6">
                <Card className="shadow-none">
                  <div className="grid grid-cols-12 gap-3 p-2">
                    {/* <p className="col-span-full mt-5 text-xl text-blue-600">Thông tin cơ bản</p> */}
                    <div className="col-span-full flex flex-col gap-2 md:col-span-12 lg:col-span-6">
                      <label className="text-slate-400 font-semibold">
                        Site ID
                      </label>

                      <Field
                        name="siteId"
                        placeholder="Nhập Site ID"
                        className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                      ></Field>
                      <ErrorMessage
                        className="justify-items-end text-sm font-light italic text-red-500"
                        name="siteId"
                        component="span"
                      ></ErrorMessage>
                    </div>
                    <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-12 lg:col-span-6">
                      <label className="text-slate-400 font-semibold">
                        Site ID khác
                      </label>
                      <Field
                        name="siteId2"
                        placeholder="Nhập Site ID khác"
                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                      ></Field>
                    </div>
                    <div className="col-span-full flex flex-col items-stretch gap-2">
                      <label className="text-slate-400 font-semibold">
                        Tên trạm
                      </label>
                      <Field
                        name="siteName"
                        placeholder="Nhập tên trạm"
                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                      ></Field>
                    </div>
                    <div className="col-span-full flex flex-col items-stretch gap-2">
                      <label className="text-slate-400 font-semibold">
                        Chủ nhà trạm{" "}
                      </label>
                      <Field
                        className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        as="select"
                        name="siteOwner.id"
                      >
                        <option value="">Chọn chủ nhà trạm</option>
                        {siteOwnerList.map((siteOwner) => {
                          return (
                            <option key={siteOwner.id} value={siteOwner.id}>
                              {siteOwner.name}
                            </option>
                          );
                        })}
                      </Field>
                    </div>
                    {/* <p className="col-span-full text-2xl text-blue-600">Vị trí</p> */}
                    <div className="col-span-full flex flex-col items-stretch gap-2">
                      <label className="text-slate-400 font-semibold">
                        Tỉnh{" "}
                      </label>
                      <Field
                        className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        as="select"
                        name="province.id"
                      >
                        {provinces.map((province) => {
                          return (
                            <option key={province.id} value={province.id}>
                              {province.name}
                            </option>
                          );
                        })}
                      </Field>
                    </div>
                    <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-12 lg:col-span-6">
                      <label className="text-slate-400 font-semibold">
                        Vĩ độ
                      </label>
                      <Field
                        name="latitude"
                        placeholder="Nhập vĩ độ"
                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                      ></Field>
                      <ErrorMessage
                        className="text-sm font-light italic text-red-500"
                        name="latitude"
                        component="span"
                      ></ErrorMessage>
                    </div>
                    <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-12 lg:col-span-6">
                      <label className="text-slate-400 font-semibold">
                        Kinh độ
                      </label>
                      <Field
                        type="number"
                        name="longitude"
                        placeholder="Nhập kinh độ"
                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                      ></Field>
                      <ErrorMessage
                        className="text-sm font-light italic text-red-500"
                        name="longitude"
                        component="span"
                      ></ErrorMessage>
                    </div>

                    <div className="col-span-full flex flex-col items-stretch gap-2">
                      <label className="text-slate-400 font-semibold">
                        Địa chỉ
                      </label>
                      <Field
                        name="address"
                        placeholder="Nhập địa chỉ"
                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                      ></Field>
                    </div>
                    {/* <p className="col-span-full text-xl text-blue-600">Truyền dẫn</p> */}

                    <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-12 lg:col-span-6">
                      <label className="text-slate-400 font-semibold">
                        Loại truyền dẫn
                      </label>
                      <Field
                        className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        as="select"
                        name="siteTransmissionType.id"
                      >
                        {siteTransmissionTypeList.map((siteTransType) => {
                          return (
                            <option
                              key={siteTransType.id}
                              value={siteTransType.id}
                            >
                              {siteTransType.name}
                            </option>
                          );
                        })}
                      </Field>
                    </div>
                    <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-12 lg:col-span-6">
                      <label className="text-slate-400 font-semibold">
                        Đơn vị sở hữu TD
                      </label>
                      <Field
                        className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        as="select"
                        name="transmissionOwner.id"
                      >
                        <option value="">- Chưa có thông tin-</option>
                        {transmissionOwnerList.map((transOwner) => {
                          return (
                            <option key={transOwner.id} value={transOwner.id}>
                              {transOwner.name}
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
              Cập nhật thông tin trạm
            </Typography>
            <Typography className="mt-1 font-normal text-gray-700">
              Cập nhật dữ liệu trạm đảm bảo thực tế
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
              ...editSite,
            }}
            validationSchema={Yup.object(validate)}
          >
            <Form className="flex flex-initial flex-shrink flex-col">
              <DialogBody className="space-y-4 pb-6">
                <Card className="shadow-none">
                  <div className="grid grid-cols-12 gap-3 p-2">
                    {/* <p className="col-span-full mt-5 text-xl text-blue-600">Thông tin cơ bản</p> */}
                    <div className="col-span-full flex flex-col gap-2 md:col-span-12 lg:col-span-6">
                      <label className="text-slate-400 font-semibold">
                        Site ID
                      </label>

                      <Field
                        name="siteId"
                        placeholder="Nhập Site ID"
                        className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                      ></Field>
                      <ErrorMessage
                        className="justify-items-end text-sm font-light italic text-red-500"
                        name="siteId"
                        component="span"
                      ></ErrorMessage>
                    </div>
                    <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-12 lg:col-span-6">
                      <label className="text-slate-400 font-semibold">
                        Site ID khác
                      </label>
                      <Field
                        name="siteId2"
                        placeholder="Nhập Site ID khác"
                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                      ></Field>
                    </div>
                    <div className="col-span-full flex flex-col items-stretch gap-2">
                      <label className="text-slate-400 font-semibold">
                        Tên trạm
                      </label>
                      <Field
                        name="siteName"
                        placeholder="Nhập tên trạm"
                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                      ></Field>
                    </div>
                    <div className="col-span-full flex flex-col items-stretch gap-2">
                      <label className="text-slate-400 font-semibold">
                        Chủ nhà trạm{" "}
                      </label>
                      <Field
                        className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        as="select"
                        name="siteOwner.id"
                      >
                        <option value="">Chọn chủ nhà trạm</option>
                        {siteOwnerList.map((siteOwner) => {
                          return (
                            <option key={siteOwner.id} value={siteOwner.id}>
                              {siteOwner.name}
                            </option>
                          );
                        })}
                      </Field>
                    </div>
                    {/* <p className="col-span-full text-2xl text-blue-600">Vị trí</p> */}
                    <div className="col-span-full flex flex-col items-stretch gap-2">
                      <label className="text-slate-400 font-semibold">
                        Tỉnh{" "}
                      </label>
                      <Field
                        className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        as="select"
                        name="province.id"
                      >
                        {provinces.map((province) => {
                          return (
                            <option key={province.id} value={province.id}>
                              {province.name}
                            </option>
                          );
                        })}
                      </Field>
                    </div>
                    <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-12 lg:col-span-6">
                      <label className="text-slate-400 font-semibold">
                        Vĩ độ
                      </label>
                      <Field
                        name="latitude"
                        placeholder="Nhập vĩ độ"
                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                      ></Field>
                      <ErrorMessage
                        className="text-sm font-light italic text-red-500"
                        name="latitude"
                        component="span"
                      ></ErrorMessage>
                    </div>
                    <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-12 lg:col-span-6">
                      <label className="text-slate-400 font-semibold">
                        Kinh độ
                      </label>
                      <Field
                        type="number"
                        name="longitude"
                        placeholder="Nhập kinh độ"
                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                      ></Field>
                      <ErrorMessage
                        className="text-sm font-light italic text-red-500"
                        name="longitude"
                        component="span"
                      ></ErrorMessage>
                    </div>

                    <div className="col-span-full flex flex-col items-stretch gap-2">
                      <label className="text-slate-400 font-semibold">
                        Địa chỉ
                      </label>
                      <Field
                        name="address"
                        placeholder="Nhập địa chỉ"
                        className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                      ></Field>
                    </div>
                    {/* <p className="col-span-full text-xl text-blue-600">Truyền dẫn</p> */}

                    <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-12 lg:col-span-6">
                      <label className="text-slate-400 font-semibold">
                        Loại truyền dẫn
                      </label>
                      <Field
                        className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        as="select"
                        name="siteTransmissionType.id"
                      >
                        {siteTransmissionTypeList.map((siteTransType) => {
                          return (
                            <option
                              key={siteTransType.id}
                              value={siteTransType.id}
                            >
                              {siteTransType.name}
                            </option>
                          );
                        })}
                      </Field>
                    </div>
                    <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-12 lg:col-span-6">
                      <label className="text-slate-400 font-semibold">
                        Đơn vị sở hữu TD
                      </label>
                      <Field
                        className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                        as="select"
                        name="transmissionOwner.id"
                      >
                        <option value="">- Chưa có thông tin-</option>
                        {transmissionOwnerList.map((transOwner) => {
                          return (
                            <option key={transOwner.id} value={transOwner.id}>
                              {transOwner.name}
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
                  Cập nhật dữ liệu
                </Button>
              </DialogFooter>
            </Form>
            {/* <img src={MySvg} alt="" className="flex-initial p-5" /> */}
          </Formik>
        </div>
      </Dialog>
    </div>
  );
}
export default SiteList2;
