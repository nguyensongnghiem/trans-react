import { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import JSZip from "jszip";
import { 
  ChevronRightIcon, 
  ChevronDownIcon, 
  FolderIcon, 
  ListBulletIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowsPointingOutIcon,
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
  MapIcon,
} from "@heroicons/react/24/solid";
import { Typography, IconButton, Input, Tooltip, Checkbox } from "@material-tailwind/react";

// Fix lỗi icon mặc định của Leaflet trong React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component phụ để tự động zoom bản đồ vừa khít với tuyến cáp
function FitBounds({ bounds, zoomTrigger }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map, zoomTrigger]);
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

const KmlMap = ({ foId, onClose, title }) => {
  const [treeData, setTreeData] = useState(null);
  const [center, setCenter] = useState([21.0285, 105.8542]); // Mặc định Hà Nội
  const [showTree, setShowTree] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [zoomTrigger, setZoomTrigger] = useState(0);
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

  // Filter tree based on search term
  const displayTree = useMemo(() => {
      if (!searchTerm) return treeData;
      
      const filterNode = (node) => {
          const nameMatches = node.name.toLowerCase().includes(searchTerm.toLowerCase());
          let filteredChildren = [];
          if (node.children) {
              filteredChildren = node.children.map(filterNode).filter(Boolean);
          }
          
          if (nameMatches || filteredChildren.length > 0) {
              return {
                  ...node,
                  children: filteredChildren,
                  collapsed: false // Auto expand on search
              };
          }
          return null;
      };
      
      return filterNode(treeData);
  }, [treeData, searchTerm]);

  const handleZoomToFit = () => {
    setZoomTrigger(prev => prev + 1);
  };

  const handleExportKml = async () => {
    if (!foId) return;
    try {
      const response = await axiosInstance.get(`own-fos/${foId}/kml`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      
      // Lấy tên file từ header hoặc dùng title
      const contentDisposition = response.headers["content-disposition"];
      let filename = title ? `${title}.kml` : "map.kml";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length > 1) filename = filenameMatch[1];
      }
      
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Lỗi khi tải file KML:", error);
    }
  };

  if (!treeData) return <div className="flex items-center justify-center h-full text-gray-500">Đang tải bản đồ...</div>;

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm z-20 flex-shrink-0">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
                <MapIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
                <Typography variant="h5" color="blue-gray" className="font-bold leading-tight">
                   {title || treeData?.name || "Bản đồ tuyến cáp"}
                </Typography>
            </div>
         </div>

         <div className="flex items-center gap-1">
            <Tooltip content="Zoom to fit" className="z-[99999]">
                <IconButton variant="text" size="sm" color="blue-gray" onClick={handleZoomToFit}>
                   <ArrowsPointingOutIcon className="h-4 w-4" />
                </IconButton>
            </Tooltip>
            <Tooltip content="Export KML" className="z-[99999]">
                <IconButton variant="text" size="sm" color="blue-gray" onClick={handleExportKml}>
                   <ArrowDownTrayIcon className="h-4 w-4" />
                </IconButton>
            </Tooltip>
            <Tooltip content="Settings" className="z-[99999]">
                <IconButton variant="text" size="sm" color="blue-gray">
                   <AdjustmentsHorizontalIcon className="h-4 w-4" />
                </IconButton>
            </Tooltip>
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            <IconButton variant="text" size="sm" color="red" onClick={onClose}>
               <XMarkIcon className="h-5 w-5" />
            </IconButton>
         </div>
      </div>

      {/* 2. Main Content (Layer Panel + Map) */}
      <div className="flex flex-1 overflow-hidden relative">
          {/* Layer Panel (Left) */}
          <div className={`flex flex-col bg-white border-r border-gray-200 shadow-xl z-[1000] transition-all duration-300 ease-in-out ${showTree ? 'w-80' : 'w-0 overflow-hidden'}`}>
              {/* Search Layer */}
              <div className="p-3 border-b border-gray-100 bg-white">
                  <Input 
                    placeholder="Tìm kiếm layer..." 
                    icon={<MagnifyingGlassIcon className="h-4 w-4" />} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                  />
              </div>
              
              {/* Tree Content */}
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                  {displayTree ? (
                      <KmlTreeNode node={displayTree} onToggleVisibility={handleToggleVisibility} onToggleCollapse={handleToggleCollapse} />
                  ) : (
                      <div className="text-center text-gray-500 text-sm mt-4">Không tìm thấy kết quả</div>
                  )}
              </div>
          </div>

          {/* Map Area */}
          <div className="flex-1 relative h-full w-full bg-gray-100">
              <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                  <MapResizer showTree={showTree} />
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {features.map((feature, index) => {
                      if (feature.type === "Point") return <Marker key={index} position={feature.position}><Popup><div className="font-bold">{feature.name}</div><div className="text-sm" dangerouslySetInnerHTML={{__html: feature.description}} /></Popup></Marker>;
                      if (feature.type === "LineString") return <Polyline key={index} positions={feature.positions} color="blue" weight={4}><Popup><div className="font-bold">{feature.name}</div><div className="text-sm" dangerouslySetInnerHTML={{__html: feature.description}} /></Popup></Polyline>;
                      if (feature.type === "Polygon") return <Polygon key={index} positions={feature.positions} color="purple"><Popup><div className="font-bold">{feature.name}</div><div className="text-sm" dangerouslySetInnerHTML={{__html: feature.description}} /></Popup></Polygon>;
                      return null;
                  })}

                  <FitBounds bounds={mapBounds} zoomTrigger={zoomTrigger} />
              </MapContainer>

              {/* Toggle Sidebar Button (Floating) */}
              <div className="absolute top-4 left-4 z-[400]">
                  <IconButton size="sm" color="white" className="shadow-md text-blue-gray-700" onClick={() => setShowTree(!showTree)}>
                      <ListBulletIcon className="h-5 w-5" />
                  </IconButton>
              </div>
          </div>
      </div>

      {/* 3. Status Bar (Bottom) */}
      <div className="h-7 bg-white border-t border-gray-200 flex items-center justify-between px-4 text-[11px] text-gray-500 flex-shrink-0">
          <div>Ready</div>
          <div>{features.length} features loaded</div>
      </div>
    </div>
  );
};

const KmlTreeNode = ({ node, onToggleVisibility, onToggleCollapse, level = 0 }) => {
    const hasChildren = node.children && node.children.length > 0;
    
    return (
        <div className="select-none">
            <div 
                className={`flex items-center gap-2 py-2 px-2 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50/50 rounded-lg mb-0.5 ${level === 0 ? 'bg-gray-50/30' : ''}`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
                {/* Collapse Icon */}
                <div onClick={(e) => { e.stopPropagation(); hasChildren && onToggleCollapse(node.id); }} className="p-0.5 rounded hover:bg-gray-200 text-gray-400">
                    {hasChildren ? (
                        node.collapsed ? <ChevronRightIcon className="h-3 w-3 text-gray-500" /> : <ChevronDownIcon className="h-3 w-3 text-gray-500" />
                    ) : <div className="w-3" />}
                </div>
                
                {/* Visibility Toggle */}
                <div onClick={(e) => { e.stopPropagation(); }} className="mr-1">
                    <Checkbox 
                        checked={node.visible}
                        onChange={() => onToggleVisibility(node.id, !node.visible)}
                        containerProps={{ className: "p-1" }}
                        className="h-4 w-4 rounded border-gray-400 text-blue-600 hover:before:opacity-0"
                        ripple={false}
                    />
                </div>
                
                {/* Content */}
                <div className="flex-1 flex items-center gap-2 min-w-0" onClick={() => hasChildren && onToggleCollapse(node.id)}>
                    {/* Color Indicator */}
                    {node.type !== 'Folder' && node.type !== 'Document' && (
                        <div className={`w-1 h-3 rounded-full flex-shrink-0 ${node.type === 'LineString' ? 'bg-blue-500' : node.type === 'Polygon' ? 'bg-purple-500' : 'bg-red-500'}`}></div>
                    )}
                    
                    {node.type === 'Folder' || node.type === 'Document' ? (
                        <FolderIcon className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    ) : null}
                    
                    <div className="flex flex-col min-w-0">
                        <Typography variant="small" className="font-medium text-gray-700 truncate text-xs">
                            {node.name}
                        </Typography>
                    </div>
                </div>
            </div>
            {hasChildren && !node.collapsed && (
                <div>
                    {node.children.map(child => (
                        <KmlTreeNode key={child.id} node={child} onToggleVisibility={onToggleVisibility} onToggleCollapse={onToggleCollapse} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default KmlMap;