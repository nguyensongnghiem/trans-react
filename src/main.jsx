import { SidebarProvider } from "./contexts/SidebarContext.jsx";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "@material-tailwind/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import ErrorPage from "./pages/ErrorPage.jsx";
import SiteList from "./pages/SiteList.jsx";
import SiteEdit from "./pages/SiteEdit.jsx";
import SiteCreate from "./pages/SiteCreate.jsx";
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import SiteList2 from "./pages/SiteList2.jsx";
import RouterList from "./pages/RouterList.jsx";
import FoContract from "./pages/foContract/FoContract.jsx";
import FoConTractDetail from "./pages/foContract/FoConTractDetail.jsx";
import SiteLookup from "./pages/siteLookup/SiteLookup.jsx";
import AuthProvider from "./contexts/authContext.jsx";
import PrivateRoutes from "./routes/PrivateRoutes.jsx";
import Login from "./pages/Login.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import LeaselineList from "./pages/LeaselineList.jsx";
import HiredFoList from "./pages/HiredFoList.jsx";
import FoContractCreate from "./pages/foContract/FoContractCreate.jsx";
import FoReportBySupplier from "./pages/foContract/FoReportBySupplier.jsx";
import FoReportByContracts from "./pages/foContract/FoReportByContracts.jsx";
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/unauthorized",
        element: <Unauthorized />,
      },
      {
        element: <PrivateRoutes allowedRoles={["ROLE_ADMIN"]} />,
        children: [
          {
            path: "/fo-contract",
            element: <FoContract />,
            children: [
              {
                path: "/fo-contract/:id",
                element: <FoConTractDetail />,
              },
            ],
          },
           {
            path: "/fo-cost-by-supplier",
            element: <FoReportBySupplier />,            
          },
           {
            path: "/fo-cost-by-contracts",
            element: <FoReportByContracts />,            
          },
          {
            path: "/fo-create",
            element: <FoContractCreate />,
          },
          {
            path: "/hired-fo",
            element: <HiredFoList />,
          },
          {
            path: "/router",
            element: <RouterList />,
          },
          {
            path: "/site",
            element: <SiteList2 />,
          },
          {
            path: "/site/lookup",
            element: <SiteLookup />,
          },
          {
            path: "/leaseline",
            element: <LeaselineList />,
          },
        ],
      },
      {
        element: <PrivateRoutes allowedRoles={["ROLE_USER"]} />,
        children: [
          {
            path: "/",
            element: <Dashboard />,
          },
        ],
      },
    ],
  },
]);
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          <RouterProvider router={router} />
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
