import { render, screen } from '@testing-library/react';
import WeeklyDailyLog from './WeeklyDailyLog';

const weekDates = ['2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12'];
const rangeData = [
  { rawPayload: { alertDate: '2026-06-08', targetsCreated: '8', targetsReached: '7', targetMedianTime: '5.0 mins', medianRetraction: '6.1 pts' } },
  { rawPayload: { alertDate: '2026-06-09', targetsCreated: '10', targetsReached: '9', targetMedianTime: '7.2 mins', medianRetraction: '9.0 pts' } },
  // 06-10, 06-11 missing (no session)
  { rawPayload: { alertDate: '2026-06-12', targetsCreated: '5', targetsReached: '4', targetMedianTime: '4.0 mins', medianRetraction: '12.5 pts' } },
];

describe('WeeklyDailyLog', () => {
  it('renders one row per weekday with created, hit and accuracy', () => {
    render(<WeeklyDailyLog rangeData={rangeData} weekDates={weekDates} />);
    expect(screen.getByText(/Mon 06\/08/)).toBeInTheDocument();
    expect(screen.getByText(/Fri 06\/12/)).toBeInTheDocument();
    // 7/8 = 87.5%
    expect(screen.getByText('87.5%')).toBeInTheDocument();
    // 4/5 = 80.0%
    expect(screen.getByText('80.0%')).toBeInTheDocument();
  });

  it('shows median time and median retraction per day', () => {
    render(<WeeklyDailyLog rangeData={rangeData} weekDates={weekDates} />);
    expect(screen.getByText('5.0 mins')).toBeInTheDocument();
    expect(screen.getByText('6.1 pts')).toBeInTheDocument();
    expect(screen.getByText('12.5 pts')).toBeInTheDocument();
  });

  it('shows "no session" for days with no data', () => {
    render(<WeeklyDailyLog rangeData={rangeData} weekDates={weekDates} />);
    expect(screen.getAllByText('no session').length).toBe(2); // 06-10 and 06-11
  });

  it('hides the Day Type column when no row has a noteworthy dayContext', () => {
    render(<WeeklyDailyLog rangeData={rangeData} weekDates={weekDates} />);
    expect(screen.queryByRole('columnheader', { name: 'Day Type' })).not.toBeInTheDocument();
  });

  it('shows the Day Type column when at least one day has dayContext', () => {
    const withDayContext = [
      ...rangeData,
      { rawPayload: { alertDate: '2026-06-10', targetsCreated: '6', targetsReached: '5', targetMedianTime: '8.0 mins', medianRetraction: '7.0 pts',
        dayContext: { classification: 'macro_event', eventTags: ['cpi'], severity: 'high' } } },
    ];
    render(<WeeklyDailyLog rangeData={withDayContext} weekDates={weekDates} />);
    expect(screen.getByRole('columnheader', { name: 'Day Type' })).toBeInTheDocument();
    expect(screen.getByText('Macro Event · CPI · high severity')).toBeInTheDocument();
  });
});
