import {BRAND_LOGOS} from "../../../config/brand";
import React, {useEffect} from 'react';
import {Link} from 'react-router-dom';
import {ROUTES} from '../../../config/routes';
import {updatePageSEO} from '../../../config/seoConfig';
import {trackEvent} from '../../../utils/analytics';
import copy from '../locales/en';
import './NotFoundPage.scss';

const logo = BRAND_LOGOS.dark;

/**
 * Renders a branded recovery page for unknown public routes.
 *
 * @returns {React.ReactElement} Harper Vance not-found page
 */
export default function NotFoundPage() {
  useEffect(() => {
    document.body.classList.remove('sidebar-show');
    window.scrollTo({top: 0, left: 0, behavior: 'auto'});
    updatePageSEO('notFound');
    trackEvent('not_found_page_viewed');
  }, []);

  return (
    <div className="hv-not-found">
      <a className="not-found-skip-link" href="#not-found-main">{copy.skipToContent}</a>
      <header className="not-found-header">
        <div className="not-found-shell not-found-header-inner">
          <Link className="not-found-brand" to={ROUTES.home} aria-label={copy.homeLabel}>
            <img src={logo} alt={copy.brand} />
          </Link>
        </div>
      </header>

      <main className="not-found-shell not-found-main" id="not-found-main">
        <section className="not-found-copy" aria-labelledby="not-found-title">
          <h1 id="not-found-title">{copy.title}</h1>
          <p className="not-found-description">{copy.description}</p>
          <Link
            className="not-found-home-link"
            to={ROUTES.home}
            onClick={() => trackEvent('not_found_return_home_selected')}
          >
            {copy.returnHome}
          </Link>
        </section>

        <div className="not-found-visual" aria-hidden="true">404</div>
      </main>
    </div>
  );
}
