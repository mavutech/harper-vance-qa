/** @fileoverview Accessible managed-webhook editing with explicit retest warning. */
import React, {useState} from 'react';
import {Alert, Button, Form, Modal} from 'react-bootstrap';
import {useIntegrations} from '../hooks/useIntegrations';
import copy from '../locales/integrations.en.json';

/**
 * Keeps saved URLs private and sends only intentionally changed fields.
 * @param {Object} props - Destination, save callback and close callback.
 * @returns {JSX.Element} Styled edit dialog.
 */
export default function IntegrationEditor({item, onSave, onClose}) {
  const scope = useIntegrations({orgId: item.orgId}, true);
  const [label, setLabel] = useState(item.label || '');
  const [url, setUrl] = useState('');
  const [reports, setReports] = useState(item.reportTypes || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const eligible = scope.allowance?.reportTypes || [];
  const choices = [...new Set([...eligible, ...item.reportTypes])];
  const reportsChanged = [...reports].sort().join(',') !== [...item.reportTypes].sort().join(',');
  const changed = label.trim() !== item.label || Boolean(url.trim()) || reportsChanged;
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
        <div><p className="fw-semibold mb-1">{copy.savedEndpoint}</p>
          <p className="text-break mb-0">{item.destinationHost ? copy.maskedEndpoint.replace('{host}', item.destinationHost) : copy.endpointUnavailable}</p>
        </div>
        <Form.Group controlId="integration-edit-url"><Form.Label>{copy.replaceEndpoint}</Form.Label>
          <Form.Control type="url" pattern="https://.*" maxLength={2048} autoComplete="off" disabled={saving}
            value={url} onChange={(e) => setUrl(e.target.value)} aria-describedby="integration-edit-url-hint" />
          <Form.Text id="integration-edit-url-hint">{copy.replaceEndpointHint}</Form.Text>
        </Form.Group>
        {scope.error && <Alert variant="warning">{scope.error}</Alert>}
        <fieldset disabled={saving || scope.loading || !scope.allowance}>
          <legend className="fs-6">{copy.subscriptions}</legend>
          {choices.map((type) => <Form.Check key={type} id={`integration-edit-${type}`} label={copy[type]}
            checked={reports.includes(type)} disabled={!eligible.includes(type) && !reports.includes(type)}
            onChange={(e) => setReports(e.target.checked ? [...reports, type] : reports.filter((r) => r !== type))} />)}
        </fieldset>
        <Alert variant={retest ? 'warning' : 'info'} className="mb-0">{retest ? copy.editRetestWarning : copy.renameHint}</Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" disabled={saving} onClick={onClose}>{copy.cancel}</Button>
        <Button type="submit" disabled={saving || !changed || !label.trim() || !reports.length}>{saving ? copy.creating : copy.saveChanges}</Button>
      </Modal.Footer>
    </Form>
  </Modal>;
}
