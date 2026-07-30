import React from 'react';
import {renderHook} from '@testing-library/react';
import {Provider} from 'react-redux';
import {createStore, combineReducers} from 'redux';
import orgReducer from '../redux/orgReducers';
import {useCurrentOrg} from './useCurrentOrg';

const makeStore = (organization) =>
  createStore(combineReducers({organization: (state = organization) => state}));

const wrapperFor = (organization) => ({children}) => (
  <Provider store={makeStore(organization)}>{children}</Provider>
);

describe('useCurrentOrg', () => {
  it('returns null fields when no org selected', () => {
    const {result} = renderHook(() => useCurrentOrg(), {
      wrapper: wrapperFor(orgReducer(undefined, {type: '@@INIT'})),
    });
    expect(result.current.currentOrgId).toBeNull();
    expect(result.current.currentOrg).toBeNull();
    expect(result.current.currentOrgRole).toBeNull();
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isOwner).toBe(false);
    expect(result.current.isMember).toBe(false);
  });

  it('returns current org and role when set', () => {
    const org = {id: 'orgA', name: 'Acme', slug: 'acme', plan: 'pilot'};
    const {result} = renderHook(() => useCurrentOrg(), {
      wrapper: wrapperFor({
        loading: false,
        error: null,
        currentOrgId: 'orgA',
        currentOrgRole: 'owner',
        orgs: {orgA: org},
      }),
    });
    expect(result.current.currentOrgId).toBe('orgA');
    expect(result.current.currentOrg).toEqual(org);
    expect(result.current.currentOrgRole).toBe('owner');
    expect(result.current.isOwner).toBe(true);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isMember).toBe(true);
  });

  it('marks admin as isAdmin but not isOwner', () => {
    const {result} = renderHook(() => useCurrentOrg(), {
      wrapper: wrapperFor({
        loading: false,
        error: null,
        currentOrgId: 'orgA',
        currentOrgRole: 'admin',
        orgs: {orgA: {id: 'orgA', name: 'Acme'}},
      }),
    });
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isOwner).toBe(false);
  });

  it('marks member as isMember only', () => {
    const {result} = renderHook(() => useCurrentOrg(), {
      wrapper: wrapperFor({
        loading: false,
        error: null,
        currentOrgId: 'orgA',
        currentOrgRole: 'member',
        orgs: {orgA: {id: 'orgA', name: 'Acme'}},
      }),
    });
    expect(result.current.isMember).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isOwner).toBe(false);
  });

  it('returns null currentOrg when the id points to a missing org', () => {
    const {result} = renderHook(() => useCurrentOrg(), {
      wrapper: wrapperFor({
        loading: false,
        error: null,
        currentOrgId: 'orgGhost',
        currentOrgRole: 'member',
        orgs: {},
      }),
    });
    expect(result.current.currentOrgId).toBe('orgGhost');
    expect(result.current.currentOrg).toBeNull();
    expect(result.current.isMember).toBe(true);
  });
});
