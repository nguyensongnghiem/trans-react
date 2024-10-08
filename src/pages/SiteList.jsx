import { useEffect, useState } from "react";
import * as siteService from "../services/SiteService";
import * as transOwnerService from "../services/TransmissionOwnerService";
import * as siteTransmissionTypeService from "../services/SiteTransmissionTypeService"
import * as provinceService from "../services/ProvinceService"
import { Field, Form, Formik } from "formik";
import { NavLink, useNavigate } from "react-router-dom";
import Modal from 'react-modal';
import clsx from "clsx";
import { toast } from "react-toastify";

function SiteList() {
  const navigate = useNavigate();
  const [siteList, setSiteList] = useState([]);
  const [transmissionOwnerList, setTransmissionOwnerList] = useState([]);
  const [siteTransmissionTypeList, setSiteTransmissionTypeList] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState({
    siteId: "",
    transOwner: "",
    transType: "",
    province: ""
  });
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false);
  Modal.setAppElement('#root');
  let subtitle;



  useEffect(() => {
    getAllSites();
  }, [page, searchTerm]);

  const getAllSites = async () => {
    const sites = await siteService.searchSites(page, searchTerm.siteId, searchTerm.transOwner, searchTerm.transType, searchTerm.province);
    setSiteList(sites)
    setIsLoading(false)
  };


  useEffect(() => {
    getAllTransmissionOwner();
  }, []);

  const getAllTransmissionOwner = async () => {
    const transOwnerList = await transOwnerService.getAll();
    setTransmissionOwnerList(transOwnerList)

  };

  useEffect(() => {
    getAllProvince();
  }, []);

  const getAllProvince = async () => {
    const provinces = await provinceService.getAll();
    setProvinces(provinces)

  };


  useEffect(() => {
    getAllSiteTransmissionType();
  }, []);

  const getAllSiteTransmissionType = async () => {
    const siteTransTypeList = await siteTransmissionTypeService.getAll();
    setSiteTransmissionTypeList(siteTransTypeList)

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
    setIsOpen(true);
    setDeleteId(id);
  }

  function afterOpenModal() {

  }

  function closeModal() {
    setIsOpen(false);
  }
  const deleteSite = async (id) => {
    const result = await siteService.deleteSite(id);
    closeModal()
    setDeleteId(null)
    setSiteList(siteList.filter(site => site.siteId != id));

  }

  if (isLoading) return <p>Loading... </p>
  return (
    <div className="container px-3">
      <h2 className="my-4 text-2xl font-semibold uppercase text-sky-700">Danh sách trạm</h2>
      <button className="mb-3 w-full rounded-sm bg-sky-500 px-2 py-1 font-semibold text-white shadow-md hover:cursor-pointer hover:bg-sky-600 md:w-fit">

        <NavLink to="/site/create" className="flex gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-house-add" viewBox="0 0 16 16">
            <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h4a.5.5 0 1 0 0-1h-4a.5.5 0 0 1-.5-.5V7.207l5-5 6.646 6.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293z" />
            <path d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-3.5-2a.5.5 0 0 0-.5.5v1h-1a.5.5 0 0 0 0 1h1v1a.5.5 0 1 0 1 0v-1h1a.5.5 0 1 0 0-1h-1v-1a.5.5 0 0 0-.5-.5" />
          </svg>
          Thêm mới
        </NavLink>
      </button>

      <div className="container max-w-full">
        <Formik
          initialValues={{ ...searchTerm }}
          onSubmit={onSearchSubmit}
          className="max-w-full"
        >
          <Form className="mb-3 flex flex-col justify-start gap-10 md:flex-row md:flex-wrap md:items-end">

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-600">Site ID</label>
              <Field
                name="siteId"
                placeholder="Tìm theo Site ID"
                className="stretch h-8 rounded border border-gray-300 px-2 py-1 text-gray-600"
              >
              </Field>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-600">Tỉnh/Thành phố</label>
              <Field className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600" as="select" name="province">
                <option value="">- Chọn tất cả-</option>
                {provinces.map(province => {
                  return (
                    <option key={province.id} value={province.name}>
                      {province.name}
                    </option>
                  );
                })}
              </Field>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-600">Đơn vị sở hữu TD</label>
              <Field className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600" as="select" name="transOwner">
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
              <label className="font-semibold text-slate-600">Loại truyền dẫn trạm</label>
              <Field className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600" as="select" name="transType">
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
            <button
              type="submit"
              className="flex h-8 items-center justify-center rounded-sm bg-slate-500 px-2 py-1 font-semibold text-white shadow-md hover:cursor-pointer hover:bg-slate-600 md:w-32"
            >
              <svg
                fill="currentColor"
                viewBox="0 0 16 16"
                height="1em"
                width="1em"
                className="mr-2 inline-block"
              >
                <path d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 001.415-1.414l-3.85-3.85a1.007 1.007 0 00-.115-.1zM12 6.5a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0z" />
              </svg>
              Tìm
            </button>

          </Form>
        </Formik>

        <div className="max-h-full overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border-2">
            <thead>
              <tr className="bg-gray-200 uppercase text-gray-600">
                <th className="py-1 text-center">Tỉnh</th>
                <th className="py-1 text-center">Site ID</th>
                <th className="py-1 text-center">Site ID khác</th>
                <th className="py-1 text-center">Vĩ độ</th>
                <th className="py-1 text-center">Kinh độ</th>
                <th className="py-1 text-center">Đơn vị sở hữu TD</th>
                <th className="py-1 text-center">Loại TD</th>
                <th className="py-1 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm font-light text-gray-600">
              {siteList.content.map((site) => {
                return (
                  <tr key={site.id} className="border-b border-gray-200 bg-white hover:bg-sky-100">
                    <td className="whitespace-nowrap px-6 py-1 text-center">{site.province.name}</td>
                    <td className="whitespace-nowrap px-6 py-1 text-center">{site.siteId}</td>
                    <td className="whitespace-nowrap px-6 py-1 text-center">{site.siteId2}</td>
                    <td className="whitespace-nowrap px-6 py-1 text-center">{site.latitude}</td>
                    <td className="whitespace-nowrap px-6 py-1 text-center">{site.longitude}</td>
                    <td className="whitespace-nowrap px-6 py-1 text-center">{site.transmissionOwner?.name}</td>
                    <td className="whitespace-nowrap px-6 py-1 text-center">{site.siteTransmissionType?.name}</td>

                    <td className="px-6 py-3 text-center">
                      <div className="item-center flex justify-center gap-3">
                        <div className="mr-2 w-4 transform hover:scale-150 hover:cursor-pointer hover:text-yellow-500">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        <div onClick={() => openModal(site.id)} className="mr-2 w-4 transform hover:scale-150 hover:cursor-pointer hover:text-red-500">
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
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-lg bg-white p-6 shadow-lg"
      >
        <h2 className="mb-3 text-lg font-bold text-red-500" ref={(_subtitle) => (subtitle = _subtitle)}>Xóa thông tin</h2>
        <p className="mb-3">Xác nhận xóa trạm {deleteId} khỏi cơ sở dữ liệu ?</p>
        <div className="flex justify-between gap-3">
          <button
            onClick={closeModal} className="mb-3 inline-block rounded-sm bg-slate-500 px-2 py-1 font-semibold text-white shadow-md hover:cursor-pointer hover:bg-slate-600"
          >Hủy</button>
          <button
            onClick={() => deleteSite(deleteId)}
            className="mb-3 inline-block rounded-sm bg-red-500 px-2 py-1 font-semibold text-white shadow-md hover:cursor-pointer hover:bg-red-600"
          >Xóa dữ liệu</button>
        </div>


      </Modal>
    </div>
  )
}
export default SiteList;
