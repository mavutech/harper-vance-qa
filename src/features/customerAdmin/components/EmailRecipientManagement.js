/** @fileoverview Licensed daily email assignments using platform Bootstrap components. */
import React, {useState} from 'react';
import {Alert, Badge, Button, Card, Form, Spinner, Table} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import {useEmailRecipients} from '../hooks/useEmailRecipients';
import IntegrationHistory from './IntegrationHistory';
import copy from '../locales/integrations.en';

const TEAM_PATH = '/organization/team';

/** @param {Object} props - Authorized organization, roster and platform mode. @returns {JSX.Element} Recipient manager. */
export default function EmailRecipientManagement({orgId, members = [], platform = false}) {
  const state = useEmailRecipients(orgId);
  const [uid, setUid] = useState('');
  const [history, setHistory] = useState(null);
  const {items = [], allowance} = state.record || {};
  const available = members.filter((member) => !items.some((item) => item.responsibleUserId === member.uid) &&
    (!member.accessStatus || member.accessStatus === 'active') && (!member.seatStatus || member.seatStatus === 'assigned'));
  const full = !allowance || !allowance.complete || (allowance.limit !== null && allowance.used >= allowance.limit);
  return <Card className="mb-4"><Card.Body>
    <h2 className="h5">{copy.recipients.title}</h2>
    <p>{copy.recipients.hint}</p>
    {state.error && <Alert variant="danger">{state.error}</Alert>}
    {state.notice && <Alert variant="success" role="status">{state.notice}</Alert>}
    {state.loading && <Spinner animation="border" aria-label={copy.loading} />}
    {allowance && <>
      <p className="fw-semibold">{copy.recipients.allowance.replace('{used}', allowance.used)
        .replace('{limit}', allowance.limit === null ? copy.recipients.contracted : allowance.limit)}</p>
      {allowance.exceptions > 0 && <p>{copy.recipients.exceptions.replace('{count}', allowance.exceptions)}</p>}
      {allowance.overLimit && <Alert variant="warning">{copy.recipients.overLimit}</Alert>}
    </>}
    <Form onSubmit={async (event) => { event.preventDefault(); if (uid && await state.add(uid)) setUid(''); }}
      className="d-flex flex-wrap gap-2 align-items-end mb-3">
      <Form.Group controlId={`email-member-${orgId}`}>
        <Form.Label>{copy.recipients.member}</Form.Label>
        <Form.Select value={uid} disabled={state.busy || state.loading || full} onChange={(e) => setUid(e.target.value)}>
          <option value="">{copy.recipients.choose}</option>
          {available.map((member) => <option key={member.uid} value={member.uid}>{member.displayName || member.email || member.uid}</option>)}
        </Form.Select>
      </Form.Group>
      <Button type="submit" disabled={!uid || full || state.busy || state.loading}>{copy.recipients.add}</Button>
      {!platform && <Button as={Link} to={TEAM_PATH} variant="outline-secondary">{copy.recipients.team}</Button>}
    </Form>
    <Table responsive><thead><tr>
      <th>{copy.responsibleUser}</th><th>{copy.destination}</th><th>{copy.recipients.preference}</th>
      <th>{copy.recipients.assignment}</th><th>{copy.recipients.actions}</th>
    </tr></thead><tbody>{items.map((item) => <tr key={item.id}>
      <td>{item.responsibleUserName || item.label || copy.responsibleUser}</td>
      <td>{item.maskedAddress}<div className="text-secondary small">{item.legacyEmailApproved ? copy.recipients.exception :
        item.verified ? copy.recipients.verified : copy.recipients.unverified}</div></td>
      <td>{item.status === 'active' ? copy.recipients.optedIn : copy.recipients.optedOut}</td>
      <td><Badge bg="secondary">{item.assigned === false ? copy.recipients.unassigned : copy.recipients.assigned}</Badge></td>
      <td><div className="d-flex flex-wrap gap-2">
        <Button size="sm" variant="outline-primary" disabled={item.schemaVersion !== 2 || state.busy || state.loading ||
          (item.assigned === false && full && !item.legacyEmailApproved)}
          onClick={() => state.assign(item, item.assigned === false)}>
          {item.assigned === false ? copy.recipients.restore : copy.recipients.unassign}</Button>
        <Button size="sm" variant="outline-secondary" onClick={() => setHistory(item)}>{copy.history}</Button>
      </div></td>
    </tr>)}</tbody></Table>
    {!state.loading && !items.length && <p>{copy.recipients.empty}</p>}
    <Button variant="outline-secondary" disabled={state.busy || state.loading} onClick={state.reload}>{copy.refresh}</Button>
    {history && <IntegrationHistory item={history} onClose={() => setHistory(null)} />}
  </Card.Body></Card>;
}
