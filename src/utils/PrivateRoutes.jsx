import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/authContext'
export default function PrivateRoutes() {
    const { token } = useAuth()

    return (
        token ? <Outlet /> : <Navigate to="/login" />
    )
}
