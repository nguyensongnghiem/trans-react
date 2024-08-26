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
        <main className="flex flex-col h-screen">
          <div className="flex">
            <Header></Header>
          </div>
          <div className="flex flex-1 overflow-hidden">
            <div className="flex bg-gray-100 w-64 ">
              <SideBar></SideBar>
            </div>
            <div className="flex flex-1 flex-col">
              <div className="flex flex-1 overflow-y-auto px-2">
                <Routes>
                  <Route path="/" element={<h1>Dashboard</h1>} />
                  <Route path="/site" element={<SiteList />} />
                  <Route path="/router" element={<h1>Router List</h1>} />
                </Routes>
              </div>
            </div>
          </div>
      
        </main>
      </BrowserRouter>
    </>
  );
}

export default App;

// <div className="h-screen flex flex-col">
// <div className="flex flex-1 flex-col overflow-hidden">
//   {/*header*/}
//   <div className="w-full">
//     <Header></Header>
//   </div>

//   {/*sidebar + Main */}
//   <div className="flex-1 flex">
//     <div className=" basis-full sm:basis-2/12 ">
//       <SideBar></SideBar>
//     </div>
//     <div className=" basis-full sm:basis-10/12 overflow-y-auto">
//       <Routes>
//         <Route path="/" element={<h1>Dashboard</h1>} />
//         <Route path="/site" element={<SiteList />} />
//         <Route path="/router" element={<h1>Router List</h1>} />
//       </Routes>
//     </div>
//   </div>
// </div>
// </div>