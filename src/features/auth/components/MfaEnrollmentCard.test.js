import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';

import {trackEvent} from '../../../utils/analytics';
import {
  beginTotpEnrollment,
  completeTotpEnrollment,
  getMfaStatus,
} from '../services/mfaService';
import MfaEnrollmentCard from './MfaEnrollmentCard';

jest.mock('../../../utils/analytics', () => ({trackEvent: jest.fn()}));
jest.mock('../services/mfaService', () => ({
  beginTotpEnrollment: jest.fn(),
  completeTotpEnrollment: jest.fn(),
  getMfaStatus: jest.fn(),
}));

describe('MfaEnrollmentCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getMfaStatus.mockReturnValue({enabled: false, factors: []});
  });

  it('shows the protected status when TOTP is already enrolled', () => {
    getMfaStatus.mockReturnValue({enabled: true, factors: [{factorId: 'totp'}]});

    render(<MfaEnrollmentCard />);

    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Your authenticator is protecting this account.')).toBeInTheDocument();
  });

  it('starts enrollment and displays the temporary setup details', async () => {
    beginTotpEnrollment.mockResolvedValue({
      secret: {id: 'temporary'},
      secretKey: 'TEMPORARY-KEY',
      authenticatorUri: 'otpauth://totp/example',
    });

    render(<MfaEnrollmentCard />);
    fireEvent.click(screen.getByRole('button', {name: 'Set up authenticator'}));

    expect(await screen.findByDisplayValue('TEMPORARY-KEY')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Open authenticator app'})).toHaveAttribute(
      'href',
      'otpauth://totp/example',
    );
    expect(trackEvent).toHaveBeenCalledWith('profile_mfa_enrollment_started');
  });

  it('submits a normalized six-digit code and clears the secret', async () => {
    const secret = {id: 'temporary'};
    beginTotpEnrollment.mockResolvedValue({
      secret,
      secretKey: 'TEMPORARY-KEY',
      authenticatorUri: 'otpauth://totp/example',
    });
    completeTotpEnrollment.mockResolvedValue(undefined);

    render(<MfaEnrollmentCard />);
    fireEvent.click(screen.getByRole('button', {name: 'Set up authenticator'}));
    const input = await screen.findByLabelText('Six-digit code');
    fireEvent.change(input, {target: {value: '12a3456'}});
    fireEvent.click(screen.getByRole('button', {name: 'Verify and enable'}));

    await waitFor(() => expect(completeTotpEnrollment).toHaveBeenCalledWith(secret, '123456'));
    expect(await screen.findByText(/Two-step verification is enabled/)).toBeInTheDocument();
    expect(screen.queryByDisplayValue('TEMPORARY-KEY')).not.toBeInTheDocument();
    expect(trackEvent).toHaveBeenCalledWith('profile_mfa_enrollment_completed');
  });

  it('shows a safe error when setup cannot begin', async () => {
    beginTotpEnrollment.mockRejectedValue(new Error('Sign in again before retrying.'));

    render(<MfaEnrollmentCard />);
    fireEvent.click(screen.getByRole('button', {name: 'Set up authenticator'}));

    expect(await screen.findByText('Sign in again before retrying.')).toBeInTheDocument();
    expect(trackEvent).toHaveBeenCalledWith('profile_mfa_enrollment_failed', {stage: 'start'});
  });
});
