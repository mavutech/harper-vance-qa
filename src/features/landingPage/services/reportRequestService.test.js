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
    client.post.mockResolvedValue({ requestId: "rrq_1" });

    await expect(createReportRequest(input)).resolves.toEqual({ requestId: "rrq_1" });
    expect(client.post).toHaveBeenCalledWith("/api/organizations/report-requests", input);
  });
});
