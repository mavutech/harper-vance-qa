import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import AcceptInvitationPage from './AcceptInvitationPage';
import {signIn} from '../../../redux/authentication/authActions';
import {
  acceptInvitation,
  acceptInvitationWithSignup,
  previewInvitation,
} from '../services/invitationService';

const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
const mockGetIdToken = jest.fn();
const mockRefreshAccess = jest.fn();
let mockAuthState;

jest.mock('react-redux', () => ({useDispatch: jest.fn(), useSelector: jest.fn()}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));
jest.mock('../../../firebase/config', () => ({
  auth: {currentUser: {getIdToken: (...args) => mockGetIdToken(...args)}},
}));
jest.mock('../../../redux/authentication/authActions', () => ({signIn: jest.fn()}));
jest.mock('../../access', () => ({useAccess: () => ({refreshAccess: mockRefreshAccess})}));
jest.mock('../../../utils/analytics', () => ({trackEvent: jest.fn()}));
jest.mock('../services/invitationService', () => ({
  acceptInvitation: jest.fn(),
  acceptInvitationWithSignup: jest.fn(),
  previewInvitation: jest.fn(),
}));

const INVITATION = {
  orgName: 'Alpha Trading',
  invitedEmail: 'analyst@example.com',
  orgRole: 'member',
  expiresAt: '2026-10-16T12:00:00.000Z',
  ssoRequired: false,
};

/**
 * Renders an invitation URL with the configured authentication state.
 *
 * @return {void}
 */
const renderInvitation = () => render(
  <MemoryRouter initialEntries={['/pages/accept-invite?token=raw-token']}>
    <AcceptInvitationPage />
  </MemoryRouter>,
);

/**
 * Renders an incomplete invitation URL without a token.
 *
 * @return {void}
 */
const renderMissingInvitation = () => render(
  <MemoryRouter initialEntries={['/pages/accept-invite']}>
    <AcceptInvitationPage />
  </MemoryRouter>,
);

describe('AcceptInvitationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = {isLoggedIn: false, user: null};
    useDispatch.mockReturnValue(mockDispatch);
    useSelector.mockImplementation((selector) => selector({auth: mockAuthState}));
    previewInvitation.mockResolvedValue(INVITATION);
    acceptInvitation.mockResolvedValue({orgId: 'org-alpha', orgRole: 'member'});
    acceptInvitationWithSignup.mockResolvedValue({orgId: 'org-alpha', orgRole: 'member'});
    signIn.mockReturnValue({type: 'SIGN_IN'});
    mockDispatch.mockResolvedValue({});
    mockGetIdToken.mockResolvedValue('fresh-token');
    mockRefreshAccess.mockResolvedValue({organizations: [{orgId: 'org-alpha'}]});
  });

  it('validates the invitation before showing account creation', async () => {
    renderInvitation();

    expect(await screen.findByText('Alpha Trading')).toBeInTheDocument();
    expect(previewInvitation).toHaveBeenCalledWith('raw-token');
    expect(screen.getByText('analyst@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Create account and join'})).toBeInTheDocument();
  });

  it('creates and signs in a new invited account', async () => {
    renderInvitation();
    await screen.findByText('Alpha Trading');

    fireEvent.change(screen.getByLabelText('Password'), {target: {value: 'valid-password'}});
    fireEvent.change(screen.getByLabelText('Confirm password'), {target: {value: 'valid-password'}});
    fireEvent.click(screen.getByRole('button', {name: 'Create account and join'}));

    await waitFor(() => {
      expect(acceptInvitationWithSignup).toHaveBeenCalledWith('raw-token', 'valid-password');
      expect(signIn).toHaveBeenCalledWith({email: 'analyst@example.com', password: 'valid-password'});
      expect(mockDispatch).toHaveBeenCalledWith({type: 'SIGN_IN'});
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/targets', {replace: true});
    });
  });

  it('accepts for an existing account and refreshes its access token', async () => {
    mockAuthState = {isLoggedIn: true, user: {email: 'analyst@example.com'}};
    renderInvitation();
    await screen.findByText('Alpha Trading');

    fireEvent.click(screen.getByRole('button', {name: 'Accept invitation'}));

    await waitFor(() => {
      expect(acceptInvitation).toHaveBeenCalledWith('raw-token');
      expect(mockGetIdToken).toHaveBeenCalledWith(true);
      expect(mockRefreshAccess).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/targets', {replace: true});
    });
  });

  it('rejects an incomplete invitation link without contacting the API', () => {
    renderMissingInvitation();

    expect(screen.getByText(/invitation link is incomplete/i)).toBeInTheDocument();
    expect(previewInvitation).not.toHaveBeenCalled();
  });

  it('shows an approved message for an expired invitation', async () => {
    previewInvitation.mockRejectedValueOnce({code: 'INVITATION_EXPIRED'});
    renderInvitation();

    expect(await screen.findByText(/invitation has expired/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Create account and join'})).not.toBeInTheDocument();
  });

  it('does not create an account when the passwords do not match', async () => {
    renderInvitation();
    await screen.findByText('Alpha Trading');

    fireEvent.change(screen.getByLabelText('Password'), {target: {value: 'valid-password'} });
    fireEvent.change(screen.getByLabelText('Confirm password'), {target: {value: 'different-password'} });
    fireEvent.click(screen.getByRole('button', {name: 'Create account and join'}));

    expect(await screen.findByText('The passwords do not match.')).toBeInTheDocument();
    expect(acceptInvitationWithSignup).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('keeps an existing user on the invitation when acceptance fails', async () => {
    mockAuthState = {isLoggedIn: true, user: {email: 'analyst@example.com'}};
    acceptInvitation.mockRejectedValueOnce({code: 'SEAT_LIMIT_REACHED'});
    renderInvitation();
    await screen.findByText('Alpha Trading');

    fireEvent.click(screen.getByRole('button', {name: 'Accept invitation'}));

    expect(await screen.findByText(/no available seats/i)).toBeInTheDocument();
    expect(mockGetIdToken).not.toHaveBeenCalled();
    expect(mockRefreshAccess).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
