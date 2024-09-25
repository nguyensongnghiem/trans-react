import { useEffect, useState } from "react";
import { Spinner } from "@material-tailwind/react";
import * as siteService from "../../../services/SiteService";
import DashboardCard from "./DashboardCard";
function TotalSiteCard({ totalSites }) {




    return (
        <DashboardCard title="Tổng số trạm" content={totalSites} color="white" bgColor='blue' detailUrl='/site'></DashboardCard>
    );
}

export default TotalSiteCard;