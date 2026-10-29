import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "./LandingPage";
import { createReportRequest } from "../services/reportRequestService";
import { trackEvent } from "../../../utils/analytics";
import { MARKETING_EVENTS } from "../marketingAnalytics";

jest.mock("../../../utils/analytics", () => ({ trackEvent: jest.fn() }));
jest.mock("../../../config/seoConfig", () => ({ updatePageSEO: jest.fn() }));
jest.mock("../services/reportRequestService", () => ({ createReportRequest: jest.fn() }));

/** Renders the public page with routing. @returns {Object} Render helpers. */
function renderPage() {
  return render(<MemoryRouter><LandingPage /></MemoryRouter>);
}

/** Fills a valid fictional business request. @returns {void} */
function fillRequest() {
  Object.entries({ "Full name": "Test Analyst", "Work email": "analyst@example.com",
    Company: "Example Desk", Role: "Research Lead" }).forEach(([label, value]) => {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  });
  fireEvent.change(screen.getByLabelText("Organization type"), { target: { value: "proprietary_trading_firm" } });
  fireEvent.click(screen.getByLabelText(/professional business use/i));
  fireEvent.click(screen.getByLabelText(/I acknowledge the Privacy Policy/i));
}

describe("public evaluation journey", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState(null, "", "/");
    Element.prototype.scrollIntoView = jest.fn();
  });

  test("uses the latest anchor when navigation changes before the scroll frame runs", () => {
    let frame;
    const schedule = jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frame = callback;
      return 1;
    });
    const cancel = jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    try {
      window.history.replaceState(null, "", "/#sample");
      const { unmount } = renderPage();
      const sample = document.getElementById("sample");
      const evidence = document.getElementById("evidence");
      sample.scrollIntoView = jest.fn();
      evidence.scrollIntoView = jest.fn();
      window.history.replaceState(null, "", "/#evidence");
      act(() => { window.dispatchEvent(new Event("hashchange")); frame(); });
      expect(evidence.scrollIntoView).toHaveBeenCalledWith({ block: "start" });
      expect(sample.scrollIntoView).not.toHaveBeenCalled();
      unmount();
      schedule.mockClear();
      window.dispatchEvent(new Event("hashchange"));
      expect(schedule).not.toHaveBeenCalled();
    } finally {
      schedule.mockRestore();
      cancel.mockRestore();
    }
  });

  test("offers honest report actions, license-specific applications, and client login", () => {
    const { container } = renderPage();
    expect(screen.getByRole("link", { name: "Watch the walkthrough · 5 min 55 sec" })).toHaveAttribute("href", "#walkthrough");
    expect(document.getElementById("walkthrough")).toBeInTheDocument();
    const actions = container.querySelectorAll(".hero-actions a");
    expect(actions[0]).toHaveAttribute("href", "/pages/client-access");
    expect(actions[0]).toHaveTextContent("Request Access");
    expect(actions[1]).toHaveAttribute("href", "#product");
    expect(actions[1]).toHaveTextContent("See What's Included");
    ["entity_core", "desk_intelligence", "firm_wide_enterprise"].forEach((plan, index) => {
      expect(container.querySelectorAll(".pricing-card .pricing-action")[index]).toHaveAttribute("href", `/pages/request-access?plan=${plan}`);
    });
    screen.getAllByRole("link", { name: "Client Login", hidden: true }).forEach((link) => {
      expect(link).toHaveAttribute("href", "/login");
    });
    expect(screen.getByRole("link", { name: "Read the Privacy Policy" })).toHaveAttribute("href", "/privacy");
    expect(container).not.toHaveTextContent(/Unlimited internal users|Full historical archive|SLA-backed availability|Quarterly validation review/);
    expect(container).toHaveTextContent("15 included seats");
    expect(container).toHaveTextContent("every 60 seconds");
    expect(container.querySelector('.hero')).not.toHaveTextContent("every 60 seconds");
    expect(container).toHaveTextContent("Receive the October 12, 2026 report after work-email confirmation and review");
    expect(container).not.toHaveTextContent(/corrected/i);
    expect(container).toHaveTextContent("Unreached target excerpt");
    expect(container.querySelector('a[href*="Daily-Report-"]')).toBeNull();
    expect(container).toHaveTextContent("Evaluate current and historical results");
    expect(screen.getByRole("table")).toHaveTextContent("Managed report webhooks");
    expect(container).not.toHaveTextContent("Email and webhooks do not deliver live target alerts");
    expect(container).not.toHaveTextContent(/monthly statistics|monthly reports|—/i);
    expect(container).toHaveTextContent("Applying does not collect payment or activate access.");
    const overview = screen.getByRole("link", { name: /Download Buyer Overview/ });
    expect(overview).toHaveAttribute("href", "/reports/buyer-overview.pdf");
    fireEvent.click(overview);
    expect(trackEvent).toHaveBeenCalledWith(MARKETING_EVENTS.buyerOverviewOpened, { placement: "pricing" });
    expect(container).toHaveTextContent("Report details");
    expect(container).toHaveTextContent("A single historical session illustrates the deliverable");
    const sample = screen.getByRole("link", { name: "Request the Full Report" });
    expect(sample).toHaveAttribute("href", "#sample");
    fireEvent.click(sample);
    expect(trackEvent).toHaveBeenCalledWith(MARKETING_EVENTS.reportRequestClicked, { placement: "evidence" });
    expect(container).not.toHaveTextContent(/winning trades|immutable|instant delivery guaranteed/i);
  });

  test("tracks format exploration separately from requests and closes mobile navigation", () => {
    const { container } = renderPage();
    fireEvent.click(screen.getByRole("link", { name: "See What's Included" }));
    expect(trackEvent).toHaveBeenCalledWith(MARKETING_EVENTS.productExplored, { placement: "hero" });
    fireEvent.click(container.querySelector(".header-cta"));
    expect(trackEvent).toHaveBeenCalledWith(MARKETING_EVENTS.requestAccessClicked, { placement: "header" });
    fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).not.toHaveAttribute("hidden");
    fireEvent.click(container.querySelector('.mobile-nav a[href="#pricing"]'));
    expect(container.querySelector(".mobile-nav")).toHaveAttribute("hidden");
  });

  test("records pricing exposure once and FAQ open using only a static question key", () => {
    let callback;
    const disconnect = jest.fn();
    const original = global.IntersectionObserver;
    global.IntersectionObserver = jest.fn((handler) => {
      callback = handler;
      return { observe: jest.fn(), disconnect };
    });
    try {
      const { container } = renderPage();
      act(() => { callback([{ isIntersecting: false }]); callback([{ isIntersecting: true }]); callback([{ isIntersecting: true }]); });
      expect(trackEvent.mock.calls.filter(([name]) => name === MARKETING_EVENTS.planViewed)).toHaveLength(1);
      expect(disconnect).toHaveBeenCalled();
      const question = container.querySelector(".faq-list details");
      question.open = true;
      fireEvent(question, new Event("toggle"));
      expect(trackEvent).toHaveBeenCalledWith(MARKETING_EVENTS.faqOpened, { question: "target" });
    } finally { global.IntersectionObserver = original; }
  });

  test("rejects empty and whitespace-only fields without making a request", () => {
    const { container } = renderPage();
    fireEvent.submit(container.querySelector("form"));
    expect(createReportRequest).not.toHaveBeenCalled();
    fillRequest();
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "   " } });
    fireEvent.submit(container.querySelector("form"));
    expect(createReportRequest).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Please complete each required field");
  });

  test("sanitizes submission, locks duplicates, and distinguishes receipt from delivery", async () => {
    let resolveRequest;
    createReportRequest.mockImplementation(() => new Promise((resolve) => { resolveRequest = resolve; }));
    const { container } = renderPage();
    fillRequest();
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "  Test Analyst  " } });
    fireEvent.focus(screen.getByLabelText("Full name"));
    fireEvent.focus(screen.getByLabelText("Company"));
    expect(trackEvent.mock.calls.filter(([name]) => name === MARKETING_EVENTS.reportRequestStarted)).toHaveLength(1);
    fireEvent.submit(container.querySelector("form"));
    fireEvent.submit(container.querySelector("form"));
    expect(createReportRequest).toHaveBeenCalledTimes(1);
    expect(createReportRequest).toHaveBeenCalledWith(expect.objectContaining({ fullName: "Test Analyst", workEmail: "analyst@example.com" }));
    expect(screen.getByRole("button", { name: "Submitting request…" })).toBeDisabled();
    await act(async () => resolveRequest({ verificationDelivery: "sent" }));
    expect(screen.getByRole("status")).toHaveTextContent("Check your work email");
    expect(screen.getByLabelText("Full name")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Request the Full Report" })).toBeDisabled();
    expect(JSON.stringify(trackEvent.mock.calls)).not.toMatch(/Test Analyst|analyst@example.com|Example Desk/);
  });

  test.each([
    [{ verificationDelivery: "manual_follow_up_required" }, "confirmation email could not be sent"],
    [{}, "could not confirm email delivery"]
  ])("handles accepted requests without claiming email delivery: %j", async (response, expected) => {
    createReportRequest.mockResolvedValue(response);
    const { container } = renderPage();
    fillRequest();
    fireEvent.submit(container.querySelector("form"));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(expected));
    expect(screen.getByRole("button", { name: "Request the Full Report" })).toBeDisabled();
  });

  test("retains inputs after failure and allows a deliberate retry", async () => {
    createReportRequest.mockRejectedValueOnce(Object.assign(new Error("private server information"), {status: 400}))
      .mockResolvedValueOnce({ verificationDelivery: "sent" });
    const { container } = renderPage();
    fillRequest();
    fireEvent.submit(container.querySelector("form"));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("We could not submit"));
    expect(screen.getByLabelText("Full name")).toHaveValue("Test Analyst");
    expect(container).not.toHaveTextContent("private server information");
    fireEvent.submit(container.querySelector("form"));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Check your work email"));
    expect(createReportRequest).toHaveBeenCalledTimes(2);
  });

  test("does not invite a duplicate request after a network timeout", async () => {
    createReportRequest.mockRejectedValue(Object.assign(new Error("timeout"), {status: 0}));
    const {container} = renderPage();
    fillRequest();
    fireEvent.submit(container.querySelector("form"));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("may have been received"));
    expect(screen.getByRole("button", {name: "Request the Full Report"})).toBeDisabled();
  });
});
