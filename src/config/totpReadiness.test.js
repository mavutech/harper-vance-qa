const {generateTotp, getTotpDelay} = require('../../e2e/support/totp');

describe('protected browser authenticator timing', () => {
  it('matches the six-digit suffix of the RFC 6238 SHA-1 test vector', () => {
    expect(generateTotp('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 59000)).toBe('287082');
  });

  it.each([
    [60000, -1, false, 3000],
    [60500, -1, false, 2500],
    [64000, -1, false, 0],
    [86000, -1, false, 7000],
    [64000, 2, false, 29000],
    [64000, -1, true, 29000],
  ])('waits safely for clock %i, previous window %i, forced %s', (clock, previous, forced, delay) => {
    expect(getTotpDelay(clock, previous, forced)).toBe(delay);
  });
});
