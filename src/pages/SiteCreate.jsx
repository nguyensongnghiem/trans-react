import React from 'react';
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useNavigate } from "react-router-dom";
import { Button, Card, Typography, Input, Spinner } from "@material-tailwind/react";
import * as Yup from "yup";
import useSites from "../hooks/useSites";
import useMetadata from "../hooks/useMetadata";

/**
 * Component: SiteCreate
 * Pattern: Component -> Hook -> Service -> Axios
 */
function SiteCreate() {
  const navigate = useNavigate();
  const { createSite } = useSites();
  const { provinces, siteOwners, transOwners, transTypes, isLoading: metaLoading } = useMetadata();

  const handleSubmit = async (values, { setSubmitting }) => {
    const siteData = {
      ...values,
      latitude: Number(values.latitude),
      longitude: Number(values.longitude)
    };

    const success = await createSite(siteData);
    if (success) {
      navigate("/sites");
    }
    setSubmitting(false);
  };

  const validationSchema = Yup.object({
    siteId: Yup.string().required("Site Id không để trống"),
    latitude: Yup.number().required("Không để trống").typeError("Yêu cầu nhập số"),
    longitude: Yup.number().required("Không để trống").typeError("Yêu cầu nhập số"),
  });

  if (metaLoading) return <div className="flex justify-center p-10"><Spinner /></div>;

  return (
    <Formik
      initialValues={{
        province: { id: null },
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
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
        <Form className="container mx-auto flex w-full max-w-2xl flex-col gap-5 rounded-lg shadow-lg py-5">
          <Card className="p-8 shadow-xl border border-gray-100">
            <Typography variant="h4" color="blue-gray" className="mb-6 uppercase text-center">
              Thêm trạm mới
            </Typography>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <Typography variant="h6" color="blue" className="mb-2 border-b border-blue-100 pb-1">
                  Thông tin cơ bản
                </Typography>
              </div>

              {/* Site ID */}
              <div className="flex flex-col gap-2">
                <Typography variant="small" className="font-bold text-gray-600">Site ID</Typography>
                <Field name="siteId">
                  {({ field }) => (
                    <Input {...field} size="lg" placeholder="Nhập Site ID" color="blue" />
                  )}
                </Field>
                <ErrorMessage name="siteId" component="div" className="text-red-500 text-xs italic" />
              </div>

              {/* Site ID 2 */}
              <div className="flex flex-col gap-2">
                <Typography variant="small" className="font-bold text-gray-600">Site ID khác</Typography>
                <Field name="siteId2">
                  {({ field }) => (
                    <Input {...field} size="lg" placeholder="Nhập Site ID khác" color="blue" />
                  )}
                </Field>
              </div>

              {/* Tên trạm */}
              <div className="col-span-2 flex flex-col gap-2">
                <Typography variant="small" className="font-bold text-gray-600">Tên trạm</Typography>
                <Field name="siteName">
                  {({ field }) => (
                    <Input {...field} size="lg" placeholder="Nhập tên trạm" color="blue" />
                  )}
                </Field>
              </div>

              {/* Chủ nhà trạm */}
              <div className="flex flex-col gap-2">
                <Typography variant="small" className="font-bold text-gray-600">Chủ nhà trạm</Typography>
                <Field as="select" name="siteOwner.id" className="h-11 rounded-md border border-blue-gray-200 bg-transparent px-3 py-2 text-sm outline outline-0 transition-all focus:border-2 focus:border-blue-500">
                  <option value="">Chọn chủ nhà trạm</option>
                  {siteOwners.map(owner => (
                    <option key={owner.id} value={owner.id}>{owner.name}</option>
                  ))}
                </Field>
              </div>

              {/* Tỉnh */}
              <div className="flex flex-col gap-2">
                <Typography variant="small" className="font-bold text-gray-600">Tỉnh / Thành phố</Typography>
                <Field as="select" name="province.id" className="h-11 rounded-md border border-blue-gray-200 bg-transparent px-3 py-2 text-sm outline outline-0 transition-all focus:border-2 focus:border-blue-500">
                  {provinces.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Field>
              </div>

              {/* Vĩ độ */}
              <div className="flex flex-col gap-2">
                <Typography variant="small" className="font-bold text-gray-600">Vĩ độ</Typography>
                <Field name="latitude">
                  {({ field }) => (
                    <Input {...field} size="lg" placeholder="Vĩ độ" color="blue" />
                  )}
                </Field>
                <ErrorMessage name="latitude" component="div" className="text-red-500 text-xs italic" />
              </div>

              {/* Kinh độ */}
              <div className="flex flex-col gap-2">
                <Typography variant="small" className="font-bold text-gray-600">Kinh độ</Typography>
                <Field name="longitude">
                  {({ field }) => (
                    <Input {...field} size="lg" placeholder="Kinh độ" color="blue" />
                  )}
                </Field>
                <ErrorMessage name="longitude" component="div" className="text-red-500 text-xs italic" />
              </div>

              <div className="col-span-2">
                <Typography variant="h6" color="blue" className="mb-2 border-b border-blue-100 pb-1 mt-4">
                  Truyền dẫn
                </Typography>
              </div>

              {/* Loại truyền dẫn */}
              <div className="flex flex-col gap-2">
                <Typography variant="small" className="font-bold text-gray-600">Loại truyền dẫn</Typography>
                <Field as="select" name="siteTransmissionType.id" className="h-11 rounded-md border border-blue-gray-200 bg-transparent px-3 py-2 text-sm outline outline-0 transition-all focus:border-2 focus:border-blue-500">
                  {transTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </Field>
              </div>

              {/* Đơn vị sở hữu */}
              <div className="flex flex-col gap-2">
                <Typography variant="small" className="font-bold text-gray-600">Đơn vị sở hữu TD</Typography>
                <Field as="select" name="transmissionOwner.id" className="h-11 rounded-md border border-blue-gray-200 bg-transparent px-3 py-2 text-sm outline outline-0 transition-all focus:border-2 focus:border-blue-500">
                  <option value="">- Chưa chọn -</option>
                  {transOwners.map(owner => (
                    <option key={owner.id} value={owner.id}>{owner.name}</option>
                  ))}
                </Field>
              </div>

              {/* Ghi chú */}
              <div className="col-span-2 flex flex-col gap-2">
                <Typography variant="small" className="font-bold text-gray-600">Ghi chú</Typography>
                <Field as="textarea" name="note" className="min-h-[100px] rounded-md border border-blue-gray-200 bg-transparent px-3 py-2 text-sm outline outline-0 transition-all focus:border-2 focus:border-blue-500" />
              </div>

            </div>

            <CardFooter className="flex justify-center gap-4 mt-8">
              <Button size="lg" color="red" variant="outlined" onClick={() => navigate("/sites")}>Hủy</Button>
              <Button size="lg" color="blue" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Lưu trạm"}
              </Button>
            </CardFooter>
          </Card>
        </Form>
      )}
    </Formik>
  );
}

export default SiteCreate;