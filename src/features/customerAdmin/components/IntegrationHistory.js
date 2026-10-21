/** @fileoverview Safe paginated delivery history dialog. */
import React from 'react';
import {Alert, Button, Modal, Spinner} from 'react-bootstrap';
import {useIntegrationHistory} from '../hooks/useIntegrationHistory';
import copy from '../locales/integrations.en.json';

/**
 * Loads only the selected destination's delivery metadata.
 * @param {Object} props - Integration and close callback.
 * @returns {JSX.Element} Delivery history dialog.
 */
export default function IntegrationHistory({item, onClose}) {
  const {page, error, busy, notice, retry, next} = useIntegrationHistory(item);
  return <Modal show onHide={onClose}>
    <Modal.Header closeButton><Modal.Title>{copy.history}</Modal.Title></Modal.Header>
    <Modal.Body>
      <p>{item.type === 'email' ? copy.emailAcceptanceNote : copy.acceptanceNote}</p>
      {notice && <Alert variant="info" role="status">{notice}</Alert>}
      {error ? <Alert variant="danger">{copy.error}</Alert> : !page ? <Spinner animation="border" aria-label={copy.loading} /> :
        <>{!page.items.length && <p>{copy.noHistory}</p>}
          {page.items.map((attempt) => <div className="border-bottom py-2" key={attempt.id}>
            <strong>{attempt.test ? copy.sample : item.type === 'email' ? copy.emailTitle : copy[attempt.reportType]}</strong>
            <div>{copy.outcomes[attempt.outcome] || copy.error}</div>
            <small>{attempt.attemptedAt?._seconds ? new Date(attempt.attemptedAt._seconds * 1000).toLocaleString() : ''}</small>
            {item.type !== 'email' && !attempt.test && attempt.jobId && ['rejected', 'uncertain'].includes(attempt.outcome) &&
              <Button size="sm" disabled={busy} onClick={() => {
                if (window.confirm(copy.retryWarning)) retry(attempt.jobId);
              }}>{copy.retryDelivery}</Button>}
          </div>)}
          {page.nextCursor && <Button onClick={next}>{copy.next}</Button>}
        </>}
    </Modal.Body>
  </Modal>;
}
