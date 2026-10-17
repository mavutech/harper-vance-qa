/**
 * @fileoverview RFC 6238 TOTP generation for the protected browser identity.
 */

const crypto = require('crypto');

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

module.exports = {generateTotp};
