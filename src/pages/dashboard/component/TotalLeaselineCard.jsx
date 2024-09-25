import { useEffect, useState } from "react";
import { Spinner } from "@material-tailwind/react";
import * as leaselineService from "../../../services/LeaselineService";
import DashboardCard from "./DashboardCard";
function TotalLeaselineCard() {
    const [isTotalLoading, setIsTotalLoading] = useState(true);
    const [isCostLoading, setIsCostLoading] = useState(true);
    const [totalLeaselines, setTotalLeaselines] = useState(0);
    const [totalCostPerMonth, setTotalCostPerMonth] = useState(0);
    useEffect(() => {
        const getTotalLeaselines = async () => {
            setIsTotalLoading(true)
            const totalLeaseline = await leaselineService.getTotalLeaselines();
            setIsTotalLoading(false)
            setTotalLeaselines(totalLeaseline);
        }

        getTotalLeaselines();

        // getTotalRouters();
    }, [])
    useEffect(() => {
        const getTotalCostPerMonth = async () => {
            setIsCostLoading(true)
            const totalCost = await leaselineService.getTotalCostPerMonth();
            setIsCostLoading(false)
            setTotalCostPerMonth(totalCost);
        }

        getTotalCostPerMonth()


    }, [])
    const VND = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    });
    if (isTotalLoading || isCostLoading) {
        return <Spinner />
    }
    return (
        <DashboardCard title="Tổng số kênh thuê" content={totalLeaselines} subContent={VND.format(totalCostPerMonth) + '/ tháng'} color="gray" bgColor='yellow'></DashboardCard>
    );
}

export default TotalLeaselineCard;