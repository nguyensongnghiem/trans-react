import { NavLink, useLocation } from "react-router-dom";
import { HomeIcon } from "@heroicons/react/24/solid";

// NOTE: This config is duplicated from SideBar2.jsx. For better maintenance,
// this should be moved to a shared file in a real-world application.
const menuConfig = [
    { id: 1, title: "Tổng quan mạng truyền dẫn", path: "/" },
    { id: 2, title: "Quản lý trạm", children: [ { title: "Danh sách trạm", path: "/site" }, { title: "Tra cứu thông tin trạm", path: "/site/lookup" } ] },
    { id: 3, title: "Quản lý thiết bị", children: [ { title: "Danh sách thiết bị", path: "/router" }, { title: "Quản lý cấu hình thiết bị", path: "/router/backup-dashboard" }, { title: "Lập lịch sao lưu cấu hình", path: "/router/backup-scheduler" } ] },
    { id: 4, title: "Quản lý cáp quang", children: [ { title: "Tuyến cáp quang thuê", path: "/hired-fo" }, { title: "Tuyến cáp quang đầu tư", path: "/own-fo" }, { title: "Hạ tầng mạng ngoại vi", path: "/under-construction/infrastructure" } ] },
    { id: 5, title: "Quản lý tuyến viba", children: [ { title: "Tuyến viba", path: "/microwave" }, { title: "Quản lý giấy phép tần số", path: "/admin/microwave-licenses" } ] },
    { id: 6, title: "Quản lý kênh thuê", children: [ { title: "Danh sách kênh thuê", path: "/leaseline" } ] },
    { id: 7, title: "Quản lý hợp đồng", children: [ { title: "Tổng quan", path: "/under-construction/contract-overview" }, { title: "Hợp đồng thuê FO", path: "/fo-contract" }, { title: "Hợp đồng thuê kênh dung lượng", path: "/under-construction/contract-leaseline" }, { title: "Hợp đồng thuê cột", path: "/under-construction/contract-pole" }, { title: "Hợp đồng cống bể", path: "/under-construction/contract-duct" } ] },
    { id: 8, title: "Báo cáo", children: [ { title: "Báo cáo tổng hợp", path: "/under-construction/report-summary" }, { title: "Báo cáo cước sử dụng kênh thuê", path: "/under-construction/report-cost" }, { title: "Báo cáo chi phí theo nhà cung cấp", path: "/fo-cost-by-supplier" }, { title: "Báo cáo chi phí theo hợp đồng", path: "/fo-cost-by-contracts" } ] },
    { id: 9, title: "Quản trị hệ thống", requiredRole: "ROLE_ADMIN", children: [ { title: "Quản lý Tỉnh/TP", path: "/province" }, { title: "Quản lý người dùng", path: "/admin/users" }, { title: "Quản lý phân quyền", path: "/admin/roles" }, { title: "Quản lý loại cáp quang", path: "/admin/fiber-types" }, { title: "Quản lý loại viba", path: "/admin/microwave-types" }, { title: "Quản lý chức năng thiết bị", path: "/admin/transmission-device-types" }, { title: "Quản lý model thiết bị", path: "/admin/router-types" }, { title: "Quản lý nhà cung cấp thiết bị", path: "/admin/vendors" }, { title: "Quản lý đơn vị sở hữu CSHT", path: "/admin/site-owners" }, { title: "Quản lý loại CSHT", path: "/admin/site-types" }, { title: "Quản lý đơn vị sở hữu TD", path: "/admin/transmission-owners" }, { title: "Quản lý loại TD trạm", path: "/admin/site-transmission-types" }, { title: "Quản lý đối tác vận hành cáp quang", path: "/admin/fiber-operators" }, { title: "Quản lý loại kết nối quang", path: "/admin/fo-connection-types" }, { title: "Quản lý cơ sở dữ liệu", path: "/admin/database" } ] },
];

// Helper to find path details in menuConfig
const findPathDetails = (path, config) => {
    // Handle special case for dynamic routes like contract details
    if (path.startsWith('/fo-contract/')) {
        return { title: 'Chi tiết hợp đồng', parent: { title: 'Quản lý hợp đồng' } };
    }

    for (const item of config) {
        if (item.path === path) {
            return { title: item.title, parent: null };
        }
        if (item.children) {
            for (const child of item.children) {
                if (child.path === path) {
                    return { title: child.title, parent: item };
                }
            }
        }
    }
    return null;
};

function BreadcrumbsWithIcon() {
    const location = useLocation();
    const pathDetails = findPathDetails(location.pathname, menuConfig);

    const renderSeparator = () => (
        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
    );

    // Default breadcrumb for unmatched paths
    if (!pathDetails) {
        const pathnames = location.pathname.split('/').filter((x) => x);
        const lastSegment = pathnames[pathnames.length - 1] || 'Dashboard';
        const capitalizedSegment = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');

        return (
            <nav className="flex" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 text-sm font-medium">
                    <li className="inline-flex items-center">
                        <NavLink to="/" className="inline-flex items-center gap-1.5 text-gray-500 transition-colors hover:text-blue-600">
                            <HomeIcon className="h-4 w-4" />
                            <span>Trang chủ</span>
                        </NavLink>
                    </li>
                    {pathnames.length > 0 && (
                        <li>
                            <div className="flex items-center">
                                {renderSeparator()}
                                <span className="ml-1 text-gray-700">{capitalizedSegment}</span>
                            </div>
                        </li>
                    )}
                </ol>
            </nav>
        );
    }

    return (
        <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 text-sm font-medium">
                <li className="inline-flex items-center">
                    <NavLink to="/" className="inline-flex items-center gap-1.5 text-gray-500 transition-colors hover:text-blue-600">
                        <HomeIcon className="h-4 w-4" />
                        <span>Trang chủ</span>
                    </NavLink>
                </li>
                {pathDetails.parent && (
                    <li>
                        <div className="flex items-center">
                            {renderSeparator()}
                            <span className="ml-1 select-none text-gray-500">{pathDetails.parent.title}</span>
                        </div>
                    </li>
                )}
                {pathDetails.title !== "Tổng quan mạng truyền dẫn" && (
                     <li>
                        <div className="flex items-center">
                            {renderSeparator()}
                            <span className="ml-1 select-none font-semibold text-gray-800">{pathDetails.title}</span>
                        </div>
                    </li>
                )}
            </ol>
        </nav>
    );
}

export default BreadcrumbsWithIcon;