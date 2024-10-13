import { Card, CardBody, CardFooter, Typography, Button, List, ListItem, ListItemPrefix, ListItemSuffix, Chip } from "@material-tailwind/react";
import { NavLink } from "react-router-dom";
import { MapContainer, TileLayer, useMap, Popup, Marker } from 'react-leaflet'
import { testIcon } from "../marker/MarkerIcons";
import { HomeIcon } from "@heroicons/react/24/outline";
import * as geolib from 'geolib';
function DeviceInfoCard(props) {
  const { site, detailUrl } = props;

  console.log(site);

  return (

    <Card className="p-4" key={site.siteId} >
      <Typography variant="h5">Thông tin thiết bị</Typography>
      <List >
        {site.routerList.length > 0 ? site.routerList.map((router, index) => (
          <ListItem key={index}>
            <ListItemPrefix className="flex flex-col gap-1">
              <Chip color="red" variant="ghost" size="sm" value={router.transmissionDeviceType ? router.transmissionDeviceType.name : "N/A"} />
              <Chip color="teal" variant="ghost" size="sm" value={router.routerType ? router.routerType.name : "N/A"} />
            </ListItemPrefix>
            <div>

              <Typography variant="h7" color="blue-gray" className="font-bold">
                {router.name}
              </Typography>
              <Typography variant="h8" color="blue-gray" className="font-sm italic">
                {router.ip ? router.ip : ""}
              </Typography>

            </div>
          </ListItem>
        ))
          : 'Không có thiết bị truyền dẫn '
        }


      </List>
    </Card >
  );
}

export default DeviceInfoCard;
