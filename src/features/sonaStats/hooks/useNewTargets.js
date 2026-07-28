import { useEffect, useRef } from 'react';
import { detectNewTargets } from '../utils/targetNotifications';

/**
 * Calls `onNew(freshTargets)` whenever new targets arrive in the live stream.
 * Seeds on the first render so the initial load does not fire, and de-dupes by
 * alertId so re-renders or hit-updates do not re-trigger.
 *
 * @param {Object[]} targets - Real-time targets array
 * @param {(fresh: Object[]) => void} onNew - Called with newly arrived targets
 */
export const useNewTargets = (targets, onNew) => {
  const seenRef = useRef(null);
  const onNewRef = useRef(onNew);
  onNewRef.current = onNew;

  useEffect(() => {
    const { fresh, ids } = detectNewTargets(seenRef.current, targets);
    seenRef.current = ids;
    if (fresh.length && onNewRef.current) onNewRef.current(fresh);
  }, [targets]);
};
