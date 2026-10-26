import React from "react";
import useVerificationRecovery from "../hooks/useVerificationRecovery";
import messages from "../locales/en";
import {LANDING_PAGE_CONFIG} from "../landingPageConfig";

/**
 * Offers a deliberate resend even after a visitor reloads the page.
 * @returns {React.ReactElement} Accessible recovery disclosure.
 */
export default function VerificationRecovery() {
  const state = useVerificationRecovery();
  const text = messages.sample.recovery;
  return (
    <details className="sample-form">
      <summary>{text.title}</summary>
      <p>{text.description}</p>
      <form onSubmit={state.submit} aria-busy={state.busy}>
        <label>
          <span>{text.emailLabel}</span>
          <input type="email" autoComplete="email" required
            maxLength={LANDING_PAGE_CONFIG.fieldLimits.email}
            value={state.email} onChange={(event) => state.setEmail(event.target.value)}
            disabled={state.busy || state.requested} />
        </label>
        <button type="submit" className="button button-primary"
          disabled={state.busy || state.requested}>
          {state.busy ? text.submitting : text.submit}
        </button>
        {state.status && <p className="form-status" role="status">{state.status}</p>}
      </form>
      <a href={`mailto:${LANDING_PAGE_CONFIG.contactEmail}`}>{text.contact}</a>
    </details>
  );
}
