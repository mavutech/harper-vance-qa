import { renderHook } from '@testing-library/react';
import { useNewTargets } from './useNewTargets';

const t = (id) => ({ alertId: id });

describe('useNewTargets', () => {
  it('does not fire on the initial load', () => {
    const onNew = jest.fn();
    renderHook(({ targets }) => useNewTargets(targets, onNew), {
      initialProps: { targets: [t('a'), t('b')] },
    });
    expect(onNew).not.toHaveBeenCalled();
  });

  it('fires with only the newly arrived targets on update', () => {
    const onNew = jest.fn();
    const { rerender } = renderHook(({ targets }) => useNewTargets(targets, onNew), {
      initialProps: { targets: [t('a')] },
    });
    rerender({ targets: [t('b'), t('a')] });
    expect(onNew).toHaveBeenCalledTimes(1);
    expect(onNew.mock.calls[0][0].map((x) => x.alertId)).toEqual(['b']);
  });

  it('does not re-fire for already-seen targets (e.g. a hit update)', () => {
    const onNew = jest.fn();
    const { rerender } = renderHook(({ targets }) => useNewTargets(targets, onNew), {
      initialProps: { targets: [t('a')] },
    });
    rerender({ targets: [{ alertId: 'a', targetReached: true }] });
    expect(onNew).not.toHaveBeenCalled();
  });
});
