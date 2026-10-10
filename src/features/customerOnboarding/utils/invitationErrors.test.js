import {invitationErrorMessage} from './invitationErrors';

describe('invitationErrorMessage', () => {
  it('maps known access failures to safe customer copy', () => {
    expect(invitationErrorMessage({code: 'SEAT_LIMIT_REACHED'})).toMatch(/no available seats/i);
  });

  it('does not expose unknown backend messages', () => {
    expect(invitationErrorMessage({code: 'UNKNOWN', message: 'sensitive detail'}))
        .not.toContain('sensitive detail');
  });
});
