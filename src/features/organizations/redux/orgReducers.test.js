import reducer, {INITIAL_STATE} from './orgReducers';
import * as orgTypes from './orgTypes';

const orgA = {id: 'orgA', name: 'Acme', slug: 'acme', plan: 'pilot', seatLimit: 25};
const orgB = {id: 'orgB', name: 'Beta', slug: 'beta', plan: 'pilot', seatLimit: 25};

describe('organization reducer', () => {
  it('starts empty', () => {
    const s = reducer(undefined, {type: '@@INIT'});
    expect(s).toEqual(INITIAL_STATE);
  });

  // ── FETCH ────────────────────────────────────────────────────────────
  describe('FETCH_ORGS', () => {
    it('sets loading on request', () => {
      const s = reducer(undefined, {type: orgTypes.FETCH_ORGS_REQUEST});
      expect(s.loading).toBe(true);
      expect(s.error).toBeNull();
    });

    it('populates orgs, currentOrgId, and role on success', () => {
      const s = reducer(undefined, {
        type: orgTypes.FETCH_ORGS_SUCCESS,
        payload: {
          orgs: [orgA, orgB],
          claimsMap: {orgA: 'owner', orgB: 'member'},
        },
      });
      expect(s.loading).toBe(false);
      expect(s.orgs).toEqual({orgA, orgB});
      expect(s.currentOrgId).toBe('orgA');
      expect(s.currentOrgRole).toBe('owner');
    });

    it('keeps existing currentOrgId when it still has a claim', () => {
      const initial = {...INITIAL_STATE, currentOrgId: 'orgB'};
      const s = reducer(initial, {
        type: orgTypes.FETCH_ORGS_SUCCESS,
        payload: {
          orgs: [orgA, orgB],
          claimsMap: {orgA: 'owner', orgB: 'member'},
        },
      });
      expect(s.currentOrgId).toBe('orgB');
      expect(s.currentOrgRole).toBe('member');
    });

    it('falls back to first org when current has no claim (revoked)', () => {
      const initial = {...INITIAL_STATE, currentOrgId: 'orgGhost'};
      const s = reducer(initial, {
        type: orgTypes.FETCH_ORGS_SUCCESS,
        payload: {orgs: [orgA], claimsMap: {orgA: 'admin'}},
      });
      expect(s.currentOrgId).toBe('orgA');
      expect(s.currentOrgRole).toBe('admin');
    });

    it('handles empty org list', () => {
      const s = reducer(undefined, {
        type: orgTypes.FETCH_ORGS_SUCCESS,
        payload: {orgs: [], claimsMap: {}},
      });
      expect(s.orgs).toEqual({});
      expect(s.currentOrgId).toBeNull();
      expect(s.currentOrgRole).toBeNull();
    });

    it('sets error on failure', () => {
      const s = reducer(undefined, {
        type: orgTypes.FETCH_ORGS_FAILURE,
        payload: 'network down',
      });
      expect(s.loading).toBe(false);
      expect(s.error).toBe('network down');
    });

    it('uses default error message when payload missing', () => {
      const s = reducer(undefined, {type: orgTypes.FETCH_ORGS_FAILURE});
      expect(s.error).toBe('Failed to load organizations.');
    });
  });

  // ── SWITCH ───────────────────────────────────────────────────────────
  describe('SWITCH_ORG', () => {
    it('sets loading on request', () => {
      const s = reducer(undefined, {type: orgTypes.SWITCH_ORG_REQUEST});
      expect(s.loading).toBe(true);
      expect(s.error).toBeNull();
    });

    it('updates currentOrgId and role on success', () => {
      const initial = {
        ...INITIAL_STATE,
        orgs: {orgA, orgB},
        currentOrgId: 'orgA',
        currentOrgRole: 'owner',
      };
      const s = reducer(initial, {
        type: orgTypes.SWITCH_ORG_SUCCESS,
        payload: {orgId: 'orgB', role: 'member'},
      });
      expect(s.currentOrgId).toBe('orgB');
      expect(s.currentOrgRole).toBe('member');
    });

    it('sets error on failure', () => {
      const s = reducer(undefined, {
        type: orgTypes.SWITCH_ORG_FAILURE,
        payload: 'not a member',
      });
      expect(s.error).toBe('not a member');
    });
  });

  // ── REFRESH CLAIMS ───────────────────────────────────────────────────
  describe('REFRESH_ORG_CLAIMS_SUCCESS', () => {
    it('updates currentOrgRole from the fresh claim map', () => {
      const initial = {
        ...INITIAL_STATE,
        currentOrgId: 'orgA',
        currentOrgRole: 'member',
      };
      const s = reducer(initial, {
        type: orgTypes.REFRESH_ORG_CLAIMS_SUCCESS,
        payload: {claimsMap: {orgA: 'admin'}},
      });
      expect(s.currentOrgRole).toBe('admin');
    });

    it('clears currentOrgRole when the current org no longer has a claim', () => {
      const initial = {
        ...INITIAL_STATE,
        currentOrgId: 'orgA',
        currentOrgRole: 'member',
      };
      const s = reducer(initial, {
        type: orgTypes.REFRESH_ORG_CLAIMS_SUCCESS,
        payload: {claimsMap: {}},
      });
      expect(s.currentOrgRole).toBeNull();
    });
  });

  // ── ERROR + RESET ────────────────────────────────────────────────────
  it('CLEAR_ORG_ERROR nulls error but keeps other state', () => {
    const initial = {...INITIAL_STATE, error: 'boom', currentOrgId: 'orgA'};
    const s = reducer(initial, {type: orgTypes.CLEAR_ORG_ERROR});
    expect(s.error).toBeNull();
    expect(s.currentOrgId).toBe('orgA');
  });

  it('RESET_ORG_STATE returns INITIAL_STATE (used on logout)', () => {
    const initial = {
      ...INITIAL_STATE,
      currentOrgId: 'orgA',
      currentOrgRole: 'owner',
      orgs: {orgA},
    };
    const s = reducer(initial, {type: orgTypes.RESET_ORG_STATE});
    expect(s).toEqual(INITIAL_STATE);
  });
});
