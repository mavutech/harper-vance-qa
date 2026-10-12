import React from 'react';
import {render, screen} from '@testing-library/react';
import OnboardingProgress from './OnboardingProgress';

describe('OnboardingProgress', () => {
  it('shows role-safe progress and the next action', () => {
    render(
        <OnboardingProgress onboarding={{
          audience: 'customer_admin',
          status: 'in_progress',
          summary: {
            licenseCode: 'desk_intelligence',
            subscriptionStatus: 'pending',
            paymentStatus: 'checkout_pending',
            accessStatus: 'pending',
          },
          progress: {completed: 3, total: 6, percent: 50},
          steps: [
            {code: 'organization_record', complete: true},
            {code: 'license_assigned', complete: true},
            {code: 'agreement_ready', complete: true},
            {code: 'payment_confirmed', complete: false},
            {code: 'customer_admin_ready', complete: false, invited: true},
            {code: 'product_access_active', complete: false},
          ],
          nextAction: 'accept_administrator_invitation',
        }} />,
    );

    expect(screen.getByRole('progressbar', {name: 'Customer onboarding progress'}))
        .toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText('3 of 6 steps complete')).toBeInTheDocument();
    expect(screen.getByText('Invitation sent')).toBeInTheDocument();
    expect(screen.getByText('Accept the customer administrator invitation.')).toBeInTheDocument();
    expect(screen.getByLabelText('Customer account status')).toBeInTheDocument();
    expect(screen.getByText('Desk Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Checkout pending')).toBeInTheDocument();
  });

  it('shows active payment and dashboard access without provider details', () => {
    render(
        <OnboardingProgress onboarding={{
          audience: 'platform_owner',
          status: 'ready',
          summary: {
            licenseCode: 'entity_core',
            subscriptionStatus: 'active',
            paymentStatus: 'active',
            accessStatus: 'active',
          },
          progress: {completed: 6, total: 6, percent: 100},
          steps: [],
          nextAction: 'complete',
        }} />,
    );

    expect(screen.getByText('Entity Core')).toBeInTheDocument();
    expect(screen.getAllByText('Active')).toHaveLength(2);
    expect(screen.queryByText(/stripe/i)).not.toBeInTheDocument();
  });

  it('fails softly when progress is unavailable', () => {
    render(<OnboardingProgress onboarding={null} />);

    expect(screen.getByText(/Onboarding progress is temporarily unavailable/)).toBeInTheDocument();
  });
});
