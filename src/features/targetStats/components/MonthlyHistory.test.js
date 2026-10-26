import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import moment from 'moment-timezone';
import MonthlyHistory from './MonthlyHistory';
import { useMonthlyStats } from '../hooks/useMonthlyStats';

jest.mock('../hooks/useMonthlyStats', () => ({ useMonthlyStats: jest.fn() }));
jest.mock('../../../utils/analytics', () => ({ trackEvent: jest.fn() }));
jest.mock('./MonthlyReport', () => ({ report }) => <div>Report {report.month}</div>);
const retry = jest.fn();
const renderMonth = (url = '/dashboard/sona-history?view=monthly&month=2026-10') => render(<MemoryRouter initialEntries={[url]}><MonthlyHistory /></MemoryRouter>);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(moment, 'now').mockReturnValue(Date.parse('2026-10-22T18:00:00Z'));
  useMonthlyStats.mockReturnValue({ report: null, loading: false, error: null, retry });
});
afterEach(() => jest.restoreAllMocks());

it('defaults to the New York month and blocks navigation into the future', () => {
  renderMonth('/dashboard/sona-history?view=monthly');
  expect(useMonthlyStats).toHaveBeenLastCalledWith('2026-10');
  expect(screen.getByRole('button', {name: 'Next month'})).toBeDisabled();
  fireEvent.click(screen.getByRole('button', {name: 'Previous month'}));
  expect(useMonthlyStats).toHaveBeenLastCalledWith('2026-09');
  fireEvent.click(screen.getByRole('button', {name: 'Next month'}));
  expect(useMonthlyStats).toHaveBeenLastCalledWith('2026-10');
});
it('navigates January to December in the previous year', () => {
  renderMonth('/dashboard/sona-history?view=monthly&month=2026-01');
  fireEvent.click(screen.getByRole('button', {name: 'Previous month'}));
  expect(useMonthlyStats).toHaveBeenLastCalledWith('2025-12');
});
it.each(['2026-13', '2026-1', '2026-11', 'bad', ''])('does not fetch invalid month %s', (month) => {
  renderMonth(`/dashboard/sona-history?view=monthly&month=${month}`);
  expect(useMonthlyStats).toHaveBeenLastCalledWith(null);
  expect(screen.getByRole('alert')).toHaveTextContent('Choose a valid month');
});
it('allows a month selection and shows bounded loading', () => {
  useMonthlyStats.mockReturnValue({ report: null, loading: true, error: null, retry });
  renderMonth();
  expect(screen.getByRole('status')).toHaveTextContent('Loading monthly report');
  fireEvent.change(screen.getByLabelText('Report month'), {target: {value: '2024-02'}});
  expect(useMonthlyStats).toHaveBeenLastCalledWith('2024-02');
});
it('shows safe errors with retry, then the report', () => {
  useMonthlyStats.mockReturnValue({ report: null, loading: false, error: 'Monthly results could not be loaded.', retry });
  const view = renderMonth();
  fireEvent.click(screen.getByRole('button', {name: 'Try again'}));
  expect(retry).toHaveBeenCalledTimes(1);
  view.unmount();
  useMonthlyStats.mockReturnValue({ report: {month: '2026-10'}, loading: false, error: null, retry });
  renderMonth();
  expect(screen.getByText('Report 2026-10')).toBeInTheDocument();
});
