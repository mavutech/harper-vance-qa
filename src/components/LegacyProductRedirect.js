import React from 'react';
import {Navigate, useLocation} from 'react-router-dom';

/**
 * Preserves report selection and navigation state for existing product bookmarks.
 * @param {Object} props - Redirect properties.
 * @param {string} props.to - Trusted product route constant.
 * @returns {React.ReactElement} Replacement navigation.
 */
export default function LegacyProductRedirect({to}) {
  const location = useLocation();
  return <Navigate to={{pathname: to, search: location.search, hash: location.hash}}
    state={location.state} replace />;
}
