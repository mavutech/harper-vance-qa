/** @fileoverview Public API catalog presented in the Harper Vance website theme. */
import React from 'react';
import {Link} from 'react-router-dom';
import {BRAND_LOGOS} from '../../config/brand';
import copy from './copy.json';
import '../landingPage/pages/LandingPage.scss';
import './public-guide.scss';

const text = copy.publicDocs;

/**
 * Frames the public API reference with existing marketing design tokens.
 * @param {Object} props - Public documentation content.
 * @param {string} props.title - Maintained page title.
 * @param {boolean} props.found - Whether the requested catalog exists.
 * @param {React.ReactNode} props.children - Escaped API reference content.
 * @returns {React.ReactElement} Responsive public documentation page.
 */
export default function PublicGuideShell({title, found, children}) {
  return <div className="hv-landing hv-api-docs" id="top">
    <a className="skip-link" href="#api-reference">{text.skip}</a>
    <header className="api-header">
      <div className="shell api-header-inner">
        <Link className="brand" to="/" aria-label={copy.back}>
          <img className="brand-logo" src={BRAND_LOGOS.dark} alt={text.brand}/>
        </Link>
        <nav aria-label={copy.guide}>
          <Link className="api-home" to="/">{text.home}</Link>
          <Link className="header-login" to="/dashboard/cli">{text.dashboard}</Link>
        </nav>
      </div>
    </header>
    <section className="api-hero" aria-labelledby="api-title">
      <div className="shell">
        <p className="eyebrow">{text.eyebrow}</p>
        <h1 id="api-title">{title}</h1>
        {found && <><p className="api-description">{text.description}</p>
          <p className="api-access-label"><span aria-hidden="true"/>{text.badge}</p></>}
      </div>
    </section>
    <div className="shell api-layout">
      {found && <aside className="api-contents">
        <p className="eyebrow dark">{text.contents}</p>
        <nav aria-label={text.contents}>
          <a href="#reporting-and-live-data">{text.reporting}</a>
          <a href="#account-and-client-resources">{text.resources}</a>
          <a href="#access-and-documentation">{text.access}</a>
        </nav>
      </aside>}
      <main className="api-reference" id="api-reference" tabIndex={-1}>
        {children}
        {found && <section className="api-client-access" id="access-and-documentation">
          <p className="eyebrow dark">{text.access}</p>
          <h2>{text.accessTitle}</h2>
          <p>{text.accessBody}</p>
          <p>{text.authentication}</p>
          <p>{text.guideBody}</p>
          <Link className="button button-primary" to="/dashboard/cli">{text.guideAction}<span aria-hidden="true"> →</span></Link>
        </section>}
      </main>
    </div>
    <footer className="api-footer"><div className="shell">
      <Link className="brand" to="/"><img className="brand-logo" src={BRAND_LOGOS.dark} alt={text.brand}/></Link>
      <p>{text.footer}</p>
      <a href="#top">{copy.guide}<span aria-hidden="true"> ↑</span></a>
    </div></footer>
  </div>;
}
