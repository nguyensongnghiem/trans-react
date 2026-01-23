import { Outlet } from "react-router-dom";

export default function DocumentLayout() {
  return (
    <div className="h-screen w-screen bg-white">
      <Outlet />
    </div>
  );
}
