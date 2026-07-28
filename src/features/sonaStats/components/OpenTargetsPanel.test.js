import { render, screen } from '@testing-library/react';
import OpenTargetsPanel from './OpenTargetsPanel';
import { BULLISH_COLOR } from '../utils/sonaStatsConstants';

const genTs = Math.floor(Date.now() / 1000) - 5 * 60; // generated 5 min ago

const openTarget = {
  alertId: 'a1',
  colorHighlight: BULLISH_COLOR,
  targetPrice: '21450.25',
  targetReached: false,
  closeTimestamp: String(genTs),
  bucketContext: {
    direction: 'bullish',
    session: 'morning',
    level: 'direction+session',
    matched: 'bullish|morning',
    hitRate: 90,
    medianTimeMin: 6,
    medianRetraction: 5,
    p25Retraction: 4,
    p75Retraction: 8,
  },
};
const resolvedTarget = { alertId: 'a2', colorHighlight: BULLISH_COLOR, targetPrice: '21500', targetReached: true };
const openNoCtx = { alertId: 'a3', colorHighlight: 16711680, targetPrice: '21400', targetReached: false, closeTimestamp: String(genTs), bucketContext: null };
// Opened 10:00 AM ET on a fixed past weekday → its 4:00 PM close is always in
// the past, so the freeze is deterministic regardless of when tests run.
const closedUnhitTarget = {
  alertId: 'a4',
  colorHighlight: 16711680,
  targetPrice: '21380',
  targetReached: false,
  closeTimestamp: String(Math.floor(new Date('2025-01-15T15:00:00Z').getTime() / 1000)), // 10:00 AM ET
  bucketContext: { hitRate: 80, medianTimeMin: 5, medianRetraction: 6, p25Retraction: 4, p75Retraction: 9 },
};
// Live (open) target carrying the backend `live` block → distance + retraction line.
const liveOpenTarget = {
  alertId: 'a5',
  colorHighlight: 16711680,
  targetPrice: '30631.75',
  targetReached: false,
  closeTimestamp: String(genTs),
  bucketContext: { hitRate: 100, medianTimeMin: 5, medianRetraction: 32.8, p25Retraction: 15.6, p75Retraction: 144.7 },
  live: { status: 'open', minutesOpen: 12, marketClosed: false, pointsToTarget: 12.5, distanceDirection: 'fall', retractionSoFar: 22, retractionVsTypical: 'normal', typicalRetraction: 32.8 },
};
// Live target frozen at close → "retraced X before close" retrospective.
const liveClosedTarget = {
  alertId: 'a6',
  colorHighlight: 16711680,
  targetPrice: '30631.75',
  targetReached: false,
  closeTimestamp: String(genTs),
  bucketContext: { hitRate: 100, medianTimeMin: 5, medianRetraction: 32.8, p25Retraction: 15.6, p75Retraction: 144.7 },
  live: { status: 'closed-unhit', minutesOpen: 385, marketClosed: true, retractionSoFar: 40, retractionVsTypical: 'deeper', typicalRetraction: 32.8 },
};

describe('OpenTargetsPanel', () => {
  it('shows only open targets with their endgame context', () => {
    render(<OpenTargetsPanel targets={[openTarget, resolvedTarget]} isSessionLive />);
    expect(screen.getByText('21450.25')).toBeInTheDocument();
    expect(screen.queryByText('21500')).not.toBeInTheDocument(); // resolved excluded
    // context line, basis label reflects the matched bucket
    expect(screen.getByText(/Bullish morning targets/)).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText(/typically hits within ~6 min/)).toBeInTheDocument();
  });

  it('degrades gracefully when a target has no context yet', () => {
    render(<OpenTargetsPanel targets={[openNoCtx]} isSessionLive={false} />);
    expect(screen.getByText(/No recent baseline yet/)).toBeInTheDocument();
  });

  it('freezes the clock at the bell for a target left open at close', () => {
    render(<OpenTargetsPanel targets={[closedUnhitTarget]} isSessionLive={false} />);
    // Clock stops at 360 min (10:00 AM → 4:00 PM), labeled market closed.
    expect(screen.getByText(/Open 360 min/)).toBeInTheDocument();
    expect(screen.getByText(/market closed/)).toBeInTheDocument();
    // Frozen targets don't show "typically hits" or "running long".
    expect(screen.queryByText(/typically hits within/)).not.toBeInTheDocument();
    expect(screen.queryByText(/running long/)).not.toBeInTheDocument();
  });

  it('shows live distance and retraction vs typical while open', () => {
    render(<OpenTargetsPanel targets={[liveOpenTarget]} isSessionLive />);
    expect(screen.getByText(/12\.5 pts/)).toBeInTheDocument();
    expect(screen.getByText(/to fall/)).toBeInTheDocument();
    expect(screen.getByText(/retraced/)).toBeInTheDocument();
    expect(screen.getByText(/22 pts/)).toBeInTheDocument();
    expect(screen.getByText(/\(normal\)/)).toBeInTheDocument();
  });

  it('shows the retrace-before-close retrospective for a frozen target', () => {
    render(<OpenTargetsPanel targets={[liveClosedTarget]} isSessionLive={false} />);
    expect(screen.getByText(/Retraced/)).toBeInTheDocument();
    expect(screen.getByText(/40 pts/)).toBeInTheDocument();
    expect(screen.getByText(/before close/)).toBeInTheDocument();
    expect(screen.getByText(/deeper than usual/)).toBeInTheDocument();
    expect(screen.getByText(/Open 385 min/)).toBeInTheDocument();
    expect(screen.getByText('Unresolved')).toBeInTheDocument();
  });

  it('handles no open targets', () => {
    render(<OpenTargetsPanel targets={[resolvedTarget]} isSessionLive={false} />);
    expect(screen.getByText(/No open targets right now/)).toBeInTheDocument();
  });
});
