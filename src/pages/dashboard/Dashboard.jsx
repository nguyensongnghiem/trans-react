import { useEffect, useState } from "react";
import {
  ArrowDownTrayIcon,
  HomeIcon,
  HomeModernIcon,
} from "@heroicons/react/24/outline";
import { PieChart, Pie, Sector, Cell, ResponsiveContainer } from "recharts";
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
import useAxiosPrivate from "../../hooks/useAxiosPrivate";

function Dashboard() {
  const [error, setError] = useState();
  const [isTransmissionDataLoading, setIsTransmissionDataLoading] =
    useState(true);
  const [isSiteDataLoading, setIsSiteDataLoading] = useState(true);
  const [isRouterDataLoading, setIsRouterDataLoading] = useState(true);
  const [isLeaselineDataLoading, setIsLeaselineDataLoading] = useState(true);

  const [countSitesByProvince, setCountSitesByProvince] = useState({});
  const [countByTransmissionType, setCountByTransmissionType] = useState({});
  const [
    countByTransmissionTypeInProvince,
    setCountByTransmissionTypeInProvince,
  ] = useState({});
  const [totalRouters, setTotalRouters] = useState(0);
  const [totalLeaselines, setTotalLeaselines] = useState(0);
  const [totalCostPerMonth, setTotalCostPerMonth] = useState(0);
  const axiosInstance = useAxiosPrivate();
  useEffect(() => {
    const getTotalRouters = async () => {
      setIsRouterDataLoading(true);
      const response = await axiosInstance.get("routers/reports/total");
      setTotalRouters(response.data);
      setIsRouterDataLoading(false);
    };
    getTotalRouters();
  }, []);

  useEffect(() => {
    const loadSiteData = async () => {
      setIsSiteDataLoading(true);
      try {
        const response = await axiosInstance.get(
          "sites/reports/count-by-province"
        );
        setCountSitesByProvince(response.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsSiteDataLoading(false);
      }
    };
    loadSiteData();
  }, []);

  useEffect(() => {
    const countSiteByTransmissionType = async () => {
      setIsTransmissionDataLoading(true);
      try {
        const [countByTransType, countByTransTypeInProvince] =
          await Promise.all([
            axiosInstance.get("sites/reports/count-by-transmission-type"),
            axiosInstance.get(
              "sites/reports/count-by-transmission-type-in-province"
            ),
          ]);
        setCountByTransmissionType(countByTransType.data);
        setCountByTransmissionTypeInProvince(countByTransTypeInProvince.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsTransmissionDataLoading(false);
      }
    };
    countSiteByTransmissionType();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsTransmissionDataLoading(true);
      try {
        const response = await axiosInstance.get(
          "sites/reports/count-by-transmission-type"
        );
        setCountByTransmissionType(response.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsTransmissionDataLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadLeaselineData = async () => {
      setIsLeaselineDataLoading(true);
      try {
        const [totalLeaselines, totalCostPerMonth] = await Promise.all([
          axiosInstance.get("leaselines/reports/total"),
          axiosInstance.get("leaselines/reports/total-cost-per-month"),
        ]);
        setTotalLeaselines(totalLeaselines.data);
        setTotalCostPerMonth(totalCostPerMonth.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLeaselineDataLoading(false);
      }
    };
    loadLeaselineData();
  }, []);

  const VND = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });
  const HomeIcon = () => <HomeModernIcon />;

  let totalSites = 0;
  for (let key in countSitesByProvince) {
    totalSites += countSitesByProvince[key];
  }

  let totalFoSites = 0;
  for (let key in countByTransmissionType) {
    if (key.includes("FO")) totalFoSites += countByTransmissionType[key];
  }

  let totalMWSites = 0;
  for (let key in countByTransmissionType) {
    if (key.includes("MW")) totalMWSites += countByTransmissionType[key];
  }

  let totalLLSites = 0;
  for (let key in countByTransmissionType) {
    if (key.includes("LL")) totalLLSites += countByTransmissionType[key];
  }

  const transmissionChartData = [
    ["Loại truyền dẫn", "Số trạm"],
    ["Cáp quang đầu tư", totalFoSites],
    ["Cáp quang thuê", totalFoSites],
    ["Viba", totalMWSites],
    ["Kênh thuê", totalLLSites],
  ];
  const sitesByProvinceChartData = [
    ["Tỉnh/TP", "Số trạm", { role: "annotation" }],
  ];
  Object.keys(countSitesByProvince).forEach((key) => {
    sitesByProvinceChartData.push([
      key,
      countSitesByProvince[key],
      countSitesByProvince[key],
    ]);
  });

  const transmissionTypeBarChartByProvince = [
    ["Tỉnh/TP", "Cáp quang", "Viba", "Kênh thuê"],
  ];
  Object.keys(countByTransmissionTypeInProvince).forEach((key) => {
    transmissionTypeBarChartByProvince.push([
      key,
      countByTransmissionTypeInProvince[key]["FO Đầu tư"] +
        countByTransmissionTypeInProvince[key]["FO Thuê"],
      countByTransmissionTypeInProvince[key]["MW DLC"] +
        (countByTransmissionTypeInProvince[key]["MW DLT"] || 0),
      countByTransmissionTypeInProvince[key]["LL"],
    ]);
  });

  const formatChartDataForAnnotations = (originalData) => {
    // Tạo bản sao của dữ liệu gốc để không làm thay đổi nó
    const processedData = [...originalData];

    // Thêm các cột chú thích vào tiêu đề (hàng đầu tiên)
    // Cần thêm 1 cột rỗng cho mỗi loại truyền dẫn để chứa chú thích
    const headerRow = processedData[0];
    const newHeaderRow = [headerRow[0]];
    for (let i = 1; i < headerRow.length; i++) {
      newHeaderRow.push(headerRow[i]);
      // Thêm một cột annotation tương ứng với mỗi cột dữ liệu
      newHeaderRow.push({ role: "annotation" });
    }
    processedData[0] = newHeaderRow;

    // Lặp qua từng hàng dữ liệu để tính toán và thêm giá trị phần trăm
    for (let i = 1; i < processedData.length; i++) {
      const row = processedData[i];
      const newRow = [row[0]];
      const total = row.slice(1).reduce((sum, value) => sum + value, 0);

      // Lặp qua từng giá trị trong hàng để tính phần trăm và thêm vào hàng mới
      for (let j = 1; j < row.length; j++) {
        const value = row[j];
        const percentage = total > 0 ? (value / total) * 100 : 0;
        const annotation = `${percentage.toFixed(0)}%`; // Định dạng giá trị phần trăm

        newRow.push(value);
        newRow.push(annotation);
      }
      processedData[i] = newRow;
    }

    return processedData;
  };
  const formattedTransmissionTypeBarChartByProvince =
    formatChartDataForAnnotations(transmissionTypeBarChartByProvince);
  

  console.log(formattedTransmissionTypeBarChartByProvince);
  const SiteIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-6"
      >
        <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
        <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
      </svg>
    );
  };

  const RouterIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-6"
      >
        <path d="M4.08 5.227A3 3 0 0 1 6.979 3H17.02a3 3 0 0 1 2.9 2.227l2.113 7.926A5.228 5.228 0 0 0 18.75 12H5.25a5.228 5.228 0 0 0-3.284 1.153L4.08 5.227Z" />
        <path
          fillRule="evenodd"
          d="M5.25 13.5a3.75 3.75 0 1 0 0 7.5h13.5a3.75 3.75 0 1 0 0-7.5H5.25Zm10.5 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm3.75-.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const CableIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-6"
      >
        <path
          fillRule="evenodd"
          d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const LeaselineIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-6"
      >
        <path
          fillRule="evenodd"
          d="M11.622 1.602a.75.75 0 0 1 .756 0l2.25 1.313a.75.75 0 0 1-.756 1.295L12 3.118 10.128 4.21a.75.75 0 1 1-.756-1.295l2.25-1.313ZM5.898 5.81a.75.75 0 0 1-.27 1.025l-1.14.665 1.14.665a.75.75 0 1 1-.756 1.295L3.75 8.806v.944a.75.75 0 0 1-1.5 0V7.5a.75.75 0 0 1 .372-.648l2.25-1.312a.75.75 0 0 1 1.026.27Zm12.204 0a.75.75 0 0 1 1.026-.27l2.25 1.312a.75.75 0 0 1 .372.648v2.25a.75.75 0 0 1-1.5 0v-.944l-1.122.654a.75.75 0 1 1-.756-1.295l1.14-.665-1.14-.665a.75.75 0 0 1-.27-1.025Zm-9 5.25a.75.75 0 0 1 1.026-.27L12 11.882l1.872-1.092a.75.75 0 1 1 .756 1.295l-1.878 1.096V15a.75.75 0 0 1-1.5 0v-1.82l-1.878-1.095a.75.75 0 0 1-.27-1.025ZM3 13.5a.75.75 0 0 1 .75.75v1.82l1.878 1.095a.75.75 0 1 1-.756 1.295l-2.25-1.312a.75.75 0 0 1-.372-.648v-2.25A.75.75 0 0 1 3 13.5Zm18 0a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-.372.648l-2.25 1.312a.75.75 0 1 1-.756-1.295l1.878-1.096V14.25a.75.75 0 0 1 .75-.75Zm-9 5.25a.75.75 0 0 1 .75.75v.944l1.122-.654a.75.75 0 1 1 .756 1.295l-2.25 1.313a.75.75 0 0 1-.756 0l-2.25-1.313a.75.75 0 1 1 .756-1.295l1.122.654V19.5a.75.75 0 0 1 .75-.75Z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  return (
    <div className="p-5">
      <div className="mb-6 grid gap-4 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-6">
        {/* Site  */}
        {isSiteDataLoading ? (
          <Spinner />
        ) : (
          <DashboardCard
            icon={SiteIcon()}
            detailUrl="/site"
            title="Trạm"
            content={totalSites + " trạm"}
            color="white"
            bgColor="blue"
          ></DashboardCard>
        )}
        {/* thiết bị IP  */}
        {isRouterDataLoading ? (
          <Spinner />
        ) : (
          <DashboardCard
            icon={RouterIcon()}
            detailUrl="/router"
            title="Thiết bị truyền dẫn IP"
            content={[totalRouters + " thiết bị IP", " xxx thiết bị OLT"]}
            color="white"
            bgColor="green"
          ></DashboardCard>
        )}
        {/* Cáp quang đầu tư   */}
        {isRouterDataLoading ? (
          <Spinner />
        ) : (
          <DashboardCard
            icon={RouterIcon()}
            detailUrl="/router"
            title="Cáp quang đầu tư"
            content={[totalRouters + " tuyến", totalRouters + " km"]}
            color="white"
            bgColor="gray"
          ></DashboardCard>
        )}
        {/* Cáp quang thuê */}
        {isRouterDataLoading ? (
          <Spinner />
        ) : (
          <DashboardCard
            icon={RouterIcon()}
            detailUrl="/router"
            title="Cáp quang thuê"
            content={[totalRouters + " tuyến", totalRouters + " km"]}
            color="white"
            bgColor="red"
          ></DashboardCard>
        )}
        {/* Kênh thuê */}
        {isLeaselineDataLoading ? (
          <Spinner />
        ) : (
          <DashboardCard
            icon={LeaselineIcon()}
            detailUrl="/site"
            title="Kênh thuê dung lượng"
            content={totalLeaselines + " kênh"}
            color="gray"
            bgColor="yellow"
          ></DashboardCard>
        )}
        {/* Viba */}
        {isTransmissionDataLoading ? (
          <Spinner />
        ) : (
          <DashboardCard
            icon={CableIcon()}
            detailUrl="/site"
            title="Viba"
            content={" xxx tuyến"}
            color="white"
            bgColor="indigo"
          ></DashboardCard>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
        {isTransmissionDataLoading ? (
          <Spinner />
        ) : (
          <Card className="rounded-sm p-4">
            <Typography
              variant="h5"
              className="border-b border-gray-200 p-4 uppercase"
            >
              Cơ cấu truyền dẫn trạm
            </Typography>
            <Chart
              chartType="PieChart"
              data={transmissionChartData}
              width={"100%"}
              height={"400px"}
              options={{
                pieHole: 0.4, // Creates a Donut Chart. Does not do anything when is3D is enabled
                is3D: true, // Enables 3D view
                // slices: {
                //   1: { offset: 0.2 }, // Explodes the second slice
                // },
                pieStartAngle: 30, // Rotates the chart

                legend: {
                  position: "bottom",
                  alignment: "center",
                  textStyle: {
                    color: "#233238",
                    fontSize: 11,
                  },
                },
              }}
            />
          </Card>
        )}

        {/* {isSiteDataLoading ? (
          <Spinner />
        ) : (
          <Card className="col-span-2 rounded-sm p-4 lg:col-span-1">
            <Typography
              variant="h5"
              className="border-b border-gray-200 p-4 uppercase"
            >
              Số trạm theo tỉnh
            </Typography>
            <Chart
              chartType="Bar"
              width="100%"
              height="400px"
              data={sitesByProvinceChartData}
              options={{
                legend: { position: "top" },              

                hAxis: {
                  title: "Tổng số trạm",
                  minValue: 0,
                  textPosition: "in",
                },
                vAxis: {
                  title: "Tỉnh/TP",
                },
              }}
            />
          </Card>
        )} */}
        {isTransmissionDataLoading ? (
          <Spinner />
        ) : (
          <Card className="rounded-sm p-4">
            <Typography
              variant="h4"
              className="border-b border-gray-200 p-4 uppercase"
            >
              Tỷ lệ truyền dẫn theo tỉnh
            </Typography>
            <Chart
              chartType="BarChart"
              width="100%"
              height="400px"
              // data={newdata}
              data={formattedTransmissionTypeBarChartByProvince}
              options={{
                chartArea: { width: "70%" },
                isStacked: "percent",
                hAxis: {
                  title: "Tỷ lệ trạm theo loại truyền dẫn",
                  minValue: 0,
                },
                vAxis: {
                  title: "Tỉnh/TP",
                },
                // Cấu hình các chú thích (annotations) để hiển thị giá trị
                annotations: {
                  alwaysOutside: true,
                  textStyle: {
                    fontSize: 12,
                    color: "#000",
                  },
                },
                legend: { position: "top", maxLines: 3 },
              }}
            />
          </Card>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
