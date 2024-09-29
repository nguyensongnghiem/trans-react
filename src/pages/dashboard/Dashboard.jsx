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

  return (

    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {isSiteDataLoading ? <Spinner /> : <DashboardCard detailUrl="/site" title="Tổng số trạm" content={totalSites} color='white' bgColor="blue"></DashboardCard>}
        {isRouterDataLoading ? <Spinner /> : <DashboardCard detailUrl='/router' title="Tổng số thiết bị" content={totalRouters} color='white' bgColor="green"></DashboardCard>}
        {isLeaselineDataLoading ? <Spinner /> : <DashboardCard title="Tổng số kênh thuê" content={totalLeaselines} subContent={VND.format(totalCostPerMonth) + '/ tháng'} color='gray' bgColor="yellow"></DashboardCard>}
        {isTransmissionDataLoading ? <Spinner /> : <DashboardCard title="Tỷ lệ quang hóa" content={Math.round(totalFoSites / totalSites * 100) + '%'} color='white' bgColor="indigo"></DashboardCard>}

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
