import React from "react";
import Modal from "react-bootstrap/Modal";
import useReportGallery from "../hooks/useReportGallery";
import messages from "../locales/en";

const copy = messages.reportGallery;

/**
 * Shows privacy-cropped historical reports with an accessible enlarged view.
 * @returns {React.ReactElement} Report thumbnails and modal viewer.
 */
export default function ReportGallery() {
  const { selected, open, close, previous, next } = useReportGallery(copy.items.length);
  const report = selected === null ? null : copy.items[selected];

  return (
    <div className="shell report-gallery">
      <div className="report-gallery-grid">
        {copy.items.map((item, index) => (
          <button className="report-thumbnail" type="button" key={item.id} onClick={() => open(index)} aria-haspopup="dialog" aria-label={item.openLabel}>
            <span className="report-thumbnail-image">
              <img src={item.src} width={item.width} height={item.height} alt={item.alt} loading="lazy" decoding="async" />
              <span className="report-thumbnail-expand" aria-hidden="true"><i className="ri-zoom-in-line" /></span>
            </span>
            <span className="report-thumbnail-copy">
              <strong>{item.title}</strong>
              <span className="report-thumbnail-date">{item.context && `${item.context} · `}{item.date}</span>
              <span>{item.description}</span>
              <span>{item.question}</span>
              <span className="report-thumbnail-action">{copy.enlarge} <span aria-hidden="true">↗</span></span>
            </span>
          </button>
        ))}
      </div>
      <p className="report-gallery-note">{copy.note}</p>
      <Modal show={report !== null} onHide={close} className="hv-landing report-lightbox" aria-labelledby="report-lightbox-title" aria-describedby="report-lightbox-caption" centered scrollable>
        {report && <>
          <Modal.Header>
            <div aria-live="polite">
              <Modal.Title as="h2" id="report-lightbox-title">{report.title}</Modal.Title>
              <p id="report-lightbox-caption">{report.context || copy.historical} · {report.date}</p>
            </div>
            <button type="button" className="report-viewer-button" onClick={close} aria-label={copy.close}>{copy.close} <span aria-hidden="true">×</span></button>
          </Modal.Header>
          <Modal.Body>
            <p className="report-explanation">{report.question} {report.description}</p>
            <img key={report.id} src={report.src} width={report.width} height={report.height} alt={report.alt} />
            {report.focus && <figure className="report-focus">
              <figcaption>{report.focus.title}</figcaption>
              <div className="report-focus-image"><img src={report.src} alt={report.focus.alt} /></div>
              <ul>{report.focus.points.map((point) => <li key={point}>{point}</li>)}</ul>
            </figure>}
            <a className="report-original" href={report.src} target="_blank" rel="noopener noreferrer">{copy.original}</a>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="report-viewer-button" onClick={previous}><span aria-hidden="true">← </span>{copy.previous}</button>
            <span aria-live="polite">{selected + 1} / {copy.items.length}</span>
            <button type="button" className="report-viewer-button" onClick={next}>{copy.next}<span aria-hidden="true"> →</span></button>
          </Modal.Footer>
        </>}
      </Modal>
    </div>
  );
}
