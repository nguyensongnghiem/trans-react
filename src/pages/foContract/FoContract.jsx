import { useEffect, useMemo, useState } from "react";



import {deleteData, fetchData, postData} from "../../services/apiService.jsx";

import * as Yup from "yup";

import { ErrorMessage, Field, Form, Formik } from "formik";
import {NavLink, Outlet, useNavigate} from "react-router-dom";
import OwnerChip from "../../components/OwnerChip.jsx";
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import {ArrowRightCircleIcon, MinusIcon, XMarkIcon} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {toast} from "react-toastify";
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
  Input, IconButton,
} from "@material-tailwind/react";
import {
  PresentationChartBarIcon,
  ShoppingBagIcon,
    DocumentTextIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  InboxIcon,
  PowerIcon,
    HashtagIcon
} from "@heroicons/react/24/solid";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  CubeTransparentIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import FoConTractDetail from "./FoConTractDetail.jsx";
import {PencilIcon, TrashIcon} from "@heroicons/react/24/solid/index.js";

function FoContract() {

  const navigate = useNavigate();
  const [contractList, setContractList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = React.useState(0);
  const [openAlert, setOpenAlert] = React.useState(true);
  const [searchTerm,setSearchTerm] = useState('')
  const [selectedId, setSelectedId] =useState()

  useEffect(() => {
    const loadContractList = async () => {
      setIsLoading(true);
      try {
      const list= await fetchData('contracts')
      setContractList(list);
      }
      catch (e) {
        console.log(e)
      }
      finally {
      setIsLoading(false);
      }
    };
    loadContractList();
  }, []);





  const handleOpen = (value) => {
    console.log(value)
    setOpen(open === value ? 0 : value);
  };


  function handleContractSearch(e) {
    setSearchTerm(e.target.value)
  }

  const contractListWithSearch = contractList
      .sort((a, b) => {
        const diffDate = new Date(a.signedDate) - new Date(b.signedDate)
        if (diffDate === 0 ) return a.contractNumber.localeCompare(b.contractNumber)
        return diffDate
      })
      .filter((contract)=> contract.contractNumber.includes(searchTerm))

  const contractByYearWithSearch = contractListWithSearch.reduce((acc, contract) => {
    const year = new Date(contract.signedDate).getFullYear();
    if (!acc[year]) {
      acc[year] = 0
    }
    acc[year] ++;
    return acc;
  },{})
  console.log(contractByYearWithSearch)
  const contractArrayByYearWithSearch = Object.entries(contractByYearWithSearch).map(([year, count]) => ({
    year: parseInt(year),
    count,
  }));

  // if (isLoading) return <Spinner />;
  return (
      <div className="grid grid-cols-12 gap-3">
        <div className='col-span-3'>
        <div className="h-[calc(100vh-2rem)] w-full  p-4 border-r-2 border-r-gray-300 overflow-y-auto" >
          <div className="mb-2 flex items-center gap-4 p-4">
            <Typography variant="h5" color="blue-gray">
              Danh mục hợp đồng
            </Typography>
          </div>
          <div className="p-2">
            <Input  icon={<MagnifyingGlassIcon className="h-5 w-5" />} variant='standard' label="Tìm theo tên hợp đồng" onChange={handleContractSearch} value={searchTerm}/>
          </div>
          <List>
            {
              contractArrayByYearWithSearch.map((item) => {
                return (
                    <Accordion
                        key={item.year}
                        open={open === item.year}
                        icon={
                          <Chip
                              value={item.count}
                              variant="ghost"
                              size="sm"
                              color='blue'
                              className="rounded-full"
                          />
                        }
                    >
                      <ListItem className="p-0" selected={open === item.year}>
                        <AccordionHeader onClick={() => handleOpen(item.year)} className="border-b-0 p-3">
                          <ListItemPrefix>
                            <HashtagIcon className="h-4 w-4" />
                          </ListItemPrefix>
                          <Typography color="blue" className="mr-auto font-semibold">
                            {item.year}
                          </Typography>
                        </AccordionHeader>
                      </ListItem>
                      <AccordionBody className="py-1">
                        <List className="p-0">
                          {contractListWithSearch.filter((contract) => {
                            return new  Date(contract.signedDate).getFullYear() === item.year;
                          })
                              .map((contract) => {
                                return (

                                    <ListItem key={contract.id} onClick={() => setSelectedId(contract.id)}>
                                      <ListItemPrefix>
                                        <ArrowRightCircleIcon strokeWidth={1} className="h-3 w-3" />
                                      </ListItemPrefix>
                                      <Typography color="blue-gray" className='text-md ' >
                                        {contract.contractNumber}
                                      </Typography>
                                    </ListItem>

                                )
                              })}
                        </List>
                      </AccordionBody>
                    </Accordion>
                )
              })
            }


          </List>

        </div>
        </div>
        <div className='col-span-9'>
          <FoConTractDetail id={selectedId}/>
        </div>
      </div>

  );
}
export default FoContract;
