import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import WalkthroughSection from "../WalkthroughSection";
import { getAccessRequestUrl, LANDING_PAGE_CONFIG } from "../../landingPageConfig";
import { MARKETING_EVENTS, MARKETING_PLACEMENTS } from "../../marketingAnalytics";

describe("public recorded walkthrough", () => {
  test("provides an ungated player without autoplay or background video loading", () => {
    const onTrack = jest.fn();
    const { container } = render(<WalkthroughSection onTrack={onTrack} />);
    const video = screen.getByLabelText("Harper Vance dashboard walkthrough");
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("preload", "none");
    expect(video).not.toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("poster", LANDING_PAGE_CONFIG.walkthrough.posterUrl);
    expect(video.querySelector("source")).toHaveAttribute("src", LANDING_PAGE_CONFIG.walkthrough.videoUrl);
    expect(video.querySelector("source")).toHaveAttribute("src", "/media/harper-vance-walkthrough-v6.mp4");
    expect(video.querySelector("track")).toHaveAttribute("kind", "captions");
    expect(video.querySelector("track")).toHaveAttribute("src", LANDING_PAGE_CONFIG.walkthrough.captionsUrl);
    expect(container.querySelector("form")).toBeNull();
    expect(screen.queryByText("Watch here. No email required.")).not.toBeInTheDocument();
    expect(screen.getByText("This is the dashboard you’ll have access to with your Harper Vance subscription. See real-time intraday targets and statistical analysis of their timing, pullbacks, and outcomes across daily, weekly, and historical views.")).toBeInTheDocument();
    expect(screen.getByText(/5 min 55 sec/)).toBeInTheDocument();
    expect(screen.queryByText(/Mavu Kasende/)).not.toBeInTheDocument();
    expect(screen.queryByText(/not a live feed/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Target outcomes are not trading returns/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Recording notes/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open the video directly" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /report preview/i })).not.toBeInTheDocument();
    expect(video).not.toHaveAttribute("aria-describedby");
    expect(onTrack).not.toHaveBeenCalled();
  });

  test("directs visitors to the existing access flow and records the placement", () => {
    const onTrack = jest.fn();
    render(<WalkthroughSection onTrack={onTrack} />);
    const accessLink = screen.getByRole("link", { name: "Request Access" });
    expect(accessLink).toHaveAttribute("href", getAccessRequestUrl());
    expect(screen.getAllByRole("link")).toHaveLength(1);
    fireEvent.click(accessLink);
    expect(onTrack).toHaveBeenCalledWith(MARKETING_EVENTS.requestAccessClicked, { placement: MARKETING_PLACEMENTS.walkthrough });
  });

  test("shows loading, recovers, and records actual playback and completion once", () => {
    const onTrack = jest.fn();
    render(<WalkthroughSection onTrack={onTrack} />);
    const video = screen.getByLabelText("Harper Vance dashboard walkthrough");
    fireEvent.waiting(video);
    expect(screen.getByRole("status")).toHaveTextContent("Loading the walkthrough");
    fireEvent.canPlay(video);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fireEvent.waiting(video);
    fireEvent.playing(video);
    fireEvent.playing(video);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fireEvent.canPlay(video);
    fireEvent.ended(video);
    fireEvent.ended(video);
    expect(onTrack.mock.calls).toEqual([[MARKETING_EVENTS.walkthroughStarted], [MARKETING_EVENTS.walkthroughEnded]]);
  });

  test("handles source and player failures without exposing internal error details", () => {
    const onTrack = jest.fn();
    render(<WalkthroughSection onTrack={onTrack} />);
    const video = screen.getByLabelText("Harper Vance dashboard walkthrough");
    fireEvent.error(video.querySelector("source"));
    fireEvent.error(video);
    expect(screen.getByRole("alert")).toHaveTextContent("Refresh the page and try again");
    expect(onTrack.mock.calls).toEqual([[MARKETING_EVENTS.walkthroughFailed]]);
  });
});
