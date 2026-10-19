import React, { useRef, useState } from "react";
import { trackEvent } from "../../../utils/analytics";
import messages from "../locales/en.json";
import { createReportRequest } from "../services/reportRequestService";
import { MARKETING_EVENTS } from "../marketingAnalytics";

const EMPTY_FORM = Object.freeze({
  name: "",
  email: "",
  company: "",
  role: "",
  organization: "",
  professionalUseConfirmed: false,
  privacyNoticeAcknowledged: false
});

/**
 * Removes line breaks and surrounding whitespace from a submitted text value.
 *
 * @param {string} value - Raw visitor-provided value.
 * @returns {string} Safe single-line value.
 */
function sanitizeFormValue(value) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/**
 * Renders the professional report request and verification form.
 *
 * @returns {React.ReactElement} Sample request section.
 */
export default function SampleRequestSection() {
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [formStatus, setFormStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const formStarted = useRef(false);

  /**
   * Updates one controlled form field without storing it outside the browser.
   *
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement>} event - Field change event.
   * @returns {void}
   */
  const handleInputChange = (event) => {
    const { name, type, value, checked } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  /**
   * Records the first form interaction without including personal information.
   *
   * @returns {void}
   */
  const handleFormFocus = () => {
    if (formStarted.current) return;
    formStarted.current = true;
    trackEvent(MARKETING_EVENTS.reportRequestStarted);
  };

  /**
   * Validates and submits the request for work-email verification.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Form submission event.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      setFormStatus(messages.sample.form.error);
      trackEvent(MARKETING_EVENTS.reportRequestValidationFailed);
      form.reportValidity();
      return;
    }

    const input = {
      fullName: sanitizeFormValue(formValues.name),
      workEmail: sanitizeFormValue(formValues.email),
      companyName: sanitizeFormValue(formValues.company),
      jobTitle: sanitizeFormValue(formValues.role),
      organizationType: formValues.organization,
      professionalUseConfirmed: formValues.professionalUseConfirmed,
      privacyNoticeAcknowledged: formValues.privacyNoticeAcknowledged
    };
    setSubmitting(true);
    setFormStatus(messages.sample.form.submitting);
    try {
      await createReportRequest(input);
      setFormStatus(messages.sample.form.success);
      setFormValues(EMPTY_FORM);
      trackEvent(MARKETING_EVENTS.reportRequestSubmitted, {
        organization_type: input.organizationType
      });
    } catch (_error) {
      setFormStatus(messages.sample.form.submitError);
      trackEvent(MARKETING_EVENTS.reportRequestFailed);
    } finally {
      setSubmitting(false);
    }
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
              {messages.sample.form.organizationOptions.map((option, index) => <option value={option.value} disabled={index === 0} key={option.label}>{option.label}</option>)}
            </select>
          </label>
          <label className="form-consent">
            <input type="checkbox" name="professionalUseConfirmed" required checked={formValues.professionalUseConfirmed} onChange={handleInputChange} />
            <span>{messages.sample.form.professionalUse}</span>
          </label>
          <label className="form-consent">
            <input type="checkbox" name="privacyNoticeAcknowledged" required checked={formValues.privacyNoticeAcknowledged} onChange={handleInputChange} />
            <span>{messages.sample.form.privacyNotice}</span>
          </label>
          <div className="form-footer">
            <p>{messages.sample.form.privacy}</p>
            <button className="button button-primary button-submit" type="submit" disabled={submitting}>{submitting ? messages.sample.form.submitting : messages.sample.form.submit}</button>
          </div>
          {formStatus && <p className="form-status" role="status" aria-live="polite">{formStatus}</p>}
        </form>
      </div>
    </section>
  );
}
