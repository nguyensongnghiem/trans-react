import { useEffect, useMemo, useState } from "react";

import { deleteData, fetchData, postData } from "../../services/apiService.jsx";

import * as Yup from "yup";

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
  Card,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  ListItemSuffix,
  Chip,
  Accordion,
  AccordionHeader,
  AccordionBody,
  Alert,
  Input,
  IconButton,
  Spinner
} from "@material-tailwind/react";
import {
  PresentationChartBarIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  InboxIcon,
  PowerIcon,
  HashtagIcon,
} from "@heroicons/react/24/solid";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  CubeTransparentIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import SiteInfoCard from "./component/SiteInfoCard.jsx";
function SiteLookup() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchId, setSearchId] = useState();
  const [simpleSiteList, setSimpleSiteList] = useState([]);
  const [site, setSite] = useState();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const siteList = await fetchData("sites/simple-list");
        setSimpleSiteList(siteList);
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
        setIsLoading(true);
        const siteList = await fetchData("sites/simple-list");
        setSimpleSiteList(siteList);
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

        const result = await fetchData(`sites/${searchId}`);
        setSite(result);
        console.log(result);


      } catch (error) {
        console.log(error);
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
    <div className="mt-5">
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
          <div className="relative mx-auto flex w-2/4 items-center">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
              <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
              </svg>
            </div>
            <Field
              name="searchTerm"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-4 ps-10 text-lg text-blue-gray-800"
              placeholder="Tìm theo Site ID..."
            >
            </Field>
            <button type="submit" className="absolute bottom-2.5 end-2.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Tìm</button>
          </div>
        </Form>

      </Formik>
      {site &&
        <div className="flex">
          <SiteInfoCard site={site} siteList={simpleSiteList} />
        </div>
      }
    </div>
  );
}
export default SiteLookup;
