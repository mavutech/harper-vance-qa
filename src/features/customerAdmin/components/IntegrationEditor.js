/** @fileoverview Accessible managed-webhook editing with explicit retest warning. */
import React, {useState} from 'react';
import {Alert, Button, Form, Modal} from 'react-bootstrap';
import {useIntegrations} from '../hooks/useIntegrations';
import copy from '../locales/integrations.en';

/**
 * Keeps saved URLs private and sends only intentionally changed fields.
 * @param {Object} props - Destination, save callback and close callback.
 * @returns {JSX.Element} Styled edit dialog.
 */
export default function IntegrationEditor({item, onSave, onClose}) {
  const scope = useIntegrations({orgId: item.orgId}, true);
  const [label, setLabel] = useState(item.label || '');
  const [description, setDescription] = useState(item.description || '');
  const [url, setUrl] = useState('');
  const reports = ['daily'];
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const eligible = scope.allowance?.reportTypes || [];
  const reportsChanged = [...reports].sort().join(',') !== [...item.reportTypes].sort().join(',');
  const changed = label.trim() !== item.label || description.trim() !== (item.description || '') || Boolean(url.trim()) || reportsChanged;
  const retest = Boolean(url.trim()) || reportsChanged;
  /** @param {Event} event - Form submission. @returns {Promise<void>} */
  const submit = async (event) => {
    event.preventDefault();
    if (!changed || !label.trim() || !reports.length) return;
    const replacement = url.trim();
    setSaving(true); setError(''); setUrl('');
    try {
      await onSave(item, {expectedVersion: item.editVersion || 0,
        ...(label.trim() !== item.label ? {label: label.trim()} : {}),
        ...(description.trim() !== (item.description || '') ? {description: description.trim()} : {}),
        ...(replacement ? {url: replacement} : {}),
        ...(reportsChanged ? {reportTypes: reports} : {})});
      onClose();
    } catch (failure) {
      setError(copy.errors[failure.code] || copy.error);
    } finally { setSaving(false); }
  };
  return <Modal show onHide={() => !saving && onClose()}>
    <Form onSubmit={submit}>
      <Modal.Header closeButton={!saving}><Modal.Title>{copy.edit}</Modal.Title></Modal.Header>
      <Modal.Body className="d-grid gap-3">
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group controlId="integration-edit-name"><Form.Label>{copy.name}</Form.Label>
          <Form.Control required maxLength={100} disabled={saving} value={label} onChange={(e) => setLabel(e.target.value)} />
        </Form.Group>
        <Form.Group controlId="integration-edit-description"><Form.Label>{copy.description}</Form.Label>
          <Form.Control as="textarea" maxLength={500} disabled={saving} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Form.Group>
        <div><p className="fw-semibold mb-1">{copy.savedEndpoint}</p>
          <p className="text-break mb-0">{item.destinationHost ? copy.maskedEndpoint.replace('{host}', item.destinationHost) : copy.endpointUnavailable}</p>
        </div>
        <Form.Group controlId="integration-edit-url"><Form.Label>{copy.replaceEndpoint}</Form.Label>
          <Form.Control type="url" pattern="https://.*" maxLength={2048} autoComplete="off" disabled={saving}
            value={url} onChange={(e) => setUrl(e.target.value)} aria-describedby="integration-edit-url-hint" />
          <Form.Text id="integration-edit-url-hint">{copy.replaceEndpointHint}</Form.Text>
        </Form.Group>
        {scope.error && <Alert variant="warning">{scope.error}</Alert>}
        <p>{copy.dailyOnly}</p>
        <Alert variant={retest ? 'warning' : 'info'} className="mb-0">{retest ? copy.editRetestWarning : copy.renameHint}</Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" disabled={saving} onClick={onClose}>{copy.cancel}</Button>
        <Button type="submit" disabled={saving || !changed || !label.trim() || (reportsChanged && !eligible.includes('daily'))}>{saving ? copy.creating : copy.saveChanges}</Button>
      </Modal.Footer>
    </Form>
  </Modal>;
}
