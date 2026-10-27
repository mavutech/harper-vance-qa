import {BRAND_LOGOS} from "../../../config/brand";
import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../config/routes";
import { getAccessRequestUrl } from "../landingPageConfig";
import messages from "../locales/en";
import { MARKETING_EVENTS, MARKETING_PLACEMENTS } from "../marketingAnalytics";

const logo = BRAND_LOGOS.dark;

/**
 * Renders the public navigation for desktop and mobile visitors.
 *
 * @param {Object} props - Component properties.
 * @param {boolean} props.menuOpen - Whether the mobile menu is visible.
 * @param {boolean} props.scrolled - Whether the page has scrolled past the hero edge.
 * @param {() => void} props.onMenuToggle - Toggles the mobile navigation.
 * @param {() => void} props.onMenuClose - Closes the mobile navigation.
 * @param {(eventName: string, params?: Object) => void} props.onTrack - Records a privacy-safe event.
 * @returns {React.ReactElement} Landing page header.
 */
export default function LandingHeader({ menuOpen, scrolled, onMenuToggle, onMenuClose, onTrack }) {
  const accessRequestUrl = getAccessRequestUrl();

  return (
    <header className={`site-header${scrolled ? " scrolled" : ""}`}>
      <div className="shell header-inner">
        <a className="brand" href="#top" aria-label={messages.common.homeLabel}>
          <img className="brand-logo" src={logo} alt={messages.common.brand} />
        </a>
        <nav className="desktop-nav" aria-label={messages.navigation.primaryLabel}>
          <a href="#product">{messages.navigation.product}</a>
          <a href="#evaluation">{messages.navigation.evaluation}</a>
          <a href="#pricing">{messages.navigation.pricing}</a>
        </nav>
        {accessRequestUrl && (
          <a className="button button-small button-primary header-cta" href={accessRequestUrl} onClick={() => onTrack(MARKETING_EVENTS.requestAccessClicked, { placement: MARKETING_PLACEMENTS.header })}>
            {messages.common.requestAccess}
          </a>
        )}
        <Link className="header-login" to={ROUTES.login} onClick={() => onTrack(MARKETING_EVENTS.clientLoginClicked, { placement: MARKETING_PLACEMENTS.header })}>
          {messages.common.clientLogin}
        </Link>
        <button
          className="menu-button"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={onMenuToggle}
        >
          <span className="sr-only">{messages.navigation.openMenu}</span>
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>
      <nav className="mobile-nav" id="mobile-menu" aria-label={messages.navigation.mobileLabel} hidden={!menuOpen}>
        <a href="#product" onClick={onMenuClose}>{messages.navigation.product}</a>
        <a href="#evaluation" onClick={onMenuClose}>{messages.navigation.evaluation}</a>
        <a href="#pricing" onClick={onMenuClose}>{messages.navigation.pricing}</a>
        {accessRequestUrl && (
          <a className="mobile-access" href={accessRequestUrl} onClick={() => { onMenuClose(); onTrack(MARKETING_EVENTS.requestAccessClicked, { placement: MARKETING_PLACEMENTS.mobile }); }}>
            {messages.common.requestAccess}
          </a>
        )}
        <Link className="mobile-login" to={ROUTES.login} onClick={() => { onMenuClose(); onTrack(MARKETING_EVENTS.clientLoginClicked, { placement: MARKETING_PLACEMENTS.mobile }); }}>
          {messages.common.clientLogin}
        </Link>
      </nav>
    </header>
  );
}
