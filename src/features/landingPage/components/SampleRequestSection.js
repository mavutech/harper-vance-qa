import React, { useRef, useState } from "react";
import { trackEvent } from "../../../utils/analytics";
import { LANDING_PAGE_CONFIG } from "../landingPageConfig";
import messages from "../locales/en.json";

const EMPTY_FORM = Object.freeze({ name: "", email: "", company: "", role: "", organization: "" });

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
 * Renders the privacy-safe sample request form and mail client handoff.
 *
 * @returns {React.ReactElement} Sample request section.
 */
export default function SampleRequestSection() {
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [formStatus, setFormStatus] = useState("");
  const formStarted = useRef(false);

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
    <section className="section sample-section" id="sample">
      <div className="shell sample-layout">
        <div className="sample-copy">
          <p className="eyebrow light">{messages.sample.eyebrow}</p>
          <h2>{messages.sample.title}</h2>
          <p>{messages.sample.description}</p>
          <p className="sample-qualification">{messages.sample.qualification}</p>
          <ul>{messages.sample.items.map((item) => <li key={item}>{item}</li>)}</ul>
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
  );
}
