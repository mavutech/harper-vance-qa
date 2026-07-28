import { render, screen } from '@testing-library/react';
import TargetSessionKpis from './TargetSessionKpis';
import { BULLISH_COLOR } from '../utils/sonaStatsConstants';

// 5 hit, 2 open → 7 created, 71.4% accuracy.
const mk = (id, hit) => ({ alertId: id, colorHighlight: BULLISH_COLOR, targetReached: hit });
const targets = [mk('1', true), mk('2', true), mk('3', true), mk('4', true), mk('5', true), mk('6', false), mk('7', false)];

describe('TargetSessionKpis', () => {
  it('labels open targets as Unresolved after close and keeps hit/created accuracy', () => {
    render(<TargetSessionKpis targets={targets} isSessionLive={false} />);
    expect(screen.getByText('Unresolved')).toBeInTheDocument();
    expect(screen.queryByText('Open Targets')).not.toBeInTheDocument();
    expect(screen.getByText('71.4%')).toBeInTheDocument();
    expect(screen.getByText('5 of 7 hit')).toBeInTheDocument();
    expect(screen.getByText(/Ended 4:00 PM ET/)).toBeInTheDocument();
  });

  it('labels open targets as Open Targets while the session is live', () => {
    render(<TargetSessionKpis targets={targets} isSessionLive />);
    expect(screen.getByText('Open Targets')).toBeInTheDocument();
    expect(screen.queryByText('Unresolved')).not.toBeInTheDocument();
  });
});
