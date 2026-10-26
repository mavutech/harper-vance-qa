import {BRAND} from "../config/brand";
import React from "react";
import {Link} from 'react-router-dom';
import {ROUTES} from '../config/routes';
import legalCopy from '../features/legal/locales/en';

/**
 * Renders authenticated application copyright and legal-document links.
 *
 * @returns {React.ReactElement} Application footer
 */
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <div className="main-footer">
      <span>&copy; {year} {BRAND.fullName}. All Rights Reserved.</span>
      <span className="d-flex gap-3">
        <Link to={ROUTES.terms}>{legalCopy.common.terms}</Link>
        <Link to={ROUTES.privacy}>{legalCopy.common.privacy}</Link>
      </span>
    </div>
  )
}
