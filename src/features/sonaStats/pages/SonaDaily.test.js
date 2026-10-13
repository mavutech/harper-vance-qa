import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {useTargetStats} from '../hooks/useTargetStats';
import SonaDaily from './SonaDaily';

jest.mock('../../../layouts/Header', () => () => <div>Header</div>);
jest.mock('../../../layouts/Footer', () => () => <div>Footer</div>);
jest.mock('../../../config/seoConfig', () => ({updatePageSEO: jest.fn()}));
jest.mock('../../../utils/analytics', () => ({trackEvent: jest.fn()}));
jest.mock('../hooks/useTargetStats', () => ({useTargetStats: jest.fn()}));
jest.mock('../components/KpiCards', () => () => <div>Daily KPI cards</div>);
jest.mock('../components/TargetResolutionTable', () => () => <div>Resolution table</div>);
jest.mock('../components/ResolutionTimeBuckets', () => () => <div>Resolution buckets</div>);
jest.mock('../components/SessionPeriodBreakdown', () => () => <div>Session periods</div>);
jest.mock('../components/MissAnalysis', () => () => <div>Miss analysis</div>);
jest.mock('../components/DistanceVsHitRate', () => () => <div>Distance analysis</div>);
jest.mock('../components/IntradayTargetChart', () => () => <div>Intraday chart</div>);
jest.mock('../components/RetractionProfile', () => () => <div>Retraction profile</div>);
jest.mock('../components/SonaDailyContextCard', () => () => <div>Daily context</div>);
jest.mock('../components/StatsPrimerDrawer', () => () => null);

/**
 * Renders the daily page inside its query-string router dependency.
 *
 * @return {void}
 */
const renderPage = () => render(
  <MemoryRouter initialEntries={['/dashboard/sona-daily?date=2026-10-08']}>
    <SonaDaily />
  </MemoryRouter>,
);

describe('SonaDaily page states', () => {
  const retry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useTargetStats.mockReturnValue({
      data: null,
      computedStats: null,
      loading: false,
      error: null,
      retry,
    });
  });

  it('shows loading without rendering stale results', () => {
    useTargetStats.mockReturnValue({
      data: null, computedStats: null, loading: true, error: null, retry,
    });
    renderPage();

    expect(screen.getByText('Loading stats...')).toBeInTheDocument();
    expect(screen.queryByText('Daily KPI cards')).not.toBeInTheDocument();
  });

  it('shows the safe error and retries the selected day', () => {
    useTargetStats.mockReturnValue({
      data: null,
      computedStats: null,
      loading: false,
      error: 'Daily results could not be loaded. Please try again.',
      retry,
    });
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Daily results could not be loaded');
    fireEvent.click(screen.getByRole('button', {name: 'Try again'}));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('renders daily analytics only after a successful response', () => {
    useTargetStats.mockReturnValue({
      data: {engulfingCandleList: [], trailingStats: {}},
      computedStats: {},
      loading: false,
      error: null,
      retry,
    });
    renderPage();

    expect(screen.getByText('Daily KPI cards')).toBeInTheDocument();
    expect(screen.getByText('Intraday chart')).toBeInTheDocument();
    expect(screen.getByText('Resolution table')).toBeInTheDocument();
  });
});
