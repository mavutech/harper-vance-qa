import { render, screen } from '@testing-library/react';
import WeeklyMedianRetractionChart from './WeeklyMedianRetractionChart';

// ReactApexChart pulls in ResizeObserver / canvas APIs jsdom doesn't have.
// Stub it so the assertions can focus on the wrapper card behaviour.
jest.mock('react-apexcharts', () => (props) => (
  <div data-testid="apex-chart" data-series={JSON.stringify(props.series)} />
));

const weekDates = ['2026-06-29', '2026-06-30', '2026-07-01', '2026-07-02', '2026-07-03'];

const dailyDoc = (date, median, p25, p75) => ({
  rawPayload: {
    alertDate: date,
    medianRetraction: median,
    p25Retraction: p25,
    p75Retraction: p75,
  },
});

describe('WeeklyMedianRetractionChart', () => {
  it('renders the chart when at least one day has a median retraction', () => {
    const rangeData = [
      dailyDoc('2026-06-29', '5.0 pts', '2.0 pts', '10.0 pts'),
      dailyDoc('2026-07-01', '3.5 pts', '2.0 pts', '15.7 pts'),
    ];
    render(<WeeklyMedianRetractionChart rangeData={rangeData} weekDates={weekDates} />);
    expect(screen.getByText(/Median Retraction per Day/i)).toBeInTheDocument();
    const chart = screen.getByTestId('apex-chart');
    const series = JSON.parse(chart.getAttribute('data-series'));
    // Two series: rangeArea band then median line
    expect(series).toHaveLength(2);
    expect(series[0].type).toBe('rangeArea');
    expect(series[1].type).toBe('line');
    // 5 weekday buckets, with Mon and Wed populated, rest gaps
    expect(series[1].data).toHaveLength(5);
    expect(series[1].data[0].y).toBe(5); // Mon
    expect(series[1].data[1].y).toBeNull(); // Tue no data
    expect(series[1].data[2].y).toBe(3.5); // Wed
    // Band [low, high] present for Mon, [null, null] for missing days
    expect(series[0].data[0].y).toEqual([2, 10]);
    expect(series[0].data[1].y).toEqual([null, null]);
  });

  it('handles the "N/A" string as a gap without breaking the chart', () => {
    const rangeData = [
      dailyDoc('2026-06-29', '5.0 pts', '2.0 pts', '10.0 pts'),
      dailyDoc('2026-06-30', 'N/A', 'N/A', 'N/A'),
    ];
    render(<WeeklyMedianRetractionChart rangeData={rangeData} weekDates={weekDates} />);
    const series = JSON.parse(screen.getByTestId('apex-chart').getAttribute('data-series'));
    expect(series[1].data[1].y).toBeNull();
    expect(series[0].data[1].y).toEqual([null, null]);
  });

  it('shows a friendly placeholder when no day in the week has a hit', () => {
    render(<WeeklyMedianRetractionChart rangeData={[]} weekDates={weekDates} />);
    expect(screen.getByText(/no retraction data yet this week/i)).toBeInTheDocument();
    expect(screen.queryByTestId('apex-chart')).not.toBeInTheDocument();
  });
});
