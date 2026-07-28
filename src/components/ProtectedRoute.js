import React from 'react';
import {useSelector} from 'react-redux';
import {Navigate, useLocation} from 'react-router-dom';

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
 */
const ProtectedRoute = ({children, requireRole, requireVerifiedEmail = false}) => {
  const {isLoggedIn, user} = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{from: location}} replace />;
  }

  if (requireVerifiedEmail && user && user.emailVerified === false) {
    return <Navigate to="/pages/verify" state={{from: location}} replace />;
  }

  if (requireRole) {
    const allowed = Array.isArray(requireRole) ? requireRole : [requireRole];
    const role = (user && user.role) || 'user';
    if (!allowed.includes(role)) {
      return <Navigate to="/pages/error-505" state={{from: location}} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
