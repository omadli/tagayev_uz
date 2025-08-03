import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * A component that protects a route, allowing access only to users with specific roles.
 * @param {object} props
 * @param {string[]} props.allowedRoles - An array of roles that are allowed to access this route (e.g., ['CEO', 'Admin']).
 */
const RoleBasedRoute = ({ allowedRoles }) => {
    const { user } = useAuth();

    // 1. Check if the user is logged in. If not, they are redirected anyway by PrivateRoute.
    //    This check is an extra safeguard.
    if (!user) {
        return <Navigate to="/login" />;
    }

    // 2. Check if the user's roles array has at least one of the allowed roles.
    //    'some' is a JavaScript array method that returns true if any element passes the test.
    const isAuthorized = user.roles?.some(role => allowedRoles.includes(role));

    // 3. If they are authorized, render the child component (the page).
    //    If not, redirect them to the main dashboard page.
    return isAuthorized ? <Outlet /> : <Navigate to="/" />;
};

export default RoleBasedRoute;
