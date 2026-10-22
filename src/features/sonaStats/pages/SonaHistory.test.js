import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {useRollingStats} from '../hooks/useRollingStats';
import SonaHistory from './SonaHistory';

jest.mock('../components/MonthlyHistory', () => () => <div>Monthly report</div>);
jest.mock('../../../layouts/Header', () => () => <div>Header</div>);
jest.mock('../../../layouts/Footer', () => () => <div>Footer</div>);
jest.mock('../../../config/seoConfig', () => ({updatePageSEO: jest.fn()}));
jest.mock('../../../utils/analytics', () => ({trackEvent: jest.fn()}));
jest.mock('../hooks/useRollingStats', () => ({useRollingStats: jest.fn()}));
jest.mock('../components/RollingAccuracyChart', () => () => <div>Rolling accuracy</div>);
jest.mock('../components/StreakIndicator', () => () => <div>Streak indicator</div>);
jest.mock('../components/DailyBreakdownTable', () => () => <div>Daily breakdown</div>);
jest.mock('../components/DirectionBiasChart', () => () => <div>Direction bias</div>);

/**
 * Renders the historical analysis page.
 *
 * @return {void}
 */
const renderPage = () => render(<MemoryRouter><SonaHistory /></MemoryRouter>);

describe('SonaHistory page states', () => {
  const retry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRollingStats.mockReturnValue({
      rangeData: [],
      rolling5Day: [],
      rolling20Day: [],
      streak: null,
      loading: false,
      error: null,
      retry,
    });
  });

  it('shows a bounded loading state', () => {
    useRollingStats.mockReturnValue({
      rangeData: [], rolling5Day: [], rolling20Day: [], streak: null,
      loading: true, error: null, retry,
    });
    renderPage();

    expect(screen.getByText('Loading historical stats...')).toBeInTheDocument();
    expect(screen.queryByText('Rolling accuracy')).not.toBeInTheDocument();
  });

  it('shows a safe historical error with retry', () => {
    useRollingStats.mockReturnValue({
      rangeData: [], rolling5Day: [], rolling20Day: [], streak: null,
      loading: false, error: 'Historical results could not be loaded. Please try again.', retry,
    });
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Historical results could not be loaded');
    fireEvent.click(screen.getByRole('button', {name: 'Try again'}));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('renders an empty authorized result as charts rather than an access error', () => {
    renderPage();

    expect(screen.getByText('Rolling accuracy')).toBeInTheDocument();
    expect(screen.getByText('Daily breakdown')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

it('switches to calendar month without mounting the rolling data reader', () => {
  useRollingStats.mockReturnValue({rangeData: [], rolling5Day: [], rolling20Day: [], streak: null, loading: false, error: null, retry: jest.fn()});
  renderPage();
  const calls = useRollingStats.mock.calls.length;
  fireEvent.click(screen.getByRole('button', {name: 'Calendar month'}));
  expect(screen.getByText('Monthly report')).toBeInTheDocument();
  expect(screen.queryByText('Rolling accuracy')).not.toBeInTheDocument();
  expect(useRollingStats).toHaveBeenCalledTimes(calls);
  fireEvent.click(screen.getByRole('button', {name: 'Rolling history'}));
  expect(screen.getByText('Rolling accuracy')).toBeInTheDocument();
});
