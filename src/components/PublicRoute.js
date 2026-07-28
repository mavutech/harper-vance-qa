import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PublicRoute = ({ children }) => {
  const { isLoggedIn } = useSelector(state => state.auth);

  // If user is authenticated, redirect to Today's Targets (the app's landing page).
  if (isLoggedIn) {
    return <Navigate to="/dashboard/sona-targets" replace />;
  }

  // If user is not authenticated, render the public page
  return children;
};

export default PublicRoute;
