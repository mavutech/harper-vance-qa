import React from "react";
import { Link } from "react-router-dom";
import logo from "../../../assets/svg/logo2-white.svg";
import { ROUTES } from "../../../config/routes";
import messages from "../locales/en.json";

/**
 * Renders the public navigation for desktop and mobile visitors.
 *
 * @param {Object} props - Component properties.
 * @param {boolean} props.menuOpen - Whether the mobile menu is visible.
 * @param {boolean} props.scrolled - Whether the page has scrolled past the hero edge.
 * @param {() => void} props.onMenuToggle - Toggles the mobile navigation.
 * @param {() => void} props.onMenuClose - Closes the mobile navigation.
 * @param {(eventName: string) => void} props.onTrack - Records a privacy-safe link event.
 * @returns {React.ReactElement} Landing page header.
 */
export default function LandingHeader({ menuOpen, scrolled, onMenuToggle, onMenuClose, onTrack }) {
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
        <Link className="header-login" to={ROUTES.login} onClick={() => onTrack("header_client_login")}>
          {messages.common.clientLogin}
        </Link>
        <a className="button button-small button-outline header-cta" href="#sample" onClick={() => onTrack("header_sample_request")}>
          {messages.common.requestSample}
        </a>
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
        <Link to={ROUTES.login} onClick={() => { onMenuClose(); onTrack("mobile_client_login"); }}>
          {messages.common.clientLogin}
        </Link>
        <a href="#sample" onClick={onMenuClose}>{messages.common.requestSample}</a>
      </nav>
    </header>
  );
}
