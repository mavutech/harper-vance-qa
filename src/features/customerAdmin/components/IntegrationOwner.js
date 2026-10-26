/** @fileoverview Responsible-user reassignment using the current organization roster. */
import React, {useState} from 'react';
import {Button, Form} from 'react-bootstrap';
import copy from '../locales/integrations.en';

/**
 * Reassigns organization responsibility without transferring ownership.
 * @param {Object} props - Integration, eligible members and mutation callback.
 * @returns {JSX.Element} Reassignment form.
 */
export default function IntegrationOwner({item, members, busy, onChange}) {
  const [owner, setOwner] = useState(item.responsibleUserId || '');
  /** @param {Event} event - Submission. @returns {Promise<void>} */
  const submit = async (event) => {
    event.preventDefault();
    try { await onChange(item, {responsibleUserId: owner}); } catch (_) {}
  };
  return <Form onSubmit={submit} className="mt-3 d-flex flex-wrap align-items-end gap-2">
    <Form.Group controlId={`owner-${item.id}`}><Form.Label>{copy.reassign}</Form.Label>
      <Form.Select value={owner} onChange={(e) => setOwner(e.target.value)} required>
        <option value="">{copy.responsibleUser}</option>
        {members.filter((m) => ['owner', 'admin'].includes(m.orgRole) && (!m.accessStatus || m.accessStatus === 'active'))
            .map((m) => <option key={m.uid} value={m.uid}>{m.displayName || m.email || m.uid}</option>)}
      </Form.Select>
    </Form.Group>
    <Button type="submit" variant="outline-secondary" disabled={busy || owner === item.responsibleUserId}>{copy.saveOwner}</Button>
  </Form>;
}
