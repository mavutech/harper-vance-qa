/**
 * @fileoverview Contract tests for the public report-request API service.
 */

import client from "../../../api/client";
import { createReportRequest } from "./reportRequestService";

jest.mock("../../../api/client", () => ({
  post: jest.fn()
}));

describe("reportRequestService", () => {
  it("submits report requests through the governed public endpoint", async () => {
    const input = { workEmail: "analyst@example.com" };
    const response = { requestId: "rrq_0123456789abcdef0123456789abcdef", status: "email_verification_pending", verificationDelivery: "sent" };
    client.post.mockResolvedValue(response);

    await expect(createReportRequest(input)).resolves.toEqual(response);
    expect(client.post).toHaveBeenCalledWith("/api/organizations/report-requests", input, { timeout: 10000 });
  });

  it.each([null, "<html>Hosting fallback</html>", {},
    { status: "email_verification_pending", requestId: "invalid" },
    { status: "unexpected", requestId: "rrq_0123456789abcdef0123456789abcdef" }
  ])("rejects a malformed success response: %j", async (response) => {
    client.post.mockResolvedValue(response);
    await expect(createReportRequest({})).rejects.toThrow("REPORT_REQUEST_RESPONSE_INVALID");
  });
});
