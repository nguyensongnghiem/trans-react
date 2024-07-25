import { useEffect, useState } from "react";
import * as siteService from "../services/SiteService";

function SiteList() {
  const [siteList, setSiteList] = useState([]);
  useEffect(() => {
    getAllSites();
  }, []);
  const getAllSites = async () => {
    const sites = await siteService.getAllSites();
    setSiteList(sites);
  };
}

export default SiteList;
