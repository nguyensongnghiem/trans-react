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

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/site",
        element: <SiteList />
      },
      {
        path: "/site/edit/:editId",
        element: <SiteEdit />
      },
      {
        path: "/site/create",
        element: <SiteCreate />
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
