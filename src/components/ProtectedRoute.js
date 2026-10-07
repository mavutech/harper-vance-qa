import React from 'react';
import {useSelector} from 'react-redux';
import {Navigate, useLocation} from 'react-router-dom';
import {useAccess} from '../features/access';

/**
 * Route guard for authenticated areas.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The route element to render when allowed.
 * @param {string|string[]} [props.requireRole] - One or more required roles
 *   ('super_admin' | 'admin' | 'user'). When omitted, any authenticated user
 *   is allowed.
 * @param {boolean} [props.requireVerifiedEmail=false] - When true, an
 *   authenticated user without a verified email is redirected to the verify
 *   page instead of seeing the route.
 * @param {string} [props.requireFeature] - Canonical paid feature key.
 */
const ProtectedRoute = ({children, requireRole, requireVerifiedEmail = false, requireFeature}) => {
  const {isLoggedIn, user} = useSelector((state) => state.auth);
  const {loading: accessLoading, error: accessError, hasFeature} = useAccess();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{from: location}} replace />;
  }

  if (requireVerifiedEmail && user && user.emailVerified === false) {
    return <Navigate to="/pages/verify" state={{from: location}} replace />;
  }

  if (requireRole) {
    const allowed = Array.isArray(requireRole) ? requireRole : [requireRole];
    const role = (user && (user.platformRole || user.role)) || 'user';
    if (!allowed.includes(role)) {
      return <Navigate to="/pages/error-505" state={{from: location}} replace />;
    }
  }

  if (requireFeature) {
    if (accessLoading) {
      return <div className="d-flex justify-content-center align-items-center min-vh-100">Loading account access...</div>;
    }
    if (accessError || !hasFeature(requireFeature)) {
      return <Navigate to="/access-unavailable" state={{from: location}} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
