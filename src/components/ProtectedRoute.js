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
 *   is allowed. This is the legacy global role check.
 * @param {boolean} [props.requireVerifiedEmail=false] - When true, an
 *   authenticated user without a verified email is redirected to the verify
 *   page instead of seeing the route.
 * @param {boolean} [props.requireOrgMembership=false] - When true, the user
 *   must have an org selected in state.organization AND a resolved
 *   currentOrgRole. Callers that need to render org-scoped data should
 *   opt in. Users without org context are redirected to /pages/no-org.
 * @param {import('../features/organizations/utils/orgShapes').OrgRole|import('../features/organizations/utils/orgShapes').OrgRole[]} [props.requireOrgRole]
 *   - Optional org-role gate (owner/admin/member). Requires
 *   requireOrgMembership implicitly. Users failing the role check are
 *   redirected to /pages/error-505.
 */
const ProtectedRoute = ({
  children,
  requireRole,
  requireVerifiedEmail = false,
  requireOrgMembership = false,
  requireOrgRole,
}) => {
  const {isLoggedIn, user} = useSelector((state) => state.auth);
  const currentOrgId = useSelector((state) => state.organization && state.organization.currentOrgId);
  const currentOrgRole = useSelector((state) => state.organization && state.organization.currentOrgRole);
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{from: location}} replace />;
  }

  if (requireVerifiedEmail && user && user.emailVerified === false) {
    return <Navigate to="/pages/verify" state={{from: location}} replace />;
  }

  if (requireRole) {
    const allowed = Array.isArray(requireRole) ? requireRole : [requireRole];
    const platformRole = (user && user.platformRole) || 'user';
    if (!allowed.includes(platformRole)) {
      return <Navigate to="/pages/error-505" state={{from: location}} replace />;
    }
  }

  // Org-scoped guards. requireOrgRole implies requireOrgMembership.
  const needsOrg = requireOrgMembership || Boolean(requireOrgRole);
  if (needsOrg && (!currentOrgId || !currentOrgRole)) {
    return <Navigate to="/pages/no-org" state={{from: location}} replace />;
  }

  if (requireOrgRole) {
    const allowedOrgRoles = Array.isArray(requireOrgRole) ? requireOrgRole : [requireOrgRole];
    if (!allowedOrgRoles.includes(currentOrgRole)) {
      return <Navigate to="/pages/error-505" state={{from: location}} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
