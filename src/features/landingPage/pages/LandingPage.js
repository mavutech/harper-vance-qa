import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../../assets/svg/logo2-white.svg";
import { updatePageSEO } from "../../../config/seoConfig";
import { ROUTES } from "../../../config/routes";
import { trackEvent } from "../../../utils/analytics";
import messages from "../locales/en.json";
import { LANDING_PAGE_CONFIG } from "../landingPageConfig";
import "./LandingPage.scss";

const EMPTY_FORM = Object.freeze({
  name: "",
  email: "",
  company: "",
  role: "",
  organization: ""
});

/**
 * Removes line breaks and surrounding whitespace from a form value.
 *
 * @param {string} value - Raw visitor-provided value.
 * @returns {string} Safe single-line value for the email handoff.
 */
function sanitizeFormValue(value) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/**
 * Builds the plain-text sample request opened in the visitor's email client.
 *
 * @param {Record<string, string>} values - Validated form values.
 * @returns {{subject: string, body: string}} Prepared email content.
 */
function buildSampleEmail(values) {
  const labels = messages.sample.email;
  const body = [
    labels.intro,
    "",
    `${labels.name}: ${values.name}`,
    `${labels.email}: ${values.email}`,
    `${labels.company}: ${values.company}`,
    `${labels.role}: ${values.role}`,
    `${labels.organization}: ${values.organization}`
  ].join("\n");

  return { subject: labels.subject, body };
}

/**
 * Renders the public Harper Vance service landing page.
 *
 * @returns {React.ReactElement} StoryBrand-based service page.
 */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [formStatus, setFormStatus] = useState("");
  const formStarted = useRef(false);

  useEffect(() => {
    updatePageSEO("landing");
    trackEvent("landing_page_viewed");

    const html = document.documentElement;
    const previousSkin = html.getAttribute("data-skin");
    html.removeAttribute("data-skin");

    return () => {
      const persistedSkin = localStorage.getItem("skin-mode");
      if (persistedSkin === "dark") {
        html.setAttribute("data-skin", "dark");
      } else if (previousSkin) {
        html.setAttribute("data-skin", previousSkin);
      }
    };
  }, []);

  useEffect(() => {
    const updateHeader = () => setHeaderScrolled(window.scrollY > 16);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /**
   * Closes the mobile menu after the visitor chooses a destination.
   *
   * @returns {void}
   */
  const closeMenu = () => setMenuOpen(false);

  /**
   * Tracks a privacy-safe link interaction.
   *
   * @param {string} eventName - Approved analytics event name.
   * @returns {void}
   */
  const trackLink = (eventName) => trackEvent(eventName);

  /**
   * Updates one controlled form field without storing it outside the browser.
   *
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement>} event - Field change event.
   * @returns {void}
   */
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  };

  /**
   * Records the first form interaction without including personal information.
   *
   * @returns {void}
   */
  const handleFormFocus = () => {
    if (formStarted.current) return;
    formStarted.current = true;
    trackEvent("sample_form_started");
  };

  /**
   * Validates the request and hands it to the visitor's email application.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Form submission event.
   * @returns {void}
   */
  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      setFormStatus(messages.sample.form.error);
      trackEvent("sample_form_validation_failed");
      form.reportValidity();
      return;
    }

    const safeValues = Object.fromEntries(
      Object.entries(formValues).map(([key, value]) => [key, sanitizeFormValue(value)])
    );
    const email = buildSampleEmail(safeValues);
    const mailto = `mailto:${LANDING_PAGE_CONFIG.contactEmail}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;

    setFormStatus(messages.sample.form.success);
    trackEvent("sample_form_email_prepared", { organization_type: safeValues.organization });
    window.location.assign(mailto);
  };

  return (
    <div className="hv-landing">
      <a className="skip-link" href="#main">{messages.common.skipToContent}</a>

      <header className={`site-header${headerScrolled ? " scrolled" : ""}`}>
        <div className="shell header-inner">
          <a className="brand" href="#top" aria-label={messages.common.homeLabel}>
            <img className="brand-logo" src={logo} alt={messages.common.brand} />
          </a>
          <nav className="desktop-nav" aria-label={messages.navigation.primaryLabel}>
            <a href="#problem">{messages.navigation.problem}</a>
            <a href="#plan">{messages.navigation.plan}</a>
            <a href="#included">{messages.navigation.included}</a>
            <a href="#pricing">{messages.navigation.pricing}</a>
          </nav>
          <Link className="header-login" to={ROUTES.login} onClick={() => trackLink("header_client_login")}>
            {messages.common.clientLogin}
          </Link>
          <a className="button button-small button-outline header-cta" href="#sample" onClick={() => trackLink("header_sample_request")}>
            {messages.common.requestSample}
          </a>
          <button
            className="menu-button"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">{messages.navigation.openMenu}</span>
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
        <nav className="mobile-nav" id="mobile-menu" aria-label={messages.navigation.mobileLabel} hidden={!menuOpen}>
          <a href="#problem" onClick={closeMenu}>{messages.navigation.problem}</a>
          <a href="#plan" onClick={closeMenu}>{messages.navigation.plan}</a>
          <a href="#included" onClick={closeMenu}>{messages.navigation.included}</a>
          <a href="#pricing" onClick={closeMenu}>{messages.navigation.pricing}</a>
          <Link to={ROUTES.login} onClick={() => { closeMenu(); trackLink("mobile_client_login"); }}>
            {messages.common.clientLogin}
          </Link>
          <a href="#sample" onClick={closeMenu}>{messages.common.requestSample}</a>
        </nav>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <div className="hero-grid" aria-hidden="true" />
          <div className="shell hero-layout">
            <div className="hero-copy">
              <p className="eyebrow">{messages.hero.eyebrow}</p>
              <h1>{messages.hero.title}</h1>
              <p className="hero-lede">{messages.hero.description}</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#sample" onClick={() => trackLink("hero_sample_request")}>
                  {messages.common.requestSample}
                </a>
                <a className="text-link" href="#pricing" onClick={() => trackLink("hero_view_pricing")}>
                  {messages.common.viewPricing}
                </a>
              </div>
              <p className="approval-note"><span aria-hidden="true" /><span>{messages.hero.reassurance}</span></p>
            </div>

            <aside className="record-panel" aria-label={messages.hero.record.label}>
              <div className="record-topline"><span>{messages.hero.record.label}</span><span className="sample-tag">{messages.hero.record.sample}</span></div>
              <div className="record-symbol"><span>{messages.hero.record.instrument}</span><strong>{messages.hero.record.timeframe}</strong></div>
              <p className="record-title">{messages.hero.record.title}</p>
              <dl className="record-details">
                <div><dt>{messages.hero.record.issuedLabel}</dt><dd>{messages.hero.record.issued}</dd></div>
                <div><dt>{messages.hero.record.targetLabel}</dt><dd>{messages.hero.record.target}</dd></div>
                <div><dt>{messages.hero.record.outcomeLabel}</dt><dd>{messages.hero.record.outcome}</dd></div>
                <div><dt>{messages.hero.record.reportLabel}</dt><dd><span className="status-pulse" /><span>{messages.hero.record.report}</span></dd></div>
              </dl>
            </aside>
          </div>
        </section>

        <section className="section problem-section" id="problem">
          <div className="shell problem-layout">
            <div className="problem-copy">
              <p className="eyebrow dark">{messages.problem.eyebrow}</p>
              <h2>{messages.problem.title}</h2>
              <p>{messages.problem.description}</p>
              <p className="belief">{messages.problem.belief}</p>
            </div>
            <div className="pain-grid">
              {messages.problem.items.map((item, index) => (
                <article className="pain-card" key={item.title}>
                  <span className="item-number">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{item.title}</h3><p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section plan-section" id="plan">
          <div className="shell plan-layout">
            <div className="plan-heading">
              <p className="eyebrow light">{messages.plan.eyebrow}</p>
              <h2>{messages.plan.title}</h2>
              <p>{messages.plan.description}</p>
            </div>
            <div className="steps-grid">
              {messages.plan.steps.map((step, index) => (
                <article className="step-card" key={step.title}>
                  <span className="step-number">{index + 1}</span><h3>{step.title}</h3><p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section included-section" id="included">
          <div className="shell">
            <div className="section-heading">
              <p className="eyebrow dark">{messages.included.eyebrow}</p>
              <h2>{messages.included.title}</h2>
              <p>{messages.included.description}</p>
            </div>
            <div className="artifact-grid">
              {messages.included.artifacts.map((artifact) => (
                <article className="artifact-card" key={artifact.number}>
                  <span className="artifact-number">{artifact.number}</span><h3>{artifact.title}</h3><p>{artifact.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section outcome-section">
          <div className="shell outcome-layout">
            <div className="outcome-copy">
              <p className="eyebrow light">{messages.outcome.eyebrow}</p>
              <h2>{messages.outcome.title}</h2>
              <p>{messages.outcome.description}</p>
              <p className="delivery-line"><strong>{messages.outcome.deliveryLabel}</strong> {messages.outcome.delivery}</p>
            </div>
            <div className="outcome-list">
              {messages.outcome.items.map((item) => (
                <div className="outcome-item" key={item}><span className="outcome-mark" aria-hidden="true">✓</span><p>{item}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section className="section pricing-section" id="pricing">
          <div className="shell">
            <div className="pricing-heading">
              <div><p className="eyebrow dark">{messages.pricing.eyebrow}</p><h2>{messages.pricing.title}</h2></div>
              <p>{messages.pricing.description}</p>
            </div>
            <div className="pricing-grid">
              {messages.pricing.plans.map((plan) => (
                <article className={`price-card${plan.featured ? " featured" : ""}`} key={plan.name}>
                  <span className="plan-tag">{plan.tag}</span>
                  <h3>{plan.name}</h3>
                  <div className="price-line"><span className="price">{plan.price}</span><span className="period">{plan.period}</span></div>
                  <p className="plan-summary">{plan.summary}</p>
                  <ul className="feature-list">{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                  <a className={`button ${plan.featured ? "button-primary" : "button-dark"}`} href="#sample" onClick={() => trackLink(`pricing_${plan.analyticsKey}`)}>
                    {plan.action}
                  </a>
                </article>
              ))}
            </div>
            <p className="pricing-note">{messages.pricing.note}</p>
          </div>
        </section>

        <section className="section sample-section" id="sample">
          <div className="shell sample-layout">
            <div className="sample-copy">
              <p className="eyebrow dark">{messages.sample.eyebrow}</p>
              <h2>{messages.sample.title}</h2>
              <p>{messages.sample.description}</p>
              <ul className="sample-list">{messages.sample.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <form className="sample-form" noValidate onFocus={handleFormFocus} onSubmit={handleSubmit}>
              <div className="form-row">
                <label><span>{messages.sample.form.nameLabel}</span><input type="text" name="name" autoComplete="name" maxLength="80" required value={formValues.name} onChange={handleInputChange} /></label>
                <label><span>{messages.sample.form.emailLabel}</span><input type="email" name="email" autoComplete="email" inputMode="email" maxLength="120" required value={formValues.email} onChange={handleInputChange} /></label>
              </div>
              <div className="form-row">
                <label><span>{messages.sample.form.companyLabel}</span><input type="text" name="company" autoComplete="organization" maxLength="120" required value={formValues.company} onChange={handleInputChange} /></label>
                <label><span>{messages.sample.form.roleLabel}</span><input type="text" name="role" autoComplete="organization-title" maxLength="100" required value={formValues.role} onChange={handleInputChange} /></label>
              </div>
              <label>
                <span>{messages.sample.form.organizationLabel}</span>
                <select name="organization" required value={formValues.organization} onChange={handleInputChange}>
                  {messages.sample.form.organizationOptions.map((option, index) => <option value={index === 0 ? "" : option} disabled={index === 0} key={option}>{option}</option>)}
                </select>
              </label>
              <div className="form-footer">
                <p>{messages.sample.form.privacy}</p>
                <button className="button button-primary button-submit" type="submit">{messages.sample.form.submit}</button>
              </div>
              {formStatus && <p className="form-status" role="status" aria-live="polite">{formStatus}</p>}
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell footer-main">
          <a className="brand" href="#top"><img className="brand-logo" src={logo} alt={messages.common.brand} /></a>
          <div className="footer-copy">
            <p>{messages.footer.disclosure}</p>
            <Link className="footer-login" to={ROUTES.login} onClick={() => trackLink("footer_client_login")}>
              {messages.common.clientLogin}
            </Link>
          </div>
        </div>
        <div className="shell footer-bottom">
          <p>{messages.footer.boundary}</p>
          <p>{messages.footer.copyright} {new Date().getFullYear()} {messages.common.brand}</p>
        </div>
      </footer>
    </div>
  );
}
