import { useState } from "react";

import "./App.css";
import Header from "./components/Header";
import {
  BrowserRouter,
  Route,
  Routes,
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from "react-router-dom";
import SideBar2 from "./components/SideBar2.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAuth } from "./contexts/authContext.jsx";

function App() {
  const { user } = useAuth();
  return (
    <>

      <div className="flex h-screen min-h-screen flex-col">
        <Header></Header>
        <div className="flex flex-1 flex-col overflow-y-hidden sm:flex-row">
          <nav className="flex overflow-y-auto sm:min-w-64">
            <SideBar2></SideBar2>
          </nav>
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
        {/* <footer className="bg-gray-100 p-2">Footer</footer> */}
      </div>
      <ToastContainer />

    </>
  );
}

export default App;

// <div className="flex h-screen flex-col">
// <div className="flex flex-1 flex-col overflow-hidden">
//   {/*header*/}
//   <div className="w-full">
//     <Header></Header>
//   </div>

//   {/*sidebar + Main */}
//   <div className="flex flex-1">
//     <div className="basis-full sm:basis-2/12">
//       <SideBar></SideBar>
//     </div>
//     <div className="basis-full overflow-y-auto sm:basis-10/12">
//       <Routes>
//         <Route path="/" element={<h1>Dashboard</h1>} />
//         <Route path="/site" element={<SiteList />} />
//         <Route path="/router" element={<h1>Router List</h1>} />
//       </Routes>
//     </div>
//   </div>
// </div>
// </div>
