/** @fileoverview Shared scoped integration cards and explicit action confirmation. */
import React, {useState} from 'react';
import {Alert, Badge, Button, Card, Modal} from 'react-bootstrap';
import IntegrationHistory from './IntegrationHistory';
import copy from '../locales/integrations.en.json';

/**
 * Displays metadata only; full endpoint addresses never enter this component.
 * @param {Object} props - Hook state, member names and organization labels.
 * @returns {JSX.Element} Integration list and confirmation dialog.
 */
export default function IntegrationList({state, members = [], organizations = []}) {
  const [pending, setPending] = useState(null);
  const [history, setHistory] = useState(null);
  /** @returns {Promise<void>} Performs one explicitly confirmed action. */
  const confirm = async () => {
    try {
      if (pending.action === 'test') await state.test(pending.item);
      else await state.change(pending.item, {status: pending.action});
      setPending(null);
    } catch (_) { setPending(null); }
  };
  return <>
    {!state.loading && !state.items.length && <p>{copy.empty}</p>}
    <div className="d-grid gap-3">{state.items.map((item) => {
      const member = members.find((entry) => entry.uid === item.responsibleUserId);
      const org = organizations.find((entry) => (entry.orgId || entry.id) === item.orgId);
      const governed = item.schemaVersion === 2;
      return <Card key={item.id}><Card.Body>
        <div className="d-flex flex-wrap justify-content-between gap-2">
          <h5>{item.label}</h5><Badge bg="secondary">{copy.states[item.status] || item.status}</Badge>
        </div>
        <dl>
          <dt>{copy.organization}</dt><dd>{org?.name || item.orgId}</dd>
          <dt>{copy.responsibleUser}</dt><dd>{member?.displayName || member?.email || item.responsibleUserId || copy.legacy}</dd>
          <dt>{copy.destination}</dt><dd>{item.destinationHost || copy.legacy}</dd>
          <dt>{copy.subscriptions}</dt><dd>{item.reportTypes.map((type) => copy[type] || type).join(', ')}</dd>
        </dl>
        {!governed && <Alert variant="secondary">{copy.legacy}</Alert>}
        <div className="d-flex flex-wrap gap-2">
          {governed && item.status !== 'removed' && <>
            <Button disabled={state.busy} variant="outline-primary" onClick={() => setPending({item, action: 'test'})}>{copy.test}</Button>
            <Button disabled={state.busy} onClick={() => setPending({item, action: item.status === 'active' ? 'paused' : 'active'})}>
              {item.status === 'active' ? copy.pause : copy.activate}
            </Button>
            <Button disabled={state.busy} variant="outline-danger" onClick={() => setPending({item, action: 'removed'})}>{copy.remove}</Button>
          </>}
          <Button variant="outline-secondary" onClick={() => setHistory(item)}>{copy.history}</Button>
        </div>
      </Card.Body></Card>;
    })}</div>
    <Modal show={!!pending} onHide={() => !state.busy && setPending(null)}>
      <Modal.Header closeButton={!state.busy}><Modal.Title>{copy.confirm}</Modal.Title></Modal.Header>
      <Modal.Body>{pending && copy.confirmations[pending.action]}</Modal.Body>
      <Modal.Footer><Button variant="secondary" disabled={state.busy} onClick={() => setPending(null)}>{copy.cancel}</Button>
        <Button disabled={state.busy} onClick={confirm}>{copy.confirm}</Button></Modal.Footer>
    </Modal>
    {history && <IntegrationHistory item={history} onClose={() => setHistory(null)} />}
  </>;
}
