import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {useRecentPerformance} from '../hooks/useRecentPerformance';
import TargetHistoryPage from './TargetHistoryPage';
jest.mock('../components/MonthlyHistory', () => () => <div>Monthly report</div>);
jest.mock('../../../layouts/Header', () => () => <div>Header</div>);
jest.mock('../../../layouts/Footer', () => () => <div>Footer</div>);
jest.mock('../../../config/seoConfig', () => ({updatePageSEO: jest.fn()}));
jest.mock('../../../utils/analytics', () => ({trackEvent: jest.fn()}));
jest.mock('../hooks/useRecentPerformance', () => ({useRecentPerformance: jest.fn()}));
jest.mock('react-apexcharts', () => () => <div>Chart</div>);

beforeEach(() => { jest.clearAllMocks(); useRecentPerformance.mockReturnValue({loading: true}); });
it('defaults to calendar month without requesting rolling data', () => {
  render(<MemoryRouter><TargetHistoryPage /></MemoryRouter>);
  expect(screen.getByText('Monthly report')).toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Calendar month'})).toHaveAttribute('aria-pressed', 'true');
  expect(useRecentPerformance).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', {name: 'Recent performance'}));
  expect(useRecentPerformance).toHaveBeenLastCalledWith(20);
  fireEvent.click(screen.getByRole('button', {name: '40 sessions'}));
  expect(useRecentPerformance).toHaveBeenLastCalledWith(40);
  const calls = useRecentPerformance.mock.calls.length;
  fireEvent.click(screen.getByRole('button', {name: 'Calendar month'}));
  expect(screen.getByText('Monthly report')).toBeInTheDocument();
  expect(useRecentPerformance).toHaveBeenCalledTimes(calls);
});
it('honors explicit rolling deep links and safe errors with retry', () => {
  const retry = jest.fn();
  useRecentPerformance.mockReturnValue({error: 'Could not load results.', loading: false, retry});
  render(<MemoryRouter initialEntries={['/?view=rolling&sessions=10']}><TargetHistoryPage /></MemoryRouter>);
  expect(useRecentPerformance).toHaveBeenLastCalledWith(10);
  expect(screen.getByRole('alert')).toHaveTextContent('Could not load results.');
  fireEvent.click(screen.getByRole('button', {name: 'Try again'}));
  expect(retry).toHaveBeenCalledTimes(1);
});
