/**
 * Service tests for organizationService. Mocks firebase/firestore so the
 * SDK's read wrappers can be verified without a live Firestore instance.
 */

import * as organizationService from './organizationService';

jest.mock('firebase/firestore', () => {
  const collection = jest.fn((_db, ...path) => ({__path: path.join('/')}));
  const doc = jest.fn((_db, ...path) => ({__path: path.join('/'), id: path[path.length - 1]}));
  const getDoc = jest.fn();
  const getDocs = jest.fn();
  const orderBy = jest.fn((field, dir) => ({__op: 'orderBy', field, dir}));
  const limit = jest.fn((n) => ({__op: 'limit', n}));
  const where = jest.fn((f, op, v) => ({__op: 'where', f, op, v}));
  const query = jest.fn((...args) => ({__query: args}));
  return {collection, doc, getDoc, getDocs, orderBy, limit, where, query};
});

jest.mock('../../../firebase/config', () => ({firestore: {}}));

const firestore = require('firebase/firestore');

const makeSnap = (exists, id, data) => ({
  exists: () => exists,
  id,
  data: () => data,
});

const makeQuerySnap = (docs) => ({docs: docs.map((d) => ({id: d.id, data: () => d.data}))});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getOrganization', () => {
  it('returns null when the doc does not exist', async () => {
    firestore.getDoc.mockResolvedValue(makeSnap(false, 'orgA', null));
    await expect(organizationService.getOrganization('orgA')).resolves.toBeNull();
  });

  it('returns the doc with id merged when it exists', async () => {
    firestore.getDoc.mockResolvedValue(makeSnap(true, 'orgA', {name: 'Acme'}));
    await expect(organizationService.getOrganization('orgA')).resolves.toEqual({
      id: 'orgA',
      name: 'Acme',
    });
  });

  it('throws when orgId is missing', async () => {
    await expect(organizationService.getOrganization('')).rejects.toThrow(
        'getOrganization: orgId is required.',
    );
  });
});

describe('getOrganizations', () => {
  it('returns [] for empty input', async () => {
    await expect(organizationService.getOrganizations([])).resolves.toEqual([]);
    expect(firestore.getDoc).not.toHaveBeenCalled();
  });

  it('skips missing docs silently', async () => {
    firestore.getDoc
        .mockResolvedValueOnce(makeSnap(true, 'orgA', {name: 'Acme'}))
        .mockResolvedValueOnce(makeSnap(false, 'orgGhost', null))
        .mockResolvedValueOnce(makeSnap(true, 'orgB', {name: 'Beta'}));
    const result = await organizationService.getOrganizations(['orgA', 'orgGhost', 'orgB']);
    expect(result).toEqual([
      {id: 'orgA', name: 'Acme'},
      {id: 'orgB', name: 'Beta'},
    ]);
  });
});

describe('getMembership', () => {
  it('throws without orgId or uid', async () => {
    await expect(organizationService.getMembership('', 'alice')).rejects.toThrow();
    await expect(organizationService.getMembership('orgA', '')).rejects.toThrow();
  });

  it('returns null when not a member', async () => {
    firestore.getDoc.mockResolvedValue(makeSnap(false, 'alice', null));
    await expect(organizationService.getMembership('orgA', 'alice')).resolves.toBeNull();
  });

  it('returns the membership with uid merged', async () => {
    firestore.getDoc.mockResolvedValue(makeSnap(true, 'alice', {role: 'owner'}));
    await expect(organizationService.getMembership('orgA', 'alice')).resolves.toEqual({
      uid: 'alice',
      role: 'owner',
    });
  });
});

describe('listMembers', () => {
  it('returns docs with uid merged', async () => {
    firestore.getDocs.mockResolvedValue(makeQuerySnap([
      {id: 'alice', data: {role: 'owner'}},
      {id: 'bob', data: {role: 'member'}},
    ]));
    const result = await organizationService.listMembers('orgA');
    expect(result).toEqual([
      {uid: 'alice', role: 'owner'},
      {uid: 'bob', role: 'member'},
    ]);
  });
});

describe('listPendingInvitations', () => {
  it('queries with status=pending, ordered by expiresAt, limited to 100', async () => {
    firestore.getDocs.mockResolvedValue(makeQuerySnap([
      {id: 'inv1', data: {email: 'a@x.com', role: 'member'}},
    ]));
    const result = await organizationService.listPendingInvitations('orgA');
    expect(result).toEqual([{id: 'inv1', email: 'a@x.com', role: 'member'}]);
    // query() was called with the collection ref + 3 constraint objects
    expect(firestore.query).toHaveBeenCalledTimes(1);
    expect(firestore.where).toHaveBeenCalledWith('status', '==', 'pending');
    expect(firestore.orderBy).toHaveBeenCalledWith('expiresAt', 'asc');
    expect(firestore.limit).toHaveBeenCalledWith(100);
  });
});
