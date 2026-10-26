import { fireEvent, render, screen } from '@testing-library/react';
import WeeklyRetractionSummary from './WeeklyRetractionSummary';

const bucketStats = {
  groups: {
    all: { n: 110, medianDrift: 9, p25Drift: 4, p75Drift: 15, p90Drift: 32 },
  },
};

const weekBucketStats = {
  groups: {
    all: { n: 28, medianDrift: 6, p25Drift: 3, p75Drift: 11, p90Drift: 22 },
  },
};

describe('WeeklyRetractionSummary', () => {
  it('renders the three tiles from the pooled bucketStats', () => {
    render(<WeeklyRetractionSummary bucketStats={bucketStats} />);
    expect(screen.getByText(/Retraction Summary/i)).toBeInTheDocument();
    expect(screen.getByText('9 pts')).toBeInTheDocument(); // typical
    expect(screen.getByText('4 – 15 pts')).toBeInTheDocument(); // usual range
    expect(screen.getByText('32 pts')).toBeInTheDocument(); // outlier
    // Rolling subtitle by default
    expect(screen.getByText(/last 20 sessions/i)).toBeInTheDocument();
  });

  it('does not show the scope toggle when weekBucketStats is absent', () => {
    render(<WeeklyRetractionSummary bucketStats={bucketStats} />);
    expect(screen.queryByRole('group', { name: /retraction summary scope/i })).not.toBeInTheDocument();
  });

  it('toggles to the "this week only" scope when weekBucketStats is provided', () => {
    render(<WeeklyRetractionSummary bucketStats={bucketStats} weekBucketStats={weekBucketStats} />);
    const weekBtn = screen.getByRole('button', { name: /this week only/i });
    fireEvent.click(weekBtn);
    expect(screen.getByText('6 pts')).toBeInTheDocument();
    expect(screen.getByText('3 – 11 pts')).toBeInTheDocument();
    expect(screen.getByText('22 pts')).toBeInTheDocument();
    expect(screen.getByText(/this week \(5 sessions\)/i)).toBeInTheDocument();
  });

  it('shows a friendly placeholder when bucketStats is missing', () => {
    render(<WeeklyRetractionSummary bucketStats={null} />);
    expect(screen.getByText(/regenerate this week's stats doc/i)).toBeInTheDocument();
  });
});
