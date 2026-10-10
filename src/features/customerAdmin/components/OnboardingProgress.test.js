import React from 'react';
import {render, screen} from '@testing-library/react';
import OnboardingProgress from './OnboardingProgress';

describe('OnboardingProgress', () => {
  it('shows role-safe progress and the next action', () => {
    render(
        <OnboardingProgress onboarding={{
          audience: 'customer_admin',
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
          nextAction: 'accept_administrator_invitation',
        }} />,
    );

    expect(screen.getByRole('progressbar', {name: 'Customer onboarding progress'}))
        .toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText('3 of 6 steps complete')).toBeInTheDocument();
    expect(screen.getByText('Invitation sent')).toBeInTheDocument();
    expect(screen.getByText('Accept the customer administrator invitation.')).toBeInTheDocument();
  });

  it('fails softly when progress is unavailable', () => {
    render(<OnboardingProgress onboarding={null} />);

    expect(screen.getByText(/Onboarding progress is temporarily unavailable/)).toBeInTheDocument();
  });
});
