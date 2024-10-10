import { useEffect, useState } from "react";
import * as siteService from "../../services/SiteService";
import * as routerService from "../../services/RouterService";
import { fetchData, postData } from "../../services/apiService";
import * as leaselineService from "../../services/LeaselineService";
import * as siteTransmissionTypeService from "../../services/SiteTransmissionTypeService";
import { ArrowDownTrayIcon, HomeIcon, HomeModernIcon } from "@heroicons/react/24/outline";
import { PieChart, Pie, Sector, Cell, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Typography,
  Button,
  Spinner,
} from "@material-tailwind/react";
import DashboardCard from "./component/DashboardCard";
import { Chart } from "react-google-charts";
import TotalSiteCard from "./component/TotalSiteCard";
import TotalRouterCard from "./component/TotalRouterCard";
import TotalLeaselineCard from "./component/TotalLeaselineCard";

function Dashboard() {
  const [error, setError] = useState();
  const [isTransmissionDataLoading, setIsTransmissionDataLoading] = useState(true);
  const [isSiteDataLoading, setIsSiteDataLoading] = useState(true);
  const [isRouterDataLoading, setIsRouterDataLoading] = useState(true);
  const [isLeaselineDataLoading, setIsLeaselineDataLoading] = useState(true);

  const [countSitesByProvince, setCountSitesByProvince] = useState({});
  const [countByTransmissionType, setCountByTransmissionType] = useState({});
  const [countByTransmissionTypeInProvince, setCountByTransmissionTypeInProvince] = useState({});
  const [totalRouters, setTotalRouters] = useState(0);
  const [totalLeaselines, setTotalLeaselines] = useState(0);
  const [totalCostPerMonth, setTotalCostPerMonth] = useState(0);
  useEffect(() => {
    const getTotalRouters = async () => {
      setIsRouterDataLoading(true)
      const totalRouters = await routerService.getTotalRouters();
      setTotalRouters(totalRouters);
      setIsRouterDataLoading(false)
    }
    getTotalRouters();

  }, [])

  useEffect(() => {
    const loadSiteData = async () => {
      setIsSiteDataLoading(true)
      try {
        const data = await fetchData("sites/reports/count-by-province");
        setCountSitesByProvince(data);


      } catch (error) {
        console.log(error);
      }
      finally {
        setIsSiteDataLoading(false)
      }
    }
    loadSiteData()

  }, [])

  useEffect(() => {
    const countSiteByTransmissionType = async () => {
      setIsTransmissionDataLoading(true)
      try {
        const [countByTransType, countByTransTypeInProvince] = await Promise.all([
          fetchData("sites/reports/count-by-transmission-type"),
          fetchData("sites/reports/count-by-transmission-type-in-province")
        ])
        setCountByTransmissionType(countByTransType)
        setCountByTransmissionTypeInProvince(countByTransTypeInProvince)
      } catch (error) {
        console.log(error);

      }
      finally {
        setIsTransmissionDataLoading(false)
      }
    }
    countSiteByTransmissionType()

  }, [])

  useEffect(() => {
    const loadData = async () => {
      setIsTransmissionDataLoading(true)
      try {
        const result = await fetchData("sites/reports/count-by-transmission-type")
        setCountByTransmissionType(result);
      } catch (error) {
        console.log(error);

      }
      finally {
        setIsTransmissionDataLoading(false)
      }
    }
    loadData()

  }, [])


  useEffect(() => {
    const loadLeaselineData = async () => {
      setIsLeaselineDataLoading(true)
      try {
        const [totalLeaselines, totalCostPerMonth] = await Promise.all([
          fetchData("leaselines/reports/total"),
          fetchData("leaselines/reports/total-cost-per-month")
        ])
        setTotalLeaselines(totalLeaselines)
        setTotalCostPerMonth(totalCostPerMonth)
      } catch (error) {
        console.log(error);

      }
      finally {
        setIsLeaselineDataLoading(false)
      }
    }
    loadLeaselineData()

  }, [])


  const VND = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });
  const HomeIcon = () => <HomeModernIcon />


  let totalSites = 0
  for (let key in countSitesByProvince) {
    totalSites += countSitesByProvince[key]
  }

  let totalFoSites = 0
  for (let key in countByTransmissionType) {
    if (key.includes("FO")) totalFoSites += countByTransmissionType[key]
  }

  let totalMWSites = 0
  for (let key in countByTransmissionType) {
    if (key.includes("MW")) totalMWSites += countByTransmissionType[key]
  }

  let totalLLSites = 0
  for (let key in countByTransmissionType) {
    if (key.includes("LL")) totalLLSites += countByTransmissionType[key]
  }

  const transmissionChartData = [
    ['Loại truyền dẫn', 'Số trạm'],
    ['Cáp quang', totalFoSites],
    ['Viba', totalMWSites],
    ['Kênh thuê', totalLLSites]
  ]
  const sitesByProvinceChartData = [['Tỉnh/TP', 'Số trạm', { role: "annotation" }]]
  Object.keys(countSitesByProvince).forEach((key) => {
    sitesByProvinceChartData.push([key, countSitesByProvince[key], countSitesByProvince[key]])
  })

  const transmissionTypeBarChartByProvince = [
    ["Tỉnh/TP", "Cáp quang", "Viba", "Kênh thuê"]
  ]
  Object.keys(countByTransmissionTypeInProvince).forEach((key) => {
    transmissionTypeBarChartByProvince.push([
      key,
      countByTransmissionTypeInProvince[key]["FO Đầu tư"]
      + countByTransmissionTypeInProvince[key]["FO Thuê"],
      countByTransmissionTypeInProvince[key]["MW DLC"]
      + (countByTransmissionTypeInProvince[key]["MW DLT"] || 0),
      countByTransmissionTypeInProvince[key]["LL"]
    ])
  })

  const SiteIcon = () => {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
        <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
        <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
      </svg>
    )
  }

  const RouterIcon = () => {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
        <path d="M4.08 5.227A3 3 0 0 1 6.979 3H17.02a3 3 0 0 1 2.9 2.227l2.113 7.926A5.228 5.228 0 0 0 18.75 12H5.25a5.228 5.228 0 0 0-3.284 1.153L4.08 5.227Z" />
        <path fillRule="evenodd" d="M5.25 13.5a3.75 3.75 0 1 0 0 7.5h13.5a3.75 3.75 0 1 0 0-7.5H5.25Zm10.5 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm3.75-.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" clipRule="evenodd" />
      </svg>

    )
  }

  const CableIcon = () => {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
        <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clipRule="evenodd" />
      </svg>


    )
  }

  const LeaselineIcon = () => {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
        <path fillRule="evenodd" d="M11.622 1.602a.75.75 0 0 1 .756 0l2.25 1.313a.75.75 0 0 1-.756 1.295L12 3.118 10.128 4.21a.75.75 0 1 1-.756-1.295l2.25-1.313ZM5.898 5.81a.75.75 0 0 1-.27 1.025l-1.14.665 1.14.665a.75.75 0 1 1-.756 1.295L3.75 8.806v.944a.75.75 0 0 1-1.5 0V7.5a.75.75 0 0 1 .372-.648l2.25-1.312a.75.75 0 0 1 1.026.27Zm12.204 0a.75.75 0 0 1 1.026-.27l2.25 1.312a.75.75 0 0 1 .372.648v2.25a.75.75 0 0 1-1.5 0v-.944l-1.122.654a.75.75 0 1 1-.756-1.295l1.14-.665-1.14-.665a.75.75 0 0 1-.27-1.025Zm-9 5.25a.75.75 0 0 1 1.026-.27L12 11.882l1.872-1.092a.75.75 0 1 1 .756 1.295l-1.878 1.096V15a.75.75 0 0 1-1.5 0v-1.82l-1.878-1.095a.75.75 0 0 1-.27-1.025ZM3 13.5a.75.75 0 0 1 .75.75v1.82l1.878 1.095a.75.75 0 1 1-.756 1.295l-2.25-1.312a.75.75 0 0 1-.372-.648v-2.25A.75.75 0 0 1 3 13.5Zm18 0a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-.372.648l-2.25 1.312a.75.75 0 1 1-.756-1.295l1.878-1.096V14.25a.75.75 0 0 1 .75-.75Zm-9 5.25a.75.75 0 0 1 .75.75v.944l1.122-.654a.75.75 0 1 1 .756 1.295l-2.25 1.313a.75.75 0 0 1-.756 0l-2.25-1.313a.75.75 0 1 1 .756-1.295l1.122.654V19.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
      </svg>



    )
  }


  return (

    <div className="p-5">
      <div className="mb-6 grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {isSiteDataLoading ? <Spinner /> : <DashboardCard icon={SiteIcon()} detailUrl="/site" title="Tổng số trạm" content={totalSites} color='white' bgColor="blue"></DashboardCard>}
        {isRouterDataLoading ? <Spinner /> : <DashboardCard icon={RouterIcon()} detailUrl='/router' title="Tổng số thiết bị" content={totalRouters} color='white' bgColor="green"></DashboardCard>}
        {isLeaselineDataLoading ? <Spinner /> : <DashboardCard icon={LeaselineIcon()} title="Tổng số kênh thuê" content={totalLeaselines} subContent={VND.format(totalCostPerMonth) + '/ tháng'} color='gray' bgColor="yellow"></DashboardCard>}
        {isTransmissionDataLoading ? <Spinner /> : <DashboardCard icon={CableIcon()} title="Tỷ lệ quang hóa" content={Math.round(totalFoSites / totalSites * 100) + '%'} color='white' bgColor="indigo"></DashboardCard>}

      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {isTransmissionDataLoading ? <Spinner /> :
          <Card className="col-span-2 p-4 lg:col-span-1">
            <Typography variant="h4" className="border-b border-gray-200 p-4 uppercase" >Tỷ lệ truyền dẫn trạm</Typography>
            <Chart
              chartType="PieChart"
              data={transmissionChartData}

              width={"100%"}
              height={"400px"}
            />
          </Card>
        }

        {isSiteDataLoading ? <Spinner /> :
          <Card className="col-span-2 p-4 lg:col-span-1">
            <Typography variant="h4" className="border-b border-gray-200 p-4 uppercase" >Số trạm theo tỉnh</Typography>
            <Chart
              chartType="Bar"
              width="100%"
              height="400px"
              data={sitesByProvinceChartData}
              options={{
                legend: { position: 'top' },
                title: "Số trạm theo tỉnh/TP",

                hAxis: {
                  title: "Tổng số trạm",
                  minValue: 0,
                  textPosition: 'in'
                },
                vAxis: {
                  title: "Tỉnh/TP",

                }

              }}
            />
          </Card>
        }
        {isTransmissionDataLoading ? <Spinner /> :
          <Card className="col-span-1 p-4 lg:col-span-2">
            <Typography variant="h4" className="border-b border-gray-200 p-4 uppercase" >Tỷ lệ truyền dẫn theo tỉnh</Typography>
            <Chart
              chartType="BarChart"
              width="100%"
              height="500px"
              data={transmissionTypeBarChartByProvince}
              options={{

                chartArea: { width: "50%" },
                isStacked: 'percent',
                hAxis: {
                  title: "Tỷ lệ trạm theo loại truyền dẫn",
                  minValue: 0,
                },
                vAxis: {
                  title: "Tỉnh/TP",
                },
              }}
            />
          </Card>
        }
      </div>


    </div >

  );
}

export default Dashboard;
