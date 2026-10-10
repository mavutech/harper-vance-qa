import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import CustomerOnboardingPanel from './CustomerOnboardingPanel';

const pendingRecord = {
  org: {id: 'org-alpha', status: 'onboarding'},
  subscription: {
    licenseCode: 'desk_intelligence',
    status: 'pending',
    billingMode: 'commercial',
    seatLimit: 5,
  },
  billing: {status: 'not_configured'},
  onboarding: {
    audience: 'platform_owner',
    status: 'in_progress',
    progress: {completed: 2, total: 5, percent: 40},
    steps: [
      {code: 'organization_record', complete: true},
      {code: 'license_assigned', complete: true},
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
        />,
    );

    fireEvent.change(screen.getByLabelText('Billing contact email'), {
      target: {value: 'BILLING@EXAMPLE.COM'},
    });
    fireEvent.click(screen.getByRole('button', {name: 'Create secure checkout link'}));

    await waitFor(() => expect(onCreateCheckout).toHaveBeenCalledWith({
      licenseCode: 'desk_intelligence',
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
        />,
    );

    expect(screen.getByText('This account does not require Stripe checkout.')).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Create secure checkout link'})).not.toBeInTheDocument();
  });
});
