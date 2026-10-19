import { useRef, useState } from "react";
import { trackEvent } from "../../../utils/analytics";
import { createReportRequest } from "../services/reportRequestService";
import { LANDING_PAGE_CONFIG } from "../landingPageConfig";
import { MARKETING_EVENTS } from "../marketingAnalytics";
import messages from "../locales/en.json";

const EMPTY_FORM = Object.freeze({
  name: "", email: "", company: "", role: "", organization: "",
  professionalUseConfirmed: false, privacyNoticeAcknowledged: false
});

/**
 * Trims input without changing the meaning of a prospect's submitted value.
 * @param {string} value - Raw form value.
 * @returns {string} Trimmed single-line value.
 */
function sanitizeFormValue(value) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/**
 * Manages a reviewed report request without persisting personal data locally.
 * @returns {Object} Values, status, busy/received state and form handlers.
 */
export default function useReportRequest() {
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [formStatus, setFormStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [received, setReceived] = useState(false);
  const formStarted = useRef(false);
  const requestLocked = useRef(false);

  /** Updates a field in memory only. @param {Object} event - Input event. @returns {void} */
  const handleInputChange = (event) => {
    const { name, type, value, checked } = event.target;
    setFormValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  /** Records the first form interaction without field values. @returns {void} */
  const handleFormFocus = () => {
    if (formStarted.current) return;
    formStarted.current = true;
    trackEvent(MARKETING_EVENTS.reportRequestStarted);
  };

  /**
   * Validates and submits once, distinguishing receipt from email delivery.
   * @param {Object} event - Form submission event.
   * @returns {Promise<void>} Settles after handling the request result.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (requestLocked.current) return;
    const form = event.currentTarget;
    const input = {
      fullName: sanitizeFormValue(formValues.name),
      workEmail: sanitizeFormValue(formValues.email),
      companyName: sanitizeFormValue(formValues.company),
      jobTitle: sanitizeFormValue(formValues.role),
      organizationType: formValues.organization,
      professionalUseConfirmed: formValues.professionalUseConfirmed,
      privacyNoticeAcknowledged: formValues.privacyNoticeAcknowledged
    };
    const textValid = [input.fullName, input.companyName, input.jobTitle]
      .every((value) => value.length >= LANDING_PAGE_CONFIG.minimumTextLength);
    const organizationValid = messages.sample.form.organizationOptions
      .some((option) => option.value && option.value === input.organizationType);
    if (!form.checkValidity() || !textValid || !organizationValid ||
        !input.professionalUseConfirmed || !input.privacyNoticeAcknowledged) {
      setFormStatus(messages.sample.form.error);
      trackEvent(MARKETING_EVENTS.reportRequestValidationFailed);
      form.reportValidity();
      return;
    }
    requestLocked.current = true;
    setSubmitting(true);
    setFormStatus(messages.sample.form.submitting);
    try {
      const result = await createReportRequest(input);
      const delivery = result?.verificationDelivery;
      setFormStatus(delivery === "sent" ? messages.sample.form.success :
        delivery === "manual_follow_up_required" ? messages.sample.form.manualFollowUp :
          messages.sample.form.unknownDelivery);
      setReceived(true);
      setFormValues(EMPTY_FORM);
      trackEvent(MARKETING_EVENTS.reportRequestSubmitted, { organization_type: input.organizationType });
    } catch (_error) {
      requestLocked.current = false;
      setFormStatus(messages.sample.form.submitError);
      trackEvent(MARKETING_EVENTS.reportRequestFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return { formValues, formStatus, submitting, received, handleInputChange, handleFormFocus, handleSubmit };
}
