import {act, renderHook} from "@testing-library/react";
import useVerificationRecovery from "./useVerificationRecovery";
import {resendReportVerification} from "../services/reportRequestService";
jest.mock("../services/reportRequestService", () => ({resendReportVerification: jest.fn()}));

/** Builds a valid form event. @returns {Object} Test submission. */
const event = () => ({preventDefault: jest.fn(), currentTarget: {reportValidity: () => true}});

beforeEach(() => jest.clearAllMocks());

it("locks duplicate clicks and clears the in-memory address", async () => {
  resendReportVerification.mockResolvedValue({status: "recovery_requested"});
  const {result} = renderHook(() => useVerificationRecovery());
  act(() => result.current.setEmail(" test@example.test "));
  await act(async () => {
    await Promise.all([result.current.submit(event()), result.current.submit(event())]);
  });
  expect(resendReportVerification).toHaveBeenCalledTimes(1);
  expect(resendReportVerification).toHaveBeenCalledWith("test@example.test");
  expect(result.current.email).toBe("");
  expect(result.current.requested).toBe(true);
  expect(result.current.status).toContain("not confirmation of delivery");
});

it("does not automatically retry an uncertain response or expose raw errors", async () => {
  resendReportVerification.mockRejectedValue(new Error("private server details"));
  const {result} = renderHook(() => useVerificationRecovery());
  await act(async () => result.current.submit(event()));
  expect(result.current.status).toContain("could not confirm");
  expect(result.current.status).not.toContain("private server");
  expect(resendReportVerification).toHaveBeenCalledTimes(1);
});

it("does not send an invalid form", async () => {
  const {result} = renderHook(() => useVerificationRecovery());
  await act(async () => result.current.submit({
    preventDefault: jest.fn(), currentTarget: {reportValidity: () => false}
  }));
  expect(resendReportVerification).not.toHaveBeenCalled();
});
