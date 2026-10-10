/**
 * @fileoverview Governed customer subscription editing dialog.
 */

import React, {useEffect, useState} from 'react';
import {Alert, Button, Col, Form, Modal, Row} from 'react-bootstrap';
import copy from '../locales/en.json';
import {
  BILLING_MODE_OPTIONS,
  ENTITLEMENT_REASON_OPTIONS,
  LICENSE_OPTIONS,
  SUBSCRIPTION_STATUS_OPTIONS,
  humanizeIdentifier,
  includedSeatsForLicense,
  licenseLabel,
  statusLabel,
} from '../utils/customerAdminConstants';

/**
 * Builds the editable form state from the current subscription.
 *
 * @param {Object|null} subscription - Current subscription
 * @return {Object} Subscription form values
 */
const formFromSubscription = (subscription) => {
  const licenseCode = subscription?.licenseCode || LICENSE_OPTIONS[0];
  return {
    licenseCode,
    status: subscription?.status || 'pending',
    seatLimit: subscription?.seatLimit || includedSeatsForLicense(licenseCode),
    billingMode: subscription?.billingMode || 'commercial',
    reason: subscription ? 'corrected' : 'provisioned',
  };
};

/**
 * Edits the authoritative subscription and entitlement decision.
 *
 * @param {Object} props - Component properties
 * @param {boolean} props.show - Whether the dialog is visible
 * @param {Function} props.onHide - Dialog close callback
 * @param {Function} props.onSave - Subscription save callback
 * @param {Object|null} props.subscription - Current subscription
 * @param {boolean} props.submitting - Whether a request is active
 * @param {Error|null} props.error - Safe request error state
 * @return {JSX.Element} Subscription modal
 */
export default function SubscriptionModal({show, onHide, onSave, subscription, submitting, error}) {
  const [form, setForm] = useState(() => formFromSubscription(subscription));

  useEffect(() => {
    if (show) setForm(formFromSubscription(subscription));
  }, [show, subscription]);

  /**
   * Updates a subscription form field.
   *
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement>} event - Field event
   * @return {void}
   */
  const handleChange = (event) => {
    const {name, value} = event.target;
    setForm((current) => {
      if (name !== 'licenseCode') return {...current, [name]: value};
      const includedSeats = includedSeatsForLicense(value);
      return {
        ...current,
        licenseCode: value,
        seatLimit: Math.max(Number(current.seatLimit) || 0, includedSeats),
      };
    });
  };

  /**
   * Submits a normalized subscription decision.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Form submission
   * @return {void}
   */
  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({...form, seatLimit: Number(form.seatLimit)});
  };

  const minimumSeats = form.billingMode === 'commercial' ?
    includedSeatsForLicense(form.licenseCode) : 1;
  const commercialSeatGuidance = copy.subscription.commercialSeatMinimum
      .replace('{count}', String(minimumSeats));

  return (
    <Modal show={show} onHide={submitting ? undefined : onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton={!submitting}>
          <Modal.Title>{copy.subscription.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-secondary fs-sm">{copy.subscription.guidance}</p>
          {error && <Alert variant="danger">{copy.subscription.error}</Alert>}
          <Row className="g-3">
            <Col xs="12">
              <Form.Group controlId="subscription-license">
                <Form.Label>{copy.subscription.license}</Form.Label>
                <Form.Select name="licenseCode" value={form.licenseCode} onChange={handleChange}>
                  {LICENSE_OPTIONS.map((value) => <option key={value} value={value}>{licenseLabel(value)}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs="12" sm="6">
              <Form.Group controlId="subscription-status">
                <Form.Label>{copy.subscription.status}</Form.Label>
                <Form.Select name="status" value={form.status} onChange={handleChange}>
                  {SUBSCRIPTION_STATUS_OPTIONS.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs="12" sm="6">
              <Form.Group controlId="subscription-seat-limit">
                <Form.Label>{copy.subscription.seatLimit}</Form.Label>
                <Form.Control name="seatLimit" type="number" min={minimumSeats} max="10000" value={form.seatLimit} onChange={handleChange} required />
                {form.billingMode === 'commercial' && (
                  <Form.Text>{commercialSeatGuidance}</Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col xs="12" sm="6">
              <Form.Group controlId="subscription-billing-mode">
                <Form.Label>{copy.subscription.billingMode}</Form.Label>
                <Form.Select name="billingMode" value={form.billingMode} onChange={handleChange}>
                  {BILLING_MODE_OPTIONS.map((value) => <option key={value} value={value}>{humanizeIdentifier(value)}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs="12" sm="6">
              <Form.Group controlId="subscription-reason">
                <Form.Label>{copy.subscription.reason}</Form.Label>
                <Form.Select name="reason" value={form.reason} onChange={handleChange}>
                  {ENTITLEMENT_REASON_OPTIONS.map((value) => <option key={value} value={value}>{humanizeIdentifier(value)}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="outline-secondary" onClick={onHide} disabled={submitting}>{copy.subscription.cancel}</Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? copy.subscription.submitting : copy.subscription.submit}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
