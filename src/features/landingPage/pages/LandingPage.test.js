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
      "Intraday NQ targets. A record your desk can inspect."
    );
    expect(screen.getByText(/publishes time-stamped targets/i)).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/5[- ]minute/i);
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
