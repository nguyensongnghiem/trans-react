
import { useEffect, useState } from "react";
import * as siteService from "../services/SiteService";
import * as transOwnerService from "../services/TransmissionOwnerService";
import * as siteTransmissionTypeService from "../services/SiteTransmissionTypeService"
import * as provinceService from "../services/ProvinceService"
import * as siteOwnerService from "../services/SiteOwnerService"
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useNavigate, useParams } from "react-router-dom";
import { Button, MenuItem, Option, Select, Typography, Card, CardHeader, CardBody, CardFooter, Input } from "@material-tailwind/react";
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
    const getSiteById = async (editId) => {
      const editSite = await siteService.getSiteById(editId)
      setEditSite({ ...editSite })
      setIsLoading(false)
      console.log(editSite);

    }
    getSiteById(editId);
  }, [editId])


  const handleSubmit = async (site, { setErrors }) => {
    site.latitude = + site.latitude
    site.longitude = + site.longitude
    await siteService.saveSite(site, setErrors)
    navigate("/site")
  };

  const validate = {
    siteId: Yup.string().required("Yêu cầu nhập Site ID"),
    latitude: Yup.number()
      .required("Yêu cầu nhập vĩ độ")
      .typeError("(Yêu cầu nhập số)"),
    longitude: Yup.number()
      .required("Yêu cầu nhập kinh độ")
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
      <Form className="container mx-auto flex w-1/2 flex-initial flex-shrink flex-col gap-5 rounded-lg shadow-lg">
        <Card className="p-5 shadow">
          <p className="text-2xl font-semibold uppercase">Sửa thông tin trạm </p>

          <div className="grid grid-cols-12 gap-5 p-2">
            <p className="col-span-full mt-5 text-xl text-blue-600">Thông tin cơ bản</p>
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

                {provinceList.map(province => {
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
            <p className="col-span-full text-xl text-blue-600">Truyền dẫn</p>

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
              <Field className="h-24 h-8 rounded border border-gray-300 bg-amber-50 px-2 py-1 text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-200" as="textarea" name="note">
              </Field>
            </div>
          </div>
          <Button
            size="lg"
            type="submit"
          >
            Lưu
          </Button>
        </Card>
      </Form>
    </Formik>

  )
}

export default SiteEdit