/**
 * @fileoverview RFC 6238 TOTP generation for the protected browser identity.
 */

const crypto = require('crypto');
const TOTP_PERIOD_MS = 30000;
const TOTP_SETTLE_MS = 3000;
const TOTP_END_MARGIN_MS = 5000;

/**
 * Avoids code reuse and both edges of a time window during hosted verification.
 * This accommodates small runner/server clock differences without changing MFA.
 *
 * @param {number} timestamp - Runner clock in milliseconds
 * @param {number} lastCounter - Last time window used by this worker
 * @param {boolean} forceNextWindow - Whether a new window is required
 * @returns {number} Milliseconds before a safely timed code can be generated
 */
function getTotpDelay(timestamp, lastCounter = -1, forceNextWindow = false) {
  const counter = Math.floor(timestamp / TOTP_PERIOD_MS);
  const age = timestamp % TOTP_PERIOD_MS;
  if (forceNextWindow || counter <= lastCounter || age >= TOTP_PERIOD_MS - TOTP_END_MARGIN_MS) {
    return (Math.max(counter, lastCounter) + 1) * TOTP_PERIOD_MS + TOTP_SETTLE_MS - timestamp;
  }
  return Math.max(TOTP_SETTLE_MS - age, 0);
}

/**
 * Decodes an unpadded Base32 string.
 *
 * @param {string} value - Base32-encoded authenticator secret
 * @returns {Buffer} Decoded bytes
 */
function decodeBase32(value) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const normalized = String(value || '').toUpperCase().replace(/=|\s|-/g, '');
  let bits = '';
  for (const character of normalized) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error('The protected authenticator secret is invalid.');
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) {
    bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * Generates the current six-digit authenticator code.
 *
 * @param {string} secret - Base32 authenticator secret
 * @param {number} [timestamp=Date.now()] - Current time in milliseconds
 * @returns {string} Six-digit code
 */
function generateTotp(secret, timestamp = Date.now()) {
  const counter = Math.floor(timestamp / 30000);
  const message = Buffer.alloc(8);
  message.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  message.writeUInt32BE(counter >>> 0, 4);
  const digest = crypto.createHmac('sha1', decodeBase32(secret)).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  return String(binary).padStart(6, '0');
}

module.exports = {generateTotp, getTotpDelay};
