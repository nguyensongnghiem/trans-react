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

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/site",
        element: <SiteList2 />
      },
      {
        path: "/site/edit/:editId",
        element: <SiteEdit />
      },
      {
        path: "/site/create",
        element: <SiteCreate />
      },
      {
        path: "/",
        element: <Dashboard />
      },
      {
        path: "/router",
        element: <RouterList />
      },
    ]
  },
]);
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>

  /* <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode> */
);
