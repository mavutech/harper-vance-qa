/**
 * @fileoverview Public report-request API operations.
 */

import client from "../../../api/client";
import { LANDING_PAGE_CONFIG } from "../landingPageConfig";

const PENDING_VERIFICATION_STATUS = "email_verification_pending";
const REPORT_REQUEST_ID = /^rrq_[a-f0-9]{32}$/;

/**
 * Submits a professional report request for work-email verification.
 *
 * @param {Object} input - Validated report-request fields.
 * @returns {Promise<Object>} Public request status.
 * @throws {Error} When the response does not confirm a received request.
 */
export const createReportRequest = async (input) => {
  const result = await client.post("/api/organizations/report-requests", input, {
    timeout: LANDING_PAGE_CONFIG.requestTimeoutMs
  });
  if (!result || result.status !== PENDING_VERIFICATION_STATUS ||
      typeof result.requestId !== "string" || !REPORT_REQUEST_ID.test(result.requestId)) {
    throw new Error("REPORT_REQUEST_RESPONSE_INVALID");
  }
  return result;
};
