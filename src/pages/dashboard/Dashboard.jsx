import { useEffect, useState } from "react";
import * as siteService from "../../services/SiteService";
import * as routerService from "../../services/RouterService";
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
  const [isLoading, setIsLoading] = useState(true);
  const [totalSites, setTotalSites] = useState(0);
  // const [totalRouters, setTotalRouters] = useState(0);
  // const [totalLeaselines, setTotalLeaselines] = useState(0);
  // const [totalCostPerMonth, setTotalCostPerMonth] = useState(0);
  const [totalFoSites, setTotalFoSites] = useState(0);
  const [totalMWSites, setTotalMWSites] = useState(0);
  const [totalLLSites, setTotalLLSites] = useState(0);
  const [siteList, setSiteList] = useState([]);
  const [totalSitesByProvince, setTotalSitesByProvince] = useState([]);
  const [siteTransmissionTypeTallyByProvince, setSiteTransmissionTypeTallyByProvince] = useState({});

  // useEffect(() => {
  //   const getAllSites = async (setError) => {
  //     setIsLoading(true);
  //     const sites = await siteService.getAllSites();
  //     setSiteList(sites);
  //     setIsLoading(false);
  //   };

  //   getAllSites();
  // }, []);


  useEffect(() => {
    const getTotalSites = async () => {

      const totalSites = await siteService.getTotalSites();
      setTotalSites(totalSites);
    }
    setIsLoading(true)
    getTotalSites();
    setIsLoading(false)

    // getTotalRouters();
  }, [])

  // useEffect(() => {

  //   const getTotalLeaselines = async () => {
  //     const totalLeaseline = await leaselineService.getTotalLeaselines();
  //     setTotalLeaselines(totalLeaseline);
  //   }
  //   setIsLoading(true)
  //   getTotalLeaselines();
  //   setIsLoading(false)


  //   // getTotalRouters();
  // }, [])

  // useEffect(() => {
  //   const getTotalRouters = async () => {
  //     const totalRouters = await routerService.getTotalRouters();
  //     setTotalRouters(totalRouters);
  //   }
  //   setIsLoading(true)
  //   getTotalRouters();
  //   setIsLoading(false)


  // }, [])

  // useEffect(() => {
  //   const getTotalCostPerMonth = async () => {
  //     const totalCost = await leaselineService.getTotalCostPerMonth();
  //     setTotalCostPerMonth(totalCost);
  //   }
  //   setIsLoading(true)
  //   getTotalCostPerMonth()
  //   setIsLoading(false)

  // }, [])

  useEffect(() => {
    const getTotalFoSites = async () => {
      const totalFoSites = await siteTransmissionTypeService.getTotalFoSite();
      setTotalFoSites(totalFoSites);
    }
    getTotalFoSites()
    setIsLoading(false)

  }, [])

  useEffect(() => {
    const getTotalMWSites = async () => {
      const totalMWSites = await siteTransmissionTypeService.getTotalMWSite();
      setTotalMWSites(totalMWSites);
    }
    getTotalMWSites()
    setIsLoading(false)

  }, [])

  useEffect(() => {
    const getTotalLLSites = async () => {
      const totalLLSites = await siteTransmissionTypeService.getTotalLLSite();
      setTotalLLSites(totalLLSites);
    }
    getTotalLLSites()
    setIsLoading(false)

  }, [])


  useEffect(() => {
    const countSitesByProvince = async () => {
      const result = await siteService.countByProvince();
      setTotalSitesByProvince(result);
    }
    countSitesByProvince()
    setIsLoading(false)

  }, [])

  useEffect(() => {
    const countSiteByTransmissionType = async () => {
      const result = await siteService.countByTransmissionType();
      setSiteTransmissionTypeTallyByProvince(result);
    }
    countSiteByTransmissionType()
    setIsLoading(false)

  }, [])

  const VND = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });
  const HomeIcon = () => <HomeModernIcon />
  const data = [
    ['Loại truyền dẫn', 'Số trạm'],
    ['Cáp quang', totalFoSites],
    ['Viba', totalMWSites],
    ['Kênh thuê', totalLLSites]
  ]
  const dataSitesByProvince = [['Tỉnh/TP', 'Số trạm', { role: "annotation" }]]
  Object.keys(totalSitesByProvince).forEach((key) => {
    dataSitesByProvince.push([key, totalSitesByProvince[key], totalSitesByProvince[key]])
  })
  // console.log(dataSitesByProvince);

  // if (isLoading) return <Spinner />
  return (

    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <TotalSiteCard />
        <TotalRouterCard />
        <TotalLeaselineCard />
        <DashboardCard title="Tỷ lệ quang hóa" content={Math.round(totalFoSites / totalSites * 100) + '%'} color='white' bgColor="indigo"></DashboardCard>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <Typography variant="h4" className="border-b border-gray-200 p-4 uppercase" >Tỷ lệ truyền dẫn trạm</Typography>
          <Chart
            chartType="PieChart"
            data={data}

            width={"100%"}
            height={"400px"}
          />
        </Card>
        <Card className="p-4">
          <Typography variant="h4" className="border-b border-gray-200 p-4 uppercase" >Tỷ lệ truyền dẫn trạm</Typography>
          <Chart
            chartType="Bar"
            width="100%"
            height="400px"
            data={dataSitesByProvince}
            options={{
              legend: { position: 'right' },
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
      </div>


    </div >

  );
}

export default Dashboard;
