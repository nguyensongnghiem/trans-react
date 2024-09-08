
import { useEffect, useState } from "react";
import * as siteService from "../services/SiteService";
import * as transOwnerService from "../services/TransmissionOwnerService";
import * as siteTransmissionTypeService from "../services/SiteTransmissionTypeService"
import * as provinceService from "../services/ProvinceService"
import * as siteOwnerService from "../services/SiteOwnerService"
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import * as Yup from "yup";
import Modal from 'react-modal';

function SiteEdit() {
  const { editId } = useParams();
  const [transmissionOwnerList, setTransmissionOwnerList] = useState([]);
  const [siteTransmissionTypeList, setSiteTransmissionTypeList] = useState([]);
  const [provinceList, setProvinceList] = useState([]);
  const [siteOwnerList, setSiteOwnerList] = useState([]);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [editSite, setEditSite] = useState({})
  useEffect(() => {
    getAllTransmissionOwner();
  }, []);

  const getAllTransmissionOwner = async () => {
    const transOwnerList = await transOwnerService.getAll();
    setTransmissionOwnerList(transOwnerList)

  };

  useEffect(() => {
    getAllTransType();
  }, []);

  const getAllTransType = async () => {
    const siteTransTypeList = await siteTransmissionTypeService.getAll();
    setSiteTransmissionTypeList(siteTransTypeList)

  };

  useEffect(() => {
    getAllProvince();
  }, []);

  const getAllProvince = async () => {
    const provinceList = await provinceService.getAll();
    setProvinceList(provinceList)

  };

  useEffect(() => {
    getAllSiteOwner();
  }, []);

  const getAllSiteOwner = async () => {
    const siteOwnerList = await siteOwnerService.getAll();
    setSiteOwnerList(siteOwnerList)
  };

  useEffect(() => {
    getSiteById(editId);
  }, [])
  const getSiteById = async (editId) => {
    const site = await siteService.getSiteById(editId)
    setEditSite({ ...site })
    setIsLoading(false)
    console.log(site);

  }

  const handleSubmit = async (site, { setErrors }) => {
    site.latitude = + site.latitude
    site.longitude = + site.longitude
    await siteService.saveSite(site, setErrors)
    navigate("/site")
  };

  const validate = {
    siteId: Yup.string().required("Site Id không để trống"),
    latitude: Yup.number()
      .required("Không để trống")
      .typeError("(Yêu cầu nhập số)"),
    longitude: Yup.number()
      .required("Không để trống")
      .typeError("Yêu cầu nhập số"),
  };
  if (isLoading) return <p>Loading...</p>;
  return (

    <Formik
      onSubmit={handleSubmit}
      initialValues={{
        ...editSite
      }}
      validationSchema={Yup.object(validate)}
    >
      <Form className="container mx-auto mt-5 flex flex-col gap-5 rounded-lg px-16">
        <p className="text-2xl font-semibold uppercase text-sky-600">Sửa thông tin trạm </p>
        <div className="grid grid-cols-12 gap-5 p-2">
          <p className="col-span-full mt-5 text-2xl text-sky-600">Thông tin cơ bản</p>
          <div className="col-span-full flex flex-col gap-2 md:col-span-6 lg:col-span-3">
            <label className="font-semibold text-slate-400">Site ID
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
          <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-6 lg:col-span-3">
            <label className="font-semibold text-slate-400">Site ID khác</label>
            <Field
              name="siteId2"
              placeholder="Nhập Site ID khác"
              className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
            </Field>
          </div>
          <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-6 lg:col-span-3">
            <label className="font-semibold text-slate-400">Tên trạm</label>
            <Field
              name="siteName"
              placeholder="Nhập tên trạm"
              className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
            </Field>
          </div>
          <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-6 lg:col-span-3">
            <label className="font-semibold text-slate-400">Chủ nhà trạm </label>
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
          <p className="col-span-full text-2xl text-sky-600">Vị trí</p>
          <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-6 lg:col-span-3">
            <label className="font-semibold text-slate-400">Tỉnh </label>
            <Field className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200" as="select" name="province.id">

              {provinceList.map(province => {
                return (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                );
              })}
            </Field>
          </div>
          <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-6 lg:col-span-3">
            <label className="font-semibold text-slate-400">Vĩ độ
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
          <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-6 lg:col-span-3">
            <label className="font-semibold text-slate-400">Kinh độ
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

          <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-6 lg:col-span-3">
            <label className="font-semibold text-slate-400">Địa chỉ</label>
            <Field

              name="address"
              placeholder="Nhập địa chỉ"
              className="rounded border border-gray-300 px-2 py-1 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
            </Field>
          </div>
          <p className="col-span-full text-2xl text-sky-600">Thông tin truyền dẫn</p>
          <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-6 lg:col-span-4">
            <label className="font-semibold text-slate-400">Loại truyền dẫn</label>
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
          <div className="col-span-full flex flex-col items-stretch gap-2 md:col-span-6 lg:col-span-4">
            <label className="font-semibold text-slate-400">Đơn vị sở hữu TD</label>
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
          <div className="col-span-full col-start-1 flex flex-col items-stretch gap-2 md:col-span-6 lg:col-span-4">
            <label className="font-semibold text-slate-400">Ghi chú</label>
            <Field className="h-8 rounded border border-gray-300 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200" as="textarea" name="note">
            </Field>
          </div>
        </div>
        <button
          type="submit"
          className="flex h-8 items-center justify-center rounded-sm bg-slate-500 px-2 py-1 font-semibold text-white shadow-md hover:cursor-pointer hover:bg-slate-600 md:w-32"
        >

          Lưu
        </button>
      </Form>
    </Formik>

  )
}

export default SiteEdit