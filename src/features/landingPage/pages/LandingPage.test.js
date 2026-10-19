import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "./LandingPage";
import { getAccessRequestUrl, LANDING_PAGE_CONFIG } from "../landingPageConfig";
import { trackEvent } from "../../../utils/analytics";
import { MARKETING_EVENTS } from "../marketingAnalytics";

jest.mock("../../../utils/analytics", () => ({
  trackEvent: jest.fn()
}));

jest.mock("../../../config/seoConfig", () => ({
  updatePageSEO: jest.fn()
}));

/**
 * Renders the landing page with routing support.
 *
 * @returns {import("@testing-library/react").RenderResult} Render helpers.
 */
function renderLandingPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
}

describe("LandingPage", () => {
  beforeEach(() => {
    trackEvent.mockClear();
  });

  test("explains the service in the main headline and description", () => {
    const { container } = renderLandingPage();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "NQ target intelligence your desk can evaluate."
    );
    expect(screen.getByText(/preserves the complete record/i)).toBeInTheDocument();
    expect(container).not.toHaveTextContent("\u2014");
    expect(container).not.toHaveTextContent(/5[- ]minute/i);
    expect(container).not.toHaveTextContent(/real[- ]time/i);
    expect(container).not.toHaveTextContent(/winning trades/i);
    expect(container).not.toHaveTextContent(/immutable/i);
  });

  test("explains the service timeline for professional desks without execution language", () => {
    const { container } = renderLandingPage();

    expect(screen.getByText("NQ market intelligence")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "During the session" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "After the session" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Over time" })).toBeInTheDocument();
    expect(screen.getByText(/a session may produce no targets/i)).toBeInTheDocument();
    expect(screen.getByText(/review the intelligence from one controlled system of record/i)).toBeInTheDocument();
    expect(screen.getByText(/not order entry or execution/i)).toBeInTheDocument();
    expect(screen.queryByText(/independent intelligence\. your team decides/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Get the Latest Report", hidden: true })).toHaveLength(1);
    expect(container).not.toHaveTextContent("Request the latest report");
    expect(container).not.toHaveTextContent("Request client access");
    expect(screen.getAllByText("Representative record format")).toHaveLength(2);
    expect(screen.getByText("Example format. Not a live or historical result.")).toBeInTheDocument();
    expect(container.querySelectorAll(".artifact-icon i")).toHaveLength(3);
    expect(container.querySelectorAll(".principle-icon i")).toHaveLength(3);
    expect(container.querySelector(".record-principles")).not.toHaveTextContent(/01|02|03/);
    expect(container.querySelector(".plan-block")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View licensing" })).not.toBeInTheDocument();
  });

  test("states the complete subscription before presenting license differences", () => {
    const { container } = renderLandingPage();

    expect(screen.getByText(/every license includes the same target intelligence, authenticated dashboard, completed-session daily report, and weekly review/i)).toBeInTheDocument();
    expect(screen.getByText(/the daily email is one part of the Harper Vance subscription/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Included with every license" })).toBeInTheDocument();
    expect(container.querySelector(".pricing-included")).toHaveTextContent("Secure authenticated dashboard");
    expect(container.querySelector(".pricing-included")).toHaveTextContent("Today's Targets and Daily Performance Record");
    expect(container.querySelector(".pricing-included")).toHaveTextContent("Weekly Summary");
    expect(container.querySelector(".pricing-included")).toHaveTextContent("Historical & Rolling analysis");
    expect(screen.getByText(/dashboard views are shared across licenses/i)).toBeInTheDocument();
    expect(screen.getByText("Everything in Entity Core, plus:")).toBeInTheDocument();
    expect(screen.getByText("Everything in Desk Intelligence, plus:")).toBeInTheDocument();
  });

  test("describes the dashboard views included with the service", () => {
    const { container } = renderLandingPage();

    const dashboardViews = container.querySelector(".operations-list");
    expect(dashboardViews).toHaveTextContent("Today's Targets");
    expect(dashboardViews).toHaveTextContent("Daily Performance Record");
    expect(dashboardViews).toHaveTextContent("Weekly Summary");
    expect(dashboardViews).toHaveTextContent("Historical & Rolling");
    expect(screen.getByText(/partial periods, small samples, unresolved targets, and unavailable aggregates remain visible/i)).toBeInTheDocument();
    expect(screen.getByText(/secure dashboard and email delivery are included/i)).toBeInTheDocument();
    expect(screen.getByText(/Slack or Microsoft Teams delivery is not included until technical setup is certified/i)).toBeInTheDocument();
  });

  test("shows a clearly bounded representative report and evaluation path", () => {
    const { container } = renderLandingPage();

    expect(screen.getByRole("heading", {
      name: "Representative completed-session report"
    })).toBeInTheDocument();
    expect(screen.getByText(
      "Illustrative data only. Not a live, historical, or performance result."
    )).toBeInTheDocument();
    expect(container.querySelector(".report-preview")).toHaveTextContent("Qualifying targets3");
    expect(screen.getByRole("heading", { name: "Best fit" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Evaluation path" })).toBeInTheDocument();
    expect(screen.getByText(/not designed for retail alerts, automated order entry/i)).toBeInTheDocument();
  });

  test("provides client login links to the existing login route", () => {
    renderLandingPage();

    const loginLinks = screen.getAllByRole("link", { name: "Client Login", hidden: true });
    expect(loginLinks).toHaveLength(3);
    loginLinks.forEach((link) => expect(link).toHaveAttribute("href", "/login"));
  });

  test("records privacy-safe marketing funnel events", () => {
    let observerCallback;
    const observe = jest.fn();
    const disconnect = jest.fn();
    const OriginalIntersectionObserver = global.IntersectionObserver;
    global.IntersectionObserver = jest.fn((callback) => {
      observerCallback = callback;
      return { observe, disconnect };
    });

    try {
      const { container } = renderLandingPage();
      expect(trackEvent).toHaveBeenCalledWith(MARKETING_EVENTS.homeViewed);

      fireEvent.click(container.querySelector(".header-cta"));
      expect(trackEvent).toHaveBeenCalledWith(
        MARKETING_EVENTS.requestAccessClicked,
        { placement: "header" }
      );

      fireEvent.focus(screen.getByLabelText("Full name"));
      expect(trackEvent).toHaveBeenCalledWith(MARKETING_EVENTS.reportRequestStarted);

      act(() => observerCallback([{ isIntersecting: true }]));
      expect(trackEvent).toHaveBeenCalledWith(
        MARKETING_EVENTS.planViewed,
        { section: "pricing" }
      );
      expect(disconnect).toHaveBeenCalled();
    } finally {
      global.IntersectionObserver = OriginalIntersectionObserver;
    }
  });

  test("provides a client access link to the existing public application", () => {
    const previousPublicUrl = process.env.REACT_APP_PUBLIC_ACCESS_URL;
    process.env.REACT_APP_PUBLIC_ACCESS_URL = "/pages/client-access";
    try {
      renderLandingPage();

      const accessLinks = screen.getAllByRole("link", { name: "Request Access", hidden: true })
        .filter((link) => link.href.includes("/pages/client-access"));
      expect(accessLinks).toHaveLength(4);
      accessLinks.forEach((link) => expect(link).toHaveAttribute(
        "href",
        "/pages/client-access"
      ));
      expect(getAccessRequestUrl()).toBe("/pages/client-access");
    } finally {
      if (previousPublicUrl === undefined) delete process.env.REACT_APP_PUBLIC_ACCESS_URL;
      else process.env.REACT_APP_PUBLIC_ACCESS_URL = previousPublicUrl;
    }
  });

  test("sends each pricing choice to access with the selected license", () => {
    const previousRequestUrl = process.env.REACT_APP_REQUEST_ACCESS_URL;
    process.env.REACT_APP_REQUEST_ACCESS_URL = "/pages/request-access";
    try {
      renderLandingPage();

      expect(screen.getByRole("link", { name: "Request Access: Entity Core" })).toHaveAttribute(
        "href",
        "/pages/request-access?plan=entity_core"
      );
      expect(screen.getByRole("link", { name: "Request Access: Desk Intelligence" })).toHaveAttribute(
        "href",
        "/pages/request-access?plan=desk_intelligence"
      );
      expect(screen.getByRole("link", { name: "Request Access: Firm-Wide" })).toHaveAttribute(
        "href",
        "/pages/request-access?plan=firm_wide_enterprise"
      );
      expect(getAccessRequestUrl("entity core")).toContain("?plan=entity%20core");
    } finally {
      if (previousRequestUrl === undefined) delete process.env.REACT_APP_REQUEST_ACCESS_URL;
      else process.env.REACT_APP_REQUEST_ACCESS_URL = previousRequestUrl;
    }
  });

  test("makes Request Access primary while keeping Client Login last in navigation", () => {
    const previousApiUrl = process.env.REACT_APP_API_BASE_URL;
    process.env.REACT_APP_API_BASE_URL = "https://api.example.test/sonaDashboard";
    try {
      const { container } = renderLandingPage();

      const heroActions = container.querySelectorAll(".hero-actions a");
      expect(heroActions[0]).toHaveTextContent("Request Access");
      expect(heroActions[0]).toHaveClass("button-primary");
      expect(heroActions[1]).toHaveTextContent("Get the Latest Report");
      expect(heroActions[1]).toHaveClass("button-outline");

      const headerAccess = container.querySelector(".header-cta");
      const headerLogin = container.querySelector(".header-login");
      expect(headerAccess.compareDocumentPosition(headerLogin) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      const mobileLinks = container.querySelectorAll(".mobile-nav a");
      expect(mobileLinks[mobileLinks.length - 2]).toHaveTextContent("Request Access");
      expect(mobileLinks[mobileLinks.length - 1]).toHaveTextContent("Client Login");
    } finally {
      if (previousApiUrl === undefined) delete process.env.REACT_APP_API_BASE_URL;
      else process.env.REACT_APP_API_BASE_URL = previousApiUrl;
    }
  });

  test("provides public legal document links", () => {
    renderLandingPage();

    expect(screen.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
  });

  test("submits completed-session report requests for work-email verification", () => {
    renderLandingPage();

    expect(screen.getByRole("heading", { name: "Review the latest completed-session email report." })).toBeInTheDocument();
    expect(screen.getByText("Same email format delivered to clients")).toBeInTheDocument();
    expect(screen.getByText(/available to professional trading organizations by approval/i)).toBeInTheDocument();
    expect(screen.getByText(/does not subscribe you to recurring emails/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Get the Latest Report" })).toBeInTheDocument();
    expect(LANDING_PAGE_CONFIG.contactEmail).toBe("support@harpervanceqa.com");
  });

  test("publishes only the approved license boundaries", () => {
    const { container } = renderLandingPage();

    expect(container).toHaveTextContent("1 included seat");
    expect(container).toHaveTextContent("5 included seats");
    expect(container).toHaveTextContent("15 included seats");
    expect(container).toHaveTextContent("History allowance defined in the Order Form");
    expect(container).toHaveTextContent("SLA eligibility under an approved enterprise agreement");
    expect(container).not.toHaveTextContent("Unlimited internal users");
    expect(container).not.toHaveTextContent("Full historical archive");
    expect(container).not.toHaveTextContent("SLA-backed availability");
    expect(container).not.toHaveTextContent("Dedicated account management");
  });
});
