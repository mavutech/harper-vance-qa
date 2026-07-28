import { ref, onValue, off } from 'firebase/database';
import { database } from '../../../firebase/config';
import moment from 'moment';
import { BULLISH_COLOR } from '../utils/sonaStatsConstants';

/**
 * Transforms a Firebase push-key snapshot object into a sorted targets array.
 * Newest targets (by rawTime) appear first.
 *
 * @param {Object} snapshotVal - Raw value from Firebase snapshot
 * @returns {Object[]} Sorted array of target objects
 */
const transformSnapshot = (snapshotVal) =>
  Object.values(snapshotVal).sort(
    (a, b) => new Date(b.rawTime) - new Date(a.rawTime)
  );

/**
 * Opens a real-time Firebase subscription to today's SONA targets.
 * Firebase path: targets/nq/5m/YYYY-MM/DD
 *
 * Calls onData with the full sorted targets array on every update.
 * Calls onData with an empty array and an error string on failure.
 *
 * The caller is responsible for invoking the returned unsubscribe function
 * when the subscription is no longer needed (e.g. on component unmount).
 *
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @param {(targets: Object[], error?: string) => void} onData - Callback fired on every update
 * @returns {() => void} Unsubscribe function — call this to tear down the listener
 *
 * @example
 * const unsubscribe = sonaTargetsService.subscribeToTodaysTargets('2026-06-09', (targets, err) => {
 *   if (err) console.error(err);
 *   else setTargets(targets);
 * });
 * // later, on unmount:
 * unsubscribe();
 */
const subscribeToTodaysTargets = (date, onData) => {
  const yearMonth = moment(date).format('YYYY-MM');
  const day = moment(date).format('DD');
  const dbRef = ref(database, `targets/nq/5m/${yearMonth}/${day}`);

  onValue(
    dbRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData([]);
        return;
      }
      onData(transformSnapshot(snapshot.val()));
    },
    (error) => {
      onData([], error.message);
    }
  );

  return () => off(dbRef);
};

/**
 * @namespace sonaTargetsService
 */
const sonaTargetsService = {
  subscribeToTodaysTargets,
  /** @deprecated — kept for reference; colorHighlight value identifying a bullish target */
  BULLISH_COLOR,
};

export default sonaTargetsService;
