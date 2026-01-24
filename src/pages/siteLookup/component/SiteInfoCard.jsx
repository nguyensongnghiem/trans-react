import { Card, Typography } from "@material-tailwind/react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { testIcon, CurrentSiteIcon } from "../marker/MarkerIcons";
import * as geolib from 'geolib';
import { MapPinIcon } from "@heroicons/react/24/solid";

function SiteInfoCard(props) {
  const { site, siteList } = props;
  const position = [site.latitude, site.longitude];
  const nearestSite = siteList.filter(s => geolib.isPointWithinRadius({ latitude: s.latitude, longitude: s.longitude }, { latitude: site.latitude, longitude: site.longitude }, 2000))

  return (
    <Card className="h-full border border-gray-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <Typography variant="h6" className="text-gray-800 font-bold flex items-center gap-2">
          <MapPinIcon className="h-5 w-5 text-gray-500" />
          Thông tin vị trí & Bản đồ
        </Typography>
        {site.siteId && (
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                {site.siteId}
            </span>
        )}
      </div>

      <div className="relative h-full min-h-[400px]">
        {site.siteName && (
            <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md p-3 rounded-lg border border-gray-200 shadow-lg max-w-[250px]">
                <Typography variant="small" className="font-bold text-gray-900 block truncate">
                    {site.siteName}
                </Typography>
                <div className="mt-1 space-y-0.5">
                     <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Tọa độ:</span>
                        <span className="font-mono text-gray-700">{site.latitude?.toFixed(4)}, {site.longitude?.toFixed(4)}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Lân cận:</span>
                        <span className="font-mono text-gray-700">{nearestSite.length - 1} trạm</span>
                     </div>
                </div>
            </div>
        )}

        <MapContainer center={position} zoom={16} scrollWheelZoom={true} className="h-full w-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={CurrentSiteIcon}>
             <Popup>
                <div className="text-center font-sans">
                    <strong className="text-blue-700 block text-sm mb-1">{site.siteId}</strong>
                    <span className="text-xs text-gray-600">{site.siteName}</span>
                </div>
             </Popup>
          </Marker>
          {nearestSite.map((s, index) => (
             s.siteId !== site.siteId && (
                <Marker key={index} position={[s.latitude, s.longitude]} icon={testIcon}>
                  <Popup>
                    <div className="text-center font-sans">
                        <strong className="text-gray-700 block text-xs">{s.siteId}</strong>
                    </div>
                  </Popup>
                </Marker>
             )
          ))}
        </MapContainer>
      </div>
    </Card>
  );
}

export default SiteInfoCard;
