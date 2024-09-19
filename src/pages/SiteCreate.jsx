
import { useEffect, useState } from "react";
import * as siteService from "../services/SiteService";
import * as transOwnerService from "../services/TransmissionOwnerService";
import * as siteTransmissionTypeService from "../services/SiteTransmissionTypeService"
import * as provinceService from "../services/ProvinceService"
import * as siteOwnerService from "../services/SiteOwnerService"
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useNavigate } from "react-router-dom";
import { Button, MenuItem, Option, Select, Typography, Card, CardHeader, CardBody, CardFooter, Input } from "@material-tailwind/react";
import { toast } from "react-toastify";
import * as Yup from "yup";

import React from 'react';
import MySvg from '../assets/svg/undraw_designer_re_5v95.svg';


function SiteCreate() {
  const [transmissionOwnerList, setTransmissionOwnerList] = useState([]);
  const [siteTransmissionTypeList, setSiteTransmissionTypeList] = useState([]);
  const [provinceList, setProvinceList] = useState([]);
  const [siteOwnerList, setSiteOwnerList] = useState([]);
  const navigate = useNavigate();

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

  const handleSubmit = async (site, { setErrors }) => {
    site.latitude = + site.latitude
    site.longitude = + site.longitude
    await siteService.saveSite(site, setErrors)
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

  return (

    <Formik
      onSubmit={handleSubmit}
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


      <Form className="container flex w-1/2 flex-initial flex-shrink flex-col gap-5 rounded-lg shadow-lg">
        <Card className="p-5 shadow">

          <p className="text-xl font-semibold uppercase">Thêm trạm vào cơ sở dữ liệu</p>


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
      {/* <img src={MySvg} alt="" className="flex-initial p-5" /> */}

    </Formik >

  )
}

export default SiteCreate