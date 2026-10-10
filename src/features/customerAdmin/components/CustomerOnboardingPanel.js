/**
 * @fileoverview Owner-led customer onboarding and billing status panel.
 */

import React, {useState} from 'react';
import {Alert, Button, Form} from 'react-bootstrap';
import copy from '../locales/en.json';
import {humanizeIdentifier, includedSeatsForLicense} from '../utils/customerAdminConstants';
import OnboardingProgress from './OnboardingProgress';
import AgreementStatusForm from './AgreementStatusForm';

/**
 * Displays onboarding progress and creates a secure checkout link for an
 * approved commercial contract.
 *
 * @param {Object} props - Component properties
 * @param {Object} props.record - Selected customer aggregate record
 * @param {boolean} props.submitting - Whether a customer operation is active
 * @param {Error|null} props.error - Safe operation error
 * @param {Function} props.onCreateCheckout - Checkout creation callback
 * @param {Function} props.onSaveAgreement - Agreement save callback
 * @return {JSX.Element} Onboarding panel
 */
export default function CustomerOnboardingPanel({
  record,
  submitting,
  error,
  onCreateCheckout,
  onSaveAgreement,
}) {
  const [billingEmail, setBillingEmail] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const org = record.org || {};
  const subscription = record.subscription || null;
  const billing = record.billing || null;
  const isCommercial = subscription?.billingMode === 'commercial';
  const includedSeats = includedSeatsForLicense(subscription?.licenseCode);
  const agreementReady = ['executed', 'waived'].includes(record.agreement?.status);
  const canCreateCheckout = Boolean(
      isCommercial &&
      agreementReady &&
      subscription?.seatLimit >= includedSeats &&
      billing?.status !== 'active' &&
      org.status !== 'closed',
  );

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
      <OnboardingProgress onboarding={record.onboarding || null} />

      <div className="border-top pt-3 mt-4">
        <AgreementStatusForm
          agreement={record.agreement || null}
          submitting={submitting}
          error={error}
          onSave={onSaveAgreement}
        />
      </div>

      <div className="border-top pt-3 mt-4">
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
        {subscription && isCommercial && !agreementReady && (
          <Alert variant="secondary" className="mb-0">{copy.onboarding.agreementFirst}</Alert>
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
