import { detectNewTargets } from './targetNotifications';

const t = (id) => ({ alertId: id });

describe('detectNewTargets', () => {
  it('reports nothing on the first run, just seeds the id set', () => {
    const { fresh, ids } = detectNewTargets(null, [t('a'), t('b')]);
    expect(fresh).toEqual([]);
    expect(ids.has('a')).toBe(true);
    expect(ids.has('b')).toBe(true);
  });

  it('reports only the newly arrived targets', () => {
    const seen = new Set(['a', 'b']);
    const { fresh, ids } = detectNewTargets(seen, [t('c'), t('a'), t('b')]);
    expect(fresh.map((x) => x.alertId)).toEqual(['c']);
    expect(ids.has('c')).toBe(true);
  });

  it('reports nothing when nothing changed', () => {
    const seen = new Set(['a', 'b']);
    const { fresh } = detectNewTargets(seen, [t('a'), t('b')]);
    expect(fresh).toEqual([]);
  });
});
