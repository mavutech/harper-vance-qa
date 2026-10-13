import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Login, {getPostLoginDestination} from './Login';
import { signIn, completeMfaSignIn, clearErrors } from '../redux/authentication/authActions';
import {trackEvent} from '../utils/analytics';

const mockNavigate = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../redux/authentication/authActions', () => ({
  signIn: jest.fn(),
  completeMfaSignIn: jest.fn(),
  clearErrors: jest.fn(() => ({ type: 'CLEAR_ERRORS' })),
}));

jest.mock('../utils/analytics', () => ({
  trackEvent: jest.fn(),
}));

jest.mock('../config/seoConfig', () => ({
  updatePageSEO: jest.fn(),
}));

describe('Login MFA challenge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSelector.mockImplementation((selector) => selector({
      auth: { loading: false, error: null, isLoggedIn: false },
    }));
  });

  it('shows a visible secondary action for returning to sign in', async () => {
    const challenge = { resolver: {}, factor: {} };
    const signInAction = { type: 'SIGN_IN' };
    const dispatch = jest.fn().mockRejectedValueOnce({ mfaChallenge: challenge });
    useDispatch.mockReturnValue(dispatch);
    signIn.mockReturnValue(signInAction);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'owner@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'valid-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/six-digit authenticator code/i)).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: 'Back to sign in' });
    expect(backButton).toBeVisible();
    expect(backButton).toHaveClass('btn-secondary');
  });

  it('normalizes and submits a six-digit authenticator code', async () => {
    const challenge = {resolver: {}, enrollmentId: 'totp-factor'};
    const signInAction = {type: 'SIGN_IN'};
    const completeAction = {type: 'COMPLETE_MFA'};
    const dispatch = jest.fn()
        .mockRejectedValueOnce({mfaChallenge: challenge})
        .mockResolvedValueOnce({});
    useDispatch.mockReturnValue(dispatch);
    signIn.mockReturnValue(signInAction);
    completeMfaSignIn.mockReturnValue(completeAction);

    render(<MemoryRouter><Login /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/email address/i), {target: {value: 'owner@example.com'}});
    fireEvent.change(screen.getByLabelText(/password/i), {target: {value: 'valid-password'}});
    fireEvent.click(screen.getByRole('button', {name: /sign in/i}));

    const codeInput = await screen.findByLabelText(/six-digit authenticator code/i);
    fireEvent.change(codeInput, {target: {value: '12a34567'}});
    expect(codeInput).toHaveValue('123456');
    fireEvent.click(screen.getByRole('button', {name: 'Verify and sign in'}));

    await waitFor(() => {
      expect(completeMfaSignIn).toHaveBeenCalledWith(challenge, '123456');
      expect(dispatch).toHaveBeenLastCalledWith(completeAction);
      expect(trackEvent).toHaveBeenCalledWith('login_mfa_challenge_completed');
    });
  });

  it('keeps the challenge available after an invalid authenticator code', async () => {
    const challenge = {resolver: {}, enrollmentId: 'totp-factor'};
    const dispatch = jest.fn()
        .mockRejectedValueOnce({mfaChallenge: challenge})
        .mockRejectedValueOnce(new Error('invalid code'));
    useDispatch.mockReturnValue(dispatch);
    signIn.mockReturnValue({type: 'SIGN_IN'});
    completeMfaSignIn.mockReturnValue({type: 'COMPLETE_MFA'});

    render(<MemoryRouter><Login /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/email address/i), {target: {value: 'owner@example.com'}});
    fireEvent.change(screen.getByLabelText(/password/i), {target: {value: 'valid-password'}});
    fireEvent.click(screen.getByRole('button', {name: /sign in/i}));
    const codeInput = await screen.findByLabelText(/six-digit authenticator code/i);
    fireEvent.change(codeInput, {target: {value: '123456'}});
    fireEvent.click(screen.getByRole('button', {name: 'Verify and sign in'}));

    await waitFor(() => expect(trackEvent).toHaveBeenCalledWith('login_mfa_challenge_failed'));
    expect(screen.getByLabelText(/six-digit authenticator code/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('clears the temporary challenge when returning to password sign in', async () => {
    const challenge = {resolver: {}, enrollmentId: 'totp-factor'};
    const dispatch = jest.fn().mockRejectedValueOnce({mfaChallenge: challenge});
    useDispatch.mockReturnValue(dispatch);
    signIn.mockReturnValue({type: 'SIGN_IN'});

    render(<MemoryRouter><Login /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/email address/i), {target: {value: 'owner@example.com'}});
    fireEvent.change(screen.getByLabelText(/password/i), {target: {value: 'valid-password'}});
    fireEvent.click(screen.getByRole('button', {name: /sign in/i}));
    await screen.findByLabelText(/six-digit authenticator code/i);
    fireEvent.click(screen.getByRole('button', {name: 'Back to sign in'}));

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/six-digit authenticator code/i)).not.toBeInTheDocument();
    expect(clearErrors).toHaveBeenCalled();
  });
});

describe('getPostLoginDestination', () => {
  it('returns customers to a pending invitation after sign in', () => {
    expect(getPostLoginDestination({
      from: '/pages/accept-invite?token=safe-token',
    })).toBe('/pages/accept-invite?token=safe-token');
  });

  it('rejects external redirects', () => {
    expect(getPostLoginDestination({from: '//malicious.example'}))
        .toBe('/dashboard/sona-targets');
  });
});
