import { useEffect, useMemo, useState } from "react";

import { deleteData, fetchData, postData } from "../../services/apiService.jsx";

import * as Yup from "yup";
import useAxiosPrivate from "../../hooks/useAxiosPrivate.jsx"; 
import { ErrorMessage, Field, Form, Formik } from "formik";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import OwnerChip from "../../components/OwnerChip.jsx";
import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import {
  ArrowRightCircleIcon,
  MinusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { toast } from "react-toastify";
import React from "react";
import {
  Input,
  Spinner,
  Button,
  
} from "@material-tailwind/react";
import {
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import 'leaflet/dist/leaflet.css'
import SiteInfoCard from "./component/SiteInfoCard.jsx";
import DeviceInfoCard from "./component/DeviceInfoCard.jsx";
function SiteLookup() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchId, setSearchId] = useState();
  const [simpleSiteList, setSimpleSiteList] = useState([]);
  const [site, setSite] = useState();
  const [activeTab, setActiveTab] = React.useState("siteInfo");
  const axiosInstance = useAxiosPrivate();
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const siteList = await axiosInstance.get("sites/simple-list");
        setSimpleSiteList(siteList.data);
        console.log(siteList);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);


  useEffect(() => {
    const loadData = async () => {
      try {

        const result = await axiosInstance.get(`sites/${searchId}/detail`);
        setSite(result.data)     
      } catch (error) {
        console.log(error)
      }
    }
    loadData();
  }, [searchId]);

  function handleSearch(value) {
    let id
    for (let site of simpleSiteList) {
      if (site.siteId === value.searchTerm) {
        id = site.id
        console.log(site);
        break

      }
    }
    if (id) { setSearchId(id) }

  }

  if (isLoading) return <Spinner />;
  return (
    <div className="container mx-auto p-5">
      <Formik
        initialValues={{
          searchTerm: ""
        }}
        onSubmit={handleSearch}
        validationSchema={Yup.object({
          searchTerm: Yup.string().required("Required"),
        })}
      >
        <Form>
          <div className="flex gap-3">
            <Field
              name="searchTerm"
              as={Input}
              icon={<MagnifyingGlassIcon />}
              variant="static"
              label="Site ID"
              placeholder="Tìm theo Site ID..."
            >
            </Field>
            <Button type="submit" size="sm" variant="gradient">Tìm</Button>
          </div>

        </Form>

      </Formik>
      {site &&
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-1 h-full">
            <DeviceInfoCard site={site} />
          </div>
          <div className="col-span-1 h-full">
            <SiteInfoCard site={site} siteList={simpleSiteList} />
          </div>


        </div>
      }
    </div >
  );
}
export default SiteLookup;
