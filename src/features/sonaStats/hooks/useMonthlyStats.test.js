import { act, renderHook } from '@testing-library/react';
import { useMonthlyStats } from './useMonthlyStats';
import { fetchMonthlyStats } from '../redux/actions/sonaStatsActions';
let mockState;
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({useDispatch: () => mockDispatch, useSelector: (select) => select(mockState)}));
jest.mock('../redux/actions/sonaStatsActions', () => ({fetchMonthlyStats: jest.fn(() => ({type: 'TEST'}))}));
jest.mock('../../../utils/analytics', () => ({trackEvent: jest.fn()}));
beforeEach(() => {jest.clearAllMocks(); mockState = {sonaStats: {monthly: {month: '2026-09', data: {month: '2026-09'}, loading: false, error: null}}};});
it('loads and retries the selected month and hides stale data on navigation', () => {
  const {result, rerender} = renderHook(({month}) => useMonthlyStats(month), {initialProps: {month: '2026-09'}});
  expect(result.current.report.month).toBe('2026-09');
  rerender({month: '2026-10'});
  expect(result.current.report).toBeNull();
  expect(result.current.loading).toBe(true);
  act(() => result.current.retry());
  expect(fetchMonthlyStats).toHaveBeenLastCalledWith('2026-10');
});
it('does not dispatch invalid month requests or retries', () => {
  const {result} = renderHook(() => useMonthlyStats(null));
  act(() => result.current.retry());
  expect(mockDispatch).not.toHaveBeenCalled();
  expect(result.current.loading).toBe(false);
});
