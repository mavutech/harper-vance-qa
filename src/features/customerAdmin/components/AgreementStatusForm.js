/**
 * @fileoverview Platform-owner customer agreement status form.
 */

import React, {useEffect, useState} from 'react';
import {Alert, Button, Col, Form, Row} from 'react-bootstrap';
import copy from '../locales/en.json';

const READY_STATUSES = Object.freeze(['executed', 'waived']);

/**
 * Builds agreement form values from the safe agreement summary.
 *
 * @param {Object|null} agreement - Agreement summary
 * @return {Object} Agreement form values
 */
const formFromAgreement = (agreement) => ({
  status: agreement?.status === 'not_configured' ? 'pending' : agreement?.status || 'pending',
  documentVersion: agreement?.documentVersion || '',
  externalReference: agreement?.externalReference || '',
  effectiveAt: agreement?.effectiveAt ? String(agreement.effectiveAt).slice(0, 10) : '',
});

/**
 * Records that an approved agreement was executed or formally waived.
 *
 * @param {Object} props - Component properties
 * @param {Object|null} props.agreement - Current agreement summary
 * @param {boolean} props.submitting - Whether an operation is active
 * @param {Error|null} props.error - Safe operation error
 * @param {Function} props.onSave - Agreement save callback
 * @return {JSX.Element} Agreement status form
 */
export default function AgreementStatusForm({agreement, submitting, error, onSave}) {
  const [form, setForm] = useState(() => formFromAgreement(agreement));

  useEffect(() => {
    setForm(formFromAgreement(agreement));
  }, [agreement]);

  /**
   * Updates one agreement field.
   *
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement>} event - Field event
   * @return {void}
   */
  const handleChange = (event) => {
    const {name, value} = event.target;
    setForm((current) => ({...current, [name]: value}));
  };

  /**
   * Saves the normalized agreement decision.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Form submission
   * @return {Promise<void>}
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await onSave({
        status: form.status,
        documentVersion: form.documentVersion.trim() || null,
        externalReference: form.externalReference.trim() || null,
        effectiveAt: form.effectiveAt || null,
      });
    } catch (_error) {
      // The parent hook exposes a safe operation error.
    }
  };

  const proofRequired = READY_STATUSES.includes(form.status);

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
        <h6 className="mb-0">{copy.agreement.title}</h6>
        <span className="text-secondary fs-sm">
          {copy.agreement.statuses[agreement?.status] || copy.agreement.statuses.not_configured}
        </span>
      </div>
      <p className="text-secondary fs-sm">{copy.agreement.guidance}</p>
      {error && <Alert variant="danger">{copy.agreement.error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Row className="g-2 align-items-end">
          <Col xs="12" md="3">
            <Form.Group controlId="agreement-status">
              <Form.Label>{copy.agreement.status}</Form.Label>
              <Form.Select name="status" value={form.status} onChange={handleChange}>
                <option value="pending">{copy.agreement.statuses.pending}</option>
                <option value="executed">{copy.agreement.statuses.executed}</option>
                <option value="waived">{copy.agreement.statuses.waived}</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col xs="12" md="3">
            <Form.Group controlId="agreement-version">
              <Form.Label>{copy.agreement.version}</Form.Label>
              <Form.Control
                name="documentVersion"
                value={form.documentVersion}
                onChange={handleChange}
                required={proofRequired}
              />
            </Form.Group>
          </Col>
          <Col xs="12" md="3">
            <Form.Group controlId="agreement-reference">
              <Form.Label>{copy.agreement.reference}</Form.Label>
              <Form.Control
                name="externalReference"
                value={form.externalReference}
                onChange={handleChange}
                required={proofRequired}
              />
            </Form.Group>
          </Col>
          <Col xs="12" md="2">
            <Form.Group controlId="agreement-effective-date">
              <Form.Label>{copy.agreement.effectiveDate}</Form.Label>
              <Form.Control
                type="date"
                name="effectiveAt"
                value={form.effectiveAt}
                onChange={handleChange}
                required={proofRequired}
              />
            </Form.Group>
          </Col>
          <Col xs="12" md="auto">
            <Button type="submit" disabled={submitting}>
              {submitting ? copy.agreement.saving : copy.agreement.save}
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
