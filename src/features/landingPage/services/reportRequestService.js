/**
 * @fileoverview Public report-request API operations.
 */

import client from "../../../api/client";
import { LANDING_PAGE_CONFIG } from "../landingPageConfig";

/**
 * Submits a professional report request for work-email verification.
 *
 * @param {Object} input - Validated report-request fields.
 * @returns {Promise<Object>} Public request status.
 */
export const createReportRequest = (input) =>
  client.post("/api/organizations/report-requests", input, {
    timeout: LANDING_PAGE_CONFIG.requestTimeoutMs
  });
