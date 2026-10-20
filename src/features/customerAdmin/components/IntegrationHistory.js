/** @fileoverview Safe paginated delivery history dialog. */
import React, {useEffect, useState} from 'react';
import {Alert, Button, Modal, Spinner} from 'react-bootstrap';
import {integrationHistory} from '../services/integrationService';
import copy from '../locales/integrations.en.json';

/**
 * Loads only the selected destination's delivery metadata.
 * @param {Object} props - Integration and close callback.
 * @returns {JSX.Element} Delivery history dialog.
 */
export default function IntegrationHistory({item, onClose}) {
  const [after, setAfter] = useState(null);
  const [page, setPage] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setPage(null); setError(false);
    integrationHistory(item.orgId, item.id, after).then((result) => {
      if (active) setPage(result);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [item.orgId, item.id, after]);
  return <Modal show onHide={onClose}>
    <Modal.Header closeButton><Modal.Title>{copy.history}</Modal.Title></Modal.Header>
    <Modal.Body>
      <p>{copy.acceptanceNote}</p>
      {error ? <Alert variant="danger">{copy.error}</Alert> : !page ? <Spinner animation="border" aria-label={copy.loading} /> :
        <>{!page.items.length && <p>{copy.noHistory}</p>}
          {page.items.map((attempt) => <div className="border-bottom py-2" key={attempt.id}>
            <strong>{attempt.test ? copy.sample : copy[attempt.reportType]}</strong>
            <div>{copy.outcomes[attempt.outcome] || copy.error}</div>
            <small>{attempt.attemptedAt?._seconds ? new Date(attempt.attemptedAt._seconds * 1000).toLocaleString() : ''}</small>
          </div>)}
          {page.nextCursor && <Button onClick={() => setAfter(page.nextCursor)}>{copy.next}</Button>}
        </>}
    </Modal.Body>
  </Modal>;
}
