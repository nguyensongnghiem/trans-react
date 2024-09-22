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
            const totalLeaseline = await leaselineService.getTotalLeaselines();
            setTotalLeaselines(totalLeaseline);
        }
        setIsTotalLoading(true)
        getTotalLeaselines();
        setIsTotalLoading(false)
        // getTotalRouters();
    }, [])
    useEffect(() => {
        const getTotalCostPerMonth = async () => {
            const totalCost = await leaselineService.getTotalCostPerMonth();
            setTotalCostPerMonth(totalCost);
        }
        setIsCostLoading(true)
        getTotalCostPerMonth()
        setIsCostLoading(false)

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