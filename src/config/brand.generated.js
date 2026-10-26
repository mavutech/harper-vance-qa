// Generated from backend functions/brand/index.js; do not edit.
/** @fileoverview Public presentation identity; no credentials or operational IDs. */
import snapshot from "./brand.generated.json";
import messages from "./brand.copy.generated.json";
const definition = snapshot.brand;

/**
 * Validates public brand settings before they reach templates or exports.
 * @param {Object} value - Candidate brand definition.
 * @return {Object} Valid definition.
 */
const validateBrand = (value) => {
  for (const key of ["fullName", "shortName", "tagline"]) {
    if (typeof value[key] !== "string" || !value[key].trim() || /[\r\n<>]/.test(value[key])) {
      throw new Error(`Invalid brand ${key}`);
    }
  }
  if (!/^[A-Za-z0-9-]{1,24}$/.test(value.shortName)) throw new Error("Invalid brand shortName");
  for (const url of [value.websiteUrl, ...Object.values(value.links), ...Object.values(value.assets)]) {
    if (url === null) continue;
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error("Invalid brand URL");
  }
  for (const color of Object.values(value.colors)) {
    if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error("Invalid brand color");
  }
  return value;
};

/**
 * @param {*} value - JSON value.
 * @return {*} Recursively immutable value.
 */
const freeze = (value) => {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const brand = freeze(validateBrand(definition));

/**
 * @param {*} value - Plain text.
 * @return {string} Safe HTML/SVG text.
 */
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
}[char]));

/**
 * Resolves brand placeholders in language resources without altering other tokens.
 * @param {*} value - JSON copy or string.
 * @param {Object} [identity=brand] - Validated identity, overridable in verification.
 * @return {*} Copy populated with the current brand.
 */
const brandCopy = (value, identity = brand) => {
  if (typeof value === "string") {
    return value.replace(/\{brand\.(fullName|shortName|tagline|websiteUrl)\}/g,
        (_, key) => identity[key]);
  }
  if (Array.isArray(value)) return value.map((item) => brandCopy(item, identity));
  if (value && typeof value === "object") {
    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, brandCopy(item, identity)]));
  }
  return value;
};

/**
 * Produces a reusable text-based wordmark that automatically follows the identity.
 * @param {boolean} [dark=false] - Light text on a dark background.
 * @param {Object} [identity=brand] - Validated brand definition.
 * @return {string} Accessible SVG markup.
 */
const wordmarkSvg = (dark = false, identity = brand) => {
  const full = escapeHtml(identity.fullName);
  const width = Math.max(420, identity.fullName.length * 17);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 88" role="img" aria-label="${full}"><text x="0" y="36" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="700" fill="${dark ? identity.colors.surface : identity.colors.heading}">${full}</text><text x="0" y="67" font-family="Arial,Helvetica,sans-serif" font-size="17" letter-spacing="2" fill="${dark ? identity.colors.border : identity.colors.accent}">${escapeHtml(identity.tagline)}</text></svg>`;
};

/**
 * Resolves localized presentation text and substitutes plain-text values.
 * Escape the result at HTML or SVG boundaries.
 * @param {string} key - Language resource key.
 * @param {Object} [values={}] - Template values.
 * @return {string} Localized text.
 */
const brandText = (key, values = {}) => {
  if (!Object.hasOwn(messages, key)) throw new Error(`Unknown brand copy: ${key}`);
  return brandCopy(messages[key]).replace(/\{(\w+)\}/g, (token, name) =>
    Object.hasOwn(values, name) ? String(values[name]) : token);
};

/**
 * Creates a compact, name-aware browser icon without embedded historical initials.
 * @param {Object} [identity=brand] - Validated brand definition.
 * @return {string} SVG icon.
 */
const iconSvg = (identity = brand) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="${identity.colors.heading}"/><text x="32" y="40" text-anchor="middle" font-family="Arial,sans-serif" font-size="${Math.min(25, 80 / identity.shortName.length)}" font-weight="700" fill="${identity.colors.surface}">${escapeHtml(identity.shortName)}</text></svg>`;

export {brand, brandCopy, brandText, escapeHtml, validateBrand, wordmarkSvg, iconSvg};
