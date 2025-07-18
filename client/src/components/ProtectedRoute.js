import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    // Show a loading spinner or message while we check for authentication
    return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
  }

  // If the user is authenticated, render the child route content
  // Otherwise, redirect them to the login page
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
