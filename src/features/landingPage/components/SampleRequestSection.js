import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../config/routes";
import messages from "../locales/en.json";
import { LANDING_PAGE_CONFIG } from "../landingPageConfig";
import useReportRequest from "../hooks/useReportRequest";

/**
 * Renders the professional report request with review and delivery expectations.
 * @returns {React.ReactElement} Accessible report-request form.
 */
export default function SampleRequestSection() {
  const { formValues, formStatus, submitting, received, handleInputChange,
    handleFormFocus, handleSubmit } = useReportRequest();
  const limits = LANDING_PAGE_CONFIG.fieldLimits;

  return (
    <section className="section sample-section" id="sample">
      <div className="shell sample-layout">
        <div className="sample-copy">
          <p className="eyebrow light">{messages.sample.eyebrow}</p>
          <h2>{messages.sample.title}</h2>
          <p>{messages.sample.description}</p>
          <p className="sample-qualification" id="sample-expectations">{messages.sample.qualification}</p>
          <ul>{messages.sample.items.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <form className="sample-form" aria-describedby="sample-expectations" aria-busy={submitting}
          noValidate onFocus={handleFormFocus} onSubmit={handleSubmit}>
          <fieldset disabled={submitting || received}>
            <legend className="sr-only">{messages.common.requestSample}</legend>
            <div className="form-row">
              <label><span>{messages.sample.form.nameLabel}</span><input type="text" name="name" autoComplete="name" minLength={LANDING_PAGE_CONFIG.minimumTextLength} maxLength={limits.name} required value={formValues.name} onChange={handleInputChange} /></label>
              <label><span>{messages.sample.form.emailLabel}</span><input type="email" name="email" autoComplete="email" inputMode="email" maxLength={limits.email} required value={formValues.email} onChange={handleInputChange} /></label>
            </div>
            <div className="form-row">
              <label><span>{messages.sample.form.companyLabel}</span><input type="text" name="company" autoComplete="organization" minLength={LANDING_PAGE_CONFIG.minimumTextLength} maxLength={limits.company} required value={formValues.company} onChange={handleInputChange} /></label>
              <label><span>{messages.sample.form.roleLabel}</span><input type="text" name="role" autoComplete="organization-title" minLength={LANDING_PAGE_CONFIG.minimumTextLength} maxLength={limits.role} required value={formValues.role} onChange={handleInputChange} /></label>
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
            <Link to={ROUTES.privacy}>{messages.sample.form.privacyLink}</Link>
            <div className="form-footer">
              <p>{messages.sample.form.privacy}</p>
              <button className="button button-primary button-submit" type="submit">{submitting ? messages.sample.form.submitting : messages.sample.form.submit}</button>
            </div>
          </fieldset>
          {formStatus && <p className="form-status" role="status" aria-live="polite">{formStatus}</p>}
        </form>
      </div>
    </section>
  );
}
