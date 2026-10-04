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
      "NQ targets your desk can actually test."
    );
    expect(screen.getByText(/judge the intelligence on evidence/i)).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/5[- ]minute/i);
  });

  test("positions the service for professional desks without execution language", () => {
    const { container } = renderLandingPage();

    expect(screen.getByText("Built for professional NQ desks")).toBeInTheDocument();
    expect(screen.getByText(/not another execution system/i)).toBeInTheDocument();
    expect(screen.getByText(/no trade recommendations or execution instructions/i)).toBeInTheDocument();
    expect(screen.queryByText(/independent intelligence\. your team decides/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Request sample access", hidden: true })).toHaveLength(3);
    expect(screen.getAllByText("Representative record format")).toHaveLength(2);
    expect(screen.getByText("Example format—not a live or historical result.")).toBeInTheDocument();
    expect(container.querySelectorAll(".artifact-icon i")).toHaveLength(3);
    expect(container.querySelectorAll(".principle-icon i")).toHaveLength(3);
    expect(container.querySelectorAll(".plan-step-icon i")).toHaveLength(3);
    expect(container.querySelector(".record-principles")).not.toHaveTextContent(/01|02|03/);
    expect(container.querySelector(".plan-steps")).not.toHaveTextContent(/01|02|03/);
    expect(screen.queryByRole("link", { name: "View licensing" })).not.toBeInTheDocument();
  });

  test("provides client login links to the existing login route", () => {
    renderLandingPage();

    const loginLinks = screen.getAllByRole("link", { name: "Client Login", hidden: true });
    expect(loginLinks).toHaveLength(3);
    loginLinks.forEach((link) => expect(link).toHaveAttribute("href", "/login"));
  });

  test("keeps sample requests in the visitor's email client", () => {
    renderLandingPage();

    expect(screen.getByText(/does not store form data/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Prepare sample request" })).toBeInTheDocument();
  });
});
