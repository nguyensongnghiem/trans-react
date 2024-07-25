import { useState } from "react";

import "./App.css";
import Header from "./components/Header";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import SideBar from "./components/SideBar.jsx";
import Main from "./components/Main.jsx";
import SiteList from "./pages/SiteList.jsx";

function App() {
  return (
    <>
      <BrowserRouter>
        <div className="h-screen flex flex-col">
          {/*header*/}
          <div className="">
            <Header></Header>
          </div>

          {/*sidebar + Main */}
          <div className="flex-1 flex flex-col sm:flex-row">
            <div className=" basis-full sm:basis-3/12 ">
              <SideBar></SideBar>
            </div>
            <div className=" basis-full sm:basis-9/12">
              <Routes>
                <Route path="/" element={<h1>Dashboard</h1>} />
                <Route path="/site" element={<SiteList />} />
                <Route path="/router" element={<h1>Router List</h1>} />
              </Routes>
            </div>
          </div>
        </div>
      </BrowserRouter>
    </>
  );
}

export default App;
