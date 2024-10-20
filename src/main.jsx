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

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [


      {
        path: "/login",
        element: <Login />
      },

      {
        element: <PrivateRoutes />,
        children: [
          {
            path: "/fo-contract",
            element: <FoContract />,
            children: [
              {
                path: "/fo-contract/:id",
                element: <FoConTractDetail />
              }
            ]
          },
          {
            path: "/router",
            element: <RouterList />
          },
          {
            path: "/site",
            element: <SiteList2 />
          },
          {
            path: "/site/lookup",
            element: <SiteLookup />
          },
          {
            path: "/",
            element: <Dashboard />
          }
        ]
      },
    ]
  },
]);
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>

  /* <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode> */
);
