import { useEffect, useState } from "react";
import { Spinner } from "@material-tailwind/react";
import * as routerService from "../../../services/RouterService";
import DashboardCard from "./DashboardCard";
function TotalRouterCard() {
    const [isLoading, setIsLoading] = useState(true);
    const [totalRouters, setTotalRouters] = useState(0);
    useEffect(() => {
        const getTotalRouters = async () => {
            const totalRouters = await routerService.getTotalRouters();
            setTotalRouters(totalRouters);
        }
        setIsLoading(true)
        getTotalRouters();
        setIsLoading(false)
    }, [])

    if (isLoading) {
        return <Spinner />
    }
    return (
        <DashboardCard title="Tổng số thiết bị" content={totalRouters} color="white" bgColor='green'></DashboardCard>
    );
}

export default TotalRouterCard;