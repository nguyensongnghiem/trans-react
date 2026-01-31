import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import JSZip from "jszip";
import { ChevronRightIcon, ChevronDownIcon, FolderIcon, DocumentIcon, ListBulletIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { Checkbox, Typography, IconButton } from "@material-tailwind/react";

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

// Component để resize map khi sidebar thay đổi kích thước
function MapResizer({ showTree }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300); // Đợi transition hoàn tất
    return () => clearTimeout(timer);
  }, [showTree, map]);
  return null;
}

// Helper functions for KML Parsing
const getDirectChildValue = (node, tagName) => {
  for (let i = 0; i < node.children.length; i++) {
    if (node.children[i].nodeName === tagName) {
      return node.children[i].textContent;
    }
  }
  return null;
};

const parseCoordinates = (str) => {
  return str.trim().split(/\s+/).map(item => {
    const [lon, lat] = item.split(",").map(parseFloat);
    return [lat, lon];
  }).filter(pos => !isNaN(pos[0]) && !isNaN(pos[1]));
};

const extractFeaturesFromPlacemark = (placemark) => {
    const name = getDirectChildValue(placemark, "name") || "No Name";
    const description = getDirectChildValue(placemark, "description") || "";
    const features = [];

    Array.from(placemark.getElementsByTagName("Point")).forEach(point => {
        const coordsStr = point.getElementsByTagName("coordinates")[0]?.textContent;
        if (coordsStr) {
            const coords = parseCoordinates(coordsStr);
            if (coords.length > 0) features.push({ type: "Point", position: coords[0], name, description });
        }
    });

    Array.from(placemark.getElementsByTagName("LineString")).forEach(line => {
        const coordsStr = line.getElementsByTagName("coordinates")[0]?.textContent;
        if (coordsStr) {
            const coords = parseCoordinates(coordsStr);
            if (coords.length > 0) features.push({ type: "LineString", positions: coords, name, description });
        }
    });

    Array.from(placemark.getElementsByTagName("Polygon")).forEach(poly => {
        const outer = poly.getElementsByTagName("outerBoundaryIs")[0];
        if (outer) {
            const coordsStr = outer.getElementsByTagName("coordinates")[0]?.textContent;
            if (coordsStr) {
                const coords = parseCoordinates(coordsStr);
                if (coords.length > 0) features.push({ type: "Polygon", positions: coords, name, description });
            }
        }
    });
    return features;
};

const parseKmlTree = (node) => {
    const type = node.nodeName;
    const name = getDirectChildValue(node, "name") || type;
    const id = Math.random().toString(36).substr(2, 9);
    
    if (type === "kml" || type === "Document" || type === "Folder") {
        const children = [];
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            if (["Document", "Folder", "Placemark"].includes(child.nodeName)) {
                const parsedChild = parseKmlTree(child);
                if (parsedChild) children.push(parsedChild);
            }
        }
        // Flatten kml root if it just wraps a Document
        if (type === 'kml' && children.length === 1) return children[0];
        
        return { id, type, name, children, visible: true, collapsed: false };
    } else if (type === "Placemark") {
        const features = extractFeaturesFromPlacemark(node);
        if (features.length > 0) {
            return { id, type, name, features, visible: true };
        }
    }
    return null;
};

const getVisibleFeatures = (node) => {
    if (!node) return [];
    let features = (node.visible && node.features) ? [...node.features] : [];
    if (node.children) {
        node.children.forEach(child => features = features.concat(getVisibleFeatures(child)));
    }
    return features;
};

const KmlMap = ({ foId }) => {
  const [treeData, setTreeData] = useState(null);
  const [center, setCenter] = useState([21.0285, 105.8542]); // Mặc định Hà Nội
  const [showTree, setShowTree] = useState(true);
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
        
        const rootNode = kml.documentElement;
        const tree = parseKmlTree(rootNode);
        setTreeData(tree);

      } catch (error) {
        console.error("Lỗi khi tải hoặc parse KML:", error);
      }
    };

    if (foId) {
      fetchKml();
    }
  }, [foId, axiosInstance]);

  const features = useMemo(() => getVisibleFeatures(treeData), [treeData]);
  
  const mapBounds = useMemo(() => {
      const coords = [];
      features.forEach(f => {
          if (f.type === 'Point') coords.push(f.position);
          else if (f.positions) f.positions.forEach(p => coords.push(p));
      });
      return coords;
  }, [features]);

  const handleToggleVisibility = (id, visible) => {
      const setAllDescendantsVisibility = (node, vis) => {
          let newNode = { ...node, visible: vis };
          if (newNode.children) {
              newNode.children = newNode.children.map(child => setAllDescendantsVisibility(child, vis));
          }
          return newNode;
      };

      const updateNode = (node) => {
          if (node.id === id) return setAllDescendantsVisibility(node, visible);
          if (node.children) {
              return { ...node, children: node.children.map(child => updateNode(child)) };
          }
          return node;
      };
      
      if (treeData) setTreeData(updateNode(treeData));
  };

  const handleToggleCollapse = (id) => {
      const updateNode = (node) => {
          if (node.id === id) return { ...node, collapsed: !node.collapsed };
          if (node.children) {
              return { ...node, children: node.children.map(child => updateNode(child)) };
          }
          return node;
      };
      if (treeData) setTreeData(updateNode(treeData));
  };

  if (!treeData) return <div className="flex items-center justify-center h-full text-gray-500">Đang tải bản đồ...</div>;

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      <div className="flex-1 relative h-full w-full transition-all duration-300">
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
      <MapResizer showTree={showTree} />
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

        {!showTree && (
            <div className="absolute top-2 right-2 z-[1000]">
                <IconButton size="sm" color="white" className="shadow-md" onClick={() => setShowTree(true)}>
                    <ListBulletIcon className="h-5 w-5 text-blue-gray-700" />
                </IconButton>
            </div>
        )}
      </div>

      {/* Sidebar */}
      <div className={`flex flex-col bg-white border-l border-gray-200 shadow-xl z-[1000] transition-all duration-300 ease-in-out ${showTree ? 'w-80' : 'w-0 overflow-hidden'}`}>
          <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
              <Typography variant="small" className="font-bold text-blue-gray-800 uppercase">
                  Danh sách lớp
              </Typography>
              <IconButton variant="text" size="sm" color="blue-gray" onClick={() => setShowTree(false)}>
                  <XMarkIcon className="h-4 w-4" />
              </IconButton>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
              <KmlTreeNode node={treeData} onToggleVisibility={handleToggleVisibility} onToggleCollapse={handleToggleCollapse} />
          </div>
      </div>
    </div>
  );
};

const KmlTreeNode = ({ node, onToggleVisibility, onToggleCollapse }) => {
    const hasChildren = node.children && node.children.length > 0;
    
    return (
        <div className="ml-2">
            <div className="flex items-center gap-1 py-0.5 hover:bg-blue-gray-50 rounded">
                <div onClick={() => hasChildren && onToggleCollapse(node.id)} className="cursor-pointer p-0.5">
                    {hasChildren ? (
                        node.collapsed ? <ChevronRightIcon className="h-3 w-3 text-gray-500" /> : <ChevronDownIcon className="h-3 w-3 text-gray-500" />
                    ) : <div className="w-3" />}
                </div>
                
                <Checkbox 
                    checked={node.visible} 
                    onChange={() => onToggleVisibility(node.id, !node.visible)}
                    containerProps={{ className: "p-0 mr-1" }}
                    className="h-3.5 w-3.5 rounded border-gray-400 text-blue-600"
                />
                
                <div className="flex items-center gap-1 cursor-pointer select-none flex-1 min-w-0" onClick={() => hasChildren && onToggleCollapse(node.id)}>
                    {node.type === 'Placemark' ? <DocumentIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" /> : <FolderIcon className="h-3.5 w-3.5 text-yellow-600 flex-shrink-0" />}
                    <span className="text-xs font-medium text-gray-700 truncate" title={node.name}>{node.name}</span>
                </div>
            </div>
            {hasChildren && !node.collapsed && (
                <div className="border-l border-gray-200 ml-2 pl-1">
                    {node.children.map(child => (
                        <KmlTreeNode key={child.id} node={child} onToggleVisibility={onToggleVisibility} onToggleCollapse={onToggleCollapse} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default KmlMap;