import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import axios from "axios";
export default function PrivateRoutes({allowedRoles}) {
  const { auth } = useAuth();
  const location = useLocation();
  const token = auth?.accessToken;
  const roles = auth?.roles;
  console.log(auth);
  return roles?.find(role=> allowedRoles?.includes(role) ) 
  ? <Outlet />  
  : token
  ? <Navigate to="/unauthorized" state={{ from: location }} replace />
  : <Navigate to="/login" state={{ from: location }} replace />
  
}
