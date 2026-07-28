import { render, screen, fireEvent } from '@testing-library/react';
import UnderlyingDataTable from './UnderlyingDataTable';
import { useMissedTargetsResolution } from '../hooks/useMissedTargetsResolution';
import { useMissedTargetsSnapshot } from '../hooks/useMissedTargetsSnapshot';

jest.mock('../hooks/useMissedTargetsResolution');
jest.mock('../hooks/useMissedTargetsSnapshot');

const weekly = {
  lateResolverStats: {
    // Groups intentionally minimal — snapshot tab no longer renders them.
    groups: { all: { eventualHitRate: 0, hits: 0, n: 0, neverResolved: 0 } },
    minSample: 8,
    thresholdMin: 5,
    share: 0,
    totalLate: 0,
    totalTargets: 0,
    windowSessions: 20,
  },
};

const mockResolutionHook = (value = {}) => {
  useMissedTargetsResolution.mockReturnValue({
    missedThisWeek: [],
    resolvedThisWeek: [],
    loading: false,
    error: null,
    windowSessions: 20,
    windowStartDate: '2026-07-06',
    windowEndDate: '2026-07-24',
    ...value,
  });
};

const mockSnapshotHook = (value = {}) => {
  useMissedTargetsSnapshot.mockReturnValue({
    filledByEndOfWeek: [],
    openAtEndOfWeek: [],
    loading: false,
    error: null,
    windowSessions: 20,
    windowStartDate: '2026-07-06',
    windowEndDate: '2026-07-24',
    asOfDate: '2026-07-24',
    ...value,
  });
};

// 2026-07-20 14:00 UTC = 10:00 EDT
const ORIGIN_EPOCH = Math.floor(Date.UTC(2026, 6, 20, 14, 0, 0) / 1000);
// 2026-07-22 17:35 UTC = 13:35 EDT
const RESOLVED_EPOCH = Math.floor(Date.UTC(2026, 6, 22, 17, 35, 0) / 1000);

const missedInWeekRow = (overrides = {}) => ({
  alertId: 'a1',
  originDate: '2026-07-20',
  dateTimestamp: String(ORIGIN_EPOCH),
  direction: 'bullish',
  targetPriceNum: 21525,
  resolved: false,
  sessionsElapsed: 4,
  ...overrides,
});

const filledLaterRow = (overrides = {}) => ({
  alertId: 'a2',
  originDate: '2026-07-20',
  dateTimestamp: String(ORIGIN_EPOCH),
  direction: 'bearish',
  targetPriceNum: 21200,
  resolved: true,
  resolvedAtEpoch: RESOLVED_EPOCH,
  resolvedOnDate: '2026-07-22',
  resolvedPreMarket: false,
  sessionsToResolve: 2,
  minutesToResolve: 3575,
  ...overrides,
});

const resolvedFromPriorOriginRow = (overrides = {}) => ({
  alertId: 'b1',
  originDate: '2026-07-14',
  dateTimestamp: '1784397600',
  direction: 'bullish',
  targetPriceNum: 21600,
  resolved: true,
  resolvedAtEpoch: RESOLVED_EPOCH,
  resolvedOnDate: '2026-07-22',
  resolvedPreMarket: true,
  sessionsToResolve: 5,
  minutesToResolve: 10000,
  ...overrides,
});

const snapshotFilledRow = (overrides = {}) => ({
  alertId: 's1',
  originDate: '2026-07-08',
  dateTimestamp: String(ORIGIN_EPOCH),
  direction: 'bullish',
  targetPriceNum: 21600,
  resolved: true,
  resolvedAtEpoch: RESOLVED_EPOCH,
  resolvedOnDate: '2026-07-22',
  resolvedPreMarket: true,
  sessionsToResolve: 10,
  minutesToResolve: 20000,
  ...overrides,
});

const snapshotOpenRow = (overrides = {}) => ({
  alertId: 's2',
  originDate: '2026-07-15',
  dateTimestamp: String(ORIGIN_EPOCH),
  direction: 'bearish',
  targetPriceNum: 21100,
  resolved: false,
  sessionsElapsed: 7,
  ...overrides,
});

describe('UnderlyingDataTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolutionHook();
    mockSnapshotHook();
  });

  test('returns null when there is no lateResolverStats data', () => {
    const { container } = render(<UnderlyingDataTable weekly={null} />);
    expect(container.firstChild).toBeNull();
  });

  // ─── Missed target resolution tab (default) ────────────────────────────────

  test('renders missed target resolution as the default view', () => {
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    expect(screen.getByRole('heading', { name: /missed target resolution/i })).toBeInTheDocument();
    expect(screen.getByText(/per-target reconciliation of misses/i)).toBeInTheDocument();
  });

  test('resolution tab passes week boundaries to its hook', () => {
    render(
      <UnderlyingDataTable
        weekly={weekly}
        weekStartDate="2026-07-20"
        weekEndDate="2026-07-24"
      />
    );
    expect(useMissedTargetsResolution).toHaveBeenCalledWith('2026-07-20', '2026-07-24', 20);
  });

  test('resolution tab shows loading state', () => {
    mockResolutionHook({ loading: true });
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    expect(screen.getByText(/loading missed target resolution/i)).toBeInTheDocument();
  });

  test('resolution tab shows error state', () => {
    mockResolutionHook({ error: 'Firebase read failed' });
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    expect(screen.getByText(/firebase read failed/i)).toBeInTheDocument();
  });

  test('resolution tab shows empty-state copy for both panels when no data', () => {
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    expect(
      screen.getByText(/no targets originated in the selected week/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no prior-origin misses resolved/i)
    ).toBeInTheDocument();
  });

  test('resolution tab surfaces summary tiles: missed, resolved, fill rate, and week ending', () => {
    mockResolutionHook({
      missedThisWeek: [missedInWeekRow(), filledLaterRow()],
      resolvedThisWeek: [resolvedFromPriorOriginRow()],
    });
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    expect(screen.getAllByText('Missed this week').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Resolved this week (prior origins)').length).toBeGreaterThan(0);
    // 1 filled of 2 in-week misses → 50.0%.
    const fillRateTile = screen.getByText('Fill rate (this week)').parentElement;
    expect(fillRateTile.textContent).toMatch(/50\.0%/);
    const weekEndingTile = screen.getByText('Week ending').parentElement;
    expect(weekEndingTile.textContent).toMatch(/2026-07-24/);
    // Old tiles retired.
    expect(screen.queryByText('…filled later')).not.toBeInTheDocument();
    expect(screen.queryByText('Review window')).not.toBeInTheDocument();
  });

  test('resolution tab shows em-dash fill rate when there are no in-week misses', () => {
    mockResolutionHook({
      missedThisWeek: [],
      resolvedThisWeek: [resolvedFromPriorOriginRow()],
    });
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    const fillRateTile = screen.getByText('Fill rate (this week)').parentElement;
    expect(fillRateTile.textContent).toMatch(/—/);
  });

  test('resolution tab subtitle points at the selected week rather than the 20-session window', () => {
    mockResolutionHook();
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    expect(
      screen.getByText(/focused on the selected week/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/prior origins from the last 20 sessions/i)
    ).toBeInTheDocument();
  });

  test('missed-this-week rows show Filled badge and fill timestamp when resolved', () => {
    mockResolutionHook({ missedThisWeek: [filledLaterRow()] });
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    expect(screen.getAllByText('Filled').length).toBeGreaterThan(0);
    expect(screen.getByText(/^Jul 22 · \d\d:\d\d$/)).toBeInTheDocument();
    // Combined "Filled Jul 22 …" string is retired in favor of the shared
    // column shape (Status badge + Fill date/time + Time to resolve).
    expect(screen.queryByText(/^Filled Jul 22/)).not.toBeInTheDocument();
  });

  test('missed-this-week rows show Open badge and em-dashes when unresolved', () => {
    mockResolutionHook({ missedThisWeek: [missedInWeekRow({ sessionsElapsed: 3 })] });
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    expect(screen.getAllByText('Open').length).toBeGreaterThan(0);
    // Both fill date/time and time-to-resolve slots render em-dash.
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
    // Combined "Still open · N sessions elapsed" string is retired.
    expect(screen.queryByText(/Still open ·/i)).not.toBeInTheDocument();
  });

  test('resolved-this-week rows show resolved-at and time-to-resolve', () => {
    mockResolutionHook({ resolvedThisWeek: [resolvedFromPriorOriginRow()] });
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    expect(screen.getByText('Time to resolve')).toBeInTheDocument();
    // Time to resolve is now day-based wall-clock only.
    expect(screen.getByText('6d 22h')).toBeInTheDocument();
    expect(screen.getByText(/^Jul 22 · \d\d:\d\d$/)).toBeInTheDocument();
  });

  test.each([
    [42, '42m'],
    [125, '2h 5m'],
    [180, '3h'],
    [4045, '2d 19h'],
    [24 * 60, '1d'],
  ])('renders day-based wall-clock in the time-to-resolve cell for minutesToResolve=%p', (minutes, cellText) => {
    mockResolutionHook({
      resolvedThisWeek: [resolvedFromPriorOriginRow({ minutesToResolve: minutes })],
    });
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    expect(screen.getByText(cellText)).toBeInTheDocument();
  });

  // ─── Missed targets snapshot tab ───────────────────────────────────────────

  test('switching to the snapshot tab renders the snapshot heading and description', () => {
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    fireEvent.click(screen.getByRole('button', { name: /missed targets snapshot/i }));
    expect(screen.getByRole('heading', { name: /missed targets snapshot/i })).toBeInTheDocument();
    expect(screen.getByText(/point-in-time snapshot of every miss/i)).toBeInTheDocument();
  });

  test('snapshot tab subtitle mentions status as of selected week end', () => {
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    fireEvent.click(screen.getByRole('button', { name: /missed targets snapshot/i }));
    expect(screen.getByText(/status as of selected week end/i)).toBeInTheDocument();
  });

  test('snapshot tab passes weekEndDate and windowSessions to its hook', () => {
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    fireEvent.click(screen.getByRole('button', { name: /missed targets snapshot/i }));
    expect(useMissedTargetsSnapshot).toHaveBeenCalledWith('2026-07-24', 20);
  });

  test('snapshot tab shows loading state', () => {
    mockSnapshotHook({ loading: true });
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    fireEvent.click(screen.getByRole('button', { name: /missed targets snapshot/i }));
    expect(screen.getByText(/loading missed targets snapshot/i)).toBeInTheDocument();
  });

  test('snapshot tab shows error state', () => {
    mockSnapshotHook({ error: 'read failed' });
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    fireEvent.click(screen.getByRole('button', { name: /missed targets snapshot/i }));
    expect(screen.getByText(/read failed/i)).toBeInTheDocument();
  });

  test('snapshot tab shows summary tiles and empty-state copy when no data', () => {
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    fireEvent.click(screen.getByRole('button', { name: /missed targets snapshot/i }));
    expect(screen.getByText('Misses in window')).toBeInTheDocument();
    // 'Filled by end of week' appears twice: once as a summary tile, once as a
    // sub-section heading. 'Still open by end of week' only shows as the
    // sub-section heading now; the third tile is the fill rate.
    expect(screen.getAllByText('Filled by end of week').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Still open by end of week')).toBeInTheDocument();
    expect(screen.getByText('Fill rate (20 sessions)')).toBeInTheDocument();
    // Empty snapshot means no misses, so fill rate reads as em-dash.
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('As of')).toBeInTheDocument();
    expect(screen.getByText('2026-07-24')).toBeInTheDocument();
    expect(
      screen.getByText(/no misses in the review window resolved by the end/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/every miss in the review window resolved by the end/i)
    ).toBeInTheDocument();
  });

  test('snapshot tab renders filled and open rows with separate status and fill-date columns', () => {
    mockSnapshotHook({
      filledByEndOfWeek: [snapshotFilledRow()],
      openAtEndOfWeek: [snapshotOpenRow()],
    });
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    fireEvent.click(screen.getByRole('button', { name: /missed targets snapshot/i }));

    // Both sub-tables render their own header row.
    expect(screen.getAllByText('Status').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fill date/time (ET)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Time to resolve').length).toBeGreaterThan(0);

    // Filled row: Filled badge + Jul 22 timestamp + pre-mkt annotation.
    expect(screen.getAllByText('Filled').length).toBeGreaterThan(0);
    expect(screen.getByText(/^Jul 22 · \d\d:\d\d$/)).toBeInTheDocument();
    // 'pre-mkt fill' appears in both the row annotation and the reconstruction footer.
    expect(screen.getAllByText(/pre-mkt fill/i).length).toBeGreaterThanOrEqual(2);

    // Open row: Open badge + em-dashes for fill and time-to-resolve.
    expect(screen.getAllByText('Open').length).toBeGreaterThan(0);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  test('snapshot tab shows the reconstruction footer explaining pre-mkt fill', () => {
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    fireEvent.click(screen.getByRole('button', { name: /missed targets snapshot/i }));
    expect(
      screen.getByText(/fills reconstructed from 5-minute candle history/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/pre-market\/opening auction bar/i)
    ).toBeInTheDocument();
  });

  test('snapshot summary tiles reflect fill rate and filled count', () => {
    mockSnapshotHook({
      filledByEndOfWeek: [snapshotFilledRow(), snapshotFilledRow({ alertId: 's3' })],
      openAtEndOfWeek: [snapshotOpenRow()],
      asOfDate: '2026-07-24',
    });
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    fireEvent.click(screen.getByRole('button', { name: /missed targets snapshot/i }));

    // Misses in window is unique to the tile.
    const missesTile = screen.getByText('Misses in window').parentElement;
    expect(missesTile.textContent).toMatch(/3/);

    // 'Filled by end of week' also shows as a sub-section heading, so scope
    // to the tile via the small-caption class.
    const filledTile = screen
      .getAllByText('Filled by end of week')
      .find((node) => node.className.includes('fs-xs'))?.parentElement;
    expect(filledTile.textContent).toMatch(/2/);

    // Fill rate: 2 of 3 = 66.7%.
    const fillRateTile = screen.getByText('Fill rate (20 sessions)').parentElement;
    expect(fillRateTile.textContent).toMatch(/66\.7%/);
  });

  // ─── Tab switching ─────────────────────────────────────────────────────────

  test('the delayed-resolution analysis tab is fully retired', () => {
    render(<UnderlyingDataTable weekly={weekly} weekStartDate="2026-07-20" weekEndDate="2026-07-24" />);
    expect(
      screen.queryByRole('button', { name: /delayed resolution analysis/i })
    ).not.toBeInTheDocument();
  });
});
