/**
 * Thunk tests for the organization slice. Mocks the auth service and the
 * organization service so state transitions can be verified without hitting
 * Firebase.
 */

import {applyMiddleware, combineReducers, createStore} from 'redux';
import {thunk} from 'redux-thunk';
import orgReducer, {INITIAL_STATE} from './orgReducers';
import {fetchOrgs, refreshOrgClaims, switchOrg} from './orgActions';

jest.mock('../../../firebase/config', () => ({
  auth: {currentUser: {uid: 'alice'}},
  authReady: Promise.resolve(),
}));

jest.mock('../../auth/services/firebaseAuthService', () => ({
  refreshClaims: jest.fn(),
}));

jest.mock('../services/organizationService', () => ({
  getOrganizations: jest.fn(),
}));

const authService = require('../../auth/services/firebaseAuthService');
const orgService = require('../services/organizationService');
const config = require('../../../firebase/config');

const makeStore = () =>
  createStore(combineReducers({organization: orgReducer}), applyMiddleware(thunk));

const orgA = {id: 'orgA', name: 'Acme', slug: 'acme', plan: 'pilot'};
const orgB = {id: 'orgB', name: 'Beta', slug: 'beta', plan: 'standard'};

beforeEach(() => {
  jest.clearAllMocks();
  config.auth.currentUser = {uid: 'alice'};
});

describe('fetchOrgs', () => {
  it('loads orgs from token claims and dispatches SUCCESS', async () => {
    authService.refreshClaims.mockResolvedValue({
      orgs: {orgA: 'owner', orgB: 'member'},
    });
    orgService.getOrganizations.mockResolvedValue([orgA, orgB]);

    const store = makeStore();
    await store.dispatch(fetchOrgs());

    const s = store.getState().organization;
    expect(s.loading).toBe(false);
    expect(s.error).toBeNull();
    expect(s.orgs).toEqual({orgA, orgB});
    expect(s.currentOrgId).toBe('orgA');
    expect(s.currentOrgRole).toBe('owner');
    expect(orgService.getOrganizations).toHaveBeenCalledWith(['orgA', 'orgB']);
  });

  it('resets org state and rethrows AUTH_SESSION_EXPIRED when no user is present', async () => {
    config.auth.currentUser = null;
    const store = makeStore();

    await expect(store.dispatch(fetchOrgs())).rejects.toMatchObject({
      code: 'AUTH_SESSION_EXPIRED',
    });
    // Should NOT leave an error on the slice — the session-expired path
    // resets state so the auth reducer can redirect cleanly.
    const s = store.getState().organization;
    expect(s.error).toBeNull();
    expect(s.currentOrgId).toBeNull();
    expect(s.currentOrgRole).toBeNull();
  });

  it('dispatches FAILURE when refreshClaims throws', async () => {
    authService.refreshClaims.mockRejectedValue(new Error('token expired'));
    const store = makeStore();

    await expect(store.dispatch(fetchOrgs())).rejects.toThrow('token expired');
    expect(store.getState().organization.loading).toBe(false);
    expect(store.getState().organization.error).toBe('token expired');
  });

  it('handles a user with no orgs cleanly', async () => {
    authService.refreshClaims.mockResolvedValue({orgs: {}});
    orgService.getOrganizations.mockResolvedValue([]);

    const store = makeStore();
    await store.dispatch(fetchOrgs());

    const s = store.getState().organization;
    expect(s.orgs).toEqual({});
    expect(s.currentOrgId).toBeNull();
    expect(s.currentOrgRole).toBeNull();
  });
});

describe('switchOrg', () => {
  it('switches when the caller has a claim on the target org', async () => {
    authService.refreshClaims.mockResolvedValue({
      orgs: {orgA: 'owner', orgB: 'member'},
    });

    const store = makeStore();
    await store.dispatch(switchOrg('orgB'));

    const s = store.getState().organization;
    expect(s.currentOrgId).toBe('orgB');
    expect(s.currentOrgRole).toBe('member');
    expect(s.loading).toBe(false);
    expect(s.error).toBeNull();
  });

  it('rejects when the caller lacks a claim on the target org', async () => {
    authService.refreshClaims.mockResolvedValue({orgs: {orgA: 'owner'}});

    const store = makeStore();
    await expect(store.dispatch(switchOrg('orgB'))).rejects.toThrow(
        'You are not a member of this organization.',
    );
    expect(store.getState().organization.error).toBe(
        'You are not a member of this organization.',
    );
  });

  it('rejects when called without an orgId', async () => {
    const store = makeStore();
    await expect(store.dispatch(switchOrg(''))).rejects.toThrow(
        'switchOrg: orgId is required.',
    );
  });
});

describe('refreshOrgClaims', () => {
  it('refreshes the role for the current org', async () => {
    authService.refreshClaims.mockResolvedValue({orgs: {orgA: 'admin'}});

    const store = createStore(
        combineReducers({organization: orgReducer}),
        {organization: {...INITIAL_STATE, currentOrgId: 'orgA', currentOrgRole: 'member'}},
        applyMiddleware(thunk),
    );

    await store.dispatch(refreshOrgClaims());
    expect(store.getState().organization.currentOrgRole).toBe('admin');
  });

  it('no-ops when not authenticated', async () => {
    config.auth.currentUser = null;
    const store = makeStore();
    await expect(store.dispatch(refreshOrgClaims())).resolves.toEqual({});
    expect(authService.refreshClaims).not.toHaveBeenCalled();
  });
});
