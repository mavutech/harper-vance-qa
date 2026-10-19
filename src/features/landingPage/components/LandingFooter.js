import React from "react";
import { Link } from "react-router-dom";
import logo from "../../../assets/svg/logo2-white.svg";
import { ROUTES } from "../../../config/routes";
import { getAccessRequestUrl } from "../landingPageConfig";
import messages from "../locales/en.json";

/**
 * Renders the service boundary, brand, and client access link.
 *
 * @param {Object} props - Component properties.
 * @param {(eventName: string) => void} props.onTrack - Records a privacy-safe link event.
 * @returns {React.ReactElement} Landing page footer.
 */
export default function LandingFooter({ onTrack }) {
  const accessRequestUrl = getAccessRequestUrl();

  return (
    <footer className="site-footer">
      <div className="shell footer-main">
        <a className="brand" href="#top"><img className="brand-logo" src={logo} alt={messages.common.brand} /></a>
        <p>{messages.footer.disclosure}</p>
        {accessRequestUrl && (
          <a className="button button-small button-primary footer-access" href={accessRequestUrl} onClick={() => onTrack("footer_access_request")}>
            {messages.common.requestAccess}
          </a>
        )}
        <Link className="footer-login" to={ROUTES.login} onClick={() => onTrack("footer_client_login")}>
          {messages.common.clientLogin}
        </Link>
      </div>
      <div className="shell footer-bottom">
        <p>{messages.footer.boundary}</p>
        <div className="footer-legal">
          <Link to={ROUTES.terms}>{messages.footer.terms}</Link>
          <Link to={ROUTES.privacy}>{messages.footer.privacy}</Link>
          <p>{messages.footer.copyright} {new Date().getFullYear()} {messages.common.brand}</p>
        </div>
      </div>
    </footer>
  );
}
