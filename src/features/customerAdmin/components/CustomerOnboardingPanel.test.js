import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import CustomerOnboardingPanel from './CustomerOnboardingPanel';

const pendingRecord = {
  org: {id: 'org-alpha', status: 'onboarding'},
  subscription: {
    licenseCode: 'desk_intelligence',
    status: 'pending',
    billingMode: 'commercial',
    billingInterval: 'annual',
    seatLimit: 5,
  },
  billing: {status: 'not_configured'},
  agreement: {
    status: 'executed',
    documentVersion: 'MSA-2026-01',
    externalReference: 'docusign-envelope-123',
    effectiveAt: '2026-10-10',
  },
  onboarding: {
    audience: 'platform_owner',
    status: 'in_progress',
    progress: {completed: 3, total: 6, percent: 50},
    steps: [
      {code: 'organization_record', complete: true},
      {code: 'license_assigned', complete: true},
      {code: 'agreement_ready', complete: true},
      {code: 'payment_confirmed', complete: false},
      {code: 'customer_admin_ready', complete: false, invited: true},
      {code: 'product_access_active', complete: false},
    ],
    nextAction: 'confirm_payment',
  },
  members: [],
  pendingInvitations: [{orgRole: 'admin'}],
};

describe('CustomerOnboardingPanel', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {writeText: jest.fn().mockResolvedValue(undefined)},
    });
  });

  it('shows the ordered owner-led onboarding progress', () => {
    render(
        <CustomerOnboardingPanel
          record={pendingRecord}
          submitting={false}
          error={null}
          onCreateCheckout={jest.fn()}
          onSaveAgreement={jest.fn()}
        />,
    );

    expect(screen.getByLabelText('Customer onboarding progress')).toBeInTheDocument();
    expect(screen.getByText('License and seats assigned')).toBeInTheDocument();
    expect(screen.getByText('Customer administrator active')).toBeInTheDocument();
    expect(screen.getByText('Send or complete the secure payment setup.')).toBeInTheDocument();
    expect(screen.getByText('In progress')).toBeInTheDocument();
  });

  it('creates and exposes a secure checkout link for the staged terms', async () => {
    const onCreateCheckout = jest.fn().mockResolvedValue({
      checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test',
    });
    render(
        <CustomerOnboardingPanel
          record={pendingRecord}
          submitting={false}
          error={null}
          onCreateCheckout={onCreateCheckout}
          onSaveAgreement={jest.fn()}
        />,
    );

    fireEvent.change(screen.getByLabelText('Billing contact email'), {
      target: {value: 'BILLING@EXAMPLE.COM'},
    });
    fireEvent.click(screen.getByRole('button', {name: 'Create secure checkout link'}));

    await waitFor(() => expect(onCreateCheckout).toHaveBeenCalledWith({
      licenseCode: 'desk_intelligence',
      billingInterval: 'annual',
      seatQuantity: 5,
      customerEmail: 'billing@example.com',
    }));
    expect(await screen.findByLabelText('Secure customer checkout link'))
        .toHaveValue('https://checkout.stripe.com/c/pay/cs_test');
  });

  it('does not offer Stripe checkout for a complimentary account', () => {
    render(
        <CustomerOnboardingPanel
          record={{
            ...pendingRecord,
            subscription: {...pendingRecord.subscription, billingMode: 'complimentary'},
          }}
          submitting={false}
          error={null}
          onCreateCheckout={jest.fn()}
          onSaveAgreement={jest.fn()}
        />,
    );

    expect(screen.getByText('This account does not require Stripe checkout.')).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Create secure checkout link'})).not.toBeInTheDocument();
  });

  it('keeps Firm-Wide Enterprise on the contract-controlled payment path', () => {
    render(
        <CustomerOnboardingPanel
          record={{
            ...pendingRecord,
            subscription: {
              ...pendingRecord.subscription,
              licenseCode: 'firm_wide_enterprise',
              billingInterval: 'contract',
              seatLimit: 15,
            },
          }}
          submitting={false}
          error={null}
          onCreateCheckout={jest.fn()}
          onSaveAgreement={jest.fn()}
        />,
    );

    expect(screen.getByText(/payment is configured from the executed order/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Create secure checkout link'})).not.toBeInTheDocument();
  });

  it('asks the owner to stage a payment term for a legacy commercial record', () => {
    render(
        <CustomerOnboardingPanel
          record={{
            ...pendingRecord,
            subscription: {...pendingRecord.subscription, billingInterval: null},
          }}
          submitting={false}
          error={null}
          onCreateCheckout={jest.fn()}
          onSaveAgreement={jest.fn()}
        />,
    );

    expect(screen.getByText(/select the approved payment term/i)).toBeInTheDocument();
    expect(screen.queryByText(/Firm-Wide Enterprise payment/i)).not.toBeInTheDocument();
  });

  it('prepares a Stripe customer for contract-controlled billing', async () => {
    const onStageContractBilling = jest.fn().mockResolvedValue({
      customerReference: 'cus_enterprise',
    });
    render(
        <CustomerOnboardingPanel
          record={{
            ...pendingRecord,
            subscription: {
              ...pendingRecord.subscription,
              licenseCode: 'firm_wide_enterprise',
              billingInterval: 'contract',
              seatLimit: 15,
            },
          }}
          submitting={false}
          error={null}
          onCreateCheckout={jest.fn()}
          onStageContractBilling={onStageContractBilling}
          onSaveAgreement={jest.fn()}
        />,
    );

    fireEvent.change(screen.getByLabelText('Billing contact email'), {
      target: {value: 'BILLING@EXAMPLE.COM'},
    });
    fireEvent.click(screen.getByRole('button', {name: 'Prepare contract billing'}));

    await waitFor(() => expect(onStageContractBilling).toHaveBeenCalledWith({
      customerEmail: 'billing@example.com',
    }));
    expect(await screen.findByLabelText('Stripe customer reference')).toHaveValue('cus_enterprise');
  });
});
