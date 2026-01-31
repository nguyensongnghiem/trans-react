import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import JSZip from "jszip";

// Fix lỗi icon mặc định của Leaflet trong React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component phụ để tự động zoom bản đồ vừa khít với tuyến cáp
function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

const KmlMap = ({ foId }) => {
  const [features, setFeatures] = useState([]);
  const [mapBounds, setMapBounds] = useState([]);
  const [center, setCenter] = useState([21.0285, 105.8542]); // Mặc định Hà Nội
  const axiosInstance = useAxiosPrivate();

  useEffect(() => {
    const fetchKml = async () => {
      try {
        // 1. Tải file dưới dạng ArrayBuffer để xử lý cả KML (text) và KMZ (binary zip)
        const response = await axiosInstance.get(`own-fos/${foId}/kml`, {
          responseType: "arraybuffer",
        });
        
        const buffer = response.data;
        let kmlText = "";

        try {
          // 2. Thử giải nén (nếu là KMZ)
          const zip = await JSZip.loadAsync(buffer);
          // Tìm file .kml đầu tiên trong file nén
          const kmlFile = Object.values(zip.files).find(f => f.name.toLowerCase().endsWith(".kml"));
          if (kmlFile) {
            kmlText = await kmlFile.async("string");
          }
        } catch (e) {
          // 3. Nếu lỗi giải nén (không phải zip), coi như là file KML text thường
          const decoder = new TextDecoder("utf-8");
          kmlText = decoder.decode(buffer);
        }

        // Parse XML
        const parser = new DOMParser();
        const kml = parser.parseFromString(kmlText, "text/xml");
        
        const placemarks = kml.getElementsByTagName("Placemark");
        const newFeatures = [];
        const allCoords = [];

        const parseCoordinates = (str) => {
          return str.trim().split(/\s+/).map(item => {
            const [lon, lat] = item.split(",").map(parseFloat);
            return [lat, lon];
          }).filter(pos => !isNaN(pos[0]) && !isNaN(pos[1]));
        };

        Array.from(placemarks).forEach((placemark, idx) => {
            const name = placemark.getElementsByTagName("name")[0]?.textContent || `Object ${idx + 1}`;
            const description = placemark.getElementsByTagName("description")[0]?.textContent || "";

            // Handle Points
            Array.from(placemark.getElementsByTagName("Point")).forEach(point => {
                const coordsStr = point.getElementsByTagName("coordinates")[0]?.textContent;
                if (coordsStr) {
                    const coords = parseCoordinates(coordsStr);
                    if (coords.length > 0) {
                        newFeatures.push({ type: "Point", position: coords[0], name, description });
                        allCoords.push(coords[0]);
                    }
                }
            });

            // Handle LineStrings
            Array.from(placemark.getElementsByTagName("LineString")).forEach(line => {
                const coordsStr = line.getElementsByTagName("coordinates")[0]?.textContent;
                if (coordsStr) {
                    const coords = parseCoordinates(coordsStr);
                    if (coords.length > 0) {
                        newFeatures.push({ type: "LineString", positions: coords, name, description });
                        coords.forEach(c => allCoords.push(c));
                    }
                }
            });

            // Handle Polygons
            Array.from(placemark.getElementsByTagName("Polygon")).forEach(poly => {
                const outer = poly.getElementsByTagName("outerBoundaryIs")[0];
                if (outer) {
                    const coordsStr = outer.getElementsByTagName("coordinates")[0]?.textContent;
                    if (coordsStr) {
                        const coords = parseCoordinates(coordsStr);
                        if (coords.length > 0) {
                            newFeatures.push({ type: "Polygon", positions: coords, name, description });
                            coords.forEach(c => allCoords.push(c));
                        }
                    }
                }
            });
        });

        if (newFeatures.length > 0) {
            setFeatures(newFeatures);
        }
        
        if (allCoords.length > 0) {
            setMapBounds(allCoords);
            setCenter(allCoords[0]);
        }
      } catch (error) {
        console.error("Lỗi khi tải hoặc parse KML:", error);
      }
    };

    if (foId) {
      fetchKml();
    }
  }, [foId, axiosInstance]);

  if (features.length === 0) return <div className="flex items-center justify-center h-full text-gray-500">Đang tải bản đồ hoặc không có dữ liệu...</div>;

  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {features.map((feature, index) => {
          if (feature.type === "Point") {
              return (
                  <Marker key={index} position={feature.position}>
                      <Popup>
                          <div className="font-bold">{feature.name}</div>
                          <div className="text-sm" dangerouslySetInnerHTML={{__html: feature.description}} />
                      </Popup>
                  </Marker>
              );
          }
          if (feature.type === "LineString") {
              return (
                  <Polyline key={index} positions={feature.positions} color="blue" weight={4}>
                      <Popup>
                          <div className="font-bold">{feature.name}</div>
                          <div className="text-sm" dangerouslySetInnerHTML={{__html: feature.description}} />
                      </Popup>
                  </Polyline>
              );
          }
          if (feature.type === "Polygon") {
              return (
                  <Polygon key={index} positions={feature.positions} color="purple">
                      <Popup>
                          <div className="font-bold">{feature.name}</div>
                          <div className="text-sm" dangerouslySetInnerHTML={{__html: feature.description}} />
                      </Popup>
                  </Polygon>
              );
          }
          return null;
      })}

      <FitBounds bounds={mapBounds} />
    </MapContainer>
  );
};

export default KmlMap;