const {test, expect} = require('@playwright/test');
const {openRoute} = require('./support/navigation');

const OWNER_EMAIL = 'platform-owner.e2e@example.com';
const NEW_ADMIN_EMAIL = 'new-admin.e2e@example.com';
const SECOND_USER_EMAIL = 'second-user.e2e@example.com';
const ORGANIZATION_NAME = 'Northstar Quantitative E2E';
const ORGANIZATION_SLUG = 'northstar-quantitative-e2e';
const AGREEMENT_DATE = '2026-10-13';
const OWNER_PASSWORD_KEY = 'E2E_OWNER_PASSWORD';
const NEW_CUSTOMER_PASSWORD_KEY = 'E2E_NEW_CUSTOMER_PASSWORD';

let customerOrgId = '';
let invitationUrl = '';

/**
 * Returns a protected run-scoped emulator credential.
 *
 * @param {string} key - Environment variable name
 * @returns {string} Protected password
 */
function requireCredential(key) {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required for enterprise browser tests.`);
  return value;
}

/**
 * Signs in through the public form and waits for the requested route.
 *
 * @param {import('@playwright/test').Page} page - Browser page
 * @param {string} email - Emulator-only test identity
 * @param {string} password - Run-scoped password
 * @param {RegExp} destination - Expected post-login URL
 * @returns {Promise<void>}
 */
async function signIn(page, email, password, destination) {
  await openRoute(page, '/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', {name: 'Sign In'}).click();
  await expect(page).toHaveURL(destination);
}

/**
 * Opens an organization license dialog and applies a non-commercial active
 * license so no external payment provider is involved in this phase.
 *
 * @param {import('@playwright/test').Page} page - Platform-owner page
 * @returns {Promise<void>}
 */
async function activateComplimentaryEntityLicense(page) {
  await page.getByRole('button', {name: 'Manage license'}).click();
  const dialog = page.locator('.modal-content').filter({hasText: 'Manage customer license'});
  await dialog.getByLabel('License').selectOption('entity_core');
  await dialog.getByLabel('Status').selectOption('active');
  await dialog.getByLabel('Billing mode').selectOption('complimentary');
  await dialog.getByRole('button', {name: 'Save license'}).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Entity Core', {exact: true}).first()).toBeVisible();
}

/**
 * Records a fully traceable emulator-only agreement decision.
 *
 * @param {import('@playwright/test').Page} page - Platform-owner page
 * @returns {Promise<void>}
 */
async function recordAgreement(page) {
  await page.getByLabel('Agreement status').selectOption('executed');
  await page.getByLabel('Document version').fill('e2e-v1');
  await page.getByLabel('External reference').fill('E2E-ORDER-001');
  await page.getByLabel('Effective date').fill(AGREEMENT_DATE);
  await page.getByRole('button', {name: 'Save agreement'}).click();
  await expect(page.getByText('Executed', {exact: true}).first()).toBeVisible();
}

test.describe.serial('@enterprise customer lifecycle', () => {
  test('platform owner creates and configures an isolated customer', async ({page}) => {
    await signIn(
        page,
        OWNER_EMAIL,
        requireCredential(OWNER_PASSWORD_KEY),
        /\/dashboard\/sona-targets$/,
    );
    await openRoute(page, '/admin/organizations');
    await expect(page.getByRole('heading', {name: 'Customer Organizations'})).toBeVisible();

    await page.getByRole('button', {name: 'Add customer'}).click();
    const dialog = page.locator('.modal-content').filter({hasText: 'Add customer organization'});
    await dialog.getByLabel('Organization name').fill(ORGANIZATION_NAME);
    await dialog.getByLabel('Organization slug').fill(ORGANIZATION_SLUG);
    await dialog.getByLabel('Approved email domains').fill('example.com');
    const createResponse = page.waitForResponse((response) => (
      response.request().method() === 'POST' && /\/api\/organizations$/.test(response.url())
    ));
    await dialog.getByRole('button', {name: 'Create organization'}).click();
    const body = await (await createResponse).json();
    customerOrgId = body?.data?.orgId || '';
    expect(customerOrgId).toMatch(/^org_[a-z0-9]+$/);
    await expect(page.getByText(ORGANIZATION_NAME, {exact: true}).first()).toBeVisible();

    await activateComplimentaryEntityLicense(page);
    await recordAgreement(page);
    await expect(page.getByRole('progressbar', {name: 'Customer onboarding progress'}))
        .toHaveAttribute('aria-valuenow', '83');

    await page.getByLabel('Email address').last().fill(NEW_ADMIN_EMAIL);
    await page.getByLabel('Organization role').selectOption('admin');
    await page.getByRole('button', {name: 'Send invitation'}).click();
    const invitationInput = page.getByLabel('Invitation fallback link');
    await expect(invitationInput).toBeVisible();
    invitationUrl = await invitationInput.inputValue();
    expect(invitationUrl).toContain('/pages/accept-invite?token=');
  });

  test('new customer administrator accepts the invitation and receives one licensed seat', async ({page}) => {
    expect(invitationUrl).toContain('/pages/accept-invite?token=');
    await page.goto(invitationUrl, {waitUntil: 'domcontentloaded'});
    await expect(page.getByRole('heading', {name: ORGANIZATION_NAME})).toBeVisible();
    await page.getByLabel('Password', {exact: true}).fill(requireCredential(NEW_CUSTOMER_PASSWORD_KEY));
    await page.getByLabel('Confirm password').fill(requireCredential(NEW_CUSTOMER_PASSWORD_KEY));
    await page.getByRole('button', {name: 'Create account and join'}).click();
    await expect(page).toHaveURL(/\/dashboard\/sona-targets$/);
    await expect(page.getByRole('heading', {name: "NQ Today's Targets"})).toBeVisible();

    await openRoute(page, '/organization/team');
    await expect(page.getByRole('heading', {name: 'Team & Seats'})).toBeVisible();
    await expect(page.getByText('1 of 1', {exact: true})).toBeVisible();
    await expect(page.getByRole('progressbar', {name: 'Customer onboarding progress'}))
        .toHaveAttribute('aria-valuenow', '100');
  });

  test('seat enforcement and platform boundary remain visible in the browser', async ({page}) => {
    await signIn(
        page,
        NEW_ADMIN_EMAIL,
        requireCredential(NEW_CUSTOMER_PASSWORD_KEY),
        /\/dashboard\/sona-targets$/,
    );
    await openRoute(page, '/organization/team');
    await page.getByLabel('Email address').fill(SECOND_USER_EMAIL);
    await page.getByLabel('Organization role').selectOption('member');
    await page.getByRole('button', {name: 'Send invitation'}).click();
    await expect(page.getByText('The customer user change could not be completed.')).toBeVisible();
    await expect(page.getByText('0', {exact: true}).last()).toBeVisible();

    await openRoute(page, '/admin/organizations');
    await expect(page).toHaveURL(/\/pages\/error-505$/);
    await expect(page.getByRole('heading', {name: 'Forbidden'})).toBeVisible();
    expect(customerOrgId).toMatch(/^org_/);
  });
});
