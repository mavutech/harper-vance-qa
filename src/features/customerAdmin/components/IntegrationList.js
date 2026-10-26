/** @fileoverview Shared scoped integration cards and explicit action confirmation. */
import React, {useState} from 'react';
import {Alert, Badge, Button, Card, Form, Modal} from 'react-bootstrap';
import IntegrationSharingNotice from './IntegrationSharingNotice';
import IntegrationHistory from './IntegrationHistory';
import IntegrationOwner from './IntegrationOwner';
import IntegrationEditor from './IntegrationEditor';
import copy from '../locales/integrations.en';

/**
 * Displays metadata only; full endpoint addresses never enter this component.
 * @param {Object} props - Hook state, member names and organization labels.
 * @returns {JSX.Element} Integration list and confirmation dialog.
 */
export default function IntegrationList({state, members = [], organizations = []}) {
  const [pending, setPending] = useState(null);
  const [history, setHistory] = useState(null);
  const [editing, setEditing] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  /** @returns {Promise<void>} Performs one explicitly confirmed action. */
  const confirm = async () => {
    try {
      if (pending.action === 'test') await state.test(pending.item);
      else await state.change(pending.item, {status: pending.action,
        ...(pending.action === 'active' ? {sharingWarningVersion: 'licensed-use-v1'} : {})});
      setPending(null);
    } catch (_) { setPending(null); }
  };
  return <>
    {!state.loading && !state.items.length && <p>{copy.empty}</p>}
    <div className="d-grid gap-3">{state.items.map((item) => {
      const member = members.find((entry) => entry.uid === item.responsibleUserId);
      const org = organizations.find((entry) => (entry.orgId || entry.id) === item.orgId);
      const governed = item.schemaVersion === 2;
      const webhook = governed && item.type !== 'email';
      return <Card key={item.id}><Card.Body>
        <div className="d-flex flex-wrap justify-content-between gap-2">
          <h5>{item.label}</h5><Badge bg="secondary">{copy.states[item.status] || item.status}</Badge>
        </div>
        <dl>
          {item.description && <><dt>{copy.description}</dt><dd>{item.description}</dd></>}
          <dt>{copy.organization}</dt><dd>{org?.name || item.organizationName || item.orgId}</dd>
          <dt>{copy.responsibleUser}</dt><dd>{member?.displayName || member?.email || item.responsibleUserName || item.responsibleUserId || copy.legacy}</dd>
          <dt>{webhook ? copy.savedEndpoint : copy.destination}</dt>
          <dd className="text-break">{item.type === 'email' ? item.maskedAddress : item.destinationHost ? copy.maskedEndpoint.replace('{host}', item.destinationHost) :
            (item.status === 'external' ? copy.externalEndpoint : copy.endpointUnavailable)}</dd>
          <dt>{copy.subscriptions}</dt><dd>{item.type === 'email' ? copy.emailTitle : item.reportTypes.map((type) => copy[type] || type).join(', ')}</dd>
        </dl>
        {!governed && <Alert variant="secondary">{item.status === 'external' ? copy.external : copy.legacy}</Alert>}
        <div className="d-flex flex-wrap gap-2">
          {webhook && item.status !== 'removed' && <>
            <Button disabled={state.busy} variant="outline-primary" onClick={() => setEditing(item)}>{copy.edit}</Button>
            <Button disabled={state.busy} variant="outline-primary" onClick={() => setPending({item, action: 'test'})}>{copy.test}</Button>
            <Button disabled={state.busy || (item.status !== 'active' && item.lastTestOutcome !== 'accepted')}
              onClick={() => { setAcknowledged(false); setPending({item, action: item.status === 'active' ? 'paused' : 'active'}); }}>
              {item.status === 'active' ? copy.pause : copy.activate}
            </Button>
            <Button disabled={state.busy} variant="outline-danger" onClick={() => setPending({item, action: 'removed'})}>{copy.remove}</Button>
          </>}
          {governed && <Button variant="outline-secondary" onClick={() => setHistory(item)}>{copy.history}</Button>}
        </div>
        {item.type === 'email' && <p className="text-secondary mt-2 mb-0">{copy.emailManaged}</p>}
        {webhook && item.status === 'paused' && item.lastTestOutcome !== 'accepted' &&
          <p className="text-secondary mt-2 mb-0">{copy.testRequired}</p>}
        {webhook && item.status !== 'removed' && members.length > 0 &&
          <IntegrationOwner item={item} members={members} busy={state.busy} onChange={state.change} />}
      </Card.Body></Card>;
    })}</div>
    <Modal show={!!pending} onHide={() => !state.busy && setPending(null)}>
      <Modal.Header closeButton={!state.busy}><Modal.Title>{copy.confirm}</Modal.Title></Modal.Header>
      <Modal.Body>{pending && copy.confirmations[pending.action]}
        {pending?.action === 'active' && <div className="d-grid gap-3 mt-3">
          <IntegrationSharingNotice />
          <Form.Check id="integration-sharing-acknowledgment" label={copy.sharingAcknowledge}
            checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
        </div>}
      </Modal.Body>
      <Modal.Footer><Button variant="secondary" disabled={state.busy} onClick={() => setPending(null)}>{copy.cancel}</Button>
        <Button disabled={state.busy || (pending?.action === 'active' && !acknowledged)} onClick={confirm}>{copy.confirm}</Button></Modal.Footer>
    </Modal>
    {history && <IntegrationHistory item={history} onClose={() => setHistory(null)} />}
    {editing && <IntegrationEditor item={editing} onSave={state.edit} onClose={() => setEditing(null)} />}
  </>;
}
