import { Card, CardBody, CardFooter, Typography, Button } from "@material-tailwind/react";
import { NavLink } from "react-router-dom";
import { MapContainer, TileLayer, useMap, Popup, Marker } from 'react-leaflet'
import { testIcon, CurrentSiteIcon } from "../marker/MarkerIcons";
import * as geolib from 'geolib';
import { HomeIcon } from "@heroicons/react/24/solid";

function SiteInfoCard(props) {
  const { site, siteList, detailUrl } = props;
  const position = [site.latitude, site.longitude];
  const nearestSite = siteList.filter(s => geolib.isPointWithinRadius({ latitude: s.latitude, longitude: s.longitude }, { latitude: site.latitude, longitude: site.longitude }, 2000))
  console.log(nearestSite);

  return (

    <Card className="p-4 shadow-none" key={site.siteId} >
      <div className="mb-2 flex gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
          <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
          <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
        </svg>

        <Typography variant='h5'>{site.siteId}</Typography>

      </div>
      <div className="mb-2 flex gap-2">

        <Typography variant='h6'>{site.siteName && ""}</Typography>
      </div>

      <MapContainer center={position} zoom={18} scrollWheelZoom={true} className="h-96 w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {nearestSite.map((s, index) => (
          <Marker key={index} position={[s.latitude, s.longitude]} icon={site.siteId === s.siteId ? testIcon : CurrentSiteIcon}>
            <Popup>
              {s.siteId}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

    </Card >
  );
}

export default SiteInfoCard;
