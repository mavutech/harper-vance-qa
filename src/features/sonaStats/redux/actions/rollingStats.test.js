import { fetchRollingStats } from './rollingStats';
import { sonaStatsService } from '../../services/sonaStatsService';
import reducer from '../reducers/sonaStatsReducer';
jest.mock('../../services/sonaStatsService', () => ({sonaStatsService: {fetchRollingStats: jest.fn()}}));
jest.mock('../../../../utils/analytics', () => ({trackEvent: jest.fn()}));

it('rejects an older response after 10 → 40 → 10, including late failures', async () => {
  const pending = [];
  sonaStatsService.fetchRollingStats.mockImplementation(() => new Promise((resolve, reject) => pending.push({resolve, reject})));
  let state = reducer(undefined, {});
  const dispatch = (action) => { state = reducer(state, action); };
  const first = fetchRollingStats(10)(dispatch);
  const second = fetchRollingStats(40)(dispatch);
  const third = fetchRollingStats(10)(dispatch);
  pending[2].resolve({summary: {accuracy: 80}});
  await third;
  pending[0].resolve({summary: {accuracy: 10}});
  pending[1].reject(new Error('Old failure'));
  await Promise.all([first, second]);
  expect(state.rolling.data.summary.accuracy).toBe(80);
  expect(state.rolling.error).toBeNull();
  expect(state.rolling.loading).toBe(false);
});
