import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
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
  const [positions, setPositions] = useState([]);
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
        
        // Lấy thẻ <coordinates> (thường dùng trong LineString của KML)
        const coordinatesTags = kml.getElementsByTagName("coordinates");
        const newPositions = [];
        
        // KML format: lon,lat,alt (cách nhau bởi khoảng trắng hoặc xuống dòng)
        for (let i = 0; i < coordinatesTags.length; i++) {
            const coordsStr = coordinatesTags[i].textContent.trim();
            const points = coordsStr.split(/\s+/);
            
            points.forEach(point => {
                const parts = point.split(",");
                if (parts.length >= 2) {
                    // Leaflet format: [lat, lon]
                    newPositions.push([parseFloat(parts[1]), parseFloat(parts[0])]);
                }
            });
        }

        if (newPositions.length > 0) {
            setPositions(newPositions);
            setCenter(newPositions[0]);
        }
      } catch (error) {
        console.error("Lỗi khi tải hoặc parse KML:", error);
      }
    };

    if (foId) {
      fetchKml();
    }
  }, [foId, axiosInstance]);

  if (positions.length === 0) return <div className="flex items-center justify-center h-full text-gray-500">Đang tải bản đồ...</div>;

  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Polyline positions={positions} color="blue" weight={4} />
      <Marker position={positions[0]}>
        <Popup>Điểm đầu</Popup>
      </Marker>
      <Marker position={positions[positions.length - 1]}>
        <Popup>Điểm cuối</Popup>
      </Marker>
      <FitBounds bounds={positions} />
    </MapContainer>
  );
};

export default KmlMap;