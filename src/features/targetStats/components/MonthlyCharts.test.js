import React from 'react';
import { render, screen } from '@testing-library/react';
import MonthlyCharts from './MonthlyCharts';
import fixture from './__fixtures__/monthlyReport.json';

jest.mock('react-apexcharts', () => props => <div data-testid="monthly-chart" data-series={JSON.stringify(props.series)} />);

it('renders four graphs with chart series that reconcile to the report', () => {
  render(<MonthlyCharts report={fixture} />);
  const charts = screen.getAllByTestId('monthly-chart');
  expect(charts).toHaveLength(4);
  expect(screen.getByRole('group', {name: 'Daily target accuracy'})).toBeInTheDocument();
  expect(screen.getByRole('group', {name: 'Daily target volume'})).toBeInTheDocument();
  expect(screen.getByRole('group', {name: 'Time-to-hit distribution'})).toBeInTheDocument();
  expect(screen.getByRole('group', {name: 'Pullback distribution'})).toBeInTheDocument();
  const volume = JSON.parse(charts[1].getAttribute('data-series'));
  expect(volume[0].data.reduce((sum, n) => sum + (n || 0), 0)).toBe(fixture.summary.hits);
  expect(volume[1].data.reduce((sum, n) => sum + (n || 0), 0)).toBe(fixture.summary.missed);
});
it('uses empty states rather than invented chart values when there are no measurements', () => {
  render(<MonthlyCharts report={{...fixture, days: [], targets: [], timing: {...fixture.timing, samples: 0}}} />);
  expect(screen.queryByTestId('monthly-chart')).not.toBeInTheDocument();
  expect(screen.getAllByText('No measured results available for this graph yet.')).toHaveLength(4);
});
