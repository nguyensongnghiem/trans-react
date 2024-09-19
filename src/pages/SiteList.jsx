import { useEffect, useState } from "react";
import * as siteService from "../services/SiteService";
import * as transOwnerService from "../services/TransmissionOwnerService";
import * as siteTransmissionTypeService from "../services/SiteTransmissionTypeService"
import * as provinceService from "../services/ProvinceService"
import * as Yup from "yup";
import * as siteOwnerService from "../services/SiteOwnerService"
import { ErrorMessage, Field, Form, Formik } from "formik";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Button, MenuItem, Option, Select, Input,
  Card,
  Dialog,
  Textarea,
  IconButton,
  Typography,
  DialogBody,
  DialogHeader,
  DialogFooter,
} from "@material-tailwind/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Modal from 'react-modal';

function SiteList() {
  const navigate = useNavigate();
  const [siteList, setSiteList] = useState({});
  const [transmissionOwnerList, setTransmissionOwnerList] = useState([]);
  const [siteTransmissionTypeList, setSiteTransmissionTypeList] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState({
    siteId: "",
    transOwner: "",
    transType: "",
    province: ""
  });
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false);
  const [siteOwnerList, setSiteOwnerList] = useState([]);

  Modal.setAppElement('#root');


  let deleteSiteId

  useEffect(() => {
    getAllSites();
  }, [page, searchTerm]);

  const getAllSites = async () => {
    const sites = await siteService.searchSites(page, searchTerm.siteId, searchTerm.transOwner, searchTerm.transType, searchTerm.province);
    setSiteList(sites)
    setIsLoading(false)
  };

  useEffect(() => {

    const getAllSiteOwner = async () => {
      const siteOwnerList = await siteOwnerService.getAll();
      setSiteOwnerList(siteOwnerList)
    };
    getAllSiteOwner();
  }, []);


  useEffect(() => {
    const getAllTransmissionOwner = async () => {
      const transOwnerList = await transOwnerService.getAll();
      setTransmissionOwnerList(transOwnerList)

    };
    getAllTransmissionOwner();
  }, []);



  useEffect(() => {
    const getAllProvince = async () => {
      const provinces = await provinceService.getAll();
      setProvinces(provinces)
    };
    getAllProvince();
  }, []);



  useEffect(() => {
    const getAllSiteTransmissionType = async () => {
      const siteTransTypeList = await siteTransmissionTypeService.getAll();
      setSiteTransmissionTypeList(siteTransTypeList)
    };
    getAllSiteTransmissionType();
  }, []);


  const handleCreate = async (site, { setErrors }) => {
    site.latitude = + site.latitude
    site.longitude = + site.longitude
    await siteService.saveSite(site, setErrors)
  };


  const onSearchSubmit = async (value) => {
    console.log(value);
    setSearchTerm(value)
    setPage(0)
    // const sites = await siteService.searchSites(page, value.siteId, value.transOwner, value.transType);
    // setSiteList(sites)
    setIsLoading(false)
  };

  // Modal function 
  function openModal(id) {
    setDeleteId(id);
    setIsOpen(true);
  }

  function afterOpenModal() {

  }

  function closeModal() {
    setDeleteId(null)
    setIsOpen(false);
  }
  const deleteSite = async (id) => {
    const result = await siteService.deleteSite(id);
    getAllSites();
    closeModal()
  }

  const handleOpenCreate = () => {
    setOpenCreate(!openCreate)
  }
  const handleEdit = (editId) => {
    navigate(`/site/edit/${editId}`)
  }
  if (deleteId != null) {
    deleteSiteId = siteList.content.find(site => site.id === deleteId).siteId
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

  if (isLoading) return <p>Loading... </p>
  return (
    <div className="container px-3">
      <Typography variant="h4" color="blue-gray" className="mb-3">Danh sách trạm</Typography>
      <Button variant='gradient' size="sm" className="mb-3 flex items-center gap-3" onClick={handleOpenCreate}>
        {/* <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg> */}
        Thêm mới
      </Button>

      <div className="container max-w-full">
        <Formik
          initialValues={{ ...searchTerm }}
          onSubmit={onSearchSubmit}
          className="max-w-full"
        >
          {({
            handleChange,
            handleBlur,
            values,
            errors,
            isValid,
          }) => (
            <Form className="mb-3 flex flex-col justify-start gap-x-10 gap-y-2 md:flex-row md:flex-wrap md:items-end">

              <div className="flex flex-col gap-1">
                {/* <Typography variant="h6" color="blue-gray" className="">Site ID</Typography> */}
                <Field
                  name="siteId"

                // className="stretch h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {({ field }) => (
                    <Input
                      {...field}
                      label="Site ID"
                      placeholder="Tìm theo Site Id"
                      color="blue"
                      variant="standard"
                    />
                  )}
                </Field>
              </div>
              <div className="flex flex-col gap-1">
                <Typography variant="h6" color="blue-gray" className="">Tỉnh/Thành phố</Typography>
                <Field
                  name='province'
                  as='select'
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                >

                  <option value=""> - Chọn tất cả- </option>
                  {provinces.map(province => {
                    console.log(province);

                    return (
                      <option key={province.name} value={province.name} >
                        {province.name}
                      </option>
                    );
                  })}
                </Field>

              </div>
              <div className="flex flex-col gap-1">
                <Typography variant="h6" color="blue-gray" className="">Đơn vị sở hữu TD</Typography>
                <Field
                  as="select"
                  name="transOwner"
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                >

                  <option value="">- Chọn tất cả-</option>
                  {transmissionOwnerList.map(transOwner => {
                    return (
                      <option key={transOwner.id} value={transOwner.name}>
                        {transOwner.name}
                      </option>
                    );
                  })}
                </Field>
              </div>

              <div className="flex flex-col gap-1">
                <Typography variant="h6" color="blue-gray" className="">Loại truyền dẫn trạm</Typography>
                <Field
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                  as="select"
                  name="transType">
                  <option value="">- Chọn tất cả -</option>
                  {siteTransmissionTypeList.map(siteTransType => {
                    return (
                      <option key={siteTransType.id} value={siteTransType.name}>
                        {siteTransType.name}
                      </option>
                    );
                  })}
                </Field>
              </div>
              <Button
                type="submit"
                size="sm"
                className="flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                Tìm
              </Button>

            </Form>
          )}
        </Formik>

        <div className="max-h-full overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border-2">
            <thead>
              <tr className="bg-gray-200 uppercase text-gray-600">
                <th className="py-1 text-center">Tỉnh</th>
                <th className="py-1 text-center">Site ID</th>
                <th className="py-1 text-center">Site ID khác</th>
                <th className="py-1 text-center">Tên trạm</th>
                <th className="py-1 text-center">Vĩ độ</th>
                <th className="py-1 text-center">Kinh độ</th>
                <th className="py-1 text-center">Đơn vị sở hữu TD</th>
                <th className="py-1 text-center">Loại TD</th>
                <th className="py-1 text-center">Ghi chú</th>
                <th className="py-1 text-center">Tác động</th>
              </tr>
            </thead>
            <tbody className="text-sm font-light text-gray-600">
              {siteList.content.map((site) => {
                return (
                  <tr key={site.id} className="hover:bg-sky-100 border-b border-gray-200 bg-white">
                    <td className="whitespace-nowrap px-6 py-1 text-center">{site.province.name}</td>
                    <td className="whitespace-nowrap px-6 py-1 text-center">{site.siteId}</td>
                    <td className="whitespace-nowrap px-6 py-1 text-center">{site.siteId2}</td>
                    <td className="whitespace-nowrap px-6 py-1 text-center">{site.siteName}</td>
                    <td className="whitespace-nowrap px-6 py-1 text-center">{site.latitude}</td>
                    <td className="whitespace-nowrap px-6 py-1 text-center">{site.longitude}</td>
                    <td className="whitespace-nowrap px-6 py-1 text-center">{site.transmissionOwner?.name}</td>
                    <td className="whitespace-nowrap px-6 py-1 text-center">{site.siteTransmissionType?.name}</td>
                    <td className="whitespace-nowrap px-6 py-1 text-center">{site.note}</td>

                    <td className="px-6 py-3 text-center">
                      <div className="item-center flex justify-center gap-3">
                        <div className="mr-2 w-4 transform text-yellow-500 hover:scale-150 hover:cursor-pointer hover:text-yellow-600">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        <div onClick={() => handleEdit(site.id)} className="mr-2 w-4 transform text-green-500 hover:scale-150 hover:cursor-pointer hover:text-green-600">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325" />
                          </svg>
                        </div>
                        <div onClick={() => openModal(site.id)} className="mr-2 w-4 transform text-red-500 hover:scale-150 hover:cursor-pointer hover:text-red-600">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}

            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap justify-between">
          <p>{`Trang ${siteList.pageable.pageNumber + 1} / ${siteList.totalPages} - Tổng số : ${siteList.totalElements}`}</p>
          <div className="inline-flex items-center">
            <button onClick={() => setPage(siteList.number - 1)}
              className={clsx("flex items-center gap-2 rounded-l-md border-t border-b border-l border-gray-200 bg-gray-200 px-4 py-2 hover:bg-gray-300", { "bg-slate-100 hover:bg-slate-100 text-slate-300": siteList.number === 0 })}
              disabled={siteList.number === 0}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
                aria-hidden="true" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"></path>
              </svg>
              Previous
            </button>
            {
              (() => {
                const pages = [];
                const start = Math.max(0, siteList.number - 3);
                const end = Math.min(siteList.totalPages - 1, siteList.number + 3);
                for (let i = start; i <= end; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={clsx("px-4 py-2 bg-white border-t border-b border-gray-200 hover:text-sky-400 hover:bg-slate-200", { "bg-sky-500 text-sky-500": siteList.number == i })}
                      disabled={siteList.number == i}
                    >
                      {i + 1}
                    </button>
                  );
                }
                return pages;
              })()
            }

            <button onClick={() => setPage(siteList.number + 1)}
              className={clsx("flex items-center gap-2 rounded-r-md border-b border-t border-l border-r border-gray-200 bg-gray-200 px-4 py-2 hover:bg-gray-300", { "bg-slate-100 hover:bg-slate-100 text-slate-300": siteList.number == siteList.totalPages - 1 })}
              disabled={siteList.number === siteList.totalPages - 1}>
              Next
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
                aria-hidden="true" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>


      <Modal
        isOpen={isOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        contentLabel="Example Modal"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-lg bg-white p-8 shadow-lg"
      >
        <h2 className="mb-3 text-lg font-bold text-red-500" ref={(_subtitle) => (subtitle = _subtitle)}>Xóa thông tin</h2>
        <p className="mb-3">Xác nhận xóa trạm {deleteSiteId} khỏi cơ sở dữ liệu ?</p>
        <div className="mt-3 flex justify-end gap-3">
          <button
            onClick={closeModal} className="bg-slate-500 hover:bg-slate-600 inline-block rounded-sm px-2 py-1 font-semibold text-white shadow-md hover:cursor-pointer"
          >Hủy</button>
          <button
            onClick={() => deleteSite(deleteId)}
            className="inline-block rounded-sm bg-red-500 px-2 py-1 font-semibold text-white shadow-md hover:cursor-pointer hover:bg-red-600"
          >Xóa dữ liệu</button>
        </div>


      </Modal>

      <Dialog size="md" open={openCreate} handler={handleOpenCreate} className="p-4">
        <DialogHeader className="relative m-0 block">
          <Typography variant="h4" color="blue-gray">
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
        <DialogBody className="space-y-4 pb-6">
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
              <Card className="shadow-none">
                <div className="grid grid-cols-12 gap-3 p-2">
                  {/* <p className="col-span-full mt-5 text-xl text-blue-600">Thông tin cơ bản</p> */}
                  <div className="col-span-full flex flex-col gap-2 md:col-span-12 lg:col-span-6">
                    <label className="text-slate-400 font-semibold">Site ID
                    </label>

                    <Field
                      name="siteId"
                      placeholder="Nhập Site ID"
                      className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >

                    </Field>
                    <ErrorMessage
                      className="justify-items-end text-sm font-light italic text-red-500"
                      name="siteId"
                      component="span"
                    ></ErrorMessage>

                  </div>
                  <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-12 lg:col-span-6">
                    <label className="text-slate-400 font-semibold">Site ID khác</label>
                    <Field
                      name="siteId2"
                      placeholder="Nhập Site ID khác"
                      className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                    </Field>
                  </div>
                  <div className="col-span-full flex flex-col items-stretch gap-2">
                    <label className="text-slate-400 font-semibold">Tên trạm</label>
                    <Field
                      name="siteName"
                      placeholder="Nhập tên trạm"
                      className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                    </Field>
                  </div>
                  <div className="col-span-full flex flex-col items-stretch gap-2">
                    <label className="text-slate-400 font-semibold">Chủ nhà trạm </label>
                    <Field className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200" as="select" name="siteOwner.id" >
                      <option value="">Chọn chủ nhà trạm</option>
                      {siteOwnerList.map(siteOwner => {
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
                    <label className="text-slate-400 font-semibold">Tỉnh </label>
                    <Field className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200" as="select" name="province.id">

                      {provinces.map(province => {
                        return (
                          <option key={province.id} value={province.id}>
                            {province.name}
                          </option>
                        );
                      })}
                    </Field>
                  </div>
                  <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-12 lg:col-span-6">
                    <label className="text-slate-400 font-semibold">Vĩ độ
                    </label>
                    <Field

                      name="latitude"
                      placeholder="Nhập vĩ độ"
                      className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                    </Field>
                    <ErrorMessage
                      className="text-sm font-light italic text-red-500"
                      name="latitude"
                      component="span"
                    ></ErrorMessage>
                  </div>
                  <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-12 lg:col-span-6">
                    <label className="text-slate-400 font-semibold">Kinh độ
                    </label>
                    <Field
                      type="number"
                      name="longitude"
                      placeholder="Nhập kinh độ"
                      className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                    </Field>
                    <ErrorMessage
                      className="text-sm font-light italic text-red-500"
                      name="longitude"
                      component="span"
                    ></ErrorMessage>
                  </div>

                  <div className="col-span-full flex flex-col items-stretch gap-2">
                    <label className="text-slate-400 font-semibold">Địa chỉ</label>
                    <Field

                      name="address"
                      placeholder="Nhập địa chỉ"
                      className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                    </Field>
                  </div>
                  {/* <p className="col-span-full text-xl text-blue-600">Truyền dẫn</p> */}

                  <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-12 lg:col-span-6">
                    <label className="text-slate-400 font-semibold">Loại truyền dẫn</label>
                    <Field className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200" as="select" name="siteTransmissionType.id">
                      {siteTransmissionTypeList.map(siteTransType => {
                        return (
                          <option key={siteTransType.id} value={siteTransType.id}>
                            {siteTransType.name}
                          </option>
                        );
                      })}
                    </Field>
                  </div>
                  <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-12 lg:col-span-6">
                    <label className="text-slate-400 font-semibold">Đơn vị sở hữu TD</label>
                    <Field className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200" as="select" name="transmissionOwner.id">
                      <option value="">- Chưa có thông tin-</option>
                      {transmissionOwnerList.map(transOwner => {
                        return (
                          <option key={transOwner.id} value={transOwner.id}>
                            {transOwner.name}
                          </option>
                        );
                      })}
                    </Field>
                  </div>
                  <div className="col-span-full col-start-1 mb-3 flex flex-col items-stretch gap-2 md:col-span-12">
                    <label className="text-slate-400 font-semibold">Ghi chú</label>
                    <Field className="h-24 h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200" as="textarea" name="note">
                    </Field>
                  </div>
                </div>

              </Card>
            </Form>
            {/* <img src={MySvg} alt="" className="flex-initial p-5" /> */}

          </Formik >
        </DialogBody>
        <DialogFooter>
          <Button
            size="md"
            type="submit"
          >
            Lưu
          </Button>
        </DialogFooter>
      </Dialog>
    </div >
  )
}
export default SiteList;
