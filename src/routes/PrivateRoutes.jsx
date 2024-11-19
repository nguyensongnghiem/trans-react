import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/authContext'
import axios from 'axios'
export default function PrivateRoutes() {
    const { auth } = useAuth();
    const location = useLocation();
    const token = auth?.accessToken
   
    return (
        token ? <Outlet /> : <Navigate to="/login" state= {{ from: location }} replace />
    );
}