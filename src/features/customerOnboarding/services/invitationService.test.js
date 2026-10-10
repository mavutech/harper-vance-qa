import client from '../../../api/client';
import {
  acceptInvitation,
  acceptInvitationWithSignup,
  previewInvitation,
} from './invitationService';

jest.mock('../../../api/client', () => ({get: jest.fn(), post: jest.fn()}));

describe('invitationService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('previews invitations without placing the token in the path', () => {
    previewInvitation('raw token');
    expect(client.get).toHaveBeenCalledWith('/api/organizations/invitations/preview', {
      params: {token: 'raw token'},
    });
  });

  it('accepts an invitation for an authenticated account', () => {
    acceptInvitation('raw-token');
    expect(client.post).toHaveBeenCalledWith('/api/organizations/accept-invitation', {
      token: 'raw-token',
    });
  });

  it('sends a new-account password only to the signup endpoint', () => {
    acceptInvitationWithSignup('raw-token', 'valid-password');
    expect(client.post).toHaveBeenCalledWith('/api/organizations/invitations/accept-with-signup', {
      token: 'raw-token',
      password: 'valid-password',
    });
  });
});
