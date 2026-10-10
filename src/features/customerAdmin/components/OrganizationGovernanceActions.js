/**
 * @fileoverview Audit export and governed organization closure actions.
 */

import React, {useState} from 'react';
import {Alert, Button, Form, Modal} from 'react-bootstrap';
import copy from '../locales/en.json';

/**
 * Downloads structured audit evidence without sending it to another service.
 *
 * @param {Array<Object>} entries - Audit entries
 * @param {string} slug - Organization slug
 * @return {void}
 */
export const downloadAuditJson = (entries, slug) => {
  const blob = new Blob([JSON.stringify({items: entries}, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `harper-vance-${slug}-audit.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

/**
 * Renders audit export and typed-confirmation closure controls.
 *
 * @param {Object} props - Component properties
 * @param {Object} props.organization - Selected organization
 * @param {boolean} props.submitting - Whether a governance request is active
 * @param {Error|null} props.error - Safe operation error
 * @param {Function} props.onExport - Audit export callback
 * @param {Function} props.onCloseOrganization - Organization closure callback
 * @return {JSX.Element} Governance actions
 */
export default function OrganizationGovernanceActions({
  organization,
  submitting,
  error,
  onExport,
  onCloseOrganization,
}) {
  const [showClose, setShowClose] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  /**
   * Exports organization audit history as a local JSON file.
   *
   * @return {Promise<void>}
   */
  const handleExport = async () => {
    try {
      const entries = await onExport(organization.id);
      downloadAuditJson(entries, organization.slug);
    } catch (_error) {
      // Parent exposes the safe operation error.
    }
  };

  /**
   * Closes the organization after exact slug confirmation.
   *
   * @return {Promise<void>}
   */
  const handleClose = async () => {
    try {
      await onCloseOrganization(organization.id);
      setShowClose(false);
      setConfirmation('');
    } catch (_error) {
      // Parent exposes the safe operation error.
    }
  };

  return (
    <div className="d-flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline-secondary" onClick={handleExport} disabled={submitting}>
        {submitting ? copy.governance.exporting : copy.governance.exportAudit}
      </Button>
      {organization.status !== 'closed' && (
        <Button type="button" size="sm" variant="outline-danger" onClick={() => setShowClose(true)} disabled={submitting}>
          {copy.governance.closeOrganization}
        </Button>
      )}
      <Modal show={showClose} onHide={submitting ? undefined : () => setShowClose(false)} centered>
        <Modal.Header closeButton={!submitting}><Modal.Title>{copy.governance.closeTitle}</Modal.Title></Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{copy.governance.error}</Alert>}
          <Alert variant="warning">{copy.governance.closeWarning}</Alert>
          <Form.Group controlId="close-organization-confirmation">
            <Form.Label>{copy.governance.confirmPrompt}: <strong>{organization.slug}</strong></Form.Label>
            <Form.Control value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowClose(false)} disabled={submitting}>{copy.governance.cancel}</Button>
          <Button variant="danger" onClick={handleClose} disabled={submitting || confirmation !== organization.slug}>
            {submitting ? copy.governance.closing : copy.governance.confirmClose}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
