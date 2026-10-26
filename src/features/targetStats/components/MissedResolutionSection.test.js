import { render, screen } from '@testing-library/react';
import MissedResolutionSection from './MissedResolutionSection';

const groupWithHits = (overrides = {}) => ({
  eventualHitRate: 4.1,
  hits: 5,
  n: 123,
  neverResolved: 118,
  maxRetraction: 56.3,
  meanRetraction: 34.9,
  medianRetraction: 35.8,
  p25Retraction: 24.8,
  p75Retraction: 42.8,
  p90Retraction: 50.9,
  maxTimeMin: 30,
  meanTimeMin: 21,
  medianTimeMin: 25,
  p90TimeMin: 28,
  ...overrides,
});

const groupNoHits = (overrides = {}) => ({
  eventualHitRate: 0,
  hits: 0,
  n: 55,
  neverResolved: 55,
  ...overrides,
});

const buildWeekly = (overrides = {}) => ({
  lateResolverStats: {
    groups: {
      all: groupWithHits(),
      bullish: groupWithHits({ eventualHitRate: 5.3, hits: 3, n: 57 }),
      bearish: groupNoHits({ n: 29 }),
      'bullish|morning': groupWithHits({ eventualHitRate: 6.7, hits: 1, n: 15 }),
      'bullish|midday': groupWithHits({ eventualHitRate: 4.8, hits: 1, n: 21 }),
      'bullish|afternoon': groupNoHits({ n: 17 }),
      'bearish|morning': groupNoHits({ n: 13 }),
      'bearish|midday': groupNoHits({ n: 5 }),
      'bearish|afternoon': groupNoHits({ n: 11 }),
    },
    minSample: 8,
    thresholdMin: 5,
    share: 92.6,
    totalLate: 123,
    totalTargets: 132,
    windowSessions: 18,
    ...overrides,
  },
});

describe('MissedResolutionSection', () => {
  test('returns null when weekly has no lateResolverStats', () => {
    const { container } = render(<MissedResolutionSection weekly={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('returns null when weekly is undefined', () => {
    const { container } = render(<MissedResolutionSection />);
    expect(container.firstChild).toBeNull();
  });

  test('renders section title and methodology tooltip trigger', () => {
    render(<MissedResolutionSection weekly={buildWeekly()} />);
    expect(screen.getByText('Late Resolver Analysis')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /how this is computed/i })).toBeInTheDocument();
  });

  test('renders overview KPI row with all-group headline values', () => {
    render(<MissedResolutionSection weekly={buildWeekly()} />);
    // 4.1% appears in the KPI tile and again in the underlying-data table
    expect(screen.getAllByText('4.1%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('5/123')).toBeInTheDocument();      // hits/n
    expect(screen.getByText('25 min')).toBeInTheDocument();     // median time to hit
  });

  test('retraction is not surfaced in the KPI row or group cards', () => {
    render(<MissedResolutionSection weekly={buildWeekly()} />);
    expect(screen.queryByText('Median Retraction')).not.toBeInTheDocument();
    expect(screen.queryByText(/median retraction/i)).not.toBeInTheDocument();
    // The pts unit should not appear anywhere in this section.
    expect(screen.queryByText(/\bpts\b/)).not.toBeInTheDocument();
  });

  test('renders low-sample copy when a group falls below minSample', () => {
    render(<MissedResolutionSection weekly={buildWeekly()} />);
    // bearish|midday n=5, minSample=8
    expect(screen.getByText('low sample (5/8)')).toBeInTheDocument();
  });

  test('renders window subtitle and low-sample footer', () => {
    render(<MissedResolutionSection weekly={buildWeekly()} />);
    // Timeframe subtitle at the top.
    expect(screen.getByText(/Last 18 trading sessions/)).toBeInTheDocument();
    expect(screen.getByText(/123 late of 132 total targets/)).toBeInTheDocument();
    expect(screen.getByText(/92\.6%/)).toBeInTheDocument();
    expect(screen.getByText(/took > 5 min to first resolve/)).toBeInTheDocument();
    // Standalone low-sample note at the bottom.
    expect(screen.getByText(/Groups below n=8 shown as low sample\./)).toBeInTheDocument();
  });

  test('renders all six session groups when present', () => {
    render(<MissedResolutionSection weekly={buildWeekly()} />);
    expect(screen.getByText(/Bull · Morning/)).toBeInTheDocument();
    expect(screen.getByText(/Bull · Midday/)).toBeInTheDocument();
    expect(screen.getByText(/Bull · Afternoon/)).toBeInTheDocument();
    expect(screen.getByText(/Bear · Morning/)).toBeInTheDocument();
    expect(screen.getByText(/Bear · Midday/)).toBeInTheDocument();
    expect(screen.getByText(/Bear · Afternoon/)).toBeInTheDocument();
  });

  test('skips a session group when the backend omits it', () => {
    const weekly = buildWeekly();
    delete weekly.lateResolverStats.groups['bullish|afternoon'];
    render(<MissedResolutionSection weekly={weekly} />);
    expect(screen.queryByText(/Bull · Afternoon/)).not.toBeInTheDocument();
    expect(screen.getByText(/Bull · Morning/)).toBeInTheDocument();
  });

  test('handles all-zero-hits state without crashing', () => {
    const weekly = buildWeekly();
    weekly.lateResolverStats.groups.all = groupNoHits({ n: 55 });
    weekly.lateResolverStats.groups.bullish = groupNoHits({ n: 26 });
    weekly.lateResolverStats.groups.bearish = groupNoHits({ n: 29 });
    render(<MissedResolutionSection weekly={weekly} />);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});
