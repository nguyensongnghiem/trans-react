import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

export default function PrivateRoutes() {
    let isAuth = true
    return (
        isAuth ? <Outlet /> : <Navigate to="/login" />
    )
}
