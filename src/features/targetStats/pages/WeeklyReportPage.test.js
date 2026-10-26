import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {useWeeklyStats} from '../hooks/useWeeklyStats';
import WeeklyReportPage, { getWeekSelectionFromSearch, getWeeklySummaryFallbackMessage } from './WeeklyReportPage';

jest.mock('../../../layouts/Header', () => () => <div>Header</div>);
jest.mock('../../../layouts/Footer', () => () => <div>Footer</div>);
jest.mock('../../../config/seoConfig', () => ({updatePageSEO: jest.fn()}));
jest.mock('../../../utils/analytics', () => ({trackEvent: jest.fn()}));
jest.mock('../hooks/useWeeklyStats', () => ({useWeeklyStats: jest.fn()}));
jest.mock('../components/WeeklyKpiCards', () => () => <div>Weekly KPI cards</div>);
jest.mock('../components/WeeklyRetractionCards', () => () => <div>Retraction cards</div>);
jest.mock('../components/WeeklyDayChart', () => () => <div>Weekly day chart</div>);
jest.mock('../components/WeeklyDailyLog', () => () => <div>Weekly daily log</div>);
jest.mock('../components/WeekOverWeekChart', () => () => <div>Week comparison</div>);
jest.mock('../components/WeeklyBucketGrid', () => () => <div>Weekly buckets</div>);
jest.mock('../components/WeeklyMedianRetractionChart', () => () => <div>Median retraction</div>);
jest.mock('../components/MissedResolutionSection', () => () => <div>Missed resolution</div>);

describe('getWeekSelectionFromSearch', () => {
  beforeAll(() => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date('2026-07-30T12:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('uses a valid week and year from the URL', () => {
    expect(getWeekSelectionFromSearch(new URLSearchParams('week=29&year=2026')))
      .toEqual({ weekNumber: 29, year: 2026 });
  });

  it('keeps the New York week when UTC has already reached Monday', () => {
    jest.setSystemTime(new Date('2026-10-26T01:00:00.000Z'));
    expect(getWeekSelectionFromSearch(new URLSearchParams()))
      .toEqual({weekNumber: 43, year: 2026});
    jest.setSystemTime(new Date('2026-07-30T12:00:00.000Z'));
  });

  it('falls back for an invalid week parameter', () => {
    const fallback = getWeekSelectionFromSearch(new URLSearchParams('week=99&year=2026'));

    expect(fallback).toEqual({ weekNumber: 31, year: 2026 });
  });

  it('falls back for a future week parameter', () => {
    const fallback = getWeekSelectionFromSearch(new URLSearchParams('week=32&year=2026'));

    expect(fallback).toEqual({ weekNumber: 31, year: 2026 });
  });
});

describe('getWeeklySummaryFallbackMessage', () => {
  const currentWeek = { weekNumber: 31, year: 2026 };

  it('identifies a missing generated summary for a completed week', () => {
    expect(getWeeklySummaryFallbackMessage(30, 2026, currentWeek)).toBe(
      'The generated weekly summary for Week 30, 2026 is unavailable. Core results below are calculated from the available daily records; comparison metrics will return after the summary is regenerated.'
    );
  });

  it('describes the normal generation state for the current week', () => {
    expect(getWeeklySummaryFallbackMessage(31, 2026, currentWeek)).toBe(
      'The weekly summary is still being generated. Core results below are calculated from the available daily records; comparison metrics will appear once generation is complete.'
    );
  });
});

describe('WeeklyReportPage page states', () => {
  const retry = jest.fn();
  const baseResult = {
    weekly: null,
    weekDates: [],
    rangeData: [],
    weeklyDirection: null,
    trendData: [],
    coverage: null,
    loading: false,
    error: null,
    comparisonError: null,
    weeklySummaryMissing: false,
    retry,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useWeeklyStats.mockReturnValue(baseResult);
  });

  /**
   * Renders a stable historical week so time does not affect page assertions.
   *
   * @return {void}
   */
  const renderPage = () => render(
    <MemoryRouter initialEntries={['/dashboard/sona-weekly?week=30&year=2026']}>
      <WeeklyReportPage />
    </MemoryRouter>,
  );

  it('shows loading without rendering stale weekly cards', () => {
    useWeeklyStats.mockReturnValue({...baseResult, loading: true});
    renderPage();

    expect(screen.getByText('Loading weekly stats...')).toBeInTheDocument();
    expect(screen.queryByText('Weekly KPI cards')).not.toBeInTheDocument();
  });

  it('shows a safe weekly error and retries the complete request', () => {
    useWeeklyStats.mockReturnValue({
      ...baseResult,
      error: 'Weekly results could not be loaded. Please try again.',
    });
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Weekly results could not be loaded');
    fireEvent.click(screen.getByRole('button', {name: 'Try again'}));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('distinguishes a missing generated summary from a permission failure', () => {
    useWeeklyStats.mockReturnValue({...baseResult, weeklySummaryMissing: true});
    renderPage();

    expect(screen.getByText(/generated weekly summary for Week 30, 2026 is unavailable/i))
        .toBeInTheDocument();
    expect(screen.getByText('Weekly KPI cards')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

test('week navigation includes week 53 between December and January', () => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(new Date('2027-01-12T12:00:00Z'));
  useWeeklyStats.mockReturnValue({ weekDates: [], rangeData: [], trendData: [], loading: false });
  try {
    render(<MemoryRouter initialEntries={['/dashboard/sona-weekly?week=1&year=2027']}><WeeklyReportPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Previous week' }));
    expect(useWeeklyStats).toHaveBeenLastCalledWith(53, 2026);
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    expect(useWeeklyStats).toHaveBeenLastCalledWith(1, 2027);
  } finally {
    jest.useRealTimers();
  }
});
