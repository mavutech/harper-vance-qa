import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReportGallery from "./ReportGallery";

test("opens the chosen historical report, cycles with keys, and restores focus when closed", async () => {
  const { container } = render(<ReportGallery />);
  expect(container.querySelectorAll('.report-thumbnail-action .ri-arrow-right-up-line[aria-hidden="true"]')).toHaveLength(4);
  expect(container).not.toHaveTextContent('↗');
  for (const caption of container.querySelectorAll('.report-thumbnail-date')) {
    expect(caption).toHaveTextContent(/^Dashboard example · /);
  }
  expect(screen.getByRole("button", { name: "Enlarge intraday targets screenshot" })).toHaveTextContent("Pullback context: Compare movement away from the target with historical ranges.");
  const trigger = screen.getByRole("button", { name: "Enlarge monthly performance screenshot" });
  userEvent.click(trigger);
  const dialog = await screen.findByRole("dialog", { name: "Monthly performance" });
  expect(within(dialog).getByText(/September 2026/)).toBeInTheDocument();
  expect(dialog.querySelector('#report-lightbox-caption')).toHaveTextContent('Dashboard example · September 2026');
  const original = within(dialog).getByRole("link", { name: "Open full-size image" });
  expect(original).toHaveAttribute("href", "/images/report-previews/monthly-2026-09-charts.png");
  fireEvent.keyDown(dialog, { key: "ArrowRight" });
  expect(screen.getByRole("dialog", { name: "Today's Targets" })).toHaveTextContent("Dashboard example · October 26, 2026");
  expect(dialog).toHaveTextContent("Time open: 258 minutes");
  expect(dialog).toHaveTextContent("26 bullish late targets");
  expect(within(dialog).getByAltText(/Magnified original/)).toHaveAttribute("src", "/images/report-previews/intraday-2026-10-26-targets-log.png");
  const images = within(dialog).getAllByRole("img");
  expect(images[0]).toHaveAttribute("alt", expect.stringContaining("Magnified original"));
  expect(images[1]).toHaveAttribute("alt", expect.stringContaining("October 26, 2026 intraday dashboard"));
  expect(within(dialog).getByRole("link", { name: "Open full-size image" })).toHaveAttribute("href", "/images/report-previews/intraday-2026-10-26-targets-log.png");
  fireEvent.keyDown(dialog, { key: "ArrowRight" });
  expect(screen.getByRole("dialog", { name: "Daily performance" })).toBeInTheDocument();
  expect(dialog.querySelector('#report-lightbox-caption')).toHaveTextContent('Dashboard example · October 22, 2026');
  fireEvent.keyDown(dialog, { key: "ArrowLeft" });
  expect(screen.getByRole("dialog", { name: "Today's Targets" })).toBeInTheDocument();
  fireEvent.keyDown(dialog, { key: "ArrowLeft" });
  expect(screen.getByRole("dialog", { name: "Monthly performance" })).toBeInTheDocument();
  userEvent.click(within(dialog).getByRole("button", { name: "Previous" }));
  expect(screen.getByRole("dialog", { name: "Weekly summary" })).toBeInTheDocument();
  expect(dialog.querySelector('#report-lightbox-caption')).toHaveTextContent('Dashboard example · October 12–16, 2026');
  userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(trigger).toHaveFocus();
});
