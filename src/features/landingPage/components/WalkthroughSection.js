import React from "react";
import copy from "../locales/walkthrough.en.json";
import messages from "../locales/en";
import { getAccessRequestUrl, LANDING_PAGE_CONFIG } from "../landingPageConfig";
import { MARKETING_EVENTS, MARKETING_PLACEMENTS } from "../marketingAnalytics";
import useWalkthroughPlayback from "../hooks/useWalkthroughPlayback";

/**
 * Presents the recorded walkthrough without an email gate or automatic playback.
 * @param {Object} props - Component properties.
 * @param {Function} props.onTrack - Existing privacy-safe analytics callback.
 * @returns {React.ReactElement} Responsive native video player and access action.
 */
export default function WalkthroughSection({ onTrack }) {
  const playback = useWalkthroughPlayback(onTrack);
  const media = LANDING_PAGE_CONFIG.walkthrough;

  return (
    <section className="section walkthrough-section" id={media.sectionId} aria-labelledby="walkthrough-title">
      <div className="shell walkthrough-layout">
        <div className="walkthrough-copy">
          <p className="eyebrow dark">{copy.eyebrow}</p>
          <h2 id="walkthrough-title">{copy.title}</h2>
          <p>{copy.description}</p>
          <p className="walkthrough-meta">{copy.duration}</p>
          <nav className="walkthrough-chapters" aria-label={copy.chaptersLabel}>
            <h3>{copy.chaptersLabel}</h3>
            {media.chapters.map((chapter) => <button type="button" key={chapter.id}
              aria-pressed={playback.selectedChapter === chapter.id}
              onClick={() => playback.selectChapter(chapter.id)}>
              <span>{chapter.time}</span> {copy.chapters[chapter.id]}
            </button>)}
          </nav>
          <a
            className="pricing-action"
            href={getAccessRequestUrl()}
            onClick={() => onTrack(MARKETING_EVENTS.requestAccessClicked, { placement: MARKETING_PLACEMENTS.walkthrough })}
          >
            {messages.common.requestAccess}
          </a>
        </div>
        <div className="walkthrough-player">
          <video
            ref={playback.videoRef}
            tabIndex={0}
            aria-label={copy.playerLabel}
            controls
            playsInline
            preload="none"
            width={media.width}
            height={media.height}
            poster={media.posterUrl}
            onWaiting={playback.handleWaiting}
            onLoadedMetadata={playback.handleMetadata}
            onCanPlay={playback.handleReady}
            onPlaying={playback.handlePlaying}
            onEnded={playback.handleEnded}
            onError={playback.handleError}
          >
            <source src={media.videoUrl} type="video/mp4" onError={playback.handleError} />
            <track kind="captions" src={media.captionsUrl} srcLang="en" label={copy.captionsLabel} />
            {copy.unsupported}
          </video>
          {playback.status === "loading" && <p className="walkthrough-status" role="status">{copy.loading}</p>}
          {playback.status === "failed" && <p className="walkthrough-status" role="alert">{copy.error}</p>}
          {playback.selectedChapter && playback.status === "ready" && <p role="status">{copy.chapterReady}</p>}
        </div>
      </div>
    </section>
  );
}
