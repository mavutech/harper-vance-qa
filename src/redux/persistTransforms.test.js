import {safeAuthTransform, safeOrgTransform} from './persistTransforms';

describe('safeAuthTransform', () => {
  it('does NOT persist isLoggedIn (Firebase is the source of truth)', () => {
    const inbound = {
      isLoggedIn: true,
      user: {id: 'u1', email: 'a@b.com', role: 'admin'},
      error: 'anything',
      loading: true,
    };
    const persisted = safeAuthTransform.in(inbound, 'auth');
    expect(persisted.isLoggedIn).toBeUndefined();
    expect(persisted.user).toEqual({id: 'u1', email: 'a@b.com', role: 'admin'});
    expect(persisted.error).toBeUndefined();
    expect(persisted.loading).toBeUndefined();
  });

  it('rehydrates with isLoggedIn = false regardless of what was persisted', () => {
    // Simulate a stale persisted shape that includes isLoggedIn.
    const stalePersisted = {
      isLoggedIn: true,
      user: {id: 'u1', email: 'a@b.com', role: 'admin'},
    };
    const rehydrated = safeAuthTransform.out(stalePersisted, 'auth');
    expect(rehydrated.isLoggedIn).toBe(false);
    expect(rehydrated.user).toEqual({id: 'u1', email: 'a@b.com', role: 'admin'});
    expect(rehydrated.loading).toBe(false);
    expect(rehydrated.error).toBe('');
  });

  it('strips unsafe user fields on serialize', () => {
    const inbound = {
      user: {
        id: 'u1',
        email: 'a@b.com',
        role: 'admin',
        // fields NOT in SAFE_USER_FIELDS — must be dropped
        idToken: 'secret',
        rolesUpdatedAt: '2026-01-01',
        internalFlag: true,
      },
    };
    const persisted = safeAuthTransform.in(inbound, 'auth');
    expect(persisted.user).toEqual({id: 'u1', email: 'a@b.com', role: 'admin'});
    expect(persisted.user.idToken).toBeUndefined();
    expect(persisted.user.rolesUpdatedAt).toBeUndefined();
  });

  it('handles missing user cleanly', () => {
    expect(safeAuthTransform.in({}, 'auth').user).toBeNull();
    expect(safeAuthTransform.out({}, 'auth').user).toBeNull();
  });
});

describe('safeOrgTransform', () => {
  it('persists only currentOrgId', () => {
    const inbound = {
      currentOrgId: 'orgA',
      currentOrgRole: 'owner',
      orgs: {orgA: {id: 'orgA', name: 'Acme'}},
      loading: true,
      error: 'boom',
    };
    const persisted = safeOrgTransform.in(inbound, 'organization');
    expect(persisted).toEqual({currentOrgId: 'orgA'});
  });

  it('never persists currentOrgRole', () => {
    const persisted = safeOrgTransform.in(
        {currentOrgId: 'orgA', currentOrgRole: 'owner'},
        'organization',
    );
    expect(persisted.currentOrgRole).toBeUndefined();
  });

  it('rehydrates with role cleared even if persisted shape had one', () => {
    // Simulate legacy persisted data.
    const rehydrated = safeOrgTransform.out(
        {currentOrgId: 'orgA', currentOrgRole: 'owner'},
        'organization',
    );
    expect(rehydrated.currentOrgId).toBe('orgA');
    expect(rehydrated.currentOrgRole).toBeNull();
    expect(rehydrated.orgs).toEqual({});
    expect(rehydrated.loading).toBe(false);
    expect(rehydrated.error).toBeNull();
  });

  it('drops non-string currentOrgId', () => {
    expect(safeOrgTransform.in({currentOrgId: 42}, 'organization').currentOrgId).toBeNull();
    expect(safeOrgTransform.out({currentOrgId: {}}, 'organization').currentOrgId).toBeNull();
  });
});
