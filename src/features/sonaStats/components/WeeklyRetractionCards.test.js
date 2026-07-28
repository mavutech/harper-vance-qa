import { render, screen } from '@testing-library/react';
import WeeklyRetractionCards from './WeeklyRetractionCards';

const weekly = {
  medianRetraction: '18.4 pts',
  avgRetraction: '46.1 pts',
  p25Retraction: '8.5 pts',
  p75Retraction: '42.0 pts',
  p90Retraction: '75.3 pts',
  maxRetraction: '290.5 pts',
  pctHitWithin10pts: '40.6%',
  bestDay: 'Thu 06/11 (100.0%)',
  worstDay: 'Fri 06/12 (80.0%)',
  trailingStats: { medianRetractionAvg: '15.0' },
  bucketStats: { groups: { all: { pctWithin10: 35, p25Drift: 7.2, p75Drift: 38.5, p90Drift: 68.0 } } },
};

describe('WeeklyRetractionCards field mapping', () => {
  it('maps each weekly field to its tile', () => {
    render(<WeeklyRetractionCards weekly={weekly} />);
    expect(screen.getByText('18.4 pts')).toBeInTheDocument();          // typical retraction (median)
    expect(screen.getByText('8.5 – 42.0 pts')).toBeInTheDocument();    // usual range (p25 – p75)
    expect(screen.getByText('75.3 pts')).toBeInTheDocument();          // deep retraction (p90)
    expect(screen.getByText('290.5 pts')).toBeInTheDocument();         // deepest retraction (max)
    expect(screen.getByText('40.6%')).toBeInTheDocument();             // shallow retraction (within 10 pts)
    expect(screen.getByText('Thu 06/11 (100.0%)')).toBeInTheDocument();
    expect(screen.getByText('Fri 06/12 (80.0%)')).toBeInTheDocument();
  });

  it('shows a neutral this-week vs 20-session retraction comparison', () => {
    render(<WeeklyRetractionCards weekly={weekly} />);
    // 18.4 vs 15.0 -> 3.4 pts, neutral tone
    expect(screen.getByText(/3\.4 pts vs 20-session avg/)).toBeInTheDocument();
  });

  it('shows the 20-session usual-range sub-line under the middle-50% tile', () => {
    render(<WeeklyRetractionCards weekly={weekly} />);
    expect(screen.getByText(/20-session avg: 7\.2 – 38\.5 pts/)).toBeInTheDocument();
  });

  it('shows a neutral this-week vs 20-session comparison on the deep-retraction tile', () => {
    render(<WeeklyRetractionCards weekly={weekly} />);
    // 75.3 vs 68.0 -> 7.3 pts, neutral tone
    expect(screen.getByText(/7\.3 pts vs 20-session avg/)).toBeInTheDocument();
  });

  it('labels the tiles in retraction terms (no entry/drift wording)', () => {
    render(<WeeklyRetractionCards weekly={weekly} />);
    expect(screen.getByText(/Typical Retraction/)).toBeInTheDocument();
    expect(screen.getByText(/Usual Range \(middle 50%\)/)).toBeInTheDocument();
    expect(screen.getByText(/Deep Retraction \(1 in 10\)/)).toBeInTheDocument();
    expect(screen.getByText(/Deepest Retraction/)).toBeInTheDocument();
    expect(screen.getByText(/Shallow Retraction \(≤10 pts\)/)).toBeInTheDocument();
    expect(screen.queryByText(/entry/i)).not.toBeInTheDocument();
    // "drift" appears only in tile sub-copy referring to the pooled baseline;
    // headline labels stay in retraction terms.
  });

  it('hides comparisons on a thin week', () => {
    render(<WeeklyRetractionCards weekly={weekly} coverage={{ smallSample: true }} />);
    expect(screen.queryByText(/vs 20-session avg/)).not.toBeInTheDocument();
  });

  it('falls back to placeholders when the weekly doc is missing', () => {
    render(<WeeklyRetractionCards weekly={null} />);
    // Typical, Usual Range, Deep, Deepest, Shallow, Best, Worst -> 7 tiles all N/A.
    expect(screen.getAllByText('N/A').length).toBe(7);
  });
});

