/** @fileoverview Rebuilds the current buyer PDF from shared branding and existing copy. */
const path = require('path');
const fs = require('fs');
const {createHash} = require('crypto');
const {chromium} = require('@playwright/test');
const {brand, brandCopy, escapeHtml} = require('./brand.runtime.generated.cjs');
const copy = brandCopy(require('../src/features/landingPage/locales/buyerOverview.en.json'));
const landing = brandCopy(require('../src/features/landingPage/locales/en.json'));

/** @param {Object} item - Copy section. @returns {string} Escaped section markup. */
const section = (item) => `<section><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p></section>`;
/** @returns {string} Two-page buyer overview from current copy and identity. */
function buyerHtml() {
  const header = `<header><div class="identity"><strong>${escapeHtml(brand.fullName)}</strong><span>${escapeHtml(brand.tagline)}</span></div>
    <div class="monogram">${escapeHtml(brand.shortName)}</div></header><div class="document-label">${escapeHtml(copy.documentTitle)}</div>`;
  /** @param {number} page - Printed page number. @returns {string} Shared brand footer. */
  const footer = (page) => `<footer><div><strong>${escapeHtml(brand.shortName)}</strong><span>${escapeHtml(copy.version)}</span></div>
    <div><a href="${escapeHtml(brand.websiteUrl)}">${escapeHtml(new URL(brand.websiteUrl).host)}</a><span class="page-number">${page} / 2</span></div></footer>`;
  const plans = landing.pricing.plans.map((plan) => `<tr><th>${escapeHtml(plan.name)}</th><td>${escapeHtml(
    `${plan.price} ${plan.period}. ${plan.annual}. ${plan.features.join('; ')}.`)}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(brand.fullName)} — ${escapeHtml(copy.documentTitle)}</title><style>
    @page {size:A4; margin:15mm 17mm;} * {box-sizing:border-box;} body {margin:0; font:10pt/1.4 Arial,sans-serif; color:${brand.colors.heading};}
    article {min-height:266mm;display:flex;flex-direction:column;} article+article {break-before:page;} .content {display:flow-root;}
    header {display:flex;align-items:center;gap:20px;background:${brand.colors.heading};color:${brand.colors.surface};border-bottom:4px solid ${brand.colors.accent};padding:18px 22px;}
    .identity {flex:1;min-width:0;} header strong {display:block;font-size:19pt;line-height:1.15;overflow-wrap:anywhere;}
    header span {display:block;font-size:9pt;color:${brand.colors.border};margin-top:7px;}
    .monogram {padding:11px 10px;background:${brand.colors.accent};font-size:17pt;font-weight:bold;max-width:28%;overflow-wrap:anywhere;text-align:center;}
    .document-label {font-size:8pt;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${brand.colors.accent};margin:16px 0 10px;}
    h1 {font-size:25pt;line-height:1.15;margin:0 0 8px;} h2 {font-size:16pt;margin:18px 0 8px;} h3 {font-size:11.5pt;margin:12px 0 4px;}
    p {margin:0 0 10px;} section {break-inside:avoid;} .intro {font-size:11pt;color:${brand.colors.text};}
    table {width:100%;border-collapse:collapse;margin:14px 0;font-size:8.5pt;line-height:1.35;}
    th,td {background:${brand.colors.page};padding:9px;text-align:left;vertical-align:top;border-bottom:2px solid ${brand.colors.surface};}
    th {width:24%;color:${brand.colors.accent};} .purchase section p,.purchase .notice {font-size:9pt;} .purchase h3 {margin-top:11px;}
    .notice {padding:12px;background:${brand.colors.page};border-left:3px solid ${brand.colors.accent};margin:14px 0;}
    a {color:${brand.colors.accent};overflow-wrap:anywhere;} footer {display:flex;justify-content:space-between;gap:16px;border-top:1px solid ${brand.colors.border};padding-top:12px;margin-top:auto;font-size:8pt;color:${brand.colors.muted};}
    footer div {display:flex;align-items:center;gap:12px;min-width:0;} footer strong {color:${brand.colors.heading};font-size:12pt;}
    footer a {color:${brand.colors.muted};text-decoration:none;} .page-number {white-space:nowrap;color:${brand.colors.accent};font-weight:bold;}
  </style></head><body><article>${header}<div class="content"><h1>${escapeHtml(copy.title)}</h1><p class="intro">${escapeHtml(copy.subtitle)}</p><p>${escapeHtml(copy.intro)}</p>
  ${copy.offer.map(section).join('')}<h2>${escapeHtml(copy.deliveryTitle)}</h2><p>${escapeHtml(copy.delivery)}</p>
  <h2>${escapeHtml(copy.sampleTitle)}</h2><p>${escapeHtml(copy.sampleText)}</p><p><a href="${escapeHtml(copy.sampleUrl)}">${escapeHtml(copy.sampleLink)}</a></p>
  <div class="notice">${escapeHtml(copy.boundary)}</div></div>${footer(1)}</article>
  <article class="purchase">${header}<div class="content"><h1>${escapeHtml(copy.purchaseTitle)}</h1><p>${escapeHtml(copy.purchaseIntro)}</p><table>${plans}</table>${copy.steps.map(section).join('')}
  <div class="notice">${escapeHtml(copy.terms)}</div><p><a href="${escapeHtml(copy.purchaseUrl)}">${escapeHtml(copy.purchaseLink)}</a></p></div>${footer(2)}</article></body></html>`;
}
/** @returns {Promise<void>} Writes current buyer material, preserving historical files. */
async function render() {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage();
    await page.setContent(buyerHtml());
    const destination = path.join(__dirname, '../public/reports/buyer-overview.pdf');
    await page.pdf({path:destination,format:'A4',printBackground:true,preferCSSPageSize:true});
    const root = path.resolve(__dirname, '..');
    const inputs = ['src/config/brand.generated.json', 'src/config/brand.copy.generated.json', 'scripts/brand.runtime.generated.cjs',
      'src/features/landingPage/locales/buyerOverview.en.json', 'src/features/landingPage/locales/en.json', 'scripts/renderBuyerOverview.js',
      'public/reports/buyer-overview.pdf'];
    const fingerprints = Object.fromEntries(inputs.map((file) => [file,
      createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]));
    fs.writeFileSync(path.join(root, 'src/config/buyer-overview.generated.json'),
      JSON.stringify(fingerprints, null, 2) + '\n');
    console.log('Current buyer overview generated.');
  } finally { await browser.close(); }
}
if (require.main === module) render().catch((error) => { console.error(error.message); process.exitCode=1; });
module.exports = {buyerHtml};
