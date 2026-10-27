import {BRAND_LOGOS} from "../../../config/brand";
import React, {useEffect} from 'react';
import {Link} from 'react-router-dom';
import {ROUTES} from '../../../config/routes';
import {CONTACT_CONFIG} from '../../../config/supportConfig';
import {updatePageSEO} from '../../../config/seoConfig';
import {trackEvent} from '../../../utils/analytics';
import {LEGAL_CONFIG} from '../legalConfig';
import copy from '../locales/en';
import '../pages/LegalPage.scss';

const logo = BRAND_LOGOS.dark;

/**
 * Renders one versioned legal document using the public Harper Vance design.
 *
 * @param {Object} props - Component properties
 * @param {'terms'|'privacy'} props.documentKey - Legal document content key
 * @param {'terms'|'privacy'} props.seoKey - SEO configuration key
 * @param {string} props.analyticsEvent - Privacy-safe page-view event
 * @returns {React.ReactElement} Public legal document page
 */
export default function LegalDocumentPage({documentKey, seoKey, analyticsEvent}) {
  const document = copy.documents[documentKey];
  const version = documentKey === 'terms'
    ? LEGAL_CONFIG.termsVersion
    : LEGAL_CONFIG.privacyVersion;
  const contactEmail = documentKey === 'terms'
    ? CONTACT_CONFIG.legalEmail
    : CONTACT_CONFIG.privacyEmail;

  useEffect(() => {
    window.scrollTo({top: 0, left: 0, behavior: 'auto'});
    updatePageSEO(seoKey);
    trackEvent(analyticsEvent);
  }, [analyticsEvent, seoKey]);

  return (
    <div className="legal-page">
      <a className="legal-skip-link" href="#legal-content">{copy.common.backToSite}</a>
      <header className="legal-header">
        <div className="legal-shell legal-header-inner">
          <Link to={ROUTES.home} aria-label={copy.common.homeLabel}>
            <img src={logo} alt={copy.common.brand} />
          </Link>
          <nav aria-label={copy.common.homeLabel}>
            <Link to={ROUTES.terms}>{copy.common.terms}</Link>
            <Link to={ROUTES.privacy}>{copy.common.privacy}</Link>
            <Link to={ROUTES.login}>{copy.common.clientLogin}</Link>
          </nav>
        </div>
      </header>

      <main className="legal-shell legal-content" id="legal-content">
        <Link className="legal-back-link" to={ROUTES.home}>{copy.common.backToSite}</Link>
        <p className="legal-status">{copy.common.documentStatus}</p>
        <h1>{document.title}</h1>
        <p className="legal-intro">{document.intro}</p>
        <dl className="legal-metadata">
          <div><dt>{copy.common.version}</dt><dd>{version}</dd></div>
          <div><dt>{copy.common.effectiveDate}</dt><dd>{LEGAL_CONFIG.effectiveDate}</dd></div>
        </dl>
        <div className="legal-notice" role="note">{copy.common.approvalNotice}</div>

        <article className="legal-document">
          {document.sections.map((section) => (
            <section id={section.id} key={section.id}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets && (
                <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
              )}
              {section.id === 'contact' && (
                <address>
                  <strong>{LEGAL_CONFIG.entityName}</strong>
                  {LEGAL_CONFIG.addressLines.map((line) => <span key={line}>{line}</span>)}
                  <span>{copy.common.contactEmail}: <a href={`mailto:${contactEmail}`}>{contactEmail}</a></span>
                </address>
              )}
            </section>
          ))}
        </article>
      </main>

      <footer className="legal-footer">
        <div className="legal-shell legal-footer-inner">
          <p>{copy.common.copyright} {new Date().getFullYear()} {LEGAL_CONFIG.entityName}</p>
          <div>
            <Link to={ROUTES.terms}>{copy.common.terms}</Link>
            <Link to={ROUTES.privacy}>{copy.common.privacy}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
