import { render, screen } from '@testing-library/react';
import WeeklyBucketGrid from './WeeklyBucketGrid';

const bucketStats = {
  minSample: 15,
  groups: {
    'bullish|morning': { n: 30, hitRate: 80, medianDrift: 5, p25Drift: 4, p75Drift: 6 },
    'bullish|midday': { n: 4, hitRate: 67, medianDrift: 10 },        // thin
    'bullish|afternoon': { n: 20, hitRate: 90, medianDrift: 9 },
    'bearish|morning': { n: 18, hitRate: 75, medianDrift: 7 },
    'bearish|midday': { n: 16, hitRate: 66, medianDrift: 15 },
    'bearish|afternoon': { n: 22, hitRate: 70, medianDrift: 20 },
    bullish: { n: 54, hitRate: 84, medianDrift: 7 },
    bearish: { n: 56, hitRate: 71, medianDrift: 14 },
    all: { n: 110, hitRate: 78, medianDrift: 9 },
  },
};

describe('WeeklyBucketGrid', () => {
  it('renders all six type cells plus the fallback rows', () => {
    render(<WeeklyBucketGrid bucketStats={bucketStats} />);
    expect(screen.getByText(/bullish · Morning/i)).toBeInTheDocument();
    expect(screen.getByText(/bearish · Afternoon/i)).toBeInTheDocument();
    expect(screen.getByText(/bullish \(any time\)/i)).toBeInTheDocument();
    expect(screen.getByText(/All targets/i)).toBeInTheDocument();
    // a hit rate and a drift band render
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText(/~5 pts \(4 to 6\)/)).toBeInTheDocument();
  });

  it('flags a thin cell (below the minimum sample)', () => {
    render(<WeeklyBucketGrid bucketStats={bucketStats} />);
    expect(screen.getAllByText(/thin/i).length).toBeGreaterThanOrEqual(1);
  });

  it('shows a friendly placeholder when there is no bucket data yet', () => {
    render(<WeeklyBucketGrid bucketStats={null} />);
    expect(screen.getByText(/regenerate this week’s stats doc/i)).toBeInTheDocument();
  });
});
