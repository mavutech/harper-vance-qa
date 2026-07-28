import { render, screen } from '@testing-library/react';
import WeeklyKpiCards from './WeeklyKpiCards';

const weekly = {
  targetsCreatedSum: 37,
  targetsReachedSum: 32,
  targetAccuracyOverall: '86.5% Accuracy',
  targetAccuracySum: '88.1% Accuracy',
  targetMedianTimeWeek: '3.0 mins',
  targetAvgTimeSum: '6.8 mins',
  trailingStats: { hitRate: '83.3', medianTimeAvg: '5.0', medianRetractionAvg: '15.0' },
  bucketStats: { sessions: 20, groups: { bullish: { hitRate: 80 }, bearish: { hitRate: 90 }, all: { n: 140, hits: 118, pctWithin10: 35 } } },
};
const direction = { bullishAcc: 85, bearishAcc: 88.2, bullishCreated: 20, bullishHit: 17, bearishCreated: 17, bearishHit: 15 };

describe('WeeklyKpiCards field mapping', () => {
  it('shows the volume-weighted accuracy as the headline', () => {
    render(<WeeklyKpiCards weekly={weekly} weeklyDirection={direction} />);
    expect(screen.getByText('86.5% Accuracy')).toBeInTheDocument();
  });

  it('leads the time tile with the median', () => {
    render(<WeeklyKpiCards weekly={weekly} weeklyDirection={direction} />);
    expect(screen.getByText('3.0 mins')).toBeInTheDocument();
  });

  it('shows the direction hit counts on the bullish/bearish tiles', () => {
    render(<WeeklyKpiCards weekly={weekly} weeklyDirection={direction} />);
    expect(screen.getByText('17/20 hit')).toBeInTheDocument();
    expect(screen.getByText('15/17 hit')).toBeInTheDocument();
  });

  it('shows this-week vs 20-session comparisons when a baseline exists', () => {
    render(<WeeklyKpiCards weekly={weekly} weeklyDirection={direction} />);
    // accuracy 86.5 vs 83.3 -> +3.2 favorable
    expect(screen.getByText(/3\.2% vs 20-session avg/)).toBeInTheDocument();
    // time 3.0 vs 5.0 -> 2.0 min faster (favorable)
    expect(screen.getByText(/2\.0 min vs 20-session avg/)).toBeInTheDocument();
    // bullish 85 vs 80 -> 5.0; bearish 88.2 vs 90 -> 1.8
    expect(screen.getByText(/5\.0% vs 20-session avg/)).toBeInTheDocument();
    expect(screen.getByText(/1\.8% vs 20-session avg/)).toBeInTheDocument();
    // volume: created 37 vs 140/20*5=35 typical; hits 32 vs 118/20*5≈30 typical
    expect(screen.getByText(/vs 35 in a typical week/)).toBeInTheDocument();
    expect(screen.getByText(/vs 30 in a typical week/)).toBeInTheDocument();
  });

  it('suppresses comparisons on a small-sample week', () => {
    const coverage = { daysCovered: 3, daysExpected: 5, totalTargets: 8, partialWeek: true, smallSample: true };
    render(<WeeklyKpiCards weekly={weekly} weeklyDirection={direction} coverage={coverage} />);
    expect(screen.queryByText(/vs 20-session avg/)).not.toBeInTheDocument();
    // but the coverage caption still shows
    expect(screen.getByText(/based on 3 of 5 sessions/)).toBeInTheDocument();
    expect(screen.getByText(/n=8 \(small sample\)/)).toBeInTheDocument();
  });

  it('omits the coverage caption on a full, well-sampled week', () => {
    const coverage = { daysCovered: 5, daysExpected: 5, totalTargets: 37, partialWeek: false, smallSample: false };
    render(<WeeklyKpiCards weekly={weekly} weeklyDirection={direction} coverage={coverage} />);
    expect(screen.queryByText(/based on .* sessions/)).not.toBeInTheDocument();
    expect(screen.queryByText(/small sample/)).not.toBeInTheDocument();
  });

  it('falls back to placeholders when the weekly doc is missing', () => {
    render(<WeeklyKpiCards weekly={null} weeklyDirection={{ bullishAcc: null, bearishAcc: null }} />);
    expect(screen.getAllByText('N/A').length).toBeGreaterThanOrEqual(4);
  });
});
