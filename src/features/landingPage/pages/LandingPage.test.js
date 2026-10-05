import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "./LandingPage";

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
  test("explains the service in the main headline and description", () => {
    const { container } = renderLandingPage();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "NQ target intelligence your desk can evaluate over time."
    );
    expect(screen.getByText(/complete daily email record and weekly validation report/i)).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/5[- ]minute/i);
  });

  test("explains the service timeline for professional desks without execution language", () => {
    const { container } = renderLandingPage();

    expect(screen.getByText("NQ market intelligence")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "During the session" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "After the session" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "At the end of the week" })).toBeInTheDocument();
    expect(screen.getByText(/a session may produce no targets/i)).toBeInTheDocument();
    expect(screen.getByText(/review the intelligence from one controlled system of record/i)).toBeInTheDocument();
    expect(screen.getByText(/not order entry or execution/i)).toBeInTheDocument();
    expect(screen.queryByText(/independent intelligence\. your team decides/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Request the latest report", hidden: true })).toHaveLength(5);
    expect(screen.getAllByText("Representative record format")).toHaveLength(2);
    expect(screen.getByText("Example format—not a live or historical result.")).toBeInTheDocument();
    expect(container.querySelectorAll(".artifact-icon i")).toHaveLength(3);
    expect(container.querySelectorAll(".principle-icon i")).toHaveLength(3);
    expect(container.querySelector(".record-principles")).not.toHaveTextContent(/01|02|03/);
    expect(container.querySelector(".plan-block")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View licensing" })).not.toBeInTheDocument();
  });

  test("states the complete subscription before presenting license differences", () => {
    const { container } = renderLandingPage();

    expect(screen.getByText(/every license includes the same core intraday targets, daily email report, and weekly validation report/i)).toBeInTheDocument();
    expect(screen.getByText(/the daily email is one part of the Harper Vance subscription/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Included with every license" })).toBeInTheDocument();
    expect(container.querySelector(".pricing-included")).toHaveTextContent("Secure client dashboard");
    expect(screen.getByText("Everything in Entity Core, plus:")).toBeInTheDocument();
    expect(screen.getByText("Everything in Desk Intelligence, plus:")).toBeInTheDocument();
  });

  test("describes the dashboard views included with the service", () => {
    renderLandingPage();

    expect(screen.getByText("Today's Targets")).toBeInTheDocument();
    expect(screen.getByText("Daily Performance")).toBeInTheDocument();
    expect(screen.getByText("Weekly Summary")).toBeInTheDocument();
    expect(screen.getByText("Historical & Rolling")).toBeInTheDocument();
    expect(screen.getByText(/secure dashboard, email, and one-way Slack or Microsoft Teams delivery/i)).toBeInTheDocument();
  });

  test("provides client login links to the existing login route", () => {
    renderLandingPage();

    const loginLinks = screen.getAllByRole("link", { name: "Client Login", hidden: true });
    expect(loginLinks).toHaveLength(3);
    loginLinks.forEach((link) => expect(link).toHaveAttribute("href", "/login"));
  });

  test("keeps completed-session report requests in the visitor's email client", () => {
    renderLandingPage();

    expect(screen.getByRole("heading", { name: "Review the latest completed-session email report." })).toBeInTheDocument();
    expect(screen.getByText("Same email format delivered to clients")).toBeInTheDocument();
    expect(screen.getByText(/available to professional trading organizations by approval/i)).toBeInTheDocument();
    expect(screen.getByText(/does not store form data/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Prepare report request" })).toBeInTheDocument();
  });
});
