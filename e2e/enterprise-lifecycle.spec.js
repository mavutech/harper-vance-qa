const {test, expect} = require('@playwright/test');
const {openRoute} = require('./support/navigation');

const OWNER_EMAIL = 'platform-owner.e2e@example.com';
const EXISTING_CUSTOMER_EMAIL = 'existing-customer.e2e@example.com';
const NEW_ADMIN_EMAIL = 'new-admin.e2e@example.com';
const SECOND_USER_EMAIL = 'second-user.e2e@example.com';
const MEMBER_EMAIL = 'customer-member.e2e@example.com';
const ORGANIZATION_NAME = 'Northstar Quantitative E2E';
const ORGANIZATION_SLUG = 'northstar-quantitative-e2e';
const DESK_ORGANIZATION_NAME = 'Meridian Desk E2E';
const DESK_ORGANIZATION_SLUG = 'meridian-desk-e2e';
const FIRM_ORGANIZATION_NAME = 'Atlas Firm E2E';
const FIRM_ORGANIZATION_SLUG = 'atlas-firm-e2e';
const AGREEMENT_DATE = '2026-10-13';
const OWNER_PASSWORD_KEY = 'E2E_OWNER_PASSWORD';
const EXISTING_CUSTOMER_PASSWORD_KEY = 'E2E_EXISTING_CUSTOMER_PASSWORD';
const NEW_CUSTOMER_PASSWORD_KEY = 'E2E_NEW_CUSTOMER_PASSWORD';
const MEMBER_PASSWORD_KEY = 'E2E_MEMBER_PASSWORD';

let customerOrgId = '';
let invitationUrl = '';
let deskOrgId = '';
let existingInvitationUrl = '';
let memberInvitationUrl = '';

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
async function activateComplimentaryLicense(page, licenseCode, expectedLabel) {
  await page.getByRole('button', {name: 'Manage license'}).click();
  const dialog = page.locator('.modal-content').filter({hasText: 'Manage customer license'});
  await dialog.getByLabel('License').selectOption(licenseCode);
  await dialog.getByLabel('Status').selectOption('active');
  await dialog.getByLabel('Billing mode').selectOption('complimentary');
  await dialog.getByRole('button', {name: 'Save license'}).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(expectedLabel, {exact: true}).first()).toBeVisible();
}

/**
 * Records a fully traceable emulator-only agreement decision.
 *
 * @param {import('@playwright/test').Page} page - Platform-owner page
 * @returns {Promise<void>}
 */
async function recordAgreement(page, externalReference) {
  await page.getByLabel('Agreement status').selectOption('executed');
  await page.getByLabel('Document version').fill('e2e-v1');
  await page.getByLabel('External reference').fill(externalReference);
  await page.getByLabel('Effective date').fill(AGREEMENT_DATE);
  await page.getByRole('button', {name: 'Save agreement'}).click();
  await expect(page.getByText('Executed', {exact: true}).first()).toBeVisible();
}

/**
 * Creates one staged organization and returns its server-generated ID.
 *
 * @param {import('@playwright/test').Page} page - Platform-owner page
 * @param {string} name - Organization name
 * @param {string} slug - Organization slug
 * @returns {Promise<string>} Created organization ID
 */
async function createOrganization(page, name, slug) {
  await page.getByRole('button', {name: 'Add customer'}).click();
  const dialog = page.locator('.modal-content').filter({hasText: 'Add customer organization'});
  await dialog.getByLabel('Organization name').fill(name);
  await dialog.getByLabel('Organization slug').fill(slug);
  await dialog.getByLabel('Approved email domains').fill('example.com');
  const createResponse = page.waitForResponse((response) => (
    response.request().method() === 'POST' && /\/api\/organizations$/.test(response.url())
  ));
  await dialog.getByRole('button', {name: 'Create organization'}).click();
  const body = await (await createResponse).json();
  const orgId = body?.data?.orgId || '';
  expect(orgId).toMatch(/^org_[a-z0-9]+$/);
  await expect(page.getByText(name, {exact: true}).first()).toBeVisible();
  return orgId;
}

/**
 * Creates an organization invitation and returns its one-time browser URL.
 *
 * @param {import('@playwright/test').Page} page - Authorized team page
 * @param {string} email - Invited address
 * @param {string} role - Organization role
 * @returns {Promise<string>} One-time invitation URL
 */
async function inviteUser(page, email, role) {
  await page.getByLabel('Email address').last().fill(email);
  await page.getByLabel('Organization role').selectOption(role);
  await page.getByRole('button', {name: 'Send invitation'}).click();
  const invitationInput = page.getByLabel('Invitation fallback link');
  await expect(invitationInput).toBeVisible();
  const url = await invitationInput.inputValue();
  expect(url).toContain('/pages/accept-invite?token=');
  return url;
}

/**
 * Finds and opens one customer record from the platform-owner console.
 *
 * @param {import('@playwright/test').Page} page - Platform-owner page
 * @param {string} organizationName - Exact organization name
 * @returns {Promise<void>}
 */
async function reviewOrganization(page, organizationName) {
  await page.getByLabel('Search customers').fill(organizationName);
  await page.getByRole('button', {name: 'Search', exact: true}).click();
  const row = page.getByRole('row').filter({hasText: organizationName});
  await expect(row).toBeVisible();
  await row.getByRole('button', {name: 'Review'}).click();
  await expect(page.getByRole('heading', {name: organizationName})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Manage license'})).toBeVisible();
}

/**
 * Changes only the selected organization's subscription lifecycle status.
 *
 * @param {import('@playwright/test').Page} page - Platform-owner page
 * @param {'active'|'suspended'|'canceled'} status - Next subscription status
 * @returns {Promise<void>}
 */
async function setSubscriptionStatus(page, status) {
  await page.getByRole('button', {name: 'Manage license'}).click();
  const dialog = page.locator('.modal-content').filter({hasText: 'Manage customer license'});
  await dialog.getByLabel('Status').selectOption(status);
  await dialog.getByRole('button', {name: 'Save license'}).click();
  await expect(dialog).toBeHidden();
  const expectedLabel = status.charAt(0).toUpperCase() + status.slice(1);
  await expect(page.getByText(expectedLabel, {exact: true}).first()).toBeVisible();
}

test.describe.serial('@enterprise customer lifecycle', () => {
  test('platform owner creates and configures an isolated customer', async ({page}) => {
    await signIn(
        page,
        OWNER_EMAIL,
        requireCredential(OWNER_PASSWORD_KEY),
        /\/admin\/organizations$/,
    );
    await expect(page.getByRole('heading', {name: 'Customer Organizations'})).toBeVisible();

    customerOrgId = await createOrganization(page, ORGANIZATION_NAME, ORGANIZATION_SLUG);
    await activateComplimentaryLicense(page, 'entity_core', 'Entity Core');
    await recordAgreement(page, 'E2E-ORDER-001');
    await expect(page.getByRole('progressbar', {name: 'Customer onboarding progress'}))
        .toHaveAttribute('aria-valuenow', '83');

    invitationUrl = await inviteUser(page, NEW_ADMIN_EMAIL, 'admin');
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

  test('platform owner configures five-seat and fifteen-seat license tiers', async ({page}) => {
    await signIn(
        page,
        OWNER_EMAIL,
        requireCredential(OWNER_PASSWORD_KEY),
        /\/admin\/organizations$/,
    );

    deskOrgId = await createOrganization(page, DESK_ORGANIZATION_NAME, DESK_ORGANIZATION_SLUG);
    await activateComplimentaryLicense(page, 'desk_intelligence', 'Desk Intelligence');
    await recordAgreement(page, 'E2E-ORDER-002');
    await expect(page.getByText('0 / 5', {exact: true})).toBeVisible();
    existingInvitationUrl = await inviteUser(page, EXISTING_CUSTOMER_EMAIL, 'admin');

    await createOrganization(page, FIRM_ORGANIZATION_NAME, FIRM_ORGANIZATION_SLUG);
    await activateComplimentaryLicense(page, 'firm_wide_enterprise', 'Firm-Wide Enterprise');
    await recordAgreement(page, 'E2E-ORDER-003');
    await expect(page.getByText('0 / 15', {exact: true})).toBeVisible();
  });

  test('an existing account accepts an administrator invitation', async ({page}) => {
    expect(existingInvitationUrl).toContain('/pages/accept-invite?token=');
    await page.goto(existingInvitationUrl, {waitUntil: 'domcontentloaded'});
    await page.getByRole('button', {name: 'Sign in to accept'}).click();
    await page.getByLabel('Email address').fill(EXISTING_CUSTOMER_EMAIL);
    await page.getByLabel('Password').fill(requireCredential(EXISTING_CUSTOMER_PASSWORD_KEY));
    await page.getByRole('button', {name: 'Sign In'}).click();
    await expect(page.getByRole('button', {name: 'Accept invitation'})).toBeVisible();
    await page.getByRole('button', {name: 'Accept invitation'}).click();
    await expect(page).toHaveURL(/\/dashboard\/sona-targets$/);

    await openRoute(page, '/organization/team');
    await expect(page.getByText('1 of 5', {exact: true})).toBeVisible();
    await expect(page.getByText('4', {exact: true}).last()).toBeVisible();
    memberInvitationUrl = await inviteUser(page, MEMBER_EMAIL, 'member');
  });

  test('a customer member receives product access but cannot manage the team', async ({page}) => {
    expect(memberInvitationUrl).toContain('/pages/accept-invite?token=');
    await page.goto(memberInvitationUrl, {waitUntil: 'domcontentloaded'});
    await page.getByLabel('Password', {exact: true}).fill(requireCredential(MEMBER_PASSWORD_KEY));
    await page.getByLabel('Confirm password').fill(requireCredential(MEMBER_PASSWORD_KEY));
    await page.getByRole('button', {name: 'Create account and join'}).click();
    await expect(page).toHaveURL(/\/dashboard\/sona-targets$/);
    await expect(page.getByRole('heading', {name: "NQ Today's Targets"})).toBeVisible();

    await openRoute(page, '/organization/team');
    await expect(page).toHaveURL(/\/access-unavailable$/);
    await expect(page.getByRole('heading', {
      name: 'This feature is not included in your current access.',
    })).toBeVisible();
    expect(deskOrgId).toMatch(/^org_/);
  });

  test('a platform owner can suspend customer access', async ({page}) => {
    await signIn(
        page,
        OWNER_EMAIL,
        requireCredential(OWNER_PASSWORD_KEY),
        /\/admin\/organizations$/,
    );
    await reviewOrganization(page, DESK_ORGANIZATION_NAME);
    await setSubscriptionStatus(page, 'suspended');
  });

  test('a suspended customer is denied licensed dashboard access', async ({page}) => {
    await signIn(
        page,
        EXISTING_CUSTOMER_EMAIL,
        requireCredential(EXISTING_CUSTOMER_PASSWORD_KEY),
        /\/access-unavailable$/,
    );
    await expect(page.getByRole('heading', {
      name: 'This feature is not included in your current access.',
    })).toBeVisible();
  });

  test('reactivation restores access and the customer can log out and back in', async ({page, browser}) => {
    await signIn(
        page,
        OWNER_EMAIL,
        requireCredential(OWNER_PASSWORD_KEY),
        /\/admin\/organizations$/,
    );
    await reviewOrganization(page, DESK_ORGANIZATION_NAME);
    await setSubscriptionStatus(page, 'active');

    const customerContext = await browser.newContext();
    const customerPage = await customerContext.newPage();
    await signIn(
        customerPage,
        EXISTING_CUSTOMER_EMAIL,
        requireCredential(EXISTING_CUSTOMER_PASSWORD_KEY),
        /\/dashboard\/sona-targets$/,
    );
    await customerPage.locator('.dropdown-profile .dropdown-link').first().click();
    await customerPage.locator('.dropdown-profile .dropdown-menu.show')
        .getByText('Log Out', {exact: true}).click();
    await expect(customerPage).toHaveURL(/\/login$/);
    await signIn(
        customerPage,
        EXISTING_CUSTOMER_EMAIL,
        requireCredential(EXISTING_CUSTOMER_PASSWORD_KEY),
        /\/dashboard\/sona-targets$/,
    );
    await expect(customerPage.getByRole('heading', {name: "NQ Today's Targets"})).toBeVisible();
    await customerContext.close();
  });

  test('cancellation removes access and a governed reactivation restores it', async ({page, browser}) => {
    await signIn(
        page,
        OWNER_EMAIL,
        requireCredential(OWNER_PASSWORD_KEY),
        /\/admin\/organizations$/,
    );
    await reviewOrganization(page, DESK_ORGANIZATION_NAME);
    await setSubscriptionStatus(page, 'canceled');

    const customerContext = await browser.newContext();
    const customerPage = await customerContext.newPage();
    await signIn(
        customerPage,
        EXISTING_CUSTOMER_EMAIL,
        requireCredential(EXISTING_CUSTOMER_PASSWORD_KEY),
        /\/access-unavailable$/,
    );
    await customerContext.close();

    await setSubscriptionStatus(page, 'active');
  });
});
