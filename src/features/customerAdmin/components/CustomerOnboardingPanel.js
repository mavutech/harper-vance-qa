/**
 * @fileoverview Owner-led customer onboarding and billing status panel.
 */

import React, {useMemo, useState} from 'react';
import {Alert, Badge, Button, Form} from 'react-bootstrap';
import copy from '../locales/en.json';
import {humanizeIdentifier} from '../utils/customerAdminConstants';

/**
 * Displays onboarding progress and creates a secure checkout link for an
 * approved commercial contract.
 *
 * @param {Object} props - Component properties
 * @param {Object} props.record - Selected customer aggregate record
 * @param {boolean} props.submitting - Whether a customer operation is active
 * @param {Error|null} props.error - Safe operation error
 * @param {Function} props.onCreateCheckout - Checkout creation callback
 * @return {JSX.Element} Onboarding panel
 */
export default function CustomerOnboardingPanel({
  record,
  submitting,
  error,
  onCreateCheckout,
}) {
  const [billingEmail, setBillingEmail] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const org = record.org || {};
  const subscription = record.subscription || null;
  const billing = record.billing || null;
  const members = Array.isArray(record.members) ? record.members : [];
  const invitations = Array.isArray(record.pendingInvitations) ? record.pendingInvitations : [];
  const isCommercial = subscription?.billingMode === 'commercial';
  const paymentReady = Boolean(!isCommercial || billing?.status === 'active');
  const customerAdminReady = [...members, ...invitations]
      .some((item) => ['owner', 'admin'].includes(item.orgRole));
  const accessReady = org.status === 'active' && subscription?.status === 'active';
  const canCreateCheckout = Boolean(
      isCommercial &&
      subscription?.seatLimit >= 25 &&
      billing?.status !== 'active' &&
      org.status !== 'closed',
  );

  const steps = useMemo(() => [
    {label: copy.onboarding.recordStep, complete: Boolean(org.id)},
    {label: copy.onboarding.contractStep, complete: Boolean(subscription)},
    {label: copy.onboarding.paymentStep, complete: paymentReady},
    {label: copy.onboarding.adminStep, complete: customerAdminReady},
    {label: copy.onboarding.accessStep, complete: accessReady},
  ], [accessReady, customerAdminReady, org.id, paymentReady, subscription]);

  /**
   * Creates a Stripe-hosted checkout link for the staged contract.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Form submission
   * @return {Promise<void>}
   */
  const handleCheckout = async (event) => {
    event.preventDefault();
    try {
      const result = await onCreateCheckout({
        licenseCode: subscription.licenseCode,
        seatQuantity: subscription.seatLimit,
        customerEmail: billingEmail.trim().toLowerCase(),
      });
      setCheckoutUrl(result.checkoutUrl);
      setCopied(false);
    } catch (_error) {
      // The parent hook exposes a safe operation error.
    }
  };

  /**
   * Copies the one-time hosted checkout link.
   *
   * @return {Promise<void>}
   */
  const copyCheckoutLink = async () => {
    await navigator.clipboard.writeText(checkoutUrl);
    setCopied(true);
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <h6 className="mb-1">{copy.onboarding.title}</h6>
          <p className="text-secondary fs-sm mb-0">{copy.onboarding.subtitle}</p>
        </div>
        <Badge bg={accessReady ? 'success' : 'warning'} text={accessReady ? undefined : 'dark'}>
          {accessReady ? copy.onboarding.ready : copy.onboarding.inProgress}
        </Badge>
      </div>

      <div className="d-flex flex-column gap-2 mb-4" aria-label={copy.onboarding.progressLabel}>
        {steps.map((step) => (
          <div className="d-flex align-items-center gap-2" key={step.label}>
            <i
              className={step.complete ? 'ri-checkbox-circle-fill text-success' : 'ri-time-line text-secondary'}
              aria-hidden="true"
            ></i>
            <span className={step.complete ? '' : 'text-secondary'}>{step.label}</span>
          </div>
        ))}
      </div>

      <div className="border-top pt-3">
        <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
          <h6 className="mb-0">{copy.onboarding.billingTitle}</h6>
          <span className="text-secondary fs-sm">
            {billing ? humanizeIdentifier(billing.status) : copy.onboarding.notConfigured}
          </span>
        </div>
        {error && <Alert variant="danger">{copy.onboarding.billingError}</Alert>}
        {!subscription && <Alert variant="secondary">{copy.onboarding.assignLicenseFirst}</Alert>}
        {subscription && !isCommercial && (
          <Alert variant="secondary" className="mb-0">{copy.onboarding.nonCommercial}</Alert>
        )}
        {canCreateCheckout && (
          <Form className="row g-2 align-items-end" onSubmit={handleCheckout}>
            <Form.Group className="col-md" controlId="customer-billing-email">
              <Form.Label>{copy.onboarding.billingEmail}</Form.Label>
              <Form.Control
                type="email"
                value={billingEmail}
                onChange={(event) => setBillingEmail(event.target.value)}
                required
              />
              <Form.Text>{copy.onboarding.checkoutGuidance}</Form.Text>
            </Form.Group>
            <div className="col-md-auto">
              <Button type="submit" disabled={submitting}>
                {submitting ? copy.onboarding.creatingCheckout : copy.onboarding.createCheckout}
              </Button>
            </div>
          </Form>
        )}
        {checkoutUrl && (
          <Alert variant="warning" className="mt-3 mb-0">
            <p className="mb-2">{copy.onboarding.checkoutReady}</p>
            <div className="input-group">
              <Form.Control value={checkoutUrl} readOnly aria-label={copy.onboarding.checkoutLinkLabel} />
              <Button variant="outline-dark" onClick={copyCheckoutLink}>
                {copied ? copy.onboarding.copied : copy.onboarding.copyCheckout}
              </Button>
            </div>
          </Alert>
        )}
      </div>
    </div>
  );
}
