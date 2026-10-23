import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReportGallery from "./ReportGallery";

test("opens the chosen historical report, cycles with keys, and restores focus when closed", async () => {
  render(<ReportGallery />);
  const trigger = screen.getByRole("button", { name: "Enlarge monthly performance screenshot" });
  userEvent.click(trigger);
  const dialog = await screen.findByRole("dialog", { name: "Monthly performance" });
  expect(within(dialog).getByText(/September 2026/)).toBeInTheDocument();
  const original = within(dialog).getByRole("link", { name: "Open full-size image" });
  expect(original).toHaveAttribute("href", "/images/report-previews/monthly-2026-09-charts.png");
  fireEvent.keyDown(dialog, { key: "ArrowRight" });
  expect(screen.getByRole("dialog", { name: "Daily performance" })).toBeInTheDocument();
  fireEvent.keyDown(dialog, { key: "ArrowLeft" });
  expect(screen.getByRole("dialog", { name: "Monthly performance" })).toBeInTheDocument();
  userEvent.click(within(dialog).getByRole("button", { name: "Previous" }));
  expect(screen.getByRole("dialog", { name: "Weekly summary" })).toBeInTheDocument();
  userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(trigger).toHaveFocus();
});
