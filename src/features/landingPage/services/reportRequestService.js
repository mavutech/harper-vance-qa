/**
 * @fileoverview Public report-request API operations.
 */

import client from "../../../api/client";

/**
 * Submits a professional report request for work-email verification.
 *
 * @param {Object} input - Validated report-request fields.
 * @returns {Promise<Object>} Public request status.
 */
export const createReportRequest = (input) =>
  client.post("/api/organizations/report-requests", input);
