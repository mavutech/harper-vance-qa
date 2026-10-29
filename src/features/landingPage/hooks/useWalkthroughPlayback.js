import { useRef, useState } from "react";
import { MARKETING_EVENTS } from "../marketingAnalytics";

/**
 * Tracks playback state and emits only fixed, non-identifying event names.
 * @param {Function} onTrack - Existing privacy-safe analytics callback.
 * @returns {Object} Playback status and native media event handlers.
 */
export default function useWalkthroughPlayback(onTrack) {
  const [status, setStatus] = useState("idle");
  const recorded = useRef({ started: false, completed: false, failed: false });

  /** Records each lifecycle milestone once per page visit. @param {string} key - Milestone. @param {string} event - Event name. @returns {void} */
  function recordOnce(key, event) {
    if (recorded.current[key]) return;
    recorded.current[key] = true;
    onTrack(event);
  }

  /** Exposes buffering without logging visitor data. @returns {void} */
  function handleWaiting() { setStatus("loading"); }

  /** Clears the buffering message once media is ready. @returns {void} */
  function handleReady() { setStatus((current) => current === "loading" ? "ready" : current); }

  /** Records actual playback, not a click or metadata load. @returns {void} */
  function handlePlaying() {
    setStatus("playing");
    recordOnce("started", MARKETING_EVENTS.walkthroughStarted);
  }

  /** Records reaching the end of the video. @returns {void} */
  function handleEnded() {
    setStatus("ended");
    recordOnce("completed", MARKETING_EVENTS.walkthroughEnded);
  }

  /** Shows a safe fallback without exposing native errors. @returns {void} */
  function handleError() {
    setStatus("failed");
    recordOnce("failed", MARKETING_EVENTS.walkthroughFailed);
  }

  return { status, handleWaiting, handleReady, handlePlaying, handleEnded, handleError };
}
