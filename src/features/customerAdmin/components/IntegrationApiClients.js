/** @fileoverview Reuses governed API credential operations in the integration area. */
import React, {useState} from 'react';
import {Alert, Button, Form} from 'react-bootstrap';
import {useCustomerOperations} from '../hooks/useCustomerOperations';
import copy from '../locales/integrations.en';

/**
 * Displays eligible API credential management without legacy webhook setup.
 * @param {Object} props - Organization and licensed features.
 * @returns {JSX.Element} API controls.
 */
export default function IntegrationApiClients({orgId, features}) {
  const state = useCustomerOperations(orgId, features, true);
  const [label, setLabel] = useState('');
  /** @param {Event} event - Submission. @returns {Promise<void>} */
  const create = async (event) => {
    event.preventDefault();
    try { await state.addApiClient({label: label.trim(), expiresAt: null}); setLabel(''); } catch (_) {}
  };
  /** @param {string} id - Credential identifier. @returns {Promise<void>} */
  const revoke = async (id) => {
    if (!window.confirm(copy.apiConfirmRevoke)) return;
    try { await state.removeApiClient(id); } catch (_) {}
  };
  return <section className="mt-4">
    <h2 className="h5">{copy.apiTitle}</h2><p>{copy.apiHint}</p>
    {state.error && <Alert variant="danger">{copy.error}</Alert>}
    {state.apiSecret && <Alert variant="warning">
      <Form.Group controlId="new-integration-api-key"><Form.Label>{copy.apiSecret}</Form.Label>
        <Form.Control readOnly value={state.apiSecret} autoComplete="off" />
      </Form.Group>
    </Alert>}
    <Form onSubmit={create} className="d-grid gap-2">
      <Form.Group controlId="integration-api-label"><Form.Label>{copy.name}</Form.Label>
        <Form.Control required maxLength={100} value={label} onChange={(e) => setLabel(e.target.value)} />
      </Form.Group>
      <Button type="submit" disabled={state.submitting || state.loading}>{copy.apiCreate}</Button>
    </Form>
    {!state.apiClients.length && <p>{copy.apiEmpty}</p>}
    {state.apiClients.map((item) => <div className="d-flex justify-content-between gap-2 py-2" key={item.id}>
      <span>{item.label}</span>
      {item.status === 'active' && <Button variant="outline-danger" size="sm" disabled={state.submitting}
        onClick={() => revoke(item.id)}>{copy.apiRevoke}</Button>}
    </div>)}
  </section>;
}
