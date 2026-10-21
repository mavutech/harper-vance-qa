import {useRef, useState} from "react";
import {resendReportVerification} from "../services/reportRequestService";
import messages from "../locales/en.json";

/**
 * Handles deliberate recovery without creating a new lead or exposing account status.
 * @returns {Object} In-memory form state and recovery handler.
 */
export default function useVerificationRecovery() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [requested, setRequested] = useState(false);
  const locked = useRef(false);

  /**
   * Requests one recovery attempt; ambiguous failures do not retry automatically.
   * @param {Object} event - Recovery form submission.
   * @returns {Promise<void>} Settles after the acknowledgement or failure.
   */
  const submit = async (event) => {
    event.preventDefault();
    if (locked.current || !event.currentTarget.reportValidity()) return;
    locked.current = true;
    setBusy(true);
    setStatus(messages.sample.recovery.submitting);
    try {
      await resendReportVerification(email.trim());
      setStatus(messages.sample.recovery.acknowledged);
    } catch (_error) {
      setStatus(messages.sample.recovery.uncertain);
    } finally {
      setEmail("");
      setRequested(true);
      setBusy(false);
    }
  };
  return {email, setEmail, busy, status, requested, submit};
}
