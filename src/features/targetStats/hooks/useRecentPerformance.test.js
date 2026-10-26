import {act, renderHook} from '@testing-library/react';
import {useRecentPerformance} from './useRecentPerformance';
import {fetchRollingStats} from '../redux/actions/rollingStats';
let mockState;
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({useDispatch: () => mockDispatch, useSelector: (select) => select(mockState)}));
jest.mock('../redux/actions/rollingStats', () => ({fetchRollingStats: jest.fn(() => ({type: 'TEST'}))}));
it('hides a different range immediately and retries only the selected sessions', () => {
  mockState = {targetStats: {rolling: {sessions: 20, data: {period: {sessions: 20}}, loading: false, error: null}}};
  const {result, rerender} = renderHook(({sessions}) => useRecentPerformance(sessions), {initialProps: {sessions: 20}});
  expect(result.current.report.period.sessions).toBe(20);
  rerender({sessions: 40});
  expect(result.current.report).toBeNull();
  expect(result.current.loading).toBe(true);
  act(() => result.current.retry());
  expect(fetchRollingStats).toHaveBeenLastCalledWith(40);
});
