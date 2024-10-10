import { Card, CardBody, CardFooter, Typography, Button } from "@material-tailwind/react";
import { NavLink } from "react-router-dom";
import { MapContainer, TileLayer, useMap, Popup, Marker } from 'react-leaflet'
import { testIcon } from "../marker/MarkerIcons";
import * as geolib from 'geolib';
function SiteInfoCard(props) {
  const { site, siteList, detailUrl } = props;
  const position = [site.latitude, site.longitude];
  const nearestSite = siteList.filter(s => geolib.isPointWithinRadius({ latitude: s.latitude, longitude: s.longitude }, { latitude: site.latitude, longitude: site.longitude }, 2000))
  console.log(nearestSite);

  return (

    <Card className="stretch mt-6 flex flex-1 justify-between rounded-sm p-4 hover:shadow-lg" key={site.siteId} >
      <CardBody className="p-2">
        <div >
          <Typography variant='h4'>{site.siteId}</Typography>
        </div>
        <div >
          <Typography variant='h6'>{site.siteName}</Typography>
        </div>
        <MapContainer center={position} zoom={18} scrollWheelZoom={true} className="h-96 w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {nearestSite.map((s, index) => (
            <Marker key={index} position={[s.latitude, s.longitude]} icon={testIcon}>
              <Popup>
                {s.siteId}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </CardBody>
      <CardFooter className="p-1 text-end"  >
        <NavLink to={detailUrl}>
          <Button
            size="sm"
            variant="text"
            className="flex items-center gap-2"

          >
            Chi tiết
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 30 30"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
              />
            </svg>
          </Button>
        </NavLink>
      </CardFooter>
    </Card >
  );
}

export default SiteInfoCard;
