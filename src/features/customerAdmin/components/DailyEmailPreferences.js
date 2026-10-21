/** @fileoverview Daily report opt-in using the existing platform card styling. */
import React from 'react';
import {Alert, Button, Card, Form, Spinner} from 'react-bootstrap';
import {useDailyEmailPreferences} from '../hooks/useDailyEmailPreferences';
import copy from '../locales/integrations.en.json';

/** @param {Object} props - Organization scope. @returns {JSX.Element} Owned email preferences. */
export default function DailyEmailPreferences({orgId}) {
  const state = useDailyEmailPreferences(orgId);
  return <Card className="mb-4"><Card.Body>
    <h2 className="h5">{copy.emailTitle}</h2><p>{copy.emailHint}</p>
    {state.loading && <Spinner animation="border" aria-label={copy.loading} />}
    {state.error && <Alert variant="danger">{state.error}</Alert>}
    {state.notice && <Alert variant="success" role="status">{state.notice}</Alert>}
    {state.items.filter((item) => item.status !== 'removed').map((item) => <div key={item.id} className="mb-3">
      <Form.Check id={`email-${item.id}`} label={copy.emailOptIn} checked={item.status === 'active'}
        disabled={state.busy} onChange={(e) => state.change(item, e.target.checked)} />
      <p className="text-secondary mb-0">{item.maskedAddress}</p>
    </div>)}
    <Button variant="outline-secondary" disabled={state.loading || state.busy} onClick={state.reload}>{copy.refresh}</Button>
  </Card.Body></Card>;
}
