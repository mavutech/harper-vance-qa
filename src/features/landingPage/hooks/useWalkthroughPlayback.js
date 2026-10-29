import { useRef, useState } from "react";
import { MARKETING_EVENTS } from "../marketingAnalytics";
import { LANDING_PAGE_CONFIG } from "../landingPageConfig";

/**
 * Tracks playback state and emits only fixed, non-identifying event names.
 * @param {Function} onTrack - Existing privacy-safe analytics callback.
 * @returns {Object} Playback status and native media event handlers.
 */
export default function useWalkthroughPlayback(onTrack) {
  const [status, setStatus] = useState("idle");
  const [selectedChapter, setSelectedChapter] = useState(null);
  const videoRef = useRef(null);
  const pendingChapter = useRef(null);
  const recorded = useRef({ started: false, completed: false, failed: false });

  /** Seeks only after metadata loads, without forcing playback.
   * @returns {void} */
  function handleMetadata() {
    const video = videoRef.current;
    const chapter = pendingChapter.current;
    if (!video || !chapter) return;
    try {
      video.currentTime = Number.isFinite(video.duration) ? Math.min(chapter.seconds, video.duration) : chapter.seconds;
      pendingChapter.current = null;
      setSelectedChapter(chapter.id);
      setStatus("ready");
      video.focus();
      onTrack(MARKETING_EVENTS.walkthroughChapterSelected, { chapter: chapter.id });
    } catch (_) { handleError(); }
  }

  /** Selects a predefined chapter and loads metadata if needed.
   * @param {string} id - Configured chapter identifier. @returns {void} */
  function selectChapter(id) {
    const chapter = LANDING_PAGE_CONFIG.walkthrough.chapters.find((item) => item.id === id);
    const video = videoRef.current;
    if (!chapter || !video) return;
    pendingChapter.current = chapter;
    if (video.readyState > 0) handleMetadata();
    else { setStatus("loading"); video.load(); }
  }

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
    pendingChapter.current = null;
    setStatus("failed");
    recordOnce("failed", MARKETING_EVENTS.walkthroughFailed);
  }

  return { status, videoRef, selectedChapter, selectChapter, handleMetadata, handleWaiting, handleReady, handlePlaying, handleEnded, handleError };
}
