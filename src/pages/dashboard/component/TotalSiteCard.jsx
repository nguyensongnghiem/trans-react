import { useEffect, useState } from "react";
import { Spinner } from "@material-tailwind/react";
import * as siteService from "../../../services/SiteService";
import DashboardCard from "./DashboardCard";
function TotalSiteCard() {
    const [isLoading, setIsLoading] = useState(true);
    const [totalSites, setTotalSites] = useState(0);
    useEffect(() => {
        const getTotalSites = async () => {
            const totalSites = await siteService.getTotalSites();
            setTotalSites(totalSites);
        }
        setIsLoading(true)
        getTotalSites();
        setIsLoading(false)
    }, [])

    if (isLoading) {
        return <Spinner />
    }
    return (
        <DashboardCard title="Tổng số trạm" content={totalSites} color="white" bgColor='blue' detailUrl='/site'></DashboardCard>
    );
}

export default TotalSiteCard;