/** @fileoverview Paused-by-default webhook setup form. */
import React, {useState} from 'react';
import {Button, Form} from 'react-bootstrap';
import copy from '../locales/integrations.en.json';

/**
 * Captures a destination without retaining the URL after submission.
 * @param {Object} props - Members, busy state and create callback.
 * @returns {JSX.Element} Accessible integration form.
 */
export default function IntegrationForm({members, busy, onCreate, allowance}) {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [owner, setOwner] = useState('');
  const eligible = allowance?.reportTypes || [];
  const [reports, setReports] = useState(['weekly', 'daily'].filter((type) => eligible.includes(type)).slice(0, 1));
  const managers = members.filter((member) => ['owner', 'admin'].includes(member.orgRole) &&
    (!member.accessStatus || member.accessStatus === 'active'));
  /** @param {Event} event - Form submission. @returns {Promise<void>} */
  const submit = async (event) => {
    event.preventDefault();
    const endpoint = url;
    setUrl('');
    try {
      await onCreate({label: label.trim(), url: endpoint, responsibleUserId: owner, reportTypes: reports});
      setLabel('');
    } catch (_) { /* Parent exposes a safe error. */ }
  };
  return <Form onSubmit={submit} className="d-grid gap-3">
    <div role="status">
      <p className="fw-semibold mb-1">{allowance?.complete ? copy.allowance
        .replace('{used}', allowance.used).replace('{limit}', allowance.limit) : copy.allowanceUnavailable}</p>
      <p className="text-secondary mb-0">{copy.allowanceHint}</p>
    </div>
    <Form.Group controlId="integration-name"><Form.Label>{copy.name}</Form.Label>
      <Form.Control required maxLength={100} value={label} onChange={(e) => setLabel(e.target.value)} />
    </Form.Group>
    <Form.Group controlId="integration-url"><Form.Label>{copy.endpoint}</Form.Label>
      <Form.Control required type="url" pattern="https://.*" maxLength={2048} autoComplete="off"
        value={url} onChange={(e) => setUrl(e.target.value)} aria-describedby="integration-url-hint" />
      <Form.Text id="integration-url-hint">{copy.endpointHint}</Form.Text>
    </Form.Group>
    <Form.Group controlId="integration-owner"><Form.Label>{copy.responsibleUser}</Form.Label>
      <Form.Select required value={owner} onChange={(e) => setOwner(e.target.value)}>
        <option value="">{copy.responsibleUser}</option>
        {managers.map((member) => <option key={member.uid} value={member.uid}>
          {member.displayName || member.email || member.uid}
        </option>)}
      </Form.Select>
    </Form.Group>
    <fieldset><legend className="fs-6">{copy.subscriptions}</legend>
      {eligible.map((type) => <Form.Check key={type} id={`integration-${type}`}
        label={copy[type]} checked={reports.includes(type)} onChange={(e) => setReports(
          e.target.checked ? [...reports, type] : reports.filter((item) => item !== type),
        )} />)}
    </fieldset>
    <p className="text-secondary mb-0">{copy.pausedHint}</p>
    <Button type="submit" disabled={busy || !reports.length || !allowance?.complete || allowance.used >= allowance.limit}>{busy ? copy.creating : copy.create}</Button>
  </Form>;
}
