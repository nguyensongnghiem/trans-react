import { useEffect, useState } from "react";
import * as Yup from "yup";
import useAxiosPrivate from "../../hooks/useAxiosPrivate.jsx";
import { Field, Form, Formik } from "formik";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  ServerIcon,
  ShareIcon,
  DocumentTextIcon,
  SignalIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import React from "react";
import {
  Input,
  Spinner,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Typography,
} from "@material-tailwind/react";
import "leaflet/dist/leaflet.css";

import SiteInfoCard from "./component/SiteInfoCard.jsx";
import DeviceInfoCard from "./component/DeviceInfoCard.jsx";
import OfcInfoCard from "./component/OfcInfoCard.jsx";
import ContractInfoCard from "./component/ContractInfoCard.jsx";
import LeaselineInfoCard from "./component/LeaselineInfoCard.jsx";
import CustomButton from "../../components/CustomButton.jsx";

function SiteLookup() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchId, setSearchId] = useState();
  const [simpleSiteList, setSimpleSiteList] = useState([]);
  const [site, setSite] = useState();
  const [activeTab, setActiveTab] = React.useState("general");
  const axiosInstance = useAxiosPrivate();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const siteList = await axiosInstance.get("sites/simple-list");
        setSimpleSiteList(siteList.data || []);
      } catch (error) {
        console.log(error);
        toast.error("Lỗi tải danh sách trạm.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!searchId) return;
      try {
        setIsLoading(true);

        // 1. Fetch Site Detail (General Info, Devices, Leased Lines)
        const siteResult = await axiosInstance.get(`sites/${searchId}/detail`);
        const rawSite = siteResult.data;

        // 2. Fetch Hired FO Lines from dedicated API
        const ofcResult = await axiosInstance.get(`hired-fos/site/${searchId}`);
        const ofcList = ofcResult.data || [];

        // 3. Extract Contracts from the OFC list
        const uniqueContractsMap = new Map();
        ofcList.forEach((line) => {
          if (line.foContract) {
            uniqueContractsMap.set(line.foContract.id, line.foContract);
          }
        });
        const extractedContracts = Array.from(uniqueContractsMap.values());

        setSite({
          ...rawSite,
          ofcList: ofcList,
          contractList: extractedContracts,
        });
      } catch (error) {
        console.log(error);
        toast.error("Lỗi khi tải thông tin trạm.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [searchId]);

  function handleSearch(value) {
    const searchTerm = value.searchTerm.trim();
    if (!searchTerm) return;

    const foundSite = simpleSiteList.find(
      (s) => s.siteId && s.siteId.toLowerCase() === searchTerm.toLowerCase(),
    );

    if (foundSite) {
      setSearchId(foundSite.id);
    } else {
      toast.warn(`Không tìm thấy Site ID "${searchTerm}" trong danh sách.`);
    }
  }

  // Define Tabs Configuration
  const dataTabs = [
    {
      label: "Tổng quan",
      value: "general",
      icon: ServerIcon,
      content: (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1">
            <SiteInfoCard site={site} siteList={simpleSiteList} />
          </div>
          <div className="xl:col-span-2">
            <DeviceInfoCard site={site} />
          </div>
        </div>
      ),
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <span>Cáp quang (OFC)</span>
          <span className="bg-blue-100 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {site?.ofcList?.length || 0}
          </span>
        </div>
      ),
      value: "ofc",
      icon: ShareIcon,
      content: (
        <div>
          <OfcInfoCard ofcList={site?.ofcList} />
        </div>
      ),
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <span>Hợp đồng</span>
          <span className="bg-blue-100 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {site?.contractList?.length || 0}
          </span>
        </div>
      ),
      value: "contracts",
      icon: DocumentTextIcon,
      content: (
        <div>
          <ContractInfoCard contractList={site?.contractList} />
        </div>
      ),
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <span>Kênh thuê riêng</span>
          <span className="bg-blue-100 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {site?.leaseLineList?.length || 0}
          </span>
        </div>
      ),
      value: "leaseline",
      icon: SignalIcon,
      content: (
        <div>
          <LeaselineInfoCard leaselineList={site?.leaseLineList} />
        </div>
      ),
    },
  ];

  if (isLoading && !simpleSiteList.length)
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-10 w-10 text-gray-900" />
      </div>
    );

  return (
    <div className="w-full p-6 min-h-screen bg-gray-50/50">
      {/* Header & Search Section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Typography variant="h4" className="text-2xl font-bold text-gray-800">
            Tra cứu thông tin trạm
          </Typography>
        </div>

        <div className="w-full md:w-auto">
          <Formik
            initialValues={{ searchTerm: "" }}
            onSubmit={handleSearch}
            validationSchema={Yup.object({
              searchTerm: Yup.string().required("Vui lòng nhập Site ID"),
            })}
          >
            <Form className="flex gap-2 w-full md:w-[400px]">
              <div className="relative w-full">
                <Field
                  name="searchTerm"
                  as={Input}
                  icon={
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  }
                  label="Nhập Site ID (Ví dụ: DN_001)"
                  className="!border-gray-300 focus:!border-blue-800 !text-gray-900 bg-white shadow-sm rounded-lg"
                  labelProps={{
                    className: "hidden",
                  }}
                  containerProps={{
                    className: "min-w-0",
                  }}
                  placeholder="Nhập Site ID..."
                />
              </div>
              <CustomButton
                type="submit"
                size="md"
                className="flex items-center gap-2 bg-[#0d47a1] hover:bg-[#0a3a82] shadow-none hover:shadow-md whitespace-nowrap px-6"
              >
                Tra cứu
              </CustomButton>
            </Form>
          </Formik>
        </div>
      </div>

      {site ? (
        <div className="w-full">
          <Tabs value={activeTab} className="flex flex-col">
            <TabsHeader
              className="rounded-none border-b border-gray-200 bg-transparent p-0 mb-6"
              indicatorProps={{
                className:
                  "bg-transparent border-b-2 border-blue-800 shadow-none rounded-none",
              }}
            >
              {dataTabs.map(({ label, value, icon }) => (
                <Tab
                  key={value}
                  value={value}
                  onClick={() => setActiveTab(value)}
                  className={
                    activeTab === value
                      ? "text-blue-900 font-bold py-3 transition-all max-w-fit px-6"
                      : "text-gray-500 font-medium py-3 transition-all hover:bg-white/50 max-w-fit px-6"
                  }
                >
                  <div className="flex items-center gap-2">
                    {React.createElement(icon, { className: "w-5 h-5" })}
                    {label}
                  </div>
                </Tab>
              ))}
            </TabsHeader>
            <TabsBody
              className="p-0 bg-transparent"
              animate={{
                initial: { y: 0, x: 0 },
                mount: { y: 0, x: 0 },
                unmount: { y: 0, x: 0 },
              }}
            >
              {dataTabs.map(({ value, content }) => (
                <TabPanel key={value} value={value} className="p-0 h-full">
                  {content}
                </TabPanel>
              ))}
            </TabsBody>
          </Tabs>
        </div>
      ) : (
        /* Empty State */
        !isLoading && (
          <div className="flex flex-col items-center justify-center mt-20 text-center opacity-60">
            <MapPinIcon className="h-24 w-24 text-gray-300 mb-4" />
            <Typography variant="h5" color="blue-gray" className="font-normal">
              Chưa có trạm nào được chọn.
            </Typography>
            <Typography className="text-gray-500 mt-2">
              Vui lòng nhập Site ID vào ô tìm kiếm ở trên để xem chi tiết.
            </Typography>
          </div>
        )
      )}
    </div>
  );
}
export default SiteLookup;
