// Generated from backend functions/brand/index.js; do not edit.
/** @fileoverview Public presentation identity; no credentials or operational IDs. */
const definition = require("../src/config/brand.generated.json").brand;
const messages = require("../src/config/brand.copy.generated.json");

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

module.exports = {brand, brandCopy, brandText, escapeHtml, validateBrand};
